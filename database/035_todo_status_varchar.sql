-- Migration 035: Change todo_items.status from ENUM to VARCHAR(50)
-- ENUM can silently fail when permissions are limited; VARCHAR is always writable.

ALTER TABLE `todo_items`
  MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'todo';
