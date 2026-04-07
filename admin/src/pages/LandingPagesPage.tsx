import { useMemo, useState } from 'react'
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
  featured: number
  cover_image?: string
  cover_image_alt?: string
  content_block_1_image?: string
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
  const [draggedId, setDraggedId] = useState<number | null>(null)

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

  const handleDragStart = (id: number) => {
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetId: number) => {
    if (!draggedId || draggedId === targetId) return

    const newPages = [...pages]
    const draggedIndex = newPages.findIndex((p) => p.id === draggedId)
    const targetIndex = newPages.findIndex((p) => p.id === targetId)

    const [removed] = newPages.splice(draggedIndex, 1)
    newPages.splice(targetIndex, 0, removed)

    const order = newPages.map((p, idx) => ({
      id: p.id,
      display_order: idx,
    }))

    reorderMutation.mutate(order)
    setDraggedId(null)
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
          ) : pages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No landing pages found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="w-12"></th>
                    <th className="text-left py-3 px-4 font-medium">Title</th>
                    <th className="text-left py-3 px-4 font-medium">Slug (URL)</th>
                    <th className="text-center py-3 px-4 font-medium">Active</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => {
                    const coverImg = page.content_block_1_image || page.cover_image
                    return (
                      <tr
                        key={page.id}
                        className="border-b hover:bg-gray-50 transition cursor-move"
                        draggable
                        onDragStart={() => handleDragStart(page.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(page.id)}
                      >
                        <td className="py-3 px-4 w-12">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {coverImg && !thumbErrors[page.id] ? (
                              <img
                                src={toAbsoluteUrl(coverImg)}
                                alt={page.cover_image_alt || page.title}
                                className="w-20 h-20 object-cover rounded"
                                onError={() => setThumbErrors((prev) => ({ ...prev, [page.id]: true }))}
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-300 rounded flex items-center justify-center">
                                <span className="text-gray-500 text-xs">No Image</span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{page.title}</div>
                              {page.subtitle && <div className="text-xs text-muted-foreground">{page.subtitle}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">/{page.slug}</code>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Switch
                            checked={!!page.is_active}
                            onCheckedChange={(checked) =>
                              toggleActive.mutate({ id: page.id, value: checked })
                            }
                            disabled={toggleActive.isPending}
                            className="switch-green"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/landing-pages/${page.id}`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
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
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
