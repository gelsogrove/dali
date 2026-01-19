# Dalila Property Management System

Sistema completo per la gestione di proprietà immobiliari con frontend React, pannello amministrativo e API PHP.

## 📖 Cosa Stiamo Facendo?

### 🎯 Obiettivo del Progetto

1. **Frontend Pubblico (fe/)**: Sito React responsive **attualmente statico** che verrà dinamizzato con le API del backend
2. **Pannello Admin (admin/)**: Interfaccia React + TypeScript per gestire contenuti (proprietà, blog, gallerie) con **massima sicurezza**
3. **Backend API (BE/)**: API PHP RESTful con JWT authentication per servire i dati al frontend e gestire upload
4. **Database**: Inizializzato con **migrazione da WordPress** (non parte vuoto, importiamo i dati esistenti)

### 📊 Entità Gestite

- ✅ **Properties**: Proprietà immobiliari (titolo, prezzo, camere, bagni, descrizione, etc.)
- ✅ **Photo Galleries**: Gallerie fotografiche delle proprietà (4 size automatiche)
- ✅ **Blog Posts**: Articoli del blog (TODO - da implementare)
- ✅ **Videos**: Video delle proprietà (TODO - da completare)

### 🔒 Sicurezza

**⚠️ REPOSITORY PUBBLICO SU GITHUB**
- ❌ **ZERO password nel codice**
- ❌ File `.env` contiene **SOLO placeholder vuoti**
- ✅ Password configurate **SOLO sul server** (GoDaddy/cPanel)
- ✅ Vedi [SECURITY.md](SECURITY.md) per dettagli completi

### 🖼️ Gestione Immagini

**Immagini del Sito (design/UI)** - `fe/public/images/`
- Logo, icone, banner, immagini statiche del design
- ✅ **COMMITTATE nel repository Git**
- Fanno parte del codice sorgente

**Immagini dei Contenuti (proprietà/blog)** - `BE/uploads/`
- Foto proprietà, video, immagini caricate via admin panel
- ❌ **NON committate nel repository Git**
- Generate dagli utenti, dinamiche
- Gestite dall'API PHP (upload, resize, serve)

## 📋 Prerequisiti

- **Node.js** 18+ e npm 9+
- **Docker Desktop** (macOS/Windows) o Docker Engine (Linux)
- **Docker Compose** v2.0+
- **Git**

## 🛠️ Quick Start

### ⚠️ IMPORTANTE - Sicurezza

**Questo repository è pubblico su GitHub.**
- Il file `.env` NON contiene password reali
- Le password vanno configurate SOLO sul server
- Vedi [SECURITY.md](SECURITY.md) per dettagli

### 1. Clone and Setup

```bash
# Navigate to project directory
cd /Users/gelso/workspace/Dalila

# Il file .env è già presente ma VUOTO
# Le password vanno configurate sul server (vedi SECURITY.md)

# Per sviluppo locale con Docker, configurare .env con password di test:
# (MAI committare queste password!)
```

### 2. Configurare Password (Solo Locale)

**ATTENZIONE**: Queste password sono SOLO per sviluppo locale!

Editare `.env` e aggiungere password di test:
```env
MYSQL_ROOT_PASSWORD=test_root_password
MYSQL_PASSWORD=test_dalila_password
JWT_SECRET=test-jwt-secret-min-32-characters-for-local-dev-only
```

**NON committare questo file modificato!**

### 2. Start Docker Containers

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 3. Install Admin Panel Dependencies

```bash
# Install Node.js dependencies
cd admin
npm install

# Note: Docker will handle this automatically, but you can run locally too
```

### 4. Access Applications

- **Backend API**: http://localhost:8080/api
- **Admin Panel**: http://localhost:5174
- **MySQL**: localhost:3306

### 5. Default Login Credentials

```
Email: admin@dalila.com
Password: Admin@123
```

**⚠️ CHANGE THESE IN PRODUCTION!**

## 📁 Project Structure

```
Dalila/
├── docker-compose.yml          # Docker orchestration
├── .env.example                # Environment variables template
├── BE/                         # PHP Backend
│   ├── Dockerfile
│   ├── apache-config.conf
│   ├── .htaccess
│   ├── api/
│   │   ├── index.php          # API router
│   │   ├── controllers/       # Business logic
│   │   └── middleware/        # Auth & CSRF
│   ├── config/
│   │   ├── database.php       # Database connection
│   │   ├── jwt.php            # JWT handler
│   │   └── csrf.php           # CSRF protection
│   └── database/
│       └── init.sql           # Database schema
├── admin/                # React Admin Panel
│   ├── Dockerfile.dev
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── lib/               # Utilities & API
│   │   └── store/             # Zustand stores
│   ├── package.json
│   └── vite.config.ts
└── fe/                         # Public website (existing)
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify` - Verify JWT token

### Properties
- `GET /api/properties` - List properties (public)
- `GET /api/properties/{id}` - Get property details (public)
- `POST /api/properties` - Create property (auth required)
- `PUT /api/properties/{id}` - Update property (auth required)
- `DELETE /api/properties/{id}` - Delete property (admin only)

### Uploads
- `POST /api/upload/property-image` - Upload property image
- `POST /api/upload/video` - Upload video file

