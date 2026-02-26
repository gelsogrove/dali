-- Migration 031: force todo_items.status enum to include all columns used by the admin board

ALTER TABLE `todo_items`
  MODIFY COLUMN `status` ENUM('todo','nicetohave','in_progress','test','done') NOT NULL DEFAULT 'todo';

-- Use this if previous migrations 025/029 were not applied on the target DB.
