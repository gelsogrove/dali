<?php

require_once __DIR__ . '/../config/database.php';
$__baseDir = rtrim(__DIR__, "/\\ \t\n\r\0\x0B");
$__redirectPath = realpath($__baseDir . '/../lib/RedirectService.php') ?: ($__baseDir . '/../lib/RedirectService.php');
require_once $__redirectPath;
$__sitemapPath = realpath($__baseDir . '/../lib/SitemapService.php') ?: ($__baseDir . '/../lib/SitemapService.php');
require_once $__sitemapPath;
require_once __DIR__ . '/UploadController.php';

class CityController {
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
                $where[] = "deleted_at IS NULL";
            }

            if (isset($filters['is_home'])) {
                $where[] = "is_home = ?";
                $params[] = ($filters['is_home'] === 'true' || $filters['is_home'] === '1') ? 1 : 0;
                $types .= 'i';
            }

            if (!empty($filters['q'])) {
                $where[] = "(title LIKE ? OR subtitle LIKE ? OR seoTitle LIKE ?)";
                $searchTerm = '%' . $filters['q'] . '%';
                array_push($params, $searchTerm, $searchTerm, $searchTerm);
                $types .= 'sss';
            }

            $whereClause = empty($where) ? '1=1' : implode(' AND ', $where);
            $query = "SELECT * FROM cities WHERE $whereClause ORDER BY display_order ASC, created_at DESC";

            $result = empty($params)
                ? $this->conn->query($query)
                : $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to fetch cities');
            }

            $items = [];
            while ($row = $result->fetch_assoc()) {
                $items[] = $this->formatCity($row);
            }

            return $this->successResponse(['cities' => $items]);
        } catch (Exception $e) {
            error_log("Error fetching cities: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    public function getById($id) {
        try {
            $query = "SELECT * FROM cities WHERE id = ? AND deleted_at IS NULL LIMIT 1";
            $result = $this->db->executePrepared($query, [$id], 'i');
            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('City not found', 404);
            }
            $city = $result->fetch_assoc();
            return $this->successResponse($this->formatCity($city));
        } catch (Exception $e) {
            error_log("Error fetching city: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    public function getBySlug($slug) {
        try {
            $query = "SELECT * FROM cities WHERE slug = ? AND deleted_at IS NULL LIMIT 1";
            $result = $this->db->executePrepared($query, [$slug], 's');
            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('City not found', 404);
            }
            $city = $result->fetch_assoc();
            return $this->successResponse($this->formatCity($city));
        } catch (Exception $e) {
            error_log("Error fetching city: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    public function create($data, $userId) {
        try {
            if (empty($data['title']) || empty($data['slug'])) {
                return $this->errorResponse('Title and slug are required', 400);
            }

            $slug = $this->slugify($data['slug']);
            $check = $this->db->executePrepared("SELECT id FROM cities WHERE slug = ? LIMIT 1", [$slug], 's');
            if ($check && $check->num_rows > 0) {
                return $this->errorResponse('Slug already exists', 400);
            }

            if (!empty($data['cover_image']) && empty($data['cover_image_alt'])) {
                return $this->errorResponse("Cover image alt is required", 400);
            }
            if (!empty($data['content_image']) && empty($data['content_image_alt'])) {
                return $this->errorResponse("Content image alt is required", 400);
            }

            $allowedFields = [
                'title','subtitle','slug','cover_image','cover_image_alt','content_image','content_image_alt',
                'fullContent','seoTitle','seoDescription','ogTitle','ogDescription','ogImage',
                'keywords','canonicalUrl','is_home','display_order'
            ];

            $columns = [];
            $placeholders = [];
            $params = [];
            $types = '';

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $columns[] = $field;
                    $placeholders[] = '?';
                    $params[] = $data[$field];
                    $types .= $this->getParamType($field);
                }
            }

            $columns[] = 'created_by';
            $placeholders[] = '?';
            $params[] = $userId;
            $types .= 'i';

            $query = "INSERT INTO cities (" . implode(',', $columns) . ") VALUES (" . implode(',', $placeholders) . ")";
            $result = $this->db->executePrepared($query, $params, $types);
            if (!$result) {
                return $this->errorResponse('Failed to create city');
            }

            $cityId = $this->db->getLastInsertId();
            $this->logActivity($userId, 'create', 'city', $cityId, "Created city: {$data['title']}");
            $this->sitemapService->generateSitemap();

            return $this->successResponse(['id' => $cityId, 'slug' => $slug, 'message' => 'City created successfully'], 201);
        } catch (Exception $e) {
            error_log("Error creating city: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    public function update($id, $data, $userId) {
        try {
            $check = $this->db->executePrepared("SELECT * FROM cities WHERE id = ? AND deleted_at IS NULL LIMIT 1", [$id], 'i');
            if (!$check || $check->num_rows === 0) {
                return $this->errorResponse('City not found', 404);
            }

            if (isset($data['cover_image']) && !empty($data['cover_image']) && empty($data['cover_image_alt'])) {
                return $this->errorResponse("Cover image alt is required", 400);
            }
            if (isset($data['content_image']) && !empty($data['content_image']) && empty($data['content_image_alt'])) {
                return $this->errorResponse("Content image alt is required", 400);
            }

            $allowedFields = [
                'title','subtitle','seoTitle','seoDescription','ogTitle','ogDescription','ogImage','keywords','canonicalUrl',
                'cover_image','cover_image_alt','content_image','content_image_alt','fullContent','is_home','display_order'
            ];
            $updates = [];
            $params = [];
            $types = '';

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
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

            $query = "UPDATE cities SET " . implode(', ', $updates) . " WHERE id = ?";
            $result = $this->db->executePrepared($query, $params, $types);
            if (!$result) {
                return $this->errorResponse('Failed to update city');
            }

            $this->logActivity($userId, 'update', 'city', $id, "Updated city ID: $id");
            $this->sitemapService->generateSitemap();
            return $this->successResponse(['message' => 'City updated successfully']);
        } catch (Exception $e) {
            error_log("Error updating city: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    public function reorder($orders = [], $userId = null) {
        try {
            if (empty($orders)) {
                return $this->errorResponse('No items to reorder', 400);
            }

            $stmt = $this->conn->prepare("UPDATE cities SET display_order = ? WHERE id = ?");
            foreach ($orders as $item) {
                $orderVal = (int)($item['display_order'] ?? 0);
                $idVal = (int)($item['id'] ?? 0);
                $stmt->bind_param('ii', $orderVal, $idVal);
                $stmt->execute();
            }
            $stmt->close();

            if ($userId) {
                $this->logActivity($userId, 'reorder', 'city', null, 'Reordered cities');
            }
            $this->sitemapService->generateSitemap();
            return $this->successResponse(['message' => 'Order updated']);
        } catch (Exception $e) {
            error_log("Error reordering cities: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    public function delete($id, $userId) {
        try {
            $fetch = $this->db->executePrepared(
                "SELECT slug, cover_image, content_image, created_at, deleted_at FROM cities WHERE id = ? LIMIT 1",
                [$id],
                'i'
            );
            if (!$fetch || $fetch->num_rows === 0) {
                return $this->errorResponse('City not found', 404);
            }
            $city = $fetch->fetch_assoc();

            if (!empty($city['deleted_at'])) {
                $urlOld = '/community/' . $city['slug'];
                try {
                    $existing = $this->redirectService->findByUrlOld($urlOld);
                    if (!$existing) {
                        $this->redirectService->create($urlOld, '');
                    }
                } catch (Exception $ex) {
                    return $this->errorResponse('Redirect creation failed: ' . $ex->getMessage());
                }

                $result = $this->db->executePrepared("DELETE FROM cities WHERE id = ?", [$id], 'i');
                if (!$result) {
                    return $this->errorResponse('Failed to delete city');
                }

                $uploader = new UploadController();
                if (!empty($city['cover_image'])) $uploader->deleteFile($city['cover_image']);
                if (!empty($city['content_image'])) $uploader->deleteFile($city['content_image']);

                $this->logActivity($userId, 'delete', 'city', $id, "Deleted archived city ID: $id");
                $this->sitemapService->generateSitemap();
                return $this->successResponse(['message' => 'City deleted (was already archived); redirect placeholder kept/ensured']);
            }

            $createdAt = new DateTime($city['created_at']);
            $now = new DateTime();
            $hoursDiff = ($now->getTimestamp() - $createdAt->getTimestamp()) / 3600;

            if ($hoursDiff < 24) {
                $result = $this->db->executePrepared("DELETE FROM cities WHERE id = ?", [$id], 'i');
                if (!$result) {
                    return $this->errorResponse('Failed to delete city');
                }
                $uploader = new UploadController();
                if (!empty($city['cover_image'])) $uploader->deleteFile($city['cover_image']);
                if (!empty($city['content_image'])) $uploader->deleteFile($city['content_image']);

                $this->logActivity($userId, 'delete', 'city', $id, "Deleted city ID: $id");
                $this->sitemapService->generateSitemap();
                return $this->successResponse(['message' => 'City deleted permanently (created < 24h)']);
            }

            // Soft delete + placeholder redirect
            $this->db->executePrepared("UPDATE cities SET deleted_at = NOW() WHERE id = ?", [$id], 'i');
            $urlOld = '/community/' . $city['slug'];
            try {
                $existing = $this->redirectService->findByUrlOld($urlOld);
                if (!$existing) {
                    $this->redirectService->create($urlOld, '');
                }
            } catch (Exception $ex) {
                $this->conn->query("UPDATE cities SET deleted_at = NULL WHERE id = " . (int)$id);
                return $this->errorResponse('Redirect creation failed: ' . $ex->getMessage());
            }

            $this->logActivity($userId, 'archive', 'city', $id, "Archived city ID: $id and created redirect placeholder");
            $this->sitemapService->generateSitemap();
            return $this->successResponse([
                'message' => 'City archived for SEO. A redirect entry was created with empty urlNew; please set the destination.'
            ]);
        } catch (Exception $e) {
            error_log("Error deleting city: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    private function formatCity($row) {
        return [
            'id' => (int)$row['id'],
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
        $intFields = ['is_home','display_order'];
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
