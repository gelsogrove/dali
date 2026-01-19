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
