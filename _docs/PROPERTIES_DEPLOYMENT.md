# PROPERTIES MODULE - DEPLOYMENT CHECKLIST

## ✅ IMPLEMENTAZIONE COMPLETATA

### Backend (PHP/MySQL)
- [x] Migration SQL (`api/database/properties.sql`)
- [x] PropertyController con CRUD completo
- [x] API endpoints con JWT auth
- [x] Validazioni server-side
- [x] JSON import/export
- [x] Tags JSON support
- [x] Auto-calc triggers (SQFT, MXN, property_id)

### Frontend (React/TypeScript)
- [x] PropertiesPage (LIST) con filtri
- [x] PropertyFormPage (INSERT 3-tab + EDIT 6-tab)
- [x] PropertyJsonImportPage
- [x] Routes configurate
- [x] Toggle inline Featured/Published
- [x] Search con icona
- [x] Delete confirmation dialog
- [x] Export JSON da lista

---

## 🚀 DEPLOYMENT STEPS

### 1. Database Migration
```bash
# Backup del DB attuale
mysqldump -u root dalila_db > backup_$(date +%Y%m%d).sql

# Esegui migration
mysql -u root -p dalila_db < api/database/properties.sql

# Verifica tabelle
mysql -u root -p dalila_db -e "DESCRIBE properties; DESCRIBE property_photos;"
```

### 2. Backend Verification
```bash
# Test endpoints (sostituisci con il tuo token JWT)
TOKEN="your_jwt_token_here"

# GET tags predefiniti (public)
curl http://localhost/api/properties/tags

# GET properties list (public)
curl http://localhost/api/properties

# POST create property (auth required)
curl -X POST http://localhost/api/properties \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Property",
    "property_type": "active",
    "property_category": "apartment",
    "city": "Tulum",
    "latitude": 20.2114,
    "longitude": -87.4653,
    "price_usd": 100000
  }'
```

### 3. Frontend Build (se necessario)
```bash
cd admin
npm install  # se ci sono nuove dipendenze
npm run build
```

---

## ⚠️ NOTE IMPORTANTI

### Conflict Resolution
- **Vecchio PropertyController**: Backup salvato come `PropertyController.php.old`
- Se ci sono già properties nel DB con schema diverso, potrebbero esserci conflitti
- **Soluzione**: Drop vecchie tabelle prima della migration (incluso nel SQL)

### is_active Field
- **NON** è più nel form INSERT/EDIT
- Si gestisce **solo dalla lista** con toggle inline (Eye icon)
- Default: `is_active = false` (draft)

### order Field
- Campo numerico nel form (tab Info Base)
- **NON serve drag & drop** come nei blog
- Si edita direttamente il numero

### Gallery Upload
- Tab "Gallery" presente in EDIT
- **TODO**: Implementare drag & drop upload
- Per ora: placeholder "Coming soon"

---

## 📋 CHECKLIST VERIFICHE

### Sicurezza
- [x] JWT token su POST/PUT/DELETE
- [x] AuthMiddleware verifica role admin/editor
- [x] Validazioni server-side (required fields, ENUM, ranges)
- [x] SQL injection protection (prepared statements)
- [x] XSS protection (sanitizzazione input)

### Validazioni Backend
- [x] title: min 3, max 255 chars
- [x] property_type: ENUM validation
- [x] status: ENUM validation
- [x] property_category: ENUM validation
- [x] price_usd: required se price_on_demand = false
- [x] latitude: -90 to 90
- [x] longitude: -180 to 180
- [x] tags: max 20 items
- [x] seo_title: max 160 chars
- [x] seo_description: max 320 chars

### API Endpoints

#### Properties
```
GET    /api/properties                 ✅ Public (lista con filtri)
GET    /api/properties/:id             ✅ Public (dettaglio)
GET    /api/properties/:slug           ✅ Public (dettaglio by slug)
GET    /api/properties/tags            ✅ Public (tags predefiniti)
GET    /api/properties/popular-tags    ✅ Public (top tags)
GET    /api/properties/:id/export-json ✅ Auth (export JSON)
POST   /api/properties                 ✅ Auth (create)
POST   /api/properties/import-json     ✅ Auth (import da JSON)
PUT    /api/properties/:id             ✅ Auth (update)
DELETE /api/properties/:id             ✅ Auth (delete + CASCADE photos)
```

#### Property Photos (NEW)
```
GET    /api/property-photos/property/:propertyId  ✅ Public (lista foto per property)
GET    /api/property-photos/:id                   ✅ Public (dettaglio foto)
POST   /api/property-photos                       ✅ Auth (create foto)
POST   /api/property-photos/reorder               ✅ Auth (riordina foto)
PUT    /api/property-photos/:id                   ✅ Auth (update foto)
PUT    /api/property-photos/:id/set-cover         ✅ Auth (imposta cover)
DELETE /api/property-photos/:id                   ✅ Auth (delete foto + file)
```

