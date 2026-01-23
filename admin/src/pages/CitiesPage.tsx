import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Plus, Trash, Edit, Link2, GripVertical } from 'lucide-react'

type City = {
  id: number
  title: string
  subtitle?: string
  slug: string
  is_home: number
  cover_image?: string
  cover_image_url?: string
  cover_image_alt?: string
  deleted_at?: string | null
  display_order?: number
}

export default function CitiesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [list, setList] = useState<City[]>([])
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
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await api.get('/cities')
      return res.data?.data?.cities || []
    },
  })

  const cities: City[] = useMemo(() => {
    if (!data) return []
    const term = search.toLowerCase()
    return data
      .filter((c: City) => !term || c.title.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term))
      .sort((a: City, b: City) => (a.display_order ?? 0) - (b.display_order ?? 0))
  }, [data, search])

  useEffect(() => {
    setList(cities.map((c, i) => ({ ...c, display_order: c.display_order ?? i + 1 })))
  }, [cities])

  const toggleHome = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: boolean }) => {
      return api.put(`/cities/${id}`, { is_home: value ? 1 : 0 })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cities'] }),
  })

  const deleteCity = useMutation({
    mutationFn: async (id: number) => api.delete(`/cities/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cities'] }),
  })

  const updateOrder = useMutation({
    mutationFn: async (payload: { id: number; display_order: number }[]) => api.put('/cities/reorder', { items: payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cities'] }),
  })

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      return
    }
    const updated = [...list]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(targetIndex, 0, moved)
    const ordered = updated.map((c, i) => ({ ...c, display_order: i + 1 }))
    setList(ordered)
    setDragIndex(null)
    updateOrder.mutate(ordered.map((c, i) => ({ id: c.id, display_order: i + 1 })))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Cities</h1>
            <p className="text-sm text-muted-foreground">Manage city landing pages</p>
          </div>
        </div>
        <Button onClick={() => navigate('/cities/new')}>
          <Plus className="h-4 w-4 mr-2" /> New City
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>All Cities</CardTitle>
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
          {!isLoading && list.length === 0 && <p className="text-muted-foreground">No cities found.</p>}
          {!isLoading && list.map((city, index) => (
            <Card
              key={city.id}
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

              {city.cover_image && !thumbErrors[city.id] ? (
                <img
                  src={toAbsoluteUrl(city.cover_image)}
                  alt={city.cover_image_alt || city.title}
                  className="w-40 h-32 md:w-48 md:h-48 object-cover my-4 ml-1 mr-3 rounded-lg"
                  onError={() => setThumbErrors((prev) => ({ ...prev, [city.id]: true }))}
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
                      <CardTitle className="line-clamp-1">{city.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Link2 className="h-3 w-3 inline mr-1" />
                        <span className="break-all">/community/{city.slug}</span>
                      </p>
                      {city.subtitle && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{city.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs text-muted-foreground">Show in Home</span>
                      <Switch
                        checked={!!city.is_home}
                        onCheckedChange={(checked) => toggleHome.mutate({ id: city.id, value: checked })}
                        className="data-[state=checked]:bg-green-500"
                        aria-label="Toggle city on home"
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/areas?city_id=${city.id}`)}
                      >
                        View Areas
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/cities/${city.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this city?')) deleteCity.mutate(city.id)
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
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
