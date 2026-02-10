<?php
require_once __DIR__ . '/../config/database.php';

class ExchangeRateController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Get current active exchange rate
     */
    public function getCurrent() {
        try {
            $query = "SELECT id, currency_from, currency_to, rate, date, created_at, updated_at 
                      FROM exchange_rates 
                      WHERE is_active = 1 
                      AND currency_from = 'USD' 
                      AND currency_to = 'MXN'
                      ORDER BY date DESC 
                      LIMIT 1";
            
            $result = $this->conn->query($query);
            
            if ($result && $result->num_rows > 0) {
                $rate = $result->fetch_assoc();
                return $this->successResponse($rate);
            }
            
            // If no active rate, return default
            return $this->successResponse([
                'currency_from' => 'USD',
                'currency_to' => 'MXN',
                'rate' => '17.50',
                'date' => date('Y-m-d'),
                'is_default' => true
            ]);
            
        } catch (Exception $e) {
            error_log("Error getting current exchange rate: " . $e->getMessage());
            return $this->errorResponse('Failed to get exchange rate', 500);
        }
    }

    /**
     * Update current exchange rate (admin only)
     */
    public function update($data) {
        try {
            // Validate
            if (!isset($data['rate']) || !is_numeric($data['rate']) || $data['rate'] <= 0) {
                return $this->errorResponse('Valid rate is required', 400);
            }

            $rate = (float)$data['rate'];
            $date = isset($data['date']) ? $data['date'] : date('Y-m-d');
            $currencyFrom = $data['currency_from'] ?? 'USD';
            $currencyTo = $data['currency_to'] ?? 'MXN';

            // Start transaction
            $this->conn->begin_transaction();

            try {
                // Deactivate all previous rates for this currency pair
                $stmt = $this->conn->prepare("UPDATE exchange_rates 
                                              SET is_active = 0 
                                              WHERE currency_from = ? 
                                              AND currency_to = ?");
                $stmt->bind_param('ss', $currencyFrom, $currencyTo);
                $stmt->execute();
                $stmt->close();

                // Insert new rate or update existing for this date
                $stmt = $this->conn->prepare("INSERT INTO exchange_rates 
                                              (currency_from, currency_to, rate, date, is_active) 
                                              VALUES (?, ?, ?, ?, 1)
                                              ON DUPLICATE KEY UPDATE 
                                              rate = VALUES(rate),
                                              is_active = 1");
                $stmt->bind_param('ssds', $currencyFrom, $currencyTo, $rate, $date);
                $stmt->execute();
                $stmt->close();

                // Commit transaction
                $this->conn->commit();

                return $this->successResponse([
                    'message' => 'Exchange rate updated successfully',
                    'rate' => $rate,
                    'date' => $date,
                    'currency_from' => $currencyFrom,
                    'currency_to' => $currencyTo
                ]);

            } catch (Exception $e) {
                $this->conn->rollback();
                throw $e;
            }

        } catch (Exception $e) {
            error_log("Error updating exchange rate: " . $e->getMessage());
            return $this->errorResponse('Failed to update exchange rate', 500);
        }
    }

    /**
     * Get exchange rate history
     */
    public function getHistory($limit = 30) {
        try {
            $limit = min((int)$limit, 365); // Max 1 year
            
            $stmt = $this->conn->prepare("SELECT id, currency_from, currency_to, rate, date, is_active, created_at 
                                          FROM exchange_rates 
                                          WHERE currency_from = 'USD' 
                                          AND currency_to = 'MXN'
                                          ORDER BY date DESC 
                                          LIMIT ?");
            $stmt->bind_param('i', $limit);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $history = [];
            while ($row = $result->fetch_assoc()) {
                $history[] = $row;
            }
            $stmt->close();
            
            return $this->successResponse([
                'history' => $history,
                'total' => count($history)
            ]);
            
        } catch (Exception $e) {
            error_log("Error getting exchange rate history: " . $e->getMessage());
            return $this->errorResponse('Failed to get history', 500);
        }
    }

    private function successResponse($data) {
        return [
            'success' => true,
            'data' => $data
        ];
    }

    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        return [
            'success' => false,
            'error' => $message
        ];
    }
}
