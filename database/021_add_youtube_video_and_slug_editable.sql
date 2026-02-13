-- ============================================================================
-- Migration: Add YouTube Video URL field to properties
-- Date: 2026-02-13
-- Purpose: Allow admins to add YouTube embed codes to property gallery
-- ============================================================================

-- Add youtube_video_url field to properties table
ALTER TABLE properties 
ADD COLUMN youtube_video_url TEXT NULL 
COMMENT 'YouTube embed URL for property video' 
AFTER google_maps_url;

-- Note: slug field already exists and is UNIQUE in properties table
-- This migration just documents that slug is now editable in the admin panel
