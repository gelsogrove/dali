import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Plus, Trash, Edit, GripVertical } from 'lucide-react'
import './LandingPagesPage.css'

type LandingPage = {
  id: number
  title: string
  subtitle?: string
  slug: string
  is_active: number
  is_home: number
  cover_image?: string
  cover_image_alt?: string
  content_block_1_image?: string
  first_block_image?: string
  deleted_at?: string | null
  display_order?: number
}

export default function LandingPagesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const API_BASE = import.meta.env.VITE_API_URL || '/api'
  const assetBase = useMemo(() => API_BASE.replace(/\/api$/, ''), [API_BASE])
  const toAbsoluteUrl = (url?: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `${assetBase}${url}`
    return `${assetBase}/${url}`
  }
  const [thumbErrors, setThumbErrors] = useState<Record<string, boolean>>({})
  const [list, setList] = useState<LandingPage[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['landing-pages'],
    queryFn: async () => {
      const res = await api.get('/landing-pages')
      return res.data?.data?.landing_pages || []
    },
  })

  const pages: LandingPage[] = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  }, [data])

  const reorderMutation = useMutation({
    mutationFn: async (order: { id: number; display_order: number }[]) => {
      return api.post('/landing-pages/reorder', { order })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] })
    },
  })

  useEffect(() => {
    setList(pages.map((p, i) => ({ ...p, display_order: p.display_order ?? i + 1 })))
  }, [pages])

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      return
    }
    const updated = [...list]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(targetIndex, 0, moved)
    const ordered = updated.map((p, i) => ({ ...p, display_order: i + 1 }))
    setList(ordered)
    setDragIndex(null)
    reorderMutation.mutate(ordered.map((p, i) => ({ id: p.id, display_order: i + 1 })))
  }

  const toggleActive = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: boolean }) => {
      return api.put(`/landing-pages/${id}`, { is_active: value ? 1 : 0 })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing-pages'] }),
  })

  const deletePage = useMutation({
    mutationFn: async (id: number) => api.delete(`/landing-pages/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing-pages'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Landing Pages</h1>
            <p className="text-sm text-muted-foreground">Manage custom landing pages</p>
          </div>
        </div>
        <Button onClick={() => navigate('/landing-pages/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Landing Page
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Landing Pages</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No landing pages found</div>
          ) : (
            <div className="space-y-3">
              {list.map((page, index) => {
                const coverImg = page.first_block_image || page.content_block_1_image || page.cover_image
                return (
                  <Card
                    key={page.id}
                    className={`flex gap-4 items-start ${dragIndex === index ? 'opacity-60 border-dashed' : ''}`}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => setDragIndex(null)}
                  >
                    <div className="p-3 text-muted-foreground flex flex-col items-center justify-start cursor-grab">
                      <GripVertical className="h-5 w-5" />
                      <span className="text-2xs text-muted-foreground mt-1">#{index + 1}</span>
                    </div>

                    {coverImg && !thumbErrors[page.id] ? (
                      <img
                        src={toAbsoluteUrl(coverImg)}
                        alt={page.cover_image_alt || page.title}
                        className="w-32 h-24 object-cover my-4 ml-1 mr-3 rounded-lg"
                        onError={() => setThumbErrors((prev) => ({ ...prev, [page.id]: true }))}
                      />
                    ) : (
                      <div className="w-32 h-24 flex items-center justify-center flex-shrink-0 my-4 ml-1 mr-3 rounded-lg border border-dashed border-gray-300 bg-gradient-to-br from-amber-50 to-rose-50">
                        <div className="placeholder-box w-full h-full rounded-md"></div>
                      </div>
                    )}

                    <div className="flex-1 py-4 pr-4">
                      <CardHeader className="p-0 pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <CardTitle className="line-clamp-1">{page.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="break-all">/{page.slug}</span>
                            </p>
                            {page.subtitle && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{page.subtitle}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-muted-foreground">Active</span>
                            <Switch
                              checked={!!page.is_active}
                              onCheckedChange={(checked) => toggleActive.mutate({ id: page.id, value: checked })}
                              disabled={toggleActive.isPending}
                              className="switch-green"
                            />
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-0">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/landing-pages/${page.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Delete this landing page?')) {
                                deletePage.mutate(page.id)
                              }
                            }}
                            disabled={deletePage.isPending}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
