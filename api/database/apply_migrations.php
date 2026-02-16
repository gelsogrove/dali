<?php
/**
 * Automated Migration Runner for Dalila
 * 
 * This script scans the 'migrations/' directory for SQL files,
 * executes them in alphanumeric order, and tracks progress in 
 * a '_migrations' table.
 */

require_once __DIR__ . '/../config/database.php';

// Simple security token - change this in production!
$secretToken = getenv('MIGRATION_TOKEN') ?: 'dalila_secret_2026';

if (!isset($_GET['token']) || $_GET['token'] !== $secretToken) {
    header('HTTP/1.1 403 Forbidden');
    die('Access denied. Invalid token.');
}

class MigrationRunner
{
    private $db;
    private $migrationsDir;

    public function __construct()
    {
        $this->db = (new Database())->getConnection();
        if (!$this->db) {
            die("Database connection failed.");
        }
        $this->migrationsDir = __DIR__ . '/migrations';

        $this->ensureMigrationsTable();
    }

    private function ensureMigrationsTable()
    {
        $sql = "CREATE TABLE IF NOT EXISTS _migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

        if (!$this->db->query($sql)) {
            die("Failed to create _migrations table: " . $this->db->error);
        }
    }

    public function run()
    {
        echo "<h1>🚀 Dalila Migration Runner</h1>";

        if (!is_dir($this->migrationsDir)) {
            echo "<p style='color: orange;'>⚠️ Migrations directory not found: {$this->migrationsDir}</p>";
            return;
        }

        $files = glob($this->migrationsDir . '/*.sql');
        sort($files); // Ensure alphanumeric order

        $appliedCount = 0;
        $totalFound = count($files);

        echo "<p>Found <strong>$totalFound</strong> migration files.</p>";
        echo "<ul>";

        foreach ($files as $file) {
            $filename = basename($file);

            // SECURITY CHECK: Never run init scripts or full exports automatically
            if (in_array(strtolower($filename), ['init.sql', 'dalila_db_full.sql'])) {
                echo "<li><span style='color: orange;'>[SECURITY SKIP]</span> $filename (Manual run only)</li>";
                continue;
            }

            if ($this->isApplied($filename)) {
                echo "<li><span style='color: #888;'>[SKIP]</span> $filename (Already applied)</li>";
                continue;
            }

            echo "<li><strong>[APPLYING]</strong> $filename... ";
            if ($this->apply($file, $filename)) {
                echo "<span style='color: green;'>✅ Success</span></li>";
                $appliedCount++;
            } else {
                echo "<span style='color: red;'>❌ FAILED</span></li>";
                echo "</ul><p style='color: red;'><strong>Migration stopped due to error.</strong></p>";
                return;
            }
        }

        echo "</ul>";
        echo "<p style='font-weight: bold; color: green;'>Migration complete! Applied $appliedCount new scripts.</p>";
    }

    private function isApplied($filename)
    {
        $stmt = $this->db->prepare("SELECT id FROM _migrations WHERE filename = ?");
        $stmt->bind_param("s", $filename);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    private function apply($filePath, $filename)
    {
        $sql = file_get_contents($filePath);
        if (!$sql)
            return false;

        $this->db->begin_transaction();

        try {
            // Remove comments that might interfere with splitting
            $cleanSql = preg_replace('/--.*$/m', '', $sql);

            $currentDelimiter = ';';
            $queries = [];
            $lines = explode("\n", $cleanSql);
            $queryBuffer = '';

            foreach ($lines as $line) {
                $trimmedLine = trim($line);
                if (empty($trimmedLine))
                    continue;

                if (stripos($trimmedLine, 'DELIMITER') === 0) {
                    $parts = preg_split('/\s+/', $trimmedLine);
                    $currentDelimiter = end($parts);
                    continue;
                }

                $queryBuffer .= $line . "\n";

                if (strpos($trimmedLine, $currentDelimiter) !== false && substr($trimmedLine, -strlen($currentDelimiter)) === $currentDelimiter) {
                    $query = trim($queryBuffer);
                    // Remove the current delimiter from the end
                    $query = substr($query, 0, -strlen($currentDelimiter));
                    if (!empty($query)) {
                        $queries[] = $query;
                    }
                    $queryBuffer = '';
                }
            }

            // Add remaining buffer
            if (!empty(trim($queryBuffer))) {
                $queries[] = trim($queryBuffer);
            }

            foreach ($queries as $query) {
                if (!$this->db->query($query)) {
                    $error = $this->db->error;
                    $errno = $this->db->errno;

                    // Error codes to ignore for idempotency:
                    // 1050: Table already exists
                    // 1060: Column already exists
                    // 1061: Key/Index already exists
                    if (in_array($errno, [1050, 1060, 1061])) {
                        continue;
                    }

                    throw new Exception($error . " | Query: " . substr($query, 0, 100) . "...");
                }
            }

            // Record success
            $stmt = $this->db->prepare("INSERT INTO _migrations (filename) VALUES (?)");
            $stmt->bind_param("s", $filename);
            $stmt->execute();

            $this->db->commit();
            return true;

        } catch (Exception $e) {
            $this->db->rollback();
            echo "<br><small style='color: red;'>Error in {$filename}: " . htmlspecialchars($e->getMessage()) . "</small><br>";
            return false;
        }
    }
}

$runner = new MigrationRunner();
$runner->run();
