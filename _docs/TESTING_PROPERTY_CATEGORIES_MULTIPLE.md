# Testing Guide - Property Categories Multiple

## 📋 Pre-requisiti

1. ✅ Migration database eseguita: `./scripts/migrations/run-010-property-categories.sh`
2. ✅ Backend riavviato (o hot-reload attivo)
3. ✅ Frontend admin riavviato (o hot-reload attivo)
4. ✅ Login nell'admin panel

---

## 🧪 Test Cases

### Test 1: Creare Nuovo Development con Categorie Multiple

**Steps:**
1. Admin Panel → Properties → New Property
2. Inserire:
   - Title: "Test Development Multiple Categories"
   - City: "Tulum"
   - Property Type: **"New Development"**
3. Salvare (creazione base)
4. Riaprire in edit
5. Nel tab "Basic Info", verificare che:
   - ✅ Property Category mostra **checkbox multipli** (non select)
6. Selezionare 3 categorie:
   - ☑️ Apartment
   - ☑️ Penthouse
   - ☑️ Villa
7. Completare altri campi obbligatori (price, SEO, ecc.)
8. Salvare

**Expected Result:**
- ✅ Salvataggio riuscito
- ✅ Nessun errore console
- ✅ Ricaricando la pagina, le 3 checkbox sono ancora selezionate

**API Verification:**
```bash
# Verificare in database
docker-compose exec db mysql -udalila_user -pdalila_password dalila_db -e "
  SELECT p.id, p.title, GROUP_CONCAT(pc.category ORDER BY pc.category) as categories
  FROM properties p
  LEFT JOIN property_categories pc ON p.id = pc.property_id
  WHERE p.title = 'Test Development Multiple Categories'
  GROUP BY p.id;
"
```

**Expected Output:**
```
+----+-------------------------------------+----------------------------+
| id | title                               | categories                 |
+----+-------------------------------------+----------------------------+
|  X | Test Development Multiple Categories| apartment,penthouse,villa  |
+----+-------------------------------------+----------------------------+
```

---

### Test 2: Modificare Development Esistente - Aggiungere Categorie

**Steps:**
1. Aprire un development esistente in edit
2. Nel tab "Basic Info":
   - ✅ Verificare che mostra checkbox (non select)
   - ✅ Verificare che categoria attuale è pre-selezionata
3. Aggiungere altre 2 categorie
4. Salvare

**Expected Result:**
- ✅ Salvataggio riuscito
- ✅ Tutte le categorie selezionate sono salvate

---

### Test 3: Active Property - Deve Usare Select Singolo

**Steps:**
1. Creare o aprire una Active Property
2. Verificare che Property Type = "Active Property"
3. Nel tab "Basic Info":
   - ✅ Property Category mostra **SELECT singolo** (non checkbox)
4. Selezionare una categoria (es. "Villa")
5. Salvare

**Expected Result:**
- ✅ Salvataggio riuscito
- ✅ Solo 1 categoria salvata nel campo `property_category` (no tabella property_categories)

---

### Test 4: Cambiare da Active a Development

**Steps:**
1. Aprire una Active Property con category = "Villa"
2. Cambiare Property Type da "Active" → "Development"
3. Verificare che:
   - ✅ UI cambia da Select a Checkbox
   - ✅ La categoria "Villa" è pre-selezionata (checkbox checked)
4. Aggiungere altre categorie
5. Salvare

**Expected Result:**
- ✅ Categorie salvate in `property_categories` table
- ✅ Campo `property_category` può essere NULL o mantenere valore

---

### Test 5: Filtro Ricerca Frontend - Property Category

**Steps:**
1. Frontend pubblico → /search
2. Filtrare per "Category: Apartment"
3. Verificare risultati

**Expected Result:**
- ✅ Mostra sia:
  - Active properties con `property_category = 'apartment'`
  - Development con `apartment` in `property_categories` table

**Backend API Test:**
```bash
curl "http://localhost/api/properties?property_category=apartment" | jq '.data.properties[] | {id, title, property_type}'
```

