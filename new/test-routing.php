<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>TEST API ROUTING</h2>";

// Simula chiamata a /api/health
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/new/api/health';

echo "Simulating GET /new/api/health<br><br>";

try {
    // Includi l'API index.php
    include __DIR__ . '/api/index.php';
} catch (Exception $e) {
    echo "<strong style='color:red'>ERRORE CATTURATO:</strong><br>";
    echo "Message: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "<br>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
} catch (Error $e) {
    echo "<strong style='color:red'>FATAL ERROR:</strong><br>";
    echo "Message: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "<br>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>
