# DALILA - Database Deployment Guide

## 📋 Overview

This guide covers the complete database setup and migration process for the Dalila Property Management System.

## 🗂️ Database Files

### **NEW INSTALLATION** (Fresh Database)
1. **001_init_clean.sql** - Complete schema with all tables
2. **002_triggers_procedures.sql** - Triggers and stored procedures

### **PRODUCTION MIGRATION** (Existing Database)
3. **003_production_migration.sql** - Migrate from v1.x to v2.0

---

## 🆕 Fresh Installation (Development/Staging)

### Prerequisites
- MariaDB 10.6+ or MySQL 8.0+
- Database created: `dalila_db`
- User with full privileges

### Steps

```bash
# 1. Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS dalila_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Create database user
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'dalila_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON dalila_db.* TO 'dalila_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

# 3. Import schema
mysql -u dalila_user -p dalila_db < database/001_init_clean.sql

# 4. Import triggers and procedures
mysql -u dalila_user -p dalila_db < database/002_triggers_procedures.sql

# 5. Verify installation
mysql -u dalila_user -p dalila_db -e "SHOW TABLES;"
mysql -u dalila_user -p dalila_db -e "SELECT COUNT(*) FROM admin_users;"
```

### Default Admin Credentials
- **Email:** admin@dalila.com
- **Password:** admin123
- **⚠️ CHANGE IMMEDIATELY IN PRODUCTION!**

---

## 🔄 Production Migration (Existing Database)

### ⚠️ CRITICAL - Pre-Migration Checklist

- [ ] **BACKUP DATABASE**
  ```bash
  mysqldump -u root -p dalila_db > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] Test migration on staging/dev environment first
- [ ] Notify users of maintenance window
- [ ] Verify backup can be restored

### Migration Steps

```bash
# 1. BACKUP (CRITICAL!)
mysqldump -u root -p --single-transaction --routines --triggers dalila_db > backup_pre_migration_$(date +%Y%m%d).sql

# 2. Test backup
mysql -u root -p -e "CREATE DATABASE dalila_db_test;"
mysql -u root -p dalila_db_test < backup_pre_migration_*.sql
mysql -u root -p -e "DROP DATABASE dalila_db_test;"

# 3. Run migration
mysql -u root -p dalila_db < database/003_production_migration.sql

# 4. Add triggers and procedures
mysql -u root -p dalila_db < database/002_triggers_procedures.sql

# 5. Verify migration
mysql -u root -p dalila_db < database/004_verify_migration.sql
```

### Post-Migration Verification

```sql
-- Check table structure
SHOW CREATE TABLE properties;

-- Verify property_id_reference is unique
SELECT property_id_reference, COUNT(*) as cnt 
FROM properties 
GROUP BY property_id_reference 
HAVING cnt > 1;

-- Check orphaned photos
SELECT COUNT(*) FROM property_photos 
WHERE property_id NOT IN (SELECT id FROM properties);

-- Verify all properties have required fields
SELECT COUNT(*) FROM properties 
WHERE property_id_reference IS NULL OR slug IS NULL;

-- Test auto-calculations
INSERT INTO properties (title, slug, property_type, status, price_usd, sqm, created_by)
VALUES ('Test Auto Calc', 'test-auto-calc', 'active', 'for_sale', 100000, 100, 1);

SELECT property_id_reference, price_usd, price_mxn, sqm, sqft 
FROM properties 
WHERE slug = 'test-auto-calc';

DELETE FROM properties WHERE slug = 'test-auto-calc';
```

### Cleanup After Successful Migration

```sql
-- Remove backup tables (ONLY after verification!)
DROP TABLE IF EXISTS _backup_properties;
DROP TABLE IF EXISTS _backup_photogallery;

-- Deprecated table (if data migrated to JSON tags)
-- DROP TABLE IF EXISTS property_amenities;
```

---

## 📊 Database Schema v2.0

### Core Tables

#### properties
- **38+ fields** including SEO, pricing (USD/MXN), location, features
- **Auto-generated:** `property_id_reference` (PROP-2026-001)
- **Auto-calculated:** `sqft` (from sqm), `price_mxn` (from USD)
- **JSON field:** `tags` for features/amenities
- **Soft delete:** `deleted_at` column

#### property_photos
- Renamed from `photogallery`
- Multiple image sizes: original, large, medium, thumbnail
- Auto-cover: first photo (`order=1`) is cover
- Column changes: `image_url` → `url`, `display_order` → `order`, `is_featured` → `is_cover`

#### New Tables
- `property_landing_pages` - Property → City/Area associations
- `cities` - Landing page cities
- `areas` - Landing page areas/neighborhoods
- `redirects` - SEO redirects for deleted content
- `testimonials` - Client testimonials

### Triggers & Procedures

**Triggers:**
- `before_property_insert` - Auto-generate property_id_reference, calculate sqft/price_mxn
- `before_property_update` - Recalculate sqft/price_mxn on changes
- `after_property_photos_insert` - Auto-set first photo as cover
- `after_session_insert` - Clean expired sessions

**Stored Procedures:**
- `generate_property_id()` - Returns PROP-YYYY-NNN format
- `clean_expired_sessions()` - Maintenance procedure
- `soft_delete_property(id)` - Soft delete with redirect
- `restore_property(id)` - Restore soft-deleted
- `get_property_stats()` - Analytics query

---

## 🔧 Maintenance

### Daily Tasks (Automated via Cron)

```bash
# Clean expired sessions
mysql -u dalila_user -p dalila_db -e "CALL clean_expired_sessions();"

