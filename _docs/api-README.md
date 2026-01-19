# Dalila Property Management System - Backend API

## Overview

This is the backend API for the Dalila Property Management System, built with PHP 8.3 and MariaDB.

## Features

- JWT-based authentication
- CSRF protection
- RESTful API endpoints
- Image upload with automatic resizing and optimization
- Video upload support
- Property CRUD operations
- Photo gallery management
- Activity logging

## Requirements

- PHP 8.3+
- MariaDB 10.6+
- GD or ImageMagick extension
- MySQLi extension
- Apache with mod_rewrite

## Installation

### Using Docker (Recommended)

1. Copy environment variables:
```bash
cp ../.env.example ../.env
```

2. Update `.env` with your configuration

3. Start containers:
```bash
cd ..
docker-compose up -d
```

4. Access API at: http://localhost:8080

### Manual Installation

1. Configure database connection in `.env`
2. Import database schema: `database/init.sql`
3. Configure Apache virtual host
4. Set upload directory permissions:
```bash
chmod -R 755 uploads/
chown -R www-data:www-data uploads/
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify` - Verify token

### Properties

- `GET /api/properties` - List all properties (public)
- `GET /api/properties/{id}` - Get property details (public)
- `POST /api/properties` - Create property (auth required)
- `PUT /api/properties/{id}` - Update property (auth required)
- `DELETE /api/properties/{id}` - Delete property (admin only)

### Uploads

- `POST /api/upload/property-image` - Upload property image (auth required)
- `POST /api/upload/video` - Upload video (auth required)

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Default Admin Credentials

**Email:** admin@dalila.com  
**Password:** Admin@123

**⚠️ CHANGE THESE CREDENTIALS IN PRODUCTION!**

## Security Features

- SQL injection prevention (prepared statements)
- CSRF token validation
- JWT token authentication
- Role-based access control
- File upload validation
- XSS protection headers
- Rate limiting recommended (implement with nginx/fail2ban)

## File Uploads

### Image Upload
- Formats: JPEG, PNG, WebP
- Max size: 10MB
- Automatic generation of 4 sizes:
  - Original (1920px)
  - Large (1200px)
  - Medium (800px)
  - Thumbnail (400px)

### Video Upload
- Formats: MP4, MPEG, MOV
- Max size: 100MB
- Automatic thumbnail generation (requires FFmpeg)

## Database Schema

- `admin_users` - Admin user accounts
- `properties` - Property listings
- `photogallery` - Property images
- `videos` - Property videos
- `property_amenities` - Property features
- `sessions` - JWT session management
- `activity_log` - Audit trail

## Error Handling

API returns JSON responses:

Success:
```json
{
  "success": true,
  "data": {...}
}
```

Error:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Development

Enable error logging in php.ini:
```ini
error_reporting = E_ALL
display_errors = 0
log_errors = 1
error_log = /var/log/php_errors.log
```

## Production Deployment

1. Change JWT secret in `.env`
2. Update database credentials
3. Change default admin password
4. Enable HTTPS
5. Configure CORS properly
6. Set up backup system
7. Enable rate limiting
8. Configure firewall rules
9. Set proper file permissions
10. Disable debug mode

## License

Proprietary - All rights reserved
