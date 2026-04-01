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

    private $operatorEmails;
    private $siteUrl;

    public function __construct() {
        $this->toEmail = getenv('CONTACT_TO_EMAIL') ?: 'dalila@buywithdali.com';
        $this->operatorEmails = [
            'dalila@buywithdali.com',
            'adriana@buywithdali.com',
            'gelsogrove@gmail.com'
        ];
        $this->siteUrl = 'https://buywithdali.com';
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

        // 1. Prepare Operator Email
        $opSubject = 'New Inquiry: ' . ($propertyTitle !== '' ? $propertyTitle : 'General Request') . ' from ' . $firstName . ' ' . $lastName;
        $opSubject = $this->encodeHeader($opSubject);

        $opBodyHtml = "<h2>New Website Inquiry</h2>";
        $opBodyHtml .= "<p>You have received a new message from the website contact form.</p>";
        $opBodyHtml .= "<h3>Contact Information</h3>";
        $opBodyHtml .= "<ul>";
        $opBodyHtml .= "<li><strong>Name:</strong> {$firstName} {$lastName}</li>";
        $opBodyHtml .= "<li><strong>Email:</strong> <a href='mailto:{$email}'>{$email}</a></li>";
        $opBodyHtml .= "<li><strong>Phone:</strong> " . ($phone !== '' ? $phone : 'N/A') . "</li>";
        $opBodyHtml .= "</ul>";

        if ($message !== '') {
            $opBodyHtml .= "<h3>Message</h3>";
            $opBodyHtml .= "<p>" . nl2br($message) . "</p>";
        }

        if ($propertyTitle !== '' || $propertyUrl !== '') {
            $opBodyHtml .= "<h3>Property Interest</h3>";
            $opBodyHtml .= "<ul>";
            if ($propertyTitle !== '') $opBodyHtml .= "<li><strong>Title:</strong> {$propertyTitle}</li>";
            if ($propertyPrice !== '') $opBodyHtml .= "<li><strong>Price:</strong> {$propertyPrice}</li>";
            if ($propertyUrl !== '') $opBodyHtml .= "<li><strong>Link:</strong> <a href='{$propertyUrl}'>View Property</a></li>";
            $opBodyHtml .= "</ul>";
        }

        $opBodyHtml .= "<h3>Additional Details</h3>";
        $opBodyHtml .= "<ul>";
        if ($purpose !== '') $opBodyHtml .= "<li><strong>Purpose:</strong> {$purpose}</li>";
        if ($preferredContact !== '') $opBodyHtml .= "<li><strong>Preferred Contact:</strong> {$preferredContact}</li>";
        if ($knowsRiviera !== '') $opBodyHtml .= "<li><strong>Knows Riviera Maya:</strong> {$knowsRiviera}</li>";
        if ($budgetRange !== '') $opBodyHtml .= "<li><strong>Budget Range:</strong> {$budgetRange}</li>";
        if ($availability1 !== '') $opBodyHtml .= "<li><strong>Availability 1:</strong> {$availability1}</li>";
        if ($availability2 !== '') $opBodyHtml .= "<li><strong>Availability 2:</strong> {$availability2}</li>";
        $opBodyHtml .= "<li><strong>Source Page:</strong> <a href='{$page}'>{$page}</a></li>";
        $opBodyHtml .= "<li><strong>IP Address:</strong> {$ip}</li>";
        $opBodyHtml .= "<li><strong>Time:</strong> " . date('Y-m-d H:i:s T') . "</li>";
        $opBodyHtml .= "</ul>";

        $fullOpHtml = $this->generateHtmlEmail($opSubject, $opBodyHtml);

        // 2. Prepare Customer Email
        $custSubject = "Thank you for contacting Buy With Dali";
        $custSubject = $this->encodeHeader($custSubject);

        $custBodyHtml = "<h2>Hello {$firstName},</h2>";
        $custBodyHtml .= "<p>Thank you for reaching out to us! We have received your inquiry and one of our dedicated real estate experts will get back to you as soon as possible.</p>";
        
        if ($propertyTitle !== '') {
            $custBodyHtml .= "<p>We noticed you are interested in <strong>{$propertyTitle}</strong>. We are preparing all the additional details for you.</p>";
        }

        $custBodyHtml .= "<p>In the meantime, feel free to explore more listings on our website or follow us on our social media channels to stay updated with the latest real estate opportunities in Riviera Maya.</p>";
        $custBodyHtml .= "<p>Best regards,<br><strong>The Buy With Dali Team</strong></p>";

        $fullCustHtml = $this->generateHtmlEmail($custSubject, $custBodyHtml);

        // Common Headers
        $fromName = $this->sanitizeHeaderValue($this->fromName);
        $fromEmail = $this->sanitizeHeaderValue($this->fromEmail);
        $replyTo = $this->sanitizeHeaderValue($email);

        $headers = [
            'From: ' . $this->formatAddress($fromEmail, $fromName),
            'Reply-To: ' . $replyTo,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'X-Mailer: PHP/' . phpversion(),
        ];

        // Send to Operators
        foreach ($this->operatorEmails as $toOp) {
            @mail($toOp, $opSubject, $fullOpHtml, implode("\r\n", $headers));
        }

        // Send to Customer
        @mail($email, $custSubject, $fullCustHtml, implode("\r\n", $headers));

        return $this->successResponse(['message' => 'Message sent']);
    }

    private function generateHtmlEmail($title, $content) {
        $logoUrl = $this->siteUrl . '/images/logo-black.png';
        $siteUrl = $this->siteUrl;
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #eee; }
        .header { padding: 30px; text-align: center; border-bottom: 1px solid #f0f0f0; }
        .header img { max-width: 200px; }
        .content { padding: 40px 30px; }
        .footer { padding: 30px; background: #111; color: #fff; text-align: center; font-size: 13px; }
        .footer a { color: #fff; text-decoration: none; margin: 0 10px; }
        .footer .social { margin-bottom: 20px; }
        .footer .info { opacity: 0.8; line-height: 1.8; }
        h2 { color: #000; margin-top: 0; font-weight: 300; letter-spacing: 1px; }
        h3 { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 30px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
        ul { padding-left: 0; list-style: none; }
        li { margin-bottom: 8px; }
        strong { font-weight: 600; }
        .btn { display: inline-block; padding: 12px 25px; background: #000; color: #fff; text-decoration: none; border-radius: 2px; margin-top: 20px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="{$siteUrl}">
                <img src="{$logoUrl}" alt="Buy With Dali Logo">
            </a>
        </div>
        <div class="content">
            {$content}
        </div>
        <div class="footer">
            <div class="social">
                <a href="https://www.instagram.com/buywithdali/">Instagram</a> |
                <a href="https://www.facebook.com/p/Buy-With-Dali-Real-Estate-100087418732540/">Facebook</a> |
                <a href="https://www.linkedin.com/in/dalilagelsomino">LinkedIn</a> |
                <a href="https://www.youtube.com/@BuyWithDali">YouTube</a>
            </div>
            <div class="info">
                <strong>BUY WITH DALI</strong><br>
                Playa del Carmen, Riviera Maya, Mexico<br>
                <a href="tel:+529841511139">+52 984 151 1139</a><br>
                <a href="mailto:dalila@buywithdali.com">dalila@buywithdali.com</a><br>
                <a href="{$siteUrl}">www.buywithdali.com</a>
            </div>
        </div>
    </div>
</body>
</html>
HTML;
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
