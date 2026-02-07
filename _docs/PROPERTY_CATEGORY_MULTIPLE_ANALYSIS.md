# Analisi: Property Category Multipla per New Development

## 📋 Sommario Esecutivo

**Richiesta**: Permettere la selezione multipla di Property Category quando `property_type = 'development'`, perché un nuovo sviluppo può includere diverse tipologie (es. appartamenti, ville, penthouse nello stesso progetto).

**Impatto**: ALTO - Richiede modifiche a database, backend, frontend e logica di ricerca/filtri.

---

## 🔍 Situazione Attuale

### Database
```sql
-- Tabella: properties
property_category ENUM('apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial') NOT NULL
```
- Campo **ENUM singolo obbligatorio**
- Ogni property può avere UNA SOLA categoria

### Backend (PropertyController.php)

#### 1. Filtro Ricerca (linea 55-58)
```php
if (!empty($filters['property_category'])) {
    $where[] = "property_category = ?";
    $params[] = $filters['property_category'];
    $types .= 's';
}
```
- Cerca **esatta corrispondenza** con UNA categoria

#### 2. Validazione (linea 891-893)
```php
if (isset($data['property_category']) && !in_array($data['property_category'], 
    ['apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial'])) {
    return "Invalid property_category";
}
```
- Accetta **UN SOLO valore** dall'array predefinito

#### 3. Campi Richiesti (linea 866)
```php
$required = ['title', 'property_type', 'property_category', 'city'];
```
- `property_category` è **obbligatorio** in UPDATE

### Frontend Admin (PropertyFormPage.tsx)

#### Select Singolo (linea 337-349)
```tsx
<div>
  <Label className="text-sm font-medium">Property Category <span className="text-red-500">*</span></Label>
  <Select value={formData.property_category} onValueChange={(v) => handleSelectChange('property_category', v)}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="apartment">Apartment</SelectItem>
      <SelectItem value="house">House</SelectItem>
      <SelectItem value="villa">Villa</SelectItem>
      <SelectItem value="condo">Condo</SelectItem>
      <SelectItem value="penthouse">Penthouse</SelectItem>
      <SelectItem value="land">Land</SelectItem>
      <SelectItem value="commercial">Commercial</SelectItem>
    </SelectContent>
  </Select>
</div>
```
- UI: **Dropdown singolo**
- State: `property_category: 'apartment'` (stringa)

### Frontend Pubblico (SearchPage.jsx)

#### Filtro (linea 143-151)
```jsx
<select
  name="category"
  value={filters.category}
  onChange={handleChange}
  className="search-select"
>
  <option value="">All Categories</option>
  <option value="luxury">Luxury</option>
  <option value="beachfront">Beachfront</option>
  ...
</select>
```
- **Select singolo** per filtrare

---

## 🎯 Cosa Significa Cambiare a Checkbox Multipli

### Esempio Pratico
Un development "Atzaró Residences" può avere:
- ☑️ Apartment
- ☑️ Penthouse  
- ☑️ Villa
- ☑️ Condo

L'utente admin deve poter selezionare **tutte le categorie applicabili**.

---

## 🛠️ Modifiche Necessarie

### 1. DATABASE ⚠️ BREAKING CHANGE

#### Opzione A: Nuova Tabella di Relazione (CONSIGLIATO)
```sql
-- Tabella di join per relazione many-to-many
CREATE TABLE property_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id INT UNSIGNED NOT NULL,
    category ENUM('apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial') NOT NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    UNIQUE KEY unique_property_category (property_id, category),
    INDEX idx_property (property_id),
    INDEX idx_category (category)
) ENGINE=InnoDB;

-- Mantenere property_category nella tabella properties per retrocompatibilità
-- Ma diventa NULLABLE e usata solo per property_type = 'active'
ALTER TABLE properties 
MODIFY COLUMN property_category ENUM('apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial') NULL;
```

**Pro**:
- Normalizzato, scalabile
- Permette query efficienti
- Non rompe properties esistenti

**Contro**:
- Più complesso da gestire
- Richiede JOIN nelle query

