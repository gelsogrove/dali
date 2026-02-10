<?php

class ContactController {
    private $toEmail;
    private $fromEmail;
    private $fromName;
    private $allowedOrigins;
    private $allowedHosts;
    private $rateLimit;
    private $rateWindow;
    private $emailRateLimit;
    private $emailRateWindow;
    private $minSeconds;

    public function __construct() {
        $this->toEmail = getenv('CONTACT_TO_EMAIL') ?: 'dalila@buywithdali.com';
        $this->fromEmail = getenv('CONTACT_FROM_EMAIL') ?: 'no-reply@buywithdali.com';
        $this->fromName = getenv('CONTACT_FROM_NAME') ?: 'Buy With Dali';
        $this->allowedOrigins = $this->normalizeOrigins(getenv('CONTACT_ALLOWED_ORIGINS'));
        if (empty($this->allowedOrigins)) {
            $this->allowedOrigins = [
                'https://buywithdali.com',
                'https://www.buywithdali.com',
            ];
        }
        $this->allowedHosts = $this->extractHosts($this->allowedOrigins);
        $this->rateLimit = max(1, (int)(getenv('CONTACT_RATE_LIMIT') ?: 3));
        $this->rateWindow = max(60, (int)(getenv('CONTACT_RATE_WINDOW') ?: 60));
        $this->emailRateLimit = max(1, (int)(getenv('CONTACT_EMAIL_RATE_LIMIT') ?: 3));
        $this->emailRateWindow = max(60, (int)(getenv('CONTACT_EMAIL_RATE_WINDOW') ?: 60));
        $this->minSeconds = max(1, (int)(getenv('CONTACT_MIN_SECONDS') ?: 3));
    }

