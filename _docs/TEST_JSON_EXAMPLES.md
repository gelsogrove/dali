# Test JSON Examples for Property Import

## Valid Active Property JSON

```json
{
  "property_type": "active",
  "status": "for_sale",
  "property_categories": ["apartment"],
  "title": "Luxury Oceanfront Apartment in Marina District",
  "short_description": "Modern 2-bedroom apartment with stunning ocean views",
  "content": "<p>Welcome to this stunning luxury apartment located in the prestigious Marina District of Puerto Vallarta. This exceptional 2-bedroom, 2-bathroom residence offers breathtaking panoramic ocean views from its spacious private balcony.</p><p>The open-concept living space features floor-to-ceiling windows that flood the interior with natural light, showcasing the beautiful turquoise waters of Banderas Bay. The modern kitchen is fully equipped with stainless steel appliances, granite countertops, and custom cabinetry, perfect for both everyday living and entertaining guests.</p><p>The master suite is a true retreat, featuring a walk-in closet and an en-suite bathroom with premium fixtures. The second bedroom is equally spacious and offers versatile use as a guest room or home office. Both bedrooms have direct access to the balcony, allowing you to wake up to the sound of the waves.</p><p>This property includes access to world-class amenities including a resort-style infinity pool, fully-equipped fitness center, 24-hour security, and covered parking. Located just minutes from the beach, fine dining restaurants, shopping centers, and the famous Malecon boardwalk, this apartment offers the perfect blend of luxury coastal living and urban convenience.</p>",
  "bedrooms": "2",
  "bathrooms": "2_full",
  "size_sqm": 120.5,
  "price": 350000,
  "price_base_currency": "USD",
  "furnishing_status": "furnished",
  "google_maps_url": "https://www.google.com/maps/place/Marina+Vallarta,+Puerto+Vallarta,+Jalisco,+Mexico/@20.6625571,-105.2425814,15z",
  "state": "jalisco",
  "city": "Puerto Vallarta",
  "area": "Marina Vallarta",
  "seo_title": "Luxury Oceanfront Apartment for Sale in Marina Vallarta | 2 Bed",
  "seo_description": "Discover this stunning 2-bedroom luxury apartment in Marina Vallarta, Puerto Vallarta. Ocean views, modern amenities, and prime location near the beach.",
  "seo_keywords": "apartment, marina vallarta, ocean view, luxury, puerto vallarta, jalisco",
  "tags": ["Balcony/Terrace", "Air Conditioning", "Oceanfront", "Pool", "Gym"]
}
```

## Valid Development Property JSON

```json
{
  "property_type": "development",
  "status": "for_sale",
  "property_categories": ["apartment", "penthouse"],
  "title": "Exclusive Beachfront Development - Pre-Construction Condos",
  "short_description": "Luxury pre-construction condominiums with flexible payment plans",
  "content": "<p>Introducing an exclusive new development project in the heart of Nuevo Vallarta, featuring luxury beachfront condominiums with stunning ocean views and world-class amenities. This pre-construction development offers investors and homebuyers a unique opportunity to own a piece of paradise at pre-sale prices.</p><p>The project features multiple unit types including 1-bedroom, 2-bedroom, and penthouse options, all designed with modern architecture and premium finishes. Each unit will feature spacious open-concept layouts, floor-to-ceiling windows, fully-equipped kitchens with stainless steel appliances, and private balconies or terraces.</p><p>The development will include resort-style amenities such as infinity pools overlooking the ocean, a state-of-the-art fitness center, spa facilities, beach club access, 24-hour security, covered parking, and beautifully landscaped common areas. Located directly on the beach with easy access to championship golf courses, marinas, shopping centers, and restaurants.</p><p>Flexible payment plans available with attractive pre-construction pricing. Expected completion date: December 2026. This is an exceptional investment opportunity in one of Mexico's most desirable destinations.</p><p>Contact us today to schedule a presentation and learn more about available units, floor plans, and special pre-construction incentives.</p>",
  "bedrooms_from": "1",
  "bedrooms_to": "3",
  "bathrooms_from": "1_full",
  "bathrooms_to": "3_full",
  "size_sqm_from": 85.0,
  "size_sqm_to": 220.0,
  "price_from": 285000,
  "price_to": 750000,
  "price_base_currency": "USD",
  "delivery_date": "2026-12-31",
  "payment_plan_available": true,
  "google_maps_url": "https://www.google.com/maps/place/Nuevo+Vallarta,+Nayarit,+Mexico/@20.6988407,-105.2875813,14z",
  "state": "nayarit",
  "city": "Nuevo Vallarta",
  "area": "Beachfront",
  "seo_title": "Luxury Beachfront Condos for Sale - Nuevo Vallarta Pre-Construction",
  "seo_description": "Invest in exclusive pre-construction beachfront condominiums in Nuevo Vallarta. Flexible payment plans, ocean views, and resort amenities. Expected 2026.",
  "seo_keywords": "development, nuevo vallarta, pre-construction, beachfront, investment, nayarit",
  "tags": ["Pre-Construction", "Payment Plan", "Beachfront", "Pool", "Gym", "Ocean View"]
}
```

## Invalid Examples (for Testing Validation)

### Missing Required Fields
```json
{
  "property_type": "active",
  "title": "Test Property"
}
```
Expected Errors:
- Missing required field: status
- Missing required field: property_categories
- Missing required field: content
- Missing required field: bedrooms
- Missing required field: price
- etc.

### Invalid ENUM Values
```json
{
  "property_type": "residential",
  "status": "available",
  "property_categories": ["house"],
  "bedrooms": "two"
}
```
Expected Errors:
- property_type must be one of: active, development
- status must be one of: for_sale, sold, reserved
- property_categories contains invalid value: house
- bedrooms must be one of: 1, 2, 3, 4, 5, 5+

### Content Too Short
```json
{
  "property_type": "active",
  "content": "<p>This is a nice apartment.</p>"
}
```
Expected Error:
- content must be at least 250 words, current: ~6 words

### Invalid State Format
```json
{
  "state": "Jalisco"
}
```
Expected Error:
- state must be lowercase (e.g., 'jalisco' not 'Jalisco')

### Missing Google Maps URL
```json
{
  "property_type": "active",
  "address": "123 Main St"
}
```
Expected Error:
- google_maps_url is required and must be found from Google Maps

### Active Property with Development Fields
```json
{
  "property_type": "active",
  "bedrooms": "2",
  "bedrooms_from": "1",
  "bedrooms_to": "3"
}
```
Expected Error:
- Active properties cannot have development-specific fields (bedrooms_from, bedrooms_to, etc.)

### Development Property with Active Fields
```json
{
  "property_type": "development",
  "bedrooms_from": "1",
  "bedrooms_to": "3",
  "bedrooms": "2"
}
```
Expected Error:
- Development properties cannot have active-specific fields (bedrooms, bathrooms, size_sqm, price)

### Invalid Price Range
```json
{
  "property_type": "development",
  "price_from": 500000,
  "price_to": 300000
}
```
Expected Error:
- price_to (300000) must be greater than or equal to price_from (500000)
