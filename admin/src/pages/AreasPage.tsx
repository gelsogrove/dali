import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Edit, Plus, Trash, Link2, GripVertical } from 'lucide-react'

type Area = {
  id: number
  city_id: number
  city_slug?: string
  title: string
  slug: string
  subtitle?: string
  is_home: number
  cover_image?: string
  cover_image_url?: string
  cover_image_alt?: string
  display_order?: number
}

type City = { id: number; title: string; slug: string }

export default function AreasPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [list, setList] = useState<Area[]>([])
  const location = useLocation()
  const API_BASE = import.meta.env.VITE_API_URL || '/api'
  const assetBase = useMemo(() => API_BASE.replace(/\/api$/, ''), [API_BASE])
  const toAbsoluteUrl = (url?: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `${assetBase}${url}`
    return `${assetBase}/${url}`
  }
  const [thumbErrors, setThumbErrors] = useState<Record<string, boolean>>({})

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await api.get('/cities')
      return res.data?.data?.cities || []
    },
  })

  const { data: areasData = [], isLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const res = await api.get('/areas')
      return res.data?.data?.areas || []
    },
  })

  const areas: Area[] = useMemo(() => {
    const term = search.toLowerCase()
    const params = new URLSearchParams(location.search)
    const cityFilter = params.get('city_id')
    return areasData
      .filter((a: Area) => !term || a.title.toLowerCase().includes(term) || a.slug.toLowerCase().includes(term))
      .filter((a: Area) => !cityFilter || String(a.city_id) === cityFilter)
      .sort((a: Area, b: Area) => (a.display_order ?? 0) - (b.display_order ?? 0))
  }, [areasData, search, location.search])

  useEffect(() => {
    setList(areas.map((a, i) => ({ ...a, display_order: a.display_order ?? i + 1 })))
  }, [areas])

  const toggleHome = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: boolean }) => api.put(`/areas/${id}`, { is_home: value ? 1 : 0 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })

  const updateOrder = useMutation({
    mutationFn: async (payload: { id: number; display_order: number }[]) =>
      api.put('/areas/reorder', { items: payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })

  const deleteArea = useMutation({
    mutationFn: async (id: number) => api.delete(`/areas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['areas'] }),
  })

  const cityById = (id: number) => cities.find((c: City) => c.id === id)

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      return
    }
    const updated = [...list]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(targetIndex, 0, moved)
    const ordered = updated.map((a, i) => ({ ...a, display_order: i + 1 }))
    setList(ordered)
    setDragIndex(null)
    updateOrder.mutate(ordered.map((a, i) => ({ id: a.id, display_order: i + 1 })))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Areas</h1>
            <p className="text-sm text-muted-foreground">Manage area landing pages</p>
          </div>
        </div>
        <Button onClick={() => navigate('/areas/new')}>
          <Plus className="h-4 w-4 mr-2" /> New Area
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>All Areas</CardTitle>
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p>Loading...</p>}
          {!isLoading && list.length === 0 && <p className="text-muted-foreground">No areas found.</p>}
          {!isLoading && list.map((area, index) => {
            const city = cityById(area.city_id)
            return (
              <Card
                key={area.id}
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

                {area.cover_image && !thumbErrors[area.id] ? (
                  <img
                    src={toAbsoluteUrl(area.cover_image)}
                    alt={area.cover_image_alt || area.title}
                    className="w-40 h-32 md:w-48 md:h-48 object-cover my-4 ml-1 mr-3 rounded-lg"
                    onError={() => setThumbErrors((prev) => ({ ...prev, [area.id]: true }))}
                  />
                ) : (
                  <div className="w-40 h-32 md:w-48 md:h-48 flex items-center justify-center flex-shrink-0 my-4 ml-1 mr-3 rounded-lg border border-dashed border-gray-300 bg-gradient-to-br from-amber-50 to-rose-50">
                    <div className="placeholder-box w-full h-full rounded-md"></div>
                  </div>
                )}
                
                <div className="flex-1 py-4 pr-4">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1">{area.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Link2 className="h-3 w-3 inline mr-1" />
                          <span className="break-all">/community/{city?.slug}/{area.slug}</span>
                        </p>
                        {city && <p className="text-xs text-muted-foreground">City: {city.title}</p>}
                        {area.subtitle && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{area.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs text-muted-foreground">Show in Home</span>
                        <Switch
                          checked={!!area.is_home}
                          onCheckedChange={(checked) => toggleHome.mutate({ id: area.id, value: checked })}
                          className="data-[state=checked]:bg-green-500"
                          aria-label="Toggle area on home"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {/* Placeholder for additional info */}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/areas/${area.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this area?')) deleteArea.mutate(area.id)
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
