import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import './SeoRulesPage.css'
import {
  Link2,
  Heading2,
  FileText,
  BookOpen,
  RotateCcw,
  Image,
  Zap,
  Share2,
  Layers,
  CheckCircle2
} from 'lucide-react'

export default function SeoRulesPage() {
  const rules = [
    {
      number: 1,
      title: 'URL',
      icon: Link2,
      color: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      description: 'Every piece of content must have a clear, readable, and concise URL. It\'s recommended not to exceed 80 characters and to avoid unnecessary elements like numbers, dates, or redundant words. Once published, a URL should never be deleted.',
      example: {
        title: 'Example',
        good: 'new.buywithdali.com/luxury-properties-playa-del-carmen',
        bad: 'new.buywithdali.com/page-123-luxury-prop-2024-01-22-final',
      }
    },
    {
      number: 2,
      title: 'Page Title',
      icon: Heading2,
      color: 'bg-purple-50',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
      description: 'The title must always be consistent with the article\'s content. It should clearly describe the topic covered and use the main keywords developed throughout the text. The title should not exceed 60 characters.',
      example: {
        title: 'Example',
        good: 'Luxury Beachfront Properties in Playa del Carmen',
        bad: 'Amazing Properties You Won\'t Believe Exist',
      }
    },
    {
      number: 3,
      title: 'Meta Description',
      icon: FileText,
      color: 'bg-pink-50',
      borderColor: 'border-pink-200',
      iconColor: 'text-pink-600',
      description: 'The description should align with the title and reinforce its meaning. It\'s important to use the same words from the title, writing a clear and natural sentence that previews the page content. The recommended length is between 140 and 160 characters.',
      example: {
        title: 'Example',
        good: 'Discover exclusive luxury beachfront properties in Playa del Carmen. Premium real estate with ocean views, modern amenities, and prime locations.',
        bad: 'This page has great properties',
      }
    },
    {
      number: 4,
      title: 'Content',
      icon: BookOpen,
      color: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      description: 'Content must be original, clear, and genuinely useful to the reader. The text should address the topic declared by the title and avoid content that is too brief, generic, or misleading.',
      example: {
        title: 'Example',
        good: 'Detailed neighborhood guide with local amenities, market trends, investment potential, property types, and buyer testimonials.',
        bad: 'Nice houses here. Very good.',
      }
    },
    {
      number: 5,
      title: 'Pages & Redirects',
      icon: RotateCcw,
      color: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
      description: 'Pages should never be deleted. If content is updated or replaced with new material, it\'s mandatory to create a redirect from the old page to the new one to avoid losing traffic and visibility.',
      example: {
        title: 'Example',
        good: 'Old URL → 301 Redirect → New URL (preserves all link value)',
        bad: 'Delete old page (loses all traffic and backlinks)',
      }
    },
    {
      number: 6,
      title: 'Images & Alt Text',
      icon: Image,
      color: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      iconColor: 'text-indigo-600',
      description: 'All inserted images must have alt text filled in. The alt text should describe the image simply and relevantly to the content, avoiding automatic or generic descriptions.',
      example: {
        title: 'Example',
        good: 'Modern luxury villa with ocean view and private pool in Playa del Carmen',
        bad: 'image123.jpg or image',
      }
    },
    {
      number: 7,
      title: 'Image Weight',
      icon: Zap,
      color: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      description: 'Images should not be too heavy. Large file sizes slow down page loading and worsen user experience. It\'s always recommended to use web-optimized images.',
      example: {
        title: 'Example',
        good: 'JPG 100KB - WebP 45KB - PNG optimized 80KB (all load in <2s)',
        bad: 'RAW image 5MB - RAW 8MB (slow loading, poor UX)',
      }
    },
    {
      number: 8,
      title: 'Open Graph & Social',
      icon: Share2,
      color: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      description: 'For social sharing, Open Graph fields must be correctly filled out, particularly the title and image. The social title should be consistent with the page title and article content.',
      example: {
        title: 'Example',
        good: 'og:title: "Luxury Properties in Playa del Carmen" | og:image: high-quality-property.jpg',
        bad: 'Missing Open Graph tags or mismatched titles',
      }
    },
    {
      number: 9,
      title: 'Overall Consistency',
      icon: Layers,
      color: 'bg-teal-50',
      borderColor: 'border-teal-200',
      iconColor: 'text-teal-600',
      description: 'Title, description, URL, content, and images should all address the same topic. Consistency is fundamental to helping readers immediately understand the page subject.',
      example: {
        title: 'Example',
        good: 'URL, Title, Description, Content & Images all about "Beachfront Luxury"',
        bad: 'Title: Luxury Properties | Description: Budget homes | Content: Investment tips',
      }
    },
    {
      number: 10,
      title: 'Core Principle',
      icon: CheckCircle2,
      color: 'bg-lime-50',
      borderColor: 'border-lime-200',
      iconColor: 'text-lime-600',
      description: 'If content is clear and understandable to the reader, it is also correct from an SEO perspective.',
      example: {
        title: 'Example',
        good: 'Reader understands immediately what the page offers → Google ranks it well',
        bad: 'Confusing content → Poor user experience → Lower rankings',
      }
    },
  ]

  return (
    <div className="seo-rules-container">
      {/* Header */}
      <div className="seo-rules-header">
        <div className="header-content">
          <h1>SEO RULES</h1>
          <p>Essential guide to optimize content according to SEO best practices</p>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="seo-rules-grid">
        {rules.map((rule) => {
          const IconComponent = rule.icon
          return (
            <Card
              key={rule.number}
              className={`seo-rule-card ${rule.color} border-2 ${rule.borderColor}`}
            >
              <CardHeader className="pb-3">
                <div className="rule-header">
                  <div className={`rule-number ${rule.iconColor}`}>
                    {rule.number}
                  </div>
                  <IconComponent className={`rule-icon ${rule.iconColor}`} />
                </div>
                <CardTitle className="text-lg">{rule.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="rule-description">{rule.description}</p>

                {/* Example Section */}
                <div className="rule-example mt-4 pt-4 border-t border-gray-200">
                  <p className="example-label font-semibold text-sm mb-3">{rule.example.title}</p>

                  <div className="example-item mb-3">
                    <p className="example-type text-xs font-bold text-green-700 mb-1">✓ GOOD:</p>
                    <p className="example-text text-sm text-gray-700 bg-green-50 p-2 rounded border-l-2 border-green-500">
                      {rule.example.good}
                    </p>
                  </div>

                  <div className="example-item">
                    <p className="example-type text-xs font-bold text-red-700 mb-1">✗ BAD:</p>
                    <p className="example-text text-sm text-gray-700 bg-red-50 p-2 rounded border-l-2 border-red-500">
                      {rule.example.bad}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Footer Note */}
      <div className="seo-rules-footer">
        <div className="footer-content">
          <CheckCircle2 className="check-icon" />
          <p><strong>Remember:</strong> Consistency between URL, title, description, content, and images is the foundation of a good SEO strategy. Follow these rules to ensure the best results.</p>
        </div>
      </div>
    </div>
  )
}
