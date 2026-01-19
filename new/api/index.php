<?php

// Load environment variables FIRST
if (file_exists(__DIR__ . '/load-env.php')) {
    require_once __DIR__ . '/load-env.php';
}

header('Content-Type: application/json');

// CORS headers are set in Apache config (apache-config.conf)
// to avoid duplication and conflicts

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 1); // ← MOSTRA ERRORI (solo per debug!)
ini_set('log_errors', 1);

// Autoload controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/PropertyController.php';
require_once __DIR__ . '/controllers/UploadController.php';
require_once __DIR__ . '/controllers/HomeController.php';
require_once __DIR__ . '/controllers/BlogController.php';
require_once __DIR__ . '/controllers/PhotoGalleryController.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Rimuovi /new/api o /api dal path
$path = preg_replace('#^/new/api#', '', $path);
$path = preg_replace('#^/api#', '', $path);

// Rimuovi /index.php se presente (quando .htaccess reindirizza)
$path = str_replace('/index.php', '', $path);

$path = trim($path, '/');
$segments = explode('/', $path);

// Se segments è vuoto o contiene solo stringhe vuote, è la root
if (empty($segments) || (count($segments) === 1 && empty($segments[0]))) {
    $segments = [''];
}

// Route requests
try {
    switch ($segments[0]) {
        case 'auth':
            handleAuthRoutes($segments, $method);
            break;
        
        case 'properties':
            handlePropertyRoutes($segments, $method);
            break;
        
        case 'upload':
            handleUploadRoutes($segments, $method);
            break;
        
        case 'home':
            handleHomeRoutes($segments, $method);
            break;
        
        case 'blogs':
            handleBlogRoutes($segments, $method);
            break;
        
        case 'photogallery':
            handlePhotoGalleryRoutes($segments, $method);
            break;
        
        case 'health':
            echo json_encode([
                'success' => true,
                'message' => 'API is running',
                'timestamp' => time()
            ]);
            break;
        
        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => 'Endpoint not found'
            ]);
            break;
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error'
    ]);
}

/**
 * Handle authentication routes
 */
