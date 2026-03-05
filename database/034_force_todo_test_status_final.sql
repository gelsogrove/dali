-- Migration 034: Final enforcement of todo_items.status enum with 'test' value
-- Runs after 028 is fixed, ensuring all previous enum migrations took effect.

ALTER TABLE `todo_items`
  MODIFY COLUMN `status` ENUM('todo','nicetohave','in_progress','test','done') NOT NULL DEFAULT 'todo';
