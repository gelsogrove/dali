#!/bin/bash

# Build Production Script - Prepara tutto per upload su GoDaddy
# Struttura: /new come sul server con admin/, api/, e FE files

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         🚀 BUILD PRODUCTION - Dalila Platform           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NEW_DIR="$PROJECT_ROOT/new"

# 1. Pulizia cartella /new
echo -e "${YELLOW}📁 Step 1: Pulizia cartella /new...${NC}"
if [ -d "$NEW_DIR" ]; then
    rm -rf "$NEW_DIR"
    echo -e "${GREEN}✓ Cartella /new pulita${NC}"
fi

# Crea struttura
mkdir -p "$NEW_DIR"

# 1.5 Copia file .env per build
echo -e "${YELLOW}📋 Copia configurazione .env.production...${NC}"
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    cp "$PROJECT_ROOT/.env.production" "$PROJECT_ROOT/fe/.env.production"
    cp "$PROJECT_ROOT/.env.production" "$PROJECT_ROOT/admin/.env.production"
    
    # Crea .env per API (estrae solo variabili DB e JWT)
    grep -E '^(DB_|JWT_)' "$PROJECT_ROOT/.env.production" > "$PROJECT_ROOT/api/.env"
    
    echo -e "${GREEN}✓ File .env.production copiati da root${NC}"
    echo -e "${GREEN}✓ File api/.env creato con variabili DB e JWT${NC}"
else
    echo -e "${RED}⚠ Warning: .env.production non trovato in root${NC}"
fi
mkdir -p "$NEW_DIR/admin"
mkdir -p "$NEW_DIR/api"
mkdir -p "$NEW_DIR/assets"
mkdir -p "$NEW_DIR/fonts"
mkdir -p "$NEW_DIR/images"
echo -e "${GREEN}✓ Struttura cartelle creata${NC}"
echo ""

# 2. Build Frontend
echo -e "${YELLOW}🔨 Step 2: Build Frontend...${NC}"
cd "$PROJECT_ROOT/fe"
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installazione dipendenze frontend...${NC}"
    npm install
fi
npm run build
echo -e "${GREEN}✓ Frontend compilato${NC}"
echo ""

# 3. Build Admin
echo -e "${YELLOW}🔨 Step 3: Build Admin Panel...${NC}"
cd "$PROJECT_ROOT/admin"
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installazione dipendenze admin...${NC}"
    npm install --legacy-peer-deps
fi
npm run build
echo -e "${GREEN}✓ Admin Panel compilato${NC}"
echo ""

# 4. Copia Frontend files nella root di /new
echo -e "${YELLOW}📋 Step 4: Copia Frontend files...${NC}"
cd "$PROJECT_ROOT/fe/dist"

# Copia index.html e site.webmanifest nella root
cp index.html "$NEW_DIR/"
if [ -f "site.webmanifest" ]; then
    cp site.webmanifest "$NEW_DIR/"
fi

