<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>TEST DATABASE CONNECTION</h2>";

// Verifica file .env
$envFile = __DIR__ . '/api/.env';
echo "Path .env: " . $envFile . "<br><br>";

if (file_exists($envFile)) {
    echo "✓ File .env trovato<br><br>";
    
    $envContent = file_get_contents($envFile);
    $lines = explode("\n", $envContent);
    
    $env = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || $line[0] === '#') continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $env[trim($parts[0])] = trim($parts[1]);
        }
    }
    
    echo "DB_HOST: " . ($env['DB_HOST'] ?? 'MANCANTE') . "<br>";
    echo "DB_NAME: " . ($env['DB_NAME'] ?? 'MANCANTE') . "<br>";
    echo "DB_USER: " . ($env['DB_USER'] ?? 'MANCANTE') . "<br>";
    echo "DB_PASSWORD: " . (isset($env['DB_PASSWORD']) ? '[PRESENTE]' : 'MANCANTE') . "<br><br>";
    
    // Test connessione
    echo "<h3>Test connessione MySQL...</h3>";
    
    $host = $env['DB_HOST'] ?? 'localhost';
    $user = $env['DB_USER'] ?? '';
    $pass = $env['DB_PASSWORD'] ?? '';
    $db = $env['DB_NAME'] ?? '';
    
    $conn = @new mysqli($host, $user, $pass, $db);
    
    if ($conn->connect_error) {
        echo "✗ <strong style='color:red'>ERRORE CONNESSIONE:</strong> " . $conn->connect_error . "<br>";
        echo "Error code: " . $conn->connect_errno . "<br>";
    } else {
        echo "✓ <strong style='color:green'>CONNESSIONE DATABASE OK!</strong><br>";
        echo "MySQL version: " . $conn->server_info . "<br>";
        $conn->close();
    }
    
} else {
    echo "✗ <strong style='color:red'>File .env NON trovato!</strong><br>";
    echo "Percorso cercato: " . $envFile . "<br>";
}
?>