#### Opzione B: Campo JSON
```sql
-- Convertire property_category a JSON per development
ALTER TABLE properties 
ADD COLUMN property_categories JSON DEFAULT NULL COMMENT 'Array of categories for developments',
MODIFY COLUMN property_category ENUM(...) NULL COMMENT 'Single category for active properties';

-- Creare indice virtuale per ricerche
ALTER TABLE properties 
ADD INDEX idx_categories_json ((CAST(property_categories AS CHAR(255) ARRAY)));
```

**Pro**:
- Più semplice da implementare
- Nessuna tabella aggiuntiva

**Contro**:
- Query più complesse
- Meno performante per ricerche
- Problemi di validazione

#### ✅ RACCOMANDAZIONE: Opzione A (Tabella Relazione)

---

### 2. BACKEND API

#### A. PropertyController - Salvataggio
```php
// In create() e update()
public function create($data) {
    // ... creazione property base ...
    
    // Se property_type = 'development' e categories è array
    if ($data['property_type'] === 'development' && isset($data['property_categories'])) {
        $this->savePropertyCategories($propertyId, $data['property_categories']);
    }
    // Se property_type = 'active', usa property_category singolo
    else if ($data['property_type'] === 'active' && isset($data['property_category'])) {
        // Usa il campo ENUM tradizionale
    }
}

private function savePropertyCategories($propertyId, $categories) {
    // 1. Cancellare categorie esistenti
    $deleteQuery = "DELETE FROM property_categories WHERE property_id = ?";
    $this->db->executePrepared($deleteQuery, [$propertyId], 'i');
    
    // 2. Inserire nuove categorie
    $insertQuery = "INSERT INTO property_categories (property_id, category) VALUES (?, ?)";
    foreach ($categories as $category) {
        $this->db->executePrepared($insertQuery, [$propertyId, $category], 'is');
    }
}
```

#### B. PropertyController - Lettura
```php
public function getById($id) {
    // Query principale property
    $property = // ... query esistente ...
    
    // Se property_type = 'development', caricare categorie multiple
    if ($property['property_type'] === 'development') {
        $catQuery = "SELECT category FROM property_categories WHERE property_id = ?";
        $result = $this->db->executePrepared($catQuery, [$id], 'i');
        
        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row['category'];
        }
        $property['property_categories'] = $categories;
    }
    
    return $property;
}
```

#### C. PropertyController - Filtri/Ricerca
```php
// Modificare getAll() per supportare categorie multiple
if (!empty($filters['property_category'])) {
    // Per development: cerca in property_categories
    $where[] = "EXISTS (
        SELECT 1 FROM property_categories pc 
        WHERE pc.property_id = properties.id 
        AND pc.category = ?
    )";
    $params[] = $filters['property_category'];
    $types .= 's';
}
```

#### D. Validazione
```php
private function validatePropertyData($data, $isUpdate = false) {
    // Validare property_category per active properties
    if (isset($data['property_type']) && $data['property_type'] === 'active') {
        if (empty($data['property_category'])) {
            return "property_category is required for active properties";
        }
        // Validazione ENUM singolo
    }
    
    // Validare property_categories per developments
    if (isset($data['property_type']) && $data['property_type'] === 'development') {
        if (empty($data['property_categories']) || !is_array($data['property_categories'])) {
            return "property_categories array is required for developments";
        }
        
        $validCategories = ['apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial'];
        foreach ($data['property_categories'] as $cat) {
            if (!in_array($cat, $validCategories)) {
                return "Invalid category: $cat";
            }
        }
    }
    
    return true;
}
```

---

### 3. FRONTEND ADMIN

#### A. PropertyFormPage.tsx - State
```tsx
const [formData, setFormData] = useState({
  // ... altri campi ...
  property_type: 'active',
  property_category: 'apartment',      // Per active properties
  property_categories: [],              // Per developments (ARRAY)
});
```

