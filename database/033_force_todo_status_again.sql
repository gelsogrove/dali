-- Migration 033 (duplicate safeguard): enforce todo_items.status enum with 'test'

ALTER TABLE `todo_items`
  MODIFY COLUMN `status` ENUM('todo','nicetohave','in_progress','test','done') NOT NULL DEFAULT 'todo';

-- Use if migration 029/031/032 did not run on this environment.
