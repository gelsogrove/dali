# 🚀 GUIDA DEPLOYMENT SERVER - Dalila Real Estate

## 📦 FILE DA CARICARE

### Struttura Directory Server (GoDaddy cPanel)
```
public_html/
├── index.html                    # ← fe/dist/index.html
├── assets/                       # ← fe/dist/assets/
├── fonts/                        # ← fe/public/fonts/
├── images/                       # ← fe/public/images/
├── api/                          # Backend API
│   ├── index.php                # Main router
│   ├── controllers/             # All controllers
│   ├── middleware/              # Auth middleware
│   └── config/                  # DB & JWT config
├── uploads/                      # CREA QUESTA CARTELLA
│   ├── properties/
│   ├── videos/
│   ├── galleries/
│   └── blogs/
├── admin/                        # ← admin/dist/
│   ├── index.html
│   └── assets/
└── .htaccess                     # Vedi sezione sotto
```

---

## 1️⃣ DATABASE

### A) Esegui SQL via phpMyAdmin
1. Login phpMyAdmin dal cPanel
2. Seleziona il tuo database
3. Tab "SQL"
4. Copia TUTTO il contenuto di `api/database/init.sql`
5. Click "Esegui"

### B) Crea Admin User
```sql
-- Password di default: Admin123!
-- CAMBIALA SUBITO dopo il primo login!
INSERT INTO admin_users (email, password_hash, first_name, last_name, role) 
VALUES (
  'admin@buywithdali.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Dalila',
  'Gelsomino',
  'admin'
);
```

### C) Verifica credenziali in .env
```bash
# Aggiorna api/config/database.php con le credenziali reali
DB_HOST=localhost
DB_NAME=il_tuo_database_name
DB_USER=il_tuo_database_user
DB_PASSWORD=la_tua_database_password
```

---

## 2️⃣ PERMESSI CARTELLE (IMPORTANTISSIMO!)

### Via SSH (se disponibile)
```bash
cd public_html

# Crea cartella uploads se non esiste
mkdir -p uploads/{properties,videos,galleries,blogs}

# Imposta permessi corretti
chmod 755 uploads
chmod 755 uploads/properties
chmod 755 uploads/videos
chmod 755 uploads/galleries
chmod 755 uploads/blogs

# Se il server usa www-data come user Apache
chown -R www-data:www-data uploads

# Se il server usa il tuo user (più comune su shared hosting)
chown -R $USER:$USER uploads
```

### Via cPanel File Manager
1. Vai in File Manager
2. Naviga a `public_html/`
3. Crea cartella `uploads`
4. Dentro uploads, crea sottocartelle:
   - `properties`
   - `videos`
   - `galleries`
   - `blogs`
5. **Click destro su `uploads` → "Permissions"**
6. Imposta: **755** (rwxr-xr-x)
   - ✅ Owner: Read, Write, Execute
   - ✅ Group: Read, Execute
   - ✅ Public: Read, Execute
7. Spunta "Apply to subdirectories" (se disponibile)
8. Click "Save"

---

## 3️⃣ FILE .htaccess

### A) ROOT: public_html/.htaccess
```apache
# Frontend React Router
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/api
  RewriteCond %{REQUEST_URI} !^/admin
  RewriteCond %{REQUEST_URI} !^/uploads
  
  # Rewrite everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

### B) API: public_html/api/.htaccess
```apache
# API Rewrite Rules
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /api/
  
  # Route all requests through index.php
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>

# CORS Headers (già configurati in apache-config.conf ma per sicurezza)
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Deny access to sensitive files
<FilesMatch "^\.">
  Order allow,deny
  Deny from all
</FilesMatch>
```

### C) Admin: public_html/admin/.htaccess
```apache
# Admin Panel React Router
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/
  
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
```

---

## 4️⃣ CONFIGURAZIONE PHP

### Verifica versione PHP
1. cPanel → "Select PHP Version"
2. **Seleziona PHP 7.4** (come discusso)
3. Assicurati che queste estensioni siano abilitate:
   - ✅ mysqli
   - ✅ pdo
   - ✅ pdo_mysql
   - ✅ gd (per ridimensionamento immagini)
   - ✅ mbstring
   - ✅ json

### php.ini (se modificabile)
```ini
upload_max_filesize = 10M
post_max_size = 10M
memory_limit = 256M
max_execution_time = 300
```

---

## 5️⃣ FILE DA ESCLUDERE (NON CARICARE)

**NON caricare sul server:**
- ❌ `node_modules/`
- ❌ `.git/`
- ❌ `.env` (locale)
- ❌ `docker-compose.yml`
- ❌ `Dockerfile`
- ❌ `package.json` e `package-lock.json`
- ❌ File sorgente React (src/) - solo dist/
- ❌ `old/` directory

---

## 6️⃣ VARIABILI AMBIENTE

### Configura in database.php
```php
// api/config/database.php
private $host = "localhost";  // Di solito localhost su shared hosting
private $db_name = "NOME_DB_PRODUZIONE";
private $username = "USER_DB_PRODUZIONE";
private $password = "PASSWORD_DB_PRODUZIONE";

