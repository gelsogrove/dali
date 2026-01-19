# Testing Guide

## Overview

This guide covers testing procedures for the Dalila Property Management System.

## Prerequisites

- Docker running
- Services started: `docker-compose up -d`
- curl or Postman installed

## Backend API Testing

### 1. Health Check

```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": 1706543210
}
```

### 2. Authentication

#### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dalila.com",
    "password": "Admin@123"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJh...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJh...",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "email": "admin@dalila.com",
      "first_name": "Admin",
      "last_name": "User",
      "role": "admin"
    }
  }
}
```

Save the token for subsequent requests!

#### Verify Token
```bash
TOKEN="your-token-here"

curl -X POST http://localhost:8080/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Properties

#### Get All Properties (Public)
```bash
curl http://localhost:8080/api/properties
```

#### Get Single Property (Public)
```bash
curl http://localhost:8080/api/properties/1
```

#### Create Property (Authenticated)
```bash
TOKEN="your-token-here"

curl -X POST http://localhost:8080/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Property",
    "description": "A beautiful test property",
    "price": 500000,
    "bedrooms": 3,
    "bathrooms": 2.5,
    "square_feet": 2000,
    "property_type": "Single Family",
    "status": "active",
    "address": "123 Test Street",
    "city": "Miami",
    "state": "FL",
    "zip_code": "33139",
    "featured": true
  }'
```

#### Update Property (Authenticated)
```bash
TOKEN="your-token-here"

curl -X PUT http://localhost:8080/api/properties/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Updated Property Title",
    "price": 550000
  }'
```

#### Delete Property (Admin Only)
```bash
TOKEN="your-token-here"

curl -X DELETE http://localhost:8080/api/properties/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 4. File Upload

#### Upload Property Image
```bash
TOKEN="your-token-here"

curl -X POST http://localhost:8080/api/upload/property-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/your/image.jpg"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "filename": "img_12345_1706543210.jpg",
    "urls": {
      "original": "/uploads/properties/img_12345_1706543210.jpg",
      "large": "/uploads/properties/img_12345_1706543210_large.jpg",
      "medium": "/uploads/properties/img_12345_1706543210_medium.jpg",
      "thumbnail": "/uploads/properties/img_12345_1706543210_thumbnail.jpg"
    },
    "size": 1234567,
    "dimensions": [1920, 1080]
  }
}
```

## Frontend Testing

### 1. Access Admin Panel

1. Open browser: http://localhost:5174
2. Should see login page

### 2. Login Flow

1. Enter credentials:
   - Email: admin@dalila.com
   - Password: Admin@123
2. Click "Sign In"
3. Should redirect to dashboard

### 3. Dashboard

1. Verify statistics cards display:
   - Total Properties
   - Active Listings
   - Featured
   - Total Value
2. Check data loads without errors

### 4. Properties Page

1. Click "Properties" in sidebar
2. Verify property list displays
3. Check pagination works (if > 12 properties)
4. Test "Add Property" button

### 5. Create Property

1. Click "Add Property"
2. Fill form:
   - Title: "Test Property"
   - Price: 500000
   - Bedrooms: 3
   - Bathrooms: 2.5
   - Status: Active
3. Click "Create Property"
4. Should redirect to properties list
5. Verify new property appears

### 6. Edit Property

1. Click "Edit" on a property
2. Modify title or price
3. Click "Update Property"
4. Verify changes saved

### 7. Delete Property

1. Click trash icon on a property
2. Confirm deletion
3. Verify property removed from list

## Database Testing

### Access MySQL

```bash
docker-compose exec mysql mysql -u dalila_user -p dalila_db
# Password: dalila_password
```

### Verify Tables

```sql
SHOW TABLES;
```

Expected tables:
- admin_users
- properties
- photogallery
- videos
- property_amenities
- sessions
- activity_log

### Check Sample Data

```sql
SELECT * FROM properties LIMIT 5;
SELECT * FROM admin_users;
SELECT COUNT(*) as total_properties FROM properties;
```

### Check Activity Log

```sql
SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10;
```

## Integration Testing

### End-to-End Property Creation

1. **Login via API**
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@dalila.com","password":"Admin@123"}'
   ```

2. **Create Property**
   ```bash
   TOKEN="your-token-here"
   curl -X POST http://localhost:8080/api/properties \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Integration Test Property","price":600000,"status":"active"}'
   ```

