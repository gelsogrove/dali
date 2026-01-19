# cPanel Deployment Guide

Complete guide for deploying Dalila Property Management System to cPanel.

## Prerequisites

- cPanel account with:
  - PHP 8.3+
  - MySQL/MariaDB access
  - SSH access (recommended)
  - At least 500MB storage
  - mod_rewrite enabled

## Part 1: Database Setup

### 1. Create MySQL Database

1. Login to cPanel
2. Navigate to "MySQL Databases"
3. Create new database: `yourusername_dalila`
4. Create new user: `yourusername_dalila_user`
5. Set strong password
6. Add user to database with ALL PRIVILEGES

### 2. Import Database Schema

1. Navigate to "phpMyAdmin"
2. Select your database
3. Click "Import" tab
4. Upload `BE/database/init.sql`
5. Click "Go"
6. Verify tables were created (7 tables)

### 3. Update Default Admin Password

In phpMyAdmin, run:

```sql
UPDATE admin_users 
SET password_hash = '$2y$10$YOUR_NEW_HASH_HERE' 
WHERE email = 'admin@dalila.com';
```

Generate hash using PHP:
```php
<?php
echo password_hash('YourNewPassword', PASSWORD_DEFAULT);
?>
```

## Part 2: Backend API Deployment

### 1. Prepare Files Locally

```bash
# In your local machine
cd /Users/gelso/workspace/Dalila

# Create production package
zip -r dalila-backend.zip BE/ -x "BE/uploads/*"
```

### 2. Upload to cPanel

Option A: Via cPanel File Manager
1. Login to cPanel
2. Navigate to File Manager
3. Go to `public_html/`
4. Create directory: `api`
5. Upload `dalila-backend.zip`
6. Extract in `public_html/api/`

Option B: Via FTP
1. Use FileZilla or similar
2. Connect to your domain
3. Navigate to `public_html/`
4. Upload `BE/` contents to `public_html/api/`

### 3. Configure Environment

Create `.env` file in `public_html/api/`:

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=yourusername_dalila
DB_USER=yourusername_dalila_user
DB_PASSWORD=your_secure_password

# JWT Configuration (IMPORTANT: Use strong secret!)
JWT_SECRET=use-a-random-32-character-or-longer-secret-key-here

# Application
ENVIRONMENT=production
UPLOAD_MAX_SIZE=10485760
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp
```

### 4. Set File Permissions

Via SSH:
```bash
# Navigate to directory
cd public_html/api

# Set directory permissions
find . -type d -exec chmod 755 {} \;

# Set file permissions
find . -type f -exec chmod 644 {} \;

# Make uploads directory writable
chmod 755 uploads
chmod 755 uploads/properties
chmod 755 uploads/videos
chmod 755 uploads/galleries
```

Via cPanel File Manager:
- Right-click each directory → Permissions → 755
- Right-click files → Permissions → 644
- uploads/ and subdirectories → 755

### 5. Update .htaccess

Edit `public_html/api/.htaccess`:

```apache
RewriteEngine On

# Redirect API requests to api/index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# Prevent direct access to sensitive files
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

<FilesMatch "(^config\.php|\.env)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    
    # CORS for production domain
    Header set Access-Control-Allow-Origin "https://yourdomain.com"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-CSRF-Token"
</IfModule>

# Disable directory listing
Options -Indexes

# PHP settings
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value max_execution_time 300
php_value memory_limit 256M
```

### 6. Configure PHP Version

1. cPanel → "Select PHP Version"
2. Select PHP 8.3 or higher
3. Enable extensions:
   - mysqli
   - gd
   - mbstring
   - zip
   - curl
   - json

### 7. Test Backend API

Visit: `https://yourdomain.com/api/health`

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": 1706543210
}
```

## Part 3: Admin Panel Deployment

### 1. Build Admin Panel Locally

```bash
# In your local machine
cd /Users/gelso/workspace/Dalila/admin

# Update API URL for production
# Edit .env:
echo "VITE_API_URL=https://yourdomain.com/api" > .env

# Install dependencies (if not already)
npm install

# Build for production
npm run build

# This creates dist/ directory
```

### 2. Upload Admin Panel

Option A: Via cPanel File Manager
1. Create `public_html/admin/` directory
2. Upload contents of `dist/` folder to `public_html/admin/`

Option B: Via FTP
1. Connect with FTP client
2. Upload `dist/` contents to `public_html/admin/`

### 3. Configure React Router (SPA)

Create `.htaccess` in `public_html/admin/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Disable directory browsing
Options -Indexes

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
</IfModule>
```

### 4. Test Admin Panel

Visit: `https://yourdomain.com/admin/`

- Should see login page
- Login with credentials
- Verify dashboard loads
- Test property management

## Part 4: SSL Certificate

### Option A: Let's Encrypt (Free)

1. cPanel → "SSL/TLS Status"
2. Check domain
3. Click "Run AutoSSL"
4. Wait for certificate installation

### Option B: Purchase SSL

1. Purchase SSL from provider
2. cPanel → "SSL/TLS"
3. Install certificate
4. Update links to use HTTPS

### Force HTTPS

Add to `public_html/.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## Part 5: Security Hardening

### 1. Protect Configuration Files

Verify `.env` is not publicly accessible:

Visit: `https://yourdomain.com/api/.env`

Should show: "403 Forbidden"

### 2. Set Strong Passwords

