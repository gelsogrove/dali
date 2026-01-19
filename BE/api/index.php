<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Autoload controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/PropertyController.php';
require_once __DIR__ . '/controllers/UploadController.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$path = trim($path, '/');
$segments = explode('/', $path);

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
            
            default:
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Upload endpoint not found']);
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}
