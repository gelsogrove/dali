<?php
require_once __DIR__ . '/../config/database.php';

class BackupController
{
    private $backupDir;

    public function __construct()
    {
        $this->backupDir = __DIR__ . '/../database/backups';
        if (!is_dir($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
            file_put_contents($this->backupDir . '/.htaccess', "Deny from all");
        }
    }

    /**
     * List last 5 backups
     */
    public function list()
    {
        $files = glob($this->backupDir . '/backup_*.sql');

        // Sort by modification time, newest first
        usort($files, function ($a, $b) {
            return filemtime($b) - filemtime($a);
        });

        $backups = [];
        foreach (array_slice($files, 0, 10) as $file) {
            $backups[] = [
                'filename' => basename($file),
                'size' => filesize($file),
                'created_at' => date('Y-m-d H:i:s', filemtime($file))
            ];
        }

        return [
            'success' => true,
            'data' => $backups
        ];
    }

    /**
     * Create a new backup
     */
    public function create()
    {
        // Reuse original logic but return JSON
        require_once __DIR__ . '/../database/backup_db.php';

        // We need to capture the output or refactor backup_db.php
        // For now, let's just re-implement the core logic cleanly here
        try {
            $dbInstance = new Database();
            $db = $dbInstance->getConnection();

            if (!$db) {
                return ['success' => false, 'error' => 'Database connection failed'];
            }

            $tables = [];
            $result = $db->query("SHOW TABLES");
            while ($row = $result->fetch_row()) {
                $tables[] = $row[0];
            }

            $sql = "-- Dalila Database Backup\n-- Generated: " . date('Y-m-d H:i:s') . "\n\nSET FOREIGN_KEY_CHECKS=0;\n\n";

            foreach ($tables as $table) {
                $res = $db->query("SHOW CREATE TABLE `$table` ");
                $row = $res->fetch_row();
                $sql .= "\n\n-- Structure for table `$table` --\nDROP TABLE IF EXISTS `$table`;\n" . $row[1] . ";\n\n";

                $res = $db->query("SELECT * FROM `$table` ");
                while ($row = $res->fetch_assoc()) {
                    $keys = array_keys($row);
                    $values = array_map(function ($val) use ($db) {
                        if ($val === null)
                            return "NULL";
                        return "'" . $db->real_escape_string($val) . "'";
                    }, array_values($row));
                    $sql .= "INSERT INTO `$table` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $values) . ");\n";
                }
            }
            $sql .= "\n\nSET FOREIGN_KEY_CHECKS=1;\n";

            $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
            $filePath = $this->backupDir . '/' . $filename;

            if (file_put_contents($filePath, $sql)) {
                // Rotation
                $this->cleanOldBackups();

                return [
                    'success' => true,
                    'message' => 'Backup created successfully',
                    'data' => [
                        'filename' => $filename,
                        'size' => strlen($sql)
                    ]
                ];
            }

            return ['success' => false, 'error' => 'Failed to write backup file'];

        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Download a specific backup
     */
    public function download($filename)
    {
        $filename = basename($filename); // Security: prevent directory traversal
        $filePath = $this->backupDir . '/' . $filename;

        if (!file_exists($filePath)) {
            http_response_code(404);
            return ['success' => false, 'error' => 'Backup file not found'];
        }

        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        exit;
    }

    private function cleanOldBackups()
    {
        $files = glob($this->backupDir . '/backup_*.sql');
        if (count($files) <= 5)
            return;

        usort($files, function ($a, $b) {
            return filemtime($b) - filemtime($a);
        });

        foreach (array_slice($files, 5) as $file) {
            @unlink($file);
        }
    }
}
