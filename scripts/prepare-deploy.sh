#!/bin/bash

# Script di preparazione deploy per Dalila Property Management
# Questo script crea una cartella deploy/ con tutti i file pronti per il caricamento su GoDaddy

set -e  # Esci se un comando fallisce

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🚀 DALILA PROPERTY MANAGEMENT - DEPLOY PREPARATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Directory di deploy
DEPLOY_DIR="deploy"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Pulisci deploy directory esistente
if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}⚠️  Rimuovo deploy directory esistente...${NC}"
    rm -rf "$DEPLOY_DIR"
fi

# Crea struttura deploy
echo -e "${GREEN}📁 Creo struttura deploy...${NC}"
mkdir -p "$DEPLOY_DIR"/{admin,api/uploads/{properties,videos,galleries,blogs}}

# ============================================
# BUILD FRONTEND
# ============================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🏗️  Building Frontend (fe/)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ ! -d "fe/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installazione dipendenze frontend...${NC}"
    cd fe && npm install && cd ..
fi

cd fe
npm run build
cd ..

if [ ! -d "fe/dist" ]; then
    echo -e "${RED}❌ Build frontend fallito!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build completato${NC}"
cp -r fe/dist/* "$DEPLOY_DIR/"
cp fe/public/fonts "$DEPLOY_DIR/" 2>/dev/null || true
cp fe/public/images "$DEPLOY_DIR/" 2>/dev/null || true

# ============================================
# BUILD ADMIN
# ============================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🏗️  Building Admin Panel (admin/)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ ! -d "admin/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installazione dipendenze admin...${NC}"
    cd admin && npm install --legacy-peer-deps && cd ..
fi

cd admin
npm run build
cd ..

if [ ! -d "admin/dist" ]; then
    echo -e "${RED}❌ Build admin fallito!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Admin build completato${NC}"
cp -r admin/dist/* "$DEPLOY_DIR/admin/"

# ============================================
# COPIA API (PHP)
# ============================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   📦 Preparazione API Backend (PHP)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${GREEN}📋 Copio file API e Migrazioni...${NC}"
cp api/index.php "$DEPLOY_DIR/api/"
cp -r api/controllers "$DEPLOY_DIR/api/"
cp -r api/middleware "$DEPLOY_DIR/api/"
cp -r api/config "$DEPLOY_DIR/api/"
cp -r api/lib "$DEPLOY_DIR/api/" 2>/dev/null || true
cp api/.htaccess "$DEPLOY_DIR/api/" 2>/dev/null || true

# Copia database scripts e migrazioni
mkdir -p "$DEPLOY_DIR/api/database/migrations"
cp api/database/*.php "$DEPLOY_DIR/api/database/"
cp database/*.sql "$DEPLOY_DIR/api/database/migrations/" 2>/dev/null || true
cp database/init.sql "$DEPLOY_DIR/init.sql" 2>/dev/null || cp api/database/init.sql "$DEPLOY_DIR/init.sql" 2>/dev/null || true

echo -e "${GREEN}✅ File API e Migrazioni copiati${NC}"

# ============================================
# CREA .htaccess FILES
# ============================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   ⚙️  Creazione file .htaccess${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Frontend .htaccess
cat > "$DEPLOY_DIR/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirect to HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  
  # Handle React Router
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /router.php [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Disable directory listing
Options -Indexes

# Compress text files
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
EOF

# Crea router.php per handling dei redirect 301 server-side
cat > "$DEPLOY_DIR/router.php" << 'EOF'
<?php
// router.php intercepts requests for 301 SEO redirects before serving React

$__baseDir = __DIR__;

// Load environment to ensure DB check works
if (file_exists($__baseDir . '/api/load-env.php')) {
    require_once $__baseDir . '/api/load-env.php';
}

require_once $__baseDir . '/api/config/database.php';
require_once $__baseDir . '/api/lib/RedirectService.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove common prefixes
$path = preg_replace('#^/new/#', '/', $path);
$path = preg_replace('#^/api/#', '/', $path);
$path = preg_replace('#^/admin/#', '/', $path);

// Only check DB if it's a non-api, non-admin route (e.g. /properties)
if (strpos($path, '.') === false) {
    try {
        $db = new Database();
        $conn = $db->getConnection();
        $service = new RedirectService($conn);
        
        $rule = $service->findByUrlOld($path);
        if ($rule && !empty($rule['urlNew'])) {
            header("HTTP/1.1 301 Moved Permanently");
            header("Location: " . $rule['urlNew']);
            exit;
        }
    } catch (Exception $e) {
        error_log("Router Redirect Error: " . $e->getMessage());
    }
}

// Fallback to React index.html
require __DIR__ . '/index.html';
EOF

# Admin .htaccess
cat > "$DEPLOY_DIR/admin/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/
  
  # Handle React Router
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /admin/index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Disable directory listing
Options -Indexes
EOF

# API .htaccess (se non esiste già)
if [ ! -f "$DEPLOY_DIR/api/.htaccess" ]; then
cat > "$DEPLOY_DIR/api/.htaccess" << 'EOF'
RewriteEngine On

# Redirect API requests to index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ index.php [QSA,L]

# Prevent direct access to sensitive files
<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>

# Protect configuration files
<FilesMatch "(^config\.php|\.env)$">
    Order allow,deny
    Deny from all
</FilesMatch>

# Set security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Disable directory listing
Options -Indexes

# Set upload file size limits
php_value upload_max_filesize 10M
php_value post_max_size 10M
EOF
fi

echo -e "${GREEN}✅ File .htaccess creati${NC}"

# ============================================
# END PREPARATION
# ============================================

# ============================================
# CREA .env.example
# ============================================
echo -e "\n${GREEN}⚙️  Creo file .env.example...${NC}"
cat > "$DEPLOY_DIR/api/config/.env.example" << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_NAME=dalila_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=generate_a_random_secret_key_here
JWT_EXPIRY=86400

# API Configuration
API_URL=https://buywithdali.com/api
FRONTEND_URL=https://buywithdali.com

# Upload Configuration
UPLOAD_MAX_SIZE=10485760
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp
EOF

# ============================================
# CREA README DEPLOY
# ============================================
cat > "$DEPLOY_DIR/README_DEPLOY.md" << 'EOF'
# 🚀 DALILA PROPERTY MANAGEMENT - GUIDA DEPLOY

## 📦 Contenuto Pacchetto Deploy

```
deploy/
├── index.html            # Frontend pubblico (sito React)
├── assets/
├── .htaccess
├── admin/                # Admin panel
│   ├── index.html
│   ├── assets/
│   └── .htaccess
├── api/                  # Backend PHP
│   ├── index.php
│   ├── controllers/
│   ├── middleware/
│   ├── config/
│   ├── uploads/          # 755 permissions needed!
│   └── .htaccess
└── dalila_db_full.sql   # Database completo
```

---

## 📋 STEP 1: CARICAMENTO FILE VIA FTP

### Connessione FTP (GoDaddy cPanel)
1. Apri FileZilla o cPanel File Manager
2. Connettiti al tuo hosting
3. Vai alla cartella principale (root)

### Carica i file così:

```
deploy/* (eccetto admin/ e api/)  →  public_html/          # Radice sito pubblico
deploy/admin/*                  →  public_html/admin/    # Pannello admin
deploy/api/*                    →  public_html/api/      # Backend API
```

**⚠️ IMPORTANTE:**
- **NON** sovrascrivere `api/config/database.php` se già configurato!
- Usa il file `.env.example` come riferimento

---

---

## 🗄️ STEP 2: DATABASE & MIGRATIONS

### Opzione A: Migrazioni Automatiche (Consigliata)
Invece di lanciare query manuali, usa il nuovo Migration Runner:
1. Assicurati di aver configurato le credenziali nel punto successivo.
2. Vai all'URL: `https://tuodominio.com/api/database/apply_migrations.php?token=dalila_secret_2026`
3. Lo script troverà ed eseguirà automaticamente tutti i file nuovi nella cartella `database/`.

### Opzione B: Via phpMyAdmin (Manuale)
1. Accedi a cPanel → **phpMyAdmin**
2. Seleziona il database
3. Clicca **Importa**
4. Scegli `dalila_db_full.sql` (solo per prima installazione) o carica singoli file da `api/database/migrations/`
5. Clicca **Esegui**

### Credenziali Database
Annota le credenziali fornite da GoDaddy:
- Host: `localhost` (di solito)
- Database name: `dalila_db`
- Username: (fornito da GoDaddy)
- Password: (fornito da GoDaddy)

---

## ⚙️ STEP 3: CONFIGURA API

### 1. Modifica `api/config/database.php`

```php
<?php
return [
    'host' => 'localhost',
    'database' => 'dalila_db',
    'username' => 'TUO_USERNAME',    // ← CAMBIA
    'password' => 'TUA_PASSWORD',    // ← CAMBIA
    'charset' => 'utf8mb4'
];
```

### 2. Genera JWT Secret

Usa questo comando o un generatore online:
```bash
openssl rand -base64 32
```

Modifica `api/config/jwt.php`:
```php
<?php
return [
    'secret_key' => 'TUO_JWT_SECRET_QUI',    // ← INCOLLA QUI
    'algorithm' => 'HS256',
    'expiry' => 86400  // 24 ore
];
```

---

## 🔐 STEP 4: IMPOSTA PERMESSI

### Via cPanel File Manager o FTP:

```bash
api/uploads/              → 755 (rwxr-xr-x)
api/uploads/properties/   → 755
api/uploads/videos/       → 755
api/uploads/galleries/    → 755
api/uploads/blogs/        → 755
```

**Come fare in cPanel:**
1. File Manager → api/uploads
2. Click destro sulla cartella → **Change Permissions**
3. Imposta **755** per tutte le cartelle upload

---

## 🧪 STEP 5: TEST

### Test API
```
https://tuodominio.com/api/health
```
Deve restituire: `{"success":true,"message":"API is running"}`

### Test Frontend
```
https://tuodominio.com/
```
Deve caricare il sito

### Test Admin
```
https://tuodominio.com/admin/
```
Deve caricare il pannello admin

### Login Admin (default)
- Email: `admin@dalila.com`
- Password: `Admin@123`

**⚠️ CAMBIA SUBITO LA PASSWORD IN PRODUZIONE!**

---

## 🔧 RISOLUZIONE PROBLEMI

### 500 Internal Server Error
- Verifica permessi upload directory (755)
- Controlla file `.htaccess` presente in tutte le cartelle
- Verifica PHP 7.4+ attivo in cPanel

### Credenziali Database Non Funzionano
- Verifica username/password in `config/database.php`
- Assicurati che l'utente abbia accesso al database
- Controlla host (potrebbe non essere `localhost`)

### Upload Immagini Non Funziona
- Verifica permessi cartella `api/uploads/` (755)
- Controlla limite upload PHP in cPanel (almeno 10MB)
- Verifica che le sottocartelle esistano

### React Router 404 Error
- Verifica che `.htaccess` sia presente in `public_html/` e `admin/`
- Controlla che `mod_rewrite` sia abilitato (chiedi a GoDaddy)

### API Non Risponde
- Verifica che `api/.htaccess` contenga le regole di rewrite
- Controlla log errori PHP in cPanel → Error Log

---

## 📞 SUPPORTO

Se hai problemi:
1. Controlla i log errori in cPanel
2. Verifica tutte le configurazioni sopra
3. Testa gli endpoint API con curl o Postman

---

## ✅ CHECKLIST DEPLOY

- [ ] File caricati via FTP
- [ ] Database importato
- [ ] `config/database.php` configurato
- [ ] `config/jwt.php` configurato
- [ ] Permessi upload impostati (755)
- [ ] Test API `/api/health` OK
- [ ] Test frontend OK
- [ ] Test admin login OK
- [ ] Password admin cambiata

**🎉 Se tutti i test passano, il deploy è completato!**
EOF

# ============================================
# CREA FILE DI RIEPILOGO
# ============================================
cat > "$DEPLOY_DIR/RIEPILOGO_FILE.txt" << EOF
═══════════════════════════════════════════════════════════════════
   DALILA PROPERTY MANAGEMENT - DEPLOY PACKAGE
   Generato il: $(date)
═══════════════════════════════════════════════════════════════════

📦 CONTENUTO PACCHETTO:

✅ (root files)         Frontend pubblico (React build)
✅ admin/               Admin panel (React build)  
✅ api/                 Backend PHP API
✅ dalila_db_full.sql   Database completo con dati esempio

───────────────────────────────────────────────────────────────────

📋 PROSSIMI STEP:

1. Carica tutto su GoDaddy via FTP:
   - File nella root di deploy/ (index.html, assets, .htaccess)  →  public_html/
   - admin/*        →  public_html/admin/
   - api/*          →  public_html/api/

2. Importa database via phpMyAdmin:
   - Usa file: dalila_db_full.sql

3. Configura api/config/database.php con credenziali GoDaddy

4. Genera JWT secret e aggiornalo in api/config/jwt.php

5. Imposta permessi 755 su api/uploads/ e sottocartelle

6. Test finale:
   - https://tuodominio.com/api/health
   - https://tuodominio.com/
   - https://tuodominio.com/admin/

───────────────────────────────────────────────────────────────────

📖 LEGGI README_DEPLOY.md PER ISTRUZIONI DETTAGLIATE

═══════════════════════════════════════════════════════════════════
EOF

# ============================================
# RIEPILOGO FINALE
# ============================================
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ DEPLOY PREPARATION COMPLETATO!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}📁 File preparati in:${NC} ./$DEPLOY_DIR/"
echo ""
echo -e "${YELLOW}📋 PROSSIMI STEP:${NC}"
echo -e "   1. Leggi: ${GREEN}$DEPLOY_DIR/README_DEPLOY.md${NC}"
echo -e "   2. Carica file su GoDaddy via FTP"
echo -e "   3. Importa database dalila_db_full.sql"
echo -e "   4. Configura api/config/database.php"
echo -e "   5. Test finale degli endpoint"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   🚀 Pronto per il deploy!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
