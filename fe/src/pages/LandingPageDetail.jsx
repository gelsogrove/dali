import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import PropertyCard from '../components/PropertyCard'
import TitleHeader from '../components/TitleHeader'
import { api } from '../config/api'
import './LandingPageDetail.css'

export default function LandingPageDetail() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [latestProperties, setLatestProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        // Fetch landing page
        const pageRes = await api.get(`/landing-pages/slug/${slug}`)
        setPage(pageRes.data)

        // Fetch latest 6 properties
        const propsRes = await api.get('/properties?is_active=1&per_page=6&page=1')
        setLatestProperties(propsRes.data?.properties || [])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [slug])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return <Navigate to="/" replace />
  }

  // Use first block image as cover, or cover_image
  const firstBlockImage = page.blocks?.[0]?.image
  const coverImage = firstBlockImage || page.cover_image

  // Use dynamic blocks from the API
  const contentBlocks = page.blocks || []

  return (
    <>
      <Helmet>
        <title>{page.seoTitle || page.title}</title>
        <meta name="description" content={page.seoDescription || page.description || ''} />
        {page.seoKeywords && <meta name="keywords" content={page.seoKeywords} />}
        <link rel="canonical" href={`https://buywithdali.com/${page.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={page.ogTitle || page.seoTitle || page.title} />
        <meta property="og:description" content={page.ogDescription || page.seoDescription || page.description || ''} />
        {coverImage && <meta property="og:image" content={coverImage} />}
        <meta property="og:url" content={`https://buywithdali.com/${page.slug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Buy With Dali" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.ogTitle || page.seoTitle || page.title} />
        <meta name="twitter:description" content={page.ogDescription || page.seoDescription || page.description || ''} />
        {coverImage && <meta name="twitter:image" content={coverImage} />}

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.seoTitle || page.title,
            description: page.seoDescription || page.description || '',
            url: `https://buywithdali.com/${page.slug}`,
            ...(coverImage ? { image: coverImage } : {}),
            publisher: {
              '@type': 'Organization',
              name: 'Buy With Dali',
              url: 'https://buywithdali.com'
            }
          })}
        </script>
      </Helmet>

      {/* Header with Cover Image */}
      {coverImage && (
        <div className="landing-page-header" style={{ backgroundImage: `url(${coverImage})` }}>
          <div className="landing-page-header-content">
            <h1>{page.title}</h1>
            {page.subtitle && <p>{page.subtitle}</p>}
          </div>
        </div>
      )}

      {!coverImage && (
        <TitleHeader title={page.title} subtitle={page.subtitle} />
      )}

      {/* Main Content */}
      <div className="landing-page-content">
        <div className="landing-page-content-wrapper">
          {/* Rich Content */}
          {page.content && (
            <div
              className="landing-page-prose"
              dangerouslySetInnerHTML={{ __html: page.content }}
            ></div>
          )}

          {/* Content Blocks */}
          {contentBlocks.map((block, index) => (
            <div 
              key={block.id || index} 
              className={`content-block ${index % 2 === 0 ? 'block-even' : 'block-odd'}`}
            >
              <div className="content-block-grid">
                {/* Image on left for even, right for odd */}
                {index % 2 === 0 && block.image && (
                  <div className="block-image">
                    <img 
                      src={block.image} 
                      alt={block.title || `Content block ${index + 1}`} 
                    />
                  </div>
                )}
                
                <div className="block-content">
                  {block.title && <h2>{block.title}</h2>}
                  {block.subtitle && <h3>{block.subtitle}</h3>}
                  {block.description && (
                    <div 
                      className="prose"
                      dangerouslySetInnerHTML={{ __html: block.description }}
                    ></div>
                  )}
                </div>

                {index % 2 === 1 && block.image && (
                  <div className="block-image">
                    <img 
                      src={block.image} 
                      alt={block.title || `Content block ${index + 1}`} 
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="landing-page-cta">
        <div className="landing-page-cta-inner">
          <h2>Ready to Get Started?</h2>
          <p>Contact us today to learn more about our services.</p>
          <a href="/contact-us">Get in Touch</a>
        </div>
      </div>

      {/* Latest Properties */}
      {latestProperties.length > 0 && (
        <div className="landing-page-content landing-page-properties">
          <div className="landing-page-properties-grid-wrapper">
            <h2 className="landing-page-properties-title">Latest Properties</h2>
            <div className="landing-page-properties-grid">
              {latestProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