# Backup database
mysqldump -u root -p --single-transaction dalila_db | gzip > /backups/dalila_$(date +%Y%m%d).sql.gz

# Rotate old backups (keep 30 days)
find /backups -name "dalila_*.sql.gz" -mtime +30 -delete
```

### Weekly Tasks

```sql
-- Analyze and optimize tables
ANALYZE TABLE properties, property_photos, blogs;
OPTIMIZE TABLE properties, property_photos;

-- Check for data integrity issues
SELECT id, title FROM properties WHERE property_id_reference IS NULL;
SELECT id FROM property_photos WHERE property_id NOT IN (SELECT id FROM properties);
```

### Monthly Tasks

```sql
-- Full database analytics
CALL get_property_stats();

-- Review soft-deleted content (older than 30 days)
SELECT id, title, deleted_at FROM properties 
WHERE deleted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Archive or hard-delete old soft-deleted records
-- DELETE FROM properties WHERE deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

---

## 🔐 Security Checklist

### Database Level
- [ ] Use strong password for database user
- [ ] Limit database user permissions (no SUPER privilege)
- [ ] Enable MySQL slow query log
- [ ] Set `max_connections` appropriately
- [ ] Use SSL for database connections

### Application Level
- [ ] Change default admin password immediately
- [ ] Use prepared statements (already implemented)
- [ ] Validate all inputs (already implemented)
- [ ] Use CSRF tokens (already implemented)
- [ ] Rate limit API endpoints
- [ ] Monitor for SQL injection attempts

---

## 📈 Performance Optimization

### Indexes
All critical indexes are included in the schema:
- Properties: status, type, category, city, country, price, is_active, order
- Photos: property_id, order, is_cover
- Foreign keys automatically indexed

### Query Optimization Tips

```sql
-- Use EXPLAIN to analyze queries
EXPLAIN SELECT * FROM properties WHERE city = 'Tulum' AND status = 'for_sale';

-- Add composite indexes if needed
CREATE INDEX idx_city_status ON properties(city, status);

-- Monitor slow queries
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;
```

---

## 🆘 Troubleshooting

### Migration Issues

**Error: "Column already exists"**
- Safe to ignore if using IF NOT EXISTS
- Indicates column was already migrated

**Error: "Foreign key constraint fails"**
```sql
-- Disable foreign keys temporarily
SET FOREIGN_KEY_CHECKS = 0;
-- Run migration
-- Re-enable
SET FOREIGN_KEY_CHECKS = 1;
```

**Error: "Duplicate entry for property_id_reference"**
```sql
-- Find duplicates
SELECT property_id_reference, COUNT(*) 
FROM properties 
GROUP BY property_id_reference 
HAVING COUNT(*) > 1;

-- Fix manually or regenerate
SET @counter = 0;
UPDATE properties 
SET property_id_reference = CONCAT('PROP-', YEAR(NOW()), '-', LPAD((@counter := @counter + 1), 3, '0'))
ORDER BY id;
```

### Rollback Migration

```bash
# Restore from backup
mysql -u root -p -e "DROP DATABASE dalila_db;"
mysql -u root -p -e "CREATE DATABASE dalila_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p dalila_db < backup_pre_migration_YYYYMMDD.sql
```

---

## 📝 Version History

- **v2.0.0** (2026-01-30) - Complete schema rewrite with 38+ property fields
- **v1.x.x** - Initial version (legacy schema)

---

## 🔗 Related Documentation

- [API Documentation](../_docs/api-README.md)
- [Security Guide](../_docs/SECURITY.md)
- [Deployment Guide](../_docs/DEPLOYMENT_GUIDE.md)
- [Migration Details](../_docs/MIGRATION.md)

---

## ✅ Quick Start Commands

```bash
# Fresh install
mysql -u root -p dalila_db < database/001_init_clean.sql
mysql -u root -p dalila_db < database/002_triggers_procedures.sql

# Production migration
mysqldump dalila_db > backup_$(date +%Y%m%d).sql
mysql -u root -p dalila_db < database/003_production_migration.sql
mysql -u root -p dalila_db < database/002_triggers_procedures.sql

# Verify
mysql -u root -p dalila_db -e "SHOW TABLES; SELECT COUNT(*) FROM properties;"
```

---

**Need Help?** Check the troubleshooting section or review the migration logs for detailed error messages.
