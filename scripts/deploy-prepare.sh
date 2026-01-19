#!/bin/bash

# Script di Preparazione Deploy per FTP
# Crea una cartella con tutti i file pronti per l'upload

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         DALILA - PREPARAZIONE DEPLOY FTP                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colori
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verifica di essere nella root del progetto
if [ ! -f "package.json" ] || [ ! -d "BE" ] || [ ! -d "FE" ] || [ ! -d "admin" ]; then
    echo -e "${RED}✗ Errore: Esegui questo script dalla root del progetto Dalila${NC}"
    exit 1
fi

# Crea folder deploy con timestamp
DEPLOY_DIR=~/Desktop/dalila-deploy-$(date +%Y%m%d-%H%M%S)
echo -e "${BLUE}📂 Cartella deploy: $DEPLOY_DIR${NC}"
mkdir -p "$DEPLOY_DIR"/{FE,admin,BE}

# 1. BUILD
echo ""
echo -e "${BLUE}📦 Step 1/5: Building Frontend e Admin...${NC}"
npm run build

if [ ! -d "fe/dist" ] || [ ! -d "admin/dist" ]; then
    echo -e "${RED}✗ Errore: Build fallito. Controlla gli errori sopra.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build completato${NC}"

# 2. COPIA FILE
echo ""
echo -e "${BLUE}📋 Step 2/5: Copiando file...${NC}"

