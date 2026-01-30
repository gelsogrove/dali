<?php
// Temporary database test script
// DELETE THIS FILE AFTER TESTING

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$result = [
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => []
];

try {
    // Test 1: Load environment
    $result['tests']['env_file'] = file_exists(__DIR__ . '/.env') ? 'EXISTS' : 'MISSING';
    
    if (file_exists(__DIR__ . '/.env')) {
        $envContent = file_get_contents(__DIR__ . '/.env');
        $result['tests']['env_has_db_config'] = (strpos($envContent, 'DB_HOST') !== false) ? 'YES' : 'NO';
    }
    
    // Test 2: Load database config
    require_once __DIR__ . '/config/database.php';
    $result['tests']['database_class'] = class_exists('Database') ? 'LOADED' : 'FAILED';
    
    // Test 3: Connect to database
    $db = new Database();
    $conn = $db->getConnection();
    $result['tests']['db_connection'] = $conn ? 'SUCCESS' : 'FAILED';
    
    if ($conn) {
        // Test 4: Check admin_users table
        $query = "SHOW TABLES LIKE 'admin_users'";
        $stmt = $conn->query($query);
        $result['tests']['admin_users_table'] = ($stmt && $stmt->num_rows > 0) ? 'EXISTS' : 'MISSING';
        
        if ($stmt && $stmt->num_rows > 0) {
            // Test 5: Count admin users
            $query = "SELECT COUNT(*) as count FROM admin_users";
            $stmt = $conn->query($query);
            if ($stmt) {
                $row = $stmt->fetch_assoc();
                $result['tests']['admin_users_count'] = $row['count'];
            }
            
            // Test 6: Check specific user
            $query = "SELECT id, email, role, is_active FROM admin_users WHERE email = 'admin@dalila.com'";
            $stmt = $conn->query($query);
            if ($stmt && $stmt->num_rows > 0) {
                $user = $stmt->fetch_assoc();
                $result['tests']['admin_user_exists'] = 'YES';
                $result['tests']['admin_user_data'] = [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'is_active' => $user['is_active']
                ];
            } else {
                $result['tests']['admin_user_exists'] = 'NO';
            }
        }
        
        // Test 7: Check sessions table
        $query = "SHOW TABLES LIKE 'sessions'";
        $stmt = $conn->query($query);
        $result['tests']['sessions_table'] = ($stmt && $stmt->num_rows > 0) ? 'EXISTS' : 'MISSING';
        
        // Test 8: Check database name
        $query = "SELECT DATABASE() as db_name";
        $stmt = $conn->query($query);
        if ($stmt) {
            $row = $stmt->fetch_assoc();
            $result['tests']['database_name'] = $row['db_name'];
        }
    }
    
    $result['status'] = 'completed';
    
} catch (Exception $e) {
    $result['status'] = 'error';
    $result['error'] = $e->getMessage();
    $result['trace'] = $e->getTraceAsString();
}

echo json_encode($result, JSON_PRETTY_PRINT);