# Copia assets
if [ -d "assets" ]; then
    cp -r assets/* "$NEW_DIR/assets/"
    echo -e "${GREEN}✓ Assets copiati${NC}"
fi

# Copia fonts
if [ -d "fonts" ]; then
    cp -r fonts/* "$NEW_DIR/fonts/"
    echo -e "${GREEN}✓ Fonts copiati${NC}"
fi

# Copia images
if [ -d "images" ]; then
    cp -r images/* "$NEW_DIR/images/"
    echo -e "${GREEN}✓ Images copiati${NC}"
fi

# Crea .htaccess per React Router nel root (frontend)
cat > "$NEW_DIR/.htaccess" << 'EOF'
RewriteEngine On

# STOP COMPLETO per admin e api - senza /new/ prefix!
RewriteCond %{REQUEST_URI} ^/admin [NC]
RewriteRule ^ - [L]

RewriteCond %{REQUEST_URI} ^/api [NC]
RewriteRule ^ - [L]

# Per tutto il resto: se file/directory esiste, servilo
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule . - [L]

# Altrimenti redirect a index.html (React Router)
RewriteRule . index.html [L]

# Abilita Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache statico
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/woff2 "access plus 1 year"
</IfModule>
EOF

echo -e "${GREEN}✓ Frontend files copiati in /new/${NC}"
echo ""

# 5. Copia Admin Panel
echo -e "${YELLOW}📋 Step 5: Copia Admin Panel...${NC}"
cp -r "$PROJECT_ROOT/admin/dist/"* "$NEW_DIR/admin/"

# Crea .htaccess per Admin React Router
cat > "$NEW_DIR/admin/.htaccess" << 'EOF'
RewriteEngine On

# Se è un file JS/CSS/asset, servilo direttamente
RewriteCond %{REQUEST_URI} \.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|json|map)$ [NC]
RewriteRule ^ - [L]

# Se è un file o directory esistente, servilo
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule . - [L]

# Tutto il resto va a index.html (React Router)
RewriteRule . index.html [L]
EOF

echo -e "${GREEN}✓ Admin Panel copiato in /new/admin/${NC}"
echo ""

# 6. Copia API Backend
echo -e "${YELLOW}📋 Step 6: Copia API Backend...${NC}"
cd "$PROJECT_ROOT/api"

# Copia file PHP essenziali
cp index.php "$NEW_DIR/api/"

# Copia directories (escludendo database.php locale)
for dir in controllers middleware; do
    if [ -d "$dir" ]; then
        cp -r "$dir" "$NEW_DIR/api/"
    fi
done

# Copia config MA esclude database.php (solo locale Docker)
if [ -d "config" ]; then
    mkdir -p "$NEW_DIR/api/config"
    cp config/csrf.php "$NEW_DIR/api/config/"
    cp config/jwt.php "$NEW_DIR/api/config/"
    cp config/database.php "$NEW_DIR/api/config/"
    # database.php usa getenv(), funzionerà con .env.production
fi

# Leggi credenziali dal .env locale e crea .env per produzione
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${BLUE}📝 Lettura credenziali da .env locale...${NC}"
    
    # Estrai valori dal .env locale
    DB_HOST=$(grep "MYSQL_HOST" "$PROJECT_ROOT/.env" | cut -d '=' -f2 | tr -d '"' | xargs || echo "localhost")
    DB_NAME=$(grep "MYSQL_DATABASE" "$PROJECT_ROOT/.env" | cut -d '=' -f2 | tr -d '"' | xargs)
    DB_USER=$(grep "MYSQL_USER" "$PROJECT_ROOT/.env" | cut -d '=' -f2 | tr -d '"' | xargs)
    DB_PASSWORD=$(grep "MYSQL_PASSWORD" "$PROJECT_ROOT/.env" | cut -d '=' -f2 | tr -d '"' | xargs)
    JWT_SECRET=$(grep "JWT_SECRET" "$PROJECT_ROOT/.env" | cut -d '=' -f2 | tr -d '"' | xargs)
    
    # Default a localhost se non specificato
    [ -z "$DB_HOST" ] && DB_HOST="localhost"
    
    # Crea .env per produzione con le credenziali lette
    cat > "$NEW_DIR/api/.env" << EOF
# 🚀 Production Environment Variables
# Generato automaticamente da .env locale

DB_HOST=${DB_HOST}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# JWT Secret
JWT_SECRET=${JWT_SECRET}
EOF

    echo -e "${GREEN}✓ File .env creato con credenziali da .env locale${NC}"
else
    echo -e "${YELLOW}⚠️  File .env locale non trovato, creo template...${NC}"
    
    # Crea template se .env non esiste
    cat > "$NEW_DIR/api/.env" << 'EOF'
# 🔧 CONFIGURA QUESTE VARIABILI CON LE CREDENZIALI GODADDY

DB_HOST=localhost
DB_NAME=dalila_db
DB_USER=your_godaddy_user
DB_PASSWORD=your_godaddy_password

# JWT Secret - Genera con: openssl rand -base64 32
JWT_SECRET=your_generated_jwt_secret_here
EOF

    echo -e "${YELLOW}✓ File .env template creato (da configurare manualmente)${NC}"
fi

# Crea struttura uploads
mkdir -p "$NEW_DIR/api/uploads/properties"
mkdir -p "$NEW_DIR/api/uploads/blogs"
mkdir -p "$NEW_DIR/api/uploads/videos"
mkdir -p "$NEW_DIR/api/uploads/photogallery"

# Crea .htaccess per API
cat > "$NEW_DIR/api/.htaccess" << 'EOF'
RewriteEngine On

# Redirect tutto a index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Blocca accesso a file sensibili
<FilesMatch "\.(env|log|ini)$">
  Order allow,deny
  Deny from all
</FilesMatch>
EOF

echo -e "${GREEN}✓ API Backend copiato in /new/api/${NC}"
echo ""

# 7. Crea file per caricare .env in PHP
echo -e "${YELLOW}⚙️  Step 7: Configurazione environment...${NC}"

cat > "$NEW_DIR/api/load-env.php" << 'EOF'
<?php
/**
 * Load environment variables from .env file
 * Simple implementation for shared hosting (no composer required)
 */

