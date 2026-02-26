-- Migration 032: enforce todo_items.status enum to include 'test'
-- Use when the board column "Test" keeps bouncing cards back to backlog.

ALTER TABLE `todo_items`
  MODIFY COLUMN `status` ENUM('todo','nicetohave','in_progress','test','done') NOT NULL DEFAULT 'todo';

-- After applying, drag a card into the "Test" column; it should stay there.