    public function send($data) {
        if (!$this->isAllowedOrigin()) {
            return $this->errorResponse('Not allowed', 403);
        }

        if (!is_array($data)) {
            $data = [];
        }

        if (!empty($data['company'])) {
            return $this->successResponse(['message' => 'ok']);
        }

        $firstNameRaw = trim((string)($data['firstName'] ?? ''));
        $lastNameRaw = trim((string)($data['lastName'] ?? ''));
        $emailRaw = trim((string)($data['email'] ?? ''));
        $phoneRaw = trim((string)($data['phone'] ?? ''));
        $messageRaw = trim((string)($data['message'] ?? ''));

        if (!$this->isWithinLength($firstNameRaw, 2, 100)) {
            return $this->errorResponse('Invalid first name', 400);
        }
        if (!$this->isWithinLength($lastNameRaw, 2, 100)) {
            return $this->errorResponse('Invalid last name', 400);
        }
        if (!$this->isWithinLength($emailRaw, 5, 254)) {
            return $this->errorResponse('Invalid email', 400);
        }
        if ($phoneRaw !== '' && (!$this->isWithinLength($phoneRaw, 5, 40) || !$this->isValidPhone($phoneRaw))) {
            return $this->errorResponse('Invalid phone number', 400);
        }
        if ($messageRaw !== '' && !$this->isWithinLength($messageRaw, 1, 2000)) {
            return $this->errorResponse('Invalid message length', 400);
        }

        $firstName = $this->sanitizeText($firstNameRaw, 100);
        $lastName = $this->sanitizeText($lastNameRaw, 100);
        $email = $this->sanitizeText($emailRaw, 254);
        $phone = $this->sanitizeText($phoneRaw, 40);
        $message = $this->sanitizeMessage($messageRaw, 2000);
        $page = $this->sanitizeText($data['page'] ?? '', 300);
        $source = $this->sanitizeText($data['source'] ?? '', 80);
        $propertyTitle = $this->sanitizeText($data['propertyTitle'] ?? '', 200);
        $propertySlug = $this->sanitizeText($data['propertySlug'] ?? '', 120);
        $propertyId = $this->sanitizeText($data['propertyId'] ?? '', 40);
        $propertyPrice = $this->sanitizeText($data['propertyPrice'] ?? '', 60);
        $propertyUrl = $this->sanitizeText($data['propertyUrl'] ?? '', 300);
        $purposeRaw = trim((string)($data['purpose'] ?? ''));
        $preferredContactRaw = trim((string)($data['preferredContact'] ?? ''));
        $knowsRivieraRaw = trim((string)($data['knowsRiviera'] ?? ''));
        $budgetRangeRaw = trim((string)($data['budgetRange'] ?? ''));
        $availability1Raw = trim((string)($data['availability1'] ?? ''));
        $availability2Raw = trim((string)($data['availability2'] ?? ''));

        if ($purposeRaw !== '' && !$this->isWithinLength($purposeRaw, 1, 200)) {
            return $this->errorResponse('Invalid purpose', 400);
        }
        if ($preferredContactRaw !== '' && !$this->isWithinLength($preferredContactRaw, 1, 80)) {
            return $this->errorResponse('Invalid preferred contact', 400);
        }
        if ($knowsRivieraRaw !== '' && !$this->isWithinLength($knowsRivieraRaw, 1, 80)) {
            return $this->errorResponse('Invalid response', 400);
        }
        if ($budgetRangeRaw !== '' && !$this->isWithinLength($budgetRangeRaw, 1, 120)) {
            return $this->errorResponse('Invalid budget range', 400);
        }
        if ($availability1Raw !== '' && !$this->isWithinLength($availability1Raw, 1, 60)) {
            return $this->errorResponse('Invalid availability', 400);
        }
        if ($availability2Raw !== '' && !$this->isWithinLength($availability2Raw, 1, 60)) {
            return $this->errorResponse('Invalid availability', 400);
        }

        $purpose = $this->sanitizeText($purposeRaw, 200);
        $preferredContact = $this->sanitizeText($preferredContactRaw, 80);
        $knowsRiviera = $this->sanitizeText($knowsRivieraRaw, 80);
        $budgetRange = $this->sanitizeText($budgetRangeRaw, 120);
        $availability1 = $this->sanitizeText($availability1Raw, 60);
        $availability2 = $this->sanitizeText($availability2Raw, 60);

        if ($firstName === '' || $lastName === '' || $email === '') {
            return $this->errorResponse('Missing required fields', 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->errorResponse('Invalid email', 400);
        }

        if (!$this->passesTimeCheck($data['ts'] ?? null)) {
            return $this->errorResponse('Invalid submission', 400);
        }

        $ip = $this->getClientIp();
        if ($ip && !$this->checkRateLimit($ip, $this->rateLimit, $this->rateWindow)) {
            return $this->errorResponse('Too many requests', 429);
        }
        if (!$this->checkRateLimit('email:' . strtolower($email), $this->emailRateLimit, $this->emailRateWindow)) {
            return $this->errorResponse('Too many requests', 429);
        }

        $subject = 'New contact request - ' . trim($firstName . ' ' . $lastName);
        $subject = $this->encodeHeader($subject);

        $bodyLines = [
            "New contact request from BuyWithDali.com",
            "",
            "Name: {$firstName} {$lastName}",
            "Email: {$email}",
            "Phone: " . ($phone !== '' ? $phone : 'N/A'),
            "Message:",
            $message !== '' ? $message : 'N/A',
            "",
        ];

        $metaLines = [];

        if ($source !== '') {
            $metaLines[] = "Source: {$source}";
        }

        $hasProperty = $propertyTitle !== '' || $propertySlug !== '' || $propertyId !== '' || $propertyPrice !== '' || $propertyUrl !== '';
        if ($hasProperty) {
            $metaLines = array_merge($metaLines, [
                "Property: " . ($propertyTitle !== '' ? $propertyTitle : 'N/A'),
                "Property Slug: " . ($propertySlug !== '' ? $propertySlug : 'N/A'),
                "Property ID: " . ($propertyId !== '' ? $propertyId : 'N/A'),
                "Property Price: " . ($propertyPrice !== '' ? $propertyPrice : 'N/A'),
                "Property URL: " . ($propertyUrl !== '' ? $propertyUrl : 'N/A'),
            ]);
        }

        if ($purpose !== '') {
            $metaLines[] = "Purpose: {$purpose}";
        }
        if ($preferredContact !== '') {
            $metaLines[] = "Preferred Contact: {$preferredContact}";
        }
        if ($knowsRiviera !== '') {
            $metaLines[] = "Knows Riviera Maya: {$knowsRiviera}";
        }
        if ($budgetRange !== '') {
            $metaLines[] = "Budget Range: {$budgetRange}";
        }
        if ($availability1 !== '') {
            $metaLines[] = "Availability 1: {$availability1}";
        }
        if ($availability2 !== '') {
            $metaLines[] = "Availability 2: {$availability2}";
        }

        if (!empty($metaLines)) {
            $bodyLines = array_merge($bodyLines, $metaLines, [""]);
        }

        $bodyLines = array_merge($bodyLines, [
            "Page: " . ($page !== '' ? $page : 'N/A'),
            "IP: " . ($ip ?: 'N/A'),
            "User Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'N/A'),
            "Time: " . date('c'),
        ]);
        $body = implode("\n", $bodyLines);

        $fromName = $this->sanitizeHeaderValue($this->fromName);
        $fromEmail = $this->sanitizeHeaderValue($this->fromEmail);
        $replyTo = $this->sanitizeHeaderValue($email);

        $headers = [
            'From: ' . $this->formatAddress($fromEmail, $fromName),
            'Reply-To: ' . $replyTo,
            'Content-Type: text/plain; charset=UTF-8',
            'X-Mailer: PHP/' . phpversion(),
        ];

        $sent = @mail($this->toEmail, $subject, $body, implode("\r\n", $headers));

        if (!$sent) {
            error_log('Contact email failed for ' . $email);
            return $this->errorResponse('Unable to send message', 500);
        }

        return $this->successResponse(['message' => 'Message sent']);
    }

    private function passesTimeCheck($ts) {
        if ($ts === null || $ts === '') {
            return true;
        }

        $timestamp = (int)$ts;
        if ($timestamp > 1000000000000) {
            $timestamp = (int)round($timestamp / 1000);
        }

        if ($timestamp <= 0) {
            return false;
        }

        $now = time();
        $elapsed = $now - $timestamp;
        if ($elapsed < $this->minSeconds) {
            return false;
        }

        return $elapsed <= (int)(getenv('CONTACT_MAX_SECONDS') ?: 14400);
    }

    private function isAllowedOrigin() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? '';

        if ($origin === '' && $referer === '') {
            return false;
        }

        $source = $origin !== '' ? $origin : $referer;
        $parsed = parse_url($source);
        if (!$parsed || empty($parsed['host'])) {
            return false;
        }

        $host = strtolower($parsed['host']);
        $normalizedOrigin = '';
        if (!empty($parsed['scheme'])) {
            $normalizedOrigin = strtolower($parsed['scheme'] . '://' . $host . (isset($parsed['port']) ? ':' . $parsed['port'] : ''));
        }

        if ($origin !== '' && $normalizedOrigin !== '' && in_array($normalizedOrigin, $this->allowedOrigins, true)) {
            return true;
        }

        return in_array($host, $this->allowedHosts, true);
    }

