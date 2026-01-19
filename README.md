# Dalila - Buy With Dali

Sistema di gestione proprietà immobiliari full-stack con React frontend, API PHP backend e pannello di amministrazione.

## 🚀 Quick Start

### Requisiti
- Docker & Docker Compose
- Node.js 20+ (per sviluppo frontend)
- Git

### Installazione

```bash
# 1. Clone repository
git clone https://github.com/gelsogrove/dali.git
cd dali

# 2. Configura ambiente (primo avvio)
cp .env.example .env
# Modifica .env con le tue credenziali

# 3. Avvia tutti i servizi
npm run dev
# oppure usa lo script rapido
./scripts/start.sh

# Sezioni admin/API
- Le credenziali di default non sono più mostrate nell'interfaccia: imposta le tue nel backend.
```

Servizi disponibili:
- **Frontend**: http://localhost:5173
- **Admin Panel**: http://localhost:5174
- **API Backend**: http://localhost:8080/api
- **MySQL**: localhost:3306

## 📦 Comandi NPM

```bash
npm run dev          # Avvia Docker + FE + Admin in sviluppo
npm run build        # Build produzione di FE e Admin
npm run seed         # Esegue seed database (migrazione WordPress)
npm run docker:up    # Solo Docker (MySQL + Backend)
npm run docker:down  # Ferma tutti i container
npm run docker:logs  # Visualizza log container
```

## 🗄️ Database

### Struttura
Il database `dalila_db` include 7 tabelle:

- **properties** - Annunci immobiliari
- **photogallery** - Immagini proprietà (4 dimensioni)
- **videos** - Video proprietà
- **property_amenities** - Caratteristiche (piscina, garage, etc.)
- **admin_users** - Utenti amministratori
- **sessions** - Token JWT
- **activity_log** - Log audit

### Sample Data
Il database viene inizializzato con:
- 3 proprietà di esempio
- 1 utente admin (admin@dalila.com)

### Accesso Database

```bash
# Via Docker
docker exec -it dalila-mysql mysql -udalila_user -p dalila_db

# Via MySQL client
mysql -h127.0.0.1 -P3306 -udalila_user -p dalila_db
```

### Reset Database

```bash
# Cancella volumi e ricrea
docker-compose down -v
docker-compose up -d
```

### Script SQL
- `init.sql` — init schema/dati base e dati di esempio (blogs inclusi)

## 🔌 API Endpoints

### Home (Public, No Auth)
```bash
# Get homepage data (featured properties + videos)
GET /api/home

# Get only featured videos
GET /api/home/videos
```

### Properties
```bash
# Lista tutte le proprietà
GET /api/properties

# Singola proprietà
GET /api/properties/{id}

# Crea proprietà (richiede auth)
POST /api/properties

# Aggiorna proprietà (richiede auth)
PUT /api/properties/{id}

# Elimina proprietà (richiede auth)
DELETE /api/properties/{id}
```

### Authentication
```bash
# Login
POST /api/auth/login
Body: {"email": "admin@dalila.com", "password": "Admin@123"}

# Logout
POST /api/auth/logout
Headers: Authorization: Bearer {token}

# Verifica token
GET /api/auth/me
Headers: Authorization: Bearer {token}
```

### Upload
```bash
# Upload immagine (genera 4 dimensioni)
POST /api/upload/image
Body: multipart/form-data con file

# Upload video
POST /api/upload/video
Body: multipart/form-data con file
```

### Health Check
```bash
GET /api/health
```

## 🖼️ Gestione Immagini

⚠️ **Due cartelle separate per la sicurezza del repository pubblico:**

### 1. fe/public/images/ (Design, IN GIT)
```
fe/public/images/
├── logo.svg           # Logo sito
├── hero-home.jpg      # Banner homepage
├── about-hero.jpg     # Banner pagina About
└── ...                # Altre immagini di design
```
✅ **Incluse in Git** - Immagini di design e layout

### 2. BE/uploads/ (User Content, NOT IN GIT)
```
BE/uploads/
├── properties/
│   ├── original/      # Immagini originali
│   ├── large/         # 1200x800px
│   ├── medium/        # 800x600px
│   └── thumbnail/     # 300x200px
└── videos/
```
❌ **Escluse da Git** (.gitignore) - Content caricato dagli utenti

## 🔒 Sicurezza

⚠️ **Repository pubblico su GitHub**

### File Sensibili (`.gitignore`)
```
.env                    # Credenziali database
BE/uploads/            # Contenuti utenti
old/                   # WordPress vecchio
**/dist/               # Build artifacts
```

### Prima di ogni commit
```bash
# Verifica che .env non sia incluso
git status

# Se .env è tracciato per errore
git rm --cached .env
```

