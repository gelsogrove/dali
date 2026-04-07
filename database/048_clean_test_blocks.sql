-- Migration 048: Clean test data from landing_page_content_blocks
-- Remove test blocks that were inserted during development testing

DELETE FROM landing_page_content_blocks WHERE id IN (1, 2);

SELECT 'Migration 048 applied: removed test data from landing_page_content_blocks' AS status;
