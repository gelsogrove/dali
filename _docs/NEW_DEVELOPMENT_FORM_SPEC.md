# New Development - Form Specifications

## 📋 Requisiti Implementati

Secondo le specifiche fornite, il form per **New Development** ha le seguenti caratteristiche:

### ✅ 1. Exchange Rate
- Campo: `Exchange Rate (1 USD = ? MXN)`
- Input: Numero decimale configurabile dall'utente
- Conversione automatica tra USD ↔ MXN in base al rate

### ✅ 2. Pricing System

#### Per Active Properties:
- **Price USD** o **Price MXN** (singolo valore)
- Base currency selector: USD o MXN
- Conversione automatica tra le due valute

#### Per New Developments:
- **Price Range** obbligatorio
  - `From USD` → `To USD`
  - Conversione automatica in MXN
- **Price Negotiable** (checkbox)
- ⚠️ **Prezzo unico NON obbligatorio** - si usa solo il range

### ✅ 3. Bedrooms & Bathrooms Range

#### Bedrooms Range:
- **From**: 1, 2, 3, 4, 5+ (dropdown)
- **To**: 1, 2, 3, 4, 5+ (dropdown)
- Solo per developments (properties active hanno valore singolo)

#### Bathrooms Range:
- **From**: Min (1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5+)
- **To**: Max (1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5+)
- Solo per developments

### ✅ 4. SQM con Range e Selector Unità

#### Selector Unità di Misura:
```
[  m² (Square Meters)  ] [ sq ft (Square Feet) ]
```
- Toggle tra m² e sq ft
- Conversione automatica: **1 m² = 10.7639 sq ft**

#### Per Active Properties:
- Campo singolo: `SQM` o `SQFT` (in base all'unità selezionata)
- Conversione automatica dell'altro valore

#### Per New Developments:
- **SQM Range** (From / To)
  - Se selector = m²: input `sqm_min` e `sqm_max`
  - Conversione automatica in sq ft (sqft_min, sqft_max)
  - Display: "Range in sq ft (auto-calculated): XX.XX - YY.YY sq ft"
- **SQFT Range** (From / To)
  - Se selector = sq ft: input `sqft_min` e `sqft_max`
  - Conversione automatica in m² (sqm_min, sqm_max)
  - Display: "Range in m² (auto-calculated): XX.XX - YY.YY m²"

### ✅ 5. Altri Campi
- **Lot Size SQM**: Numero decimale (opzionale)
- **Year Built**: Anno (numero intero)
- **Furnishing Status**: Furnished / Semi-Furnished / Unfurnished

## 🗄️ Database Schema

### Tabella `properties`

```sql
-- Campi per Active Properties (valori singoli)
sqm DECIMAL(10,2) NULL COMMENT 'Square meters',
sqft DECIMAL(10,2) NULL COMMENT 'Auto-calculated from sqm',

-- Campi per Developments (range)
sqm_min DECIMAL(10,2) NULL COMMENT 'Minimum sqm for developments',
sqm_max DECIMAL(10,2) NULL COMMENT 'Maximum sqm for developments',
sqft_min DECIMAL(10,2) NULL COMMENT 'Auto-calculated from sqm_min',
sqft_max DECIMAL(10,2) NULL COMMENT 'Auto-calculated from sqm_max',

-- Altri campi size
lot_size_sqm DECIMAL(10,2) NULL,
year_built INT NULL,

-- Bedrooms/Bathrooms range (solo per developments)
bedrooms_min ENUM('studio', '1', '2', '3', '4', '5+') NULL,
bedrooms_max ENUM('studio', '1', '2', '3', '4', '5+') NULL,
bathrooms_min ENUM('1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+') NULL,
bathrooms_max ENUM('1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+') NULL,

-- Pricing
price_from_usd DECIMAL(15,2) NULL,
price_to_usd DECIMAL(15,2) NULL,
price_from_mxn DECIMAL(15,2) NULL,
price_to_mxn DECIMAL(15,2) NULL,
price_negotiable TINYINT(1) DEFAULT 0,
exchange_rate DECIMAL(10,4) NULL DEFAULT 18.50,
```

## 🎨 UI/UX Comportamento

### Toggle Unit Selector
```typescript
// State
const [size_unit, setSizeUnit] = useState<'sqm' | 'sqft'>('sqm');

// Conversione automatica
const convertSqmToSqft = (sqm: number) => sqm * 10.7639;
const convertSqftToSqm = (sqft: number) => sqft / 10.7639;
```

### Form Validation
- ✅ Per developments, il prezzo singolo (price_usd) NON è obbligatorio
- ✅ Price Range (From/To) è utilizzato al suo posto
- ✅ SQM Range obbligatorio per developments
- ✅ Conversione automatica real-time tra unità di misura

### Display Condizionale
```typescript
if (property_type === 'active') {
  // Mostra: bedrooms, bathrooms, sqm (valori singoli)
} else if (property_type === 'development') {
  // Mostra: bedrooms_min/max, bathrooms_min/max, sqm_min/max (range)
}
```

## 📤 API Response Example

```json
{
  "id": 1,
  "property_type": "development",
  "price_from_usd": 150000,
  "price_to_usd": 350000,
  "price_negotiable": true,
  "exchange_rate": 17.5,
  "bedrooms_min": "1",
  "bedrooms_max": "3",
  "bathrooms_min": "1",
  "bathrooms_max": "2",
  "sqm_min": 45.5,
  "sqm_max": 120.8,
  "sqft_min": 489.86,
  "sqft_max": 1300.24,
  "lot_size_sqm": 250.0,
  "year_built": 2025,
  "furnishing_status": "unfurnished"
}
```

## 🚀 Testing

### Testare la conversione automatica:
1. Creare un nuovo development nell'admin
2. Selezionare **m²** come unità
3. Inserire `sqm_min: 50` e `sqm_max: 100`
4. Verificare che vengano auto-calcolati:
   - `sqft_min: 538.20` (50 × 10.7639)
   - `sqft_max: 1076.39` (100 × 10.7639)

### Testare il toggle unità:
1. Passare da **m²** a **sq ft**
2. I valori devono rimanere sincronizzati
3. L'input attivo cambia da sqm → sqft
4. La conversione continua a funzionare

## ✅ Checklist Implementazione

- [x] Database migrazione 015 con nuovi campi
- [x] Admin form con selector unità m²/sq ft
- [x] Conversione automatica real-time
- [x] Range SQM per developments
- [x] Backend API aggiornato
- [x] Validazione condizionale (active vs development)
- [x] Display condizionale nel form
- [x] Documentazione completa

---

**Data implementazione**: 2026-02-07
**Versione database**: 015
**File migrazione**: `database/015_add_sqm_range_for_developments.sql`