- Database password: 16+ characters, mixed case, numbers, symbols
- JWT Secret: 32+ characters, random
- Admin password: 16+ characters, mixed case, numbers, symbols

### 3. Disable PHP Error Display

In `public_html/api/` create or edit `php.ini`:

```ini
display_errors = Off
log_errors = On
error_log = /home/username/public_html/api/logs/php_errors.log
```

### 4. Configure Firewall

cPanel → "IP Blocker"
- Block suspicious IPs
- Consider using Cloudflare

### 5. Enable Rate Limiting

Install Cloudflare or use cPanel's Rate Limiting if available.

### 6. Regular Backups

cPanel → "Backup Wizard"
- Schedule automatic backups
- Store off-site
- Test restore procedure

## Part 6: Performance Optimization

### 1. Enable OPcache

cPanel → "Select PHP Version" → PHP Options
- Enable opcache
- Set opcache.memory_consumption = 128
- Set opcache.max_accelerated_files = 4000

### 2. Enable Gzip Compression

Already included in .htaccess, verify it works:

```bash
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com/admin/
```

Should see: `Content-Encoding: gzip`

### 3. Optimize Images

- Use WebP format when possible
- Backend automatically creates multiple sizes
- Consider CDN for images

### 4. Database Optimization

In phpMyAdmin:
```sql
OPTIMIZE TABLE properties, photogallery, videos, admin_users;
```

Schedule monthly via cPanel Cron Jobs.

## Part 7: Monitoring & Maintenance

### 1. Error Monitoring

View PHP errors:
```bash
tail -f ~/public_html/api/logs/php_errors.log
```

### 2. Activity Monitoring

```sql
-- Recent logins
SELECT * FROM activity_log 
WHERE action = 'login' 
ORDER BY created_at DESC 
LIMIT 10;

-- Recent changes
SELECT * FROM activity_log 
WHERE action IN ('create', 'update', 'delete')
ORDER BY created_at DESC 
LIMIT 20;
```

### 3. Database Size

```sql
SELECT 
  table_name AS 'Table',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'yourusername_dalila'
ORDER BY (data_length + index_length) DESC;
```

### 4. Cleanup Old Sessions

Schedule via Cron Jobs:

```sql
DELETE FROM sessions WHERE expires_at < NOW();
```

### 5. Regular Backups

Automated backup script (`backup.sh`):

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/username/backups"

# Backup database
mysqldump -u username_dalila_user -p'password' username_dalila > $BACKUP_DIR/db_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /home/username/public_html/api

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Schedule in cPanel Cron Jobs (daily at 2 AM):
```
0 2 * * * /home/username/backup.sh
```

## Part 8: Troubleshooting

### Issue: 500 Internal Server Error

**Causes:**
- PHP syntax error
- Wrong file permissions
- Missing PHP extensions

**Solutions:**
1. Check error log
2. Verify file permissions (644 for files, 755 for directories)
3. Enable required PHP extensions
4. Check .htaccess syntax

### Issue: Database Connection Failed

**Solutions:**
1. Verify credentials in `.env`
2. Check database exists: `SHOW DATABASES;`
3. Verify user permissions: `SHOW GRANTS FOR 'username'@'localhost';`
4. Use `localhost` not `127.0.0.1` for host

### Issue: Upload Directory Not Writable

**Solutions:**
```bash
chmod 755 uploads/
chmod 755 uploads/properties/
chmod 755 uploads/videos/
chmod 755 uploads/galleries/
```

### Issue: CORS Errors

**Solution:**
Update `BE/api/index.php`:
```php
header('Access-Control-Allow-Origin: https://yourdomain.com');
```

### Issue: Admin Panel Shows White Screen

**Causes:**
- JavaScript error
- Wrong API URL
- Missing .htaccess

**Solutions:**
1. Open browser console (F12)
2. Check for errors
3. Verify VITE_API_URL in build
4. Confirm .htaccess exists with correct rewrites

## Part 9: Post-Deployment Checklist

- [ ] Database imported successfully
- [ ] Default admin password changed
- [ ] Backend API responding to /health endpoint
- [ ] File permissions set correctly (755/644)
- [ ] .env file configured with production values
- [ ] JWT secret is strong and unique
- [ ] Admin panel loads correctly
- [ ] Login works with new credentials
- [ ] Property CRUD operations work
- [ ] Image upload works
- [ ] SSL certificate installed
- [ ] HTTPS redirect working
- [ ] Error logs configured
- [ ] Backup system configured
- [ ] Performance optimization enabled
- [ ] Security headers configured
- [ ] CORS configured for production domain
- [ ] Monitoring in place

## Part 10: Support & Maintenance

### Regular Tasks

**Daily:**
- Check error logs
- Monitor disk space

**Weekly:**
- Review activity log
- Check backup integrity
- Update admin password (monthly)

**Monthly:**
- Optimize database tables
- Review and block suspicious IPs
- Update dependencies if needed
- Test backup restore

### Getting Help

1. Check error logs first
2. Search cPanel knowledge base
3. Contact hosting support
4. Review this deployment guide

## Conclusion

Your Dalila Property Management System is now deployed to cPanel and ready for production use!

Remember to:
- Keep backups
- Monitor logs
- Update passwords regularly
- Keep PHP and dependencies updated
- Review security settings periodically

For updates or issues, refer back to this guide.

---

**Deployment Complete! 🎉**