### Health Check
- `GET /api/health` - API status check

## 🗄️ Database Schema

### Tables
- `admin_users` - Admin accounts with roles
- `properties` - Property listings
- `photogallery` - Property images (multiple sizes)
- `videos` - Property videos
- `property_amenities` - Property features
- `sessions` - JWT session management
- `activity_log` - Audit trail

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f [service-name]

# Rebuild containers
docker-compose up -d --build

# Access MySQL
docker-compose exec mysql mysql -u dalila_user -p dalila_db

# Access backend shell
docker-compose exec backend bash

# Clean up (removes volumes - WARNING: deletes data)
docker-compose down -v
```

## 💻 Development

### Backend Development
```bash
# Watch backend logs
docker-compose logs -f backend

# Access PHP container
docker-compose exec backend bash

# Test API endpoint
curl http://localhost:8080/api/health
```

### Frontend Development
```bash
cd admin

# Install dependencies
npm install

# Run development server (outside Docker)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## 🔒 Security Features

- SQL injection prevention (prepared statements)
- CSRF token validation
- JWT token authentication with expiration
- Password hashing with bcrypt
- File upload validation and sanitization
- XSS protection headers
- Role-based access control (admin, editor, viewer)
- Activity logging for audit trail
- Secure session management

## 🚀 Production Deployment

### cPanel Deployment

1. **Prepare Files**
   ```bash
   # Build frontend
   cd admin
   npm run build
   
   # Copy BE folder to cPanel public_html/api
   # Copy admin/dist to public_html/admin
   ```

2. **Database Setup**
   - Create MySQL database in cPanel
   - Import `BE/database/init.sql`
   - Update credentials in production

3. **Configuration**
   - Create `.env` file with production values
   - Change JWT secret
   - Update database credentials
   - Set proper file permissions (755 for directories, 644 for files)
   - Enable HTTPS
   - Configure CORS for production domain

4. **Security Checklist**
   - [ ] Change default admin password
   - [ ] Update JWT secret key (32+ characters)
   - [ ] Enable HTTPS
   - [ ] Configure firewall rules
   - [ ] Set up regular backups
   - [ ] Enable rate limiting
   - [ ] Disable error display in production
   - [ ] Set secure file permissions
   - [ ] Configure CORS properly
   - [ ] Enable PHP OPcache

## 🧪 Testing

### Test Backend API
```bash
# Health check
curl http://localhost:8080/api/health

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dalila.com","password":"Admin@123"}'

# Get properties (with token)
curl http://localhost:8080/api/properties \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Admin Panel
1. Open http://localhost:5174
2. Login with default credentials
3. Navigate to Properties
4. Create a new property
5. Upload images
6. View dashboard statistics

## 📝 Environment Variables

**IMPORTANTE**: Il file `.env` nel repository NON contiene password reali!

### Configurazioni Statiche (nel codice)

Le seguenti configurazioni sono definite direttamente in `BE/api/controllers/UploadController.php`:

```php
private $maxImageSize = 10485760;      // 10MB
private $maxVideoSize = 104857600;     // 100MB
private $allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
private $allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime'];
```

### Configurazioni Server (Sensibili)

Queste vanno impostate sul server (GoDaddy/cPanel):

```bash
# Database (configurare in cPanel)
MYSQL_DATABASE=dalila_db
MYSQL_USER=dalila_user
MYSQL_PASSWORD=<password-sicura-qui>

# JWT Secret (generare con: openssl rand -base64 32)
JWT_SECRET=<chiave-sicura-32-caratteri>

# Environment
ENVIRONMENT=production
```

**Vedi [SECURITY.md](SECURITY.md) per istruzioni complete.**

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if MySQL is running
docker-compose ps

# View MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### Backend Errors
```bash
# Check backend logs
docker-compose logs backend

# Access backend container
docker-compose exec backend bash

# Check PHP error log
docker-compose exec backend tail -f /var/log/apache2/error.log
```

### Frontend Issues
```bash
# Check admin panel logs
docker-compose logs admin

# Rebuild node_modules
cd admin
rm -rf node_modules
npm install
```

### Password e Sicurezza

### 📖 Documentation
- [SECURITY.md](SECURITY.md) - **LEGGI PRIMA!** Sicurezza e password
- [LOCAL-SETUP.md](LOCAL-SETUP.md) - Setup sviluppo locale veloce
- [GODADDY-SETUP.md](GODADDY-SETUP.md) - Configurazione password in GoDaddy/cPanel
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy completo su cPanel
- [TESTING.md](TESTING.md) - Testing e troubleshooting

### 🔗 External Resources
Vedi la documentazione completa:
- [SECURITY.md](SECURITY.md) - Best practices sicurezza
- [LOCAL-SETUP.md](LOCAL-SETUP.md) - Setup sviluppo locale
- [GODADDY-SETUP.md](GODADDY-SETUP.md) - Configurazione password server

## 📚 Additional Resources

- [PHP Documentation](https://www.php.net/docs.php)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Docker Documentation](https://docs.docker.com/)
- [MariaDB Documentation](https://mariadb.org/documentation/)

## 📄 License

Proprietary - All rights reserved

## 👥 Support

For support, please contact the development team.

---

**Built with ❤️ for Dalila Property Management**
