-- Migration 026: Update Off Market Invites for Global Session
-- Allows invites to be global (no specific property)
-- Updates commentary to reflect 72h expiration

ALTER TABLE off_market_invites MODIFY property_id INT UNSIGNED NULL;
-- Note: Already has fk_off_market_invite_property, but property_id is now nullable.

-- Update current comments/metadata in table if needed (informational)
-- In MySQL we can't easily "update comments" on columns without re-specifying type, but we can document it here.
