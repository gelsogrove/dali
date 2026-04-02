# Dalila - Buy With Dali

Premium real estate property management system for the Riviera Maya market. Full-stack application with React frontends and PHP API backend.

**Version:** 2.1  
**Status:** Production Ready

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended for development)
- **Node.js 20+** and npm
- **Git**
- **PHP 8.1+** and MySQL/MariaDB 10.6+ (if running without Docker)

### Installation

#### Option 1: Docker Development (Recommended)

```bash
# Clone repository
git clone https://github.com/gelsogrove/dali.git
cd dali

# Install Node dependencies
npm install

# Configure environment
cp api/.env.example api/.env.local
# Edit api/.env.local with your preferred settings (Docker uses 'mysql' as DB_HOST)

# Start all services with Docker
npm run dev
```

**Docker services will start:**
- 🌐 **Public Site**: [http://localhost:5173](http://localhost:5173)
- 🔧 **Admin Panel**: [http://localhost:5174](http://localhost:5174)
- 🔌 **API Backend**: [http://localhost:8080/api](http://localhost:8080/api)
### Frontend Technologies
- **Framework**: React 18+ with Vite
- **Styling**: TailwindCSS
- **Animations**: AOS (Animate On Scroll)
- **SEO**: React-Helmet-Async
- **Routing**: React Router v6
- **State Management**: Context API + React Query

### Admin Panel Technologies
- **Framework**: React 18+ with TypeScript
- **UI Library**: Shadcn UI (Radix UI primitives)
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form
- **Styling**: TailwindCSS

### Backend Technologies
- **Language**: PHP 8.1+
- **Architecture**: Custom MVC-style router
- **Database**: MySQL 8.0 / MariaDB 10.6+
- **Authentication**: JWT tokens
- **File Handling**: Custom upload controllers

### Infrastructure
- **Production**: GoDaddy Dedicated Server
- **Deployment**: FTP via automated scripts
- **Database**: MariaDB
- **Web Server**: Apache with mod_rewrite

---

## 📦 Available Commands

### Development
```bash
npm run dev              # Start Docker containers (frontend, admin, API, DB)
npm run dev:fe           # Start only frontend (port 5173)
npm run dev:admin        # Start only admin panel (port 5174)
npm run stop             # Stop all Docker containers
```

### Building
```bash
npm run build            # Build both frontend and admin for production
npm run build:fe         # Build only frontend
npm run build:admin      # Build only admin panel
```

### Deployment
```bash
npm run prepare-deploy   # Copy built files to /deploy directory
npm run publish          # Build, prepare, upload to production, run migrations
npm run backup           # Create remote database backup
```

### Database
```bash
# Migrations are in /database directory (numbered 001, 002, etc.)
# They run automatically during 'npm run publish'
# Manual execution: mysql -u user -p database_name < database/XXX_migration.sql
```

---

## 🚢 Deployment & Publishing

### Complete Deployment Process

The `npm run publish` command performs a complete production deployment:

1. **Pre-flight checks**
   - Validates `.env` production configuration exists
   - Checks FTP credentials

```
dalila/
├── api/                          # PHP Backend
│   ├── config/
│   │   ├── database.php         # Database connection
│   │   └── jwt.php              # JWT configuration
│   ├── controllers/             # Business logic
│   │   ├── AuthController.php
│   │   ├── PropertyController.php
│   │   ├── ContactController.php
│   │   ├── TodoController.php
│   │   └── ...
│   ├── middleware/
│   │   └── AuthMiddleware.php   # JWT authentication
│   ├── lib/
│   │   ├── RedirectService.php  # SEO redirect handler
│  🤝 Contributing

This is a private project. For team members:

1. Follow the development workflow above
2. Keep all code and comments in English
3. Test thoroughly before deploying
4. Document new features in PRD.md
5. Create migrations for database changes

---

## 📄 License

Proprietary - Buy With Dali © 2026  
All rights reserved.

---

## 👥 Team & Support

- **Website**: [buywithdali.com](https://buywithdali.com)
- **Project Owner**: Dalila Real Estate Team
- **Technical Support**: Development Team

---

## 📝 Quick Reference

### Essential Commands
```bash
npm run dev              # Start development
npm run build            # Build for production
npm run publish          # Deploy to production (requires .env setup!)
npm run backup           # Backup database
```

### ⚠️ Before First Deployment
**Required configuration files:**
- `api/.env` - Production database credentials and API settings
- `.env` (root) - FTP credentials for deployment

See **"Pre-Deployment Configuration"** section for details.

### Important URLs (Development)
- Public Site: http://localhost:5173
- Admin Panel: http://localhost:5174
- API Docs: http://localhost:8080/api

### Important URLs (Production)
- Public Site: https://buywithdali.com
- Admin Panel: https://buywithdali.com/admin
- API: https://buywithdali.com/api

### Default Admin Credentials
- Username: `admin`
- Password: `Dali2024!` (⚠️ Change in production!)

### Support Resources
- PRD: See [PRD.md](PRD.md) for feature documentation
- Deployment Guide: See [DEPLOY.md](DEPLOY.md)
- Issues: Contact development team

---

**Happy Coding! 🚀**
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React contexts
│   │   └── App.jsx             # Main app
│   ├── public/                 # Static assets
│   └── vite.config.js
│
├── admin/                       # Admin Panel (React + TypeScript)
│   ├── src/
│   │   ├── components/         # UI components (Shadcn)
│   │   ├── pages/              # Admin pages
│   │   ├── lib/
│   │   │   ├── api.ts          # API client
│   │   │   └── utils.ts
│   │   └── App.tsx
│   └── vite.config.ts
│
├── database/                    # SQL Migrations
│   ├── 001_init_clean.sql
│   ├── 002_triggers_procedures.sql
│   └── ...
│
├── scripts/                     # Automation scripts
│   ├── backup-remote.js        # Database backup
│   ├── upload-ftp.js           # FTP deployment
│   ├── prepare-deploy.sh       # Prepare files
│   └── ...
│
├── docs/                        # Documentation
│   └── audits/                 # System audits
│
├── deploy/                      # Build output (gitignored)
│
├── docker-compose.yml           # Docker services
├── package.json                 # Root scripts
├── PRD.md                       # Product requirements
├── DEPLOY.md                    # Deployment guide
└── README.md                    # This file
```

---

## 🔧 Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Frontend: Edit files in `fe/src`
   - Admin: Edit files in `admin/src`
   - API: Edit files in `api/controllers`
   - Database: Create new migration in `database/`

3. **Test locally**
   ```bash
   npm run dev          # Test with Docker
   # Or test individual components
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

5. **Deploy to production**
   ```bash
   npm run publish      # Automated deployment
   ```

### Common Development Tasks

#### Adding a New API Endpoint

1. Create or modify controller in `api/controllers/`
2. Add route in `api/index.php`
3. Test with curl or Postman
4. Update frontend to use new endpoint

#### Adding a New Property Field

1. Create migration: `database/XXX_add_field.sql`
2. Update `PropertyController.php` to handle new field
3. Update admin form in `admin/src/pages/PropertyForm.tsx`
4. Update frontend display in `fe/src/pages/PropertyDetail.jsx`

#### Creating a New Admin Page

1. Create page component in `admin/src/pages/`
2. Add route in `admin/src/App.tsx`
3. Create API endpoint if needed
4. Add navigation link in sidebar

---

## 🔒 Security & Best Practices

### Security Features
- **JWT Authentication** for admin API routes
- **Rate Limiting** on contact forms (configurable)
- **Origin Validation** for CORS
- **Input Sanitization** on all user inputs
- **SQL Injection Protection** via prepared statements
- **File Upload Validation** (MIME type checking)
- **Environment Variable Protection** (.env files in .gitignore)

### Best Practices

#### Code Standards
- **Language**: All code, comments, and UI text in **English only**
- **TypeScript**: Use for new admin components
- **PHP**: Follow PSR-12 coding standards
- **React**: Use functional components and hooks

#### Database Changes
- **Never modify the database directly in production**
- **Always create a migration file**
- **Test migrations locally first**
- **Backup before deploying**

#### Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `style:` Code style changes
- `test:` Testing
- `chore:` Maintenance

---

## 🐛 Troubleshooting

### Common Issues

#### Docker containers won't start
```bash
# Stop and remove all containers
npm run stop
docker-compose down -v

# Restart
npm run dev
```

#### Database connection errors
- Check `api/.env.local` has correct `DB_HOST` (use 'mysql' for Docker)
- Verify database container is running: `docker-compose ps`
- Check MySQL logs: `docker-compose logs mysql`

#### Frontend not hot-reloading
- Restart Vite dev server
- Clear browser cache
- Check console for errors

#### API 404 errors
- Verify `.htaccess` is present in `api/` directory
- Check Apache mod_rewrite is enabled
- Review `api/index.php` routes

#### Upload failures
- Check `api/uploads/` directory exists and is writable
- Verify PHP `upload_max_filesize` and `post_max_size` settings
- Check disk space on server

### Development Tips

- Use browser DevTools Network tab to debug API calls
- Check `docker-compose logs` for backend errors
- Use React DevTools for component debugging
- Enable PHP error display in development (already set in `api/index.php`)

---

## 📚 Additional Documentation

- **[PRD.md](PRD.md)** - Complete product requirements and features
- **[DEPLOY.md](DEPLOY.md)** - Detailed deployment instructions
- **[docs/audits/](docs/audits/)** - Security and system audits
   - Uploads all files from `/deploy` to remote server
   - Preserves directory structure
   - Shows upload progress

5. **Database Migrations**
   - Automatically detects new migration files
   - Executes migrations in sequential order
   - Handles complex migrations with DELIMITER blocks
   - Creates backup before migrations

6. **Post-deployment**
   - Generates fresh sitemap.xml
   - Clears server cache
   - Verifies deployment success

### ⚠️ IMPORTANT: Pre-Deployment Configuration

**Before running `npm run pu or want to skip certain steps:

```bash
# 0. FIRST TIME ONLY: Configure environment files (see section above)
#    - Edit api/.env with production database credentials
#    - Create root .env with FTP credentials

# 1. Build the application
npm run build

# 2. Prepare deployment files
npm run prepare-deploy

# 3. Create a backup first (IMPORTANT!)
npm run backup

# 4. Upload to production
npm run publish

# Or use FTP client to upload /deploy contents to your server
```

**First-time deployment checklist:**
- [ ] `api/.env` file configured with production database credentials
- [ ] Root `.env` file created with FTP credentials  
- [ ] Database exists on production server
- [ ] Database migrations ready in `/database` directory
- [ ] Test backup command works: `npm run backup`
- [ ] Verify FTP connection before full publishTACT_TO_EMAIL=dalila@buywithdali.com
CONTACT_ALLOWED_ORIGINS=https://buywithdali.com,https://www.buywithdali.com,https://new.buywithdali.com
# ... (see full example in api/.env.example)
```

#### 2. Root `.env` File (FTP Credentials)
This file contains FTP credentials for deployment. Create it in the root directory:

```bash
# Create root .env file
cat > .env << EOF
FTP_HOST=your-server.com
FTP_USER=your_ftp_username
FTP_PASS=your_ftp_password
FTP_PORT=21
FTP_PATH=/public_html
FTP_SFTP=false
SITE_URL=https://buywithdali.com
API_URL=https://buywithdali.com/api
EOF
```

**Note:** Both `.env` files are gitignored for security. Never commit them to the repository!

### Manual Deployment Steps

If you prefer manual control:

```bash
# 1. Build the application
npm run build

# 2. Prepare deployment files
npm run prepare-deploy
**Location:** `api/.env` (production database and API settings)

Ensure your `api/.env` file contains all required variables:

```bash
# Production Database
DB_HOST=localhost
DB_NAME=your_production_db
DB_USER=your_db_user
DB_PASSWORD=your_secure_password

# JWT Secret (generate a secure random string)
JWT_SECRET=your-production-jwt-secret-change-this

# Contact Form
CONTACT_TO_EMAIL=dalila@buywithdali.com
CONTACT_FROM_EMAIL=no-reply@buywithdali.com
CONTACT_FROM_NAME=Buy With Dali
CONTACT_ALLOWED_ORIGINS=https://buywithdali.com,https://www.buywithdali.com,https://new.buywithdali.com

# Rate Limiting
CONTACT_RATE_LIMIT=3
CONTACT_RATE_WINDOW=60
CONTACT_EMAIL_RATE_LIMIT=3
CONTACT_EMAIL_RATE_WINDOW=60
CONTACT_MIN_SECONDS=3
```

**Security Note:** The `api/.env` file is deployed to production and read by the PHP backend. Keep it secure and never commit it to Git.

### FTP Configuration

**Location:** `.env` (root directory - FTP credentials for deployment)

FTP settings are configured in the//buywithdali.com,https://www.buywithdali.com,https://new.buywithdali.com

# Rate Limiting
CONTACT_RATE_LIMIT=3
CONTACT_RATE_WINDOW=60
CONTACT_EMAIL_RATE_LIMIT=3
CONTACT_EMAIL_RATE_WINDOW=60
CONTACT_MIN_SECONDS=3
```

### FTP Configuration

FTP settings are configured in root `.env` file:

```bash
FTP_HOST=your-server.com
FTP_USER=your_ftp_username
FTP_PASS=your_ftp_password
FTP_PORT=21
FTP_PATH=/public_html
FTP_SFTP=false
```

---

## 🗄️ Database Migrations

### Migration System

Database changes are managed through numbered SQL files in `/database`:

```
database/
├── 001_init_clean.sql              # Initial schema
├── 002_triggers_procedures.sql     # Triggers and stored procedures
├── 003_production_migration.sql    # Migration from v1 to v2
├── 004_verify_admin_user.sql       # Admin user verification
├── ...
└── 038_round_all_areas.sql         # Latest migration
```

### Creating a New Migration

1. Create a new file with the next sequential number:
   ```bash
   touch database/039_your_migration_name.sql
   ```

2. Write your SQL changes:
   ```sql
   -- 039_your_migration_name.sql
   ALTER TABLE properties ADD COLUMN new_field VARCHAR(255);
   ```

3. Migrations are executed automatically during `npm run publish`

### Migration Best Practices

- **Always test locally first** using your development database
- **Use sequential numbering** (001, 002, 003...)
- **One purpose per migration** - keep migrations focused
- **Include rollback comments** for complex changes
- **Test with DELIMITER blocks** for triggers/procedures

# Start frontend (terminal 1)
cd fe && npm run dev

# Start admin (terminal 2)
cd admin && npm run dev

# Start PHP server (terminal 3)
cd api && php -S localhost:8080
```

### First-Time Setup

After starting the application:

1. **Access Admin Panel**: [http://localhost:5174](http://localhost:5174)
2. **Default credentials**:
   - Username: `admin`
   - Password: `Dali2024!` (⚠️ Change immediately in production!)
3. **Configure exchange rate** in Settings
4. **Add your first property** in Properties section

---

## 🏗️ Architecture & Stack

- **Frontend**: React (Vite) + TailwindCSS (Optional)
- **Admin**: React (Vite) + Shadcn UI
- **Backend**: Slim-style PHP API (PHP 8.0+)
- **Database**: MariaDB / MySQL
- **Tooling**: Docker, Bash scripts for deployment

---

## 🚢 Deployment & Maintenance

We use an automated build and publish flow. Detailed instructions can be found in [DEPLOY.md](file:///Users/gelso/workspace/Dalila/DEPLOY.md).

### Deployment Commands
```bash
npm run build      # Prepare local files in /deploy folder
npm run publish    # Upload to production and run migrations
npm run backup     # Create a remote database backup
```

### Database Migrations
Schema changes are managed through SQL files in the `/database` directory. They are applied automatically during the `publish` phase.

---

## 📁 Project Structure

- `fe/` - Public website source code.
- `admin/` - Admin dashboard source code.
- `api/` - PHP API backend components.
- `database/` - SQL migration scripts (Source of truth for schema).
- `scripts/` - Automation scripts for build, deploy, and backups.
- `_docs/` - Archive of technical specifications and design plans.

---

## 🔒 Security
- All admin endpoints are protected by JWT authentication.
- Off-Market section is protected by a password gateway.
- Automated backups are performed before every production deployment.

---

## 📄 License
Proprietary - Buy With Dali © 2026

---

## 👥 Contacts
- **Website**: [buywithdali.com](https://buywithdali.com)
- **Support**: Managed by Dalila Real Estate Team.
