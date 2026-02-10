<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/SitemapService.php';
require_once __DIR__ . '/../lib/RedirectService.php';

class PropertyController {
    private $db;
    private $conn;
    private $sitemapService;
    private $redirectService;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->sitemapService = new SitemapService($this->conn);
        $this->redirectService = new RedirectService($this->conn);
    }

    /**
     * Get all properties with optional filters
     * @param array $filters Filter parameters
     * @return array
     */
    public function getAll($filters = []) {
        try {
            $where = [];
            $params = [];
            $types = '';

            // is_active filter (admin can see all, public sees only active)
            if (isset($filters['is_active'])) {
                if ($filters['is_active'] !== 'all') {
                    $where[] = "is_active = ?";
                    $params[] = ($filters['is_active'] === 'true' || $filters['is_active'] === '1') ? 1 : 0;
                    $types .= 'i';
                }
            } else {
                // Default for public: only active
                $where[] = "is_active = 1";
            }

            // Property Type filter
            if (!empty($filters['property_type'])) {
                $where[] = "property_type = ?";
                $params[] = $filters['property_type'];
                $types .= 's';
            }

            // Status filter
            if (!empty($filters['status'])) {
                $where[] = "status = ?";
                $params[] = $filters['status'];
                $types .= 's';
            }

            // Category filter (cerca sia in property_category che in property_categories)
            if (!empty($filters['property_category'])) {
                $where[] = "(property_category = ? OR EXISTS (
                    SELECT 1 FROM property_categories pc 
                    WHERE pc.property_id = properties.id 
                    AND pc.category = ?
                ))";
                $params[] = $filters['property_category'];
                $params[] = $filters['property_category'];
                $types .= 'ss';
            }

            // City filter
            if (!empty($filters['city'])) {
                $where[] = "city = ?";
                $params[] = $filters['city'];
                $types .= 's';
            }

            // Country filter
            if (!empty($filters['country'])) {
                $where[] = "country = ?";
                $params[] = $filters['country'];
                $types .= 's';
            }

            // Price range filters
            if (!empty($filters['min_price'])) {
                $where[] = "price_usd >= ?";
                $params[] = $filters['min_price'];
                $types .= 'd';
            }

            if (!empty($filters['max_price'])) {
                $where[] = "price_usd <= ?";
                $params[] = $filters['max_price'];
                $types .= 'd';
            }

            // Bedrooms filter
            if (!empty($filters['bedrooms'])) {
                $where[] = "bedrooms = ?";
                $params[] = $filters['bedrooms'];
                $types .= 's';
            }

            // Bathrooms filter
            if (!empty($filters['bathrooms'])) {
                $where[] = "bathrooms >= ?";
                $params[] = $filters['bathrooms'];
                $types .= 's';
            }

            // SQM range filters
            if (!empty($filters['min_sqm'])) {
                $where[] = "sqm >= ?";
                $params[] = (float)$filters['min_sqm'];
                $types .= 'd';
            }

            if (!empty($filters['max_sqm'])) {
                $where[] = "sqm <= ?";
                $params[] = (float)$filters['max_sqm'];
                $types .= 'd';
            }

            // Furnishing status filter
            if (!empty($filters['furnishing_status'])) {
                $where[] = "furnishing_status = ?";
                $params[] = $filters['furnishing_status'];
                $types .= 's';
            }

            // Neighborhood filter
            if (!empty($filters['neighborhood'])) {
                $where[] = "neighborhood = ?";
                $params[] = $filters['neighborhood'];
                $types .= 's';
            }

            // Featured filter
            if (isset($filters['featured']) && $filters['featured'] === '1') {
                $where[] = "featured = 1";
            }

            // Show in home filter
            if (isset($filters['show_in_home']) && $filters['show_in_home'] === '1') {
                $where[] = "show_in_home = 1";
            }

            // Tags filter (JSON_CONTAINS) - supports multiple tags with AND logic
            if (!empty($filters['tags'])) {
                $tagsArray = is_array($filters['tags']) ? $filters['tags'] : explode(',', $filters['tags']);
                foreach ($tagsArray as $tag) {
                    $where[] = "JSON_CONTAINS(tags, ?)";
                    $params[] = json_encode(trim($tag));
                    $types .= 's';
                }
            }

            // Search filter (title, subtitle, description, neighborhood, city, country, tags)
            if (!empty($filters['q'])) {
                $where[] = "(title LIKE ? OR subtitle LIKE ? OR description LIKE ? OR neighborhood LIKE ? OR city LIKE ? OR country LIKE ? OR JSON_SEARCH(tags, 'one', ?) IS NOT NULL)";
                $searchTerm = '%' . $filters['q'] . '%';
                array_push($params, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, '%' . $filters['q'] . '%');
                $types .= 'sssssss';
            }

            // Build query
            $whereClause = empty($where) ? '1=1' : implode(' AND ', $where);
            
            // Order by (sortable)
            $allowedSortFields = ['price_usd', 'created_at', 'sqm', 'bedrooms', 'title', 'order'];
            $sortField = 'created_at';
            $sortDir = 'DESC';
            
            if (!empty($filters['sort_by']) && in_array($filters['sort_by'], $allowedSortFields)) {
                $sortField = $filters['sort_by'];
            }
            if (!empty($filters['sort_dir']) && in_array(strtoupper($filters['sort_dir']), ['ASC', 'DESC'])) {
                $sortDir = strtoupper($filters['sort_dir']);
            }
            
            // Default order: featured first, then by order field, then by sort field
            $orderBy = "ORDER BY featured DESC, `order` ASC, `$sortField` $sortDir";
            
            $query = "SELECT id, property_id_reference, slug, title, subtitle, property_type, status, 
                     property_category, description, price_usd, price_mxn, price_eur, price_on_demand, 
                     price_base_currency, exchange_rate, price_from_usd, price_to_usd, 
                     price_from_mxn, price_to_mxn, price_from_eur, price_to_eur, bedrooms, bedrooms_min, bedrooms_max,
                     bathrooms, bathrooms_min, bathrooms_max, sqm, sqft, sqm_min, sqm_max, sqft_min, sqft_max, furnishing_status, 
                     neighborhood, city, country, latitude, longitude, tags, is_active, featured, show_in_home, `order`, views_count,
                     created_at, updated_at
                     FROM properties 
                     WHERE $whereClause 
                     $orderBy
                     LIMIT ? OFFSET ?";

            // Add pagination
            $page = isset($filters['page']) ? (int)$filters['page'] : 1;
            $perPage = isset($filters['per_page']) ? (int)$filters['per_page'] : 20;
            $offset = ($page - 1) * $perPage;
            
            $params[] = $perPage;
            $params[] = $offset;
            $types .= 'ii';

            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to fetch properties');
            }

            $properties = [];
            while ($row = $result->fetch_assoc()) {
                $property = $this->formatProperty($row);
                
                // Always load property_categories from table
                $property['property_categories'] = $this->loadPropertyCategories($property['id']);
                // Fallback: if table is empty but column has value (legacy), synthesize array
                if (empty($property['property_categories']) && !empty($property['property_category'])) {
                    $property['property_categories'] = [$property['property_category']];
                }
                
                $properties[] = $property;
            }

            // Get total count
            $countQuery = "SELECT COUNT(*) as total FROM properties WHERE $whereClause";
            $countParams = array_slice($params, 0, -2);
            $countTypes = substr($types, 0, -2);
            $countResult = empty($countParams)
                ? $this->conn->query($countQuery)
                : $this->db->executePrepared($countQuery, $countParams, $countTypes);
            
            $total = $countResult->fetch_assoc()['total'];

            return $this->successResponse([
                'properties' => $properties,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'total_pages' => ceil($total / $perPage)
                ]
            ]);

        } catch (Exception $e) {
            error_log("Error fetching properties: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Get property by ID or slug (with full details including photos)
     * @param mixed $identifier Property ID or slug
     * @return array
     */
    public function getById($identifier) {
        try {
            // Determine if identifier is ID or slug
            $isId = is_numeric($identifier);
            $field = $isId ? 'id' : 'slug';
            
            // For slug-based access (public): only show active properties
            // For ID-based access (admin): show all properties
            $activeFilter = $isId ? '' : ' AND is_active = 1';
            
            $query = "SELECT * FROM properties WHERE $field = ?$activeFilter LIMIT 1";
            $result = $this->db->executePrepared($query, [$identifier], $isId ? 'i' : 's');

            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Property not found', 404);
            }

            $property = $result->fetch_assoc();

            // Always load property_categories from table
            $property['property_categories'] = $this->loadPropertyCategories($property['id']);
            // Fallback: if table is empty but column has value (legacy), synthesize array
            if (empty($property['property_categories']) && !empty($property['property_category'])) {
                $property['property_categories'] = [$property['property_category']];
            }

            // Get photos
            $photosQuery = "SELECT id, filename, url, alt_text, 
                           is_cover, `order`
                           FROM property_photos 
                           WHERE property_id = ? 
                           ORDER BY `order` ASC, id ASC";
            $photosResult = $this->db->executePrepared($photosQuery, [$property['id']], 'i');
            $photos = [];
            while ($row = $photosResult->fetch_assoc()) {
                $photos[] = $this->formatPhoto($row);
            }

            $property['photos'] = $photos;

            // Increment views counter
            if (!$isId) { // Only increment for public slug access
                $this->incrementViews($property['id']);
            }

            return $this->successResponse($this->formatProperty($property, true));

        } catch (Exception $e) {
            error_log("Error fetching property: " . $e->getMessage());
            return $this->errorResponse('PROPERTY_ERROR: ' . $e->getMessage() . ' | Line: ' . $e->getLine());
        }
    }

    /**
     * Create new property
     * @param array $data Property data
     * @param int $userId User ID
     * @return array
     */
    public function create($data, $userId) {
        try {
            // Validate required fields
            $validation = $this->validatePropertyData($data, false);
            if ($validation !== true) {
                return $this->errorResponse($validation, 400);
            }

            // Generate slug
            $slug = $this->generateSlug($data['title']);

            // Build dynamic INSERT query based on provided fields
            $fields = ['slug', 'title', 'property_type', 'city'];
            $params = [$slug, $data['title'], $data['property_type'], $data['city']];
            $types = 'ssss';

            // Optional fields - only add if provided
            if (isset($data['subtitle']) && $data['subtitle'] !== '') {
                $fields[] = 'subtitle';
                $params[] = $data['subtitle'];
                $types .= 's';
            }

            if (isset($data['property_category']) && $data['property_category'] !== '') {
                $fields[] = 'property_category';
                $params[] = $data['property_category'];
                $types .= 's';
            }

            if (isset($data['status']) && $data['status'] !== '') {
                $fields[] = 'status';
                $params[] = $data['status'];
                $types .= 's';
            }

            if (isset($data['description']) && $data['description'] !== '') {
                $fields[] = 'description';
                $params[] = $data['description'];
                $types .= 's';
            }

            if (isset($data['content']) && $data['content'] !== '') {
                $fields[] = 'content';
                $params[] = $data['content'];
                $types .= 's';
            }

            // Price fields
            if (isset($data['price_base_currency']) && $data['price_base_currency'] !== '') {
                $fields[] = 'price_base_currency';
                $params[] = $data['price_base_currency'];
                $types .= 's';
            }

            if (isset($data['price_on_demand'])) {
                $fields[] = 'price_on_demand';
                $params[] = $data['price_on_demand'] ? 1 : 0;
                $types .= 'i';
            }

            if (isset($data['price_negotiable'])) {
                $fields[] = 'price_negotiable';
                $params[] = $data['price_negotiable'] ? 1 : 0;
                $types .= 'i';
            }

            if (isset($data['price_usd']) && $data['price_usd'] !== null && $data['price_usd'] !== '') {
                $fields[] = 'price_usd';
                $params[] = (float)$data['price_usd'];
                $types .= 'd';
            }

            if (isset($data['price_mxn']) && $data['price_mxn'] !== null && $data['price_mxn'] !== '') {
                $fields[] = 'price_mxn';
                $params[] = (float)$data['price_mxn'];
                $types .= 'd';
            }

            if (isset($data['price_eur']) && $data['price_eur'] !== null && $data['price_eur'] !== '') {
                $fields[] = 'price_eur';
                $params[] = (float)$data['price_eur'];
                $types .= 'd';
            }

            if (isset($data['exchange_rate']) && $data['exchange_rate'] !== null) {
                $fields[] = 'exchange_rate';
                $params[] = (float)$data['exchange_rate'];
                $types .= 'd';
            }

            if (isset($data['price_from_usd']) && $data['price_from_usd'] !== null) {
                $fields[] = 'price_from_usd';
                $params[] = (float)$data['price_from_usd'];
                $types .= 'd';
            }

            if (isset($data['price_to_usd']) && $data['price_to_usd'] !== null) {
                $fields[] = 'price_to_usd';
                $params[] = (float)$data['price_to_usd'];
                $types .= 'd';
            }

            if (isset($data['price_from_mxn']) && $data['price_from_mxn'] !== null) {
                $fields[] = 'price_from_mxn';
                $params[] = (float)$data['price_from_mxn'];
                $types .= 'd';
            }

            if (isset($data['price_to_mxn']) && $data['price_to_mxn'] !== null) {
                $fields[] = 'price_to_mxn';
                $params[] = (float)$data['price_to_mxn'];
                $types .= 'd';
            }

            if (isset($data['price_from_eur']) && $data['price_from_eur'] !== null) {
                $fields[] = 'price_from_eur';
                $params[] = (float)$data['price_from_eur'];
                $types .= 'd';
            }

            if (isset($data['price_to_eur']) && $data['price_to_eur'] !== null) {
                $fields[] = 'price_to_eur';
                $params[] = (float)$data['price_to_eur'];
                $types .= 'd';
            }

            // Property details
            if (isset($data['bedrooms']) && $data['bedrooms'] !== '') {
                $fields[] = 'bedrooms';
                $params[] = $data['bedrooms'];
                $types .= 's';
            }

            if (isset($data['bedrooms_min']) && $data['bedrooms_min'] !== '') {
                $fields[] = 'bedrooms_min';
                $params[] = $data['bedrooms_min'];
                $types .= 's';
            }

            if (isset($data['bedrooms_max']) && $data['bedrooms_max'] !== '') {
                $fields[] = 'bedrooms_max';
                $params[] = $data['bedrooms_max'];
                $types .= 's';
            }

            if (isset($data['bathrooms']) && $data['bathrooms'] !== '') {
                $fields[] = 'bathrooms';
                $params[] = $data['bathrooms'];
                $types .= 's';
            }

            if (isset($data['bathrooms_min']) && $data['bathrooms_min'] !== '') {
                $fields[] = 'bathrooms_min';
                $params[] = $data['bathrooms_min'];
                $types .= 's';
            }

            if (isset($data['bathrooms_max']) && $data['bathrooms_max'] !== '') {
                $fields[] = 'bathrooms_max';
                $params[] = $data['bathrooms_max'];
                $types .= 's';
            }

            if (isset($data['sqm']) && $data['sqm'] !== null) {
                $fields[] = 'sqm';
                $params[] = (float)$data['sqm'];
                $types .= 'd';
            }

            if (isset($data['sqft']) && $data['sqft'] !== null) {
                $fields[] = 'sqft';
                $params[] = (float)$data['sqft'];
                $types .= 'd';
            }

            if (isset($data['sqm_min']) && $data['sqm_min'] !== null) {
                $fields[] = 'sqm_min';
                $params[] = (float)$data['sqm_min'];
                $types .= 'd';
            }

            if (isset($data['sqm_max']) && $data['sqm_max'] !== null) {
                $fields[] = 'sqm_max';
                $params[] = (float)$data['sqm_max'];
                $types .= 'd';
            }

            if (isset($data['sqft_min']) && $data['sqft_min'] !== null) {
                $fields[] = 'sqft_min';
                $params[] = (float)$data['sqft_min'];
                $types .= 'd';
            }

            if (isset($data['sqft_max']) && $data['sqft_max'] !== null) {
                $fields[] = 'sqft_max';
                $params[] = (float)$data['sqft_max'];
                $types .= 'd';
            }

            if (isset($data['lot_size_sqm']) && $data['lot_size_sqm'] !== null) {
                $fields[] = 'lot_size_sqm';
                $params[] = (float)$data['lot_size_sqm'];
                $types .= 'd';
            }

            if (isset($data['year_built']) && $data['year_built'] !== null) {
                $fields[] = 'year_built';
                $params[] = (int)$data['year_built'];
                $types .= 'i';
            }

            if (isset($data['furnishing_status']) && $data['furnishing_status'] !== '') {
                $fields[] = 'furnishing_status';
                $params[] = $data['furnishing_status'];
                $types .= 's';
            }

            // Location fields
            if (isset($data['neighborhood']) && $data['neighborhood'] !== '') {
                $fields[] = 'neighborhood';
                $params[] = $data['neighborhood'];
                $types .= 's';
            }

            if (isset($data['state']) && $data['state'] !== '') {
                $fields[] = 'state';
                $params[] = $data['state'];
                $types .= 's';
            }

            if (isset($data['country']) && $data['country'] !== '') {
                $fields[] = 'country';
                $params[] = $data['country'];
                $types .= 's';
            } else {
                $fields[] = 'country';
                $params[] = 'Mexico';
                $types .= 's';
            }

            if (isset($data['address']) && $data['address'] !== '') {
                $fields[] = 'address';
                $params[] = $data['address'];
                $types .= 's';
            }

            if (isset($data['latitude']) && $data['latitude'] !== null) {
                $fields[] = 'latitude';
                $params[] = (float)$data['latitude'];
                $types .= 'd';
            }

            if (isset($data['longitude']) && $data['longitude'] !== null) {
                $fields[] = 'longitude';
                $params[] = (float)$data['longitude'];
                $types .= 'd';
            }

            if (isset($data['google_maps_url']) && $data['google_maps_url'] !== '') {
                $fields[] = 'google_maps_url';
                $params[] = $data['google_maps_url'];
                $types .= 's';
            }

            // Tags (always include as JSON)
            $fields[] = 'tags';
            $params[] = isset($data['tags']) ? json_encode($data['tags']) : json_encode([]);
            $types .= 's';

            // SEO fields
            if (isset($data['seo_title']) && $data['seo_title'] !== '') {
                $fields[] = 'seo_title';
                $params[] = $data['seo_title'];
                $types .= 's';
            }

            if (isset($data['seo_description']) && $data['seo_description'] !== '') {
                $fields[] = 'seo_description';
                $params[] = $data['seo_description'];
                $types .= 's';
            }

            if (isset($data['og_title']) && $data['og_title'] !== '') {
                $fields[] = 'og_title';
                $params[] = $data['og_title'];
                $types .= 's';
            }

            if (isset($data['og_description']) && $data['og_description'] !== '') {
                $fields[] = 'og_description';
                $params[] = $data['og_description'];
                $types .= 's';
            }

            // Visibility
            $fields[] = 'is_active';
            $params[] = isset($data['is_active']) && $data['is_active'] ? 1 : 0;
            $types .= 'i';

            $fields[] = 'featured';
            $params[] = isset($data['featured']) && $data['featured'] ? 1 : 0;
            $types .= 'i';

            $fields[] = 'show_in_home';
            $params[] = isset($data['show_in_home']) && $data['show_in_home'] ? 1 : 0;
            $types .= 'i';

            $fields[] = '`order`';
            $params[] = isset($data['order']) ? (int)$data['order'] : 0;
            $types .= 'i';

            if (isset($data['internal_notes']) && $data['internal_notes'] !== '') {
                $fields[] = 'internal_notes';
                $params[] = $data['internal_notes'];
                $types .= 's';
            }

            // Build query
            $placeholders = array_fill(0, count($fields), '?');
            $query = "INSERT INTO properties (" . implode(', ', $fields) . ") 
                     VALUES (" . implode(', ', $placeholders) . ")";

            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to create property');
            }

            $propertyId = $this->db->getLastInsertId();

            // Save property_categories for ALL types (unified: always an array)
            if (isset($data['property_categories']) && is_array($data['property_categories']) && !empty($data['property_categories'])) {
                $this->savePropertyCategories($propertyId, $data['property_categories']);
                // Sync property_category column = first element (backward compat)
                $firstCat = $data['property_categories'][0];
                $syncQuery = "UPDATE properties SET property_category = ? WHERE id = ?";
                $this->db->executePrepared($syncQuery, [$firstCat, $propertyId], 'si');
            }

            // Get the generated property_id_reference
            $idQuery = "SELECT property_id_reference FROM properties WHERE id = ?";
            $idResult = $this->db->executePrepared($idQuery, [$propertyId], 'i');
            $propertyIdRef = $idResult->fetch_assoc()['property_id_reference'];

            // Log activity
            $this->logActivity($userId, 'create', 'property', $propertyId, "Created property: {$data['title']}");

            // Regenerate sitemap
            $this->sitemapService->generateSitemap();

            return $this->successResponse([
                'id' => $propertyId,
                'property_id_reference' => $propertyIdRef,
                'slug' => $slug,
                'message' => 'Property created successfully'
            ], 201);

        } catch (Exception $e) {
            error_log("Error creating property: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Update property
     * @param int $id Property ID
     * @param array $data Property data
     * @param int $userId User ID
     * @return array
     */
    public function update($id, $data, $userId) {
        try {
            // Check if property exists and get current state
            $checkQuery = "SELECT id, slug, is_active, show_in_home FROM properties WHERE id = ? LIMIT 1";
            $checkResult = $this->db->executePrepared($checkQuery, [$id], 'i');

            if (!$checkResult || $checkResult->num_rows === 0) {
                return $this->errorResponse('Property not found', 404);
            }

            $existing = $checkResult->fetch_assoc();

            // Detect partial update (only is_active, featured, show_in_home, or order fields)
            $partialUpdateFields = ['is_active', 'featured', 'show_in_home', 'order'];
            $isPartialUpdate = count($data) <= 2 && 
                               count(array_diff(array_keys($data), $partialUpdateFields)) === 0;

            // Validazione logica: non si può avere show_in_home=true se is_active=false
            $currentIsActive = isset($data['is_active']) ? !empty($data['is_active']) : !empty($existing['is_active']);
            $newShowInHome = isset($data['show_in_home']) ? !empty($data['show_in_home']) : !empty($existing['show_in_home']);
            
            if ($newShowInHome && !$currentIsActive) {
                return $this->errorResponse('Cannot show in home: property must be published (is_active) first', 400);
            }
            
            // Se si disattiva is_active, disattivare anche show_in_home automaticamente
            if (isset($data['is_active']) && empty($data['is_active']) && !empty($existing['show_in_home'])) {
                $data['show_in_home'] = 0;
            }

            // Validate data (skip full validation for partial updates)
            $validation = $this->validatePropertyData($data, true, $isPartialUpdate);
            if ($validation !== true) {
                return $this->errorResponse($validation, 400);
            }

            // Build update query
            $updates = [];
            $params = [];
            $types = '';

            $allowedFields = [
                'title', 'subtitle', 'property_type', 'status', 'property_category',
                'description', 'content', 'price_usd', 'price_mxn', 'price_eur', 'exchange_rate', 
                'price_base_currency', 'price_on_demand', 'price_negotiable', 
                'price_from_usd', 'price_to_usd', 'price_from_mxn', 'price_to_mxn', 'price_from_eur', 'price_to_eur',
                'bedrooms', 'bedrooms_min', 'bedrooms_max', 
                'bathrooms', 'bathrooms_min', 'bathrooms_max',
                'sqm', 'sqft', 'sqm_min', 'sqm_max', 'sqft_min', 'sqft_max', 'lot_size_sqm', 'year_built', 
                'furnishing_status', 'neighborhood', 'city', 'state', 'country',
                'address', 'latitude', 'longitude', 'google_maps_url',
                'seo_title', 'seo_description', 'og_title', 'og_description',
                'is_active', 'featured', 'show_in_home', 'order', 'internal_notes'
            ];

            // Fields that should be NULL if empty/zero
            $nullableFields = [
                'bedrooms', 'bathrooms', 'furnishing_status', 'year_built',
                'sqm', 'sqft', 'sqm_min', 'sqm_max', 'sqft_min', 'sqft_max', 'lot_size_sqm', 
                'price_usd', 'price_mxn', 'price_eur', 'price_from_usd', 'price_to_usd',
                'price_from_mxn', 'price_to_mxn', 'price_from_eur', 'price_to_eur', 'latitude', 'longitude', 'exchange_rate'
            ];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "`$field` = ?";
                    
                    if ($field === 'is_active' || $field === 'featured' || $field === 'show_in_home' || $field === 'price_on_demand' || $field === 'price_negotiable') {
                        $params[] = !empty($data[$field]) ? 1 : 0;
                        $types .= 'i';
                    } else {
                        $value = $data[$field];
                        // Convert empty/null/zero values to NULL for nullable fields
                        if (in_array($field, $nullableFields) && ($value === '' || $value === null || $value === 0 || $value === '0')) {
                            $params[] = null;
                        } else if ($value === '' || $value === null) {
                            $params[] = null;
                        } else {
                            $params[] = $value;
                        }
                        $types .= $this->getParamType($field);
                    }
                }
            }

            // Handle tags separately (JSON)
            if (array_key_exists('tags', $data)) {
                $updates[] = "tags = ?";
                $params[] = is_array($data['tags']) ? json_encode($data['tags']) : $data['tags'];
                $types .= 's';
            }

            if (empty($updates)) {
                return $this->errorResponse('No valid fields to update', 400);
            }

            $params[] = $id;
            $types .= 'i';

            $query = "UPDATE properties SET " . implode(', ', $updates) . " WHERE id = ?";
            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to update property');
            }

            // Update property_categories for ALL types (unified: always an array)
            if (isset($data['property_categories']) && is_array($data['property_categories'])) {
                $this->savePropertyCategories($id, $data['property_categories']);
                // Sync property_category column = first element (backward compat)
                if (!empty($data['property_categories'])) {
                    $firstCat = $data['property_categories'][0];
                    $syncQuery = "UPDATE properties SET property_category = ? WHERE id = ?";
                    $this->db->executePrepared($syncQuery, [$firstCat, $id], 'si');
                } else {
                    $syncQuery = "UPDATE properties SET property_category = NULL WHERE id = ?";
                    $this->db->executePrepared($syncQuery, [$id], 'i');
                }
            }

            // Log activity
            $this->logActivity($userId, 'update', 'property', $id, "Updated property ID: $id");

            // Regenerate sitemap if slug or is_active changed
            if (isset($data['is_active']) || isset($data['title'])) {
                $this->sitemapService->generateSitemap();
            }

            return $this->successResponse(['message' => 'Property updated successfully']);

        } catch (Exception $e) {
            error_log("Error updating property: " . $e->getMessage());
            return $this->errorResponse('UPDATE_ERROR: ' . $e->getMessage() . ' | Line: ' . $e->getLine());
        }
    }

    /**
     * Delete property with redirect logic
     * @param int $id Property ID
     * @param int $userId User ID
     * @return array
     */
    public function delete($id, $userId) {
        try {
            // Fetch property details
            $fetch = $this->db->executePrepared(
                "SELECT slug, created_at FROM properties WHERE id = ? LIMIT 1",
                [$id],
                'i'
            );
            if (!$fetch || $fetch->num_rows === 0) {
                return $this->errorResponse('Property not found', 404);
            }
            $property = $fetch->fetch_assoc();

            // Calculate time difference
            $createdAt = new DateTime($property['created_at']);
            $now = new DateTime();
            $hoursDiff = ($now->getTimestamp() - $createdAt->getTimestamp()) / 3600;

            // If created < 24 hours ago, allow direct delete without redirect
            if ($hoursDiff < 24) {
                $query = "DELETE FROM properties WHERE id = ?";
                $result = $this->db->executePrepared($query, [$id], 'i');

                if (!$result) {
                    return $this->errorResponse('Failed to delete property');
                }

                $this->logActivity($userId, 'delete', 'property', $id, "Deleted property ID: $id (created < 24h)");
                
                // Regenerate sitemap
                $this->sitemapService->generateSitemap();
                
                return $this->successResponse(['message' => 'Property deleted permanently (created < 24h)']);
            }

            // If created > 24 hours ago, require redirect
            $urlOld = '/properties/' . $property['slug'];
            
            // Check if redirect already exists
            $existingRedirect = $this->redirectService->findByUrlOld($urlOld);
            if (!$existingRedirect) {
                // Create redirect placeholder with empty urlNew
                $redirectResult = $this->redirectService->create($urlOld, '');
                if (!$redirectResult['success']) {
                    return $this->errorResponse('Failed to create redirect placeholder. Please add redirect manually before deleting.', 400);
                }
            }

            // Now delete the property
            $query = "DELETE FROM properties WHERE id = ?";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if (!$result) {
                return $this->errorResponse('Failed to delete property');
            }

            $this->logActivity($userId, 'delete', 'property', $id, "Deleted property ID: $id and created redirect placeholder");

            // Regenerate sitemap
            $this->sitemapService->generateSitemap();

            return $this->successResponse([
                'message' => 'Property deleted. A redirect entry was created; please set the destination in Redirects section.',
                'redirect_required' => true
            ]);

        } catch (Exception $e) {
            error_log("Error deleting property: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Import property from JSON
     * @param array $jsonData Property data from JSON
     * @param int $userId User ID
     * @param bool $validateOnly Only validate without saving
     * @return array
     */
    public function importFromJson($jsonData, $userId, $validateOnly = false) {
        try {
            $jsonData = $this->normalizePropertyData($jsonData);

            // Validate JSON structure
            $validation = $this->validatePropertyData($jsonData, false);
            if ($validation !== true) {
                return $this->errorResponse($validation, 400);
            }

            // Validate tags array
            if (isset($jsonData['tags'])) {
                if (!is_array($jsonData['tags'])) {
                    return $this->errorResponse('Tags must be an array', 400);
                }
                if (count($jsonData['tags']) > 20) {
                    return $this->errorResponse('Maximum 20 tags allowed', 400);
                }
            }

            if ($validateOnly) {
                return $this->successResponse([
                    'valid' => true,
                    'message' => 'JSON is valid',
                    'preview' => [
                        'title' => $jsonData['title'] ?? 'N/A',
                        'property_type' => $jsonData['property_type'] ?? 'N/A',
                        'price_usd' => $jsonData['price_usd'] ?? 'N/A',
                        'city' => $jsonData['city'] ?? 'N/A'
                    ]
                ]);
            }

            // Create property
            return $this->create($jsonData, $userId);

        } catch (Exception $e) {
            error_log("Error importing JSON: " . $e->getMessage());
            return $this->errorResponse('Invalid JSON: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Export property as JSON
     * @param int $id Property ID
     * @return array
     */
    public function exportAsJson($id) {
        try {
            $result = $this->getById($id);
            
            if (!$result['success']) {
                return $result;
            }

            $property = $result['data'];
            
            // Remove internal fields
            unset($property['id'], $property['views_count'], $property['created_at'], $property['updated_at']);

            return $this->successResponse([
                'json' => json_encode($property, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                'property' => $property
            ]);

        } catch (Exception $e) {
            error_log("Error exporting JSON: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Get predefined tags list
     * @return array
     */
    public function getPredefinedTags() {
        $tags = [
            'Essential' => ['Furnished', 'Unfurnished', 'Semi-Furnished', 'Air Conditioning', 'Heating', 'Smart Home'],
            'Outdoor' => ['Garden', 'Balcony', 'Terrace', 'Rooftop Terrace', 'Private Patio', 'BBQ Area'],
            'Parking' => ['Parking', 'Covered Parking', 'Underground Parking', '2 Parking Spaces', 'EV Charging'],
            'Security' => ['Security 24/7', 'Gated Community', 'CCTV', 'Access Control', 'Intercom'],
            'Pools' => ['Pool', 'Private Pool', 'Rooftop Pool', 'Infinity Pool', 'Beach-like Pool', 'Kids Pool'],
            'Wellness' => ['Spa', 'Sauna', 'Jacuzzi', 'Steam Room', 'Massage Room'],
            'Fitness' => ['Gym', 'Yoga Studio', 'Tennis Court', 'Paddle Court', 'Basketball Court'],
            'Community' => ['Coworking Space', 'Playground', 'Pet Friendly', 'Business Center', 'Cinema Room', 'Game Room'],
            'Work' => ['Home Office', 'Study Room', 'Fiber Optic Internet', 'Conference Room'],
            'Sustainability' => ['Solar Panels', 'Rainwater Harvesting', 'Green Building', 'Energy Efficient'],
            'Views' => ['Ocean View', 'Beach Access', 'Lake View', 'Mountain View', 'Golf Course View', 'City View']
        ];

        return $this->successResponse($tags);
    }

    /**
     * Get popular tags (most used)
     * @param int $limit Number of tags to return
     * @return array
     */
    public function getPopularTags($limit = 20) {
        try {
            // This would require a more complex query to extract and count tags from JSON
            // For now, return the most common predefined tags
            $popularTags = [
                'Pool', 'Security 24/7', 'Ocean View', 'Gym', 'Parking', 
                'Beach Access', 'Air Conditioning', 'Gated Community',
                'Rooftop Terrace', 'Smart Home', 'Garden', 'Pet Friendly',
                'Balcony', 'Furnished', 'Fiber Optic Internet', 'Terrace',
                'BBQ Area', 'Coworking Space', 'CCTV', 'Private Pool'
            ];

            return $this->successResponse(array_slice($popularTags, 0, $limit));

        } catch (Exception $e) {
            error_log("Error fetching popular tags: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Validate property data
     * @param array $data Property data
     * @param bool $isUpdate Is this an update operation
     * @return mixed True if valid, error message string if invalid
     */
    private function normalizePropertyData($data) {
        if (!is_array($data)) {
            return $data;
        }

        $categoryMap = [
            'apartment' => 'apartment',
            'apartments' => 'apartment',
            'apt' => 'apartment',
            'flat' => 'apartment',
            'house' => 'house',
            'home' => 'house',
            'villa' => 'villa',
            'condo' => 'condo',
            'condominium' => 'condo',
            'condominiums' => 'condo',
            'penthouse' => 'penthouse',
            'penthouses' => 'penthouse',
            'land' => 'land',
            'plot' => 'land',
            'lot' => 'land',
            'commercial' => 'commercial',
        ];

        $furnishingMap = [
            'furnished' => 'furnished',
            'semi furnished' => 'semi-furnished',
            'semifurnished' => 'semi-furnished',
            'semi-furnished' => 'semi-furnished',
            'unfurnished' => 'unfurnished',
            'un-furnished' => 'unfurnished',
        ];

        $standardTags = [
            'Central Air Conditioning', 'Elevator', 'Laundry Area', 'Fireplace', 'Storage', 'Basement', 'Lobby',
            'Terrace', 'Balcony', 'Rooftop', 'Solarium', 'Garden', 'Zen Area', 'Hammock Area', 'Jungle Bar',
            'Parking', 'Garage', 'Underground Parking', 'Bike Parking', 'Motor Lobby', 'Electric Bicycles', 'Free Beach Shuttle',
            '24/7 Security', 'Controlled Access', 'CCTV', 'Perimeter Fence', 'Concierge 24/7',
            'Pool', 'Rooftop Pool', 'Beach-like Pool', 'Private Beach Club', 'Waterfront Access', 'Beach Access',
            'Spa', 'Sauna', 'Steam Room', 'Lockers', 'Temazcal', 'Yoga Studio', 'Meditation Room',
            'Gym', 'Jogging Track', 'Paddle Court', 'Pickleball Court', 'Tennis Court', 'Mini-golf', 'Pet Park',
            'Club House', 'Lounge', 'Cinema', 'Bar', 'Pub', 'Kids Playroom', 'Playground', 'Restaurant', 'Coffee Shop', 'Organic Market', 'Food Pavilion',
            'Co-working Space', 'Business Lounge',
            'Solar Panels', 'Rainwater Collection', 'Water Treatment', 'Eco-Friendly',
            'Golf View', 'Ocean View', 'City View', 'Mountain View', 'Lake View', 'Jungle View',
            'Pet Friendly', 'Furnished', 'Smart Home', 'Newly Renovated', 'Investment Opportunity', 'Beachfront', 'Gated Community', 'Walk to Beach',
        ];

        $tagMap = [];
        foreach ($standardTags as $tag) {
            $tagMap[strtolower($tag)] = $tag;
        }

        $normalizeCategory = function($value) use ($categoryMap) {
            if (!is_string($value)) return $value;
            $key = strtolower(trim($value));
            return $categoryMap[$key] ?? $key;
        };

        $normalizeStatus = function($value) {
            if (!is_string($value)) return $value;
            $v = strtolower(trim($value));
            $v = str_replace([' ', '-'], '_', $v);
            if ($v === 'forsale') $v = 'for_sale';
            return $v;
        };

        $normalizePropertyType = function($value) {
            if (!is_string($value)) return $value;
            $v = strtolower(trim($value));
            $v = str_replace([' ', '-'], '_', $v);
            if (in_array($v, ['active_property', 'active_properties', 'activeproperty'])) return 'active';
            if (in_array($v, ['new_development', 'new_developments', 'development'])) return 'development';
            return $v;
        };

        $normalizeBedrooms = function($value) use (&$normalizeBedrooms) {
            if ($value === null) return $value;
            if (is_string($value)) {
                $raw = strtolower(trim($value));
                if ($raw === 'studio' || $raw === '0') return 'studio';
                if (substr($raw, -1) === '+') return '5+';
                if (is_numeric($raw)) return $normalizeBedrooms((float)$raw);
                return $value;
            }
            if (is_numeric($value)) {
                $num = (float)$value;
                if ($num <= 0) return 'studio';
                if ($num >= 5) return '5+';
                $int = (int)$num;
                if ($int == $num && in_array($int, [1, 2, 3, 4], true)) return (string)$int;
            }
            return $value;
        };

        $normalizeBathrooms = function($value) use (&$normalizeBathrooms) {
            if ($value === null) return $value;
            if (is_string($value)) {
                $raw = trim($value);
                if (substr($raw, -1) === '+') return '5+';
                if (is_numeric($raw)) return $normalizeBathrooms((float)$raw);
                return $value;
            }
            if (is_numeric($value)) {
                $num = (float)$value;
                if ($num >= 5) return '5+';
                $allowed = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
                if (in_array($num, $allowed)) return (string)$num;
            }
            return $value;
        };

        // Normalize property_type/status
        if (isset($data['property_type'])) {
            $data['property_type'] = $normalizePropertyType($data['property_type']);
        }
        if (isset($data['status'])) {
            $data['status'] = $normalizeStatus($data['status']);
        }

        // Normalize price_base_currency
        if (isset($data['price_base_currency']) && is_string($data['price_base_currency'])) {
            $v = strtoupper(trim($data['price_base_currency']));
            $data['price_base_currency'] = $v === 'US$' ? 'USD' : ($v === 'MX$' ? 'MXN' : $v);
        }

        // Normalize categories
        if (isset($data['property_category'])) {
            $data['property_category'] = $normalizeCategory($data['property_category']);
            // Auto-convert legacy single property_category to property_categories array
            if (!isset($data['property_categories']) || empty($data['property_categories'])) {
                $data['property_categories'] = [$data['property_category']];
            }
        }
        if (isset($data['property_categories'])) {
            if (is_string($data['property_categories'])) {
                $parts = preg_split('/[,;]+/', $data['property_categories']);
                $data['property_categories'] = array_values(array_filter(array_map('trim', $parts)));
            }
            if (is_array($data['property_categories'])) {
                $data['property_categories'] = array_values(array_filter(array_map($normalizeCategory, $data['property_categories'])));
            }
        }

        // Normalize furnishing status
        if (isset($data['furnishing_status']) && is_string($data['furnishing_status'])) {
            $key = strtolower(trim($data['furnishing_status']));
            $data['furnishing_status'] = $furnishingMap[$key] ?? $key;
        }

        // Normalize state
        if (isset($data['state']) && is_string($data['state'])) {
            $data['state'] = strtolower(trim($data['state']));
        }

        // Normalize tags (case-insensitive match to standard list)
        if (isset($data['tags']) && is_array($data['tags'])) {
            $normalizedTags = [];
            foreach ($data['tags'] as $tag) {
                if (!is_string($tag)) {
                    $normalizedTags[] = $tag;
                    continue;
                }
                $key = strtolower(trim($tag));
                $normalizedTags[] = $tagMap[$key] ?? trim($tag);
            }
            $data['tags'] = $normalizedTags;
        }

        // Normalize booleans
        $boolFields = ['price_on_demand', 'price_negotiable', 'is_active', 'featured', 'show_in_home'];
        foreach ($boolFields as $field) {
            if (!isset($data[$field])) continue;
            $value = $data[$field];
            if (is_bool($value)) {
                $data[$field] = $value;
            } else if (is_numeric($value)) {
                $data[$field] = ((int)$value) !== 0;
            } else if (is_string($value)) {
                $v = strtolower(trim($value));
                if (in_array($v, ['true', '1', 'yes'], true)) $data[$field] = true;
                if (in_array($v, ['false', '0', 'no'], true)) $data[$field] = false;
            }
        }

        // Normalize bedrooms/bathrooms
        if (isset($data['bedrooms'])) $data['bedrooms'] = $normalizeBedrooms($data['bedrooms']);
        if (isset($data['bedrooms_min'])) $data['bedrooms_min'] = $normalizeBedrooms($data['bedrooms_min']);
        if (isset($data['bedrooms_max'])) $data['bedrooms_max'] = $normalizeBedrooms($data['bedrooms_max']);
        if (isset($data['bathrooms'])) $data['bathrooms'] = $normalizeBathrooms($data['bathrooms']);
        if (isset($data['bathrooms_min'])) $data['bathrooms_min'] = $normalizeBathrooms($data['bathrooms_min']);
        if (isset($data['bathrooms_max'])) $data['bathrooms_max'] = $normalizeBathrooms($data['bathrooms_max']);

        return $data;
    }

    private function validatePropertyData($data, $isUpdate = false, $isPartialUpdate = false) {
        // Required fields for INSERT (minimal)
        if (!$isUpdate) {
            $required = ['title', 'property_type', 'city'];
            
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return "$field is required";
                }
            }
        }
        
        // Required fields for UPDATE (complete) - skip for partial updates like toggle is_active
        if ($isUpdate && !$isPartialUpdate) {
            // Per active properties: property_category obbligatorio
            // Per developments: property_categories array obbligatorio
            $required = ['title', 'property_type', 'city'];
            
            foreach ($required as $field) {
                if (array_key_exists($field, $data) && empty($data[$field])) {
                    return "$field is required";
                }
            }
            
            // Validazione category: property_categories è sempre un array
            if (isset($data['property_type'])) {
                if (isset($data['property_categories']) && empty($data['property_categories'])) {
                    return "property_categories is required (at least one category)";
                }
                // Legacy support: accept property_category for active
                if ($data['property_type'] === 'active' && !isset($data['property_categories']) && isset($data['property_category']) && empty($data['property_category'])) {
                    return "property_category is required for active properties";
                }
            }

            // Price validation (only for full UPDATE when price fields are included)
            if (array_key_exists('price_usd', $data) && empty($data['price_on_demand'])) {
                if (empty($data['price_usd']) || $data['price_usd'] <= 0) {
                    return "price_usd is required and must be greater than 0 when price_on_demand is false";
                }
            }
        }

        // Validate ENUMs
        if (isset($data['property_type']) && !in_array($data['property_type'], ['active', 'development'])) {
            return "Invalid property_type. Must be: active, development";
        }

        if (isset($data['status']) && !in_array($data['status'], ['for_sale', 'sold', 'reserved'])) {
            return "Invalid status. Must be: for_sale, sold, reserved";
        }

        if (isset($data['property_category']) && !in_array($data['property_category'], 
            ['apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial'])) {
            return "Invalid property_category";
        }

        if (isset($data['furnishing_status']) && !in_array($data['furnishing_status'], 
            ['furnished', 'semi-furnished', 'unfurnished'])) {
            return "Invalid furnishing_status";
        }
        
        // Validate price_base_currency
        if (isset($data['price_base_currency']) && !in_array($data['price_base_currency'], ['USD', 'MXN'])) {
            return "Invalid price_base_currency. Must be: USD, MXN";
        }
        
        // Validate property_categories array for developments
        if (isset($data['property_categories'])) {
            if (!is_array($data['property_categories'])) {
                return "property_categories must be an array";
            }
            
            $validCategories = ['apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial'];
            foreach ($data['property_categories'] as $cat) {
                if (!in_array($cat, $validCategories)) {
                    return "Invalid category in property_categories: $cat";
                }
            }
        }
        
        // Validate bedrooms/bathrooms (singoli e range)
        $validBedrooms = ['studio', '1', '2', '3', '4', '5+'];
        if (isset($data['bedrooms']) && !in_array($data['bedrooms'], $validBedrooms)) {
            return "Invalid bedrooms value";
        }
        if (isset($data['bedrooms_min']) && !in_array($data['bedrooms_min'], $validBedrooms)) {
            return "Invalid bedrooms_min value";
        }
        if (isset($data['bedrooms_max']) && !in_array($data['bedrooms_max'], $validBedrooms)) {
            return "Invalid bedrooms_max value";
        }
        
        $validBathrooms = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+'];
        if (isset($data['bathrooms']) && !in_array($data['bathrooms'], $validBathrooms)) {
            return "Invalid bathrooms value";
        }
        if (isset($data['bathrooms_min']) && !in_array($data['bathrooms_min'], $validBathrooms)) {
            return "Invalid bathrooms_min value";
        }
        if (isset($data['bathrooms_max']) && !in_array($data['bathrooms_max'], $validBathrooms)) {
            return "Invalid bathrooms_max value";
        }
        
        // Range validation - bedrooms_min should be <= bedrooms_max
        if (isset($data['bedrooms_min']) && isset($data['bedrooms_max'])) {
            $bedroomOrder = array_flip($validBedrooms);
            if (isset($bedroomOrder[$data['bedrooms_min']]) && isset($bedroomOrder[$data['bedrooms_max']])) {
                if ($bedroomOrder[$data['bedrooms_min']] > $bedroomOrder[$data['bedrooms_max']]) {
                    return "bedrooms_min cannot be greater than bedrooms_max";
                }
            }
        }
        
        // Range validation - bathrooms_min should be <= bathrooms_max
        if (isset($data['bathrooms_min']) && isset($data['bathrooms_max'])) {
            $bathroomOrder = array_flip($validBathrooms);
            if (isset($bathroomOrder[$data['bathrooms_min']]) && isset($bathroomOrder[$data['bathrooms_max']])) {
                if ($bathroomOrder[$data['bathrooms_min']] > $bathroomOrder[$data['bathrooms_max']]) {
                    return "bathrooms_min cannot be greater than bathrooms_max";
                }
            }
        }
        
        // Range validation - price_from should be <= price_to
        if (isset($data['price_from_usd']) && isset($data['price_to_usd'])) {
            if ($data['price_from_usd'] > $data['price_to_usd']) {
                return "price_from_usd cannot be greater than price_to_usd";
            }
        }
        
        if (isset($data['price_from_mxn']) && isset($data['price_to_mxn'])) {
            if ($data['price_from_mxn'] > $data['price_to_mxn']) {
                return "price_from_mxn cannot be greater than price_to_mxn";
            }
        }

        // Range validation - sqm_min should be <= sqm_max
        if (isset($data['sqm_min']) && isset($data['sqm_max'])) {
            if ($data['sqm_min'] > $data['sqm_max']) {
                return "sqm_min cannot be greater than sqm_max";
            }
            // Validate that both are positive
            if ($data['sqm_min'] < 0 || $data['sqm_max'] < 0) {
                return "sqm values must be positive numbers";
            }
        }

        // Range validation - sqft_min should be <= sqft_max
        if (isset($data['sqft_min']) && isset($data['sqft_max'])) {
            if ($data['sqft_min'] > $data['sqft_max']) {
                return "sqft_min cannot be greater than sqft_max";
            }
            // Validate that both are positive
            if ($data['sqft_min'] < 0 || $data['sqft_max'] < 0) {
                return "sqft values must be positive numbers";
            }
        }

        // Validate single sqm/sqft values are positive
        if (isset($data['sqm']) && $data['sqm'] !== null && $data['sqm'] < 0) {
            return "sqm must be a positive number";
        }

        if (isset($data['sqft']) && $data['sqft'] !== null && $data['sqft'] < 0) {
            return "sqft must be a positive number";
        }

        if (isset($data['lot_size_sqm']) && $data['lot_size_sqm'] !== null && $data['lot_size_sqm'] < 0) {
            return "lot_size_sqm must be a positive number";
        }

        // Coordinate validation
        if (isset($data['latitude']) && ($data['latitude'] < -90 || $data['latitude'] > 90)) {
            return "latitude must be between -90 and 90";
        }

        if (isset($data['longitude']) && ($data['longitude'] < -180 || $data['longitude'] > 180)) {
            return "longitude must be between -180 and 180";
        }

        // String length validation
        if (isset($data['title']) && (strlen($data['title']) < 3 || strlen($data['title']) > 255)) {
            return "title must be between 3 and 255 characters";
        }

        if (isset($data['seo_title']) && strlen($data['seo_title']) > 160) {
            return "seo_title must not exceed 160 characters";
        }

        if (isset($data['seo_description']) && strlen($data['seo_description']) > 320) {
            return "seo_description must not exceed 320 characters";
        }

        return true;
    }

    /**
     * Save property categories (for developments)
     * @param int $propertyId Property ID
     * @param array $categories Array of category strings
     * @return bool
     */
    private function savePropertyCategories($propertyId, $categories) {
        try {
            // Delete existing categories
            $deleteQuery = "DELETE FROM property_categories WHERE property_id = ?";
            $this->db->executePrepared($deleteQuery, [$propertyId], 'i');
            
            // Insert new categories
            if (!empty($categories) && is_array($categories)) {
                $insertQuery = "INSERT INTO property_categories (property_id, category) VALUES (?, ?)";
                foreach ($categories as $category) {
                    $this->db->executePrepared($insertQuery, [$propertyId, $category], 'is');
                }
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Error saving property categories: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Load property categories (for developments)
     * @param int $propertyId Property ID
     * @return array
     */
    private function loadPropertyCategories($propertyId) {
        try {
            $query = "SELECT category FROM property_categories WHERE property_id = ? ORDER BY category ASC";
            $result = $this->db->executePrepared($query, [$propertyId], 'i');
            
            $categories = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $categories[] = $row['category'];
                }
            }
            
            return $categories;
        } catch (Exception $e) {
            error_log("Error loading property categories: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Generate unique slug
     * @param string $title Property title
     * @param int $excludeId Property ID to exclude
     * @return string
     */
    private function generateSlug($title, $excludeId = null) {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title), '-'));
        
        $query = "SELECT id FROM properties WHERE slug = ?" . ($excludeId ? " AND id != ?" : "");
        $params = $excludeId ? [$slug, $excludeId] : [$slug];
        $types = $excludeId ? 'si' : 's';
        
        $result = $this->db->executePrepared($query, $params, $types);

        if ($result && $result->num_rows > 0) {
            $slug .= '-' . time();
        }

        return $slug;
    }

    /**
     * Increment property views
     * @param int $id Property ID
     */
    private function incrementViews($id) {
        $query = "UPDATE properties SET views_count = views_count + 1 WHERE id = ?";
        $this->db->executePrepared($query, [$id], 'i');
    }

    /**
     * Format property data
     * @param array $property Property data
     * @param bool $includeContent Include full content
     * @return array
     */
    private function formatProperty($property, $includeContent = false) {
        // Parse JSON tags
        if (isset($property['tags'])) {
            $property['tags'] = json_decode($property['tags'], true) ?? [];
        }

        // Get cover image URL
        if (!isset($property['cover_image_url'])) {
            $photoQuery = "SELECT url FROM property_photos WHERE property_id = ? AND is_cover = 1 LIMIT 1";
            $photoResult = $this->db->executePrepared($photoQuery, [$property['id']], 'i');
            $property['cover_image_url'] = ($photoResult && $photoResult->num_rows > 0) 
                ? $photoResult->fetch_assoc()['url'] 
                : null;
        }

        // Type casting
        $property['price_usd'] = isset($property['price_usd']) ? (float)$property['price_usd'] : null;
        $property['price_mxn'] = isset($property['price_mxn']) ? (float)$property['price_mxn'] : null;
        $property['price_eur'] = isset($property['price_eur']) ? (float)$property['price_eur'] : null;
        $property['exchange_rate'] = isset($property['exchange_rate']) ? (float)$property['exchange_rate'] : null;
        $property['price_base_currency'] = $property['price_base_currency'] ?? 'USD';
        $property['price_from_usd'] = isset($property['price_from_usd']) ? (float)$property['price_from_usd'] : null;
        $property['price_to_usd'] = isset($property['price_to_usd']) ? (float)$property['price_to_usd'] : null;
        $property['price_from_mxn'] = isset($property['price_from_mxn']) ? (float)$property['price_from_mxn'] : null;
        $property['price_to_mxn'] = isset($property['price_to_mxn']) ? (float)$property['price_to_mxn'] : null;
        $property['price_from_eur'] = isset($property['price_from_eur']) ? (float)$property['price_from_eur'] : null;
        $property['price_to_eur'] = isset($property['price_to_eur']) ? (float)$property['price_to_eur'] : null;
        $property['sqm'] = isset($property['sqm']) ? (float)$property['sqm'] : null;
        $property['sqft'] = isset($property['sqft']) ? (float)$property['sqft'] : null;
        $property['lot_size_sqm'] = isset($property['lot_size_sqm']) ? (float)$property['lot_size_sqm'] : null;
        $property['latitude'] = isset($property['latitude']) ? (float)$property['latitude'] : null;
        $property['longitude'] = isset($property['longitude']) ? (float)$property['longitude'] : null;
        $property['is_active'] = (bool)($property['is_active'] ?? false);
        $property['featured'] = (bool)($property['featured'] ?? false);
        $property['show_in_home'] = (bool)($property['show_in_home'] ?? false);
        $property['price_on_demand'] = (bool)($property['price_on_demand'] ?? false);
        $property['price_negotiable'] = (bool)($property['price_negotiable'] ?? false);
        $property['order'] = (int)($property['order'] ?? 0);
        $property['views_count'] = (int)($property['views_count'] ?? 0);

        // Remove content for list view
        if (!$includeContent) {
            unset($property['content']);
        }

        return $property;
    }

    /**
     * Format photo data
     * @param array $photo Photo data
     * @return array
     */
    private function formatPhoto($photo) {
        $photo['is_cover'] = (bool)$photo['is_cover'];
        $photo['order'] = (int)$photo['order'];
        $photo['filesize'] = isset($photo['filesize']) ? (int)$photo['filesize'] : null;
        $photo['width'] = isset($photo['width']) ? (int)$photo['width'] : null;
        $photo['height'] = isset($photo['height']) ? (int)$photo['height'] : null;
        
        return $photo;
    }

    /**
     * Get landing pages associated with a property
     * @param int $propertyId Property ID
     * @return array
     */
    public function getPropertyLandingPages($propertyId) {
        try {
            $query = "SELECT landing_page_slug FROM property_landing_pages WHERE property_id = ?";
            $result = $this->db->executePrepared($query, [$propertyId], 'i');

            if ($result === false) {
                return $this->errorResponse('Failed to fetch landing pages');
            }

            $landingPages = [];
            while ($row = $result->fetch_assoc()) {
                $landingPages[] = $row['landing_page_slug'];
            }

            return $this->successResponse($landingPages);
        } catch (Exception $e) {
            error_log("Error fetching property landing pages: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Update landing pages associations for a property
     * @param int $propertyId Property ID
     * @param array $landingPageSlugs Array of landing page slugs
     * @return array
     */
    public function updatePropertyLandingPages($propertyId, $landingPageSlugs) {
        try {
            // Verify property exists
            $checkQuery = "SELECT id FROM properties WHERE id = ?";
            $checkResult = $this->db->executePrepared($checkQuery, [$propertyId], 'i');

            if (!$checkResult || $checkResult->num_rows === 0) {
                return $this->errorResponse('Property not found', 404);
            }

            // Start transaction
            $this->conn->begin_transaction();

            // Delete existing associations
            $deleteQuery = "DELETE FROM property_landing_pages WHERE property_id = ?";
            $deleteResult = $this->db->executePrepared($deleteQuery, [$propertyId], 'i');

            if ($deleteResult === false) {
                $this->conn->rollback();
                return $this->errorResponse('Failed to delete existing associations');
            }

            // Insert new associations
            if (!empty($landingPageSlugs) && is_array($landingPageSlugs)) {
                $insertQuery = "INSERT INTO property_landing_pages (property_id, landing_page_slug) VALUES (?, ?)";
                $stmt = $this->conn->prepare($insertQuery);
                
                if ($stmt === false) {
                    $this->conn->rollback();
                    error_log("Property landing pages table error: " . $this->conn->error);
                    return $this->errorResponse('Database table property_landing_pages does not exist. Please run migration 014.');
                }

                foreach ($landingPageSlugs as $slug) {
                    // PHP 7.4 fix: use explicit variables for bind_param
                    $slugVar = $slug;
                    $stmt->bind_param('is', $propertyId, $slugVar);
                    if (!$stmt->execute()) {
                        $this->conn->rollback();
                        return $this->errorResponse('Failed to create association');
                    }
                }
                $stmt->close();
            }

            $this->conn->commit();

            return $this->successResponse([
                'message' => 'Landing pages associations updated successfully',
                'count' => count($landingPageSlugs)
            ]);

        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollback();
            }
            error_log("Error updating property landing pages: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Reorder properties
     * @param array $orderData Array of {id, display_order}
     * @return array
     */
    public function reorder($orderData) {
        try {
            if (empty($orderData) || !is_array($orderData)) {
                return $this->errorResponse('Invalid order data');
            }

            $this->conn->begin_transaction();

            $stmt = $this->conn->prepare("UPDATE properties SET `order` = ? WHERE id = ?");
            if (!$stmt) {
                $this->conn->rollback();
                return $this->errorResponse('Failed to prepare statement');
            }

            foreach ($orderData as $item) {
                if (!isset($item['id']) || !isset($item['display_order'])) {
                    $stmt->close();
                    $this->conn->rollback();
                    return $this->errorResponse('Invalid order item');
                }

                // PHP 7.4 fix: use explicit variables for bind_param
                $displayOrder = $item['display_order'];
                $itemId = $item['id'];
                $stmt->bind_param('ii', $displayOrder, $itemId);
                if (!$stmt->execute()) {
                    $stmt->close();
                    $this->conn->rollback();
                    return $this->errorResponse('Failed to update order');
                }
            }

            $stmt->close();
            $this->conn->commit();

            return $this->successResponse(['message' => 'Properties reordered successfully']);

        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollback();
            }
            error_log("Error reordering properties: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Get parameter type for prepared statement
     * @param string $field Field name
     * @return string
     */
    private function getParamType($field) {
        $intFields = ['year_built', 'display_order', 'views_count'];
        $doubleFields = ['price_usd', 'price_mxn', 'price_eur', 'exchange_rate', 'price_from_usd', 'price_to_usd', 
                         'price_from_mxn', 'price_to_mxn', 'price_from_eur', 'price_to_eur', 'sqm', 'sqft', 'lot_size_sqm', 'latitude', 'longitude'];
        if (in_array($field, $intFields)) return 'i';
        if (in_array($field, $doubleFields)) return 'd';
        return 's';
    }

    /**
     * Log activity
     */
    private function logActivity($userId, $action, $entityType, $entityId, $description) {
        try {
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
            $query = "INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, ip_address) 
                     VALUES (?, ?, ?, ?, ?, ?)";
            $this->db->executePrepared($query, [$userId, $action, $entityType, $entityId, $description, $ipAddress], 'ississ');
        } catch (Exception $e) {
            error_log("Error logging activity: " . $e->getMessage());
        }
    }

    /**
     * Success response
     */
    private function successResponse($data, $code = 200) {
        http_response_code($code);
        return ['success' => true, 'data' => $data];
    }

    /**
     * Error response
     */
    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        return ['success' => false, 'error' => $message];
    }
}
