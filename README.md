# Dalila - Buy With Dali

Premium real estate property management system designed for the Mexican market. Standardized in English with high-performance React frontends and a robust PHP API backend.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Git

### Local Installation

```bash
# 1. Clone repository
git clone https://github.com/gelsogrove/dali.git
cd dali

# 2. Configure environment
## Development Standards

- **Language**: All code, comments, documentation, and UI strings must be in **English**. Italian or other languages are not permitted.
- **Workflow**: All database changes must be managed via migrations in `api/database/migrations`.
cp .env.example .env
# Edit .env with your local database credentials

# 3. Start development environment
npm run dev
```

**Services**:
- **Public Site**: [http://localhost:5173](http://localhost:5173)
- **Admin Panel**: [http://localhost:5174](http://localhost:5174)
- **API Backend**: [http://localhost:8080/api](http://localhost:8080/api)

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