3. **Upload Image**
   ```bash
   curl -X POST http://localhost:8080/api/upload/property-image \
     -H "Authorization: Bearer $TOKEN" \
     -F "image=@test-image.jpg"
   ```

4. **Verify in Admin Panel**
   - Open http://localhost:5174
   - Login
   - Navigate to Properties
   - Verify new property appears

## Performance Testing

### API Response Time

```bash
# Test API speed
time curl http://localhost:8080/api/properties
```

Should complete in < 500ms

### Load Testing (Optional)

```bash
# Using Apache Bench (if installed)
ab -n 100 -c 10 http://localhost:8080/api/properties
```

## Common Issues & Solutions

### 1. Database Connection Failed

**Problem**: Backend can't connect to MySQL

**Solution**:
```bash
# Check MySQL is running
docker-compose ps

# Restart MySQL
docker-compose restart mysql

# View MySQL logs
docker-compose logs mysql
```

### 2. JWT Token Invalid

**Problem**: 401 Unauthorized errors

**Solution**:
- Ensure token is included in Authorization header
- Check token hasn't expired (1 hour lifetime)
- Re-login to get new token

### 3. File Upload Failed

**Problem**: Image upload returns error

**Solution**:
```bash
# Check upload directory permissions
docker-compose exec backend ls -la /var/www/html/uploads

# Create directories if missing
docker-compose exec backend mkdir -p /var/www/html/uploads/properties
docker-compose exec backend chown -R www-data:www-data /var/www/html/uploads
```

### 4. Admin Panel Can't Reach API

**Problem**: Network errors in browser console

**Solution**:
- Check API is running: `curl http://localhost:8080/api/health`
- Verify CORS headers are set correctly
- Check browser console for specific errors
- Ensure `.env` file has correct API URL

### 5. CORS Errors

**Problem**: CORS policy blocking requests

**Solution**:
- Backend already includes CORS headers
- For production, update allowed origins in `BE/api/index.php`

## Security Testing

### 1. SQL Injection Prevention

Try malicious input:
```bash
TOKEN="your-token-here"

curl -X POST http://localhost:8080/api/properties \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test\"; DROP TABLE properties; --","price":100}'
```

Should fail safely without affecting database.

### 2. Authentication Bypass

Try accessing protected endpoints without token:
```bash
curl -X POST http://localhost:8080/api/properties \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","price":100}'
```

Should return 401 Unauthorized.

### 3. File Upload Validation

Try uploading invalid file:
```bash
TOKEN="your-token-here"

# Try uploading a text file as image
echo "test" > test.txt
curl -X POST http://localhost:8080/api/upload/property-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test.txt"
```

Should return error: "Invalid image file type"

## Automated Testing Script

```bash
#!/bin/bash

echo "🧪 Running automated tests..."

# Health check
echo "Testing health endpoint..."
curl -s http://localhost:8080/api/health | grep -q "success" && echo "✅ Health check passed" || echo "❌ Health check failed"

# Login
echo "Testing login..."
RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dalila.com","password":"Admin@123"}')

echo $RESPONSE | grep -q "token" && echo "✅ Login passed" || echo "❌ Login failed"

# Get properties
echo "Testing get properties..."
curl -s http://localhost:8080/api/properties | grep -q "properties" && echo "✅ Get properties passed" || echo "❌ Get properties failed"

echo ""
echo "✅ All tests completed!"
```

Save this as `test.sh` and run: `chmod +x test.sh && ./test.sh`

## Test Checklist

- [ ] Backend API health check responds
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails
- [ ] Protected endpoints require authentication
- [ ] Properties list loads
- [ ] Property detail loads
- [ ] Create property works (authenticated)
- [ ] Update property works (authenticated)
- [ ] Delete property works (admin only)
- [ ] Image upload works with valid file
- [ ] Image upload rejects invalid file
- [ ] Admin panel login works
- [ ] Dashboard displays statistics
- [ ] Properties page lists all properties
- [ ] Create property form submits successfully
- [ ] Edit property form updates data
- [ ] Delete property removes from list
- [ ] Logout clears session

## Conclusion

This testing guide covers all major functionality. For production deployment, consider adding:
- Unit tests with PHPUnit (backend)
- Integration tests with Jest (frontend)
- E2E tests with Playwright or Cypress
- Performance monitoring
- Security audits
