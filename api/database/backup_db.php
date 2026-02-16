<?php
/**
 * Database Backup Script for Dalila
 * 
 * Generates a SQL export of the current database for safety.
 */

require_once __DIR__ . '/../config/database.php';

$secretToken = getenv('MIGRATION_TOKEN') ?: 'dalila_secret_2026';

if (!isset($_GET['token']) || $_GET['token'] !== $secretToken) {
    header('HTTP/1.1 403 Forbidden');
    die('Access denied.');
}

class DatabaseBackup
{
    private $db;
    private $backupDir;

    public function __construct()
    {
        $dbInstance = new Database();
        $this->db = $dbInstance->getConnection();
        if (!$this->db) {
            die("Database connection failed.");
        }
        $this->backupDir = __DIR__ . '/backups';
        if (!is_dir($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
            // Protect the backup folder
            file_put_contents($this->backupDir . '/.htaccess', "Deny from all");
        }
    }

    public function run()
    {
        $tables = [];
        $result = $this->db->query("SHOW TABLES");
        while ($row = $result->fetch_row()) {
            $tables[] = $row[0];
        }

        $sql = "-- Dalila Database Backup\n";
        $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $table) {
            // Structure
            $res = $this->db->query("SHOW CREATE TABLE `$table` ");
            $row = $res->fetch_row();
            $sql .= "\n\n-- Structure for table `$table` --\n";
            $sql .= "DROP TABLE IF EXISTS `$table`;\n";
            $sql .= $row[1] . ";\n\n";

            // Data
            $res = $this->db->query("SELECT * FROM `$table` ");
            $sql .= "-- Data for table `$table` --\n";
            while ($row = $res->fetch_assoc()) {
                $keys = array_keys($row);
                $values = array_map(function ($val) {
                    if ($val === null)
                        return "NULL";
                    return "'" . $this->db->real_escape_string($val) . "'";
                }, array_values($row));

                $sql .= "INSERT INTO `$table` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $values) . ");\n";
            }
        }

        $sql .= "\n\nSET FOREIGN_KEY_CHECKS=1;\n";

        $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
        $filePath = $this->backupDir . '/' . $filename;

        if (file_put_contents($filePath, $sql)) {
            echo "<h1>✅ Backup completato con successo!</h1>";
            echo "<p>File creato: <strong>$filename</strong></p>";
            echo "<p>Il file si trova nella cartella protetta <code>api/database/backups/</code>.</p>";

            $this->cleanOldBackups();
        } else {
            echo "<h1>❌ Errore durante il backup</h1>";
        }
    }

    private function cleanOldBackups()
    {
        $files = glob($this->backupDir . '/backup_*.sql');
        if (count($files) <= 5) {
            return;
        }

        // Sort by modification time, newest first
        usort($files, function ($a, $b) {
            return filemtime($b) - filemtime($a);
        });

        // Keep the first 5, delete the rest
        $toDelete = array_slice($files, 5);
        foreach ($toDelete as $file) {
            @unlink($file);
        }

        echo "<p>ℹ️ Rotazione backup: eliminati " . count($toDelete) . " vecchi file. (Mantengo gli ultimi 5)</p>";
    }
}

$backup = new DatabaseBackup();
$backup->run();
