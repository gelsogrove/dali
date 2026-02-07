# Deployment Testing Checklist - Development Upgrade

## Database Migration

### Pre-Migration Checks
- [ ] Backup database completo
- [ ] Verificare che MySQL versione >= 5.7
- [ ] Confermare che utente ha privilegi CREATE, ALTER, INSERT, UPDATE

### Migration Execution
- [ ] Eseguire `/database/013_complete_development_upgrade.sql`
- [ ] Verificare output: nessun errore
- [ ] Controllare tabelle create:
  ```sql
  SHOW TABLES LIKE 'property_categories';
  SELECT COUNT(*) FROM property_categories;
  ```
- [ ] Controllare nuove colonne:
  ```sql
  DESCRIBE properties;
  -- Verificare: price_base_currency, price_mxn, price_from_mxn, price_to_mxn
  -- Verificare: bedrooms_min, bedrooms_max, bathrooms_min, bathrooms_max
  ```

### Post-Migration Verification
- [ ] Testare trigger conversione MXN→USD:
  ```sql
  INSERT INTO properties (title, property_type, city, price_base_currency, price_mxn)
  VALUES ('TEST', 'active', 'Test', 'MXN', 5000000);
  SELECT price_mxn, price_usd FROM properties WHERE title = 'TEST';
  DELETE FROM properties WHERE title = 'TEST';
  ```
- [ ] Testare trigger conversione USD→MXN:
  ```sql
  INSERT INTO properties (title, property_type, city, price_base_currency, price_usd)
  VALUES ('TEST', 'active', 'Test', 'USD', 250000);
  SELECT price_usd, price_mxn FROM properties WHERE title = 'TEST';
  DELETE FROM properties WHERE title = 'TEST';
  ```

---

## Backend API Testing

### Property Creation - Active Property (Single Category)
**Endpoint:** `POST /api/properties`

```json
{
  "title": "Test Active Property",
  "property_type": "active",
  "property_category": "villa",
  "city": "Playa del Carmen",
  "price_base_currency": "USD",
  "price_usd": 350000,
  "bedrooms": "3",
  "bathrooms": "2"
}
```

**Expected:**
- [ ] Status 201 Created
- [ ] Response includes property ID
- [ ] `price_mxn` auto-calculated (≈ 350000 * 20 = 7,000,000)
- [ ] `property_category` = "villa"
- [ ] `property_categories` NOT present or null

---

### Property Creation - Development (Multiple Categories, MXN Base)
**Endpoint:** `POST /api/properties`

```json
{
  "title": "Test Development MXN",
  "property_type": "development",
  "property_categories": ["apartment", "penthouse", "condo"],
  "city": "Tulum",
  "price_base_currency": "MXN",
  "price_from_mxn": 2500000,
  "price_to_mxn": 8000000,
  "bedrooms_min": "studio",
  "bedrooms_max": "3",
  "bathrooms_min": "1",
  "bathrooms_max": "2.5"
}
```

**Expected:**
- [ ] Status 201 Created
- [ ] `property_categories` array = ["apartment", "penthouse", "condo"]
- [ ] `price_from_usd` ≈ 125,000 (2.5M / 20)
- [ ] `price_to_usd` ≈ 400,000 (8M / 20)
- [ ] Bedrooms/bathrooms ranges saved correctly

---

### Property Update - Switch USD → MXN
**Endpoint:** `PATCH /api/properties/{id}`

1. Creare property con USD base
2. Update:
```json
{
  "price_base_currency": "MXN",
  "price_mxn": 6000000
}
```

**Expected:**
- [ ] `price_usd` auto-calculated ≈ 300,000
- [ ] `price_base_currency` = "MXN"

---

### Property Filters - Category Search
**Endpoint:** `GET /api/properties?property_category=apartment`

**Expected:**
- [ ] Returns BOTH:
  - Active properties with `property_category='apartment'`
  - Developments with 'apartment' in `property_categories` array

---

### Property Filters - Type Search
**Endpoint:** `GET /api/properties?property_type=development`