function loadEnv($filePath) {
    if (!file_exists($filePath)) {
        return false;
    }
    
    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Remove quotes if present
            $value = trim($value, '"\'');
            
            // Set environment variable
            putenv("$key=$value");
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
    
    return true;
}

// Try to load .env file
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    loadEnv($envFile);
}
?>
EOF

echo -e "${GREEN}✓ load-env.php creato${NC}"
echo ""

# 8. Export Database
echo -e "${YELLOW}💾 Step 8: Export Database...${NC}"
docker exec dalila-mysql mysqldump -u dalila_user -p'6Vpo!C7ysLoL' dalila_db > "$NEW_DIR/dalila_db_export.sql" 2>/dev/null || {
    echo -e "${RED}⚠️  Errore export database - Docker non attivo?${NC}"
    echo -e "${YELLOW}→ Puoi esportare manualmente dopo${NC}"
}

if [ -f "$NEW_DIR/dalila_db_export.sql" ]; then
    DB_SIZE=$(ls -lh "$NEW_DIR/dalila_db_export.sql" | awk '{print $5}')
    echo -e "${GREEN}✓ Database esportato ($DB_SIZE) - contiene schema + dati${NC}"
fi
echo ""

# 9. Crea .gitignore e README
echo -e "${YELLOW}📝 Step 9: Creazione .gitignore e documentazione...${NC}"

# Crea .gitignore
cat > "$NEW_DIR/.gitignore" << 'EOF'
# File temporanei
.DS_Store
Thumbs.db
*.log

# Backup files
*.bak
*.backup
*~

# Config locale (non committare credenziali!)
api/.env
EOF

echo -e "${GREEN}✓ .gitignore creato${NC}"

# Crea README principale
cat > "$NEW_DIR/README.md" << 'EOF'
# 🚀 Deploy Dalila Platform su GoDaddy

## 📦 Contenuto Cartella

Questa cartella `/new` contiene **TUTTO** pronto per l'upload su GoDaddy:

```
/new/
├── admin/                    # Admin Panel (React compilato)
├── api/                      # Backend PHP
│   ├── .env                  # Credenziali (da .env locale)
│   ├── load-env.php          # Carica variabili environment
│   ├── config/              
│   │   ├── database.php      # Legge da .env
│   │   ├── jwt.php
│   │   └── csrf.php
│   ├── controllers/          # API Controllers
│   ├── middleware/           # Auth middleware
│   ├── uploads/              # Directory upload (vuota)
│   ├── index.php             # Router principale
│   └── .htaccess             # Config Apache
├── assets/                   # Frontend JS/CSS
├── fonts/                    # Web fonts
├── images/                   # Immagini statiche
├── index.html                # Frontend entry point
├── site.webmanifest          # PWA manifest
├── .htaccess                 # React Router config
└── dalila_db_export.sql      # Database export (schema + dati)
```

