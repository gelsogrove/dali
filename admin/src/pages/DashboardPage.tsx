import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import api from '@/lib/api'

type MiniBlog = { id: number; title: string; slug: string; published_date?: string }
type MiniVideo = { id: number; title: string; video_url: string }
type MiniTestimonial = { id: number; author: string; testimonial_date?: string }

export default function DashboardPage() {
  const [blogs, setBlogs] = useState<MiniBlog[]>([])
  const [videos, setVideos] = useState<MiniVideo[]>([])
  const [testimonials, setTestimonials] = useState<MiniTestimonial[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [b, v, t] = await Promise.all([
          api.get('/blogs?is_home=1&per_page=6'),
          api.get('/videos?is_home=1&per_page=6'),
          api.get('/testimonials?is_home=1&per_page=6'),
        ])
        setBlogs((b.data?.data?.blogs || []).map((x: any) => ({
          id: x.id,
          title: x.title,
          slug: x.slug,
          published_date: x.published_date || x.created_at,
        })))
        setVideos((v.data?.data?.videos || []).map((x: any) => ({
          id: x.id,
          title: x.title,
          video_url: x.video_url,
        })))
        setTestimonials((t.data?.data?.testimonials || []).map((x: any) => ({
          id: x.id,
          author: x.author,
          testimonial_date: x.testimonial_date,
        })))
      } catch (err) {
        console.error('Failed to load home data', err)
      }
    }
    load()
  }, [])

  const formatDate = (value?: string) => {
    if (!value) return ''
    const d = new Date(value)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const SummaryCard = ({
    title,
    items,
    render,
  }: {
    title: string
    items: any[]
    render: (item: any) => React.ReactNode
  }) => (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {items.length === 0 && <p className="text-muted-foreground">Nothing selected for home.</p>}
        {items.map(render)}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6" />
  )
}
