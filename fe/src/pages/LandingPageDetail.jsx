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
        setPage(pageRes.data?.data)

        // Fetch latest 6 properties
        const propsRes = await api.get('/properties?is_active=1&per_page=6&page=1')
        setLatestProperties(propsRes.data?.data?.properties || [])
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

  // Use content_block_1_image as cover if cover_image not set
  const coverImage = page.content_block_1_image || page.cover_image

  // Collect all content blocks
  const contentBlocks = []
  for (let i = 1; i <= 4; i++) {
    const title = page[`content_block_${i}_title`]
    const subtitle = page[`content_block_${i}_subtitle`]
    const description = page[`content_block_${i}_description`]
    const image = page[`content_block_${i}_image`]
    
    if (title || description || image) {
      contentBlocks.push({
        num: i,
        title,
        subtitle,
        description,
        image,
      })
    }
  }

  return (
    <>
      <Helmet>
        <title>{page.seoTitle || page.title}</title>
        <meta name="description" content={page.seoDescription || page.description} />
        {page.seoKeywords && <meta name="keywords" content={page.seoKeywords} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={page.ogTitle || page.seoTitle || page.title} />
        <meta property="og:description" content={page.ogDescription || page.seoDescription || page.description} />
        {coverImage && <meta property="og:image" content={coverImage} />}
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.ogTitle || page.seoTitle || page.title} />
        <meta name="twitter:description" content={page.ogDescription || page.seoDescription || page.description} />
        {coverImage && <meta name="twitter:image" content={coverImage} />}
      </Helmet>

      {/* Header with Cover Image */}
      {coverImage && (
        <div
          className="h-96 w-full bg-cover bg-center relative"
          style={{ backgroundImage: `url(${coverImage})` }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{page.title}</h1>
              {page.subtitle && <p className="text-xl text-gray-100">{page.subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      {!coverImage && (
        <TitleHeader title={page.title} subtitle={page.subtitle} />
      )}

      {/* Main Content */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Description */}
          {page.description && (
            <div className="prose prose-lg max-w-none mb-12 text-center">
              <p className="text-lg text-gray-600 leading-relaxed">{page.description}</p>
            </div>
          )}

          {/* Rich Content */}
          {page.content && (
            <div
              className="prose prose-lg max-w-none mb-16"
              dangerouslySetInnerHTML={{ __html: page.content }}
            ></div>
          )}

          {/* Content Blocks */}
          {contentBlocks.map((block, index) => (
            <div 
              key={block.num} 
              className={`content-block mb-16 ${index % 2 === 0 ? 'block-even' : 'block-odd'}`}
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Image on left for even, right for odd */}
                {index % 2 === 0 && block.image && (
                  <div className="block-image">
                    <img 
                      src={block.image} 
                      alt={block.title || `Content block ${block.num}`} 
                      className="rounded-lg shadow-lg w-full h-auto"
                    />
                  </div>
                )}
                
                <div className="block-content">
                  {block.title && <h2 className="text-3xl font-bold mb-4">{block.title}</h2>}
                  {block.subtitle && <h3 className="text-xl text-gray-600 mb-4">{block.subtitle}</h3>}
                  {block.description && (
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: block.description }}
                    ></div>
                  )}
                </div>

                {index % 2 === 1 && block.image && (
                  <div className="block-image">
                    <img 
                      src={block.image} 
                      alt={block.title || `Content block ${block.num}`} 
                      className="rounded-lg shadow-lg w-full h-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8 text-lg">Contact us today to learn more about our services.</p>
          <a
            href="/contact-us"
            className="inline-block bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Get in Touch
          </a>
        </div>
      </div>

      {/* Latest Properties */}
      {latestProperties.length > 0 && (
        <div className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Latest Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