// JWT Secret - CAMBIA QUESTA!
private $jwt_secret = "GENERA_UNA_CHIAVE_CASUALE_MINIMO_32_CARATTERI_QUI";
```

**Genera JWT Secret sicuro:**
```bash
# Genera una chiave random
openssl rand -base64 32
# Esempio output: xK8v9YZ2mN4pQ7wR3sT6uV8xA1bC4dE5fG7hJ9kL0m
```

---

## 7️⃣ TEST POST-DEPLOYMENT

### A) Test API
```bash
# Test health
curl https://buywithdali.com/api/health

# Test blogs
curl https://buywithdali.com/api/blogs
```

### B) Test Frontend
- Apri: https://buywithdali.com
- Verifica che React Router funzioni
- Vai a: https://buywithdali.com/category/blog

### C) Test Admin
- Apri: https://buywithdali.com/admin
- Login con: admin@buywithdali.com / Admin123!
- **CAMBIA SUBITO LA PASSWORD!**

### D) Test Upload
1. Login admin
2. Vai in Properties
3. Prova a caricare un'immagine
4. Verifica che appaia in `/uploads/properties/`

---

## 8️⃣ SICUREZZA POST-DEPLOYMENT

### A) Cambia password admin
```sql
-- Genera nuovo hash per password sicura
-- Usa questo script PHP per generare l'hash:
<?php
echo password_hash('TuaPasswordSicura123!', PASSWORD_DEFAULT);
?>

-- Poi aggiorna:
UPDATE admin_users 
SET password_hash = 'NUOVO_HASH_QUI' 
WHERE email = 'admin@buywithdali.com';
```

### B) Proteggi file sensibili
Aggiungi in `public_html/.htaccess`:
```apache
# Nega accesso a file di configurazione
<FilesMatch "\.(env|sql|md|gitignore)$">
  Order allow,deny
  Deny from all
</FilesMatch>
```

### C) Verifica permessi
```bash
# File PHP: 644 (rw-r--r--)
# Cartelle: 755 (rwxr-xr-x)
# uploads/: 755 ma scrivibile da PHP
```

---

## 9️⃣ CHECKLIST FINALE

- [ ] Database creato e popolato
- [ ] Admin user creato
- [ ] Cartella uploads/ con permessi 755
- [ ] Sottocartelle uploads/ create (properties, videos, galleries, blogs)
- [ ] PHP 7.4 selezionato
- [ ] Estensioni PHP abilitate (mysqli, gd)
- [ ] File .htaccess configurati
- [ ] api/config/database.php aggiornato con credenziali reali
- [ ] JWT_SECRET cambiato
- [ ] Frontend build caricato in public_html/
- [ ] Admin build caricato in public_html/admin/
- [ ] Backend API caricato in public_html/api/
- [ ] Test API funzionante
- [ ] Test frontend funzionante
- [ ] Test admin login funzionante
- [ ] Test upload immagini funzionante
- [ ] Password admin cambiata

---

## 🆘 TROUBLESHOOTING

### Problema: 500 Internal Server Error
- Verifica error_log in cPanel
- Controlla permessi file (.htaccess deve essere 644)
- Verifica sintassi .htaccess

### Problema: Database connection failed
- Verifica credenziali in database.php
- Verifica che user abbia permessi GRANT
- Prova connessione da phpMyAdmin

### Problema: Upload non funziona
- Verifica permessi uploads/ (deve essere 755)
- Verifica owner della cartella
- Controlla php.ini per upload_max_filesize

### Problema: Admin login non funziona
- Verifica che tabella admin_users esista
- Controlla che JWT_SECRET sia configurato
- Verifica error_log PHP per dettagli

---

## 📞 CONTATTI SUPPORTO

Se hai problemi con GoDaddy cPanel:
- Supporto GoDaddy: https://www.godaddy.com/help
- Telefono: 480-505-8877

---

**NOTA IMPORTANTE**: Dopo il deployment, TESTA TUTTO prima di pubblicizzare il sito!
