<?php
require_once __DIR__ . '/../config/database.php';

class ExchangeRateController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Get current active exchange rate
     */
    public function getCurrent()
    {
        try {
            $currencyFrom = isset($_GET['currency_from']) ? strtoupper(trim($_GET['currency_from'])) : 'USD';
            $currencyTo = isset($_GET['currency_to']) ? strtoupper(trim($_GET['currency_to'])) : 'MXN';

            $query = "SELECT id, currency_from, currency_to, rate, date, created_at, updated_at 
                      FROM exchange_rates 
                      WHERE is_active = 1 
                      AND currency_from = ? 
                      AND currency_to = ?
                      ORDER BY date DESC 
                      LIMIT 1";

            $stmt = $this->conn->prepare($query);
            $stmt->bind_param('ss', $currencyFrom, $currencyTo);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result && $result->num_rows > 0) {
                $rate = $result->fetch_assoc();
                $stmt->close();
                return $this->successResponse($rate);
            }
            $stmt->close();

            // If no active rate, return default
            $defaultRates = [
                'USD_MXN' => '17.50',
                'USD_EUR' => '0.92',
            ];
            $key = $currencyFrom . '_' . $currencyTo;
            $defaultRate = $defaultRates[$key] ?? '1.00';

            return $this->successResponse([
                'currency_from' => $currencyFrom,
                'currency_to' => $currencyTo,
                'rate' => $defaultRate,
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
    public function update($data)
    {
        try {
            // Validate
            if (!isset($data['rate']) || !is_numeric($data['rate']) || $data['rate'] <= 0) {
                return $this->errorResponse('Valid rate is required', 400);
            }

            $rate = (float) $data['rate'];
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

                // Recalculate all property prices with new rates
                $propertiesUpdated = $this->recalculateAllPropertyPrices();

                return $this->successResponse([
                    'message' => 'Exchange rate updated successfully',
                    'rate' => $rate,
                    'date' => $date,
                    'currency_from' => $currencyFrom,
                    'currency_to' => $currencyTo,
                    'properties_updated' => $propertiesUpdated
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
    public function getHistory($limit = 30)
    {
        try {
            $limit = min((int) $limit, 365); // Max 1 year
            $currencyFrom = isset($_GET['currency_from']) ? strtoupper(trim($_GET['currency_from'])) : 'USD';
            $currencyTo = isset($_GET['currency_to']) ? strtoupper(trim($_GET['currency_to'])) : 'MXN';

            $stmt = $this->conn->prepare("SELECT id, currency_from, currency_to, rate, date, is_active, created_at 
                                          FROM exchange_rates 
                                          WHERE currency_from = ? 
                                          AND currency_to = ?
                                          ORDER BY date DESC 
                                          LIMIT ?");
            $stmt->bind_param('ssi', $currencyFrom, $currencyTo, $limit);
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

    private function successResponse($data)
    {
        return [
            'success' => true,
            'data' => $data
        ];
    }

    private function errorResponse($message, $code = 400)
    {
        http_response_code($code);
        return [
            'success' => false,
            'error' => $message
        ];
    }

    /**
     * Refresh exchange rates from Frankfurter (USD base)
     */
    public function refreshFromFrankfurter()
    {
        try {
            // Trigger activity log cleanup (hooked here as it's called on every admin login)
            if (class_exists('AuthController')) {
                $authController = new AuthController();
                $authController->cleanupActivityLog(30, 1000);
            }

            $url = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=MXN,EUR';
            $context = stream_context_create([
                'http' => [
                    'timeout' => 5,
                ],
            ]);
            $raw = file_get_contents($url, false, $context);
            if ($raw === false) {
                return $this->errorResponse('Failed to fetch rates from Frankfurter', 502);
            }

            $data = json_decode($raw, true);
            if (!is_array($data) || empty($data['rates'])) {
                return $this->errorResponse('Invalid response from Frankfurter', 502);
            }

            $date = isset($data['date']) ? $data['date'] : date('Y-m-d');
            $rates = $data['rates'];

            if (!isset($rates['MXN']) || !isset($rates['EUR'])) {
                return $this->errorResponse('Missing required rates from Frankfurter', 502);
            }

            $this->conn->begin_transaction();
            try {
                $this->upsertRate('USD', 'MXN', (float) $rates['MXN'], $date);
                $this->upsertRate('USD', 'EUR', (float) $rates['EUR'], $date);
                $this->conn->commit();
            } catch (Exception $e) {
                $this->conn->rollback();
                throw $e;
            }

            // Recalculate all property prices with new rates
            $propertiesUpdated = $this->recalculateAllPropertyPrices();

            return $this->successResponse([
                'message' => 'Exchange rates refreshed successfully',
                'date' => $date,
                'rates' => [
                    'USD_MXN' => (float) $rates['MXN'],
                    'USD_EUR' => (float) $rates['EUR'],
                ],
                'properties_updated' => $propertiesUpdated
            ]);
        } catch (Exception $e) {
            error_log("Error refreshing exchange rates: " . $e->getMessage());
            return $this->errorResponse('Failed to refresh exchange rates', 500);
        }
    }

    private function upsertRate($currencyFrom, $currencyTo, $rate, $date)
    {
        // Deactivate previous rates for pair
        $stmt = $this->conn->prepare("UPDATE exchange_rates 
                                      SET is_active = 0 
                                      WHERE currency_from = ? 
                                      AND currency_to = ?");
        $stmt->bind_param('ss', $currencyFrom, $currencyTo);
        $stmt->execute();
        $stmt->close();

        // Insert or update for date
        $stmt = $this->conn->prepare("INSERT INTO exchange_rates 
                                      (currency_from, currency_to, rate, date, is_active) 
                                      VALUES (?, ?, ?, ?, 1)
                                      ON DUPLICATE KEY UPDATE 
                                      rate = VALUES(rate),
                                      is_active = 1");
        $stmt->bind_param('ssds', $currencyFrom, $currencyTo, $rate, $date);
        $stmt->execute();
        $stmt->close();
    }

    /**
     * Recalculate all property prices based on current active exchange rates.
     * Updates exchange_rate, price_mxn, price_eur, and development from/to ranges.
     * @return int Number of properties updated
     */
    private function recalculateAllPropertyPrices()
    {
        try {
            // Get current active USD->MXN rate
            $mxnRate = null;
            $stmt = $this->conn->prepare(
                "SELECT rate FROM exchange_rates 
                 WHERE currency_from = 'USD' AND currency_to = 'MXN' AND is_active = 1 
                 ORDER BY date DESC LIMIT 1"
            );
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result && $result->num_rows > 0) {
                $mxnRate = (float) $result->fetch_assoc()['rate'];
            }
            $stmt->close();

            // Get current active USD->EUR rate
            $eurRate = null;
            $stmt = $this->conn->prepare(
                "SELECT rate FROM exchange_rates 
                 WHERE currency_from = 'USD' AND currency_to = 'EUR' AND is_active = 1 
                 ORDER BY date DESC LIMIT 1"
            );
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result && $result->num_rows > 0) {
                $eurRate = (float) $result->fetch_assoc()['rate'];
            }
            $stmt->close();

            if ($mxnRate === null && $eurRate === null) {
                error_log("recalculateAllPropertyPrices: No active rates found, skipping.");
                return 0;
            }

            // Build dynamic UPDATE query
            $setClauses = [];
            $params = [];
            $types = '';

            if ($mxnRate !== null) {
                $setClauses[] = 'exchange_rate = ?';
                $params[] = $mxnRate;
                $types .= 'd';

                $setClauses[] = 'price_mxn = CASE WHEN price_usd IS NOT NULL THEN price_usd * ? ELSE NULL END';
                $params[] = $mxnRate;
                $types .= 'd';

                $setClauses[] = 'price_from_mxn = CASE WHEN price_from_usd IS NOT NULL THEN price_from_usd * ? ELSE NULL END';
                $params[] = $mxnRate;
                $types .= 'd';

                $setClauses[] = 'price_to_mxn = CASE WHEN price_to_usd IS NOT NULL THEN price_to_usd * ? ELSE NULL END';
                $params[] = $mxnRate;
                $types .= 'd';
            }

            if ($eurRate !== null) {
                $setClauses[] = 'price_eur = CASE WHEN price_usd IS NOT NULL THEN price_usd * ? ELSE NULL END';
                $params[] = $eurRate;
                $types .= 'd';

                $setClauses[] = 'price_from_eur = CASE WHEN price_from_usd IS NOT NULL THEN price_from_usd * ? ELSE NULL END';
                $params[] = $eurRate;
                $types .= 'd';

                $setClauses[] = 'price_to_eur = CASE WHEN price_to_usd IS NOT NULL THEN price_to_usd * ? ELSE NULL END';
                $params[] = $eurRate;
                $types .= 'd';
            }

            $sql = "UPDATE properties SET " . implode(', ', $setClauses);
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $affected = $stmt->affected_rows;
            $stmt->close();

            error_log("recalculateAllPropertyPrices: Updated $affected properties (MXN=" . ($mxnRate ?? 'N/A') . ", EUR=" . ($eurRate ?? 'N/A') . ")");

            return $affected;

        } catch (Exception $e) {
            error_log("Error recalculating property prices: " . $e->getMessage());
            return 0;
        }
    }
}
