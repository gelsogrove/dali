import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Plus, Trash, Edit } from 'lucide-react'
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
  deleted_at?: string | null
  display_order?: number
}

export default function LandingPagesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const API_BASE = import.meta.env.VITE_API_URL || '/api'
  const assetBase = useMemo(() => API_BASE.replace(/\/api$/, ''), [API_BASE])
  const toAbsoluteUrl = (url?: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `${assetBase}${url}`
    return `${assetBase}/${url}`
  }
  const [thumbErrors, setThumbErrors] = useState<Record<string, boolean>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['landing-pages'],
    queryFn: async () => {
      const res = await api.get('/landing-pages')
      return res.data?.data?.landing_pages || []
    },
  })

  const pages: LandingPage[] = useMemo(() => {
    if (!data) return []
    const term = search.toLowerCase()
    return data.filter(
      (p: LandingPage) => !term || p.title.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term)
    )
  }, [data, search])

  const toggleActive = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: boolean }) => {
      return api.put(`/landing-pages/${id}`, { is_active: value ? 1 : 0 })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing-pages'] }),
  })

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: boolean }) => {
      return api.put(`/landing-pages/${id}`, { featured: value ? 1 : 0 })
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
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

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
                    <th className="text-left py-3 px-4 font-medium">Title</th>
                    <th className="text-left py-3 px-4 font-medium">Slug (URL)</th>
                    <th className="text-center py-3 px-4 font-medium">Active</th>
                    <th className="text-center py-3 px-4 font-medium">Show in Homepage</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {page.cover_image && !thumbErrors[page.id] ? (
                            <img
                              src={toAbsoluteUrl(page.cover_image)}
                              alt={page.cover_image_alt || page.title}
                              className="w-12 h-12 object-cover rounded"
                              onError={() => setThumbErrors((prev) => ({ ...prev, [page.id]: true }))}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded"></div>
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
                          className="switch-green"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Switch
                          checked={!!page.featured}
                          onCheckedChange={(checked) =>
                            toggleFeatured.mutate({ id: page.id, value: checked })
                          }
                          disabled={toggleFeatured.isPending}
                          className="switch-green"
                          disabled={toggleFeatured.isPending}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
