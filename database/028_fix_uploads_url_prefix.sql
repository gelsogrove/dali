-- Update existing URLs to include /api prefix
-- This is needed because the uploads folder is inside the /api directory

-- Update property photos
UPDATE property_photos 
SET url = CONCAT('/api', url) 
WHERE url LIKE '/uploads/%' AND url NOT LIKE '/api/%';

-- Update property attachments
UPDATE property_attachments 
SET url = CONCAT('/api', url) 
WHERE url LIKE '/uploads/%' AND url NOT LIKE '/api/%';

-- Update blog images (column is 'featured_image', not 'cover_image')
UPDATE blogs 
SET featured_image = CONCAT('/api', featured_image) 
WHERE featured_image LIKE '/uploads/%' AND featured_image NOT LIKE '/api/%';

-- Update video URLs
UPDATE videos 
SET video_url = CONCAT('/api', video_url) 
WHERE video_url LIKE '/uploads/%' AND video_url NOT LIKE '/api/%';

UPDATE videos 
SET thumbnail_url = CONCAT('/api', thumbnail_url) 
WHERE thumbnail_url LIKE '/uploads/%' AND thumbnail_url NOT LIKE '/api/%';
