# 🚀 Deployment Guide - Dalila Property Management

This document explains the production deployment process for the Dalila Property Management system.

## 🏗️ Deployment Architecture

The system is split into three main components:
1.  **Frontend (fe/)**: The public-facing website built with React and Vite.
2.  **Admin Panel (admin/)**: The back-office management system built with React and Vite.
3.  **API Backend (api/)**: The PHP backend that handles data, authentication, and file storage.

### The `deploy/` Folder
When you run the build process, a `deploy/` folder is created at the project root. This is a **staging area**.
- It collects all compiled files from the frontend and admin builds.
- It includes the PHP backend source code.
- It creates a structure that can be uploaded directly to the server's `public_html/` directory.

---

## 🛠️ Build & Publish Workflow

To deploy the latest changes, run:
```bash
npm run build && npm run publish
```

### 1. Build Phase (`npm run build`)
This executes `scripts/prepare-deploy.sh`, which performs:
- **Clean**: Deletes any existing `deploy/` folder.
- **FE Build**: Compiles the React frontend into `fe/dist/`.
- **Admin Build**: Compiles the Admin Panel into `admin/dist/`.
- **Collect**: Copies both builds, the API source, and `.htaccess` files into the `deploy/` staging folder.

### 2. Publish Phase (`npm run publish`)
This executes `scripts/upload-ftp.js`, which performs:
- **Backup**: Automatically triggers a database backup on the server before making changes.
- **Upload**: Connects via FTP/SFTP and uploads the contents of `deploy/` to the server.
    - **Optimization**: It skips heavy static assets like `assets/fonts` and `assets/images` to speed up the process, as these rarely change.
- **Migrate**: Automatically triggers the database migration runner to apply any new `.sql` scripts found in `database/`.

---

## 🗄️ Database Management

### Migrations
We use a migration-based approach instead of a single `init.sql` file.
- All schema changes are stored in `database/*.sql`.
- The runner (`api/database/apply_migrations.php`) tracks which scripts have already been executed on the server to prevent duplicates.
- **Source of Truth**: `database/001_init_clean.sql` is the base schema. All subsequent files (002, 003, etc.) represent updates.

### Manual Backups
You can trigger a remote backup anytime via terminal:
```bash
npm run backup
```
Backups are stored on the server in `api/backups/`.

---

## 🔒 Security Notes
- **No Passwords**: Never store passwords in documentation or code.
- **Environment Variables**: Use the `.env` file for local development and direct server configuration for production.
- **Access Token**: Database migrations require a secret token (defined in `.env` as `MIGRATION_TOKEN`) for security.
