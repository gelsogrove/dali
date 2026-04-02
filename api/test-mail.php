<?php

/**
 * Email Test Script
 * This script tests the mail() function to see if it's working on the server
 */

// Load environment variables
if (file_exists(__DIR__ . '/load-env.php')) {
    require_once __DIR__ . '/load-env.php';
}

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

$results = [];

echo "========================================\n";
echo "MAIL SYSTEM TEST\n";
echo "========================================\n\n";

// 1. Check PHP mail function exists
echo "1. PHP mail() function check:\n";
if (function_exists('mail')) {
    echo "   ✓ mail() function exists\n";
    $results['mail_function'] = 'OK';
} else {
    echo "   ✗ mail() function NOT found\n";
    $results['mail_function'] = 'MISSING';
}

// 2. Check sendmail path
echo "\n2. Sendmail configuration:\n";
$sendmail = ini_get('sendmail_path');
if ($sendmail) {
    echo "   ✓ sendmail_path: " . $sendmail . "\n";
    $results['sendmail_path'] = $sendmail;
} else {
    echo "   ✗ sendmail_path not configured\n";
    $results['sendmail_path'] = 'NOT CONFIGURED';
}

// 3. Check SMTP settings
echo "\n3. SMTP configuration:\n";
$smtp = ini_get('SMTP');
$smtp_port = ini_get('smtp_port');
if ($smtp || $smtp_port) {
    echo "   ✓ SMTP: " . ($smtp ?: 'default') . "\n";
    echo "   ✓ SMTP Port: " . ($smtp_port ?: 'default') . "\n";
    $results['smtp'] = $smtp ?: 'default';
    $results['smtp_port'] = $smtp_port ?: 'default';
} else {
    echo "   ℹ SMTP settings not configured (will use sendmail)\n";
}

// 4. Test actual mail sending
echo "\n4. Attempting to send test email...\n";

$testEmail = 'gelsogrove@gmail.com';
$fromEmail = getenv('CONTACT_FROM_EMAIL') ?: 'no-reply@buywithdali.com';
$fromName = getenv('CONTACT_FROM_NAME') ?: 'Buy With Dali';

$subject = "TEST: Email System Working - " . date('Y-m-d H:i:s');
$message = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body>
    <h2>Email System Test</h2>
    <p>If you receive this email, it means the mail system is working!</p>
    <p><strong>Test Details:</strong></p>
    <ul>
        <li>Timestamp: {$_SERVER['REQUEST_TIME']}</li>
        <li>Server: {$_SERVER['SERVER_NAME']}</li>
        <li>From: {$fromEmail}</li>
        <li>Test sent at: " . date('Y-m-d H:i:s') . "</li>
    </ul>
    <p>Best regards,<br>Buy With Dali Test System</p>
</body>
</html>
HTML;

$headers = [
    'From: ' . $fromEmail,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

echo "   From: {$fromEmail}\n";
echo "   To: {$testEmail}\n";
echo "   Subject: {$subject}\n";
echo "   Headers: " . implode(" | ", $headers) . "\n";

$success = @mail($testEmail, $subject, $message, implode("\r\n", $headers));

if ($success === false) {
    echo "   ✗ mail() returned FALSE - email likely not sent\n";
    $results['mail_result'] = 'FAILED';
} else {
    echo "   ✓ mail() returned TRUE - email queued for sending\n";
    $results['mail_result'] = 'QUEUED';
}

// 5. Check PHP version and extensions
echo "\n5. PHP Information:\n";
echo "   PHP Version: " . phpversion() . "\n";
$results['php_version'] = phpversion();

// Check for common extensions
$extensions = ['sockets', 'openssl', 'filter'];
foreach ($extensions as $ext) {
    $status = extension_loaded($ext) ? '✓' : '✗';
    echo "   {$status} {$ext} extension: " . (extension_loaded($ext) ? 'loaded' : 'not loaded') . "\n";
}

// 6. Check memory and script execution
echo "\n6. Script Environment:\n";
echo "   Memory Limit: " . ini_get('memory_limit') . "\n";
echo "   Max Execution Time: " . ini_get('max_execution_time') . " seconds\n";
echo "   Posting Allowed: " . (ini_get('file_uploads') ? 'Yes' : 'No') . "\n";

// 7. Summary
echo "\n========================================\n";
echo "SUMMARY\n";
echo "========================================\n";
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
echo "\n\nNOTE: Check your email (gelsogrove@gmail.com) for the test message.\n";
echo "It may take a few moments to arrive, or check spam folder.\n";

?>
