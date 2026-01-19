# Guida Migrazione Dati WordPress → Dalila

## Panoramica

Questo documento spiega come migrare i dati dal vecchio sito WordPress al nuovo sistema Dalila.

## Concetti Chiave

### Differenza tra Seed e Migrazione

**Seed (seeding)**:
- File con dati di esempio/test per sviluppo
- Dati "finti" o rappresentativi
- Serve per testare il sistema durante lo sviluppo
- Esempio: `init.sql` contiene 3 proprietà di esempio

**Migrazione (migration)**:
- Script che trasferisce dati REALI da un sistema all'altro
- Legge dal database WordPress esistente
- Converte e adatta al nuovo schema
- Mantiene l'integrità dei dati originali

## Processo di Migrazione

### 1. Preparazione

#### 1.1 Esporta Database WordPress

Nel cPanel del tuo hosting WordPress:

```bash
# Via phpMyAdmin:
1. Apri phpMyAdmin
2. Seleziona database WordPress
3. Click "Export"
4. Formato: SQL
5. Salva come: buywithdali.sql
```

O via command line:
```bash
mysqldump -u username -p database_name > buywithdali.sql
```

#### 1.2 Posiziona il File

```bash
# Copia il file SQL nella cartella old/
cp buywithdali.sql /path/to/Dalila/old/buywithdali.sql
```

#### 1.3 Importa WordPress in Database Separato

```bash
# Crea un database separato per WordPress (temporaneo)
mysql -u root -p -e "CREATE DATABASE buywithdali_wp;"

# Importa il dump
mysql -u root -p buywithdali_wp < old/buywithdali.sql
```

#### 1.4 Configura Variabili

Aggiungi al file `.env`:

```env
# Database WordPress (per migrazione)
WP_DB_NAME=buywithdali_wp
```

### 2. Struttura WordPress da Mappare

Il vecchio WordPress usa probabilmente questi elementi:

#### Tabelle Principali WordPress:
```
wp_posts           → Proprietà (post_type='property')
wp_postmeta        → Custom fields (prezzo, camere, bagni, ecc.)
wp_posts           → Immagini (post_type='attachment')
wp_term_relationships → Categorie/Tags
```

#### Custom Fields Tipici:
```
wpcf-prezzo              → price
wpcf-camere              → bedrooms
wpcf-bagni               → bathrooms
wpcf-superficie          → sqft
wpcf-indirizzo           → address
wpcf-citta               → city
wpcf-cap                 → zip_code
wpcf-anno-costruzione    → year_built
wpcf-tipologia           → property_type
```

### 3. Esecuzione Migrazione

#### 3.1 Verifica Configurazione

```bash
cd /Users/gelso/workspace/Dalila

# Verifica che il database Dalila sia inizializzato
docker exec -it dalila-mysql mysql -udalila_user -p -e "SHOW TABLES FROM dalila_db;"

# Dovresti vedere: admin_users, properties, photogallery, etc.
```

#### 3.2 Esegui Script di Migrazione

```bash
# Entra nel container backend
docker exec -it dalila-backend bash

# Esegui migrazione
php /var/www/html/database/migrate.php
```

Output atteso:
```
╔════════════════════════════════════════════════════════════╗
║   MIGRAZIONE WORDPRESS → DALILA DATABASE                  ║
╚════════════════════════════════════════════════════════════╝

Questo script:
  1. Legge i dati dal database WordPress (old/buywithdali.sql)
  2. Migra proprietà, immagini, e contenuti al nuovo database Dalila
  3. Mantiene il database WordPress intatto (solo lettura)

Vuoi continuare? (y/N): y

🚀 Avvio migrazione...

=== Inizio Migrazione WordPress → Dalila ===
✓ Connesso al database Dalila
✓ Connesso al database WordPress: buywithdali_wp

--- Inizio processo di migrazione ---

1. Migrazione Proprietà...
  Trovate 45 proprietà in WordPress
  ✓ Importata: 'Luxury Villa Miami Beach' (ID: 1, WP ID: 123)
  ✓ Importata: 'Downtown Condo Fort Lauderdale' (ID: 2, WP ID: 124)
  ...
  
  Risultato: 45 importate, 0 saltate

2. Migrazione Fotogallerie...
  ✓ Immagine importata per proprietà ID: 1
  ...
  
  Risultato: 234 immagini importate, 0 saltate

3. Migrazione Blog Posts...
  Migrazione blog posts non implementata (opzionale)

4. Migrazione Amenities...
  Migrazione amenities non implementata

=== Migrazione Completata con Successo ===

--- Statistiche Finali ---
Proprietà totali in Dalila: 45
Immagini totali in Dalila: 234

Log completo salvato in: /var/www/html/database/migration_2026-01-19_14-30-45.log

✅ Migrazione completata!
```

