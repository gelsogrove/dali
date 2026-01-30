# ANALISI PROPERTIES - ADMIN SYSTEM

## CONTEXT
come contesto prendi tutto il progetto per capire cosa stiamo facendo


## OVERVIEW
Sistema completo per la gestione di proprietà immobiliari con supporto per due tipologie:
1. **Ready Properties** - Proprietà pronte per la consegna
2. **New Developments** - Proprietà in prevendita

---

## ARCHITETTURA DATABASE

### Tabella: `properties`

#### CAMPI COMUNI (Ready Properties & New Developments)

| Campo | Tipo DB | UI Input Type | Note |
|-------|---------|---------------|------|
| `id` | INT AUTO_INCREMENT | - | Primary Key |
| `property_type` | ENUM | **Select** | 'active', 'development' |
| `property_id_reference` | VARCHAR(50) | **Text Input** (disabled dopo creazione) | Identificatore univoco interno (es: PROP-2026-001) - Auto-generato |
| `title` | VARCHAR(255) | **Text Input** | Titolo della proprietà * Required |
| `subtitle` | VARCHAR(255) | **Text Input** | Sottotitolo (opzionale) |
| `status` | ENUM | **Select** | 'for_sale', 'sold', 'reserved' |
| `description` | TEXT | **Textarea** (3-4 rows) | Descrizione breve per preview |
| `content` | LONGTEXT | **WYSIWYG Editor (Trix)** | Contenuto completo (come blog) |
| `slug` | VARCHAR(255) | **Text Input** (auto-generato, disabled dopo creazione) | URL-friendly, generato da title |
| `seo_title` | VARCHAR(160) | **Text Input** (maxlength 160) | SEO - Title tag <title> * Required |
| `seo_description` | TEXT | **Textarea** (maxlength 320, rows 3) | SEO - Meta description * Required |
| `og_title` | VARCHAR(160) | **Text Input** (maxlength 160) | SEO - OG Title * Required |
| `og_description` | TEXT | **Textarea** (maxlength 320, rows 3) | SEO - OG Description * Required |
| `created_at` | TIMESTAMP | - | Data creazione (auto) |
| `updated_at` | TIMESTAMP | - | Data ultima modifica (auto) |
| `is_active` | BOOLEAN | **Switch/Toggle** | Attivo/Disattivo (pubblicato) * Default: false |
| `order` | INT | **Number Input** | Ordine visualizzazione * Default: 0 |
| `tags` | TEXT (JSON) | **Tag Picker** | Array di tags: ["Pool", "Gym", "24/7 Security"] - Amenità e features |

#### CAMPI PREZZO

| Campo | Tipo DB | UI Input Type | Note |
|-------|---------|---------------|------|
| `price_usd` | DECIMAL(15,2) | **Number Input** | Prezzo in USD (campo principale) - NULL se price_on_demand |
| `price_mxn` | DECIMAL(15,2) | **Number Input (read-only)** | Prezzo in MXN (calcolato automaticamente) |
| `price_from_usd` | DECIMAL(15,2) | **Number Input** | Per developments - prezzo minimo |
| `price_to_usd` | DECIMAL(15,2) | **Number Input** | Per developments - prezzo massimo |
| `price_on_demand` | BOOLEAN | **Checkbox** | Mostra "Price on Demand" invece del prezzo * Default: false
|-------|---------|---------------|------|
| `price_usd` | DECIMAL(15,2) | **Number input** | Prezzo in USD (campo principale) |
| `price_mxn` | DECIMAL(15,2) | **Number input (read-only)** | Prezzo in MXN (calcolato automaticamente) |
| `price_from_usd` | DECIMAL(15,2) | **Number input** | Per developments - prezzo minimo |
| `price_to_usd` | DECIMAL(15,2) | **Number input** | Per developments - prezzo massimo |
| `exchange_rate` | DECIMAL(10,4) | - | Tasso di cambio USD/MXN salvato (auto) |
| `price_negotiable` | BOOLEAN | **Checkbox** | Se il prezzo è trattabile |

#### CAMPI CARATTERISTICHE FISICHE

| Campo | Tipo DB | UI Input Type | Note |
|-------|---------|----Select** | Numero camere da letto (0-5+) |
| `bathrooms` | DECIMAL(3,1) | **Select** | Numero bagni (1, 1.5, 2, 2.5, 3, 3.5, 4, 4+) |
| `sqm` | DECIMAL(10,2) | **Number Input** | Superficie in metri quadrati * Required |
| `sqft` | DECIMAL(10,2) | **Number Input (read-only)** | Superficie in piedi quadrati (calcolato auto) |
| `unit_typology` | VARCHAR(255) | **Text Inpud-only)** | Superficie in piedi quadrati (calcolato) |
| `unit_typology` | VARCHAR(255) | **Input text** | Per developments: tipi di unità disponibili (es: "1BR, 2BR, 3BR") |

#### CAMPI TIPOLOGIA

| Campo | Tipo DB | UI Input Type | Note |
|-------|---------|--------------Select** | 'apartment', 'house', 'villa', 'penthouse', 'loft', 'studio', 'land' * Required |
| `furnishing_status` | ENUM | **Select** | 'apartment', 'house', 'villa', 'penthouse', 'loft', 'studio', 'land' |
| `furnishing_status` | ENUM | **Dropdown** | 'furnished', 'semi_furnished', 'unfurnished', 'not_applicable' |

#### CAMPI LOCALIZZAZIONE

| Campo | Tipo DB | UI Input Type | Note |
|-------|---------|---------------|-Text Input** | Quartiere/Zona * Required |
| `city` | VARCHAR(100) | **Select** | Città (lista predefinita + "Other") * Required |
| `country` | VARCHAR(100) | **Select** | Paese (default: Mexico) * Required |
| `address` | VARCHAR(255) | **Text Input** | Indirizzo completo (opzionale) |
| `latitude` | DECIMAL(10,8) | **Number Input (auto)** | Coordinate GPS - OBBLIGATORIO per embedding mappa |
| `longitude` | DECIMAL(11,8) | **Number Input (auto)** | Coordinate GPS - OBBLIGATORIO per embedding mappa |
| `google_maps_url` | TEXT | **Textarea** (rows 2)** | Coordinate GPS - OBBLIGATORIO per embedding mappa |
| `google_maps_url` | TEXT | **Textarea** (1-2 righe) | Link esterno a Google Maps (opzionale) |

#### CAMPI VISIBILITÀ & PRIORITÀ

| Campo | Tipo DB | UI Input Type | Note |
|--is_active` | BOOLEAN | **Switch/Toggle** | Attivo/Pubblicato (default: false) |
| `featured` | BOOLEAN | **Switch/Toggle** | Proprietà in evidenza |
| `order` | INT | **Number Ile/Checkbox** | Proprietà in evidenza |
| `priority` | INT | **Number input** | Ordine visualizzazione (default: 0) |
| `views_count` | INT | **Number (read-only)** | Contatore visualizzazioni (auto) |

---

### Tabella: `property_photos`

| Campo | Tipo | Note |
|-------|------|------|
| `id` | INT AUTO_INCREMENT | Primary Key |
| `property_id` | INT | Foreign Key → properties.id |
| `filename` | VARCHAR(255) | Nome file immagine |
| `path` | VARCHAR(500) | Path completo |
| `is_cover` | BOOLEAN | Immagine di copertina |
| `order` | INT | Ordine visualizzazione |
| `alt_text` | VARCHAR(255) | Testo alternativo SEO |
| `uploaded_at` | TIMESTAMP | Data upload |

**Note:** Sistema simile al blog ma supporta multiple immagini con ordinamento.

---

## TAGS / FEATURES / AMENITÀ

**APPROCCIO SEMPLIFICATO CON TAGS JSON** ✅

**Sistema:** Invece di tabelle many-to-many (features + property_features), usiamo un campo **JSON** nella tabella `properties`.

### Perché Tags JSON?
- ✅ **Più semplice**: No tabelle extra, no JOIN
- ✅ **Search veloce**: MySQL JSON_CONTAINS() è performante
- ✅ **Flessibile**: Admin può aggiungere tag custom oltre alla lista predefinita
- ✅ **Frontend facile**: Filtro con array.includes()

### Come funziona:

**1. Database:**
```sql
ALTER TABLE properties ADD COLUMN tags TEXT; -- Stored as JSON array
```

**Esempio valore:**
```json
["Pool", "Gym", "24/7 Security", "Parking", "Ocean View", "Pet Friendly", "Rooftop Pool"]
```

**2. Admin UI (TAB 5):**
- Tag Picker component (come GitHub labels)
- Lista predefinita con autocomplete
- Possibilità di aggiungere tag custom
- Chips removibili

**3. Frontend Search:**
```sql
-- Search properties con Pool E Gym
WHERE JSON_CONTAINS(tags, '"Pool"') 
  AND JSON_CONTAINS(tags, '"Gym"')

