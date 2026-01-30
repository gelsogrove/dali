<?php

class UploadController {
    private $uploadDir;
    
    // Configurazioni upload - definite direttamente nel codice
    private $allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    private $allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
    private $maxImageSize = 5242880; // 5MB (5 * 1024 * 1024 bytes)
    private $maxVideoSize = 104857600; // 100MB (100 * 1024 * 1024 bytes)

    public function __construct() {
        // Prefer an uploads folder inside the webroot to avoid permission issues on /var/www
        $this->uploadDir = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/uploads';
        
        // Create upload directories if they don't exist
        $legacyDirs = ['properties', 'videos', 'galleries', 'temp', 'blogs'];
        $imageDirs = ['images', 'images/blog', 'images/video', 'images/properties', 'images/city', 'images/area'];
        $dirs = array_merge($legacyDirs, $imageDirs);
        foreach ($dirs as $dir) {
            $path = $this->uploadDir . '/' . $dir;
            if (!is_dir($path)) {
                mkdir($path, 0755, true);
            }
        }
    }

    /**
     * Upload property image with optimization
     * @param array $file Uploaded file
     * @return array
     */
    public function uploadPropertyImage($file) {
        try {
            // Validate file
            $validation = $this->validateImageUpload($file);
            if (!$validation['success']) {
                return $validation;
            }

            $originalName = $file['name'];
            $tempPath = $file['tmp_name'];
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            
            // Generate unique filename with timestamp + random + slug
            $filename = $this->generateUniqueFilename($extension, 'property', $originalName);
            $basePath = $this->uploadDir . '/images/properties';

            // Create image versions
            $versions = [
                'original' => ['width' => 1920, 'quality' => 90],
                'large' => ['width' => 1200, 'quality' => 85],
                'medium' => ['width' => 800, 'quality' => 80],
                'thumbnail' => ['width' => 400, 'quality' => 75]
            ];

            $urls = [];
            
            foreach ($versions as $version => $settings) {
                $versionFilename = $version === 'original' 
                    ? $filename 
                    : str_replace(".{$extension}", "_{$version}.{$extension}", $filename);
                
                $destinationPath = $basePath . '/' . $versionFilename;
                
                // Resize and optimize image
                $result = $this->resizeImage(
                    $tempPath,
                    $destinationPath,
                    $settings['width'],
                    $settings['quality']
                );

                if (!$result) {
                    // Cleanup on failure
                    $this->cleanupFiles($urls);
                    return $this->errorResponse('Failed to process image');
                }

                $urls[$version] = '/uploads/images/properties/' . $versionFilename;
            }

            return $this->successResponse([
                'filename' => $filename,
                'url' => $urls['original'],
                'urls' => $urls,
                'size' => filesize($basePath . '/' . $filename),
                'dimensions' => getimagesize($basePath . '/' . $filename)
            ], 201);

        } catch (Exception $e) {
            error_log("Upload error: " . $e->getMessage());
            return $this->errorResponse('An error occurred during upload');
        }
    }