# Frontend
echo "  → fe/dist/ → deploy/fe/"
cp -r fe/dist/* "$DEPLOY_DIR/fe/"

# Admin
echo "  → admin/dist/ → deploy/admin/"
cp -r admin/dist/* "$DEPLOY_DIR/admin/"

# Backend (escludi node_modules e file temporanei)
echo "  → BE/ → deploy/BE/"
rsync -av --exclude='node_modules' --exclude='.git*' --exclude='*.log' BE/ "$DEPLOY_DIR/BE/"

# .env template
echo "  → .env.example → deploy/.env"
cp .env.example "$DEPLOY_DIR/.env"

echo -e "${GREEN}✓ File copiati${NC}"

# 3. CLEANUP
echo ""
echo -e "${BLUE}🧹 Step 3/5: Cleanup file non necessari...${NC}"

# Rimuovi file di sviluppo
find "$DEPLOY_DIR" -name "*.md" -not -name "README.md" -delete 2>/dev/null || true
find "$DEPLOY_DIR" -name ".DS_Store" -delete 2>/dev/null || true
find "$DEPLOY_DIR" -name "Thumbs.db" -delete 2>/dev/null || true

echo -e "${GREEN}✓ Cleanup completato${NC}"

# 4. CREA .htaccess
echo ""
echo -e "${BLUE}⚙️  Step 4/5: Creando file .htaccess...${NC}"

# .htaccess per FE (SPA routing)
cat > "$DEPLOY_DIR/fe/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /new-site/fe/
  
  # Redirect tutte le richieste a index.html (React Router)
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /new-site/fe/index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>
EOF

# .htaccess per admin (SPA routing + protezione opzionale)
cat > "$DEPLOY_DIR/admin/.htaccess" << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /new-site/admin/
  
  # Redirect tutte le richieste a index.html (React Router)
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /new-site/admin/index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# OPZIONALE: Decommenta per password-protect l'admin
# AuthType Basic
# AuthName "Admin Area - Restricted Access"
# AuthUserFile /home/USERNAME/.htpasswd
# Require valid-user
EOF

# Verifica che BE abbia già .htaccess
if [ ! -f "$DEPLOY_DIR/BE/.htaccess" ]; then
    echo -e "${YELLOW}⚠️  Warning: BE/.htaccess mancante, creandolo...${NC}"
    cat > "$DEPLOY_DIR/BE/.htaccess" << 'EOF'
RewriteEngine On

# Redirect tutte le richieste ad api/index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ api/index.php [QSA,L]

# Proteggi file .env
<Files ".env">
    Require all denied
</Files>

# Proteggi file di configurazione
<FilesMatch "\.(sql|log|md)$">
    Require all denied
</FilesMatch>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
EOF
fi

echo -e "${GREEN}✓ File .htaccess creati${NC}"

# 5. CREA README DI ISTRUZIONI
echo ""
echo -e "${BLUE}📝 Step 5/5: Creando file DEPLOY-INSTRUCTIONS.txt...${NC}"

cat > "$DEPLOY_DIR/DEPLOY-INSTRUCTIONS.txt" << 'EOF'
╔════════════════════════════════════════════════════════════╗
║     ISTRUZIONI DEPLOY DALILA - UPLOAD FTP                 ║
╚════════════════════════════════════════════════════════════╝

📂 STRUTTURA SERVER
==================
Carica le cartelle in questa struttura sul server:

new-site/
├── fe/          → Frontend pubblico React
├── admin/       → Pannello amministrazione React  
├── BE/          → API PHP e uploads
└── .env         → Configurazione (DA CONFIGURARE!)


📤 UPLOAD FTP
=============
1. Connetti al server FTP:
   - Host: ftp.yourdomain.com
   - User: il tuo username cPanel
   - Password: la tua password cPanel

2. Naviga a: public_html/

3. Crea cartella: new-site/

4. Upload questi file/cartelle:
   - fe/      → new-site/fe/
   - admin/   → new-site/admin/
   - BE/      → new-site/BE/
   - .env     → new-site/.env


⚙️  CONFIGURAZIONE SERVER
=========================
1. CREA DATABASE (cPanel → MySQL Databases):
   - Nome: dalila_db
   - User: dalila_user
   - Password: (genera password sicura)
   - Privileges: ALL

2. IMPORTA SCHEMA (phpMyAdmin):
   - Seleziona database: dalila_db
   - Import → Scegli file: BE/database/init.sql
   - Click "Go"

3. CONFIGURA .ENV (cPanel File Manager):
   Apri: new-site/.env
   
   Inserisci:
   MYSQL_DATABASE=dalila_db
   MYSQL_USER=dalila_user  
   MYSQL_PASSWORD=LA_PASSWORD_CHE_HAI_CREATO
   JWT_SECRET=GENERA_CON_OPENSSL_RAND_BASE64_32
   ENVIRONMENT=production
   
   Salva e imposta permissions: chmod 600 .env

4. IMPOSTA PERMISSIONS:
   chmod 755 BE/uploads/
   chmod 644 BE/uploads/.gitkeep
   chmod 600 .env


🌐 URL FINALI
=============
Dopo il deploy:

- Sito pubblico: https://yourdomain.com/new-site/fe/
- Admin panel:   https://yourdomain.com/new-site/admin/
- API:           https://yourdomain.com/new-site/BE/api/


✅ TEST
=======
1. Test API:
   curl https://yourdomain.com/new-site/BE/api/health
   
   Risposta attesa: {"success":true,"message":"API is running"}

2. Test Admin:
   - Apri: https://yourdomain.com/new-site/admin/
   - Login: admin@dalila.com / Admin@123
   - Cambia password dopo primo login!

3. Test Upload:
   - Crea una proprietà
   - Carica un'immagine
   - Verifica che appaia in BE/uploads/properties/


🚨 TROUBLESHOOTING
==================
- 500 Error: Controlla permissions (uploads 755, .env 600)
- DB Error: Verifica credenziali in .env
- 404 su routes: Verifica .htaccess in fe/ e admin/
- Immagini non caricano: Verifica BE/uploads/ permissions


📖 DOCUMENTAZIONE COMPLETA
===========================
Vedi: https://github.com/gelsogrove/dali

- FTP-DEPLOY.md     → Guida completa deploy
- GODADDY-SETUP.md  → Setup password e database
- SECURITY.md       → Best practices sicurezza

EOF

echo -e "${GREEN}✓ Istruzioni create${NC}"

# 6. RIEPILOGO
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 ✅ DEPLOY PREPARATO!                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}📂 File pronti in:${NC}"
echo -e "   ${BLUE}$DEPLOY_DIR${NC}"
echo ""
echo -e "${YELLOW}📋 Prossimi passi:${NC}"
echo "   1. Leggi: $DEPLOY_DIR/DEPLOY-INSTRUCTIONS.txt"
echo "   2. Apri FileZilla/Cyberduck"
echo "   3. Connetti al server FTP"
echo "   4. Upload cartelle in: public_html/new-site/"
echo "   5. Configura .env sul server"
echo "   6. Importa database (phpMyAdmin)"
echo "   7. Test: https://yourdomain.com/new-site/BE/api/health"
echo ""
echo -e "${GREEN}🚀 Buon deploy!${NC}"
echo ""

# Apri cartella (solo su macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$DEPLOY_DIR"
fi