### Frontend Routes
```
/properties                  ✅ Lista con filtri + search
/properties/new              ✅ Form INSERT (3 tab)
/properties/import-json      ✅ JSON import page
/properties/:id              ✅ Form EDIT (6 tab)
```

### UI Components
- [x] Search input con icona
- [x] 5 filtri: Published, Status, Type, City
- [x] Table con 10 colonne
- [x] Toggle Featured (star icon)
- [x] Toggle Published (eye icon)
- [x] Dropdown actions: Edit, Export JSON, Delete
- [x] Delete confirmation dialog
- [x] Loading skeletons
- [x] Empty state con CTA
- [x] TrixEditor per WYSIWYG content
- [x] Tabs responsive (3 per INSERT, 6 per EDIT)
- [x] **PropertyGalleryUpload** con drag & drop, set cover, alt text editing
- [x] **TagPicker** con autocomplete, 11 categorie, 60+ tags predefiniti
- [x] **MapPicker** con geocoding automatico da indirizzo (OpenStreetMap)

---

## 🐛 KNOWN ISSUES & TODO

### ✅ COMPLETATO (NEW)
1. **Gallery Upload** (Tab 4 EDIT) ✅
   - ✅ Drag & drop reordering (dnd-kit)
   - ✅ Multiple image upload
   - ✅ Set cover image (star icon)
   - ✅ Alt text editing inline
   - ✅ Delete confirmation dialog
   - ✅ PropertyPhotoController.php con 7 metodi
   - ✅ API routes: /property-photos con GET/POST/PUT/DELETE
   - ✅ Reorder endpoint: POST /property-photos/reorder

2. **TagPicker Component** (Tab 5 EDIT) ✅
   - ✅ Autocomplete da 60+ tags predefiniti
   - ✅ Badge con X per rimuovere
   - ✅ Accordion per 11 categorie
   - ✅ Max 20 tags validation
   - ✅ Custom tags support
   - ✅ Search tags con filtro live

3. **MapPicker Component** (Tab 3 Location) ✅
   - ✅ Geocoding automatico da address (OpenStreetMap Nominatim API)
   - ✅ Manual coordinate input con validazione
   - ✅ Link "View on Maps" per preview
   - ✅ Help text e guide utente

### Opzionale / Future
4. **Frontend Public Search Page** (lato pubblico) - TODO
   - SearchPage.jsx con filtri avanzati
   - JSON_CONTAINS query per tags
   - Price range slider
   - Grid responsive con card properties
   - Pagination e sorting

### Opzionale
- [ ] Bulk actions (publish/unpublish multiple)
- [ ] Export CSV lista properties
- [ ] Duplicate property feature
- [ ] Property preview modal

---

## 🔍 TESTING CHECKLIST

### Manuale
- [ ] Login come admin
- [ ] Vai su /properties → vedi lista
- [ ] Clicca "New Property" → form con 3 tab
- [ ] Compila campi obbligatori → Create
- [ ] Vedi property nella lista (draft, eye off)
- [ ] Toggle eye → property published
- [ ] Toggle star → property featured
- [ ] Clicca Edit → form con 6 tab
- [ ] Modifica campi → Update
- [ ] Clicca "Export JSON" → copia clipboard
- [ ] Vai su "Import JSON" → incolla → Validate → Import
- [ ] Clicca Delete → conferma → property eliminata

### API Testing
```bash
# Test con curl
./scripts/test-properties-api.sh
```

### Frontend Testing
```bash
cd admin
npm run dev
# Apri http://localhost:5173/properties
```

---

## 📊 DATABASE STATS

Dopo migration, verifica:
```sql
-- Count properties
SELECT COUNT(*) as total_properties FROM properties;

-- Properties by status
SELECT status, COUNT(*) as count FROM properties GROUP BY status;

-- Properties by type
SELECT property_type, COUNT(*) as count FROM properties GROUP BY property_type;

-- Top 10 cities
SELECT city, COUNT(*) as count FROM properties GROUP BY city ORDER BY count DESC LIMIT 10;

-- Photos count
SELECT COUNT(*) as total_photos FROM property_photos;
```

---

## ✅ BACKEND PRONTO PER USO

Il backend è **pronto e funzionante**. Puoi:
1. Eseguire migration SQL
2. Testare API endpoints
3. Usare admin UI per CRUD
4. Importare/esportare JSON

**NON ci sono problemi** con altre parti se:
- Esegui migration su DB pulito o fai backup prima
- Non ci sono dipendenze dal vecchio schema properties

---

## 📞 SUPPORT

Per problemi o domande:
- Verifica logs: `tail -f /var/log/apache2/error.log`
- Check PHP errors: guarda response JSON
- Frontend errors: apri DevTools Console
- Database errors: verifica constraints e foreign keys
