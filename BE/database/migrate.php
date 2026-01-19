<?php
/**
 * Script di Migrazione da WordPress a Dalila DB
 * 
 * Questo script migra i dati dal database WordPress al nuovo schema Dalila.
 * Importa: proprietà, immagini, blog posts, e altri contenuti.
 * 
 * UTILIZZO:
 * 1. Esporta il database WordPress in old/buywithdali.sql
 * 2. Configura le credenziali database in .env
 * 3. Esegui: php BE/database/migrate.php
 */

require_once __DIR__ . '/../config/database.php';

class WordPressMigration {
    private $wpDb;
    private $daliDb;
    private $logFile;
    
    // Mappatura custom fields WordPress -> campi Dalila
    private $fieldMapping = [
        'price' => 'wpcf-prezzo',
        'bedrooms' => 'wpcf-camere',
        'bathrooms' => 'wpcf-bagni',
        'sqft' => 'wpcf-superficie',
        'address' => 'wpcf-indirizzo',
        'city' => 'wpcf-citta',
        'zip_code' => 'wpcf-cap',
        'year_built' => 'wpcf-anno-costruzione',
        'property_type' => 'wpcf-tipologia',
    ];
    
    public function __construct() {
        $this->logFile = __DIR__ . '/migration_' . date('Y-m-d_H-i-s') . '.log';
        $this->log("=== Inizio Migrazione WordPress -> Dalila ===\n");
        
        // Connessione al database Dalila
        try {
            $this->daliDb = Database::getInstance()->getConnection();
            $this->log("✓ Connesso al database Dalila");
        } catch (Exception $e) {
            $this->log("✗ ERRORE connessione Dalila: " . $e->getMessage());
            exit(1);
        }
        
        // Connessione al database WordPress (stesso server, database diverso)
        try {
            $wpDbName = getenv('WP_DB_NAME') ?: 'buywithdali_wp';
            $this->wpDb = new PDO(
                "mysql:host=" . getenv('DB_HOST') . ";dbname=" . $wpDbName,
                getenv('DB_USER'),
                getenv('DB_PASSWORD'),
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            $this->log("✓ Connesso al database WordPress: $wpDbName");
        } catch (PDOException $e) {
            $this->log("✗ ERRORE connessione WordPress: " . $e->getMessage());
            $this->log("  Assicurati che il database WordPress sia stato importato");
            exit(1);
        }
    }
    
    /**
     * Esegue la migrazione completa
     */
    public function migrate() {
        $this->log("\n--- Inizio processo di migrazione ---\n");
        
        try {
            // 1. Migra proprietà
            $this->log("\n1. Migrazione Proprietà...");
            $this->migrateProperties();
            
            // 2. Migra immagini gallerie
            $this->log("\n2. Migrazione Fotogallerie...");
            $this->migrateImages();
            
            // 3. Migra blog posts (optional)
            $this->log("\n3. Migrazione Blog Posts...");
            $this->migrateBlogPosts();
            
            // 4. Migra amenities/features
            $this->log("\n4. Migrazione Amenities...");
            $this->migrateAmenities();
            
            $this->log("\n=== Migrazione Completata con Successo ===");
            $this->printStats();
            
        } catch (Exception $e) {
            $this->log("\n✗ ERRORE CRITICO: " . $e->getMessage());
            $this->log("Traceback: " . $e->getTraceAsString());
            exit(1);
        }
    }
    
    /**
     * Migra le proprietà da wp_posts (post_type='property')
     */
    private function migrateProperties() {
        // Query WordPress: cerca tutti i post di tipo 'property' pubblicati
        $sql = "SELECT p.ID, p.post_title, p.post_content, p.post_excerpt, 
                       p.post_date, p.post_status
                FROM wp_posts p
                WHERE p.post_type = 'property' 
                  AND p.post_status = 'publish'
                ORDER BY p.post_date DESC";
        
        $stmt = $this->wpDb->query($sql);
        $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $this->log("  Trovate " . count($properties) . " proprietà in WordPress");
        
        $imported = 0;
        $skipped = 0;
        
        foreach ($properties as $wpProperty) {
            try {
                // Recupera custom fields (meta)
                $meta = $this->getPostMeta($wpProperty['ID']);
                
                // Genera slug dal titolo
                $slug = $this->generateSlug($wpProperty['post_title']);
                
                // Prepara i dati per Dalila
                $propertyData = [
                    'title' => $wpProperty['post_title'],
                    'slug' => $slug,
                    'description' => $wpProperty['post_content'] ?: $wpProperty['post_excerpt'],
                    'price' => $this->extractMeta($meta, $this->fieldMapping['price']),
                    'bedrooms' => $this->extractMeta($meta, $this->fieldMapping['bedrooms'], 0),
                    'bathrooms' => $this->extractMeta($meta, $this->fieldMapping['bathrooms'], 0),
                    'sqft' => $this->extractMeta($meta, $this->fieldMapping['sqft'], 0),
                    'address' => $this->extractMeta($meta, $this->fieldMapping['address']),
                    'city' => $this->extractMeta($meta, $this->fieldMapping['city']),
                    'state' => 'FL', // Default Florida
                    'zip_code' => $this->extractMeta($meta, $this->fieldMapping['zip_code']),
                    'property_type' => $this->extractMeta($meta, $this->fieldMapping['property_type'], 'residential'),
                    'status' => 'active',
                    'featured' => 0,
                    'year_built' => $this->extractMeta($meta, $this->fieldMapping['year_built']),
                    'wp_post_id' => $wpProperty['ID'] // Mantieni riferimento
                ];
                
                // Inserisci in Dalila
                $insertSql = "INSERT INTO properties (
                    title, slug, description, price, bedrooms, bathrooms, 
                    sqft, address, city, state, zip_code, property_type, 
                    status, featured, year_built, created_at
                ) VALUES (
                    :title, :slug, :description, :price, :bedrooms, :bathrooms,
                    :sqft, :address, :city, :state, :zip_code, :property_type,
                    :status, :featured, :year_built, NOW()
                )";
                
                $insertStmt = $this->daliDb->prepare($insertSql);
                $insertStmt->execute($propertyData);
                
                $newPropertyId = $this->daliDb->lastInsertId();
                
                $this->log("  ✓ Importata: '{$propertyData['title']}' (ID: $newPropertyId, WP ID: {$wpProperty['ID']})");
                $imported++;
                
                // Salva mapping per le immagini
                $this->propertyMapping[$wpProperty['ID']] = $newPropertyId;
                
            } catch (Exception $e) {
                $this->log("  ✗ Errore importando '{$wpProperty['post_title']}': " . $e->getMessage());
                $skipped++;
            }
        }
        
        $this->log("\n  Risultato: $imported importate, $skipped saltate");
    }
    
