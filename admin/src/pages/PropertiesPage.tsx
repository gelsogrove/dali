import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  ExternalLink,
  Link2,
  Search,
  RotateCcw,
} from 'lucide-react'
import PropertyJsonInsertDialog from '@/components/PropertyJsonInsertDialog'

type Property = {
  id: number
  property_id_reference: string
  slug: string
  title: string
  subtitle?: string
  property_type: 'active' | 'development' | 'hot_deal' | 'off_market' | 'land'
  status: 'for_sale' | 'sold' | 'reserved'
  property_category: string
  price_usd?: number
  price_on_demand: boolean
  bedrooms?: string
  bathrooms?: string
  city: string
  country: string
  is_active: boolean
  featured: boolean
  show_in_home: boolean
  views_count: number
  cover_image_url?: string
  order?: number
}

const statusColors = {
  for_sale: 'bg-green-500',
  sold: 'bg-gray-500',
  reserved: 'bg-orange-500',
}

const statusLabels = {
  for_sale: 'For Sale',
  sold: 'Sold',
  reserved: 'Reserved',
}

const typeLabels = {
  active: 'Active Property',
  development: 'Development',
  hot_deal: 'Hot Deals',
  off_market: 'Off Market',
  land: 'Land',
}

// Sortable Property Card component
function SortablePropertyCard({
  property,
  index,
  toAbsoluteUrl,
  SITE_URL,
  onToggleActive,
  onToggleHome,
  onDelete,
}: {
  property: Property
  index: number
  toAbsoluteUrl: (url?: string) => string
  SITE_URL: string
  onToggleActive: (property: Property, value: boolean) => void
  onToggleHome: (property: Property, value: boolean) => void
  onDelete: (id: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    width: 'auto',
    height: 'auto',
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="overflow-hidden border border-dashed bg-white"
    >
      <div className="flex gap-3 items-center p-4">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
          <div className="text-xs text-muted-foreground text-center">#{index + 1}</div>
        </div>

        <img
          src={toAbsoluteUrl(property.cover_image_url)}
          alt={property.title}
          className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="96"%3E%3Crect fill="%23ddd" width="128" height="96"/%3E%3C/svg%3E';
          }}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">{typeLabels[property.property_type]}</Badge>
                <Badge className={`${statusColors[property.status]} text-xs`}>{statusLabels[property.status]}</Badge>
              </div>
              <h3 className="font-semibold text-base line-clamp-1">{property.title}</h3>
              {property.subtitle && (
                <p className="text-sm text-muted-foreground line-clamp-1">{property.subtitle}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Link2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">/properties/{property.slug}</span>
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                <span className="font-mono">{property.property_id_reference}</span>
                <span>•</span>
                <span className="truncate">{property.city}, {property.country}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Published</span>
                  <Switch
                    checked={!!property.is_active}
                    onCheckedChange={(v) => onToggleActive(property, v)}
                    className="data-[state=checked]:bg-green-500"
                    aria-label="Toggle property active"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${!property.is_active ? 'text-gray-400' : 'text-muted-foreground'}`}>
                    Show in Home
                  </span>
                  <Switch
                    checked={!!property.show_in_home}
                    onCheckedChange={(v) => onToggleHome(property, v)}
                    disabled={!property.is_active}
                    className="data-[state=checked]:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Toggle show in home"
                  />
                </div>
              
              <Button
                variant="ghost"
                size="sm"
                asChild
                title="View on site"
              >
                <a
                  href={`${SITE_URL}/new/properties/${property.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/properties/${property.id}`}>
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(property.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function PropertiesPage() {
  const queryClient = useQueryClient()

  const defaultFilters = {
    search: '',
    status: 'all',
    type: 'all',
    category: 'all',
    furnishing: 'all',
  }
  
  // Stati di ricerca - cambiano solo quando clicchi Search
  const [searchTerm, setSearchTerm] = useState(defaultFilters.search)
  const [statusFilter, setStatusFilter] = useState<string>(defaultFilters.status)
  const [typeFilter, setTypeFilter] = useState<string>(defaultFilters.type)
  const [categoryFilter, setCategoryFilter] = useState<string>(defaultFilters.category)
  const [furnishingFilter, setFurnishingFilter] = useState<string>(defaultFilters.furnishing)
  
  // Input temporanei - salvano i valori prima di Search
  const [tempSearch, setTempSearch] = useState(defaultFilters.search)
  const [tempStatus, setTempStatus] = useState<string>(defaultFilters.status)
  const [tempType, setTempType] = useState<string>(defaultFilters.type)
  const [tempCategory, setTempCategory] = useState<string>(defaultFilters.category)
  const [tempFurnishing, setTempFurnishing] = useState<string>(defaultFilters.furnishing)
  
  const [list, setList] = useState<Property[]>([])
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [readyAfterDelay, setReadyAfterDelay] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const applyFilters = () => {
    setSearchTerm(tempSearch)
    setStatusFilter(tempStatus)
    setTypeFilter(tempType)
    setCategoryFilter(tempCategory)
    setFurnishingFilter(tempFurnishing)
  }

  const resetFilters = () => {
    setTempSearch(defaultFilters.search)
    setTempStatus(defaultFilters.status)
    setTempType(defaultFilters.type)
    setTempCategory(defaultFilters.category)
    setTempFurnishing(defaultFilters.furnishing)
    setSearchTerm(defaultFilters.search)
    setStatusFilter(defaultFilters.status)
    setTypeFilter(defaultFilters.type)
    setCategoryFilter(defaultFilters.category)
    setFurnishingFilter(defaultFilters.furnishing)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters()
    }
  }

  const API_BASE = import.meta.env.VITE_API_URL || '/api'
  const SITE_URL = 'https://buywithdali.com'
  const assetBase = useMemo(() => API_BASE.replace(/\/api$/, ''), [API_BASE])
  const toAbsoluteUrl = (url?: string) => {
    if (!url) return ''
    const base = assetBase || window.location.origin
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `${base}${url}`
    return `${base}/${url}`
  }

  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.append('q', searchTerm)
    if (statusFilter !== 'all') params.append('status', statusFilter)
    if (typeFilter !== 'all') params.append('property_type', typeFilter)
    if (categoryFilter !== 'all') params.append('property_category', categoryFilter)
    if (furnishingFilter !== 'all') params.append('furnishing_status', furnishingFilter)
    params.append('is_active', 'all')
    params.append('per_page', '100')
    return params.toString()
  }, [searchTerm, statusFilter, typeFilter, categoryFilter, furnishingFilter])

  const appliedFiltersCount = useMemo(() => {
    let count = 0
    if (searchTerm.trim()) count += 1
    if (statusFilter !== defaultFilters.status) count += 1
    if (typeFilter !== defaultFilters.type) count += 1
    if (categoryFilter !== defaultFilters.category) count += 1
    if (furnishingFilter !== defaultFilters.furnishing) count += 1
    return count
  }, [searchTerm, statusFilter, typeFilter, categoryFilter, furnishingFilter, defaultFilters])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['properties', queryParams],
    queryFn: async () => {
      const response = await api.get(`/properties?${queryParams}`)
      const raw = response.data?.data ?? response.data ?? []
      const properties = Array.isArray(raw?.properties) ? raw.properties : Array.isArray(raw) ? raw : []
      const pagination = raw?.pagination ?? null
      return { properties, pagination }
    },
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const properties = (data as any)?.properties || []
    if (properties.length) {
      const ordered = [...properties].sort((a, b) => (a.order || 0) - (b.order || 0))
      setList(ordered)
    } else {
      setList([])
    }
  }, [data])

  useEffect(() => {
    if (isLoading) {
      setReadyAfterDelay(false)
      return
    }
    const timer = setTimeout(() => setReadyAfterDelay(true), 600)
    return () => clearTimeout(timer)
  }, [isLoading, searchTerm])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = list.findIndex((p) => p.id === active.id)
    const newIndex = list.findIndex((p) => p.id === over.id)

    const reorderedList = arrayMove(list, oldIndex, newIndex)
    const ordered = reorderedList.map((p, i) => ({ ...p, order: i + 1 }))
    setList(ordered)

    try {
      const payload = {
        order: ordered.map((p, i) => ({ id: p.id, display_order: i + 1 })),
      }
      console.log('Reorder payload:', payload)
      const response = await api.post('/properties/reorder', payload)
      console.log('Reorder response:', response.data)
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    } catch (error) {
      console.error('Failed to reorder properties:', error)
      refetch()
    }
  }

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const toggleActive = async (property: Property, value: boolean) => {
    // Se si disattiva la pubblicazione, disattivare anche show_in_home
    const updates: any = { is_active: value };
    if (!value && property.show_in_home) {
      updates.show_in_home = 0;
    }
    
    // Optimistic update
    setList((prev) =>
      prev.map((p) => (p.id === property.id ? { ...p, is_active: value, ...(updates.show_in_home !== undefined ? { show_in_home: false } : {}) } : p))
    )
    try {
      const response = await api.put(`/properties/${property.id}`, updates)
      if (response.data?.success === false) {
        throw new Error(response.data.error || 'Failed to update')
      }
      // Refetch to confirm persistence
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    } catch (error: any) {
      console.error('Failed to update is_active', error)
      const msg = error?.response?.data?.error || error?.message || 'Failed to update property'
      setErrorMessage(msg)
      setTimeout(() => setErrorMessage(null), 5000)
      // Revert on error
      setList((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, is_active: !value, ...(updates.show_in_home !== undefined ? { show_in_home: true } : {}) } : p))
      )
    }
  }

  const toggleHome = async (property: Property, value: boolean) => {
    // Non permettere di attivare show_in_home se la proprietà non è pubblicata
    if (value && !property.is_active) {
      setErrorMessage('Cannot show in home: property must be published first');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    // Optimistic update
    setList((prev) =>
      prev.map((p) => (p.id === property.id ? { ...p, show_in_home: value } : p))
    )
    try {
      const response = await api.put(`/properties/${property.id}`, { show_in_home: value ? 1 : 0 })
      if (response.data?.success === false) {
        throw new Error(response.data.error || 'Failed to update')
      }
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    } catch (error: any) {
      console.error('Failed to update show_in_home', error)
      const msg = error?.response?.data?.error || error?.message || 'Failed to update property'
      setErrorMessage(msg)
      setTimeout(() => setErrorMessage(null), 5000)
      // Revert on error
      setList((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, show_in_home: !value } : p))
      )
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      refetch()
    },
  })

  const confirmDelete = () => {
    if (!deleteId) return
    deleteMutation.mutate(deleteId)
  }

  const loadingState = isLoading || !readyAfterDelay

  if (loadingState) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Properties</h1>
          <div className="flex items-center gap-2">
            <PropertyJsonInsertDialog onImported={() => refetch()} />
            <Button asChild>
              <Link to="/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                New Property
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-1/2 bg-gray-200 rounded" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span>{errorMessage}</span>
          <button
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setErrorMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground">
            {(data as any)?.pagination?.total ?? list.length ?? 0} total properties
          </p>
          {appliedFiltersCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {appliedFiltersCount} filter{appliedFiltersCount > 1 ? 's' : ''} applied
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PropertyJsonInsertDialog onImported={() => refetch()} />
          <Button asChild>
            <Link to="/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              New Property
            </Link>
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <Input
              placeholder="Search by title, city, country, tags..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="flex-1 min-w-[280px]"
            />
            
            {/* Filters */}
            <Select value={tempStatus} onValueChange={setTempStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="for_sale">For Sale</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={tempType} onValueChange={setTempType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="hot_deal">Hot Deals</SelectItem>
                <SelectItem value="off_market">Off Market</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={tempCategory} onValueChange={setTempCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="penthouse">Penthouse</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={tempFurnishing} onValueChange={setTempFurnishing}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Furnishing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Furnishing</SelectItem>
                <SelectItem value="furnished">Furnished</SelectItem>
                <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                <SelectItem value="unfurnished">Unfurnished</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <Button onClick={applyFilters} size="sm">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button onClick={resetFilters} variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No properties found</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={list.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-4">
              {list.map((property, idx) => (
                <SortablePropertyCard
                  key={property.id}
                  property={property}
                  index={idx}
                  toAbsoluteUrl={toAbsoluteUrl}
                  SITE_URL={SITE_URL}
                  onToggleActive={toggleActive}
                  onToggleHome={toggleHome}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-semibold">Delete property?</h3>
            <p className="text-muted-foreground">
              Are you sure? This action cannot be undone. All photos and data will be permanently deleted.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
