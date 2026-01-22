<?php

class RedirectService {
    private $conn;

    public function __construct(mysqli $conn) {
        $this->conn = $conn;
    }

    public function normalizeUrl(?string $url): string {
        if ($url === null) {
            return '';
        }
        $url = strtolower(trim($url));
        if ($url === '') {
            return '';
        }

        $parsed = parse_url($url);
        $path = $parsed['path'] ?? $url;
        $path = preg_replace('#//+#', '/', $path);
        $path = rtrim($path, '/');
        if ($path === '') {
            $path = '/';
        }
        return $path;
    }

    public function getAllRules(): array {
        $result = $this->conn->query("SELECT id, urlOld, urlNew, created_at, updated_at FROM redirect ORDER BY id DESC");
        $rules = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $rules[] = $row;
            }
        }
        return $rules;
    }

    public function findByUrlOld(string $urlOld) {
        $normalized = $this->normalizeUrl($urlOld);
        $stmt = $this->conn->prepare("SELECT id, urlOld, urlNew FROM redirect WHERE urlOld = ? LIMIT 1");
        $stmt->bind_param('s', $normalized);
        $stmt->execute();
        $res = $stmt->get_result();
        $stmt->close();
        return $res && $res->num_rows > 0 ? $res->fetch_assoc() : null;
    }

    public function create(string $urlOld, string $urlNew = '') {
        $normalizedOld = $this->normalizeUrl($urlOld);
        $normalizedNew = $this->normalizeUrl($urlNew);

        $this->assertValid($normalizedOld, $normalizedNew, null);

        $stmt = $this->conn->prepare("INSERT INTO redirect (urlOld, urlNew) VALUES (?, ?)");
        $stmt->bind_param('ss', $normalizedOld, $normalizedNew);
        $stmt->execute();
        $id = $this->conn->insert_id;
        $stmt->close();
        return $id;
    }

    public function update(int $id, string $urlOld, string $urlNew) {
        $normalizedOld = $this->normalizeUrl($urlOld);
        $normalizedNew = $this->normalizeUrl($urlNew);

        $this->assertValid($normalizedOld, $normalizedNew, $id);

        $stmt = $this->conn->prepare("UPDATE redirect SET urlOld = ?, urlNew = ? WHERE id = ?");
        $stmt->bind_param('ssi', $normalizedOld, $normalizedNew, $id);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function delete(int $id) {
        $stmt = $this->conn->prepare("DELETE FROM redirect WHERE id = ?");
        $stmt->bind_param('i', $id);
        $ok = $stmt->execute();
        $stmt->close();
        return $ok;
    }

    public function assertValid(string $urlOld, string $urlNew, ?int $excludeId = null) {
        if (empty($urlOld)) {
            throw new Exception('urlOld obbligatorio');
        }

        // urlNew può essere vuoto (da compilare in seguito), ma se presente deve essere diverso
        if ($urlNew !== '' && $urlOld === $urlNew) {
            throw new Exception('urlOld e urlNew non possono coincidere');
        }

        // urlOld unico
        $stmt = $this->conn->prepare("SELECT id FROM redirect WHERE urlOld = ? " . ($excludeId ? "AND id != ?" : "") . " LIMIT 1");
        if ($excludeId) {
            $stmt->bind_param('si', $urlOld, $excludeId);
        } else {
            $stmt->bind_param('s', $urlOld);
        }
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res && $res->num_rows > 0) {
            $stmt->close();
            throw new Exception('urlOld deve essere univoco');
        }
        $stmt->close();

        // urlNew non deve essere un urlOld esistente (loop diretto) se urlNew non è vuoto
        if ($urlNew !== '') {
            $stmt2 = $this->conn->prepare("SELECT id FROM redirect WHERE urlOld = ? " . ($excludeId ? "AND id != ?" : "") . " LIMIT 1");
            if ($excludeId) {
                $stmt2->bind_param('si', $urlNew, $excludeId);
            } else {
                $stmt2->bind_param('s', $urlNew);
            }
            $stmt2->execute();
            $res2 = $stmt2->get_result();
            if ($res2 && $res2->num_rows > 0) {
                $stmt2->close();
                throw new Exception('urlNew esiste già come urlOld (loop diretto)');
            }
            $stmt2->close();
        }

        if ($this->wouldCreateCycle($urlOld, $urlNew, $excludeId)) {
            throw new Exception('La regola creerebbe un loop di redirect');
        }
    }

    public function wouldCreateCycle(string $urlOld, string $urlNew, ?int $excludeId = null): bool {
        if ($urlNew === '') {
            return false;
        }

        $rules = [];
        $query = "SELECT id, urlOld, urlNew FROM redirect";
        $result = $this->conn->query($query);
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                if ($excludeId && (int)$row['id'] === (int)$excludeId) {
                    continue;
                }
                if (empty($row['urlNew'])) {
                    continue;
                }
                $rules[$row['urlOld']] = $row['urlNew'];
            }
        }

        $rules[$urlOld] = $urlNew;

        $visited = [];
        $current = $urlOld;
        while (isset($rules[$current])) {
            $current = $rules[$current];
            if ($current === $urlOld) {
                return true;
            }
            if (isset($visited[$current])) {
                break;
            }
            $visited[$current] = true;
        }

        return false;
    }
}
