# Security Notice

## ⚠️ IMPORTANTE - Repository Pubblico

Questo repository è **pubblico** su GitHub. Per questo motivo:

### ❌ NON committare MAI:
- Password reali
- Chiavi JWT di produzione
- Credenziali del database
- API keys
- Token di accesso
- Informazioni sensibili

### ✅ Configurazione Corretta

#### File `.env` e `.env.example`
- Contengono solo placeholder vuoti
- Le password reali vanno configurate **solo sul server**
- Mai versionate password reali

#### Configurazione Server (GoDaddy/cPanel)

Le password vanno impostate direttamente sul server:

1. **Database**: Configurare in cPanel MySQL
2. **JWT Secret**: Generare chiave sicura:
   ```bash
   openssl rand -base64 32
   ```
3. **Variabili ambiente**: Impostare in cPanel o via SSH

#### Configurazioni Statiche

Le seguenti configurazioni sono definite **direttamente nel codice PHP** (non nel .env):
- `UPLOAD_MAX_SIZE` → 10485760 bytes (10MB)
- `ALLOWED_IMAGE_TYPES` → jpg, jpeg, png, webp
- `ALLOWED_VIDEO_TYPES` → mp4, mpeg, quicktime
- `MAX_VIDEO_SIZE` → 104857600 bytes (100MB)

Queste sono in `BE/api/controllers/UploadController.php`

### 📋 Checklist Sicurezza

Prima di ogni commit, verificare:
- [ ] Nessuna password nel codice
- [ ] File `.env` contiene solo placeholder
- [ ] File `.env.example` è un template vuoto
- [ ] File `.env` è nel `.gitignore`
- [ ] Nessun file di backup con password

### 🔒 Setup Produzione

In produzione (GoDaddy):

1. **Database**:
   - Creare database in cPanel
   - Annotare credenziali in luogo sicuro (non nel repo!)

2. **JWT Secret**:
   ```bash
   openssl rand -base64 32
   ```
   Copiare l'output e configurarlo sul server

3. **File `.env` sul server**:
   ```env
   MYSQL_DATABASE=yourusername_dalila
   MYSQL_USER=yourusername_dalila_user
   MYSQL_PASSWORD=la-tua-password-sicura-qui
   JWT_SECRET=il-token-generato-con-openssl-qui
   ENVIRONMENT=production
   ```

4. **Proteggere `.env`**:
   - File permissions: `chmod 600 .env`
   - Owner: `www-data` o utente Apache
   - Mai accessibile via web (già protetto da .htaccess)

### 🚨 Se Password Commitata per Errore

Se accidentalmente hai committato password:

1. **Cambiare immediatamente** tutte le password esposte
2. Rimuovere dal git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push: `git push origin --force --all`
4. Notificare il team

### 📖 Best Practices

1. **Mai** condividere password via email/chat
2. Usare password manager (1Password, LastPass, etc.)
3. Password diverse per ogni servizio
4. Password lunghe (16+ caratteri)
5. Rotazione password ogni 3-6 mesi
6. 2FA dove possibile

### 🔗 Risorse

- [OWASP Password Guidelines](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security/getting-started/best-practices-for-securing-your-code)

---

**Ricorda**: La sicurezza è responsabilità di tutti! 🔐
