-- Migration 032: ensure todo_items.status supports 'test'

ALTER TABLE `todo_items`
  MODIFY COLUMN `status` ENUM('todo','nicetohave','in_progress','test','done') NOT NULL DEFAULT 'todo';

-- Purpose: avoid silent truncation when moving cards to the "Test" column.