---

## 🎯 PASSO 1: Upload Files su GoDaddy

### 1.1 Accedi a cPanel
1. Vai su: `https://godaddy.com`
2. Login → **My Products**
3. Clicca **cPanel** accanto al tuo hosting

### 1.2 Upload via File Manager
1. In cPanel, apri **File Manager**
2. Naviga in: `public_html/`
3. Crea una nuova cartella chiamata **`new`**
4. Entra nella cartella `new/`
5. Clicca **Upload** (in alto)
6. Seleziona **TUTTI** i file e cartelle da questa directory locale `/new`
7. Aspetta che finisca l'upload (può richiedere qualche minuto)

> **Alternativa FTP**: Puoi usare FileZilla:
> - Host: `ftp.tuodominio.com`
> - Username: dal cPanel
> - Password: dal cPanel
> - Carica tutto in: `/public_html/new/`

---

## 🗄️ PASSO 2: Importa Database

### 2.1 Crea Database su GoDaddy
1. In cPanel, cerca **MySQL® Databases**
2. Nella sezione **"Create New Database"**:
   - Nome database: `dalila_db` (o quello che preferisci)
   - Clicca **Create Database**
3. Scorri in basso a **"MySQL Users"**:
   - Username: `dalila_user` (o altro)
   - Password: genera una password sicura
   - Clicca **Create User**
4. Nella sezione **"Add User To Database"**:
   - Seleziona l'utente appena creato
   - Seleziona il database appena creato
   - Clicca **Add**
   - Nelle privileges, seleziona **ALL PRIVILEGES**
   - Clicca **Make Changes**

### 2.2 Annota le Credenziali
Scrivi questi valori (ti serviranno dopo):
```
Host:     localhost
Database: dalila_db (o il nome che hai scelto)
Username: dalila_user (o quello che hai creato)
Password: ************ (quella generata)
```

### 2.3 Importa il Database
1. In cPanel, cerca **phpMyAdmin**
2. Clicca per aprirlo
3. Nella colonna sinistra, clicca sul tuo database (`dalila_db`)
4. In alto, clicca tab **Import**
5. Clicca **Choose File**
6. Seleziona: `dalila_db_export.sql` (dalla cartella `/new`)
7. Lascia le altre opzioni default
8. Clicca **Go** in fondo alla pagina
9. Aspetta che finisca (dovrebbe dire "Import has been successfully finished")

> ✅ Dovresti vedere 8 tabelle create: admin_users, properties, blogs, videos, photogallery, property_amenities, sessions, activity_log

---

## ⚙️ PASSO 3: Verifica Credenziali (Opzionale)

Il file `.env` in `public_html/new/api/.env` è stato **già creato automaticamente** con le credenziali dal tuo `.env` locale:

```env
DB_HOST=localhost
DB_NAME=dalila_db
DB_USER=dalila_user
DB_PASSWORD=6Vpo!C7ysLoL
JWT_SECRET=local-dev-jwt-secret-32-chars-minimum-test-only-2026
```

### Se usi database/credenziali DIVERSE su GoDaddy:

Via **File Manager** di cPanel:

1. Naviga in: `public_html/new/api/`
2. Apri il file: **`.env`** (click destro → Edit)
3. **MODIFICA** con i valori del PASSO 2.2:
   ```env
   DB_HOST=localhost              # Di solito sempre localhost
   DB_NAME=nome_db_godaddy        # Se diverso da dalila_db
   DB_USER=user_godaddy           # Se diverso da dalila_user
   DB_PASSWORD=password_godaddy   # Se diversa
   JWT_SECRET=genera_nuovo_se_vuoi
   ```
