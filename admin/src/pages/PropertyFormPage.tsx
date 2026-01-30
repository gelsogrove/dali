import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'
import TrixEditor from '@/components/TrixEditor'
import PropertyGalleryUpload from '@/components/PropertyGalleryUpload'
import PropertyLandingPages from '@/components/PropertyLandingPages'
import TagPicker from '@/components/TagPicker'

export default function PropertyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    property_type: 'active',
    status: 'for_sale',
    property_category: 'apartment',
    description: '',
    content: '',
    price_usd: '',
    exchange_rate: '17.50',
    price_on_demand: false,
    price_negotiable: false,
    price_from_usd: '',
    price_to_usd: '',
    bedrooms: '',
    bathrooms: '',
    sqm: '',
    lot_size_sqm: '',
    year_built: '',
    furnishing_status: 'unfurnished',
    neighborhood: '',
    city: '',
    state: '',
    country: 'Mexico',
    address: '',
    google_maps_url: '',
    tags: [] as string[],
    seo_title: '',
    seo_description: '',
    og_title: '',
    og_description: '',
    is_active: false,
    featured: false,
    internal_notes: '',
  })

  useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await api.get(`/properties/${id}`)
      const property = response.data.data
      setFormData({
        title: property.title || '',
        subtitle: property.subtitle || '',
        property_type: property.property_type || 'active',
        status: property.status || 'for_sale',
        property_category: property.property_category || 'apartment',
        description: property.description || '',
        content: property.content || '',
        price_usd: property.price_usd?.toString() || '',
        exchange_rate: property.exchange_rate?.toString() || '17.50',
        price_on_demand: property.price_on_demand || false,
        price_negotiable: property.price_negotiable || false,
        price_from_usd: property.price_from_usd?.toString() || '',
        price_to_usd: property.price_to_usd?.toString() || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        sqm: property.sqm?.toString() || '',
        lot_size_sqm: property.lot_size_sqm?.toString() || '',
        year_built: property.year_built?.toString() || '',
        furnishing_status: property.furnishing_status || 'unfurnished',
        neighborhood: property.neighborhood || '',
        city: property.city || '',
        state: property.state || '',
        country: property.country || 'Mexico',
        address: property.address || '',
        google_maps_url: property.google_maps_url || '',
        tags: property.tags || [],
        seo_title: property.seo_title || '',
        seo_description: property.seo_description || '',
        og_title: property.og_title || '',
        og_description: property.og_description || '',
        is_active: property.is_active || false,
        featured: property.featured || false,
        internal_notes: property.internal_notes || '',
      })
      return property
    },
    enabled: isEdit,
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        return api.put(`/properties/${id}`, data)
      } else {
        return api.post('/properties', data)
      }
    },
    onSuccess: (response) => {
      // For new properties, navigate to edit page
      if (!isEdit && response.data?.data?.id) {
        navigate(`/properties/${response.data.data.id}`)
      }
      // For edit, just stay on page (no navigation)
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'An error occurred')
    },
  })

  const [invalidField, setInvalidField] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('info')

  // Map fields to their tabs
  const fieldToTab: Record<string, string> = {
    title: 'info', subtitle: 'info', property_type: 'info', status: 'info', property_category: 'info', description: 'info', content: 'info',
    price_usd: 'price', exchange_rate: 'price', price_on_demand: 'price', price_negotiable: 'price', price_from_usd: 'price', price_to_usd: 'price',
    bedrooms: 'price', bathrooms: 'price', sqm: 'price', lot_size_sqm: 'price', year_built: 'price', furnishing_status: 'price',
    neighborhood: 'location', city: 'location', state: 'location', country: 'location', address: 'location', google_maps_url: 'location',
    seo_title: 'seo', seo_description: 'seo', og_title: 'seo', og_description: 'seo',
    internal_notes: 'notes',
  }

  const focusField = (fieldName: string) => {
    setInvalidField(fieldName)
    const tab = fieldToTab[fieldName]
    if (tab) {
      setActiveTab(tab)
    }
    setTimeout(() => {
      const element = document.querySelector(`[name="${fieldName}"]`) as HTMLElement
      if (element) {
        element.focus()
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setInvalidField(null)
    
    // Validations for NEW (title, city, property_type)
    if (!id) {
      if (!formData.title.trim()) {
        focusField('title')
        return
      }
      if (!formData.city.trim()) {
        focusField('city')
        return
      }
    }
    
    // Validations for EDIT (all required fields)
    if (id) {
      if (!formData.title.trim()) {
        focusField('title')
        return
      }
      if (!formData.city.trim()) {
        focusField('city')
        return
      }
      if (!formData.price_on_demand && (!formData.price_usd || parseFloat(formData.price_usd) <= 0)) {
        focusField('price_usd')
        return
      }
      // SEO fields required for EDIT
      if (!formData.seo_title.trim()) {
        focusField('seo_title')
        return
      }
      if (!formData.seo_description.trim()) {
        focusField('seo_description')
        return
      }
      if (!formData.og_title.trim()) {
        focusField('og_title')
        return
      }
      if (!formData.og_description.trim()) {
        focusField('og_description')
        return
      }
    }

    const payload = {
      ...formData,
      price_usd: formData.price_usd ? parseFloat(formData.price_usd) : null,
      exchange_rate: formData.exchange_rate ? parseFloat(formData.exchange_rate) : 17.50,
      price_from_usd: formData.price_from_usd ? parseFloat(formData.price_from_usd) : null,
      price_to_usd: formData.price_to_usd ? parseFloat(formData.price_to_usd) : null,
      sqm: formData.sqm ? parseFloat(formData.sqm) : null,
      lot_size_sqm: formData.lot_size_sqm ? parseFloat(formData.lot_size_sqm) : null,
      year_built: formData.year_built ? parseInt(formData.year_built) : null,
    }
    mutation.mutate(payload)
  }

  const getFieldClass = (fieldName: string) => {
    return invalidField === fieldName ? 'border-red-500 ring-2 ring-red-200' : ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  // INSERT: simple form (only required fields)
  const insertForm = (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Title <span className="text-red-500">*</span></Label>
        <Input name="title" value={formData.title} onChange={handleChange} required className={getFieldClass('title')} />
      </div>

      <div>
        <Label className="text-sm font-medium">Subtitle</Label>
        <Textarea name="subtitle" value={formData.subtitle} onChange={handleChange} rows={3} />
      </div>

      <div>
        <Label className="text-sm font-medium">City <span className="text-red-500">*</span></Label>
        <Input name="city" value={formData.city} onChange={handleChange} required className={getFieldClass('city')} />
      </div>

      <div>
        <Label className="text-sm font-medium">Property Type <span className="text-red-500">*</span></Label>
        <Select value={formData.property_type} onValueChange={(v) => handleSelectChange('property_type', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Property</SelectItem>
            <SelectItem value="development">New Development</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  // EDIT: 7 tabs with all fields
  const editForm = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-8">
        <TabsTrigger value="info">Basic Info</TabsTrigger>
        <TabsTrigger value="price">Pricing</TabsTrigger>
        <TabsTrigger value="location">Location</TabsTrigger>
        <TabsTrigger value="gallery">Gallery</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
        <TabsTrigger value="landing">Landing</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      {/* TAB 1: Info Base */}
      <TabsContent value="info" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Title <span className="text-red-500">*</span></Label>
            <Input name="title" value={formData.title} onChange={handleChange} required className={!formData.title.trim() ? 'border-red-300' : ''} />
          </div>
          <div>
            <Label className="text-sm font-medium">Property Type <span className="text-red-500">*</span></Label>
            <Select value={formData.property_type} onValueChange={(v) => handleSelectChange('property_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Property</SelectItem>
                <SelectItem value="development">New Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Subtitle</Label>
          <Textarea name="subtitle" value={formData.subtitle} onChange={handleChange} rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Status <span className="text-red-500">*</span></Label>
            <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="for_sale">For Sale</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">Property Category <span className="text-red-500">*</span></Label>
            <Select value={formData.property_category} onValueChange={(v) => handleSelectChange('property_category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="penthouse">Penthouse</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea name="description" value={formData.description} onChange={handleChange} rows={3} />
        </div>

        <div>
          <Label>Content (WYSIWYG)</Label>
          <TrixEditor value={formData.content} onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))} />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={formData.is_active} onCheckedChange={(c) => handleSwitchChange('is_active', c)} />
            <Label>Published</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.featured} onCheckedChange={(c) => handleSwitchChange('featured', c)} />
            <Label>Featured</Label>
          </div>
        </div>
      </TabsContent>

      {/* TAB 2: Pricing */}
      <TabsContent value="price" className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Switch checked={formData.price_on_demand} onCheckedChange={(c) => handleSwitchChange('price_on_demand', c)} />
          <Label>Price on Demand</Label>
        </div>

        {!formData.price_on_demand && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Price USD <span className="text-red-500">*</span></Label>
              <Input type="number" name="price_usd" value={formData.price_usd} onChange={handleChange} step="0.01" className={getFieldClass('price_usd')} />
            </div>
            <div>
              <Label>Exchange Rate</Label>
              <Input type="number" step="0.01" name="exchange_rate" value={formData.exchange_rate} onChange={handleChange} />
            </div>
          </div>
        )}

        {formData.property_type === 'development' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price From USD</Label>
              <Input type="number" name="price_from_usd" value={formData.price_from_usd} onChange={handleChange} step="0.01" />
            </div>
            <div>
              <Label>Price To USD</Label>
              <Input type="number" name="price_to_usd" value={formData.price_to_usd} onChange={handleChange} step="0.01" />
            </div>
          </div>
        )}

        {formData.price_negotiable && formData.property_type !== 'development' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price From USD (negotiable range)</Label>
              <Input type="number" name="price_from_usd" value={formData.price_from_usd} onChange={handleChange} step="0.01" />
            </div>
            <div>
              <Label>Price To USD (negotiable range)</Label>
              <Input type="number" name="price_to_usd" value={formData.price_to_usd} onChange={handleChange} step="0.01" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Switch checked={formData.price_negotiable} onCheckedChange={(c) => handleSwitchChange('price_negotiable', c)} />
          <Label>Price Negotiable</Label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Bedrooms</Label>
            <Select value={formData.bedrooms} onValueChange={(v) => handleSelectChange('bedrooms', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5+">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Bathrooms</Label>
            <Select value={formData.bathrooms} onValueChange={(v) => handleSelectChange('bathrooms', v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+'].map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>SQM</Label>
            <Input type="number" name="sqm" value={formData.sqm} onChange={handleChange} step="0.01" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Lot Size SQM</Label>
            <Input type="number" name="lot_size_sqm" value={formData.lot_size_sqm} onChange={handleChange} step="0.01" />
          </div>
          <div>
            <Label>Year Built</Label>
            <Input type="number" name="year_built" value={formData.year_built} onChange={handleChange} />
          </div>
          <div>
            <Label>Furnishing Status</Label>
            <Select value={formData.furnishing_status} onValueChange={(v) => handleSelectChange('furnishing_status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="furnished">Furnished</SelectItem>
                <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                <SelectItem value="unfurnished">Unfurnished</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      {/* TAB 3: Location */}
      <TabsContent value="location" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">City <span className="text-red-500">*</span></Label>
            <Input name="city" value={formData.city} onChange={handleChange} required className={!formData.city.trim() ? 'border-red-300' : ''} />
          </div>
          <div>
            <Label>Neighborhood</Label>
            <Input name="neighborhood" value={formData.neighborhood} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>State</Label>
            <Input name="state" value={formData.state} onChange={handleChange} />
          </div>
          <div>
            <Label>Country</Label>
            <Select value={formData.country} onValueChange={(v) => handleSelectChange('country', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Mexico">Mexico</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="Italy">Italy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Address</Label>
          <Textarea name="address" value={formData.address} onChange={handleChange} rows={2} />
        </div>

        <div>
          <Label>Google Maps Embed URL</Label>
          <Textarea 
            name="google_maps_url" 
            value={formData.google_maps_url} 
            onChange={handleChange} 
            rows={3}
            placeholder="Paste your Google Maps embed URL here (e.g. https://www.google.com/maps/embed?pb=...)"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Get the embed URL from Google Maps: Share → Embed a map → Copy the src URL from the iframe
          </p>
        </div>
      </TabsContent>

      {/* TAB 4: Gallery */}
      <TabsContent value="gallery" className="space-y-4">
        {id ? (
          <PropertyGalleryUpload propertyId={parseInt(id)} />
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50">
            <p className="text-muted-foreground mb-2">Gallery Upload</p>
            <p className="text-sm">Save the property first to upload images</p>
          </div>
        )}
      </TabsContent>

      {/* TAB 5: Tags */}
      <TabsContent value="tags" className="space-y-4">
        <TagPicker
          selectedTags={formData.tags}
          onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
          maxTags={20}
        />
      </TabsContent>

      {/* TAB 6: Landing Pages */}
      <TabsContent value="landing" className="space-y-4">
        {id ? (
          <PropertyLandingPages propertyId={Number(id)} />
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50">
            <p className="text-muted-foreground mb-2">Landing Pages</p>
            <p className="text-sm">Save the property first to associate landing pages</p>
          </div>
        )}
      </TabsContent>

      {/* TAB 7: SEO */}
      <TabsContent value="seo" className="space-y-4">
        <div>
          <Label>SEO Title (max 160 chars) <span className="text-red-500">*</span></Label>
          <Input 
            name="seo_title" 
            value={formData.seo_title} 
            onChange={handleChange} 
            maxLength={160}
            className={getFieldClass('seo_title')}
          />
          <p className="text-xs text-muted-foreground">{formData.seo_title.length}/160</p>
        </div>
        <div>
          <Label>SEO Description (max 320 chars) <span className="text-red-500">*</span></Label>
          <Textarea 
            name="seo_description" 
            value={formData.seo_description} 
            onChange={handleChange} 
            maxLength={320} 
            rows={3}
            className={getFieldClass('seo_description')}
          />
          <p className="text-xs text-muted-foreground">{formData.seo_description.length}/320</p>
        </div>
        <div>
          <Label>OG Title <span className="text-red-500">*</span></Label>
          <Input 
            name="og_title" 
            value={formData.og_title} 
            onChange={handleChange} 
            maxLength={160}
            className={getFieldClass('og_title')}
          />
        </div>
        <div>
          <Label>OG Description <span className="text-red-500">*</span></Label>
          <Textarea 
            name="og_description" 
            value={formData.og_description} 
            onChange={handleChange} 
            maxLength={320} 
            rows={3}
            className={getFieldClass('og_description')}
          />
        </div>
      </TabsContent>

      {/* TAB 7: Notes (Internal) */}
      <TabsContent value="notes" className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-amber-800">
            <strong>Internal Notes:</strong> These notes are only visible in the admin panel and will NOT be displayed on the public website.
          </p>
        </div>
        <div>
          <Label>Internal Notes</Label>
          <Textarea 
            name="internal_notes" 
            value={formData.internal_notes} 
            onChange={handleChange} 
            rows={10}
            placeholder="Add private notes about this property..."
          />
        </div>
      </TabsContent>
    </Tabs>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/properties')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{isEdit ? 'Edit Property' : 'New Property'}</h1>
        </div>
        <Button type="button" onClick={handleSubmit} disabled={mutation.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {mutation.isPending ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            {isEdit ? editForm : insertForm}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
