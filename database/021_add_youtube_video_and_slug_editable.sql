-- ============================================================================
-- Migration: Add Video URL field to properties
-- Date: 2026-02-13
-- Purpose: Allow admins to add YouTube, Vimeo, or Instagram video URLs to property gallery
-- ============================================================================

-- Add youtube_video_url field to properties table
ALTER TABLE properties 
ADD COLUMN youtube_video_url TEXT NULL 
COMMENT 'Video URL (YouTube, Vimeo, or Instagram) for property showcase' 
AFTER google_maps_url;

-- Note: slug field already exists and is UNIQUE in properties table
-- This migration just documents that slug is now editable in the admin panel
