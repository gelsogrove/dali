# Product Requirements Document (PRD) - Buy With Dali

## Project Overview
Buy With Dali is a luxury real estate platform for the Riviera Maya region. It features a high-performance React frontend, a custom PHP API, and a comprehensive Admin Panel for property and lead management.

## Core Technical Stack
- **Frontend**: React (Vite), TailwindCSS, AOS (Animations), React-Helmet-Async (SEO).
- **Admin**: React (Vite), Shadcn UI, React Query.
- **Backend**: PHP (Custom Router), MySQL/MariaDB.
- **Infrastructure**: Dedicated Server (GoDaddy), FTP deployment.

## Key Features & Business Logic

### 1. Property Management
Properties are categorized into four main types:
- **Active Properties**: Standard listings available for sale.
- **New Developments**: Multi-unit projects with price ranges and diverse unit types.
- **Hot Deals**: Time-sensitive opportunities with special pricing.
- **Off-Market**: Restricted listings visible only to authenticated users or via direct links.
- **Land**: Specialized plots for development.

### 2. SEO & Redirect System (301)
To maintain search engine rankings during the transition from the old site:
- **Database-Driven Redirects**: A global `RedirectChecker` component intercepts route changes.
- **Logic**: It queries `/api/redirects/resolve` for the current path. If a match is found in the `redirects` table, it performs a 301-equivalent `window.location.replace`.
- **Admin Interface**: Managers can create and track hits for each redirect rule.

### 3. Off-Market Protection
- **Gateway**: Accessing `/off-market` requires a secure passkey (`Dali2026`).
- **Session Persistence**: Successful authentication is stored in `localStorage` and remains valid for **72 hours**.
- **Visibility**: These listings are hidden from public grids and search engine indexing (`noindex`).

### 4. Database Migrations
- **Automated Runner**: `api/database/apply_migrations.php` handles schema updates.
- **Complexity Support**: Includes a custom SQL parser to handle `DELIMITER` blocks for triggers and stored procedures.
- **Execution**: Triggered automatically during the `npm run publish` workflow.

### 5. Backup System
- **Web Interface**: View and download the 5 most recent SQL backups.
- **CLI Automation**: Manual backups are triggered via `npm run backup` to ensure high availability and bypass web timeout limits.

### 6. Media Management
- **Automatic Fallbacks**: UI components handle missing images with elegant placeholder overlays.
- **Optimized Uploads**: Separate controllers for Property Images, Videos, and Attachments (PDF/Docx).

## User Experience Standards
- **Language**: 100% English across the main site and Admin Panel.
- **Currency**: Multi-currency support (USD, MXN, EUR) with a global exchange rate manageable via Admin.
- **Responsiveness**: Mobile-first design for all listing pages and property details.
