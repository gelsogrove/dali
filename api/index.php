<?php

// Load environment variables FIRST
if (file_exists(__DIR__ . '/load-env.php')) {
    require_once __DIR__ . '/load-env.php';
}

// Basic CORS fallback (Apache config should ideally handle this)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Vary: Origin');

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
require_once __DIR__ . '/controllers/PropertyPhotoController.php';
require_once __DIR__ . '/controllers/UploadController.php';
require_once __DIR__ . '/controllers/HomeController.php';
require_once __DIR__ . '/controllers/BlogController.php';
require_once __DIR__ . '/controllers/PhotoGalleryController.php';
require_once __DIR__ . '/controllers/VideoController.php';
require_once __DIR__ . '/controllers/TestimonialController.php';
require_once __DIR__ . '/controllers/CityController.php';
require_once __DIR__ . '/controllers/AreaController.php';
require_once __DIR__ . '/controllers/ExchangeRateController.php';
require_once __DIR__ . '/controllers/ContactController.php';
require_once __DIR__ . '/controllers/AccessRequestController.php';
require_once __DIR__ . '/controllers/OffMarketInviteController.php';
require_once __DIR__ . '/controllers/TodoController.php';
require_once __DIR__ . '/controllers/BackupController.php';
// Normalize base dir to avoid trailing spaces/newlines in production paths
$__baseDir = rtrim(__DIR__, "/\\ \t\n\r\0\x0B");
require_once $__baseDir . '/config/database.php';
$__redirectPath = realpath($__baseDir . '/lib/RedirectService.php') ?: ($__baseDir . '/lib/RedirectService.php');
require_once $__redirectPath;
require_once __DIR__ . '/controllers/RedirectController.php';
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

        case 'property-photos':
            handlePropertyPhotoRoutes($segments, $method);
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

        case 'videos':
            handleVideoRoutes($segments, $method);
            break;

        case 'testimonials':
            handleTestimonialRoutes($segments, $method);
            break;

        case 'cities':
            handleCityRoutes($segments, $method);
            break;

        case 'areas':
            handleAreaRoutes($segments, $method);
            break;

        case 'exchange-rate':
            handleExchangeRateRoutes($segments, $method);
            break;

        case 'contact':
            handleContactRoutes($segments, $method);
            break;

        case 'redirects':
            handleRedirectRoutes($segments, $method);
            break;

        case 'photogallery':
            handlePhotoGalleryRoutes($segments, $method);
            break;

        case 'access-requests':
            handleAccessRequestRoutes($segments, $method);
            break;

        case 'off-market-invites':
            handleOffMarketInviteRoutes($segments, $method);
            break;

        case 'todos':
            handleTodoRoutes($segments, $method);
            break;

        case 'backups':
            handleBackupsRoutes($segments, $method);
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
function handleAuthRoutes($segments, $method)
{
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
function handlePropertyRoutes($segments, $method)
{
    $auth = new AuthMiddleware();
    $controller = new PropertyController();

    switch ($method) {
        case 'GET':
            // Special endpoints
            if (isset($segments[1])) {
                // GET /api/properties/tags - Get predefined tags
                if ($segments[1] === 'tags') {
                    $result = $controller->getPredefinedTags();
                    echo json_encode($result);
                    break;
                }

                // GET /api/properties/popular-tags - Get popular tags
                if ($segments[1] === 'popular-tags') {
                    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
                    $result = $controller->getPopularTags($limit);
                    echo json_encode($result);
                    break;
                }

                // GET /api/properties/:id/export-json - Export as JSON
                if (isset($segments[2]) && $segments[2] === 'export-json') {
                    $user = $auth->authenticate();
                    if ($user && $auth->checkRole($user, ['admin', 'editor'])) {
                        $result = $controller->exportAsJson($segments[1]);
                        echo json_encode($result);
                    }
                    break;
                }

                // GET /api/properties/:id/landing-pages - Get associated landing pages
                if (isset($segments[2]) && $segments[2] === 'landing-pages') {
                    $result = $controller->getPropertyLandingPages($segments[1]);
                    echo json_encode($result);
                    break;
                }

                // GET /api/properties/:id/attachments - Get attachments for property
                if (isset($segments[2]) && $segments[2] === 'attachments') {
                    $result = $controller->getPropertyAttachments($segments[1]);
                    echo json_encode($result);
                    break;
                }

                // GET /api/properties/:id or /api/properties/:slug - Get single property
                $token = $_GET['token'] ?? null;
                $result = $controller->getById($segments[1], $token);
                echo json_encode($result);
            } else {
                // GET /api/properties - Get all with filters
                $filters = $_GET;
                $result = $controller->getAll($filters);
                echo json_encode($result);
            }
            break;

        case 'POST':
            $user = $auth->authenticate();
            if (!$user || !$auth->checkRole($user, ['admin', 'editor'])) {
                break;
            }

            // POST /api/properties/reorder - Reorder properties
            if (isset($segments[1]) && $segments[1] === 'reorder') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->reorder($data['order'] ?? []);
                echo json_encode($result);
                break;
            }

            // POST /api/properties/import-json - Import from JSON
            if (isset($segments[1]) && $segments[1] === 'import-json') {
                $data = json_decode(file_get_contents('php://input'), true);
                $validateOnly = isset($_GET['validate_only']) && $_GET['validate_only'] === 'true';
                $result = $controller->importFromJson($data, $user['user_id'], $validateOnly);
                echo json_encode($result);
                break;
            }

            // POST /api/properties/:id/attachments - Add attachment metadata after upload
            if (isset($segments[1]) && isset($segments[2]) && $segments[2] === 'attachments') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->addPropertyAttachment($segments[1], $data, $user['user_id']);
                echo json_encode($result);
                break;
            }

            // POST /api/properties - Create new property
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->create($data, $user['user_id']);
            echo json_encode($result);
            break;

        case 'PUT':
            $user = $auth->authenticate();
            if ($user && $auth->checkRole($user, ['admin', 'editor']) && isset($segments[1])) {
                // PUT /api/properties/:id/attachments/reorder
                if (isset($segments[2]) && $segments[2] === 'attachments' && isset($segments[3]) && $segments[3] === 'reorder') {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $result = $controller->reorderPropertyAttachments($segments[1], $data['order'] ?? []);
                    echo json_encode($result);
                    break;
                }

                // PUT /api/properties/:id/attachments/:attachmentId
                if (isset($segments[2]) && $segments[2] === 'attachments' && isset($segments[3])) {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $result = $controller->updatePropertyAttachment($segments[1], $segments[3], $data, $user['user_id']);
                    echo json_encode($result);
                    break;
                }

                // PUT /api/properties/:id/landing-pages - Update landing pages associations
                if (isset($segments[2]) && $segments[2] === 'landing-pages') {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $landingPages = $data['landing_pages'] ?? [];
                    $result = $controller->updatePropertyLandingPages($segments[1], $landingPages);
                    echo json_encode($result);
                    break;
                }

                // PUT /api/properties/:id - Update property
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->update($segments[1], $data, $user['user_id']);
                echo json_encode($result);
            }
            break;

        case 'DELETE':
            $user = $auth->authenticate();
            if ($user && $auth->checkRole($user, ['admin']) && isset($segments[1])) {
                // DELETE /api/properties/:id/attachments/:attachmentId
                if (isset($segments[2]) && $segments[2] === 'attachments' && isset($segments[3])) {
                    $result = $controller->deletePropertyAttachment($segments[1], $segments[3]);
                    echo json_encode($result);
                    break;
                }

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
function handleUploadRoutes($segments, $method)
{
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

            case 'video-image':
                $result = $controller->uploadVideoImage($_FILES['image'] ?? null);
                echo json_encode($result);
                break;

            case 'video-thumbnail':
                // alias used by admin
                $result = $controller->uploadVideoImage($_FILES['image'] ?? null);
                echo json_encode($result);
                break;

            case 'blog-image':
                $result = $controller->uploadBlogImage($_FILES['image'] ?? null);
                echo json_encode($result);
                break;

            case 'city-image':
                $result = $controller->uploadCityImage($_FILES['image'] ?? null);
                echo json_encode($result);
                break;

            case 'area-image':
                $result = $controller->uploadAreaImage($_FILES['image'] ?? null);
                echo json_encode($result);
                break;

            case 'attachment':
                $result = $controller->uploadAttachment($_FILES['file'] ?? $_FILES['attachment'] ?? null);
                echo json_encode($result);
                break;

            case 'editor-image':
                $result = $controller->uploadEditorImage($_FILES['image'] ?? $_FILES['file'] ?? null);
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
function handleHomeRoutes($segments, $method)
{
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
function handleBlogRoutes($segments, $method)
{
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
    $user = $auth->authenticate();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        return;
    }

    switch ($method) {
        case 'POST':
            // POST /api/blogs/reorder - bulk reorder
            if (!empty($segments[1]) && $segments[1] === 'reorder') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->reorder($data['order'] ?? [], $user['user_id']);
                echo json_encode($result);
                break;
            }
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
 * Handle video routes
 */
function handleVideoRoutes($segments, $method)
{
    $controller = new VideoController();

    if ($method === 'GET' && empty($segments[1])) {
        $filters = $_GET;
        $result = $controller->getAll($filters);
        echo json_encode($result);
        return;
    }

    if ($method === 'GET' && !empty($segments[1]) && is_numeric($segments[1])) {
        $result = $controller->getById($segments[1]);
        echo json_encode($result);
        return;
    }

    $auth = new AuthMiddleware();
    $user = $auth->authenticate();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        return;
    }

    switch ($method) {
        case 'POST':
            if (!empty($segments[1]) && $segments[1] === 'reorder') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->reorder($data['order'] ?? [], $user['user_id']);
                echo json_encode($result);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->create($data, $user['user_id']);
            echo json_encode($result);
            break;

        case 'PUT':
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Video ID required']);
                return;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->update($segments[1], $data, $user['user_id']);
            echo json_encode($result);
            break;

        case 'DELETE':
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Video ID required']);
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
 * Handle testimonial routes
 */
function handleTestimonialRoutes($segments, $method)
{
    $controller = new TestimonialController();

    if ($method === 'GET') {
        if (!empty($segments[1]) && is_numeric($segments[1])) {
            $result = $controller->getById($segments[1]);
            echo json_encode($result);
            return;
        }

        $filters = $_GET;
        $result = $controller->getAll($filters);
        echo json_encode($result);
        return;
    }

    $auth = new AuthMiddleware();
    $user = $auth->authenticate();
    if (!$user || !$auth->checkRole($user, ['admin', 'editor'])) {
        return;
    }

    switch ($method) {
        case 'POST':
            if (!empty($segments[1]) && $segments[1] === 'reorder') {
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $controller->reorder($data['order'] ?? [], $user['user_id']);
                echo json_encode($result);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->create($data, $user['user_id']);
            echo json_encode($result);
            break;

        case 'PUT':
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Testimonial ID required']);
                return;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->update($segments[1], $data, $user['user_id']);
            echo json_encode($result);
            break;

        case 'DELETE':
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Testimonial ID required']);
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
 * Handle city routes
 */
function handleCityRoutes($segments, $method)
{
    $controller = new CityController();
    $auth = new AuthMiddleware();

    switch ($method) {
        case 'GET':
            if (isset($segments[1]) && $segments[1] === 'slug' && !empty($segments[2])) {
                $result = $controller->getBySlug($segments[2]);
            } elseif (isset($segments[1]) && is_numeric($segments[1])) {
                $result = $controller->getById($segments[1]);
            } else {
                $result = $controller->getAll($_GET);
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
            if ($user && $auth->checkRole($user, ['admin', 'editor'])) {
                if (isset($segments[1]) && $segments[1] === 'reorder') {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $items = $data['items'] ?? [];
                    $result = $controller->reorder($items, $user['user_id']);
                    echo json_encode($result);
                } elseif (isset($segments[1]) && is_numeric($segments[1])) {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $result = $controller->update($segments[1], $data, $user['user_id']);
                    echo json_encode($result);
                }
            }
            break;

        case 'DELETE':
            $user = $auth->authenticate();
            if ($user && $auth->checkRole($user, ['admin'])) {
                if (isset($segments[1]) && is_numeric($segments[1])) {
                    $result = $controller->delete($segments[1], $user['user_id']);
                    echo json_encode($result);
                }
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}

/**
 * Handle area routes
 */
function handleAreaRoutes($segments, $method)
{
    $controller = new AreaController();
    $auth = new AuthMiddleware();

    switch ($method) {
        case 'GET':
            if (isset($segments[1]) && $segments[1] === 'slug' && !empty($segments[2]) && !empty($segments[3])) {
                $result = $controller->getBySlug($segments[2], $segments[3]);
            } elseif (isset($segments[1]) && is_numeric($segments[1])) {
                $result = $controller->getById($segments[1]);
            } else {
                $result = $controller->getAll($_GET);
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
            if ($user && $auth->checkRole($user, ['admin', 'editor'])) {
                if (isset($segments[1]) && $segments[1] === 'reorder') {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $items = $data['items'] ?? [];
                    $result = $controller->reorder($items, $user['user_id']);
                    echo json_encode($result);
                } elseif (isset($segments[1]) && is_numeric($segments[1])) {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $result = $controller->update($segments[1], $data, $user['user_id']);
                    echo json_encode($result);
                }
            }
            break;

        case 'DELETE':
            $user = $auth->authenticate();
            if ($user && $auth->checkRole($user, ['admin'])) {
                if (isset($segments[1]) && is_numeric($segments[1])) {
                    $result = $controller->delete($segments[1], $user['user_id']);
                    echo json_encode($result);
                }
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}

/**
 * Handle redirect routes
 */
function handleRedirectRoutes($segments, $method)
{
    $controller = new RedirectController();

    // Public resolve: /redirects/resolve?urlOld=/path
    if ($method === 'GET' && !empty($segments[1]) && $segments[1] === 'resolve') {
        $urlOld = $_GET['urlOld'] ?? '';
        $result = $controller->resolve($urlOld);
        echo json_encode($result);
        return;
    }

    // Protected routes require authentication
    $auth = new AuthMiddleware();
    $user = $auth->authenticate();
    if (!$user || !$auth->checkRole($user, ['admin', 'editor'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        return;
    }

    switch ($method) {
        case 'GET':
            if (!empty($segments[1]) && is_numeric($segments[1])) {
                $result = $controller->getById((int) $segments[1]);
                echo json_encode($result);
                return;
            }
            $result = $controller->getAll();
            echo json_encode($result);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->create($data, $user['user_id']);
            echo json_encode($result);
            break;

        case 'PUT':
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Redirect ID required']);
                return;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->update((int) $segments[1], $data, $user['user_id']);
            echo json_encode($result);
            break;

        case 'DELETE':
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Redirect ID required']);
                return;
            }
            $result = $controller->delete((int) $segments[1], $user['user_id']);
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
function handlePhotoGalleryRoutes($segments, $method)
{
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

/**
 * Handle property photo routes
 */
function handlePropertyPhotoRoutes($segments, $method)
{
    $controller = new PropertyPhotoController();
    $auth = new AuthMiddleware();

    switch ($method) {
        case 'GET':
            // GET /api/property-photos/property/:propertyId - Get photos for a property
            if (isset($segments[1]) && $segments[1] === 'property' && !empty($segments[2])) {
                $result = $controller->getByPropertyId($segments[2]);
                echo json_encode($result);
                break;
            }

            // GET /api/property-photos/:id - Get single photo
            if (!empty($segments[1]) && is_numeric($segments[1])) {
                $result = $controller->getById($segments[1]);
                echo json_encode($result);
                break;
            }

            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid request']);
            break;

        case 'POST':
            $user = $auth->authenticate();
            if (!$user || !$auth->checkRole($user, ['admin', 'editor'])) {
                break;
            }

            // POST /api/property-photos/reorder - Reorder photos
            if (isset($segments[1]) && $segments[1] === 'reorder') {
                $data = json_decode(file_get_contents('php://input'), true);
                $items = $data['items'] ?? [];
                $result = $controller->reorder($items);
                echo json_encode($result);
                break;
            }

            // POST /api/property-photos - Create new photo
            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->create($data);
            echo json_encode($result);
            break;

        case 'PUT':
            $user = $auth->authenticate();
            if (!$user || !$auth->checkRole($user, ['admin', 'editor'])) {
                break;
            }

            // PUT /api/property-photos/:id/set-cover - Set as cover
            if (!empty($segments[1]) && isset($segments[2]) && $segments[2] === 'set-cover') {
                $result = $controller->setCover($segments[1]);
                echo json_encode($result);
                break;
            }

            // PUT /api/property-photos/:id - Update photo
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Photo ID required']);
                break;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->update($segments[1], $data);
            echo json_encode($result);
            break;

        case 'DELETE':
            $user = $auth->authenticate();
            if (!$user || !$auth->checkRole($user, ['admin', 'editor'])) {
                break;
            }

            // DELETE /api/property-photos/:id - Delete photo
            if (empty($segments[1])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Photo ID required']);
                break;
            }

            $result = $controller->delete($segments[1]);
            echo json_encode($result);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}

/**
 * Handle exchange rate routes
 */
function handleExchangeRateRoutes($segments, $method)
{
    $controller = new ExchangeRateController();
    $auth = new AuthMiddleware();

    switch ($method) {
        case 'GET':
            // GET /api/exchange-rate/current - Get current active rate (public)
            if (isset($segments[1]) && $segments[1] === 'current') {
                $result = $controller->getCurrent();
                echo json_encode($result);
                break;
            }

            // GET /api/exchange-rate/history - Get rate history (admin only)
            if (isset($segments[1]) && $segments[1] === 'history') {
                $user = $auth->authenticate();
                if (!$user || !$auth->checkRole($user, ['admin'])) {
                    break;
                }
                $result = $controller->getHistory();
                echo json_encode($result);
                break;
            }

            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid request']);
            break;

        case 'POST':
            // POST /api/exchange-rate/refresh - Refresh rates from Frankfurter (admin only)
            if (isset($segments[1]) && $segments[1] === 'refresh') {
                $user = $auth->authenticate();
                if (!$user || !$auth->checkRole($user, ['admin'])) {
                    break;
                }
                $result = $controller->refreshFromFrankfurter();
                echo json_encode($result);
                break;
            }

            // POST /api/exchange-rate - Update/create rate (admin only)
            $user = $auth->authenticate();
            if (!$user || !$auth->checkRole($user, ['admin'])) {
                break;
            }

            $data = json_decode(file_get_contents('php://input'), true);
            $result = $controller->update($data);
            echo json_encode($result);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}

/**
 * Handle off-market invite routes
 */
function handleOffMarketInviteRoutes($segments, $method)
{
    $controller = new OffMarketInviteController();
    $auth = new AuthMiddleware();

    // PUBLIC: POST /off-market-invites/verify (verify token + code)
    if ($method === 'POST' && isset($segments[1]) && $segments[1] === 'verify') {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $controller->verify($data);
        echo json_encode($result);
        return;
    }

    // PUBLIC: GET /off-market-invites/check-token?token=xxx
    if ($method === 'GET' && isset($segments[1]) && $segments[1] === 'check-token') {
        $token = $_GET['token'] ?? '';
        $result = $controller->checkToken($token);
        echo json_encode($result);
        return;
    }

    // --- ADMIN routes below ---
    $user = $auth->authenticate();
    if (!$user || !$auth->checkRole($user, ['admin', 'editor'])) {
        return;
    }

    // GET /off-market-invites/properties (list off-market properties for dropdown)
    if ($method === 'GET' && isset($segments[1]) && $segments[1] === 'properties') {
        $result = $controller->getOffMarketProperties();
        echo json_encode($result);
        return;
    }

    // GET /off-market-invites (list all invites)
    if ($method === 'GET' && count($segments) === 1) {
        $filters = $_GET;
        $result = $controller->getAll($filters);
        echo json_encode($result);
        return;
    }

    // POST /off-market-invites (create invite)
    if ($method === 'POST' && count($segments) === 1) {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $controller->create($data);
        echo json_encode($result);
        return;
    }

    // POST /off-market-invites/:id/regenerate
    if ($method === 'POST' && isset($segments[1]) && isset($segments[2]) && $segments[2] === 'regenerate') {
        $result = $controller->regenerate((int) $segments[1]);
        echo json_encode($result);
        return;
    }

    // DELETE /off-market-invites/:id
    if ($method === 'DELETE' && isset($segments[1])) {
        $result = $controller->delete((int) $segments[1]);
        echo json_encode($result);
        return;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

/**
 * Handle access request routes
 */
function handleAccessRequestRoutes($segments, $method)
{
    $controller = new AccessRequestController();
    $auth = new AuthMiddleware();

    // PUBLIC: POST /access-requests (create request)
    if ($method === 'POST' && count($segments) === 1) {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $controller->create($data);
        echo json_encode($result);
        return;
    }

    // PUBLIC: POST /access-requests/verify-code
    if ($method === 'POST' && isset($segments[1]) && $segments[1] === 'verify-code') {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $controller->verifyCode($data);
        echo json_encode($result);
        return;
    }

    // --- ADMIN routes below ---
    $user = $auth->authenticate();
    if (!$user || !$auth->checkRole($user, ['admin', 'editor'])) {
        return;
    }

    // GET /access-requests/unviewed-count
    if ($method === 'GET' && isset($segments[1]) && $segments[1] === 'unviewed-count') {
        $result = $controller->getUnviewedCount();
        echo json_encode($result);
        return;
    }

    // POST /access-requests/mark-all-viewed
    if ($method === 'POST' && isset($segments[1]) && $segments[1] === 'mark-all-viewed') {
        $result = $controller->markAllViewed();
        echo json_encode($result);
        return;
    }

    // GET /access-requests
    if ($method === 'GET' && count($segments) === 1) {
        $filters = $_GET;
        $result = $controller->getAll($filters);
        echo json_encode($result);
        return;
    }

    // PATCH /access-requests/:id/view
    if (($method === 'PATCH' || $method === 'PUT') && isset($segments[1]) && isset($segments[2]) && $segments[2] === 'view') {
        $result = $controller->markViewed((int) $segments[1]);
        echo json_encode($result);
        return;
    }

    // POST /access-requests/:id/generate-code
    if ($method === 'POST' && isset($segments[1]) && isset($segments[2]) && $segments[2] === 'generate-code') {
        $result = $controller->generateCode((int) $segments[1]);
        echo json_encode($result);
        return;
    }

    // POST /access-requests/:id/regenerate-code
    if ($method === 'POST' && isset($segments[1]) && isset($segments[2]) && $segments[2] === 'regenerate-code') {
        $result = $controller->regenerateCode((int) $segments[1]);
        echo json_encode($result);
        return;
    }

    // DELETE /access-requests/:id
    if ($method === 'DELETE' && isset($segments[1])) {
        $result = $controller->delete((int) $segments[1]);
        echo json_encode($result);
        return;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

/**
 * Handle todo routes (admin)
 */
function handleTodoRoutes($segments, $method)
{
    $controller = new TodoController();
    $auth = new AuthMiddleware();
    $user = $auth->authenticate();
    if (!$user || !$auth->checkRole($user, ['admin', 'editor'])) {
        return;
    }

    // GET /todos
    if ($method === 'GET' && count($segments) === 1) {
        $result = $controller->list($_GET);
        echo json_encode($result);
        return;
    }

    // POST /todos
    if ($method === 'POST' && count($segments) === 1) {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $controller->create($data);
        echo json_encode($result);
        return;
    }

    // PUT /todos/:id
    if ($method === 'PUT' && isset($segments[1]) && is_numeric($segments[1]) && count($segments) === 2) {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $controller->update((int) $segments[1], $data);
        echo json_encode($result);
        return;
    }

    // DELETE /todos/:id
    if ($method === 'DELETE' && isset($segments[1]) && is_numeric($segments[1])) {
        $result = $controller->delete((int) $segments[1]);
        echo json_encode($result);
        return;
    }

    // POST /todos/reorder
    if ($method === 'POST' && isset($segments[1]) && $segments[1] === 'reorder') {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $controller->reorder($data['items'] ?? []);
        echo json_encode($result);
        return;
    }

    // POST /todos/:id/comments
    if ($method === 'POST' && isset($segments[1]) && isset($segments[2]) && $segments[2] === 'comments') {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $controller->addComment((int) $segments[1], $data);
        echo json_encode($result);
        return;
    }

    // DELETE /todos/:id/comments/:commentId
    if ($method === 'DELETE' && isset($segments[1]) && isset($segments[2]) && $segments[2] === 'comments' && isset($segments[3])) {
        $result = $controller->deleteComment((int) $segments[1], (int) $segments[3]);
        echo json_encode($result);
        return;
    }

    // POST /todos/:id/attachments
    if ($method === 'POST' && isset($segments[1]) && isset($segments[2]) && $segments[2] === 'attachments') {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $controller->addAttachment((int) $segments[1], $data);
        echo json_encode($result);
        return;
    }

    // DELETE /todos/:id/attachments/:attachmentId
    if ($method === 'DELETE' && isset($segments[1]) && isset($segments[2]) && $segments[2] === 'attachments' && isset($segments[3])) {
        $result = $controller->deleteAttachment((int) $segments[1], (int) $segments[3]);
        echo json_encode($result);
        return;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}


/**
 * Handle contact routes
 */
function handleContactRoutes($segments, $method)
{
    $controller = new ContactController();

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $result = $controller->send($data);
        echo json_encode($result);
        return;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

/**
 * Handle backup routes
 */
function handleBackupsRoutes($segments, $method)
{
    $auth = new AuthMiddleware();
    $user = $auth->authenticate();

    if (!$user || !$auth->checkRole($user, ['admin'])) {
        return;
    }

    $controller = new BackupController();

    switch ($method) {
        case 'GET':
            if (isset($segments[1]) && $segments[1] === 'download' && isset($segments[2])) {
                $controller->download($segments[2]);
            } else {
                $result = $controller->list();
                echo json_encode($result);
            }
            break;

        case 'POST':
            $result = $controller->create();
            echo json_encode($result);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
}
