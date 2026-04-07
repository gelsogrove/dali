-- Migration 045: Seed content blocks for existing landing pages
-- This ensures the landing_page_content_blocks table is populated with demo content

-- First, clear any empty/orphaned blocks that may have been migrated
DELETE FROM landing_page_content_blocks 
WHERE (title IS NULL OR title = '') 
  AND (description IS NULL OR description = '') 
  AND (image IS NULL OR image = '');

-- Get the IDs of existing landing pages (we expect 2)
-- We'll use INSERT ... SELECT with a subquery approach

-- Landing Page 1: Insert 3 blocks
-- Block 1
INSERT INTO landing_page_content_blocks (landing_page_id, title, subtitle, description, image, display_order)
SELECT id, 
  'Expert Real Estate Guidance',
  'Your Trusted Partner in Mexico',
  '<p>With years of experience in the Riviera Maya real estate market, we provide expert guidance through every step of your property journey. From initial consultation to closing, our team ensures a seamless experience.</p><p>We specialize in luxury properties, beachfront condos, and investment opportunities across Tulum, Playa del Carmen, and the entire Riviera Maya corridor.</p>',
  NULL,
  1
FROM landing_pages 
WHERE deleted_at IS NULL 
ORDER BY id ASC 
LIMIT 1;

-- Block 2
INSERT INTO landing_page_content_blocks (landing_page_id, title, subtitle, description, image, display_order)
SELECT id,
  'Premium Property Selection',
  'Curated Listings Just for You',
  '<p>Browse our carefully curated collection of premium properties. Each listing is personally vetted to ensure quality, value, and investment potential.</p><ul><li>Luxury beachfront condos</li><li>Private villas with ocean views</li><li>Modern developments with amenities</li><li>Investment properties with high ROI</li></ul>',
  NULL,
  2
FROM landing_pages 
WHERE deleted_at IS NULL 
ORDER BY id ASC 
LIMIT 1;

-- Block 3
INSERT INTO landing_page_content_blocks (landing_page_id, title, subtitle, description, image, display_order)
SELECT id,
  'Hassle-Free Process',
  'From Search to Keys in Hand',
  '<p>Buying property in Mexico doesn''t have to be complicated. Our streamlined process handles everything — legal requirements, inspections, negotiations, and closing — so you can focus on finding your dream home.</p><p>Contact us today for a free consultation and discover why hundreds of buyers trust us with their investment.</p>',
  NULL,
  3
FROM landing_pages 
WHERE deleted_at IS NULL 
ORDER BY id ASC 
LIMIT 1;

-- Landing Page 2: Insert 3 blocks  
-- Block 1
INSERT INTO landing_page_content_blocks (landing_page_id, title, subtitle, description, image, display_order)
SELECT id,
  'Discover the Riviera Maya',
  'Paradise Awaits',
  '<p>The Riviera Maya stretches along the Caribbean coast of Mexico''s Yucatan Peninsula, offering pristine beaches, ancient Mayan ruins, and a thriving expat community. It''s one of the world''s fastest-growing real estate markets.</p><p>Whether you''re looking for a vacation home, retirement property, or smart investment, the Riviera Maya delivers exceptional value and lifestyle.</p>',
  NULL,
  1
FROM landing_pages 
WHERE deleted_at IS NULL 
ORDER BY id ASC 
LIMIT 1 OFFSET 1;

-- Block 2
INSERT INTO landing_page_content_blocks (landing_page_id, title, subtitle, description, image, display_order)
SELECT id,
  'Investment Opportunities',
  'Strong Returns in a Growing Market',
  '<p>The Riviera Maya real estate market continues to show strong appreciation. With new infrastructure projects, international airport expansions, and growing tourism, property values are steadily increasing.</p><ul><li>Average annual appreciation of 8-12%</li><li>Strong rental income from vacation rentals</li><li>Growing demand from international buyers</li><li>Favorable exchange rates for USD and EUR buyers</li></ul>',
  NULL,
  2
FROM landing_pages 
WHERE deleted_at IS NULL 
ORDER BY id ASC 
LIMIT 1 OFFSET 1;

-- Block 3
INSERT INTO landing_page_content_blocks (landing_page_id, title, subtitle, description, image, display_order)
SELECT id,
  'Start Your Journey Today',
  'Let Us Help You Find Your Place',
  '<p>Ready to explore the possibilities? Our team of experienced agents is here to help you navigate the market and find the perfect property. We offer personalized service tailored to your needs and budget.</p><p>Schedule a free consultation today and take the first step toward owning your piece of paradise in the Riviera Maya.</p>',
  NULL,
  3
FROM landing_pages 
WHERE deleted_at IS NULL 
ORDER BY id ASC 
LIMIT 1 OFFSET 1;
