<?php

require_once __DIR__ . '/../../config/database.php';

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

            // Get featured videos for homepage
            $videosQuery = "SELECT 
                id, property_id, title, description, 
                video_url, video_type, thumbnail_url, 
                display_order
                FROM videos 
                WHERE is_featured = 1
                ORDER BY display_order ASC";
            
            $videosResult = $this->conn->query($videosQuery);
            $videos = [];
            
            if ($videosResult && $videosResult->num_rows > 0) {
                while ($row = $videosResult->fetch_assoc()) {
                    // Get property info for each video
                    if ($row['property_id']) {
                        $propQuery = "SELECT id, title, slug, price, city 
                                      FROM properties 
                                      WHERE id = ?";
                        $propStmt = $this->conn->prepare($propQuery);
                        $propStmt->bind_param('i', $row['property_id']);
                        $propStmt->execute();
                        $propResult = $propStmt->get_result();
                        $row['property'] = $propResult->fetch_assoc();
                        $propStmt->close();
                    }
                    
                    $videos[] = $row;
                }
            }

            return [
                'success' => true,
                'data' => [
                    'featured_properties' => $properties,
                    'featured_videos' => $videos
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
            $query = "SELECT 
                v.id, v.property_id, v.title, v.description, 
                v.video_url, v.video_type, v.thumbnail_url, 
                v.display_order,
                p.title as property_title, p.slug as property_slug, 
                p.price, p.city
                FROM videos v
                LEFT JOIN properties p ON v.property_id = p.id
                WHERE v.is_featured = 1
                ORDER BY v.display_order ASC";
            
            $result = $this->conn->query($query);
            $videos = [];
            
            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $videos[] = $row;
                }
            }

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
