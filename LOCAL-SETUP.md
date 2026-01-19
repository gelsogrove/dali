# Quick Setup - Sviluppo Locale

## ⚠️ SOLO PER SVILUPPO LOCALE

Queste istruzioni sono **SOLO** per testare il sistema in locale con Docker.

**MAI** usare queste password in produzione o committarle su GitHub!

## 🔧 Configurazione Rapida

### 1. Configura Password di Test nel File .env

Apri il file `.env` e aggiungi:

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=local_dev_root_pass
MYSQL_DATABASE=dalila_db
MYSQL_USER=dalila_user
MYSQL_PASSWORD=local_dev_dalila_pass

# JWT Configuration
JWT_SECRET=local-development-jwt-secret-key-32-chars-minimum-required

# Application
ENVIRONMENT=development
```

### 2. Avvia Docker

```bash
./start.sh
```

Oppure:

```bash
docker-compose up -d
```

### 3. Attendi l'Inizializzazione

Ci vogliono circa 30 secondi per:
- Avviare MariaDB
- Creare database e tabelle
- Avviare backend PHP
- Avviare admin panel

### 4. Verifica Che Funzioni

**Backend API**:
```bash
curl http://localhost:8080/api/health
```

Risposta attesa:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": 1706543210
}
```

**Admin Panel**: http://localhost:5174

Login con:
- Email: `admin@dalila.com`
- Password: `Admin@123`

## 🛑 IMPORTANTE

### ❌ NON Committare MAI:

```bash
# Prima di ogni commit, verifica:
git status

# Se vedi .env modificato:
git restore .env

# Oppure aggiungi al .gitignore (già fatto):
echo ".env" >> .gitignore
```

### ✅ In Produzione:

Le password reali vanno configurate **solo sul server**:

1. Leggi [GODADDY-SETUP.md](GODADDY-SETUP.md)
2. Crea `.env` direttamente sul server
3. Usa password sicure generate
4. Proteggi il file con `chmod 600`

## 🧪 Test Rapidi

### Login API

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dalila.com",
    "password": "Admin@123"
  }'
```

Copia il token dalla risposta e usalo:

```bash
TOKEN="il-tuo-token-qui"

# Lista properties
curl http://localhost:8080/api/properties \
  -H "Authorization: Bearer $TOKEN"
```

### Accesso Database

```bash
docker-compose exec mysql mysql -u dalila_user -plocal_dev_dalila_pass dalila_db
```

Comandi utili:
```sql
SHOW TABLES;
SELECT * FROM properties;
SELECT * FROM admin_users;
```

## 🔄 Reset Completo

Se qualcosa non funziona:

```bash
# Ferma tutto
docker-compose down

# Rimuovi volumi (elimina database)
docker-compose down -v

# Riavvia
docker-compose up -d

# Attendi 30 secondi per inizializzazione
sleep 30

# Testa
curl http://localhost:8080/api/health
```

## 📝 Comandi Utili

```bash
# Vedere logs
docker-compose logs -f

# Logs solo backend
docker-compose logs -f backend

# Logs solo database
docker-compose logs -f mysql

# Stato servizi
docker-compose ps

# Fermare servizi
docker-compose down

# Riavviare un servizio
docker-compose restart backend
```

## 🐛 Problemi Comuni

### MySQL non si avvia

**Soluzione**: Rimuovi volumi e riavvia
```bash
docker-compose down -v
docker-compose up -d
```

### Backend 500 Error

**Verifica logs**:
```bash
docker-compose logs backend
```

**Accedi al container**:
```bash
docker-compose exec backend bash
cd /var/www/html
ls -la
cat api/index.php
```

### Admin Panel non carica

**Verifica container**:
```bash
docker-compose ps
```

Tutti devono essere "Up".

**Reinstalla dipendenze**:
```bash
cd admin
rm -rf node_modules
npm install
```

## 📚 Prossimi Passi

Una volta testato in locale:

1. ✅ [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy su cPanel
2. ✅ [GODADDY-SETUP.md](GODADDY-SETUP.md) - Configurazione password
3. ✅ [SECURITY.md](SECURITY.md) - Best practices sicurezza
4. ✅ [TESTING.md](TESTING.md) - Test completi

---

**Buon sviluppo! 🚀**
