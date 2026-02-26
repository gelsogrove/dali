-- Migration 033: enforce todo_items.status to include 'test' (second pass)

ALTER TABLE `todo_items`
  MODIFY COLUMN `status` ENUM('todo','nicetohave','in_progress','test','done') NOT NULL DEFAULT 'todo';

-- Re-run in case previous migration did not execute on this database.