4. Clicca **Save Changes**
5. Clicca **Close**

> ✅ Se usi le **stesse credenziali** del locale, non serve modificare nulla!

---

## 🔐 PASSO 4: Imposta Permessi Directory

Via **File Manager** di cPanel:

1. Naviga in: `public_html/new/api/`
2. Click destro sulla cartella **`uploads`** → **Change Permissions**
3. Imposta: **755**
   - Owner: Read + Write + Execute ✓
   - Group: Read + Execute ✓
   - World: Read + Execute ✓
4. ✓ Seleziona: **"Recurse into subdirectories"**
5. Clicca **Change Permissions**

Questo permette al server PHP di salvare immagini caricate.

---

## ✅ PASSO 5: Test

### Test 1: Frontend
Vai su: **https://buywithdali.com/new/**

✅ Dovrebbe caricare la homepage del sito

### Test 2: Admin Panel
Vai su: **https://buywithdali.com/new/admin/**

✅ Dovrebbe caricare la pagina di login

### Test 3: API Health Check
Vai su: **https://buywithdali.com/new/api/health**

✅ Dovrebbe mostrare:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-19 10:30:00"
}
```

### Test 4: API Blogs
Vai su: **https://buywithdali.com/new/api/blogs**

✅ Dovrebbe mostrare un array JSON con i blog

### Test 5: Login Admin
1. Vai su: **https://buywithdali.com/new/admin/**
2. Login con:
   - Email: `dalila@buywithdali.com`
   - Password: `Dalila2024!`

✅ Dovrebbe entrare nella dashboard

---

## 🐛 Troubleshooting

### Errore: "Database Connection Failed"
- ✓ Verifica di aver rinominato `.env.production` → `.env`
- ✓ Controlla le credenziali in `.env` (host, username, password)
- ✓ Verifica che il database sia stato importato correttamente

### Errore: "404 Not Found" su /admin
- ✓ Controlla che `.htaccess` sia presente in `/new/admin/`
- ✓ In cPanel, verifica che **mod_rewrite** sia abilitato
Controlla le credenziali in `api/.env` (host, username, password)
- ✓ Se usi credenziali GoDaddy diverse, aggiorna il file `.env`
- ✓ Controlla permessi directory `api/uploads/` → deve essere 755
- ✓ Applica ricorsivamente a tutte le sottocartelle

### Admin login non funziona
- ✓ Verifica di aver configurato JWT_SECRET in `api/.env`
- ✓ Controlla che il database abbia la tabella `admin_users`

### Frontend mostra pagina bianca
- ✓ Apri Console del browser (F12) → cerca errori
- ✓ Verifica che tutti i file siano stati caricati correttamente

---

## 📞 Checklist Finale

Prima di considerare il deploy completo:

- [ ] Tutti i file caricati su GoDaddy in `public_html/new/`
- [ ] Database creato su GoDaddy MySQL
- [ ] Database importato via phpMyAdmin (8 tabelle presenti)
- [ ] `.env.production` rinominato in `.env`
- [ ] Credenziali database configurate in `.env`
- [ ] JWT_SECRET generato e configurato in `.env`
- [ ] Permessi 755 impostati su `api/uploads/` (ricorsivo)
- [ ] ✅ Test frontend funzionante
- [ ] ✅ Test admin login funzionante
- [ ] ✅ Test API health funzionante
- [ ] File `api/.env` verificato (già creato automaticamente)
- [ ] Se necessario, credenziali aggiornate in `api/

## 🔄 Aggiornamenti Futuri

Per aggiornare il sito in futuro:

1. Locale, modifica il codice
2. Esegui: `npm run build`
3. Via FTP/File Manager, sostituisci solo i file modificati
4. **Non** sovrascrivere `api/.env` (contiene le tue credenziali!)

---

## 🆘 Supporto