    /**
     * Migra le immagini dalle gallerie WordPress
     */
    private function migrateImages() {
        if (empty($this->propertyMapping)) {
            $this->log("  Nessuna proprietà da mappare");
            return;
        }
        
        $imported = 0;
        $skipped = 0;
        
        foreach ($this->propertyMapping as $wpPostId => $daliPropertyId) {
            // Recupera featured image
            $featuredImageId = $this->getPostMeta($wpPostId)['_thumbnail_id'] ?? null;
            
            if ($featuredImageId) {
                $imageUrl = $this->getAttachmentUrl($featuredImageId);
                if ($imageUrl) {
                    $this->insertImage($daliPropertyId, $imageUrl, 0, true); // is_primary = true
                    $imported++;
                }
            }
            
            // Recupera galleria (se usi un plugin come ACF Gallery)
            $galleryMeta = $this->getPostMeta($wpPostId)['wpcf-gallery'] ?? null;
            if ($galleryMeta) {
                $imageIds = explode(',', $galleryMeta);
                $order = 1;
                
                foreach ($imageIds as $imageId) {
                    $imageUrl = $this->getAttachmentUrl(trim($imageId));
                    if ($imageUrl) {
                        $this->insertImage($daliPropertyId, $imageUrl, $order);
                        $order++;
                        $imported++;
                    }
                }
            }
        }
        
        $this->log("\n  Risultato: $imported immagini importate, $skipped saltate");
    }
    
    /**
     * Migra i blog posts (opzionale - se vuoi tenere il blog)
     */
    private function migrateBlogPosts() {
        $this->log("  Migrazione blog posts non implementata (opzionale)");
        $this->log("  Se necessario, creare tabella 'blog_posts' e implementare la logica");
    }
    
    /**
     * Migra amenities/features delle proprietà
     */
    private function migrateAmenities() {
        $this->log("  Migrazione amenities non implementata");
        $this->log("  Implementare se WordPress ha custom fields per amenities");
    }
    
    // === UTILITY METHODS ===
    
