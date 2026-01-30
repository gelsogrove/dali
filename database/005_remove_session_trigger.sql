-- Remove problematic trigger that causes session insert conflicts
DROP TRIGGER IF EXISTS `after_session_insert`;

-- Verify trigger removed
SELECT 'Trigger removed successfully' AS status;
SHOW TRIGGERS WHERE `Table` = 'sessions';