### 4. Personalizzazione Script

Lo script [migrate.php](../BE/database/migrate.php) è un template di base. Dovrai personalizzarlo in base a:

#### 4.1 Custom Fields WordPress

Modifica l'array `$fieldMapping` in base ai tuoi custom fields:

```php
private $fieldMapping = [
    'price' => 'wpcf-prezzo',        // Trova il nome esatto in wp_postmeta
    'bedrooms' => 'wpcf-camere',
    'bathrooms' => 'wpcf-bagni',
    // ... aggiungi tutti i campi che usi
];
```

Come trovare i nomi dei custom fields:
```sql
-- Query per vedere tutti i meta_key usati
SELECT DISTINCT meta_key 
FROM wp_postmeta 
WHERE post_id IN (
    SELECT ID FROM wp_posts WHERE post_type = 'property'
)
ORDER BY meta_key;
```

#### 4.2 Post Type

Se WordPress usa un custom post type diverso da `property`:

```php
// Cambia questa query in migrateProperties()
WHERE p.post_type = 'your_custom_post_type'  // Es: 'listing', 'immobile', etc.
```

#### 4.3 Gallery Plugin

Se usi un plugin specifico per le gallerie (ACF, MetaSlider, etc.):

```php
// In migrateImages(), modifica come recuperi le immagini
// Esempio per ACF Gallery:
$galleryMeta = $this->getPostMeta($wpPostId)['gallery'] ?? null;
if ($galleryMeta && is_array($galleryMeta)) {
    foreach ($galleryMeta as $imageId) {
        // ...
    }
}
```

#### 4.4 Amenities/Features

Se WordPress ha taxonomy per features (piscina, garage, etc.):

```php
private function migrateAmenities() {
    foreach ($this->propertyMapping as $wpPostId => $daliPropertyId) {
        // Recupera terms (categorie/tags)
        $sql = "SELECT t.name, t.slug 
                FROM wp_terms t
                JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
                JOIN wp_term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
                WHERE tr.object_id = ? AND tt.taxonomy = 'property_feature'";
        
        $stmt = $this->wpDb->prepare($sql);
        $stmt->execute([$wpPostId]);
        $features = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($features as $feature) {
            // Inserisci in property_amenities
            $insertSql = "INSERT INTO property_amenities (property_id, name, value)
                          VALUES (?, ?, ?)";
            $stmt = $this->daliDb->prepare($insertSql);
            $stmt->execute([$daliPropertyId, $feature['slug'], $feature['name']]);
        }
    }
}
```

### 5. Migrazione Immagini Fisiche

Lo script migra solo i riferimenti alle immagini. Per le immagini fisiche:

#### 5.1 Scarica Immagini da WordPress

```bash
# Via FTP/SSH, scarica la cartella uploads di WordPress
# Solitamente in: wp-content/uploads/

# Esempio con scp:
scp -r user@oldserver.com:/path/to/wp-content/uploads/ ./old/wp-uploads/
```

#### 5.2 Copia nella Nuova Struttura

```bash
# Crea la struttura
mkdir -p BE/uploads/properties

# Copia le immagini
cp -r old/wp-uploads/* BE/uploads/properties/
```

#### 5.3 Aggiorna Path nel Database (opzionale)

Se i path sono cambiati:

```sql
UPDATE photogallery 
SET image_url = REPLACE(image_url, 
    'https://oldsite.com/wp-content/uploads/', 
    'https://newsite.com/uploads/properties/'
);
```

### 6. Verifica Migrazione

#### 6.1 Controlla Dati Migrati