### Credenziali Produzione
- ❌ Mai committare password reali
- ✅ Usare `.env.example` come template
- ✅ Password produzione solo su server (GoDaddy)

## 🚢 Deploy su GoDaddy

Vedi documentazione completa in `FTP-DEPLOY.md`.

### Quick Deploy
```bash
# 1. Build produzione
npm run build

# 2. Prepara file per upload
npm run deploy:prepare

# 3. Upload via FTP (manuale o script)
# Vedi FTP-DEPLOY.md per dettagli
```

### Configurazione Server
- PHP 8.0+
- MySQL 5.7+
- Estensioni: PDO, GD, OpenSSL
- Vedi `GODADDY-SETUP.md` per setup completo

## 📚 Documentazione

- **MIGRATION.md** - Migrazione da WordPress
- **FTP-DEPLOY.md** - Deploy su GoDaddy
- **SECURITY.md** - Best practice sicurezza
- **GODADDY-SETUP.md** - Configurazione hosting
- **LOCAL-SETUP.md** - Sviluppo locale
- **TESTING.md** - Test API

## 🏗️ Struttura Progetto

```
Dalila/
├── BE/                      # Backend PHP
│   ├── api/
│   │   ├── controllers/     # Logic business
│   │   ├── middleware/      # Auth JWT
│   │   └── index.php        # Router
│   ├── config/
│   │   ├── database.php     # Connessione DB
│   │   └── jwt.php          # JWT Handler
│   ├── database/
│   │   ├── init.sql         # Schema + seed
│   │   └── migrate.php      # Import WordPress
│   └── uploads/             # User content (escluso da git)
│
├── fe/                      # Frontend pubblico React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   └── public/
│       └── images/          # Immagini design (in git)
│
├── admin/                   # Admin panel React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   └── public/
│
├── docker-compose.yml       # Orchestrazione servizi
├── package.json             # Script NPM unificati
└── .env                     # Config locale (escluso da git)
```

## 🧪 Testing

### Test API manualmente
```bash
# Health check
curl http://localhost:8080/api/health

# Lista proprietà
curl http://localhost:8080/api/properties

# Singola proprietà
curl http://localhost:8080/api/properties/1

# Login admin
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dalila.com","password":"Admin@123"}'
```

Vedi `TESTING.md` per test completi.

## 🛠️ Sviluppo

### Workflow tipico
```bash
# 1. Pull ultimi cambiamenti
git pull origin main

# 2. Avvia ambiente sviluppo
npm run dev

# 3. Sviluppa su branch
git checkout -b feature/nome-feature

# 4. Commit e push
git add .
git commit -m "feat: descrizione"
git push origin feature/nome-feature

# 5. Crea Pull Request su GitHub
```

### Logs
```bash
# Backend PHP
docker logs dalila-backend

# MySQL
docker logs dalila-mysql

# Frontend (in terminal npm run dev)
# Admin (in terminal npm run dev)
```

## 🔧 Troubleshooting

### Database non si connette
```bash
# Reset completo volumi
docker-compose down -v
docker-compose up -d
# Attendi 30s per init.sql
```

### API ritorna 500
```bash
# Controlla log PHP
docker logs dalila-backend | grep "Fatal error"

# Verifica path config
docker exec dalila-backend ls -la /var/www/html/config/
```

### Frontend non vede API
```bash
# Verifica CORS in BE/api/index.php
# Controlla che API_URL in FE sia corretta
```

### Immagini non si caricano
```bash
# Verifica permessi uploads
docker exec dalila-backend ls -la /var/www/html/uploads/
docker exec dalila-backend chmod -R 777 /var/www/html/uploads/
```

## 📝 TODO

### Backend
- [ ] Implement blog posts API
- [ ] Complete video upload processing
- [ ] Add property search/filter endpoints
- [ ] Implement email notifications

### Frontend
- [x] ~~Convertire da dati statici a API~~ (da fare)
- [ ] Add property search/filters
- [ ] Implement contact forms
- [ ] Add map integration
- [ ] SEO optimization

### Admin Panel
- [ ] Property bulk operations
- [ ] Analytics dashboard
- [ ] User management interface
- [ ] Image gallery editor

### DevOps
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated backups
- [ ] Monitoring/logging
- [ ] SSL certificate automation

## 📄 Licenza

Proprietario - Buy With Dali © 2026

## 👥 Contatti

- **Website**: https://buywithdali.com
- **GitHub**: https://github.com/gelsogrove/dali

---

**Nota**: Questo è un repository **pubblico**. Non committare mai credenziali, password o dati sensibili.
