import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description, 
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  canonicalUrl,
  ogType = 'website'
}) {
  const siteName = "Buy With Dali";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = "Luxury real estate in Riviera Maya with Dalila Gelsomino. Expert guidance for buying properties in Tulum, Playa del Carmen, and beyond.";
  const metaDescription = description || defaultDescription;
  const socialTitle = ogTitle || fullTitle;
  const socialDescription = ogDescription || metaDescription;
  
  return (
    <Helmet>
      {/* metatag */}
      <meta name="metatag-boundary" content="start" />
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={socialTitle} />
      <meta property="og:description" content={socialDescription} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={socialTitle} />
      <meta name="twitter:description" content={socialDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta name="metatag-boundary" content="end" />
      {/* /metatag */}
    </Helmet>
  );
}
