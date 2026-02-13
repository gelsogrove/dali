import { Helmet } from 'react-helmet-async';

/**
 * SEO Component - Complete meta tags and structured data
 * 
 * @param {string} title - Page title
 * @param {string} description - Meta description (max 160 chars)
 * @param {string} keywords - Meta keywords
 * @param {string} ogTitle - Open Graph title (fallback: title)
 * @param {string} ogDescription - OG description (fallback: description)
 * @param {string} ogImage - OG image URL (absolute)
 * @param {string} ogImageAlt - Alt text for OG image
 * @param {string} canonicalUrl - Canonical URL
 * @param {string} ogType - OG type (website, article, product)
 * @param {object} property - Property data for RealEstateListing schema
 * @param {object} breadcrumbs - Breadcrumb data for BreadcrumbList schema
 */
export default function SEO({ 
  title, 
  description, 
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogImageAlt,
  canonicalUrl,
  ogType = 'website',
  property = null,
  breadcrumbs = null,
  robots = 'index, follow'
}) {
  const siteName = "Buy With Dali";
  const siteUrl = "https://buywithdali.com";
  const defaultImage = `${siteUrl}/images/og-default.jpg`;
  const titleIncludesSiteName = (value) => {
    if (!value) return false;
    return value.toLowerCase().includes(siteName.toLowerCase());
  };

  const fullTitle = title
    ? (titleIncludesSiteName(title) ? title : `${title} | ${siteName}`)
    : siteName;
  const defaultDescription = "Luxury real estate in Riviera Maya with Dalila Gelsomino. Expert guidance for buying properties in Tulum, Playa del Carmen, and beyond.";
  const metaDescription = description || defaultDescription;
  const socialTitle = ogTitle || fullTitle;
  const socialDescription = ogDescription || metaDescription;
  const imageUrl = ogImage || defaultImage;
  
  // Build RealEstateListing Schema.org JSON-LD
  const buildPropertySchema = (prop) => {
    if (!prop) return null;
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": prop.title,
      "description": prop.seo_description || prop.description?.replace(/<[^>]+>/g, '').slice(0, 300),
      "url": canonicalUrl || `${siteUrl}/listings/${prop.slug}/`,
      "datePosted": prop.created_at,
      "dateModified": prop.updated_at,
    };
    
    // Add image
    if (prop.cover_image_url || prop.og_image) {
      schema.image = {
        "@type": "ImageObject",
        "url": prop.og_image || prop.cover_image_url,
        "caption": ogImageAlt || prop.title
      };
    }
    
    // Add price
    if (prop.price_usd && !prop.price_on_demand) {
      schema.offers = {
        "@type": "Offer",
        "price": prop.price_usd,
        "priceCurrency": "USD",
        "availability": prop.status === 'sold' 
          ? "https://schema.org/SoldOut" 
          : "https://schema.org/InStock"
      };
    } else if (prop.price_from_usd && prop.price_to_usd) {
      schema.offers = {
        "@type": "AggregateOffer",
        "lowPrice": prop.price_from_usd,
        "highPrice": prop.price_to_usd,
        "priceCurrency": "USD"
      };
    }
    
    // Add location
    if (prop.city || prop.neighborhood || prop.country) {
      schema.contentLocation = {
        "@type": "Place",
        "name": [prop.neighborhood, prop.city, prop.country].filter(Boolean).join(", "),
        "address": {
          "@type": "PostalAddress",
          "addressLocality": prop.city,
          "addressRegion": prop.neighborhood,
          "addressCountry": prop.country || "Mexico"
        }
      };
      
      // Add geo coordinates if available
      if (prop.latitude && prop.longitude) {
        schema.contentLocation.geo = {
          "@type": "GeoCoordinates",
          "latitude": prop.latitude,
          "longitude": prop.longitude
        };
      }
    }
    
    // Add property details
    if (prop.bedrooms || prop.bedrooms_min) {
      schema.numberOfBedrooms = prop.bedrooms || prop.bedrooms_min;
    }
    if (prop.bathrooms || prop.bathrooms_min) {
      schema.numberOfBathroomsTotal = prop.bathrooms || prop.bathrooms_min;
    }
    if (prop.sqm) {
      schema.floorSize = {
        "@type": "QuantitativeValue",
        "value": prop.sqm,
        "unitCode": "MTK" // Square meters
      };
    }
    
    // Add property type (unified: use property_categories array, fallback to property_category)
    const categories = prop.property_categories?.length
      ? prop.property_categories
      : prop.property_category ? [prop.property_category] : [];
    if (categories.length > 0) {
      const typeMap = {
        'apartment': 'Apartment',
        'house': 'House',
        'villa': 'House',
        'condo': 'Apartment',
        'penthouse': 'Apartment',
        'land': 'LandForm',
        'commercial': 'Store'
      };
      schema.additionalType = typeMap[categories[0]] || 'RealEstateListing';
    }
    
    // Add amenities/features
    if (prop.tags && Array.isArray(prop.tags) && prop.tags.length > 0) {
      schema.amenityFeature = prop.tags.map(tag => ({
        "@type": "LocationFeatureSpecification",
        "name": tag
      }));
    }
    
    return schema;
  };
  
  // Build BreadcrumbList Schema.org JSON-LD
  const buildBreadcrumbSchema = (crumbs) => {
    if (!crumbs || !crumbs.length) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    };
  };
  
  // Build Organization Schema (for site-wide)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Buy With Dali",
    "alternateName": "Dalila Gelsomino Real Estate",
    "url": siteUrl,
    "logo": `${siteUrl}/images/logo.png`,
    "description": "Luxury real estate agent specializing in Riviera Maya properties including Tulum, Playa del Carmen, and Puerto Aventuras.",
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": 20.2114,
        "longitude": -87.4654
      },
      "geoRadius": "100 km"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Playa del Carmen",
      "addressRegion": "Quintana Roo",
      "addressCountry": "Mexico"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "sales",
      "availableLanguage": ["English", "Spanish", "Italian"]
    }
  };
  
  const propertySchema = buildPropertySchema(property);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="Dalila Gelsomino" />
      <meta name="robots" content={robots} />
      <meta name="language" content="English" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={property ? 'product' : ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={socialTitle} />
      <meta property="og:description" content={socialDescription} />
      <meta property="og:image" content={imageUrl} />
      {ogImageAlt && <meta property="og:image:alt" content={ogImageAlt} />}
      <meta property="og:url" content={canonicalUrl || (typeof window !== 'undefined' ? window.location.href : 'https://buywithdali.com')} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={socialTitle} />
      <meta name="twitter:description" content={socialDescription} />
      <meta name="twitter:image" content={imageUrl} />
      {ogImageAlt && <meta name="twitter:image:alt" content={ogImageAlt} />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Geo Meta Tags for local SEO */}
      {property?.city && <meta name="geo.placename" content={property.city} />}
      {property?.country && <meta name="geo.region" content={property.country === 'Mexico' ? 'MX-ROO' : property.country} />}
      {property?.latitude && property?.longitude && (
        <meta name="geo.position" content={`${property.latitude};${property.longitude}`} />
      )}
      {property?.latitude && property?.longitude && (
        <meta name="ICBM" content={`${property.latitude}, ${property.longitude}`} />
      )}
      
      {/* Schema.org JSON-LD - Organization */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      
      {/* Schema.org JSON-LD - Property Listing */}
      {propertySchema && (
        <script type="application/ld+json">
          {JSON.stringify(propertySchema)}
        </script>
      )}
      
      {/* Schema.org JSON-LD - Breadcrumbs */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
}