    /**
     * Upload video file
     * @param array $file Uploaded file
     * @return array
     */
    public function uploadVideo($file) {
        try {
            // Validate file
            if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
                return $this->errorResponse('No file uploaded or upload error occurred');
            }

            if (!in_array($file['type'], $this->allowedVideoTypes)) {
                return $this->errorResponse('Invalid video file type. Allowed: MP4, MPEG, MOV');
            }

            if ($file['size'] > $this->maxVideoSize) {
                return $this->errorResponse('Video file is too large. Maximum size: 100MB');
            }

            $originalName = $file['name'];
            $tempPath = $file['tmp_name'];
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            
            // Generate unique filename with timestamp + random + slug
            $filename = $this->generateUniqueFilename($extension, 'video', $originalName);
            $destinationPath = $this->uploadDir . '/videos/' . $filename;

            // Move uploaded file
            if (!move_uploaded_file($tempPath, $destinationPath)) {
                return $this->errorResponse('Failed to save video file');
            }

            // Generate thumbnail from video (requires FFmpeg - optional)
            $thumbnailUrl = null;
            if (function_exists('exec')) {
                $thumbnailUrl = $this->generateVideoThumbnail($destinationPath);
            }

            return $this->successResponse([
                'filename' => $filename,
                'url' => '/uploads/videos/' . $filename,
                'thumbnail_url' => $thumbnailUrl,
                'size' => filesize($destinationPath)
            ], 201);

        } catch (Exception $e) {
            error_log("Video upload error: " . $e->getMessage());
            return $this->errorResponse('An error occurred during video upload');
        }
    }

    /**
     * Upload thumbnail for videos
     * @param array $file Uploaded file
     * @return array
     */
    public function uploadVideoImage($file) {
        try {
            $validation = $this->validateImageUpload($file);
            if (!$validation['success']) {
                return $validation;
            }

            $originalName = $file['name'];
            $tempPath = $file['tmp_name'];
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

            $filename = $this->generateUniqueFilename($extension, 'video-thumb', $originalName);
            $basePath = $this->uploadDir . '/images/video';

            $versions = [
                'original' => ['width' => 1600, 'quality' => 90],
                'large' => ['width' => 1200, 'quality' => 85],
                'thumbnail' => ['width' => 600, 'quality' => 80]
            ];

            $urls = [];

            foreach ($versions as $version => $settings) {
                $versionFilename = $version === 'original'
                    ? $filename
                    : str_replace(".{$extension}", "_{$version}.{$extension}", $filename);

                $destinationPath = $basePath . '/' . $versionFilename;

                $result = $this->resizeImage(
                    $tempPath,
                    $destinationPath,
                    $settings['width'],
                    $settings['quality']
                );

                if (!$result) {
                    $this->cleanupFiles($urls);
                    return $this->errorResponse('Failed to process image');
                }

                $urls[$version] = '/uploads/images/video/' . $versionFilename;
            }

            return $this->successResponse([
                'filename' => $filename,
                'url' => $urls['original'],
                'urls' => $urls,
                'size' => filesize($basePath . '/' . $filename)
            ], 201);
        } catch (Exception $e) {
            error_log("Upload video image error: " . $e->getMessage());
            return $this->errorResponse('An error occurred during upload');
        }
    }

    /**
     * Validate image upload
     * @param array $file Uploaded file
     * @return array
     */
    private function validateImageUpload($file) {
        if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
            return $this->errorResponse('No file uploaded or upload error occurred');
        }

        // Check file type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, $this->allowedImageTypes)) {
            return $this->errorResponse('Invalid image file type. Allowed: JPEG, PNG, WebP');
        }

        // Check file size
        if ($file['size'] > $this->maxImageSize) {
            return $this->errorResponse('Image file is too large. Maximum size: 10MB');
        }

        // Verify it's actually an image
        $imageInfo = getimagesize($file['tmp_name']);
        if (!$imageInfo) {
            return $this->errorResponse('File is not a valid image');
        }

        return ['success' => true];
    }

    /**
     * Resize and optimize image
     * @param string $sourcePath Source file path
     * @param string $destinationPath Destination file path
     * @param int $maxWidth Maximum width
     * @param int $quality JPEG quality
     * @return bool
     */
    private function resizeImage($sourcePath, $destinationPath, $maxWidth, $quality) {
        $imageInfo = getimagesize($sourcePath);
        if (!$imageInfo) {
            return false;
        }

        list($originalWidth, $originalHeight, $imageType) = $imageInfo;

        // Calculate new dimensions
        if ($originalWidth <= $maxWidth) {
            $newWidth = $originalWidth;
            $newHeight = $originalHeight;
        } else {
            $newWidth = $maxWidth;
            $newHeight = ($originalHeight / $originalWidth) * $maxWidth;
        }

        // Create source image
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                $sourceImage = imagecreatefromjpeg($sourcePath);
                break;
            case IMAGETYPE_PNG:
                $sourceImage = imagecreatefrompng($sourcePath);
                break;
            case IMAGETYPE_WEBP:
                $sourceImage = imagecreatefromwebp($sourcePath);
                break;
            default:
                return false;
        }

        if (!$sourceImage) {
            return false;
        }

        // Create new image
        $newImage = imagecreatetruecolor($newWidth, $newHeight);

        // Preserve transparency for PNG and WebP
        if ($imageType === IMAGETYPE_PNG || $imageType === IMAGETYPE_WEBP) {
            imagealphablending($newImage, false);
            imagesavealpha($newImage, true);
            $transparent = imagecolorallocatealpha($newImage, 255, 255, 255, 127);
            imagefilledrectangle($newImage, 0, 0, $newWidth, $newHeight, $transparent);
        }

        // Resize image
        imagecopyresampled(
            $newImage, $sourceImage,
            0, 0, 0, 0,
            $newWidth, $newHeight,
            $originalWidth, $originalHeight
        );

        // Save image
        $result = false;
        $extension = pathinfo($destinationPath, PATHINFO_EXTENSION);
        
        switch (strtolower($extension)) {
            case 'jpg':
            case 'jpeg':
                $result = imagejpeg($newImage, $destinationPath, $quality);
                break;
            case 'png':
                $result = imagepng($newImage, $destinationPath, 9 - floor($quality / 10));
                break;
            case 'webp':
                $result = imagewebp($newImage, $destinationPath, $quality);
                break;
        }

        // Free memory
        imagedestroy($sourceImage);
        imagedestroy($newImage);

        return $result;
    }

    /**
     * Generate unique filename
     * @param string $extension File extension
     * @return string
     */
    private function generateUniqueFilename($extension, $prefix = 'file', $originalName = '') {
        $timestamp = time();
        try {
            $random = bin2hex(random_bytes(4));
        } catch (Exception $e) {
            $random = uniqid();
        }
        $base = '';

        if (!empty($originalName)) {
            $base = preg_replace('/[^a-z0-9]+/i', '-', pathinfo($originalName, PATHINFO_FILENAME));
            $base = trim($base, '-');
        }

        $parts = [$prefix, $timestamp, $random];
        if (!empty($base)) {
            $parts[] = $base;
        }

        return implode('-', $parts) . '.' . $extension;
    }

    /**
     * Generate video thumbnail (requires FFmpeg)
     * @param string $videoPath Video file path
     * @return string|null Thumbnail URL
     */
    private function generateVideoThumbnail($videoPath) {
        $thumbnailFilename = pathinfo($videoPath, PATHINFO_FILENAME) . '_thumb.jpg';
        $thumbnailPath = $this->uploadDir . '/images/video/' . $thumbnailFilename;

        // Use FFmpeg to generate thumbnail at 2 seconds
        $command = "ffmpeg -i " . escapeshellarg($videoPath) . " -ss 00:00:02 -vframes 1 -q:v 2 " . escapeshellarg($thumbnailPath) . " 2>&1";
        
        exec($command, $output, $returnCode);

        if ($returnCode === 0 && file_exists($thumbnailPath)) {
            return '/uploads/images/video/' . $thumbnailFilename;
        }

        return null;
    }

    /**
     * Cleanup files on error
     * @param array $urls Array of file URLs to delete
     */
    private function cleanupFiles($urls) {
        foreach ($urls as $url) {
            $path = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/' . ltrim($url, '/');
            if (file_exists($path)) {
                unlink($path);
            }
        }
    }

    /**
     * Upload blog image
     * @param array $file Uploaded file
     * @return array
     */
    public function uploadBlogImage($file) {
        try {
            // Validate file
            $validation = $this->validateImageUpload($file);
            if (!$validation['success']) {
                return $validation;
            }

            $originalName = $file['name'];
            $tempPath = $file['tmp_name'];
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            
            // Generate unique filename with timestamp + random + slug
            $filename = $this->generateUniqueFilename($extension, 'blog', $originalName);
            $basePath = $this->uploadDir . '/images/blog';

            // Create image versions for blog
            $versions = [
                'original' => ['width' => 1920, 'quality' => 90],
                'medium' => ['width' => 800, 'quality' => 80],
                'thumbnail' => ['width' => 400, 'quality' => 75]
            ];

            $urls = [];
            
            foreach ($versions as $version => $settings) {
                $versionFilename = $version === 'original' 
                    ? $filename 
                    : str_replace(".{$extension}", "_{$version}.{$extension}", $filename);
                
                $destinationPath = $basePath . '/' . $versionFilename;
                
                // Resize and optimize image
                $result = $this->resizeImage(
                    $tempPath,
                    $destinationPath,
                    $settings['width'],
                    $settings['quality']
                );

                if (!$result) {
                    // Cleanup on failure
                    $this->cleanupFiles($urls);
                    return $this->errorResponse('Failed to process image');
                }

                $urls[$version] = '/uploads/images/blog/' . $versionFilename;
            }

        return $this->successResponse([
            'filename' => $filename,
            'url' => $urls['original'],
            'urls' => $urls,
            'size' => filesize($basePath . '/' . $filename)
        ], 201);

    } catch (Exception $e) {
        error_log("Upload blog image error: " . $e->getMessage());
        return $this->errorResponse('An error occurred during upload');
    }
}

    /**
     * Upload city image (cover/content) stored under /uploads/images/city
     */
    public function uploadCityImage($file) {
        return $this->uploadGenericImage($file, 'city');
    }

    /**
     * Upload area image (cover/content) stored under /uploads/images/area
     */
    public function uploadAreaImage($file) {
        return $this->uploadGenericImage($file, 'area');
    }

    /**
     * Generic image upload for city/area
     */
    private function uploadGenericImage($file, $folder) {
        try {
            $validation = $this->validateImageUpload($file);
            if (!$validation['success']) {
                return $validation;
            }

            $originalName = $file['name'];
            $tempPath = $file['tmp_name'];
            $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

            $filename = $this->generateUniqueFilename($extension, $folder, $originalName);
            $basePath = $this->uploadDir . '/images/' . $folder;

            $versions = [
                'original' => ['width' => 1920, 'quality' => 90],
                'medium' => ['width' => 800, 'quality' => 80],
                'thumbnail' => ['width' => 400, 'quality' => 75]
            ];

            $urls = [];

            foreach ($versions as $version => $settings) {
                $versionFilename = $version === 'original'
                    ? $filename
                    : str_replace(".{$extension}", "_{$version}.{$extension}", $filename);

                $destinationPath = $basePath . '/' . $versionFilename;

                $result = $this->resizeImage(
                    $tempPath,
                    $destinationPath,
                    $settings['width'],
                    $settings['quality']
                );

                if (!$result) {
                    $this->cleanupFiles($urls);
                    return $this->errorResponse('Failed to process image');
                }

                $urls[$version] = "/uploads/images/{$folder}/" . $versionFilename;
            }

            return $this->successResponse([
                'filename' => $filename,
                'url' => $urls['original'],
                'urls' => $urls,
                'size' => filesize($basePath . '/' . $filename)
            ], 201);

        } catch (Exception $e) {
            error_log("Upload {$folder} image error: " . $e->getMessage());
            return $this->errorResponse('An error occurred during upload');
        }
    }

    /**
     * Delete uploaded file
     * @param string $url File URL
     * @return array
     */
    public function deleteFile($url) {
        try {
            if (empty($url)) {
                return $this->errorResponse('File URL is required', 400);
            }

            // If absolute URL, strip scheme/host and keep path
            if (preg_match('#^https?://#i', $url)) {
                $parts = parse_url($url);
                $url = $parts['path'] ?? '';
            }

            // Remove leading slash if present
            $url = ltrim($url, '/');

            // Base dir = document root; $url already includes "uploads/..."
            $baseDir = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/';
            $fullPath = $baseDir . $url;

            if (!file_exists($fullPath)) {
                return $this->errorResponse('File not found', 404);
            }

            // Get file info
            $pathInfo = pathinfo($fullPath);
            $extension = strtolower($pathInfo['extension']);
            $filename = $pathInfo['filename'];
            $directory = $pathInfo['dirname'];

            // Delete original file
            if (!unlink($fullPath)) {
                return $this->errorResponse('Failed to delete file');
            }

            // Delete related versions (thumbnail, medium, etc.)
            $relatedFiles = glob($directory . '/' . $filename . '_*.' . $extension);
            foreach ($relatedFiles as $relatedFile) {
                if (file_exists($relatedFile)) {
                    unlink($relatedFile);
                }
            }

            return $this->successResponse(['message' => 'File deleted successfully']);

        } catch (Exception $e) {
            error_log("Delete file error: " . $e->getMessage());
            return $this->errorResponse('An error occurred during deletion');
        }
    }

    /**
     * Success response
     */
    private function successResponse($data, $code = 200) {
        http_response_code($code);
        return ['success' => true, 'data' => $data];
    }

    /**
     * Error response
     */
    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        return ['success' => false, 'error' => $message];
    }
}
