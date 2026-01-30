# DELETE LOGIC COMPARISON - Blog vs Property

## Overview

Both BlogController and PropertyController implement intelligent delete logic with:
1. **24-hour rule** - Direct delete if created < 24 hours ago
2. **Redirect creation** - Automatic SEO redirect for older content
3. **Soft delete support** - For blogs with `deleted_at` column
4. **Asset cleanup** - Deletes associated files
5. **Sitemap regeneration** - Updates sitemap after deletion

---

## 🔄 Delete Logic Flow

### **BLOG DELETE** (BlogController.php lines 310-400)

```
┌─────────────────────────────────────────────────────────┐
│ DELETE /blogs/:id                                       │
└─────────────────────────────────────────────────────────┘
                        │
                        ├─ Fetch blog
                        │  ├─ Not found → 404 error
                        │  └─ Found → continue
                        │
                        ├─ Check if already archived (deleted_at NOT NULL)
                        │  │
                        │  ├─ YES (already archived)
                        │  │  ├─ Create/ensure redirect placeholder
                        │  │  ├─ HARD DELETE from database
                        │  │  ├─ Delete assets (featured_image, content_image)
                        │  │  ├─ Log activity
                        │  │  ├─ Regenerate sitemap
                        │  │  └─ Return success
                        │  │
                        │  └─ NO (not archived) → continue
                        │
                        ├─ Calculate age (created_at vs now)
                        │
                        ├─ Check if < 24 hours old
                        │  │
                        │  ├─ YES (< 24h)
                        │  │  ├─ HARD DELETE (no redirect needed)
                        │  │  ├─ Delete assets
                        │  │  ├─ Log activity
                        │  │  └─ Return success
                        │  │
                        │  └─ NO (> 24h) → continue
                        │
                        └─ Older than 24h → SOFT DELETE
                           ├─ Create redirect placeholder
                           ├─ Set deleted_at = NOW()
                           ├─ Log activity
                           ├─ Regenerate sitemap
                           └─ Return success (advise user to set redirect)
```

### **PROPERTY DELETE** (PropertyController.php lines 640-710)

```
┌─────────────────────────────────────────────────────────┐
│ DELETE /properties/:id                                  │
└─────────────────────────────────────────────────────────┘
                        │
                        ├─ Fetch property (slug, created_at)
                        │  ├─ Not found → 404 error
                        │  └─ Found → continue
                        │
                        ├─ Calculate age (created_at vs now)
                        │
                        ├─ Check if < 24 hours old
                        │  │
                        │  ├─ YES (< 24h)
                        │  │  ├─ HARD DELETE (no redirect)
                        │  │  ├─ Log activity
                        │  │  ├─ Regenerate sitemap
                        │  │  └─ Return success
                        │  │
                        │  └─ NO (> 24h) → continue
                        │
                        └─ Older than 24h
                           ├─ Create redirect placeholder
                           │  (url_old = /properties/{slug}, url_new = '')
                           ├─ HARD DELETE from database
                           ├─ Log activity
                           ├─ Regenerate sitemap
                           └─ Return success (advise to set redirect destination)
```

---

## 📊 Comparison Table

| Feature | BlogController | PropertyController | Status |
|---------|----------------|--------------------| -------|
| **24-hour rule** | ✅ Yes | ✅ Yes | ✅ **CONSISTENT** |
| **Redirect creation** | ✅ Yes | ✅ Yes | ✅ **CONSISTENT** |
| **Soft delete support** | ✅ Yes (`deleted_at`) | ❌ No | ⚠️ **INCONSISTENT** |
| **Hard delete old content** | Only if already archived | Always (after redirect) | ⚠️ **DIFFERENT** |
| **Asset cleanup** | ✅ Yes (images) | 🔶 Cascade (photos via FK) | ✅ **BOTH OK** |
| **Sitemap regen** | ✅ Yes | ✅ Yes | ✅ **CONSISTENT** |
| **Activity logging** | ✅ Yes | ✅ Yes | ✅ **CONSISTENT** |
| **Redirect placeholder** | ✅ Yes | ✅ Yes | ✅ **CONSISTENT** |

---

## 🔍 KEY DIFFERENCES

### 1. **Soft Delete Implementation**

**Blog:**
```php
// SOFT DELETE (> 24h, first delete)
$query = "UPDATE blogs SET deleted_at = NOW() WHERE id = ?";
// Content stays in DB with deleted_at flag

// HARD DELETE (2nd delete or archived content)
$query = "DELETE FROM blogs WHERE id = ?";
```

**Property:**
```php
// NO SOFT DELETE
// Always HARD DELETE (but creates redirect first if > 24h)
$query = "DELETE FROM properties WHERE id = ?";
```

**Reason:** Blog has `deleted_at` column, Property does not (yet - added in migration!)

### 2. **Double-Delete Pattern**

**Blog:**
- 1st delete (> 24h) → Soft delete (sets `deleted_at`)
- 2nd delete (archived) → Hard delete (removes from DB)

**Property:**
- 1st delete (> 24h) → Hard delete (after creating redirect)
- No 2nd delete needed

### 3. **Asset Cleanup**

**Blog:**
```php
// Manual cleanup
if (!empty($blog['featured_image'])) {
    $uploader->deleteFile($blog['featured_image']);
}
if (!empty($blog['content_image'])) {
    $uploader->deleteFile($blog['content_image']);
}
```

**Property:**
```php
// Cascade delete via foreign key
// property_photos automatically deleted: ON DELETE CASCADE
```

---

## ⚠️ RECOMMENDATION: Align Delete Logic