Se qualcosa non funziona:
1. Controlla i log PHP in cPanel → **Error Log**
2. Apri Console browser (F12) → cerca errori JavaScript
3. Verifica step per step questa guida

**Domande frequenti già coperte:**
- ✅ Come rinominare .env.production in .env
- ✅ File .env automaticamente creato con credenziali locali
- ✅ Come modificare credenziali se GoDaddy usa valori diversi
- ✅ Come impostare i permessi upload
- ✅ Come testare l'installazione
Buon deploy! 🚀
EOF

echo -e "${GREEN}✓ README.md creato${NC}"
echo ""

# 10. Statistiche finali
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  ✅ BUILD COMPLETATO                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📦 Contenuto cartella /new:${NC}"
echo ""

# Conta file
ADMIN_FILES=$(find "$NEW_DIR/admin" -type f | wc -l | tr -d ' ')
API_FILES=$(find "$NEW_DIR/api" -type f | wc -l | tr -d ' ')
ASSETS_FILES=$(find "$NEW_DIR/assets" -type f 2>/dev/null | wc -l | tr -d ' ')
IMAGES_FILES=$(find "$NEW_DIR/images" -type f 2>/dev/null | wc -l | tr -d ' ')
FONTS_FILES=$(find "$NEW_DIR/fonts" -type f 2>/dev/null | wc -l | tr -d ' ')

echo -e "   ${YELLOW}admin/${NC}     → $ADMIN_FILES files (Admin Panel SPA)"
echo -e "   ${YELLOW}api/${NC}       → $API_FILES files (PHP Backend)"
echo -e "   ${YELLOW}assets/${NC}    → $ASSETS_FILES files (Frontend JS/CSS)"
echo -e "   ${YELLOW}images/${NC}    → $IMAGES_FILES files (Static images)"
echo -e "   ${YELLOW}fonts/${NC}     → $FONTS_FILES files (Web fonts)"
echo -e "   ${YELLOW}root${NC}       → index.html, .htaccess, site.webmanifest, .gitignore"

if [ -f "$NEW_DIR/dalila_db_export.sql" ]; then
    DB_SIZE=$(ls -lh "$NEW_DIR/dalila_db_export.sql" | awk '{print $5}')
    echo -e "   ${YELLOW}database${NC}  → dalila_db_export.sql ($DB_SIZE) [schema + dati]"
fi

echo ""
echo -e "${GREEN}📋 Prossimi passi:${NC}"
echo -e "   1. Leggi guida completa: ${BLUE}$NEW_DIR/README.md${NC}"
echo -e "   2. Carica tutto su GoDaddy: ${BLUE}public_html/new/${NC}"
echo -e "   3. Importa database via phpMyAdmin"
echo -e "   4. ${GREEN}File .env già pronto con credenziali locali!${NC}"
echo -e "   5. Imposta permessi 755 su ${BLUE}api/uploads/${NC}"
echo -e "   6. Test: ${BLUE}https://buywithdali.com/new/${NC}"
echo ""

# Link utili
echo -e "${BLUE}🔗 Link applicazioni:${NC}"
echo -e "   ${GREEN}FE:${NC}     ${BLUE}http://localhost:5174/${NC}"
echo -e "   ${GREEN}ADMIN:${NC}  ${BLUE}http://localhost:5175/${NC}"
echo -e "   ${GREEN}API:${NC}    ${BLUE}http://localhost:8080/api/${NC}"
echo ""

# Nota per permessi uploads (solo promemoria)
echo -e "${YELLOW}💡 Per configurare uploads locali (se necessario):${NC}"
echo -e "   ${DIM}sudo mkdir -p /var/www/html/uploads/{properties,videos,galleries,temp,blogs}${NC}"
echo -e "   ${DIM}sudo chown -R _www:_www /var/www/html/uploads${NC}"
echo -e "   ${DIM}sudo chmod -R 755 /var/www/html/uploads${NC}"
echo ""