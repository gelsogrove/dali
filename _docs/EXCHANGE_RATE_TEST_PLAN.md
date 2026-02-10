# Exchange Rate System - Test Plan

## ✅ Sistema Implementato

### Backend
- ✅ Database: Tabella `exchange_rates` con rate globali
- ✅ API Controller: `ExchangeRateController.php` con GET/POST endpoints
- ✅ API Routes: `/api/exchange-rate/current` (public), `/api/exchange-rate` (admin)
- ✅ Validazioni: Rate positivo, deactivate old rates automaticamente

### Admin Panel
- ✅ Dashboard Widget: `GlobalExchangeRate` component
- ✅ Property Form: Auto-load del rate globale per nuove properties
- ✅ UI Feedback: Badge "Global Rate (Auto-loaded)" nel form

### Fixes Implementati
- ✅ Price USD opzionale per developments
- ✅ Conversione automatica From/To USD ↔ MXN
- ✅ Exchange rate applicato a tutti i campi prezzo

---

## 🧪 Test Plan

### Test 1: Dashboard Widget - Visualizzazione
**Obiettivo**: Verificare che il widget mostri il rate corrente

**Steps**:
1. Aprire Admin Panel → Dashboard
2. Verificare presenza widget "Global Exchange Rate"
3. Controllare che mostri: `17.50 MXN` (rate di default)
4. Verificare la data: `Updated Feb 7, 2026`

**Expected Result**:
- Widget visibile nella dashboard
- Rate: 17.50 MXN
- Etichetta: "USD to MXN conversion rate"

---

### Test 2: Dashboard Widget - Modifica Rate
**Obiettivo**: Aggiornare il rate globale dalla dashboard

**Steps**:
1. Dashboard → Global Exchange Rate widget
2. Click su "Update Rate"
3. Inserire nuovo rate: `18.25`
4. Click su "Save"
5. Verificare toast di successo
6. Verificare che il widget mostri il nuovo rate: `18.25`

**Expected Result**:
- Toast: "Exchange Rate Updated"
- Widget aggiornato: `18.25 MXN`
- Data aggiornata alla data corrente

**API Call**:
```bash
curl -X POST http://localhost:8080/api/exchange-rate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rate": 18.25}'
```

---

### Test 3: Dashboard Widget - History
**Obiettivo**: Visualizzare lo storico dei rates

**Steps**:
1. Dashboard → Global Exchange Rate widget
2. Click su "History" button (icona History)
3. Verificare dialog con lista di rates storici
4. Controllare che il rate attivo abbia badge "Active"
5. Verificare formato data: "Feb 7, 2026"

**Expected Result**:
- Dialog aperta con titolo "Exchange Rate History"
- Lista rates ordinati per data (DESC)
- Rate attivo con badge verde "Active"
- Formato: `18.25 MXN - Feb 7, 2026`

---

### Test 4: Property Form - Auto-load Rate (New Property)
**Obiettivo**: Verificare che il rate globale venga caricato automaticamente

**Steps**:
1. Admin Panel → Properties → New Property
2. Attendere il caricamento del form
3. Scroll a "Pricing" section
4. Controllare campo "Exchange Rate"
5. Verificare che sia popolato automaticamente

**Expected Result**:
- Campo "Exchange Rate" pre-compilato con: `18.25` (rate corrente)
- Badge visibile: "Global Rate (Auto-loaded)"
- Help text: "This rate is automatically loaded from the global settings..."

---

### Test 5: Property Form - Auto-load NON avviene su Edit
**Obiettivo**: Verificare che l'edit mantenga il rate storico della property

**Steps**:
1. Aprire una property esistente per edit
2. Controllare campo "Exchange Rate"
3. Verificare che mostri il rate salvato nel DB (es. `17.50`)
4. NON deve caricare il rate globale nuovo (`18.25`)

**Expected Result**:
- Campo "Exchange Rate" = rate storico della property
- Il rate NON viene sovrascritto dal rate globale

