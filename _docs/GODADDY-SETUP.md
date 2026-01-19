# Configurazione Password in GoDaddy

## 📋 Procedura Completa

### Passo 1: Accesso cPanel

1. Login su GoDaddy
2. Vai a "My Products"
3. Clicca su "cPanel Admin" per il tuo hosting

### Passo 2: Creare Database MySQL

1. In cPanel, cerca "MySQL Databases"
2. **Crea Database**:
   - Nome: `dalila_db` (sarà prefissato con username, es: `yourusername_dalila_db`)
   - Clicca "Create Database"
3. **Crea Utente**:
   - Username: `dalila_user`
   - Password: Usa "Password Generator" per password sicura
   - **Salva questa password in luogo sicuro** (1Password, LastPass, etc.)
   - Clicca "Create User"
4. **Aggiungi utente al database**:
   - Seleziona utente e database
   - Clicca "Add"
   - Seleziona "ALL PRIVILEGES"
   - Clicca "Make Changes"

### Passo 3: Generare JWT Secret

#### Opzione A: Via Terminal (se hai SSH)

```bash
openssl rand -base64 32
```

Copia l'output (es: `4K8n9/BxY2ZqP3mL7vNwR5tUa6sE1cF8=`)

#### Opzione B: Via Online Generator

1. Vai su: https://randomkeygen.com/
2. Copia una chiave dalla sezione "Fort Knox Passwords"
3. Assicurati sia almeno 32 caratteri

### Passo 4: Creare File .env sul Server

#### Via File Manager cPanel:

1. Apri "File Manager" in cPanel
2. Naviga a `public_html/api/`
3. Clicca "New File"
4. Nome: `.env`
5. Click destro → Edit
6. Incolla questo contenuto (con LE TUE password):

```env
# Database Configuration
MYSQL_DATABASE=yourusername_dalila_db
MYSQL_USER=yourusername_dalila_user
MYSQL_PASSWORD=LA-PASSWORD-MYSQL-CHE-HAI-CREATO

# JWT Configuration
JWT_SECRET=LA-CHIAVE-JWT-CHE-HAI-GENERATO

# Application
ENVIRONMENT=production
```

7. Save Changes

#### Via SSH (se disponibile):

```bash
cd ~/public_html/api/
nano .env
```

Incolla il contenuto sopra, salva con Ctrl+X, Y, Enter

### Passo 5: Proteggere il File .env

Via File Manager:
1. Click destro su `.env`
2. "Change Permissions"
3. Imposta: `600` (Owner: Read + Write)
4. Deseleziona tutte le altre
5. Save

Via SSH:
```bash
chmod 600 .env
```

### Passo 6: Verificare Protezione

Il file `.env` NON deve essere accessibile via web.

Prova: `https://tuodominio.com/api/.env`

Dovresti vedere: **403 Forbidden** ✅

Se vedi il contenuto del file → **PROBLEMA DI SICUREZZA** ❌

### Passo 7: Importare Database

1. In cPanel, apri "phpMyAdmin"
2. Seleziona il tuo database (yourusername_dalila_db)
3. Tab "Import"
4. Upload file: `BE/database/init.sql`
5. Clicca "Go"
6. Verifica: dovresti vedere 7 tabelle create

### Passo 8: Cambiare Password Admin Default

In phpMyAdmin:

```sql
-- Genera hash password
-- Vai su: https://bcrypt-generator.com/
-- Inserisci la tua password
-- Copia l'hash generato

-- Aggiorna admin
UPDATE admin_users 
SET password_hash = '$2y$10$IL-TUO-HASH-BCRYPT-QUI' 
WHERE email = 'admin@dalila.com';
```

**Salva la nuova password in luogo sicuro!**

### Passo 9: Testare Configurazione

1. **Backend API**:
   ```
   https://tuodominio.com/api/health
   ```
   Dovresti vedere:
   ```json
   {
     "success": true,
     "message": "API is running"
   }
   ```

2. **Login Admin**:
   ```
   https://tuodominio.com/admin/
   ```
   Login con:
   - Email: `admin@dalila.com`
   - Password: quella che hai impostato

## 🔒 Checklist Sicurezza Finale

- [ ] File `.env` creato sul server
- [ ] Tutte le password sono sicure (16+ caratteri)
- [ ] JWT secret è random (32+ caratteri)
- [ ] File `.env` ha permissions 600
- [ ] `.env` NON è accessibile via web (403)
- [ ] Database importato correttamente
- [ ] Password admin cambiata
- [ ] Login admin funziona
- [ ] API health check risponde
- [ ] Password salvate in password manager
- [ ] NESSUNA password nel repository GitHub

## 🆘 Troubleshooting

### Database Connection Failed

**Problema**: Backend non si connette al database

**Verifica**:
```bash
# In phpMyAdmin
SHOW DATABASES;
# Deve mostrare: yourusername_dalila_db

# Verifica utente
SELECT user FROM mysql.user WHERE user LIKE '%dalila%';
```

**Soluzione**:
- Verifica nome database in `.env` include prefix username
- Verifica credenziali utente
- Verifica permessi utente (ALL PRIVILEGES)

### 403 su .env non Funziona

**Problema**: File .env è accessibile via web

**Soluzione**:
1. Verifica `.htaccess` in `/api/`:
   ```apache
   <FilesMatch "(^\.env)$">
       Order allow,deny
       Deny from all
   </FilesMatch>
   ```

2. Se ancora accessibile:
   ```bash
   # Sposta .env fuori public_html
   mv ~/public_html/api/.env ~/
   
   # Aggiorna path nel codice PHP
   # In config/database.php e config/jwt.php:
   # Cambia: getenv('VAR')
   # In: getenv('VAR') ?: parse_ini_file('../../../.env')['VAR']
   ```

### Login Admin Non Funziona

**Problema**: Credenziali rifiutate

**Verifica password hash**:
```sql
SELECT email, password_hash FROM admin_users;
```

**Rigenera password**:
1. Vai su: https://bcrypt-generator.com/
2. Inserisci nuova password
3. Copia hash
4. Update in database:
   ```sql
   UPDATE admin_users 
   SET password_hash = '$2y$10$NUOVO-HASH' 
   WHERE email = 'admin@dalila.com';
   ```

## 📞 Supporto

Per problemi di configurazione:
1. Controlla [DEPLOYMENT.md](DEPLOYMENT.md)
2. Verifica logs in cPanel
3. Controlla error_log PHP
4. Contatta supporto GoDaddy se necessario

---

**Ricorda**: Mai condividere password via email/chat non sicure! 🔐
