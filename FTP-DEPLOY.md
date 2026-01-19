# Deploy FTP - Guida Upload Manuale

## 📂 Struttura Server GoDaddy/cPanel

Dopo il build, carica i file in questa struttura sul server:

```
new-site/                    (root directory sul server)
├── FE/                      # Frontend pubblico (sito React)
│   ├── index.html
│   ├── assets/
│   │   ├── index-abc123.js
│   │   └── index-xyz789.css
│   └── ...
├── BE/                      # Backend API PHP
│   ├── api/
│   │   ├── index.php
│   │   ├── controllers/
│   │   └── middleware/
│   ├── config/
│   ├── database/
│   └── uploads/             # ⚠️ IMPORTANTE: File caricati dagli utenti
│       └── .gitkeep
├── admin/                   # Pannello amministrazione React
│   ├── index.html
│   ├── assets/
│   │   ├── index-def456.js
│   │   └── index-uvw890.css
│   └── ...
└── .env                     # ⚠️ Configurazione SERVER (password reali!)
```

## 🏗️ Processo Build e Deploy

### Fase 1: Build Locale

```bash
# Dalla root del progetto
cd /Users/gelso/workspace/Dalila

# Build di TUTTO (FE + Admin)
npm run build
```

Questo comando:
1. ✅ Esegue `vite build` nel FE → crea `FE/dist/`
2. ✅ Esegue `vite build` nell'admin → crea `admin/dist/`

**Output generato**:
```
FE/dist/                    # Build del sito pubblico
admin/dist/                 # Build del pannello admin
BE/                         # File PHP (già pronti, no build)
```

### Fase 2: Preparazione File

```bash
# Crea una cartella temporanea per il deploy
mkdir -p ~/Desktop/dalila-deploy

# Copia FE build
cp -r FE/dist/* ~/Desktop/dalila-deploy/FE/

# Copia Admin build  
cp -r admin/dist/* ~/Desktop/dalila-deploy/admin/

# Copia Backend PHP (senza node_modules)
cp -r BE/ ~/Desktop/dalila-deploy/BE/

# Copia .env.example come template
cp .env.example ~/Desktop/dalila-deploy/.env

# Rimuovi file non necessari sul server
rm -rf ~/Desktop/dalila-deploy/BE/node_modules
rm -rf ~/Desktop/dalila-deploy/BE/.git*
```

### Fase 3: Upload FTP

#### Via FileZilla/Cyberduck

1. **Connetti al server**:
   - Host: `ftp.yourdomain.com`
   - Username: il tuo username cPanel
   - Password: la tua password cPanel
   - Port: 21 (FTP) o 22 (SFTP)

2. **Naviga a public_html** (o la root del tuo sito)

3. **Crea cartella new-site**:
   ```
   public_html/
   └── new-site/   ← Crea questa cartella
   ```

4. **Upload file**:
   - `~/Desktop/dalila-deploy/FE/` → `new-site/FE/`
   - `~/Desktop/dalila-deploy/admin/` → `new-site/admin/`
   - `~/Desktop/dalila-deploy/BE/` → `new-site/BE/`
   - `~/Desktop/dalila-deploy/.env` → `new-site/.env`

#### Via cPanel File Manager

1. Login a cPanel
2. Apri **File Manager**
3. Naviga a `public_html/`
4. Click **Upload**
5. Carica le cartelle una alla volta

#### Via FTP Command Line (alternativa)

```bash
cd ~/Desktop/dalila-deploy

# Upload con lftp
lftp -u username,password ftp.yourdomain.com
lcd ~/Desktop/dalila-deploy
cd public_html/new-site
mirror -R FE admin BE .env
bye
```

## ⚙️ Configurazione Server

### 1. Configura .env sul Server

**IMPORTANTE**: Il file `.env` che hai caricato è un template vuoto. Devi configurarlo sul server!

Via cPanel File Manager:
1. Apri `new-site/.env`
2. Click **Edit**
3. Inserisci le password REALI:

```env
# Database Configuration (da cPanel → MySQL Databases)
MYSQL_ROOT_PASSWORD=       # Non serve in produzione
MYSQL_DATABASE=dalila_db
MYSQL_USER=cpanel_username_dalila
MYSQL_PASSWORD=PASSWORD_SICURA_QUI

# JWT Configuration (genera con: openssl rand -base64 32)
JWT_SECRET=AbCdEf1234567890aBcDeF1234567890abcdef12345678

# Application
ENVIRONMENT=production
```

