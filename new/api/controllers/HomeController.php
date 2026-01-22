<?php

require_once __DIR__ . '/../config/database.php';

class HomeController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Get homepage data (featured properties and videos)
     * @return array Homepage data including properties and videos
     */
    public function getHomeData() {
        try {
            // Get featured properties
            $propertiesQuery = "SELECT 
                id, title, slug, description, price, 
                bedrooms, bathrooms, square_feet, 
                property_type, address, city, state, 
                featured_image
                FROM properties 
                WHERE status = 'active' AND featured = 1
                ORDER BY created_at DESC
                LIMIT 6";
            
            $propertiesResult = $this->conn->query($propertiesQuery);
            $properties = [];
            
            if ($propertiesResult && $propertiesResult->num_rows > 0) {
                while ($row = $propertiesResult->fetch_assoc()) {
                    // Get property images for each
                    $photosQuery = "SELECT 
                        id, image_url, thumbnail_url, caption
                        FROM photogallery 
                        WHERE property_id = ?
                        ORDER BY display_order ASC
                        LIMIT 1";
                    
                    $photosStmt = $this->conn->prepare($photosQuery);
                    $photosStmt->bind_param('i', $row['id']);
                    $photosStmt->execute();
                    $photosResult = $photosStmt->get_result();
                    $row['main_image'] = $photosResult->fetch_assoc();
                    $photosStmt->close();
                    
                    $properties[] = $row;
                }
            }

            // Get videos for homepage (first 5 by order)
            $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 5;
            $videosQuery = "SELECT 
                id, property_id, title, description, 
                video_url, video_type, thumbnail_url, thumbnail_alt,
                display_order
                FROM videos 
                WHERE is_home = 1 AND deleted_at IS NULL AND (property_id IS NULL OR property_id = 0)
                ORDER BY display_order ASC, created_at DESC
                LIMIT ?";
            
            $videosStmt = $this->conn->prepare($videosQuery);
            $videosStmt->bind_param('i', $limit);
            $videosStmt->execute();
            $videosResult = $videosStmt->get_result();
            $videos = [];
            
            if ($videosResult && $videosResult->num_rows > 0) {
                while ($row = $videosResult->fetch_assoc()) {
                    $videos[] = $row;
                }
            }
            $videosStmt->close();

            // Home blogs (is_home = 1)
            $blogLimit = isset($_GET['blog_limit']) ? max(1, (int)$_GET['blog_limit']) : 6;
            $blogsQuery = "SELECT id, title, slug, seoTitle, seoDescription, featured_image, featured_image_alt, content_image, content_image_alt, published_date 
                           FROM blogs 
                           WHERE is_home = 1 AND deleted_at IS NULL 
                           ORDER BY display_order ASC, published_date DESC, created_at DESC 
                           LIMIT ?";
            $blogsStmt = $this->conn->prepare($blogsQuery);
            $blogsStmt->bind_param('i', $blogLimit);
            $blogsStmt->execute();
            $blogsResult = $blogsStmt->get_result();
            $blogs = [];
            if ($blogsResult && $blogsResult->num_rows > 0) {
                while ($row = $blogsResult->fetch_assoc()) {
                    $blogs[] = $row;
                }
            }
            $blogsStmt->close();

            // Home testimonials (is_home = 1)
            $testLimit = isset($_GET['testimonial_limit']) ? max(1, (int)$_GET['testimonial_limit']) : 6;
            $testQuery = "SELECT id, author, content, testimonial_date, display_order 
                          FROM testimonials 
                          WHERE is_home = 1 
                          ORDER BY display_order ASC, testimonial_date DESC, created_at DESC 
                          LIMIT ?";
            $testStmt = $this->conn->prepare($testQuery);
            $testStmt->bind_param('i', $testLimit);
            $testStmt->execute();
            $testResult = $testStmt->get_result();
            $testimonials = [];
            if ($testResult && $testResult->num_rows > 0) {
                while ($row = $testResult->fetch_assoc()) {
                    $testimonials[] = $row;
                }
            }
            $testStmt->close();

            return [
                'success' => true,
                'data' => [
                    'featured_properties' => $properties,
                    'featured_videos' => $videos,
                    'home_blogs' => $blogs,
                    'home_testimonials' => $testimonials
                ]
            ];

        } catch(Exception $e) {
            http_response_code(500);
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get all featured videos
     * @return array List of featured videos
     */
    public function getFeaturedVideos() {
        try {
            $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 5;
            $query = "SELECT 
                id, property_id, title, description, 
                video_url, video_type, thumbnail_url, thumbnail_alt,
                display_order
                FROM videos
                WHERE is_home = 1 AND deleted_at IS NULL AND (property_id IS NULL OR property_id = 0)
                ORDER BY display_order ASC, created_at DESC
                LIMIT ?";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('i', $limit);
            $stmt->execute();
            $result = $stmt->get_result();
            $videos = [];
            
            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $videos[] = $row;
                }
            }
            $stmt->close();

            return [
                'success' => true,
                'data' => [
                    'videos' => $videos,
                    'total' => count($videos)
                ]
            ];

        } catch(Exception $e) {
            http_response_code(500);
            return [
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage()
            ];
        }
    }
}
