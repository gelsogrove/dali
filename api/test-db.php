<?php
require_once __DIR__ . '/config/database.php';

$db = new Database();
$conn = $db->getConnection();

$query = "SELECT id, title, slug, property_type, is_active, show_in_home, featured, `order` FROM properties WHERE title LIKE '%Aldea%' OR title LIKE '%Nautica%'";
$result = $conn->query($query);

echo "--- Properties Debug ---\n";
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        echo "ID: " . $row['id'] . "\n";
        echo "Title: " . $row['title'] . "\n";
        echo "Slug: " . $row['slug'] . "\n";
        echo "Type: " . $row['property_type'] . "\n";
        echo "Is Active: " . $row['is_active'] . " (" . gettype($row['is_active']) . ")\n";
        echo "Show In Home: " . $row['show_in_home'] . " (" . gettype($row['show_in_home']) . ")\n";
        echo "Featured: " . $row['featured'] . "\n";
        echo "Order: " . $row['order'] . "\n";
        echo "-----------------------\n";
    }
} else {
    echo "No properties found matching 'Aldea' or 'Nautica'.\n";
}

// Check total active and show_in_home
$countQuery = "SELECT COUNT(*) as total FROM properties WHERE is_active = 1 AND show_in_home = 1";
$countResult = $conn->query($countQuery);
$total = $countResult->fetch_assoc()['total'];
echo "Total Active & Show In Home: " . $total . "\n";
