-- Migration 025: add 'nicetohave' status to todo_items

ALTER TABLE `todo_items`
  MODIFY COLUMN `status` ENUM('todo','nicetohave','in_progress','done') NOT NULL DEFAULT 'todo';