### Option 1: Add Soft Delete to Properties (RECOMMENDED)

**Advantages:**
- Consistent with blogs
- Can restore accidentally deleted properties
- Better audit trail
- Safer for production

**Implementation:**
```php
// PropertyController.php - delete() method

// If > 24h, SOFT DELETE first
if ($hoursDiff >= 24) {
    // Check if already soft-deleted
    if (!empty($property['deleted_at'])) {
        // Hard delete if already archived
        $query = "DELETE FROM properties WHERE id = ?";
        // ... cleanup and redirect
    } else {
        // Soft delete
        $query = "UPDATE properties SET deleted_at = NOW(), is_active = 0 WHERE id = ?";
        // Create redirect placeholder
        // Log and return
    }
} else {
    // < 24h: direct delete
    $query = "DELETE FROM properties WHERE id = ?";
}
```

**Database Change:**
✅ Already added in migration! `deleted_at` column exists.

### Option 2: Remove Soft Delete from Blogs (NOT RECOMMENDED)

Would make blogs behave like properties (hard delete after redirect), but:
- ❌ Loses ability to restore content
- ❌ Breaks existing blog archive functionality
- ❌ Less safe for production

---

## ✅ RECOMMENDED IMPLEMENTATION

### Update PropertyController to match BlogController logic:

```php
public function delete($id, $userId) {
    try {
        // Fetch property
        $fetch = $this->db->executePrepared(
            "SELECT slug, created_at, deleted_at, is_active FROM properties WHERE id = ? LIMIT 1",
            [$id],
            'i'
        );
        if (!$fetch || $fetch->num_rows === 0) {
            return $this->errorResponse('Property not found', 404);
        }
        $property = $fetch->fetch_assoc();

        // Calculate age
        $createdAt = new DateTime($property['created_at']);
        $now = new DateTime();
        $hoursDiff = ($now->getTimestamp() - $createdAt->getTimestamp()) / 3600;

        // SCENARIO 1: Already soft-deleted → Hard delete
        if (!empty($property['deleted_at'])) {
            $urlOld = '/new/properties/' . $property['slug'];
            
            // Ensure redirect exists
            $existingRedirect = $this->redirectService->findByUrlOld($urlOld);
            if (!$existingRedirect) {
                $this->redirectService->create($urlOld, '');
            }
            
            // Hard delete
            $query = "DELETE FROM properties WHERE id = ?";
            $result = $this->db->executePrepared($query, [$id], 'i');
            
            if (!$result) {
                return $this->errorResponse('Failed to delete property');
            }
            
            $this->logActivity($userId, 'delete', 'property', $id, "Deleted archived property ID: $id");
            $this->sitemapService->generateSitemap();
            
            return $this->successResponse([
                'message' => 'Property permanently deleted (was archived). Redirect placeholder ensured.'
            ]);
        }

        // SCENARIO 2: Created < 24 hours ago → Direct delete
        if ($hoursDiff < 24) {
            $query = "DELETE FROM properties WHERE id = ?";
            $result = $this->db->executePrepared($query, [$id], 'i');
            
            if (!$result) {
                return $this->errorResponse('Failed to delete property');
            }
            
            $this->logActivity($userId, 'delete', 'property', $id, "Deleted property ID: $id (created < 24h)");
            $this->sitemapService->generateSitemap();
            
            return $this->successResponse([
                'message' => 'Property deleted permanently (created < 24h)'
            ]);
        }

        // SCENARIO 3: Older than 24h → Soft delete + redirect
        $urlOld = '/new/properties/' . $property['slug'];
        
        // Create redirect placeholder
        $existingRedirect = $this->redirectService->findByUrlOld($urlOld);
        if (!$existingRedirect) {
            $redirectResult = $this->redirectService->create($urlOld, '');
            if (!$redirectResult['success']) {
                return $this->errorResponse('Failed to create redirect placeholder', 400);
            }
        }
        
        // Soft delete
        $query = "UPDATE properties SET deleted_at = NOW(), is_active = 0 WHERE id = ?";
        $result = $this->db->executePrepared($query, [$id], 'i');
        
        if (!$result) {
            return $this->errorResponse('Failed to archive property');
        }
        
        $this->logActivity($userId, 'delete', 'property', $id, "Archived property ID: $id (soft delete)");
        $this->sitemapService->generateSitemap();
        
        return $this->successResponse([
            'message' => 'Property archived. Delete again to remove permanently. Please set redirect destination in Redirects section.',
            'redirect_required' => true,
            'archived' => true
        ]);

    } catch (Exception $e) {
        error_log("Error deleting property: " . $e->getMessage());
        return $this->errorResponse('An error occurred: ' . $e->getMessage());
    }
}
```

---

## 📋 Summary

### Current Status:
- ✅ Blog has complete soft delete implementation
- ⚠️ Property has partial implementation (hard delete with redirects)
- ✅ Both follow 24-hour rule
- ✅ Both create SEO redirects
- ✅ Both regenerate sitemap

### Action Required:
1. ✅ Add `deleted_at` column to properties (already in migration!)
2. Update PropertyController.php delete() method to match blog logic
3. Update frontend to show "Archived" state for soft-deleted properties
4. Add "Restore" button for archived properties (optional)

### Benefits of Aligned Logic:
- ✅ Consistent user experience
- ✅ Safer content management
- ✅ Ability to restore accidentally deleted properties
- ✅ Better audit trail
- ✅ Two-step delete for important content

---

**Status:** ⚠️ **NEEDS UPDATE** - PropertyController should implement soft delete like BlogController

**Priority:** MEDIUM - Current logic works but soft delete is safer for production