-- O con JSON_OVERLAPS (MySQL 8.0.17+)
WHERE JSON_OVERLAPS(tags, '["Pool", "Gym"]')
```

**4. PHP API:**
```php
// Salva tags
$tags = json_encode($tagsArray);
$stmt->bind_param('s', $tags);

// Leggi tags
$tags = json_decode($row['tags'], true);
```

---

### Lista Tags Predefiniti (per autocomplete):

**Lista completa tags (60+) organizzata per riferimento:**

**Essential:**
Central Air Conditioning, Elevator, Laundry Area, Fireplace, Storage, Basement, Lobby

**Outdoor:**
Terrace, Balcony, Rooftop, Solarium, Garden, Zen Area, Hammock Area, Jungle Bar

**Parking:**
Parking, Garage, Underground Parking, Bike Parking, Motor Lobby, Electric Bicycles, Free Beach Shuttle

**Security:**
24/7 Security, Controlled Access, CCTV, Perimeter Fence, Concierge 24/7

**Pools & Water:**
Pool, Rooftop Pool, Beach-like Pool, Private Beach Club, Waterfront Access, Beach Access

**Wellness:**
Spa, Sauna, Steam Room, Lockers, Temazcal, Yoga Studio, Meditation Room

**Fitness:**
Gym, Jogging Track, Paddle Court, Pickleball Court, Tennis Court, Mini-golf, Pet Park

**Community:**
Club House, Lounge, Cinema, Bar, Pub, Kids Playroom, Playground, Restaurant, Coffee Shop, Organic Market, Food Pavilion

**Work:**
Co-working Space, Business Lounge

**Sustainability:**
Solar Panels, Rainwater Collection, Water Treatment, Eco-Friendly

**Views:**
Golf View, Ocean View, City View, Mountain View, Lake View, Jungle View

**Altri tags comuni:**
Pet Friendly, Furnished, Smart Home, Newly Renovated, Investment Opportunity, Beachfront, Gated Community, Walk to Beach

---

## CAMPI CON DROPDOWN/SELECT (Tendine)

### 1. **Property Type** (Tipo Proprietà)
Posizione: Sezione principale - Informazioni Base
```
Opzioni:
- Active Property (Proprietà pronta/attiva)
- New Development (Prevendita/Sviluppo nuovo)
```

### 2. **Status** (Stato Vendita)
Posizione: Sezione principale - Informazioni Base
```
Opzioni:
- For Sale (In vendita)
- Sold (Venduta)
- Reserved (Riservata)
```

### 3. **Property Category** (Categoria Immobile)
Posizione: Sezione Caratteristiche
```
Opzioni:
- Apartment (Appartamento)
- House (Casa)
- Villa
- Penthouse (Attico)
- Loft
- Studio
- Land (Terreno)
```

### 4. **Furnishing Status** (Stato Arredamento)
Posizione: Sezione Caratteristiche
```
Opzioni:
- Furnished (Arredato)
- Semi-furnished (Semi-arredato)
- Unfurnished (Non arredato)
- Not Applicable (Non applicabile - per terreni)
```

### 5. **City** (Città)
Posizione: Sezione Localizzazione
```
Opzioni principali:
- Playa del Carmen
- Tulum
- Cancún
- Puerto Morelos
- Akumal
- Puerto Aventuras
- Bacalar
- Mérida
- Other (campo text se selezionato)
```

### 6. **Country** (Paese)
Posizione: Sezione Localizzazione
```
Opzioni:
- Mexico (default)
- United States
- Canada
- Italy
- Other
```

### 7. **Bedrooms** (Camere da Letto)
Opzione: Può essere dropdown O number input
```
Opzioni dropdown:
- Studio (0)
- 1
- 2
- 3
- 4
- 5+
```

### 8. **Bathrooms** (Bagni)
Opzione: Può essere dropdown O number input
```
Opzioni dropdown:
- 1
- 1.5
- 2
- 2.5
- 3
- 3.5
- 4
- 4+
```

### 9. **Currency Display** (Conversione Valuta)
Posizione: Sezione Prezzo (lato display)
```
Toggle/Dropdown:
- USD (default)
- MXN
```

### 10. **Unit Display** (Conversione Unità)
Posizione: Sezione Caratteristiche (lato display)
```
Toggle/Dropdown:
- m² (default)
- sq ft
```

### 11. **Published** (Stato Pubblicazione)
Posizione: Sezione Visibilità
```
Opzioni:
- Draft (Bozza)
- Published (Pubblicato)
```

### 12. **Featured** (In Evidenza)
Posizione: Sezione Visibilità
```
Toggle/Checkbox:
- Yes
- No
```

---

## VALIDAZIONI

### Client-Side (React Form)

**Campi Obbligatori (*):**
- title: min 3 caratteri, max 255
- property_type: required (select)
- status: required (select)
- property_category: required (select)
- neighborhood: min 2 caratteri
- city: required (select)
- country: required (select)
- sqm: required, number > 0
- bedrooms: required (select)
- bathrooms: required (select)
- seo_title: required, maxLength 160
- seo_description: required, maxLength 320
- og_title: required, maxLength 160
- og_description: required, maxLength 320

**Validazione Prezzo:**
- Se price_on_demand = false → price_usd required
- Se price_on_demand = true → price_usd può essere NULL
- Per developments: price_from_usd < price_to_usd

**Validazione Coordinate:**
- latitude e longitude OBBLIGATORI per save
- Validare range: lat (-90, 90), lng (-180, 180)

**Validazione Immagini:**
- Alt text obbligatorio per ogni immagine
- Almeno 1 immagine con is_cover = true
- Max 20 immagini
- File type: image/jpeg, image/jpg, image/png, image/webp
- Max size: 10MB per immagine

**Validazione Slug:**
- Formato: lowercase, hyphens, no spaces
- Unicità (check backend)
- Auto-generato da title se vuoto

**Validazione Tags:**
- Array di stringhe
- Max 20 tags
- Ogni tag: min 2 caratteri, max 50
- No duplicati nell'array
- Trim whitespace

**Validazione Tags:**
- Array di stringhe
- Max 20 tags
- Ogni tag: min 2 caratteri, max 50
- No duplicati nell'array
- Trim whitespace

### Server-Side (PHP API)

**Backend Validation (PHP):**
```php
// Validazioni richieste
- title: required, string, max:255
- property_type: required, in:active,development
- status: required, in:for_sale,sold,reserved
- property_category: required, in:apartment,house,villa,penthouse,loft,studio,land
- neighborhood: required, string, max:255
- city: required, string, max:100
- country: required, string, max:100
- sqm: required, numeric, min:0
- bedrooms: required, integer, min:0
- bathrooms: required, numeric, min:0
- latitude: required, numeric, between:-90,90
- longitude: required, numeric, between:-180,180
- seo_title: required, string, max:160
- seo_description: required, string, max:320
- og_title: required, string, max:160
- og_description: required, string, max:320
- slug: required, string, max:255, unique:properties,slug
- price_on_demand: boolean
- price_usd: required_if:price_on_demand,false|numeric|min:0
- tags: json, array, max:20 items
```

**Sanitizzazione:**
- HTML purifier per content (WYSIWYG)
- strip_tags per text inputs
- Validare coordinate numeriche
- Validare ENUM values
- Tags: json_encode(), validare array, trim ogni tag, rimuovi duplicati
- Tags: json_encode(), validare array, trim ogni tag, rimuovi duplicati

**Upload Immagini:**
- Validare mime type: image/jpeg, image/jpg, image/png, image/webp
- Max size: 10MB
- Resize/compress se necessario
- Generate thumbnails (300x200)
- Sanitize filename

**SQL Injection Prevention:**
- PDO prepared statements
- Bind parameters
- No raw SQL

---

## RIEPILOGO TIPI DI INPUT (UI)

### 📝 **Text Input** (single-line input)
Usa il componente: `<Input />` (da `@/components/ui/input`)
- Title *
- Subtitle
- Property ID/Reference (disabled dopo creazione)
- Slug (disabled dopo creazione, auto-generato)
- SEO Title * (maxLength={160})
- OG Title * (maxLength={160})
- Neighborhood *
- Address
- Unit Typology

### 📄 **Textarea** (multi-line textarea)
Usa il componente: `<Textarea />` (da `@/components/ui/textarea`)
- Description (rows={3-4}) - Descrizione breve
- SEO Description * (rows={3}, maxLength={320})
- OG Description * (rows={3}, maxLength={320})
- Google Maps URL (rows={2})

### 📝 **WYSIWYG Editor** (editor ricco)
Usa il componente: `<TrixEditor />` (da `@/components/TrixEditor`)
- Content * - Contenuto completo come blog

### 🎯 **Select/Dropdown**
Usa il componente: `<Select />` (da `@/components/ui/select`)
- Property Type * (Active Property / New Development)
- Status * (For Sale / Sold / Reserved)
- Property Category * (Apartment / House / Villa / Penthouse / Loft / Studio / Land)
- Furnishing Status (Furnished / Semi-furnished / Unfurnished / Not Applicable)
- City * (Lista predefinita: Playa del Carmen, Tulum, Cancún, etc. + "Other")
- Country * (Mexico / United States / Canada / Italy / Other)
- Bedrooms * (Studio/0, 1, 2, 3, 4, 5+)
- Bathrooms * (1, 1.5, 2, 2.5, 3, 3.5, 4, 4+)

### 🔢 **Number Input**
Usa il componente: `<Input type="number" />` con validazione
- Price USD (step={0.01}, min={0})
- Price From USD (per developments)
- Price To USD (per developments)
- SQM * (step={0.01}, min={0})
- Order (default={0})
- Latitude (auto-popolato, step={0.00000001})
- Longitude (auto-popolato, step={0.00000001})

### 🔢 **Number Input Read-Only** (calcolato automaticamente)
Usa: `<Input type="number" disabled />` o display text
- Price MXN (calcolato da USD)
- SQFT (calcolato da SQM)
- Views Count

### ✅ **Checkbox**
Usa il componente: `<Checkbox />` (da `@/components/ui/checkbox`)
- Price on Demand (se true, price_usd può essere NULL)
- Price Negotiable

### 🔘 **Switch/Toggle**
Usa il componente: `<Switch />` (da `@/components/ui/switch`)
- is_active * (Publish property - default: false)
- featured (Featured property - default: false)

### 🎨 **Special Components**

#### 📷 **Photo Upload Multiple** (Drag & Drop)
Sistema custom con:
- Drag & Drop zone (border-dashed, hover effect)
- Input file multiple: `<input type="file" accept="image/*" multiple />`
- Upload API: POST `/api/properties/:id/photos`
- Preview grid con thumbnails
- Drag & Drop per riordinare (react-beautiful-dnd o @dnd-kit/core)
- Alt text input per ogni immagine
- Radio "Set as Cover" per ogni immagine (is_cover)
- Button "Remove" per ogni immagine

#### 🗺️ **Google Maps Interactive**
Sistema custom con:
- Input "Search Address" + Button "Geocode"
- Google Maps JavaScript API
- Marker draggable
- Events: onMarkerDragEnd → aggiorna lat/lng
- Geocoding API per address → coordinates
- Preview mappa embedded

#### 🏷️ **Tag Picker** (per Tags/Amenities)
Sistema custom con:
- Combobox/Autocomplete (react-select o shadcn Combobox)
- Search input con lista predefinita (60+ tags)
- Badge chips per tag selezionati (removibili)
- Accordion per quick select per categoria
- Validazione: no duplicati, max 20 tags
- Storage: JSON array `["Pool", "Gym", "Security"]`

**Librerie consigliate:**
- `@radix-ui/react-select` (già in shadcn)
- `react-select` (alternativa)
- Custom con `<Combobox />` da shadcn/ui

#### 🔄 **Currency/Unit Toggle**
Sistema custom display-only (non form field):
- Toggle USD ↔ MXN (visualizzazione)
- Toggle m² ↔ sq ft (visualizzazione)

#### 🏷️ **Tag Picker** (per Tags/Amenities)
Sistema custom con:
- Combobox/Autocomplete (react-select o shadcn Combobox)
- Search input con lista predefinita (60+ tags)
- Badge chips per tag selezionati (removibili)
- Accordion per quick select per categoria
- Validazione: no duplicati, max 20 tags
- Storage: JSON array `["Pool", "Gym", "Security"]`

**Librerie consigliate:**
- `@radix-ui/react-select` (già in shadcn)
- `react-select` (alternativa)
- Custom con `<Combobox />` da shadcn/ui

---

## CATEGORIE FEATURES / AMENITÀ

**IMPORTANTE:** Parking, Pool, e tutte le altre amenità sono gestite tramite il sistema **Features** (checkbox).
NON sono campi diretti nel database `properties`, ma relazioni many-to-many tramite la tabella `property_features`.

**Come funziona:**
- Nel form EDIT c'è una sezione "Features/Amenità" con checkbox organizzate per categoria
- L'admin seleziona tutte le features che la proprietà ha (es: Parking, Pool, Gym, etc.)
- Nel frontend si possono filtrare le proprietà per features (es: "Mostrami solo proprietà con Pool")

### Lista Completa Features (da popolare nel database `features`):

**Lista completa tags (60+) organizzata per riferimento:**

**Essential:**
Central Air Conditioning, Elevator, Laundry Area, Fireplace, Storage, Basement, Lobby

**Outdoor:**
Terrace, Balcony, Rooftop, Solarium, Garden, Zen Area, Hammock Area, Jungle Bar

**Parking:**
Parking, Garage, Underground Parking, Bike Parking, Motor Lobby, Electric Bicycles, Free Beach Shuttle

**Security:**
24/7 Security, Controlled Access, CCTV, Perimeter Fence, Concierge 24/7

**Pools & Water:**
Pool, Rooftop Pool, Beach-like Pool, Private Beach Club, Waterfront Access, Beach Access

**Wellness:**
Spa, Sauna, Steam Room, Lockers, Temazcal, Yoga Studio, Meditation Room

**Fitness:**
Gym, Jogging Track, Paddle Court, Pickleball Court, Tennis Court, Mini-golf, Pet Park

**Community:**
Club House, Lounge, Cinema, Bar, Pub, Kids Playroom, Playground, Restaurant, Coffee Shop, Organic Market, Food Pavilion

**Work:**
Co-working Space, Business Lounge

**Sustainability:**
Solar Panels, Rainwater Collection, Water Treatment, Eco-Friendly

**Views:**
Golf View, Ocean View, City View, Mountain View, Lake View, Jungle View

**Altri tags comuni:**
Pet Friendly, Furnished, Smart Home, Newly Renovated, Investment Opportunity, Beachfront, Gated Community, Walk to Beach

---

## FUNZIONALITÀ ADMIN

### 1. INSERT (Inserimento Rapido)

**Strategia:** Form semplice con SOLO campi essenziali. Le foto e features si aggiungono SOLO in EDIT.

**Campi nel form di INSERT:**

#### Tab 1: Informazioni Base
- Title * (Text Input)
- Subtitle (Text Input - opzionale)
- Property Type * (Select: Active Property / New Development)
- Status * (Select: For Sale / Sold / Reserved)
- Property Category * (Select: Apartment / House / Villa / etc.)

#### Tab 2: Prezzo & Caratteristiche
- Price USD (Number Input) - OR -
- Price on Demand (Checkbox)
- Bedrooms * (Select: Studio/1/2/3/4/5+)
- Bathrooms * (Select: 1/1.5/2/2.5/3/3.5/4/4+)
- SQM * (Number Input)

#### Tab 3: Localizzazione
- Neighborhood * (Text Input)
- City * (Select dropdown)
- Country * (Select dropdown, default: Mexico)

**Campi auto-generati:**
- Property ID Reference (auto: PROP-2026-XXX)
- Slug (auto da title)
- created_at, updated_at

**Campi di default:**
- is_active: false
- order: 0
- featured: false

**Button:** "Create Property" → Salva e reindirizza alla pagina EDIT

---

### 2. EDIT (Modifica Completa CON TAB)

**Strategia:** Form organizzato in **TAB** per separare le sezioni logicamente.

#### TAB 1: 📝 Informazioni Base

**Sezione A: Dati Principali**
- Title * (Text Input)
- Subtitle (Text Input)
- Property ID/Reference (Text Input - disabled)
- Property Type * (Select: Active Property / New Development)
- Status * (Select: For Sale / Sold / Reserved)
- Property Category * (Select)
- Description (Textarea, 3-4 rows) - Descrizione breve per preview
- Content * (WYSIWYG Editor Trix) - Contenuto completo

**Sezione B: Visibilità**
- is_active (Switch/Toggle) - "Publish property"
- featured (Switch/Toggle) - "Featured property"
- order (Number Input) - "Display order"

---

#### TAB 2: 💰 Prezzo & Caratteristiche

**Sezione A: Prezzo**
- Price on Demand (Checkbox) - Se true, nasconde i campi prezzo
- Price USD (Number Input) - Se property_type = "active"
- Price From USD → Price To USD (Number Input range) - Se property_type = "development"
- Price MXN (Number Input read-only) - Conversione automatica
- Currency Toggle (USD ↔ MXN) - Solo visualizzazione
- Price Negotiable (Checkbox)
- Tasso cambio corrente (Display info)

**Sezione B: Caratteristiche Fisiche**
- Bedrooms * (Select)
- Bathrooms * (Select)
- SQM * (Number Input) → Auto-calcola SQFT
- Unit Display Toggle (m² ↔ sq ft) - Solo visualizzazione
- Furnishing Status (Select)
- Unit Typology (Text Input) - Solo per developments

---

#### TAB 3: 📍 Localizzazione

**Sezione A: Indirizzo**
- Neighborhood * (Text Input)
- City * (Select con lista + "Other")
- Country * (Select, default: Mexico)
- Address (Text Input - opzionale)

**Sezione B: Mappa**
- Google Maps URL (Textarea, 2 rows - opzionale)
- Latitude * (Number Input - auto-popolato)
- Longitude * (Number Input - auto-popolato)
- **Mappa Interattiva:**
  - Campo "Search Address" → Button "Geocode" (chiama API)
  - Mappa Google Maps con marker draggable
  - Aggiorna lat/lng quando marker viene spostato
- **Preview Mappa Embedded** (come apparirà nel frontend)

---

#### TAB 4: 🖼️ Gallery

**Sistema Upload Multiplo (come blog ma array):**

**Drag & Drop Zone:**
- Border dashed
- Icon Upload
- "Drag images here or click to upload"
- "Recommended: 1920x1080, max 10MB per image"
- Input file multiplo (accept="image/*" multiple)
- Progress bar durante upload

**Grid Immagini:**
- Layout grid 3-4 colonne
- Ogni card mostra:
  - Thumbnail preview (300x200)
  - Alt text input (sotto immagine)
  - "Set as Cover" button/radio (solo una può essere cover)
  - "Remove" button (X icon top-right)
  - Drag handle icon (per riordinare)
- **Drag & Drop per riordinare** (libreria: react-beautiful-dnd o dnd-kit)
- Display "X of Y images"

**Validazioni:**
- Max 20 immagini
- Tipo file: jpg, jpeg, png, webp
- Max size: 10MB per immagine
- Alt text obbligatorio per ogni immagine

---

#### TAB 5: 🏷️ Tags (Amenità & Features)

**Tag Picker Component** (stile GitHub labels o React-Select)

**UI Layout:**

**A. Selected Tags (Top)**
- Area con chips dei tag selezionati
- Ogni chip:
  - Nome tag
  - X button per rimuovere
  - Colore badge (optional)
- Display count: "8 tags selected"

**B. Add Tags**
- Search input con autocomplete
  - Placeholder: "Search or add tag..."
  - Autocomplete da lista predefinita (60+ tags)
  - Highlight match durante digitazione
- Button "Add Custom Tag" (se non trova match)

**C. Quick Select - Categorie Collapse**
Accordion con categorie comuni (opzionale per selezione rapida):
- 🏊 Pools & Water (Pool, Rooftop Pool, Beach Access, etc.)
- 🏋️ Fitness (Gym, Jogging Track, Sports Courts)
- 🔒 Security (24/7 Security, CCTV, Controlled Access)
- 🅿️ Parking (Parking, Garage, Underground)
- 🌅 Views (Ocean View, Mountain View, City View)
- 🏡 Amenities (Restaurant, Cinema, Spa, etc.)

Ogni categoria mostra badge pills cliccabili per aggiunta rapida

**Funzionalità:**
- Click su badge → aggiunge tag
- Duplicati non ammessi (già presente = disabled)
- Drag & drop per riordinare (opzionale)
- "Clear all" button
- Validazione: max 20 tags

**Componente React Esempio:**
```jsx
// Libreria consigliata: react-select o custom con Combobox
import { Badge } from '@/components/ui/badge'