**Expected:**
- [ ] Returns only developments
- [ ] Each includes `property_categories` array
- [ ] Each includes bedrooms/bathrooms ranges (if set)

---

### Get Property by ID
**Endpoint:** `GET /api/properties/{id}` (development ID)

**Expected:**
- [ ] `property_categories` array populated
- [ ] `price_base_currency` present
- [ ] `price_mxn` present (if USD base)
- [ ] `bedrooms_min`, `bedrooms_max` present (if set)

---

## Admin Frontend Testing

### Create Active Property
- [ ] Selezionare "Active Property" nel tipo
- [ ] Verificare che Property Category appare come **SELECT dropdown** (non checkbox)
- [ ] Scegliere "Villa"
- [ ] Selezionare USD base currency
- [ ] Inserire Price USD: 450,000
- [ ] Verificare che Price MXN si auto-calcola (≈ 9,000,000)
- [ ] Selezionare Bedrooms: 4, Bathrooms: 3.5
- [ ] Submit → Verificare creazione senza errori

### Create Development - Multiple Categories
- [ ] Selezionare "New Development" nel tipo
- [ ] Verificare che Property Category appare come **CHECKBOXES** (non select)
- [ ] Selezionare 3 categorie: Apartment, Condo, Penthouse
- [ ] Selezionare MXN base currency
- [ ] Inserire Price From MXN: 3,500,000, Price To MXN: 12,000,000
- [ ] Verificare che Price From/To USD si auto-calcolano
- [ ] Selezionare Bedrooms range: Studio to 4
- [ ] Selezionare Bathrooms range: 1 to 3
- [ ] Submit → Verificare creazione
- [ ] Edit: verificare che 3 categorie sono checked
- [ ] Edit: verificare range bedrooms/bathrooms visibili

### Toggle USD ↔ MXN
- [ ] Edit una property esistente
- [ ] Toggle da USD a MXN
- [ ] Modificare Price MXN: 7,500,000
- [ ] Verificare auto-calcolo Price USD (≈ 375,000)
- [ ] Save → Reload → verificare valori corretti

### Amenities Unlimited
- [ ] Create/Edit property
- [ ] Selezionare > 20 amenities
- [ ] Verificare che non appare limite/errore
- [ ] Submit → Verificare salvato correttamente

---

## Public Frontend Testing

### Search Page - Filters

#### Filter by Type
- [ ] Aprire `/search`
- [ ] Filter "Type" = "New Development"
- [ ] Verificare che mostra solo developments
- [ ] Filter "Type" = "Active Property"
- [ ] Verificare che mostra solo active properties

#### Filter by Category
- [ ] Filter "Category" = "Apartment"
- [ ] Verificare risultati includono:
  - Active properties con `property_category='apartment'`
  - Developments con 'apartment' in categories
- [ ] Selezionare un development nei risultati
- [ ] Verificare mostra tutte le categorie selezionate

---

### Property Detail Page - Development

**Visitare una pagina development:**

#### Multiple Categories Display
- [ ] Verificare sezione "Category" mostra lista categorie separate da virgola
  - Esempio: "Apartment, Condo, Penthouse"
  - NON mostra solo una categoria

#### Price Display
- [ ] Se base MXN:
  - Mostra prezzo principale in MXN (grande)
  - Mostra conversione USD sotto (piccolo, grigio)
- [ ] Se base USD:
  - Mostra prezzo principale in USD (grande)
  - Mostra conversione MXN sotto (piccolo, grigio)

#### Bedrooms/Bathrooms Range
- [ ] Sezione "Bedrooms" mostra: "studio to 3" (non solo "3")
- [ ] Sezione "Bathrooms" mostra: "1 to 2.5" (non solo "2.5")
- [ ] Sidebar "Property Facts" mostra stessi range

#### Additional Information Accordion
- [ ] Property Type: "NEW DEVELOPMENT" (non "ACTIVE PROPERTIES")
- [ ] Category: "Apartment, Penthouse, Condo"
- [ ] Bedrooms: "studio to 3"
- [ ] Bathrooms: "1 to 2.5"

---

