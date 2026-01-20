<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>TEST API ENDPOINTS</h2>";

$endpoints = [
    '/new/api/auth/check',
    '/new/api/properties',
    '/new/api/blogs'
];

foreach ($endpoints as $uri) {
    echo "<h3>Testing: $uri</h3>";
    
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = $uri;
    
    ob_start();
    try {
        include __DIR__ . '/api/index.php';
        $output = ob_get_clean();
        echo "Response: <pre>$output</pre>";
    } catch (Exception $e) {
        ob_end_clean();
        echo "<strong style='color:red'>ERROR:</strong> " . $e->getMessage() . "<br>";
        echo "<pre>" . $e->getTraceAsString() . "</pre>";
    }
    
    echo "<hr>";
}
?>