<div className="space-y-4">
  {/* Selected Tags */}
  <div className="flex flex-wrap gap-2">
    {tags.map(tag => (
      <Badge key={tag} variant="secondary" className="gap-1">
        {tag}
        <X onClick={() => removeTag(tag)} className="h-3 w-3 cursor-pointer" />
      </Badge>
    ))}
  </div>
  
  {/* Search/Add */}
  <Combobox
    placeholder="Search or add tag..."
    options={PREDEFINED_TAGS}
    onSelect={addTag}
  />
  
  {/* Quick categories */}
  <Accordion type="single" collapsible>
    <AccordionItem value="pools">
      <AccordionTrigger>🏊 Pools & Water</AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-wrap gap-2">
          {POOL_TAGS.map(tag => (
            <Badge 
              key={tag} 
              variant="outline" 
              className="cursor-pointer"
              onClick={() => addTag(tag)}
            >
              + {tag}
            </Badge>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>
```

---

#### TAB 6: 🔍 SEO

**Sezione A: URL**
- Slug (Text Input - disabled dopo creazione, auto-generato da title)

**Sezione B: Meta Tags (Required)**
- SEO Title * (Text Input, maxlength 160)
  - Character counter: "60/160"
- SEO Description * (Textarea, rows 3, maxlength 320)
  - Character counter: "150/320"
- OG Title * (Text Input, maxlength 160)
- OG Description * (Textarea, rows 3, maxlength 320)

**Sezione C: Preview**
- Google Search Result Preview (come appare su Google)
- Social Media Preview (OG tags)

---

### Actions Bar (sempre visibile in fondo)
- Button "Save Property" (primary)
- Button "Cancel" (secondary outline)
- Button "Preview" (apre in new tab - se is_active=true)
- **Button "Export as JSON"** 📥 (copia tutto il JSON della property per backup/duplicazione)

**Note:** Auto-save draft ogni 30 secondi (opzionale)

---

### 3. LIST (Lista Proprietà)

**Colonne visualizzate:**
- Thumbnail (foto copertina)
- Property ID
- Title
- Status (badge colorato)
- Property Type (badge)
- Price USD
- Bedrooms / Bathrooms
- City
- Featured (star icon)
- Published (eye icon)
- Actions (Edit, Delete, Duplicate, Preview, **Export JSON** 📥)

**Funzionalità:**
- Paginazione (20 items per pagina)
- Ordinamento per colonna
- **Button "New Property"** (apre form INSERT manuale)
- **Button "Add with JSON"** 🚀 (apre modal/page per import JSON)
**Filtri rapidi (dropdown):**
  - Status (All, For Sale, Sold, Reserved)
  - Property Type (All, Active Property, New Development)
  - Property Category (All, Apartment, House, Villa, etc.)
  - City (All, + lista città)
  - Featured (All, Yes, No)
  - Published (All, Yes, No)
- Search box (cerca in: title, property_id, neighborhood, city)
- Bulk actions:
  - Publish/Unpublish
  - Delete multiple
  - Change status

---

### 4. SEARCH (Ricerca Avanzata)

**Filtri disponibili:**
- Text search (title, description, property_id)
- Status (dropdown)
- Property Type (dropdown)
- Property Category (dropdown)
- Price range (USD) (slider o input min/max)
- Bedrooms (dropdown min/max)
- Bathrooms (dropdown min/max)
- SQM range (slider o input min/max)
- City (dropdown multi-select)
- Neighborhood (autocomplete)
- **Tags** (multi-select con checkbox - es: Pool, Gym, Security)
- Date range (created_at)

**Query Tags (MySQL):**
```sql
-- Search properties con Pool AND Gym
WHERE JSON_CONTAINS(tags, '"Pool"') 
  AND JSON_CONTAINS(tags, '"Gym"')

-- Search properties con almeno uno tra [Pool, Gym, Spa]
WHERE JSON_OVERLAPS(tags, '["Pool", "Gym", "Spa"]')
```

**Risultati:**
- Stessa vista della LIST
- "Clear filters" button
- Export results (CSV)

---

## API ENDPOINTS

### Properties

```
GET    /api/properties                 # Lista (con paginazione e filtri)
GET    /api/properties/:id             # Dettaglio singola
POST   /api/properties                 # Crea nuova
POST   /api/properties/import-json     # Import da JSON (bulk/migrazione) 🚀 NUOVO
GET    /api/properties/:id/export-json # Export property come JSON 📥 NUOVO
PUT    /api/properties/:id             # Aggiorna
DELETE /api/properties/:id             # Elimina
POST   /api/properties/:id/duplicate   # Duplica proprietà
```

### Photos

```
POST   /api/properties/:id/photos      # Upload foto
PUT    /api/properties/:id/photos/:photoId  # Aggiorna (ordine, alt, cover)
DELETE /api/properties/:id/photos/:photoId  # Elimina foto
POST   /api/properties/:id/photos/reorder   # Riordina tutte
```

### Tags

```
GET    /api/tags/predefined            # Lista tags predefiniti (per autocomplete)
GET    /api/tags/popular               # Tags più usati (con count)
GET    /api/tags/suggestions           # Suggerimenti basati su property_category
```

**Note:** I tags sono salvati direttamente nella tabella `properties` come JSON array.
No CRUD separato necessario - si gestiscono durante save/update property.

### Utility

```
GET    /api/exchange-rate              # Tasso cambio USD/MXN aggiornato
POST   /api/convert-currency           # Conversione manuale
POST   /api/convert-units              # Conversione SQM/SQFT
POST   /api/geocode                    # Da indirizzo a coordinate
```

---

## SICUREZZA

### 1. Autenticazione
- Tutti gli endpoints properties richiedono JWT token valido
- Solo utenti con ruolo `admin` possono accedere

### 2. Validazione Input
- Sanitizzazione di tutti i campi text/HTML
- Validazione tipi numerici (price, sqm, coordinates)
- Validazione ENUM values
- Slug validation e unicità
- Property ID reference unicità

### 3. Upload Immagini
- Validation tipo file (jpg, jpeg, png, webp)
- Max file size: 10MB per immagine
- Resize automatico (mantenere qualità)
- Generazione thumbnail
- Nomi file sanitizzati
- Storage in directory protetta

### 4. Rate Limiting
- Max 100 requests per minuto per utente
- Max 20 upload foto in 5 minuti

### 5. CSRF Protection
- Token CSRF per tutte le operazioni POST/PUT/DELETE

### 6. SQL Injection Prevention
- Prepared statements
- PDO con parametri bound

---

## CONVERSIONI AUTOMATICHE

### 1. Prezzo USD → MXN
```php
// Al salvataggio e in real-time nel form
$exchangeRate = getLatestExchangeRate(); // API esterna
$price_mxn = $price_usd * $exchangeRate;
```

**Fonte tasso cambio:** API Banco de México o exchangerate-api.com

### 2. SQM → SQFT
```php
$sqft = $sqm * 10.7639;
```

### 3. Slug Auto-generation
```php
$slug = generateSlug($title); // lowercase, hyphens, unique
```

### 4. Property ID Auto-generation
```php
// Formato: PROP-YYYY-XXX
$propertyId = 'PROP-' . date('Y') . '-' . str_pad($sequenceNumber, 3, '0', STR_PAD_LEFT);
```

---

## EMBEDDING MAPPA GOOGLE MAPS

### Come funziona:

**1. Nel Database:**
- `latitude` e `longitude` sono i campi **obbligatori** per l'embedding
- `google_maps_url` è opzionale, serve solo come link esterno "Vedi su Google Maps"

**2. Nel Form Admin:**
- L'admin inserisce l'indirizzo o seleziona un punto sulla mappa interattiva
- Tramite **Google Maps Geocoding API** si ottengono automaticamente le coordinate (lat/lng)
- Le coordinate vengono salvate nei campi `latitude` e `longitude`
- Opzionalmente si può generare anche il `google_maps_url`

**3. Nel Frontend Pubblico:**
- Si usa `latitude` e `longitude` per creare l'embedding della mappa
- Due opzioni:
  - **Google Maps Embed API:** iframe con mappa interattiva
  - **Static Map API:** immagine statica della mappa

### Esempio Embedding (Frontend):

**Opzione 1: Mappa Interattiva (Iframe)**
```html
<iframe
  width="600"
  height="450"
  style="border:0"
  loading="lazy"
  src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q={latitude},{longitude}&zoom=15">
</iframe>
```

**Opzione 2: Mappa Statica (Immagine)**
```html
<img
  src="https://maps.googleapis.com/maps/api/staticmap?center={latitude},{longitude}&zoom=15&size=600x400&markers=color:red%7C{latitude},{longitude}&key=YOUR_API_KEY"
  alt="Property location map"
/>
```

**Opzione 3: Link Esterno (se presente google_maps_url)**
```html
<a href="{google_maps_url}" target="_blank" rel="noopener">
  Apri in Google Maps
</a>
```

### Cosa serve:
- **Google Maps JavaScript API** (per mappa interattiva in admin)
- **Geocoding API** (per convertire indirizzo → coordinate)
- **Embed API o Static Maps API** (per visualizzare mappa nel frontend)
- **API Key** con limiti appropriati

### Nel Form Admin:
1. Campo "Address" (text input)
2. Button "Cerca coordinate" → chiama Geocoding API
3. Mappa interattiva dove l'admin può spostare il marker
4. Campi latitude/longitude si aggiornano automaticamente
5. Preview della mappa embedded come apparirà nel frontend

---

## UI/UX NOTES

### Design System & Componenti
**IMPORTANTE:** Usare esattamente lo stesso stile, componenti, font, colori e spacing del Blog e Landing Pages!

**Componenti da riutilizzare:**
- `@/components/ui/button` → Button
- `@/components/ui/input` → Input, Textarea
- `@/components/ui/select` → Select/Dropdown
- `@/components/ui/switch` → Switch/Toggle
- `@/components/ui/checkbox` → Checkbox
- `@/components/ui/card` → Card, CardHeader, CardTitle, CardContent
- `@/components/ui/accordion` → Accordion (per features)
- `@/components/ui/tabs` → Tabs (per EDIT form)
- `@/components/TrixEditor` → WYSIWYG Editor (come blog)
- Lucide Icons: `ArrowLeft`, `Upload`, `X`, `Save`, `Eye`, `Trash`, `Copy`, `Plus`

**Layout:**
- Max width container
- Padding consistente (p-4, p-6)
- Spacing tra elementi (space-y-4, gap-4)
- Grid responsive (grid-cols-1 md:grid-cols-2)

### Grafica
- **Sidebar navigation** identica (stesso colore, stile)
- **Header** con user menu identico
- **Colori:**
  - Primary: stesso verde usato nel blog
  - Destructive: rosso per delete
  - Muted: grigio per testo secondario
- **Tipografia:** stessa font family, size, weight
- **Borders:** stesso stile (rounded-lg, border-gray-200)
- **Shadows:** stesso stile cards

### Form States
- **Loading states:**
  - Button: `disabled={mutation.isPending}` + text "Saving..."
  - Spinner durante upload immagini
- **Success notifications:** Toast (react-hot-toast o sonner)
- **Error notifications:** Toast con messaggio errore
- **Auto-save draft:** ogni 30 secondi (opzionale, localStorage)
- **Confirm delete:**
  - Dialog modal con "Are you sure?"
  - Button "Cancel" + "Delete" (destructive)

### Immagini Gallery (EDIT Tab 4)
**Drag & Drop Zone (come blog ma multiplo):**
```tsx
<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition">
  <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
  <p className="text-sm font-medium text-gray-700">Drag images here or click to upload</p>
  <p className="text-xs text-muted-foreground mb-3">Recommended: 1920x1080, max 10MB each</p>
  <input type="file" accept="image/*" multiple className="hidden" />
</div>
```

**Grid Preview:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {images.map((img) => (
    <div key={img.id} className="relative group">
      <img src={img.path} className="w-full h-48 object-cover rounded-lg border" />
      <Button size="sm" variant="destructive" className="absolute top-2 right-2">
        <X className="h-4 w-4" />
      </Button>
      <Input placeholder="Alt text" className="mt-2" />
      <div className="flex items-center gap-2 mt-2">
        <input type="radio" name="cover" /> Set as cover
      </div>
    </div>
  ))}
</div>
```

**Drag & Drop per riordinare:**
- Usare `@dnd-kit/core` o `react-beautiful-dnd`
- Drag handle icon (⠿ icon)
- Visual feedback durante drag

### Tabs (EDIT form)
```tsx
<Tabs defaultValue="info">
  <TabsList className="grid w-full grid-cols-6">
    <TabsTrigger value="info">📝 Info</TabsTrigger>
    <TabsTrigger value="price">💰 Price</TabsTrigger>
    <TabsTrigger value="location">📍 Location</TabsTrigger>
    <TabsTrigger value="gallery">🖼️ Gallery</TabsTrigger>
    <TabsTrigger value="features">✨ Features</TabsTrigger>
    <TabsTrigger value="seo">🔍 SEO</TabsTrigger>
  </TabsList>
  <TabsContent value="info">...</TabsContent>
  ...
</Tabs>
```

### Responsive
- Form responsive su mobile (grid → stack)
- Tabs: scroll horizontal su mobile
- Lista properties: card layout su mobile (non tabella)
- Filtri: collapse/accordion su mobile
- Gallery grid: 2 colonne su mobile, 3-4 su desktop

### Accessibility
- Label for every input (htmlFor + id)
- aria-label per icons
- Focus states visibili
- Keyboard navigation (Tab, Enter, Space)
- Error messages con aria-invalid

---

## PRIORITY IMPLEMENTATION

### FASE 1 - Core Admin (Da implementare)
1. Database schema creation
2. Properties CRUD base (senza foto)
3. Basic list view con paginazione
4. Insert form (campi essenziali)
5. Edit form (tutti i campi)
6. Delete con conferma

### FASE 2 - Photos & Features
7. Sistema upload foto multiplo
8. Features management (tabella master)
9. Property-Features association
10. Search/Filter nella lista admin

### FASE 3 - Advanced Features
11. Conversioni automatiche (currency, units)
12. Google Maps integration
13. SEO fields
14. Duplicate property
15. Bulk actions

### FASE 4 - Frontend (Dopo completamento admin)
- Da pianificare successivamente

---

## ESEMPI REFERENCE

### Best Practices da implementare:

**1. Zillow**
- Filtri core visibili + "More filters"
- Chips per filtri attivi (removibili)
- Update risultati in real-time

**2. Rightmove**
- Draw search su mappa
- Filter tray superiore
- Explorazione intuitiva

**3. Idealista**
- Draw zone di ricerca
- Refinement continuo
- Focus su turismo/destinazioni

---

## NOTE TECNICHE

### Stack Tecnologico Attuale
- **Backend:** PHP (API REST)
- **Frontend Admin:** React + TypeScript + Vite
- **Database:** MySQL
- **Autenticazione:** JWT
- **Storage:** File system locale
- **UI:** Tailwind CSS

### Integrations Necessarie
- Google Maps API (geocoding, maps display)
- Currency Exchange API
- Image processing library (GD o Imagick)
- MySQL 5.7+ (supporto JSON functions)

---

## CHECKLIST FINALE

- [ ] Schema database creato (properties, property_photos)
- [ ] Relazioni foreign keys configurate
- [ ] Lista tags predefiniti (60+ tags) per autocomplete
- [ ] API endpoints implementati
- [ ] Validazione e sanitizzazione input
- [ ] Autenticazione JWT su tutti gli endpoints
- [ ] Sistema upload immagini multiplo
- [ ] Conversioni automatiche (currency/units)
- [ ] Search/Filter funzionante
- [ ] UI admin responsive
- [ ] Testing CRUD completo
- [ ] Documentazione API

---

## ACCEPTANCE CRITERIA

### 🗄️ AC1: Database & Schema

**Given** il sistema è installato  
**When** eseguo le migrations  
**Then:**
- [ ] La tabella `properties` esiste con tutti i campi definiti
- [ ] La tabella `property_photos` esiste con foreign key a properties
- [ ] Campo `tags` è di tipo TEXT e supporta JSON
- [ ] Indici creati su: slug (unique), city, property_type, status, is_active
- [ ] Auto-increment su property_id_reference parte da PROP-2026-001
- [ ] Tutti i campi ENUM hanno i valori corretti
- [ ] Timestamp created_at e updated_at hanno default CURRENT_TIMESTAMP

**Verifica:**
```sql
DESCRIBE properties;
SHOW INDEX FROM properties;
SELECT * FROM properties LIMIT 1; -- Test insert
```

---

### ✍️ AC2: INSERT Form - Manuale (3 Tab)

**Given** sono loggato come admin  
**When** clicco "New Property"  
**Then:**
- [ ] Si apre form con 3 tab: Info Base, Prezzo, Localizzazione
- [ ] Tutti i campi obbligatori sono marcati con asterisco (*)
- [ ] Property Type select ha opzioni: Active Property, New Development
- [ ] Status select ha opzioni: For Sale, Sold, Reserved
- [ ] Property Category ha 7 opzioni (Apartment, House, Villa, etc.)
- [ ] Bedrooms select va da Studio a 5+
- [ ] Bathrooms select ha mezzi bagni (1, 1.5, 2, 2.5, etc.)
- [ ] City dropdown ha lista predefinita + "Other"
- [ ] Country dropdown default è "Mexico"

**When** compilo solo i campi obbligatori e clicco "Create Property"  
**Then:**
- [ ] Validation passa
- [ ] Property viene salvata nel DB con is_active=false
- [ ] Property ID auto-generato (PROP-2026-XXX)
- [ ] Slug auto-generato da title (lowercase, hyphens)
- [ ] SQFT auto-calcolato da SQM
- [ ] Reindirizza a pagina EDIT della property creata
- [ ] Toast success "Property created successfully"

**When** lascio campi obbligatori vuoti  
**Then:**
- [ ] Form mostra errori sotto ogni campo vuoto
- [ ] Submit è bloccato
- [ ] Messaggi errore chiari (es: "Title is required")

---

### 🚀 AC3: INSERT - Add with JSON

**Given** sono nella pagina LIST  
**When** clicco "Add with JSON"  
**Then:**
- [ ] Si apre modal/page con textarea per JSON
- [ ] Textarea ha syntax highlighting
- [ ] C'è button "Show Example" che mostra template JSON
- [ ] C'è button "Validate JSON"
- [ ] C'è button "Import Property" (disabled di default)

**When** incollo JSON invalido e clicco "Validate"  
**Then:**
- [ ] Mostra errore "Invalid JSON syntax"
- [ ] Highlight linea con errore (se possibile)
- [ ] Import button rimane disabled

**When** incollo JSON valido ma campi mancanti e clicco "Validate"  
**Then:**
- [ ] Mostra lista errori validazione con field names
- [ ] Es: "price_usd is required when price_on_demand is false"
- [ ] Import button rimane disabled

**When** JSON è valido e completo  
**Then:**
- [ ] Validate mostra "✓ Valid JSON"
- [ ] Mostra preview: titolo property
- [ ] Import button diventa enabled

**When** clicco "Import Property"  
**Then:**
- [ ] Property inserita nel DB
- [ ] Campi auto-generati creati (property_id, slug, sqft, price_mxn)
- [ ] Tags array salvato come JSON string
- [ ] Reindirizza a EDIT page
- [ ] Toast success "Property imported successfully"

---

### 📝 AC4: EDIT Form - TAB 1 (Info Base)

**Given** sono nella pagina EDIT di una property  
**Then:**
- [ ] Form ha 6 tab: Info, Prezzo, Localizzazione, Gallery, Tags, SEO
- [ ] TAB 1 è selezionato di default
- [ ] Vedo Title input (pre-popolato)
- [ ] Vedo Subtitle input
- [ ] Vedo Property ID (disabled, read-only)
- [ ] Vedo Property Type select
- [ ] Vedo Status select
- [ ] Vedo Property Category select
- [ ] Vedo Description textarea (3-4 righe)
- [ ] Vedo Content WYSIWYG Editor (Trix, come blog)
- [ ] Vedo is_active switch/toggle
- [ ] Vedo featured switch/toggle
- [ ] Vedo order number input

**When** modifico Title  
**Then:**
- [ ] Slug NON si aggiorna (disabled dopo creazione)

**When** scrivo nel Content editor  
**Then:**
- [ ] Posso formattare testo (bold, italic, lists)
- [ ] Posso inserire link
- [ ] Toolbar Trix visibile e funzionante

**When** cambio is_active da false a true  
**Then:**
- [ ] Toggle visualmente cambia stato
- [ ] Al save, property diventa pubblica

---

### 💰 AC5: EDIT Form - TAB 2 (Prezzo)

**Given** sono nel TAB 2 Prezzo  
**Then:**
- [ ] Vedo checkbox "Price on Demand"
- [ ] Vedo Price USD input
- [ ] Vedo Price MXN input (read-only, grigio)
- [ ] Vedo toggle USD ↔ MXN (solo visualizzazione)
- [ ] Vedo checkbox "Price Negotiable"
- [ ] Display info tasso cambio corrente

**When** price_on_demand è false  
**Then:**
- [ ] Price USD è required e enabled
- [ ] Validation: price_usd > 0

**When** price_on_demand è true  
**Then:**
- [ ] Price USD diventa disabled/optional
- [ ] Nel frontend mostra "Price on Demand"

**When** inserisco Price USD = 500000  
**Then:**
- [ ] Price MXN si calcola automaticamente (500000 × exchange_rate)
- [ ] Display aggiorna in real-time

**When** property_type è "development"  
**Then:**
- [ ] Vedo Price From USD e Price To USD (range)
- [ ] Validation: price_from < price_to

**When** inserisco SQM = 100  
**Then:**
- [ ] SQFT si calcola automaticamente (100 × 10.7639)
- [ ] Display aggiorna in real-time

---

### 📍 AC6: EDIT Form - TAB 3 (Localizzazione)

**Given** sono nel TAB 3 Localizzazione  
**Then:**
- [ ] Vedo Neighborhood input
- [ ] Vedo City select
- [ ] Vedo Country select
- [ ] Vedo Address input
- [ ] Vedo Latitude e Longitude inputs (auto-popolati)
- [ ] Vedo Google Maps URL textarea
- [ ] Vedo mappa interattiva Google Maps con marker

**When** inserisco Address e clicco "Geocode"  
**Then:**
- [ ] Chiama Google Geocoding API
- [ ] Latitude e Longitude si popolano automaticamente
- [ ] Marker sulla mappa si posiziona alle coordinate
- [ ] Se address non trovato, mostra errore

**When** trascino il marker sulla mappa  
**Then:**
- [ ] Latitude e Longitude si aggiornano in tempo reale
- [ ] Coordinate sono valide (lat: -90/90, lng: -180/180)

**When** salvo property  
**Then:**
- [ ] Validation: latitude e longitude sono obbligatori
- [ ] Se mancano, mostra errore "GPS coordinates required"

---

### 🖼️ AC7: EDIT Form - TAB 4 (Gallery)

**Given** sono nel TAB 4 Gallery  
**Then:**
- [ ] Vedo drag & drop zone con icona upload
- [ ] Testo "Drag images or click to upload"
- [ ] Grid con immagini già caricate (se presenti)
- [ ] Ogni immagine ha: thumbnail, alt text input, "Set as Cover" radio, "Remove" button

**When** faccio drag & drop di 3 immagini  
**Then:**
- [ ] Mostra progress bar per ogni immagine
- [ ] Upload in parallelo
- [ ] Al completamento, immagini appaiono nel grid
- [ ] Input alt text è presente per ogni immagine

**When** upload è completo ma alt text è vuoto  
**Then:**
- [ ] Validation al save: "Alt text required for all images"
- [ ] Highlight input alt text vuoto in rosso

**When** trascino immagini per riordinarle  
**Then:**
- [ ] Drag handle visibile su ogni card
- [ ] Posso riordinare con drag & drop
- [ ] Order viene salvato (campo `order` in DB)

**When** seleziono "Set as Cover" su un'immagine  
**Then:**
- [ ] Solo quella immagine ha is_cover = true
- [ ] Le altre is_cover diventano false (radio behavior)

**When** provo a uploadare immagine > 10MB  
**Then:**
- [ ] Mostra errore "File too large (max 10MB)"
- [ ] Upload non parte

**When** provo a uploadare file PDF  
**Then:**
- [ ] Mostra errore "Invalid file type (jpg, png, webp only)"
- [ ] Upload non parte

**When** clicco "Remove" su un'immagine  
**Then:**
- [ ] Mostra conferma "Are you sure?"
- [ ] Se confermo, immagine viene eliminata dal DB e storage
- [ ] Grid si aggiorna

---

### 🏷️ AC8: EDIT Form - TAB 5 (Tags)

**Given** sono nel TAB 5 Tags  
**Then:**
- [ ] Vedo area con chips dei tag selezionati (se presenti)
- [ ] Vedo search input "Search or add tag..."
- [ ] Vedo accordion con categorie (Pools, Fitness, Security, etc.)

**When** digito "Poo" nel search input  
**Then:**
- [ ] Autocomplete mostra: "Pool", "Rooftop Pool", "Beach-like Pool"
- [ ] Match è highlighted

**When** seleziono "Pool" dall'autocomplete  
**Then:**
- [ ] Tag "Pool" appare come chip nella sezione Selected Tags
- [ ] Chip ha X button per rimuovere
- [ ] Tag non appare più in autocomplete (già selezionato)

**When** digito tag custom "New Feature" e premo Enter  
**Then:**
- [ ] Tag viene aggiunto (max 50 caratteri)
- [ ] Appare come chip
- [ ] Warning: "Custom tag (not in predefined list)"

**When** clicco su categoria "🏊 Pools & Water" nell'accordion  
**Then:**
- [ ] Categoria si espande
- [ ] Mostra badge pills: Pool, Rooftop Pool, Beach Access, etc.

**When** clicco su badge pill "Gym"  
**Then:**
- [ ] Tag "Gym" viene aggiunto ai selected
- [ ] Badge diventa disabled (già aggiunto)

**When** ho 20 tags selezionati e provo ad aggiungerne un altro  
**Then:**
- [ ] Mostra errore "Maximum 20 tags allowed"
- [ ] Tag non viene aggiunto

**When** salvo property  
**Then:**
- [ ] Tags salvati come JSON array: ["Pool", "Gym", "Security"]
- [ ] No duplicati nell'array
- [ ] Trim whitespace su ogni tag

---

### 🔍 AC9: EDIT Form - TAB 6 (SEO)

**Given** sono nel TAB 6 SEO  
**Then:**
- [ ] Vedo Slug input (disabled, read-only)
- [ ] Vedo SEO Title input (maxlength 160)
- [ ] Vedo SEO Description textarea (maxlength 320)
- [ ] Vedo OG Title input (maxlength 160)
- [ ] Vedo OG Description textarea (maxlength 320)
- [ ] Vedo character counter per ogni campo (es: "45/160")
- [ ] Vedo preview Google Search Result
- [ ] Vedo preview Social Media Card

**When** digito nel SEO Title  
**Then:**
- [ ] Character counter si aggiorna in real-time
- [ ] Preview Google si aggiorna
- [ ] Se supero 160 caratteri, testo diventa rosso

**When** salvo senza compilare SEO fields  
**Then:**
- [ ] Validation error: "SEO Title is required"
- [ ] Validation error: "SEO Description is required"
- [ ] Tab 6 mostra indicatore errore (badge rosso)

---

### 📋 AC10: LIST Page

**Given** sono nella pagina Properties LIST  
**Then:**
- [ ] Vedo tabella con colonne: Thumbnail, ID, Title, Status, Type, Price, Beds/Baths, City, Featured, Published, Actions
- [ ] Vedo button "New Property" (apre INSERT form)
- [ ] Vedo button "Add with JSON" (apre JSON import)
- [ ] Vedo filtri rapidi: Status, Property Type, Category, City, Featured, Published
- [ ] Vedo search box
- [ ] Vedo paginazione (20 items per pagina)

**When** clicco su header colonna "Price"  
**Then:**
- [ ] Tabella si ordina per prezzo (ASC/DESC toggle)
- [ ] Icona sort appare nel header

**When** filtro Status = "For Sale"  
**Then:**
- [ ] Lista mostra solo properties con status = for_sale
- [ ] Count aggiornato "Showing X of Y properties"

**When** cerco "Villa Tulum" nel search box  
**Then:**
- [ ] Search in: title, property_id, neighborhood, city
- [ ] Lista si filtra in real-time (o dopo Enter)

**When** seleziono 3 properties e clicco "Bulk Publish"  
**Then:**
- [ ] Conferma "Publish 3 properties?"
- [ ] Se confermo, is_active = true per tutte e 3
- [ ] Toast success "3 properties published"

**When** clicco "Export JSON" su una property  
**Then:**
- [ ] JSON viene copiato nella clipboard
- [ ] O download file property-123.json
- [ ] Toast "JSON copied to clipboard"

---

### 🔎 AC11: SEARCH (Frontend Pubblico)

**Given** sono nella pagina /search pubblica  
**Then:**
- [ ] Vedo filtri: Price range, Location (Country, City, Neighborhood), Beds, Baths, Property Types, Tags, Status
- [ ] Vedo pulsante "Search Properties"
- [ ] Vedo pulsante "Reset Filters"

**When** filtro Price Min=200000, Max=500000, Tags="Pool"  
**Then:**
- [ ] Query SQL: `price_usd BETWEEN 200000 AND 500000 AND JSON_CONTAINS(tags, '"Pool"')`
- [ ] Risultati mostrano solo properties nel range con tag Pool
- [ ] Count "X properties found"

**When** filtro Tags multipli: "Pool" E "Gym" E "Security"  
**Then:**
- [ ] Query SQL: `JSON_CONTAINS(tags, '"Pool"') AND JSON_CONTAINS(tags, '"Gym"') AND JSON_CONTAINS(tags, '"Security"')`
- [ ] Solo properties con TUTTI e 3 i tag

**When** nessun risultato trovato  
**Then:**
- [ ] Mostra "No properties found matching your criteria"
- [ ] Suggerimenti: "Try adjusting your filters"

---

### 🔒 AC12: Sicurezza & Autenticazione

**Given** NON sono loggato  
**When** provo ad accedere a `/properties/new`  
**Then:**
- [ ] Reindirizza a `/login`
- [ ] Messaggio "Authentication required"

**Given** sono loggato come admin  
**When** faccio richiesta API `POST /api/properties`  
**Then:**
- [ ] Header `Authorization: Bearer <JWT>` presente
- [ ] Token valido e non scaduto
- [ ] Role = admin verificato

**When** provo SQL injection in search box: `'; DROP TABLE properties;--`  
**Then:**
- [ ] Query usa prepared statements
- [ ] Input sanitizzato
- [ ] Nessun danno al DB

**When** upload file malicious.php.jpg  
**Then:**
- [ ] MIME type verificato (solo image/*)
- [ ] Extension verificata (jpg, jpeg, png, webp)
- [ ] File rinominato con hash sicuro
- [ ] Upload bloccato se non è immagine valida

---

### ✅ AC13: Validazioni Complete

**Scenario: Campo Title**
- [ ] Required: mostra errore se vuoto
- [ ] Min 3 caratteri: errore "Title must be at least 3 characters"
- [ ] Max 255 caratteri: errore se supera
- [ ] Sanitizzato: strip HTML tags

**Scenario: Campo Price USD**
- [ ] Required se price_on_demand = false
- [ ] Numeric: solo numeri e decimali
- [ ] Min 0: errore se negativo
- [ ] Max 15 digits

**Scenario: Campo Coordinates**
- [ ] Latitude: between -90 and 90
- [ ] Longitude: between -180 and 180
- [ ] Decimal precision: 8 decimals

**Scenario: Campo Tags**
- [ ] Array di stringhe
- [ ] Max 20 items
- [ ] Ogni tag: min 2, max 50 caratteri
- [ ] No duplicati
- [ ] Trim whitespace

**Scenario: Campo Slug**
- [ ] Auto-generato da title
- [ ] Formato: lowercase, hyphens, no spaces
- [ ] Unique: errore se già esiste
- [ ] Pattern: /^[a-z0-9-]+$/

---

### 🧪 AC14: Testing & QA

**Unit Tests (Backend PHP):**
- [ ] Test PropertyController::create() con dati validi
- [ ] Test PropertyController::update() con dati validi
- [ ] Test validazioni campi obbligatori
- [ ] Test auto-generazione property_id e slug
- [ ] Test conversioni (SQM → SQFT, USD → MXN)
- [ ] Test JSON tags encoding/decoding
- [ ] Test SQL injection prevention
- [ ] Test upload immagini con vari formati

**Integration Tests (API):**
- [ ] POST /api/properties con JWT valido → 201 Created
- [ ] POST /api/properties senza auth → 401 Unauthorized
- [ ] POST /api/properties con dati invalidi → 400 Bad Request + errors array
- [ ] GET /api/properties con filtri → risposta corretta
- [ ] POST /api/properties/import-json con JSON valido → 201
- [ ] GET /api/properties/:id/export-json → JSON completo

**E2E Tests (Cypress/Playwright):**
- [ ] Flow completo: Login → New Property → Insert → Edit → Publish
- [ ] Upload multiplo immagini drag & drop
- [ ] Aggiunta tags con autocomplete
- [ ] Save property e verifica su LIST
- [ ] Search property e verifica risultati
- [ ] Export JSON e re-import

**Responsive Tests:**
- [ ] Form funziona su mobile (tabs responsive)
- [ ] Gallery drag & drop funziona su touch
- [ ] Filtri collapse su mobile
- [ ] Tabella diventa card layout su mobile

---

### 📊 AC15: Performance & Ottimizzazione

**Database:**
- [ ] Query GET /api/properties con 1000 records < 500ms
- [ ] Indici su campi searchabili (city, status, property_type)
- [ ] JSON_CONTAINS su tags < 100ms per query

**Frontend:**
- [ ] Lazy load immagini nel grid
- [ ] Pagination API-side (no fetch all)
- [ ] Debounce search input (300ms)
- [ ] Image thumbnails ottimizzate (max 300KB)

**Upload:**
- [ ] Resize immagini > 2MB lato server
- [ ] Generate thumbnails 300x200
- [ ] Compress con quality 85%
- [ ] Max 20 immagini per property

---

## PROSSIMI PASSI

1. **Review documento** con il team
2. **Approval** schema database
3. **Creazione migration SQL**
4. **Implementazione backend API**
5. **Implementazione frontend admin**
6. **Testing e debugging**
7. **Deploy staging**
8. **Pianificazione frontend pubblico**



SEI UN ESPERTO DI UI/UX ma comunque ti devi tenere a quallo che il documento dice
ma mi aspetto che con la stessa struttura con tu possa fare una cosa che si capisce bella e funzionante con le giuste validazioni sia lato ADMIN che lato BACKEND