4. **Salva** e **imposta permissions**:
   ```bash
   chmod 600 .env   # Solo owner può leggere
   ```

### 2. Crea Database MySQL

In cPanel:
1. **MySQL Databases** → Create New Database
   - Nome: `dalila_db`
2. **MySQL Users** → Create New User
   - Username: `dalila_user`
   - Password: (genera password sicura)
3. **Add User to Database**
   - User: `dalila_user`
   - Database: `dalila_db`
   - Privileges: **ALL PRIVILEGES**

### 3. Importa Schema Database

Via phpMyAdmin:
1. Seleziona database `dalila_db`
2. Tab **Import**
3. Scegli file: `BE/database/init.sql`
4. Click **Go**

### 4. Configura .htaccess

#### BE/.htaccess (già presente, verifica)

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ api/index.php [QSA,L]

# Proteggi .env
<Files ".env">
    Require all denied
</Files>
```

#### FE/.htaccess (crea nuovo)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /new-site/FE/
  
  # Redirect tutte le richieste a index.html (SPA routing)
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /new-site/FE/index.html [L]
</IfModule>
```

#### admin/.htaccess (crea nuovo)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /new-site/admin/
  
  # Redirect tutte le richieste a index.html (SPA routing)
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /new-site/admin/index.html [L]
</IfModule>

# Password proteggi admin (opzionale)
AuthType Basic
AuthName "Admin Area"
AuthUserFile /home/username/.htpasswd
Require valid-user
```

### 5. Configura Permissions

```bash
# Via SSH o cPanel Terminal

cd ~/public_html/new-site

# Cartella uploads DEVE essere scrivibile
chmod 755 BE/uploads/
chmod 644 BE/uploads/.gitkeep

# File .env DEVE essere protetto
chmod 600 .env

# PHP files
find BE/ -type f -name "*.php" -exec chmod 644 {} \;
find BE/ -type d -exec chmod 755 {} \;
```

## 🌐 URL Finali

Dopo il deploy, i tuoi siti saranno accessibili a:

- **Sito Pubblico**: `https://yourdomain.com/new-site/FE/`
- **Admin Panel**: `https://yourdomain.com/new-site/admin/`
- **API**: `https://yourdomain.com/new-site/BE/api/`

### Test Endpoints

```bash
# Test health check API
curl https://yourdomain.com/new-site/BE/api/health

# Output atteso:
# {"success":true,"message":"API is running","timestamp":"..."}

# Test proprietà
curl https://yourdomain.com/new-site/BE/api/properties

# Test login admin
curl -X POST https://yourdomain.com/new-site/BE/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dalila.com","password":"Admin@123"}'
```

## 📸 Gestione Uploads

### Dove Vanno i File?

**TUTTI i file caricati vanno in `BE/uploads/`**:

```
BE/uploads/
├── properties/           # Immagini proprietà
│   ├── original/
│   ├── large/
│   ├── medium/
│   └── thumbnail/
└── videos/              # Video proprietà
```

### Perché nel BE?

1. ✅ L'API PHP (`UploadController.php`) salva file in `BE/uploads/`
2. ✅ L'API serve i file tramite endpoint: `/api/uploads/properties/...`
3. ✅ FE e Admin **referenziano** i file, non li contengono
4. ✅ Unica sorgente di verità (single source of truth)

### Come FE e Admin Accedono alle Immagini?

#### Nel Codice FE