---

### Test 6: Property Form - Development senza Price USD
**Obiettivo**: Verificare che Price USD sia opzionale per developments

**Steps**:
1. New Property
2. Type: `Development`
3. NON inserire "Price USD"
4. Inserire solo:
   - Price Range From USD: `150000`
   - Price Range To USD: `350000`
5. Exchange Rate: `18.25` (auto-loaded)
6. Click "Save"

**Expected Result**:
- ✅ Property salvata senza errori
- ✅ Price USD vuoto o NULL
- ✅ Range salvato: From $150k To $350k
- ✅ Range MXN auto-calculated: $2,737,500 - $6,387,500

**Database Check**:
```sql
SELECT 
  title, property_type,
  price_usd, 
  price_from_usd, price_to_usd,
  price_from_mxn, price_to_mxn,
  exchange_rate
FROM properties 
WHERE property_type = 'development'
ORDER BY id DESC LIMIT 1;
```

---

### Test 7: Property Form - Active Property senza Price USD
**Obiettivo**: Verificare che Price USD sia MANDATORY per active properties

**Steps**:
1. New Property
2. Type: `Active`
3. NON inserire "Price USD"
4. Compilare altri campi required
5. Click "Save"

**Expected Result**:
- ❌ Errore di validazione
- ❌ Messaggio: "Price USD is required for active properties"
- ❌ Campo evidenziato in rosso
- ❌ Auto-scroll al tab "Pricing"

---

### Test 8: Property Form - Conversione From/To Automatica
**Obiettivo**: Verificare che i range si convertano automaticamente

**Steps**:
1. New Property → Development
2. Exchange Rate: `18.25` (auto-loaded)
3. Inserire "Price Range From USD": `100000`
4. Verificare che "Price Range From MXN" si calcoli automaticamente
5. Inserire "Price Range To USD": `250000`
6. Verificare che "Price Range To MXN" si calcoli automaticamente

**Expected Result**:
- From USD: `100,000` → From MXN: `1,825,000`
- To USD: `250,000` → To MXN: `4,562,500`
- Conversione in real-time (onChange)

---

### Test 9: Property Form - Cambio Exchange Rate Ricalcola Tutto
**Obiettivo**: Verificare che modificando il rate, tutti i prezzi si aggiornino

**Steps**:
1. New Property
2. Price USD: `200000`
3. Exchange Rate: `18.00`
4. Verificare Price MXN = `3,600,000`
5. Modificare Exchange Rate a: `19.00`
6. Verificare che Price MXN si aggiorni a: `3,800,000`

**Expected Result**:
- Ogni modifica al rate ricalcola automaticamente tutti i campi MXN
- Price MXN aggiornato: `3,800,000`

---

### Test 10: API Endpoint - Public Access
**Obiettivo**: Verificare che `/exchange-rate/current` sia pubblico

**Steps**:
```bash
curl http://localhost:8080/api/exchange-rate/current
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "currency_from": "USD",
    "currency_to": "MXN",
    "rate": "18.2500",
    "date": "2026-02-07",
    "created_at": "2026-02-07 14:06:00",
    "updated_at": "2026-02-07 14:20:00"
  }
}
```

---

### Test 11: API Endpoint - Admin Only Update
**Obiettivo**: Verificare che solo admin possano modificare il rate

**Steps**:
```bash
# Senza token - Dovrebbe fallire
curl -X POST http://localhost:8080/api/exchange-rate \
  -H "Content-Type: application/json" \
  -d '{"rate": 19.50}'
```

**Expected Result**:
- Status: `401 Unauthorized`
- Messaggio: "Authentication required"

```bash
# Con token admin - Dovrebbe funzionare
curl -X POST http://localhost:8080/api/exchange-rate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rate": 19.50}'
```

**Expected Result**:
```json
{
  "success": true,
  "data": {
    "message": "Exchange rate updated successfully",
    "rate": 19.5,
    "date": "2026-02-07",
    "currency_from": "USD",
    "currency_to": "MXN"
  }
}
```

