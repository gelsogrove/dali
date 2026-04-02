# Product Requirements Document (PRD) - Buy With Dali

**Version:** 2.1  
**Last Updated:** April 2026  
**Status:** Production

## Project Overview
Buy With Dali is a luxury real estate platform for the Riviera Maya region. It features a high-performance React frontend, a custom PHP API, and a comprehensive Admin Panel for property and lead management.

## Core Technical Stack
- **Frontend**: React (Vite), TailwindCSS, AOS (Animations), React-Helmet-Async (SEO)
- **Admin**: React (Vite), Shadcn UI, React Query, TypeScript
- **Backend**: PHP 8.1+ (Custom Router), MySQL/MariaDB 10.6+
- **Infrastructure**: Dedicated Server (GoDaddy), FTP deployment
- **Development**: Docker Compose for local environment

## Key Features & Business Logic

### 1. Property Management
Properties are categorized into five main types:
- **Active Properties**: Standard listings available for sale
- **New Developments**: Multi-unit projects with price ranges and diverse unit types
- **Hot Deals**: Time-sensitive opportunities with special pricing
- **Off-Market**: Restricted listings visible only to authenticated users or via direct links
- **Land**: Specialized plots for development

**Property Features:**
- 38+ fields including location, pricing, features, and amenities
- Multi-currency support (USD, MXN, EUR) with automatic conversion
- JSON-based tags for features and amenities
- Auto-generation of property reference codes (PROP-YYYY-###)
- Auto-calculation of sqft from sqm
- SEO fields (title, description, OG tags)
- YouTube video embeds
- Google Maps integration
- Show on homepage toggle
- Delivery date tracking

### 2. Lead Management System

#### Property Access Requests
Visitors can request access to view off-market properties:
- Collects contact information and viewing preferences
- Tracks request status (pending, approved, rejected)
- Admin notification via email
- Integrated with property detail pages

#### Off-Market Invites
Email-based invitation system for exclusive off-market listings:
- Unique token generation for secure access
- Time-limited access with expiration tracking
- Usage tracking and analytics
- Email templates for professional outreach

#### Contact Form
Secure contact form with advanced protection:
- Origin validation (configurable allowed domains)
- Rate limiting (IP-based and email-based)
- Honeypot spam protection
- Time-based submission validation
- Dual email system (operator notification + customer confirmation)
- Property-specific contact forms with context

### 3. Todo/Task Management
Internal task tracking system for property operations:
- Status tracking (pending, in-progress, completed, cancelled)
- Priority levels (low, medium, high, urgent)
- Property association
- Due date management
- Assignee tracking
- Notes and descriptions
- Admin-only interface

### 4. SEO & Redirect System (301)
To maintain search engine rankings during site transitions:
- **Database-Driven Redirects**: A global `RedirectChecker` component intercepts route changes
- **Logic**: Queries `/api/redirects/resolve` for the current path. If a match is found, performs a 301-equivalent `window.location.replace`
- **Admin Interface**: Managers can create and track hits for each redirect rule
- **Sitemap Generation**: Automatic XML sitemap generation including all public pages

### 5. Off-Market Protection
- **Gateway**: Accessing `/off-market` requires a secure passkey (`Dali2026`)
- **Session Persistence**: Successful authentication is stored in `localStorage` and remains valid for **72 hours**
- **Visibility**: These listings are hidden from public grids and search engine indexing (`noindex`)
- **Invite System**: Email-based invitations with unique tokens for controlled access

### 6. Database Migrations
- **Automated Runner**: `api/database/apply_migrations.php` handles schema updates
- **Complexity Support**: Includes a custom SQL parser to handle `DELIMITER` blocks for triggers and stored procedures
- **Execution**: Triggered automatically during the `npm run publish` workflow
- **Sequential Numbering**: Migrations are numbered (001, 002, etc.) for ordered execution

### 7. Backup System
- **Web Interface**: View and download the 5 most recent SQL backups via Admin Panel
- **CLI Automation**: Manual backups are triggered via `npm run backup` to ensure high availability and bypass web timeout limits
- **Storage**: Backups stored in secure directory with timestamped filenames

### 8. Media Management
- **Property Images**: Multiple photos per property with order management
- **Photo Gallery**: Standalone photo gallery for lifestyle/area 
- **Currency**: Multi-currency support (USD, MXN, EUR) with a global exchange rate manageable via Admin
- **Responsiveness**: Mobile-first design for all listing pages and property details
- **Performance**: Optimized images, lazy loading, and efficient API calls
- **Accessibility**: Semantic HTML and ARIA labels where applicable

## Security Features
- **JWT Authentication**: Secure token-based authentication for Admin Panel
- **Rate Limiting**: Configurable rate limits on contact forms and API endpoints
- **Origin Validation**: CORS and origin checking on public forms
- **Input Sanitization**: All user inputs sanitized and validated
- **SQL Injection Protection**: Prepared statements throughout the API
- **File Upload Validation**: MIME type checking on all file uploads
- **Environment Variables**: Sensitive configuration stored in `.env` files

## Project Structure
```
/api                    # PHP Backend
  /config              # Database, JWT configuration
  /controllers         # Business logic (Property, Auth, Contact, etc.)
  /database            # SQL migrations
  /lib                 # Utilities (RedirectService, SitemapService)
  /middleware          # Authentication middleware
  /uploads             # Media storage

/admin                 # React Admin Panel (TypeScript)
  /src
    /components        # Reusable UI components (Shadcn)
    /pages            # Admin pages (Properties, Todos, etc.)
    /lib              # API client, utilities

/fe                    # React Public Frontend
  /src
    /components        # UI components
    /pages            # Public pages (Home, Listings, Detail)

/database              # SQL migrations and documentation
/docs                  # Project documentation
  /audits             # Security and system audits
/scripts               # Build and deployment scripts
```

## Environment Configuration

### Required Environment Variables
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database connection
- `JWT_SECRET` - JWT token signing key
- `CONTACT_TO_EMAIL` - Primary contact recipient
- `CONTACT_ALLOWED_ORIGINS` - Comma-separated list of allowed domains for contact form
- `CONTACT_RATE_LIMIT`, `CONTACT_RATE_WINDOW` - Rate limiting configuration

## Deployment Process
1. **Build**: `npm run build` - Compiles frontend and admin
2. **Prepare**: `npm run prepare-deploy` - Copies files to `/deploy` directory
3. **Publish**: `npm run publish` - FTP upload to production server
4. **Migrations**: Automatic database migrations during publish

## API Endpoints Summary
- `/api/auth/*` - Authentication (login, refresh)
- `/api/properties/*` - Property CRUD operations
- `/api/property-photos/*` - Image management
- `/api/blogs/*` - Blog management
- `/api/contact` - Contact form submission
- `/api/property-access-requests/*` - Access request management
- `/api/off-market-invites/*` - Invitation system
- `/api/todos/*` - Task management
- `/api/redirects/*` - SEO redirect management
- `/api/cities/*`, `/api/areas/*` - Location management
- `/api/exchange-rates/*` - Currency management

## Future Enhancements
- Property comparison feature
- Advanced search filters
- Email marketing integration
- CRM integration
- Mobile app (iOS/Android)
- Virtual tour integration
- **Automatic Fallbacks**: UI components handle missing images with elegant placeholder overlays
- **Optimized Uploads**: Separate controllers for different media types

### 9. Content Management

#### Blog System
- Rich text content with featured images
- SEO optimization (meta tags, OG tags)
- Category management
- Soft delete with 24-hour rule for SEO redirects
- Automatic sitemap inclusion

#### Testimonials
- Customer reviews and feedback
- Star rating system
- Photo uploads
- Admin approval workflow

#### Cities & Areas
- Location-based property filtering
- Custom descriptions and metadata
- SEO-optimized landing pages

## User Experience Standards
- **Language**: 100% English across the main site and Admin Panel
- **Currency**: Multi-currency support (USD, MXN, EUR) with a global exchange rate manageable via Admin
- **Responsiveness**: Mobile-first design for all listing pages and property details
- **Performance**: Optimized images, lazy loading, and efficient API calls
- **Accessibility**: Semantic HTML and ARIA labels where applicable

## Security Features
- **JWT Authentication**: Secure token-based authentication for Admin Panel
- **Rate Limiting**: Configurable rate limits on contact forms and API endpoints
- **Origin Validation**: CORS and origin checking on public forms
- **Input Sanitization**: All user inputs sanitized and validated
- **SQL Injection Protection**: Prepared statements throughout the API
- **File Upload Validation**: MIME type checking on all file uploads
- **Environment Variables**: Sensitive configuration stored in `.env` files

## Project Structure
```
/api                    # PHP Backend
  /config              # Database, JWT configuration
  /controllers         # Business logic (Property, Auth, Contact, etc.)
  /database            # SQL migrations
  /lib                 # Utilities (RedirectService, SitemapService)
  /middleware          # Authentication middleware
  /uploads             # Media storage

/admin                 # React Admin Panel (TypeScript)
  /src
    /components        # Reusable UI components (Shadcn)
    /pages            # Admin pages (Properties, Todos, etc.)
    /lib              # API client, utilities

/fe                    # React Public Frontend
  /src
    /components        # UI components
    /pages            # Public pages (Home, Listings, Detail)

/database              # SQL migrations and documentation
/docs                  # Project documentation
  /audits             # Security and system audits
/scripts               # Build and deployment scripts
```

## Environment Configuration

### Required Environment Variables
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database connection
- `JWT_SECRET` - JWT token signing key
- `CONTACT_TO_EMAIL` - Primary contact recipient
- `CONTACT_ALLOWED_ORIGINS` - Comma-separated list of allowed domains for contact form
- `CONTACT_RATE_LIMIT`, `CONTACT_RATE_WINDOW` - Rate limiting configuration

## Deployment Process
1. **Build**: `npm run build` - Compiles frontend and admin
2. **Prepare**: `npm run prepare-deploy` - Copies files to `/deploy` directory
3. **Publish**: `npm run publish` - FTP upload to production server
4. **Migrations**: Automatic database migrations during publish

## API Endpoints Summary
- `/api/auth/*` - Authentication (login, refresh)
- `/api/properties/*` - Property CRUD operations
- `/api/property-photos/*` - Image management
- `/api/blogs/*` - Blog management
- `/api/contact` - Contact form submission
- `/api/property-access-requests/*` - Access request management
- `/api/off-market-invites/*` - Invitation system
- `/api/todos/*` - Task management
- `/api/redirects/*` - SEO redirect management
- `/api/cities/*`, `/api/areas/*` - Location management
- `/api/exchange-rates/*` - Currency management

## Future Enhancements
- Property comparison feature
- Advanced search filters
- Email marketing integration
- CRM integration
- Mobile app (iOS/Android)
- Virtual tour integration
