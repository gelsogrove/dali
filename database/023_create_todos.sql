-- ============================================================================
-- Migration 023: Todo board (tasks, comments, attachments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `todo_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` MEDIUMTEXT NULL,
  `author` VARCHAR(120) NOT NULL,
  `status` ENUM('todo','in_progress','done') NOT NULL DEFAULT 'todo',
  `priority` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `todo_comments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `todo_id` INT UNSIGNED NOT NULL,
  `author` VARCHAR(120) NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_todo` (`todo_id`),
  CONSTRAINT `fk_todo_comments_todo` FOREIGN KEY (`todo_id`) REFERENCES `todo_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `todo_attachments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `todo_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `url` TEXT NOT NULL,
  `mime_type` VARCHAR(120) NULL,
  `size_bytes` INT UNSIGNED NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_todo_attach` (`todo_id`),
  CONSTRAINT `fk_todo_attachments_todo` FOREIGN KEY (`todo_id`) REFERENCES `todo_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