```jsx
// FE/src/pages/ListingDetailPage.jsx
<img src={`https://yourdomain.com/new-site/BE/uploads/properties/large/${image.filename}`} />
```

#### Nel Codice Admin

```tsx
// admin/src/pages/PropertiesPage.tsx
<img src={`${import.meta.env.VITE_API_URL}/../uploads/properties/thumbnail/${image.filename}`} />
```

#### Configurazione URL API

Aggiorna i file di configurazione:

**FE**: Crea `FE/.env.production`
```env
VITE_API_URL=https://yourdomain.com/new-site/BE/api
```

**Admin**: Crea `admin/.env.production`
```env
VITE_API_URL=https://yourdomain.com/new-site/BE/api
```

### NON Mettere Uploads in Git!

Il `.gitignore` già protegge:
```gitignore
# Uploads (keep directory, ignore contents)
uploads/*
!uploads/.gitkeep

# Images
*.jpg
*.jpeg
*.png
*.gif
*.webp
```

### Backup Uploads

```bash
# Sul server, crea backup periodico
cd ~/public_html/new-site/BE
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Scarica in locale per sicurezza
scp user@server.com:~/backups/uploads-backup-*.tar.gz ~/Desktop/
```

## 🔄 Workflow Aggiornamenti

### Update Solo Frontend

```bash
# Build solo FE
npm run build:fe

# Upload solo FE/dist/ → new-site/FE/
```

### Update Solo Admin

```bash
# Build solo admin
npm run build:admin

# Upload solo admin/dist/ → new-site/admin/
```

### Update Backend PHP

```bash
# Nessun build necessario (PHP non compila)
# Upload direttamente BE/ → new-site/BE/

# ⚠️ NON sovrascrivere:
# - BE/uploads/ (file utenti)
# - BE/.env (configurazione server)
```

### Update Struttura Database

```bash
# Crea script di migrazione in BE/database/migrations/
# Esempio: BE/database/migrations/001_add_column.sql

ALTER TABLE properties ADD COLUMN new_field VARCHAR(255);
```

Upload e esegui via phpMyAdmin.

## 🚨 Troubleshooting Deploy

### Errore: "500 Internal Server Error"

```bash
# Controlla permissions
chmod 755 BE/uploads/
chmod 644 BE/api/index.php

# Verifica .htaccess
cat BE/.htaccess

# Check PHP logs
tail -f ~/logs/error_log
```

### Errore: "Database connection failed"

```bash
# Verifica .env
cat .env | grep MYSQL

# Test connessione
php -r "new PDO('mysql:host=localhost;dbname=dalila_db', 'user', 'pass');"
```

### SPA Routes non funzionano (404)

```bash
# Verifica .htaccess in FE/ e admin/
# Deve avere: RewriteRule . /new-site/FE/index.html [L]
```

### Immagini non si caricano

```bash
# Verifica URL assoluti
curl -I https://yourdomain.com/new-site/BE/uploads/properties/test.jpg

# Verifica permissions
ls -la BE/uploads/

# Output: drwxr-xr-x (755)
```

## 📋 Checklist Pre-Deploy

- [ ] Build completato: `npm run build`
- [ ] File preparati in ~/Desktop/dalila-deploy/
- [ ] .env configurato con password reali sul server
- [ ] Database creato in cPanel
- [ ] init.sql importato
- [ ] .htaccess configurati (BE, FE, admin)
- [ ] Permissions corrette (uploads 755, .env 600)
- [ ] URL API aggiornati nei .env.production
- [ ] Test API health endpoint
- [ ] Test login admin panel
- [ ] Test upload immagine
- [ ] Test visualizzazione proprietà sul frontend

## 🎯 Script Automatico (Opzionale)

Crea `scripts/deploy-prepare.sh`:

```bash
#!/bin/bash

echo "🚀 Preparazione Deploy Dalila..."

# Build
echo "📦 Building..."
npm run build

# Crea folder deploy
DEPLOY_DIR=~/Desktop/dalila-deploy-$(date +%Y%m%d-%H%M%S)
mkdir -p "$DEPLOY_DIR"/{FE,admin,BE}

# Copia files
echo "📂 Copiando file..."
cp -r FE/dist/* "$DEPLOY_DIR/FE/"
cp -r admin/dist/* "$DEPLOY_DIR/admin/"
cp -r BE/* "$DEPLOY_DIR/BE/"
cp .env.example "$DEPLOY_DIR/.env"

# Cleanup
rm -rf "$DEPLOY_DIR/BE/node_modules"

# Crea .htaccess per FE e admin
cat > "$DEPLOY_DIR/FE/.htaccess" << 'EOF'
RewriteEngine On
RewriteBase /new-site/FE/
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /new-site/FE/index.html [L]
EOF

cat > "$DEPLOY_DIR/admin/.htaccess" << 'EOF'
RewriteEngine On
RewriteBase /new-site/admin/
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /new-site/admin/index.html [L]
EOF

echo "✅ Deploy preparato in: $DEPLOY_DIR"
echo ""
echo "Prossimi passi:"
echo "1. Upload $DEPLOY_DIR/* su FTP → new-site/"
echo "2. Configura .env sul server"
echo "3. Importa database con init.sql"
echo "4. Test: https://yourdomain.com/new-site/BE/api/health"
```

Rendilo eseguibile:
```bash
chmod +x scripts/deploy-prepare.sh
./scripts/deploy-prepare.sh
```

---

**Pronto per il deploy!** 🚀
