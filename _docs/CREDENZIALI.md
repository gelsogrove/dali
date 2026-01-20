# 🔐 Credenziali di Accesso

## Admin Panel - Primo Accesso

**URL Admin Panel (Locale):** http://localhost:5175/  
**URL Admin Panel (Produzione):** https://new.buywithdali.com/admin/

### Credenziali Default

**Email:** `admin@dalila.com`  
**Password:** `admin123` _(da cambiare al primo accesso!)_

---

## Database

### Sviluppo Locale (Docker)
- **Host:** localhost / 127.0.0.1
- **Database:** dalila_db_dev
- **User:** dalila_user_dev
- **Password:** local-password
- **Port:** 3306

### Produzione (GoDaddy)
Configurate in `.env.production`:
- **Host:** localhost
- **Database:** (da configurare su cPanel)
- **User:** (da configurare su cPanel)
- **Password:** (da configurare su cPanel)

---

## Note Sicurezza

⚠️ **IMPORTANTE:** Dopo il primo accesso in produzione:
1. Cambia immediatamente la password admin
2. Aggiorna `.env.production` con credenziali DB reali
3. Genera un JWT_SECRET sicuro (almeno 32 caratteri)

🔒 Non committare mai credenziali reali su Git!
