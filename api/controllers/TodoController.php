<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/UploadController.php';

class TodoController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    public function list($filters = []) {
        $search = trim($filters['q'] ?? '');
        $status = $filters['status'] ?? '';
        $sql = "SELECT * FROM todo_items WHERE 1=1";
        $params = [];
        $types = '';

        if ($search !== '') {
            $sql .= " AND (title LIKE ? OR author LIKE ?)";
            $like = '%' . $search . '%';
            $params[] = $like; $params[] = $like; $types .= 'ss';
        }
        if ($status !== '') {
            $sql .= " AND status = ?";
            $params[] = $status; $types .= 's';
        }
        $sql .= " ORDER BY priority ASC, created_at DESC";

        $stmt = $this->db->executePrepared($sql, $params, $types);
        if (!$stmt) {
            return $this->errorResponse('Database error (list)', 500);
        }
        $items = [];
        while ($row = $stmt->fetch_assoc()) {
            $row['attachments'] = $this->getAttachments($row['id']);
            $row['comments'] = $this->getComments($row['id']);
            $items[] = $row;
        }
        return $this->successResponse(['items' => $items]);
    }

    public function create($data) {
        if (!$this->tableExists('todo_items')) {
            return $this->errorResponse('Todo tables missing. Run migration 023_create_todos.sql', 500);
        }
        $title = trim($data['title'] ?? '');
        $author = trim($data['author'] ?? '');
        $description = $data['description'] ?? '';
        if ($title === '' || $author === '') {
            return $this->errorResponse('Title and author are required', 400);
        }

        // Try new schema (with status/priority); fallback to old schema if missing
        $priority = (int)($data['priority'] ?? 0);
        $stmt = $this->conn->prepare("INSERT INTO todo_items (title, description, author, status, priority) VALUES (?, ?, ?, 'todo', ?)");
        if ($stmt) {
            $stmt->bind_param('sssi', $title, $description, $author, $priority);
        } else {
            // Fallback for older schema without status/priority
            error_log('TodoController::create prepare failed (new schema): ' . $this->conn->error);
            $stmt = $this->conn->prepare("INSERT INTO todo_items (title, description, author) VALUES (?, ?, ?)");
            if (!$stmt) {
                error_log('TodoController::create prepare failed (fallback): ' . $this->conn->error);
                return $this->errorResponse('Database error (insert). Check migration 023_create_todos.sql', 500);
            }
            $stmt->bind_param('sss', $title, $description, $author);
        }

        if (!$stmt->execute()) {
            error_log('TodoController::create execute failed: ' . $this->conn->error);
            return $this->errorResponse('Database error (insert). Check todo_items schema/migrations.', 500);
        }

        $id = $stmt->insert_id;
        $stmt->close();

        return $this->successResponse(['id' => $id], 201);
    }

    public function update($id, $data) {
        $stmt = $this->conn->prepare("UPDATE todo_items SET title = ?, description = ?, author = ?, status = ?, priority = ? WHERE id = ?");
        if (!$stmt) return $this->errorResponse('Database error (update)', 500);
        $title = trim($data['title'] ?? '');
        $description = $data['description'] ?? '';
        $author = trim($data['author'] ?? '');
        $status = $data['status'] ?? 'todo';
        $priority = (int)($data['priority'] ?? 0);
        $stmt->bind_param('ssssii', $title, $description, $author, $status, $priority, $id);
        $stmt->execute();
        $stmt->close();
        return $this->successResponse(['message' => 'Updated']);
    }

    public function reorder($items) {
        $this->conn->begin_transaction();
        try {
            $stmt = $this->conn->prepare("UPDATE todo_items SET priority = ?, status = ? WHERE id = ?");
            foreach ($items as $item) {
                $p = (int)$item['priority'];
                $s = $item['status'] ?? 'todo';
                $id = (int)$item['id'];
                $allowedStatuses = ['todo','nicetohave','in_progress','test','done'];
                if (!in_array($s, $allowedStatuses, true)) {
                    $stmt->close();
                    $this->conn->rollback();
                    return $this->errorResponse('Invalid status: ' . $s, 400);
                }

                $stmt->bind_param('isi', $p, $s, $id);

                if (!$stmt->execute()) {
                    // Explicitly fail fast so the UI can surface the DB error (e.g. enum missing new status)
                    $err = $stmt->error ?: 'Unknown database error';
                    $stmt->close();
                    $this->conn->rollback();
                    return $this->errorResponse('Failed to reorder: ' . $err, 500);
                }

                // Detect silent enum truncation (when sql_mode not strict)
                if ($this->conn->warning_count > 0) {
                    $warnRes = $this->conn->query("SHOW WARNINGS");
                    $warnMsg = $warnRes && $warnRes->num_rows ? $warnRes->fetch_row()[2] : 'SQL warning';
                    if ($warnRes) $warnRes->close();
                    $stmt->close();
                    $this->conn->rollback();
                    return $this->errorResponse('Failed to reorder: ' . $warnMsg, 500);
                }
            }
            $stmt->close();
            $this->conn->commit();
            return $this->successResponse(['message' => 'Reordered']);
        } catch (Exception $e) {
            $this->conn->rollback();
            return $this->errorResponse('Failed to reorder', 500);
        }
    }

    public function delete($id) {
        // delete attachments files first
        $attachments = $this->getAttachments($id);
        $upload = new UploadController();
        foreach ($attachments as $att) {
            $upload->deleteFile($att['url']);
        }
        $stmt = $this->conn->prepare("DELETE FROM todo_items WHERE id = ?");
        if (!$stmt) return $this->errorResponse('Database error (delete)', 500);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $stmt->close();
        return $this->successResponse(['message' => 'Deleted']);
    }

    public function addComment($id, $data) {
        $author = trim($data['author'] ?? 'Anon');
        $content = trim($data['content'] ?? '');
        if ($content === '') return $this->errorResponse('Comment required', 400);
        $stmt = $this->conn->prepare("INSERT INTO todo_comments (todo_id, author, content) VALUES (?, ?, ?)");
        if (!$stmt) return $this->errorResponse('Database error (comment)', 500);
        $stmt->bind_param('iss', $id, $author, $content);
        $stmt->execute();
        $stmt->close();
        return $this->successResponse(['message' => 'Comment added']);
    }

    public function deleteComment($todoId, $commentId) {
        $stmt = $this->conn->prepare("DELETE FROM todo_comments WHERE id = ? AND todo_id = ?");
        if (!$stmt) return $this->errorResponse('Database error (delete comment)', 500);
        $stmt->bind_param('ii', $commentId, $todoId);
        $stmt->execute();
        $stmt->close();
        return $this->successResponse(['message' => 'Comment deleted']);
    }

    public function addAttachment($todoId, $data) {
        $stmt = $this->conn->prepare("INSERT INTO todo_attachments (todo_id, title, filename, url, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?)");
        if (!$stmt) return $this->errorResponse('Database error (attachment)', 500);
        $title = $data['title'] ?? ($data['filename'] ?? 'Attachment');
        $filename = $data['filename'] ?? '';
        $url = $data['url'] ?? '';
        $mime = $data['mime_type'] ?? null;
        $size = isset($data['size_bytes']) ? (int)$data['size_bytes'] : null;
        $stmt->bind_param('issssi', $todoId, $title, $filename, $url, $mime, $size);
        $stmt->execute();
        $stmt->close();
        return $this->successResponse(['message' => 'Attachment added']);
    }

    public function deleteAttachment($todoId, $attachmentId) {
        $stmt = $this->conn->prepare("SELECT url FROM todo_attachments WHERE id = ? AND todo_id = ?");
        if (!$stmt) return $this->errorResponse('Database error (attachment fetch)', 500);
        $stmt->bind_param('ii', $attachmentId, $todoId);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();
        $stmt->close();
        if ($row && !empty($row['url'])) {
            $upload = new UploadController();
            $upload->deleteFile($row['url']);
        }
        $del = $this->conn->prepare("DELETE FROM todo_attachments WHERE id = ? AND todo_id = ?");
        if (!$del) return $this->errorResponse('Database error (attachment delete)', 500);
        $del->bind_param('ii', $attachmentId, $todoId);
        $del->execute();
        $del->close();
        return $this->successResponse(['message' => 'Attachment deleted']);
    }

    private function getAttachments($todoId) {
        $stmt = $this->conn->prepare("SELECT * FROM todo_attachments WHERE todo_id = ? ORDER BY created_at ASC");
        if (!$stmt) return [];
        $stmt->bind_param('i', $todoId);
        $stmt->execute();
        $res = $stmt->get_result();
        $items = [];
        while ($row = $res->fetch_assoc()) $items[] = $row;
        $stmt->close();
        return $items;
    }

    private function getComments($todoId) {
        $stmt = $this->conn->prepare("SELECT * FROM todo_comments WHERE todo_id = ? ORDER BY created_at ASC");
        if (!$stmt) return [];
        $stmt->bind_param('i', $todoId);
        $stmt->execute();
        $res = $stmt->get_result();
        $items = [];
        while ($row = $res->fetch_assoc()) $items[] = $row;
        $stmt->close();
        return $items;
    }

    private function successResponse($data, $code = 200) {
        http_response_code($code);
        return ['success' => true, 'data' => $data];
    }

    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        return ['success' => false, 'error' => $message];
    }

    private function tableExists($table) {
        // More robust: check information_schema for current database
        $sql = "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            error_log('TodoController::tableExists prepare failed: ' . ($this->conn ? $this->conn->error : 'no connection'));
            return false;
        }
        $stmt->bind_param('s', $table);
        $stmt->execute();
        $res = $stmt->get_result();
        $exists = $res && $res->num_rows > 0;
        $stmt->close();
        return $exists;
    }
}
