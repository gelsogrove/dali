<?php

$__baseDir = rtrim(__DIR__, "/\\ \t\n\r\0\x0B");
require_once $__baseDir . '/../config/database.php';
$__redirectPath = realpath($__baseDir . '/../lib/RedirectService.php') ?: ($__baseDir . '/../lib/RedirectService.php');
require_once $__redirectPath;

class RedirectController {
    private $db;
    private $conn;
    private $service;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->service = new RedirectService($this->conn);
    }

    public function getAll() {
        try {
            $rules = $this->service->getAllRules();
            return $this->successResponse(['redirects' => $rules]);
        } catch (Exception $e) {
            error_log("Error fetching redirects: " . $e->getMessage());
            return $this->errorResponse('Failed to fetch redirects');
        }
    }

    public function resolve($urlOld) {
        try {
            $rule = $this->service->findByUrlOld($urlOld);
            if (!$rule || empty($rule['urlNew'])) {
                // Return success:false with 200 status - not finding a redirect is normal
                return ['success' => false, 'message' => 'No redirect found'];
            }
            return $this->successResponse(['urlNew' => $rule['urlNew']]);
        } catch (Exception $e) {
            error_log("Error resolving redirect: " . $e->getMessage());
            return $this->errorResponse('Failed to resolve redirect');
        }
    }

    public function getById($id) {
        try {
            $stmt = $this->conn->prepare("SELECT id, url_old as urlOld, url_new as urlNew, redirect_type, is_active, hit_count, created_at, updated_at FROM redirects WHERE id = ? LIMIT 1");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $stmt->close();
            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Redirect not found', 404);
            }
            return $this->successResponse($result->fetch_assoc());
        } catch (Exception $e) {
            error_log("Error fetching redirect: " . $e->getMessage());
            return $this->errorResponse('Failed to fetch redirect');
        }
    }

    public function create($data, $userId) {
        try {
            $urlOld = $data['urlOld'] ?? $data['url_old'] ?? '';
            $urlNew = $data['urlNew'] ?? $data['url_new'] ?? '';
            $redirectType = (int)($data['redirect_type'] ?? 301);

            $id = $this->service->create($urlOld, $urlNew, $redirectType);
            $this->logActivity($userId, 'create', 'redirect', $id, "Created redirect $urlOld -> $urlNew");

            return $this->successResponse([
                'id' => $id,
                'message' => 'Redirect created'
            ], 201);
        } catch (Exception $e) {
            error_log("Error creating redirect: " . $e->getMessage());
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update($id, $data, $userId) {
        try {
            $urlOld = $data['urlOld'] ?? $data['url_old'] ?? '';
            $urlNew = $data['urlNew'] ?? $data['url_new'] ?? '';
            $redirectType = (int)($data['redirect_type'] ?? 301);

            $ok = $this->service->update((int)$id, $urlOld, $urlNew, $redirectType);
            if (!$ok) {
                return $this->errorResponse('Failed to update redirect');
            }

            $this->logActivity($userId, 'update', 'redirect', $id, "Updated redirect $urlOld -> $urlNew");
            return $this->successResponse(['message' => 'Redirect updated']);
        } catch (Exception $e) {
            error_log("Error updating redirect: " . $e->getMessage());
            return $this->errorResponse($e->getMessage());
        }
    }

    public function delete($id, $userId) {
        try {
            $ok = $this->service->delete((int)$id);
            if (!$ok) {
                return $this->errorResponse('Failed to delete redirect');
            }
            $this->logActivity($userId, 'delete', 'redirect', $id, "Deleted redirect #$id");
            return $this->successResponse(['message' => 'Redirect deleted']);
        } catch (Exception $e) {
            error_log("Error deleting redirect: " . $e->getMessage());
            return $this->errorResponse('Failed to delete redirect');
        }
    }

    private function logActivity($userId, $action, $entityType, $entityId, $description) {
        try {
            $query = "INSERT INTO activity_log (user_id, action, entity_type, entity_id, description) 
                     VALUES (?, ?, ?, ?, ?)";
            $this->db->executePrepared($query, [$userId, $action, $entityType, $entityId, $description], 'issis');
        } catch (Exception $e) {
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }

    private function successResponse($data, $code = 200) {
        http_response_code($code);
        return ['success' => true, 'data' => $data];
    }

    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        return ['success' => false, 'error' => $message];
    }
}
