<?php

require_once __DIR__ . '/../config/database.php';
$__baseDir = rtrim(__DIR__, "/\\ \t\n\r\0\x0B");
$__redirectPath = realpath($__baseDir . '/../lib/RedirectService.php') ?: ($__baseDir . '/../lib/RedirectService.php');
require_once $__redirectPath;
$__sitemapPath = realpath($__baseDir . '/../lib/SitemapService.php') ?: ($__baseDir . '/../lib/SitemapService.php');
require_once $__sitemapPath;
require_once __DIR__ . '/UploadController.php';

class AreaController {
    private $db;
    private $conn;
    private $redirectService;
    private $sitemapService;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->redirectService = new RedirectService($this->conn);
        $this->sitemapService = new SitemapService($this->conn);
    }

    public function getAll($filters = []) {
        try {
            $where = [];
            $params = [];
            $types = '';

            $includeDeleted = $filters['include_deleted'] ?? null;
            $includeDeletedFlag = $includeDeleted === '1' || $includeDeleted === 'true' || $includeDeleted === 1 || $includeDeleted === true;
            if (!$includeDeletedFlag) {
                $where[] = "a.deleted_at IS NULL";
            }

            if (isset($filters['is_home'])) {
                $where[] = "a.is_home = ?";
                $params[] = ($filters['is_home'] === 'true' || $filters['is_home'] === '1') ? 1 : 0;
                $types .= 'i';
            }

            if (!empty($filters['city_id'])) {
                $where[] = "a.city_id = ?";
                $params[] = (int)$filters['city_id'];
                $types .= 'i';
            }

            if (!empty($filters['q'])) {
                $where[] = "(a.title LIKE ? OR a.subtitle LIKE ? OR a.seoTitle LIKE ?)";
                $searchTerm = '%' . $filters['q'] . '%';
                array_push($params, $searchTerm, $searchTerm, $searchTerm);
                $types .= 'sss';
            }

            $whereClause = empty($where) ? '1=1' : implode(' AND ', $where);
            $query = "SELECT a.*, c.slug AS city_slug FROM areas a JOIN cities c ON a.city_id = c.id WHERE $whereClause ORDER BY a.display_order ASC, a.created_at DESC";

            $result = empty($params)
                ? $this->conn->query($query)
                : $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to fetch areas');
            }

            $items = [];
            while ($row = $result->fetch_assoc()) {
                $items[] = $this->formatArea($row);
            }

            return $this->successResponse(['areas' => $items]);
        } catch (Exception $e) {
            error_log("Error fetching areas: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    public function getById($id) {
        try {
            $query = "SELECT a.*, c.slug AS city_slug FROM areas a JOIN cities c ON a.city_id = c.id WHERE a.id = ? AND a.deleted_at IS NULL LIMIT 1";
            $result = $this->db->executePrepared($query, [$id], 'i');
            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Area not found', 404);
            }
            $area = $result->fetch_assoc();
            return $this->successResponse($this->formatArea($area));
        } catch (Exception $e) {
            error_log("Error fetching area: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    public function getBySlug($citySlug, $areaSlug) {
        try {
            $query = "SELECT a.*, c.slug AS city_slug 
                      FROM areas a 
                      JOIN cities c ON a.city_id = c.id 
                      WHERE a.slug = ? AND c.slug = ? AND a.deleted_at IS NULL AND c.deleted_at IS NULL 
                      LIMIT 1";
            $result = $this->db->executePrepared($query, [$areaSlug, $citySlug], 'ss');
            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Area not found', 404);
            }
            $area = $result->fetch_assoc();
            return $this->successResponse($this->formatArea($area));
        } catch (Exception $e) {
            error_log("Error fetching area by slug: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    public function create($data, $userId) {
        try {
            if (empty($data['title']) || empty($data['slug']) || empty($data['city_id'])) {
                return $this->errorResponse('Title, slug and city are required', 400);
            }

            $slug = $this->slugify($data['slug']);
            $cityId = (int)$data['city_id'];

            $check = $this->db->executePrepared(
                "SELECT id FROM areas WHERE slug = ? AND city_id = ? LIMIT 1",
                [$slug, $cityId],
                'si'
            );
            if ($check && $check->num_rows > 0) {
                return $this->errorResponse('Slug already exists for this city', 400);
            }

            if (!empty($data['cover_image']) && empty($data['cover_image_alt'])) {
                return $this->errorResponse("Cover image alt is required", 400);
            }
            if (!empty($data['content_image']) && empty($data['content_image_alt'])) {
                return $this->errorResponse("Content image alt is required", 400);
            }

            $allowedFields = [
                'city_id','title','subtitle','slug','cover_image','cover_image_alt','content_image','content_image_alt',
                'fullContent','seoTitle','seoDescription','ogTitle','ogDescription','ogImage','keywords','canonicalUrl',
                'is_home','display_order'
            ];

            $columns = [];
            $placeholders = [];
            $params = [];
            $types = '';

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $columns[] = $field;
                    $placeholders[] = '?';
                    $params[] = $field === 'city_id' ? (int)$data[$field] : $data[$field];
                    $types .= $this->getParamType($field);
                }
            }

            $columns[] = 'created_by';
            $placeholders[] = '?';
            $params[] = $userId;
            $types .= 'i';

            $query = "INSERT INTO areas (" . implode(',', $columns) . ") VALUES (" . implode(',', $placeholders) . ")";
            $result = $this->db->executePrepared($query, $params, $types);
            if (!$result) {
                return $this->errorResponse('Failed to create area');
            }

            $areaId = $this->db->getLastInsertId();
            $this->logActivity($userId, 'create', 'area', $areaId, "Created area: {$data['title']}");
            $this->sitemapService->generateSitemap();

            return $this->successResponse(['id' => $areaId, 'slug' => $slug, 'message' => 'Area created successfully'], 201);
        } catch (Exception $e) {
            error_log("Error creating area: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    public function update($id, $data, $userId) {
        try {
            $check = $this->db->executePrepared("SELECT * FROM areas WHERE id = ? AND deleted_at IS NULL LIMIT 1", [$id], 'i');
            if (!$check || $check->num_rows === 0) {
                return $this->errorResponse('Area not found', 404);
            }

            if (isset($data['cover_image']) && !empty($data['cover_image']) && empty($data['cover_image_alt'])) {
                return $this->errorResponse("Cover image alt is required", 400);
            }
            if (isset($data['content_image']) && !empty($data['content_image']) && empty($data['content_image_alt'])) {
                return $this->errorResponse("Content image alt is required", 400);
            }

            $allowedFields = [
                'city_id','title','subtitle','seoTitle','seoDescription','ogTitle','ogDescription','ogImage','keywords','canonicalUrl',
                'cover_image','cover_image_alt','content_image','content_image_alt','fullContent','is_home','display_order'
            ];
            $updates = [];
            $params = [];
            $types = '';

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $field === 'city_id' ? (int)$data[$field] : $data[$field];
                    $types .= $this->getParamType($field);
                }
            }

            if (!empty($data['slug'])) {
                $slug = $this->slugify($data['slug']);
                $updates[] = "slug = ?";
                $params[] = $slug;
                $types .= 's';
            }

            if (empty($updates)) {
                return $this->errorResponse('No valid fields to update', 400);
            }

            $params[] = $id;
            $types .= 'i';

            $query = "UPDATE areas SET " . implode(', ', $updates) . " WHERE id = ?";
            $result = $this->db->executePrepared($query, $params, $types);
            if (!$result) {
                return $this->errorResponse('Failed to update area');
            }

            $this->logActivity($userId, 'update', 'area', $id, "Updated area ID: $id");
            $this->sitemapService->generateSitemap();
            return $this->successResponse(['message' => 'Area updated successfully']);
        } catch (Exception $e) {
            error_log("Error updating area: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    public function reorder($orders = [], $userId = null) {
        try {
            if (empty($orders)) {
                return $this->errorResponse('No items to reorder', 400);
            }

            $stmt = $this->conn->prepare("UPDATE areas SET display_order = ? WHERE id = ?");
            foreach ($orders as $item) {
                $orderVal = (int)($item['display_order'] ?? 0);
                $idVal = (int)($item['id'] ?? 0);
                $stmt->bind_param('ii', $orderVal, $idVal);
                $stmt->execute();
            }
            $stmt->close();

            if ($userId) {
                $this->logActivity($userId, 'reorder', 'area', null, 'Reordered areas');
            }
            $this->sitemapService->generateSitemap();
            return $this->successResponse(['message' => 'Order updated']);
        } catch (Exception $e) {
            error_log("Error reordering areas: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    public function delete($id, $userId) {
        try {
            $fetch = $this->db->executePrepared(
                "SELECT a.slug, a.cover_image, a.content_image, a.created_at, a.deleted_at, c.slug as city_slug 
                 FROM areas a JOIN cities c ON a.city_id = c.id 
                 WHERE a.id = ? LIMIT 1",
                [$id],
                'i'
            );
            if (!$fetch || $fetch->num_rows === 0) {
                return $this->errorResponse('Area not found', 404);
            }
            $area = $fetch->fetch_assoc();

            $urlOld = '/community/' . $area['city_slug'] . '/' . $area['slug'];

            if (!empty($area['deleted_at'])) {
                try {
                    $existing = $this->redirectService->findByUrlOld($urlOld);
                    if (!$existing) {
                        $this->redirectService->create($urlOld, '');
                    }
                } catch (Exception $ex) {
                    return $this->errorResponse('Redirect creation failed: ' . $ex->getMessage());
                }

                $result = $this->db->executePrepared("DELETE FROM areas WHERE id = ?", [$id], 'i');
                if (!$result) {
                    return $this->errorResponse('Failed to delete area');
                }

                $uploader = new UploadController();
                if (!empty($area['cover_image'])) $uploader->deleteFile($area['cover_image']);
                if (!empty($area['content_image'])) $uploader->deleteFile($area['content_image']);

                $this->logActivity($userId, 'delete', 'area', $id, "Deleted archived area ID: $id");
                $this->sitemapService->generateSitemap();
                return $this->successResponse(['message' => 'Area deleted (was already archived); redirect placeholder kept/ensured']);
            }

            $createdAt = new DateTime($area['created_at']);
            $now = new DateTime();
            $hoursDiff = ($now->getTimestamp() - $createdAt->getTimestamp()) / 3600;

            if ($hoursDiff < 24) {
                $result = $this->db->executePrepared("DELETE FROM areas WHERE id = ?", [$id], 'i');
                if (!$result) {
                    return $this->errorResponse('Failed to delete area');
                }
                $uploader = new UploadController();
                if (!empty($area['cover_image'])) $uploader->deleteFile($area['cover_image']);
                if (!empty($area['content_image'])) $uploader->deleteFile($area['content_image']);

                $this->logActivity($userId, 'delete', 'area', $id, "Deleted area ID: $id");
                $this->sitemapService->generateSitemap();
                return $this->successResponse(['message' => 'Area deleted permanently (created < 24h)']);
            }

            $this->db->executePrepared("UPDATE areas SET deleted_at = NOW() WHERE id = ?", [$id], 'i');
            try {
                $existing = $this->redirectService->findByUrlOld($urlOld);
                if (!$existing) {
                    $this->redirectService->create($urlOld, '');
                }
            } catch (Exception $ex) {
                $this->conn->query("UPDATE areas SET deleted_at = NULL WHERE id = " . (int)$id);
                return $this->errorResponse('Redirect creation failed: ' . $ex->getMessage());
            }

            $this->logActivity($userId, 'archive', 'area', $id, "Archived area ID: $id and created redirect placeholder");
            $this->sitemapService->generateSitemap();
            return $this->successResponse([
                'message' => 'Area archived for SEO. A redirect entry was created with empty urlNew; please set the destination.'
            ]);
        } catch (Exception $e) {
            error_log("Error deleting area: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    private function formatArea($row) {
        return [
            'id' => (int)$row['id'],
            'city_id' => (int)$row['city_id'],
            'city_slug' => $row['city_slug'] ?? null,
            'title' => $row['title'],
            'subtitle' => $row['subtitle'],
            'slug' => $row['slug'],
            'cover_image' => $row['cover_image'],
            'cover_image_alt' => $row['cover_image_alt'],
            'content_image' => $row['content_image'],
            'content_image_alt' => $row['content_image_alt'],
            'fullContent' => $row['fullContent'],
            'seoTitle' => $row['seoTitle'],
            'seoDescription' => $row['seoDescription'],
            'ogTitle' => $row['ogTitle'],
            'ogDescription' => $row['ogDescription'],
            'ogImage' => $row['ogImage'],
            'keywords' => $row['keywords'],
            'canonicalUrl' => $row['canonicalUrl'],
            'is_home' => (int)$row['is_home'],
            'display_order' => (int)$row['display_order'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
            'deleted_at' => $row['deleted_at'] ?? null,
        ];
    }

    private function slugify($text) {
        $text = strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9]+/i', '-', $text);
        $text = trim($text, '-');
        return $text ?: uniqid();
    }

    private function getParamType($field) {
        $textFields = ['title','subtitle','slug','cover_image','cover_image_alt','content_image','content_image_alt','fullContent','seoTitle','seoDescription','ogTitle','ogDescription','ogImage','keywords','canonicalUrl'];
        $intFields = ['city_id','is_home','display_order'];
        if (in_array($field, $intFields)) return 'i';
        return 's';
    }

    private function successResponse($data, $code = 200) {
        http_response_code($code);
        return ['success' => true, 'data' => $data];
    }

    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        return ['success' => false, 'error' => $message];
    }

    private function logActivity($userId, $action, $entityType, $entityId, $details = '') {
        $stmt = $this->conn->prepare("INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param('issis', $userId, $action, $entityType, $entityId, $details);
        $stmt->execute();
        $stmt->close();
    }
}