---

### Test 12: Database - Historical Rates
**Obiettivo**: Verificare che lo storico venga salvato correttamente

**Steps**:
1. Aggiornare rate a: `18.00` (POST /api/exchange-rate)
2. Aggiornare rate a: `18.50` (POST /api/exchange-rate)
3. Aggiornare rate a: `19.00` (POST /api/exchange-rate)
4. Query database:

```sql
SELECT id, rate, date, is_active, created_at 
FROM exchange_rates 
ORDER BY date DESC, id DESC;
```

**Expected Result**:
```
id | rate    | date       | is_active | created_at
---+---------+------------+-----------+-------------------
 3 | 19.0000 | 2026-02-07 | 1         | 2026-02-07 15:00:00
 2 | 18.5000 | 2026-02-07 | 0         | 2026-02-07 14:30:00
 1 | 18.0000 | 2026-02-07 | 0         | 2026-02-07 14:00:00
```

- Solo l'ultimo rate ha `is_active = 1`
- I precedenti hanno `is_active = 0`

---

## 🐛 Edge Cases da Testare

### Edge Case 1: Rate = 0
**Test**: Inserire rate `0` nel widget
**Expected**: Errore "Valid rate is required"

### Edge Case 2: Rate Negativo
**Test**: Inserire rate `-18.50` nel widget
**Expected**: Errore "Valid rate is required"

### Edge Case 3: Rate Non Numerico
**Test**: Inserire rate `abc` nel widget
**Expected**: Input non permette caratteri non numerici (HTML5 validation)

### Edge Case 4: Multiple Updates nello stesso giorno
**Test**: Aggiornare il rate 3 volte nello stesso giorno
**Expected**: 
- Solo 1 record attivo (`is_active = 1`)
- Gli altri record hanno `is_active = 0`
- Tutti hanno la stessa data ma orari diversi

### Edge Case 5: Property Form - Rate vuoto
**Test**: Creare property lasciando Exchange Rate vuoto
**Expected**: Backend usa default `17.50` o richiede il campo

---

## 📊 Checklist Completa

- [ ] Test 1: Dashboard widget visualizzazione
- [ ] Test 2: Dashboard widget modifica rate
- [ ] Test 3: Dashboard widget history
- [ ] Test 4: Property form auto-load rate (new)
- [ ] Test 5: Property form NO auto-load (edit)
- [ ] Test 6: Development senza Price USD
- [ ] Test 7: Active property richiede Price USD
- [ ] Test 8: Conversione From/To automatica
- [ ] Test 9: Cambio rate ricalcola prezzi
- [ ] Test 10: API endpoint pubblico
- [ ] Test 11: API endpoint admin only
- [ ] Test 12: Database historical rates
- [ ] Edge Case 1: Rate = 0
- [ ] Edge Case 2: Rate negativo
- [ ] Edge Case 3: Rate non numerico
- [ ] Edge Case 4: Multiple updates stesso giorno
- [ ] Edge Case 5: Rate vuoto nel form

---

## 🚀 URLs di Test

- **Admin Panel**: http://localhost:5175
- **API Backend**: http://localhost:8080
- **Frontend**: http://localhost:5173 (per verificare display finale)

### Quick API Tests
```bash
# Get current rate (public)
curl http://localhost:8080/api/exchange-rate/current | python3 -m json.tool

# Update rate (admin) - Need token
# 1. Login first
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dalila.com","password":"your_password"}' | jq -r '.data.token')

# 2. Update rate
curl -X POST http://localhost:8080/api/exchange-rate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rate": 18.75}' | python3 -m json.tool

# 3. Get history
curl http://localhost:8080/api/exchange-rate/history \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

**Status**: Sistema completamente implementato ✅  
**Priorità Test**: Alta  
**Tempo Stimato**: 30-45 minuti per test completo