```bash
# Entra nel MySQL container
docker exec -it dalila-mysql mysql -udalila_user -p dalila_db

# Verifica proprietà
SELECT COUNT(*) FROM properties;
SELECT title, price, city FROM properties LIMIT 5;

# Verifica immagini
SELECT COUNT(*) FROM photogallery;
SELECT p.title, COUNT(pg.id) as num_images
FROM properties p
LEFT JOIN photogallery pg ON p.id = pg.property_id
GROUP BY p.id;
```

#### 6.2 Test API

```bash
# Lista proprietà
curl http://localhost:8080/api/properties

# Dettaglio proprietà
curl http://localhost:8080/api/properties/1

# Verifica immagini
curl http://localhost:8080/api/properties/1/gallery
```

#### 6.3 Test Admin Panel

1. Apri http://localhost:5174
2. Login con admin
3. Vai su "Properties"
4. Verifica che tutte le proprietà siano visibili
5. Apri una proprietà e verifica i dati

### 7. Troubleshooting

#### Errore: "Database WordPress non trovato"

```bash
# Verifica che il database sia stato importato
mysql -u root -p -e "SHOW DATABASES;"

# Dovresti vedere 'buywithdali_wp'
# Se manca, importa:
mysql -u root -p buywithdali_wp < old/buywithdali.sql
```

#### Errore: "Custom field non trovato"

```bash
# Trova i nomi reali dei custom fields
mysql -u root -p buywithdali_wp

SELECT DISTINCT meta_key 
FROM wp_postmeta 
WHERE post_id IN (
    SELECT ID FROM wp_posts WHERE post_type = 'property' LIMIT 1
);

# Aggiorna $fieldMapping in migrate.php con i nomi corretti
```

#### Proprietà senza immagini

```bash
# Verifica che le immagini esistano in WordPress
SELECT p.ID, p.post_title, pm.meta_value as thumbnail_id
FROM wp_posts p
LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
WHERE p.post_type = 'property';

# Se thumbnail_id è NULL, WordPress non ha featured image impostate
```

#### Path immagini non corretti

```bash
# Aggiorna i path manualmente
UPDATE photogallery 
SET image_url = CONCAT('https://newdomain.com/uploads/', 
                       SUBSTRING_INDEX(image_url, '/', -1));
```

### 8. Post-Migrazione

#### 8.1 Cleanup

Dopo aver verificato che tutto funzioni:

```bash
# Rimuovi database WordPress temporaneo
mysql -u root -p -e "DROP DATABASE buywithdali_wp;"

# Rimuovi file SQL (opzionale, tieni backup)
# rm old/buywithdali.sql
```

#### 8.2 Aggiorna Slug SEO

Se vuoi mantenere gli stessi URL del vecchio sito:

```sql
-- Verifica gli slug WordPress originali
SELECT ID, post_name FROM wp_posts WHERE post_type = 'property';

-- Aggiorna in Dalila per mantenere URL identici
UPDATE properties 
SET slug = (
    SELECT post_name 
    FROM wp_posts_backup 
    WHERE ID = properties.wp_post_id
)
WHERE wp_post_id IS NOT NULL;
```

## Differenza con Prisma

Hai menzionato Prisma - ecco le differenze:

### Prisma (Next.js/Node.js)
```javascript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.property.createMany({
    data: properties
  })
}

main()
```

### PHP (Dalila - senza ORM)
```php
// BE/database/migrate.php
$db = new PDO("mysql:host=...");

$stmt = $db->prepare("INSERT INTO properties (...) VALUES (...)");
$stmt->execute($data);
```

**Stessa logica, sintassi diversa**:
- Prisma = TypeScript + ORM (Object-Relational Mapping)
- Dalila = PHP + PDO (PHP Data Objects)
- Entrambi eseguono INSERT nel database
- Entrambi possono fare batch imports

## Conclusione

La migrazione da WordPress a Dalila:
1. ✅ Mantiene tutti i dati esistenti
2. ✅ Adatta al nuovo schema semplificato
3. ✅ Non tocca WordPress (solo lettura)
4. ✅ Log completo di tutte le operazioni
5. ✅ Reversibile (mantieni backup)

Per domande specifiche sulla struttura del tuo WordPress, esegui:
```bash
mysql -u root -p buywithdali_wp -e "SHOW TABLES;"
```

E inviami l'output per aiuto nella personalizzazione dello script.