#### B. Render Condizionale
```tsx
{/* Nel tab "Basic Info" */}
<div>
  <Label className="text-sm font-medium">
    Property Category <span className="text-red-500">*</span>
  </Label>
  
  {formData.property_type === 'active' ? (
    // SELECT SINGOLO per Active Properties
    <Select 
      value={formData.property_category} 
      onValueChange={(v) => handleSelectChange('property_category', v)}
    >
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="apartment">Apartment</SelectItem>
        <SelectItem value="house">House</SelectItem>
        <SelectItem value="villa">Villa</SelectItem>
        <SelectItem value="condo">Condo</SelectItem>
        <SelectItem value="penthouse">Penthouse</SelectItem>
        <SelectItem value="land">Land</SelectItem>
        <SelectItem value="commercial">Commercial</SelectItem>
      </SelectContent>
    </Select>
  ) : (
    // CHECKBOX MULTIPLI per Developments
    <div className="space-y-2">
      {['apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial'].map(cat => (
        <div key={cat} className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`cat-${cat}`}
            checked={formData.property_categories.includes(cat)}
            onChange={(e) => {
              if (e.target.checked) {
                setFormData(prev => ({
                  ...prev,
                  property_categories: [...prev.property_categories, cat]
                }))
              } else {
                setFormData(prev => ({
                  ...prev,
                  property_categories: prev.property_categories.filter(c => c !== cat)
                }))
              }
            }}
          />
          <label htmlFor={`cat-${cat}`} className="capitalize cursor-pointer">
            {cat}
          </label>
        </div>
      ))}
    </div>
  )}
</div>
```

#### C. Validazione Submit
```tsx
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (id) { // UPDATE
    if (formData.property_type === 'active') {
      if (!formData.property_category) {
        focusField('property_category');
        return;
      }
    } else if (formData.property_type === 'development') {
      if (!formData.property_categories.length) {
        alert('Please select at least one category for the development');
        return;
      }
    }
  }
  
  const payload = {
    ...formData,
    // Inviare il campo corretto in base al tipo
    ...(formData.property_type === 'development' && {
      property_categories: formData.property_categories
    })
  };
  
  mutation.mutate(payload);
};
```

#### D. Load da API
```tsx
useQuery({
  queryKey: ['property', id],
  queryFn: async () => {
    const response = await api.get(`/properties/${id}`)
    const property = response.data.data
    
    setFormData({
      // ... altri campi ...
      property_category: property.property_category || 'apartment',
      property_categories: property.property_categories || [], // Array dal backend
    })
    return property
  },
  enabled: isEdit,
})
```

---

### 4. FRONTEND PUBBLICO

#### A. SearchPage.jsx - Filtro
Mantenere il filtro singolo (cercherà properties che HANNO quella categoria):

```jsx
// La query API rimane:
if (filters.category) params.append('property_category', filters.category);

// Il backend farà:
// SELECT * FROM properties WHERE EXISTS (
//   SELECT 1 FROM property_categories WHERE property_id = properties.id AND category = 'apartment'
// )
```

#### B. PropertyDetailPage - Visualizzazione
```jsx
// Se development con categorie multiple, mostrarle tutte
{property.property_type === 'development' && property.property_categories?.length > 0 && (
  <div className="property-categories">
    <h4>Available Unit Types:</h4>
    <div className="category-tags">
      {property.property_categories.map(cat => (
        <span key={cat} className="category-tag">{cat}</span>
      ))}
    </div>
  </div>
)}

// Se active property, mostrare singola categoria
{property.property_type === 'active' && property.property_category && (
  <span className="property-type">{property.property_category}</span>
)}
```

---

## 📊 Impatto su Funzionalità Esistenti

### ✅ Cosa Rimane Uguale
1. **Active Properties**: Continuano a usare `property_category` singolo (ENUM)
2. **Filtri ricerca pubblici**: Funzionano allo stesso modo (cerca chi HA quella categoria)
3. **SEO e sitemap**: Nessuna modifica necessaria

### ⚠️ Cosa Cambia
1. **Form admin**: UI completamente diversa per developments
2. **API response**: Development avrà `property_categories: []` invece di `property_category: 'string'`
3. **Database queries**: JOIN con `property_categories` per developments
4. **Validazione**: Logica condizionale basata su `property_type`

---

## 🗺️ Piano di Migrazione

### Step 1: Database
```sql
-- Migration script: database/010_property_categories_multiple.sql

-- 1. Creare nuova tabella
CREATE TABLE property_categories (...);

-- 2. Modificare property_category esistente (renderlo nullable)
ALTER TABLE properties 
MODIFY COLUMN property_category ENUM(...) NULL;

-- 3. Migrare dati esistenti per development
INSERT INTO property_categories (property_id, category)
SELECT id, property_category 
FROM properties 
WHERE property_type = 'development' 
AND property_category IS NOT NULL;

-- 4. Committare
```

