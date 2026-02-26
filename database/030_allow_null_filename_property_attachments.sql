-- Migration 030: allow NULL filename for property attachments (links)

ALTER TABLE `property_attachments`
  MODIFY COLUMN `filename` VARCHAR(255) NULL;

-- Rationale: link-only attachments created from the admin can omit a file,
-- so the column must accept NULL or inserts will fail.