    /**
     * Recupera tutti i meta fields di un post
     */
    private function getPostMeta($postId) {
        $sql = "SELECT meta_key, meta_value FROM wp_postmeta WHERE post_id = ?";
        $stmt = $this->wpDb->prepare($sql);
        $stmt->execute([$postId]);
        
        $meta = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $meta[$row['meta_key']] = $row['meta_value'];
        }
        
        return $meta;
    }
    
    /**
     * Estrae un valore dai meta fields
     */
    private function extractMeta($meta, $key, $default = null) {
        return $meta[$key] ?? $default;
    }
    
    /**
     * Genera slug da titolo
     */
    private function generateSlug($title) {
        $slug = strtolower(trim($title));
        $slug = preg_replace('/[^a-z0-9-]/', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        return trim($slug, '-');
    }
    
    /**
     * Recupera URL di un attachment WordPress
     */
    private function getAttachmentUrl($attachmentId) {
        $sql = "SELECT guid FROM wp_posts WHERE ID = ? AND post_type = 'attachment'";
        $stmt = $this->wpDb->prepare($sql);
        $stmt->execute([$attachmentId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['guid'] ?? null;
    }
    
    /**
     * Inserisce un'immagine nel database Dalila
     */
    private function insertImage($propertyId, $imageUrl, $order = 0, $isPrimary = false) {
        // Scarica l'immagine dal vecchio WordPress e salvala localmente
        // O salva solo l'URL se le immagini sono ancora accessibili
        
        $sql = "INSERT INTO photogallery (property_id, image_url, display_order, is_primary, created_at)
                VALUES (?, ?, ?, ?, NOW())";
        
        $stmt = $this->daliDb->prepare($sql);
        $stmt->execute([$propertyId, $imageUrl, $order, $isPrimary ? 1 : 0]);
    }
    
    /**
     * Log delle operazioni
     */
    private function log($message) {
        echo $message . "\n";
        file_put_contents($this->logFile, $message . "\n", FILE_APPEND);
    }
    
    /**
     * Stampa statistiche finali
     */
    private function printStats() {
        $this->log("\n--- Statistiche Finali ---");
        
        // Conta proprietà
        $stmt = $this->daliDb->query("SELECT COUNT(*) as total FROM properties");
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        $this->log("Proprietà totali in Dalila: $count");
        
        // Conta immagini
        $stmt = $this->daliDb->query("SELECT COUNT(*) as total FROM photogallery");
        $count = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        $this->log("Immagini totali in Dalila: $count");
        
        $this->log("\nLog completo salvato in: " . $this->logFile);
    }
    
    private $propertyMapping = []; // WP post_id => Dalila property_id
}

// === ESECUZIONE SCRIPT ===

if (php_sapi_name() !== 'cli') {
    die("Questo script deve essere eseguito da command line\n");
}

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║   MIGRAZIONE WORDPRESS → DALILA DATABASE                  ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n";
echo "\n";

// Verifica che il file SQL WordPress esista
$wpSqlFile = __DIR__ . '/../../old/buywithdali.sql';
if (!file_exists($wpSqlFile)) {
    echo "⚠️  ATTENZIONE: File SQL WordPress non trovato:\n";
    echo "   $wpSqlFile\n\n";
    echo "   Per procedere:\n";
    echo "   1. Esporta il database WordPress\n";
    echo "   2. Salvalo come: old/buywithdali.sql\n";
    echo "   3. Ri-esegui questo script\n\n";
    exit(1);
}

// Conferma dall'utente
echo "Questo script:\n";
echo "  1. Legge i dati dal database WordPress (old/buywithdali.sql)\n";
echo "  2. Migra proprietà, immagini, e contenuti al nuovo database Dalila\n";
echo "  3. Mantiene il database WordPress intatto (solo lettura)\n\n";

echo "⚠️  IMPORTANTE:\n";
echo "  - Assicurati di aver importato il dump WordPress in un database separato\n";
echo "  - Il database Dalila deve già esistere (usa init.sql prima)\n";
echo "  - Configura WP_DB_NAME in .env (default: buywithdali_wp)\n\n";

echo "Vuoi continuare? (y/N): ";
$handle = fopen("php://stdin", "r");
$line = trim(fgets($handle));
fclose($handle);

if (strtolower($line) !== 'y') {
    echo "\nMigrazione annullata.\n";
    exit(0);
}

echo "\n🚀 Avvio migrazione...\n\n";

// Esegui migrazione
$migration = new WordPressMigration();
$migration->migrate();

echo "\n✅ Migrazione completata!\n\n";