### Step 2: Backend API
1. Aggiungere metodi `savePropertyCategories()` e `loadPropertyCategories()`
2. Modificare `create()` e `update()` per gestire entrambi i casi
3. Modificare `getById()` e `getAll()` per JOIN con `property_categories`
4. Aggiornare validazione con logica condizionale
5. Testare tutti gli endpoint

### Step 3: Frontend Admin
1. Aggiungere `property_categories: []` allo state
2. Implementare render condizionale (Select vs Checkboxes)
3. Aggiornare validazione submit
4. Testare creazione e modifica di properties

### Step 4: Frontend Pubblico
1. Aggiornare `PropertyDetailPage` per mostrare categorie multiple
2. Verificare che i filtri funzionino correttamente
3. Testare SEO e OG tags

### Step 5: Testing
- [ ] Creare nuovo development con 3 categorie
- [ ] Modificare development esistente
- [ ] Creare active property (deve usare select singolo)
- [ ] Filtrare per categoria (deve trovare developments)
- [ ] Verificare API responses
- [ ] Testare validazione (array vuoto, valori non validi)

### Step 6: Produzione
1. Backup database
2. Eseguire migration SQL
3. Deploy backend
4. Deploy frontend admin
5. Deploy frontend pubblico
6. Smoke testing

---

## ⏱️ Stima Tempo di Sviluppo

| Task | Tempo Stimato |
|------|---------------|
| Migration database + test | 2 ore |
| Backend API changes | 4 ore |
| Frontend Admin UI | 3 ore |
| Frontend Pubblico | 1 ora |
| Testing completo | 2 ore |
| Documentazione | 1 ora |
| **TOTALE** | **13 ore** |

---

## 🚨 Rischi e Considerazioni

### Rischi Tecnici
1. **Breaking change**: Properties esistenti potrebbero avere problemi se non migrati correttamente
2. **Performance**: JOIN aggiuntivo su property_categories potrebbe rallentare query (mitigato con indici)
3. **Validazione**: Logica condizionale più complessa = più possibilità di bug

### Considerazioni UX
1. **Admin confusion**: Due UI diverse per stesso campo a seconda del tipo
2. **SEO**: Come gestire meta tags per developments con categorie multiple?
3. **Filters**: Utenti potrebbero aspettarsi filtri multipli anche nel frontend pubblico

### Alternative da Considerare
1. **Multi-select invece di checkboxes**: Meno spazio visivo ma meno chiaro
2. **Sempre usare array**: Anche per active properties (array con 1 elemento) - semplifica logica
3. **Campo testuale**: Inserimento manuale separato da virgole - troppo error-prone

---

## ✅ Raccomandazioni Finali

### Da Fare
✅ Implementare Opzione A (tabella `property_categories`)  
✅ Usare checkboxes nell'admin per developments  
✅ Mantenere select singolo per active properties  
✅ Creare migration script completo  
✅ Test coverage al 100% su validazioni  

### Da NON Fare
❌ Modificare il comportamento per active properties  
❌ Rimuovere il campo `property_category` dalla tabella properties  
❌ Permettere array vuoto (almeno 1 categoria richiesta)  

### Next Steps
1. **Approvazione**: Confermare approccio con team
2. **Prototipo**: Creare branch feature e implementare database + backend
3. **Review**: Testing approfondito prima di toccare frontend
4. **Deploy**: Piano di rollback pronto in caso di problemi

---

## 📝 Domande da Rispondere

1. **SEO**: Come gestire `og_title` / `og_description` per developments con 5 categorie diverse?
2. **Slug**: Includere categorie nello slug? (es. `/development-tulum-apartment-villa`)
3. **Obbligatorietà**: Almeno 1 categoria o permettere 0?
4. **UI**: Ordinamento delle checkbox (alfabetico vs popolarità)?
5. **Limiti**: Max numero di categorie selezionabili?
6. **Sitemap**: Una entry per property o una per ogni categoria?

---

**Documento creato**: 2026-02-04  
**Autore**: GitHub Copilot  
**Status**: DRAFT - In attesa di approvazione