---

### Test 6: API Response - Development con Categorie Multiple

**Steps:**
```bash
# Ottenere ID del development creato nel Test 1
curl "http://localhost/api/properties/{ID}" | jq '.data | {property_type, property_category, property_categories}'
```

**Expected Output:**
```json
{
  "property_type": "development",
  "property_category": null,
  "property_categories": [
    "apartment",
    "penthouse",
    "villa"
  ]
}
```

---

### Test 7: Validazione - Development Senza Categorie

**Steps:**
1. Creare nuovo Development
2. Nel tab "Basic Info", NON selezionare nessuna checkbox
3. Tentare di salvare

**Expected Result:**
- ❌ Errore: "Please select at least one category for the development"
- ✅ Non permette salvataggio

---

### Test 8: Deselezionare Tutte le Categorie (Edit)

**Steps:**
1. Aprire development con 3 categorie
2. Deselezionare tutte le checkbox
3. Tentare di salvare

**Expected Result:**
- ❌ Errore: "Please select at least one category for the development"

---

### Test 9: Performance - Query con JOIN

**Steps:**
Verificare che le query non siano troppo lente con il JOIN:

```bash
# Test query performance
docker-compose exec db mysql -udalila_user -pdalila_password dalila_db -e "
  EXPLAIN SELECT p.* 
  FROM properties p
  WHERE EXISTS (
    SELECT 1 FROM property_categories pc 
    WHERE pc.property_id = p.id 
    AND pc.category = 'apartment'
  );
"
```

**Expected:**
- ✅ Query usa indici
- ✅ Nessun "Using filesort" o "Using temporary"

---

### Test 10: Frontend Pubblico - Visualizzazione Categorie Multiple

**Steps:**
1. Aprire dettaglio di un development con categorie multiple
2. Verificare visualizzazione

**Expected Result:**
Se il PropertyDetailPage è stato aggiornato:
- ✅ Mostra tutte le categorie (es. "Apartment, Penthouse, Villa")
- ✅ Layout chiaro e leggibile

Se NON è stato aggiornato:
- ✅ Non crashare
- ✅ Mostrare almeno property_type

---

## 🐛 Problemi Comuni

### Errore: "table property_categories doesn't exist"
**Soluzione:** Eseguire migration: `./scripts/migrations/run-010-property-categories.sh`

### Checkbox non appaiono, solo select
**Soluzione:** 
1. Verificare che frontend admin sia riavviato
2. Controllare console browser per errori
3. Verificare che property_type sia "development"

### Salvataggio fallisce con "Invalid property_category"
**Soluzione:** Backend non aggiornato o cache. Riavviare containers:
```bash
docker-compose restart api
```

### Categorie non si salvano
**Soluzione:**
1. Controllare network tab: payload deve avere `property_categories: []`
2. Controllare logs backend: `docker-compose logs api`
3. Verificare che tabella `property_categories` esista

---

## ✅ Checklist Completa

- [ ] Migration database eseguita con successo
- [ ] Test 1: Nuovo development con 3 categorie
- [ ] Test 2: Modificare development esistente
- [ ] Test 3: Active property usa select singolo
- [ ] Test 4: Cambio da active a development
- [ ] Test 5: Filtro ricerca funziona
- [ ] Test 6: API response corretta
- [ ] Test 7: Validazione senza categorie
- [ ] Test 8: Deselezionare tutte blocca
- [ ] Test 9: Performance query accettabile
- [ ] Test 10: Frontend pubblico non crashare

---

## 📝 Note per Produzione

Prima di deployare in produzione:

1. **Backup completo database**
2. **Eseguire migration in staging** prima di production
3. **Testare rollback plan** se qualcosa va storto
4. **Verificare che properties esistenti** funzionino ancora
5. **Comunicare change** al team (nuova UI per developments)

---

**Creato**: 2026-02-04  
**Autore**: GitHub Copilot
