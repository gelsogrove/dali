import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import PropertyGrid from '../components/PropertyGrid'
import TitleHeader from '../components/TitleHeader'
import LoadingSpinner from '../components/LoadingSpinner'
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
    return <LoadingSpinner />
  }

  if (error || !page) {
    return <Navigate to="/" replace />
  }

  // Use dynamic blocks from the API, fallback to old content_block columns
  let contentBlocks = page.blocks || []
  if (contentBlocks.length === 0) {
    for (let i = 1; i <= 4; i++) {
      const title = page[`content_block_${i}_title`]
      const subtitle = page[`content_block_${i}_subtitle`]
      const description = page[`content_block_${i}_description`]
      const image = page[`content_block_${i}_image`]
      if (title || subtitle || description || image) {
        contentBlocks.push({ id: `fallback-${i}`, title, subtitle, description, image })
      }
    }
  }

  const coverImage = page.cover_image || contentBlocks[0]?.image || null
  const heroBlock = contentBlocks[0] || null
  const remainingBlocks = contentBlocks.length > 1 ? contentBlocks.slice(1) : []

  return (
    <>
      <Helmet>
        <title>{page.seoTitle || page.title}</title>
        <meta name="description" content={page.seoDescription || page.description || ''} />
        {page.seoKeywords && <meta name="keywords" content={page.seoKeywords} />}
        <link rel="canonical" href={`https://buywithdali.com/${page.slug}`} />
        <meta property="og:title" content={page.ogTitle || page.seoTitle || page.title} />
        <meta property="og:description" content={page.ogDescription || page.seoDescription || page.description || ''} />
        {coverImage && <meta property="og:image" content={coverImage} />}
        <meta property="og:url" content={`https://buywithdali.com/${page.slug}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Buy With Dali" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.ogTitle || page.seoTitle || page.title} />
        <meta name="twitter:description" content={page.ogDescription || page.seoDescription || page.description || ''} />
        {coverImage && <meta name="twitter:image" content={coverImage} />}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.seoTitle || page.title,
            description: page.seoDescription || page.description || '',
            url: `https://buywithdali.com/${page.slug}`,
            ...(coverImage ? { image: coverImage } : {}),
            publisher: { '@type': 'Organization', name: 'Buy With Dali', url: 'https://buywithdali.com' }
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-hero-wrapper">
          {coverImage && (
            <div className="lp-hero-image">
              <img src={coverImage} alt={page.title} />
            </div>
          )}
          <div className="lp-hero-text">
            <TitleHeader
              title={page.title}
              subtitle={page.subtitle || heroBlock?.subtitle}
              align="left"
            />
            {(heroBlock?.description || page.description) && (
              <div
                className="lp-block-prose"
                dangerouslySetInnerHTML={{ __html: heroBlock?.description || page.description }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Content Blocks - image left, text right (alternating) */}
      {remainingBlocks.length > 0 && (
        <div className="lp-blocks">
          <div className="lp-blocks-wrapper">
            {remainingBlocks.map((block, index) => (
              <div key={block.id || index} className="lp-block-row">
                {/* Image */}
                {block.image && (
                  <div className={`lp-block-image ${index % 2 === 1 ? 'lp-block-image--right' : ''}`}>
                    <img src={block.image} alt={block.title || `Block ${index + 1}`} />
                  </div>
                )}

                {/* Text */}
                <div className={`lp-block-text ${!block.image ? 'lp-block-text--full' : ''}`}>
                  {block.title && <h2>{block.title}</h2>}
                  {block.subtitle && <h3>{block.subtitle}</h3>}
                  {block.description && (
                    <div className="lp-block-prose" dangerouslySetInnerHTML={{ __html: block.description }} />
                  )}
                </div>

                {/* Image on right for odd rows (re-render for CSS order) */}
                {block.image && index % 2 === 1 && (
                  <div className="lp-block-image lp-block-image--right-mobile">
                    <img src={block.image} alt={block.title || `Block ${index + 1}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rich Content (from WYSIWYG editor) */}
      {page.content && (
        <div className="lp-prose-section">
          <div className="lp-prose-wrapper" dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      )}

      {/* CTA Section */}
      <div className="lp-cta">
        <div className="lp-cta-inner">
          <h2>Ready to Get Started?</h2>
          <p>Contact us today to learn more about our services.</p>
          <a href="/contact-us">Get in Touch</a>
        </div>
      </div>

      {/* Latest Properties */}
      {latestProperties.length > 0 && (
        <PropertyGrid
          properties={latestProperties}
          title="Latest Properties"
          subtitle="Explore our most recent listings"
        />
      )}
    </>
  )
}