    private function normalizeOrigins($value) {
        if (!$value) {
            return [];
        }
        $parts = array_map('trim', explode(',', $value));
        $parts = array_filter($parts, function ($part) {
            return $part !== '';
        });
        $normalized = [];
        foreach ($parts as $part) {
            $part = rtrim($part, '/');
            $normalized[] = strtolower($part);
        }
        return array_values(array_unique($normalized));
    }

    private function extractHosts($origins) {
        $hosts = [];
        foreach ($origins as $origin) {
            if (strpos($origin, '://') !== false) {
                $host = parse_url($origin, PHP_URL_HOST);
                if ($host) {
                    $hosts[] = strtolower($host);
                }
            } else {
                $hosts[] = strtolower($origin);
            }
        }
        return array_values(array_unique($hosts));
    }

    private function isWithinLength($value, $min, $max) {
        $length = function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
        return $length >= $min && $length <= $max;
    }

    private function isValidPhone($value) {
        return (bool)preg_match('/^[0-9+().\-\s]+$/', $value);
    }

    private function checkRateLimit($key, $limit, $windowSeconds) {
        $dir = sys_get_temp_dir() . '/buywithdali_contact';
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            return true;
        }

        $hash = hash('sha256', $key);
        $file = $dir . '/' . $hash . '.json';
        $now = time();
        $windowStart = $now - $windowSeconds;

        $fp = @fopen($file, 'c+');
        if (!$fp) {
            return true;
        }

        if (!flock($fp, LOCK_EX)) {
            fclose($fp);
            return true;
        }

        $contents = stream_get_contents($fp);
        $timestamps = $contents ? json_decode($contents, true) : [];
        if (!is_array($timestamps)) {
            $timestamps = [];
        }

        $timestamps = array_values(array_filter($timestamps, function ($t) use ($windowStart) {
            return is_int($t) && $t >= $windowStart;
        }));

        if (count($timestamps) >= $limit) {
            flock($fp, LOCK_UN);
            fclose($fp);
            return false;
        }

        $timestamps[] = $now;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($timestamps));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        return true;
    }

    private function getClientIp() {
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $ip = trim($parts[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }

        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        if ($ip && filter_var($ip, FILTER_VALIDATE_IP)) {
            return $ip;
        }

        return null;
    }

    private function sanitizeText($value, $maxLen) {
        $value = trim((string)$value);
        $value = strip_tags($value);
        $value = preg_replace('/\s+/', ' ', $value);
        return $this->limitString($value, $maxLen);
    }

    private function sanitizeMessage($value, $maxLen) {
        $value = trim((string)$value);
        $value = strip_tags($value);
        $value = preg_replace("/\r\n|\r/", "\n", $value);
        return $this->limitString($value, $maxLen);
    }

    private function limitString($value, $maxLen) {
        if (function_exists('mb_substr')) {
            return mb_substr($value, 0, $maxLen);
        }
        return substr($value, 0, $maxLen);
    }

    private function sanitizeHeaderValue($value) {
        $value = trim((string)$value);
        return preg_replace("/[\r\n]+/", ' ', $value);
    }

    private function encodeHeader($value) {
        if (function_exists('mb_encode_mimeheader')) {
            return mb_encode_mimeheader($value, 'UTF-8');
        }
        return $value;
    }

    private function formatAddress($email, $name) {
        if ($name === '') {
            return $email;
        }
        return $name . ' <' . $email . '>';
    }

    private function successResponse($data, $code = 200) {
        http_response_code($code);
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