function handleAuthRoutes($segments, $method) {
    $controller = new AuthController();
    
    if ($method === 'POST' && isset($segments[1])) {
        switch ($segments[1]) {
            case 'login':
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->login($data['email'] ?? '', $data['password'] ?? '');
                echo json_encode($result);
                break;
            
            case 'logout':
                $auth = new AuthMiddleware();
                $user = $auth->authenticate();
                if ($user) {
                    $headers = getallheaders();
                    $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
                    $result = $controller->logout($token);
                    echo json_encode($result);
                }
                break;
            
            case 'verify':
                $headers = getallheaders();
                $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');
                $result = $controller->verifyToken($token);
                echo json_encode($result);
                break;
            
            default:
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Auth endpoint not found']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}

/**
 * Handle property routes
 */
function handlePropertyRoutes($segments, $method) {
    $auth = new AuthMiddleware();
    $controller = new PropertyController();
    
    switch ($method) {
        case 'GET':
            // Public endpoint - no auth required for listing
            if (isset($segments[1]) && is_numeric($segments[1])) {
                $result = $controller->getById($segments[1]);
            } else {
                $filters = $_GET;
                $result = $controller->getAll($filters);
            }
            echo json_encode($result);
            break;
        
        case 'POST':
            $user = $auth->authenticate();
            if ($user && $auth->checkRole($user, ['admin', 'editor'])) {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->create($data, $user['user_id']);
                echo json_encode($result);
            }
            break;
        
        case 'PUT':
            $user = $auth->authenticate();
            if ($user && $auth->checkRole($user, ['admin', 'editor']) && isset($segments[1])) {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->update($segments[1], $data, $user['user_id']);
                echo json_encode($result);
            }
            break;
        
        case 'DELETE':
            $user = $auth->authenticate();
            if ($user && $auth->checkRole($user, ['admin']) && isset($segments[1])) {
                $result = $controller->delete($segments[1], $user['user_id']);
                echo json_encode($result);
            }
            break;
        
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}

/**
 * Handle upload routes
 */
function handleUploadRoutes($segments, $method) {
    $auth = new AuthMiddleware();
    $user = $auth->authenticate();
    
    if (!$user || !$auth->checkRole($user, ['admin', 'editor'])) {
        return;
    }
    
    $controller = new UploadController();
    
    if ($method === 'POST' && isset($segments[1])) {
        switch ($segments[1]) {
            case 'property-image':
                $result = $controller->uploadPropertyImage($_FILES['image'] ?? null);
                echo json_encode($result);
                break;
            
            case 'video':
                $result = $controller->uploadVideo($_FILES['video'] ?? null);
                echo json_encode($result);
                break;
            
            case 'blog-image':
                $result = $controller->uploadBlogImage($_FILES['image'] ?? null);
                echo json_encode($result);
                break;
            
            default:
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Upload endpoint not found']);
        }
    } elseif ($method === 'DELETE' && isset($segments[1]) && $segments[1] === 'file') {
        // DELETE /api/upload/file?url=/uploads/blogs/image.jpg
        $url = $_GET['url'] ?? '';
        $result = $controller->deleteFile($url);
        echo json_encode($result);
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}

/**
 * Handle home routes (public, no auth)
 */
function handleHomeRoutes($segments, $method) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }
    
    $controller = new HomeController();
    
    if (empty($segments[1])) {
        // GET /api/home - Get all homepage data
        $result = $controller->getHomeData();
        echo json_encode($result);
    } elseif ($segments[1] === 'videos') {
        // GET /api/home/videos - Get featured videos only
        $result = $controller->getFeaturedVideos();
        echo json_encode($result);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Home endpoint not found']);
    }
}

/**
 * Handle blog routes
 */
function handleBlogRoutes($segments, $method) {
    $controller = new BlogController();
    
    // Public routes (no auth)
    if ($method === 'GET' && empty($segments[1])) {
        // GET /api/blogs - Get all blogs
        $filters = $_GET;
        $result = $controller->getAll($filters);
        echo json_encode($result);
        return;
    }
    
    if ($method === 'GET' && !empty($segments[1])) {
        // GET /api/blogs/slug/:slug or /api/blogs/:id
        if ($segments[1] === 'slug' && !empty($segments[2])) {
            // GET /api/blogs/slug/:slug
            $result = $controller->getBySlug($segments[2]);
            echo json_encode($result);
            return;
        } elseif (empty($segments[2])) {
            // GET /api/blogs/:id
            $result = $controller->getById($segments[1]);
            echo json_encode($result);
            return;
        }
    }
    
    // Protected routes (require auth)
    $auth = new AuthMiddleware();
    $user = $auth->verifyToken();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        return;
    }
    
    switch ($method) {
        case 'POST':
            // POST /api/blogs - Create new blog
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->create($data, $user['user_id']);
            echo json_encode($result);
            break;
            
        case 'PUT':
            // PUT /api/blogs/:id - Update blog
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Blog ID required']);
                return;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->update($segments[1], $data, $user['user_id']);
            echo json_encode($result);
            break;
            
        case 'DELETE':
            // DELETE /api/blogs/:id - Delete blog
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Blog ID required']);
                return;
            }
            $result = $controller->delete($segments[1], $user['user_id']);
            echo json_encode($result);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}

/**
 * Handle photogallery routes
 */
function handlePhotoGalleryRoutes($segments, $method) {
    $controller = new PhotoGalleryController();
    
    // Public route - get photos for a property
    if ($method === 'GET' && !empty($segments[1]) && $segments[1] === 'property' && !empty($segments[2])) {
        // GET /api/photogallery/property/:propertyId
        $result = $controller->getByPropertyId($segments[2]);
        echo json_encode($result);
        return;
    }
    
    // Protected routes - require authentication
    $auth = new AuthMiddleware();
    $user = $auth->authenticate();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        return;
    }
    
    switch ($method) {
        case 'GET':
            if (!empty($segments[1]) && is_numeric($segments[1])) {
                // GET /api/photogallery/:id - Get single photo
                $result = $controller->getById($segments[1]);
                echo json_encode($result);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid request']);
            }
            break;
            
        case 'POST':
            if (!empty($segments[1]) && $segments[1] === 'reorder') {
                // POST /api/photogallery/reorder - Update display order
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->updateOrder($data['orders'] ?? []);
                echo json_encode($result);
            } else {
                // POST /api/photogallery - Create new photo
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->create($data);
                echo json_encode($result);
            }
            break;
            
        case 'PUT':
            // PUT /api/photogallery/:id - Update photo
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Photo ID required']);
                return;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->update($segments[1], $data);
            echo json_encode($result);
            break;
            
        case 'DELETE':
            // DELETE /api/photogallery/:id - Delete photo
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Photo ID required']);
                return;
            }
            $result = $controller->delete($segments[1]);
            echo json_encode($result);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}