### Property Detail Page - Active Property

**Visitare una pagina active:**

#### Single Category
- [ ] Category mostra UNA sola categoria (es: "Villa")

#### Price Display
- [ ] Mostra price principale + conversione (come development)

#### Single Bedrooms/Bathrooms
- [ ] Bedrooms: "4" (numero singolo, non range)
- [ ] Bathrooms: "3.5" (numero singolo, non range)

---

## Security & Validation Testing

### SQL Injection Protection
- [ ] Provare inserire in title: `'; DROP TABLE properties; --`
- [ ] Verificare che viene salvato come testo normale
- [ ] Provare in property_categories: `["apartment' OR '1'='1"]`
- [ ] Verificare errore validazione (invalid category)

### ENUM Validation
- [ ] POST con `price_base_currency: "EUR"` → Expect 400 error
- [ ] POST con `property_category: "villa_invalid"` → Expect 400 error
- [ ] POST con `bedrooms_min: "10"` → Expect 400 error
- [ ] POST con `bathrooms_max: "99"` → Expect 400 error

### Category Validation (Development)
- [ ] POST development con `property_categories: []` → Expect 400 error
- [ ] POST development con `property_categories: ["invalid"]` → Expect 400 error
- [ ] POST development con `property_categories: "apartment"` (string invece di array) → Expect 400 error

### Price Validation
- [ ] POST con `price_base_currency: "MXN"` ma senza `price_mxn` → Verificare errore o fallback
- [ ] POST con `price_base_currency: "USD"` ma senza `price_usd` → Verificare errore o fallback

---

## Performance Testing

### List Properties with Many Developments
- [ ] Creare 20+ developments ciascuno con 3+ categorie
- [ ] `GET /api/properties?property_type=development`
- [ ] Verificare tempo risposta < 1 secondo
- [ ] Verificare query N+1 non presente (1 query property_categories per development)

### Search Performance
- [ ] `GET /api/properties?property_category=apartment` con 100+ properties
- [ ] Verificare tempo < 500ms
- [ ] Verificare INDEX usato (controllare EXPLAIN query)

---

## Edge Cases

### Development without Categories (Legacy)
- [ ] Creare development manualmente in DB senza record in `property_categories`
- [ ] GET by ID → Verificare `property_categories: []`
- [ ] Frontend detail page → Verificare non mostra "Category" se array vuoto

### Property without Price
- [ ] Property con `price_on_demand: true`
- [ ] Verificare frontend mostra "Price on Demand"
- [ ] Non mostra conversione currency

### Bedroom Range "studio to studio"
- [ ] Development con `bedrooms_min: "studio"`, `bedrooms_max: "studio"`
- [ ] Verificare frontend mostra: "studio to studio" o solo "Studio"

---

## Rollback Plan

In caso di errori critici:

```sql
-- Rollback Step 1: Drop triggers
DROP TRIGGER IF EXISTS property_price_before_insert;
DROP TRIGGER IF EXISTS property_price_before_update;

-- Rollback Step 2: Drop new columns
ALTER TABLE properties 
  DROP COLUMN price_base_currency,
  DROP COLUMN price_mxn,
  DROP COLUMN price_from_mxn,
  DROP COLUMN price_to_mxn,
  DROP COLUMN bedrooms_min,
  DROP COLUMN bedrooms_max,
  DROP COLUMN bathrooms_min,
  DROP COLUMN bathrooms_max;

-- Rollback Step 3: Drop categories table
DROP TABLE IF EXISTS property_categories;

-- Rollback Step 4: Restore database backup
-- mysql -u [user] -p [database] < backup_pre_migration.sql
```

---

## Sign-off Checklist

- [ ] Database migration completata senza errori
- [ ] Tutti i test backend API passati
- [ ] Tutti i test admin frontend passati
- [ ] Tutti i test public frontend passati
- [ ] Security testing passato
- [ ] Performance testing accettabile
- [ ] Edge cases gestiti correttamente
- [ ] Rollback plan testato in ambiente staging

**Deployment approved by:** ________________  
**Date:** ________________
