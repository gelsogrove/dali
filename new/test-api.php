<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>TEST API INDEX.PHP</h2>";

// Simula quello che fa api/index.php
chdir(__DIR__ . '/api');

echo "1. Carico load-env.php...<br>";
if (file_exists(__DIR__ . '/api/load-env.php')) {
    require_once __DIR__ . '/api/load-env.php';
    echo "✓ load-env.php caricato<br><br>";
} else {
    echo "✗ load-env.php non trovato<br><br>";
}

echo "2. Variabili ambiente caricate:<br>";
echo "DB_HOST: " . (getenv('DB_HOST') ?: '[NON IMPOSTATO]') . "<br>";
echo "DB_NAME: " . (getenv('DB_NAME') ?: '[NON IMPOSTATO]') . "<br><br>";

echo "3. Carico config/database.php...<br>";
if (file_exists(__DIR__ . '/api/config/database.php')) {
    try {
        require_once __DIR__ . '/api/config/database.php';
        echo "✓ database.php caricato<br><br>";
    } catch (Exception $e) {
        echo "✗ ERRORE: " . $e->getMessage() . "<br><br>";
    }
} else {
    echo "✗ database.php non trovato<br><br>";
}

echo "4. Test controller...<br>";
if (file_exists(__DIR__ . '/api/controllers/AuthController.php')) {
    try {
        require_once __DIR__ . '/api/controllers/AuthController.php';
        echo "✓ AuthController.php caricato<br><br>";
    } catch (Exception $e) {
        echo "✗ ERRORE: " . $e->getMessage() . "<br>";
        echo "Stack trace: <pre>" . $e->getTraceAsString() . "</pre>";
    }
}

echo "<br><strong>Se arrivi qui senza errori, il problema è altrove!</strong>";
?>
