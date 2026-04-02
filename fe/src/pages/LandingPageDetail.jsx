import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import SEO from '../components/SEO'
import TitleHeader from '../components/TitleHeader'
import { api } from '../config/api'
import './LandingPageDetail.css'

export default function LandingPageDetail() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return

    const fetchPage = async () => {
      try {
        setIsLoading(true)
        const res = await api.get(`/landing-pages/slug/${slug}`)
        setPage(res.data?.data)
      } catch (err) {
        console.error('Error fetching landing page:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPage()
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

  return (
    <>
      <Helmet>
        <title>{page.seoTitle || page.title}</title>
        <meta name="description" content={page.seoDescription || page.description} />
        {page.seoKeywords && <meta name="keywords" content={page.seoKeywords} />}
        
        {/* Open Graph */}
        <meta property="og:title" content={page.ogTitle || page.title} />
        <meta property="og:description" content={page.ogDescription || page.description} />
        {page.ogImage && <meta property="og:image" content={page.ogImage} />}
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={page.ogTitle || page.title} />
        <meta name="twitter:description" content={page.ogDescription || page.description} />
        {page.ogImage && <meta name="twitter:image" content={page.ogImage} />}
      </Helmet>

      {/* Header with Cover Image */}
      {page.cover_image && (
        <div
          className="h-96 w-full bg-cover bg-center relative"
          style={{ backgroundImage: `url(${page.cover_image})` }}
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

      {!page.cover_image && (
        <TitleHeader title={page.title} subtitle={page.subtitle} />
      )}

      {/* Main Content */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Description */}
          {page.description && (
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-lg text-gray-600 leading-relaxed">{page.description}</p>
            </div>
          )}

          {/* Rich Content */}
          {page.content && (
            <div
              className="prose prose-lg max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: page.content }}
            ></div>
          )}
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
    </>
  )
}
