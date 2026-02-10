import { useState, useEffect } from 'react'
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
    property_categories: ['apartment'] as string[],  // Always array (active=1, development=N)
    description: '',
    content: '',
    price_base_currency: 'USD' as 'USD' | 'MXN' | 'EUR',
    price_usd: '',
    price_mxn: '',
    price_eur: '',
    exchange_rate: '',  // L'utente deve inserire il rate attuale
    price_on_demand: false,
    price_negotiable: false,
    price_from_usd: '',
    price_to_usd: '',
    price_from_mxn: '',
    price_to_mxn: '',
    price_from_eur: '',
    price_to_eur: '',
    bedrooms: '',
    bedrooms_min: '',
    bedrooms_max: '',
    bathrooms: '',
    bathrooms_min: '',
    bathrooms_max: '',
    sqm: '',
    sqft: '',
    sqm_min: '',
    sqm_max: '',
    sqft_min: '',
    sqft_max: '',
    lot_size_sqm: '',
    size_unit: 'sqm' as 'sqm' | 'sqft',
    year_built: '',
    furnishing_status: 'unfurnished',
    neighborhood: '',
    city: '',
    state: '',
    country: 'Mexico',
    address: '',
    latitude: '',
    longitude: '',
    google_maps_url: '',
    tags: [] as string[],
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    og_title: '',
    og_description: '',
    is_active: false,
    featured: false,
    show_in_home: false,
    order: '',
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
        property_categories: property.property_categories?.length
          ? property.property_categories
          : property.property_category
            ? [property.property_category]
            : ['apartment'],
        description: property.description || '',
        content: property.content || '',
        price_base_currency: (property.price_base_currency as 'USD' | 'MXN' | 'EUR') || 'USD',
        price_usd: property.price_usd?.toString() || '',
        price_mxn: property.price_mxn?.toString() || '',
        price_eur: property.price_eur?.toString() || '',
        exchange_rate: property.exchange_rate?.toString() || '',  // Caricare dal DB, non default
        price_on_demand: property.price_on_demand || false,
        price_negotiable: property.price_negotiable || false,
        price_from_usd: property.price_from_usd?.toString() || '',
        price_to_usd: property.price_to_usd?.toString() || '',
        price_from_mxn: property.price_from_mxn?.toString() || '',
        price_to_mxn: property.price_to_mxn?.toString() || '',
        price_from_eur: property.price_from_eur?.toString() || '',
        price_to_eur: property.price_to_eur?.toString() || '',
        bedrooms: property.bedrooms || '',
        bedrooms_min: property.bedrooms_min || '',
        bedrooms_max: property.bedrooms_max || '',
        bathrooms: property.bathrooms || '',
        bathrooms_min: property.bathrooms_min || '',
        bathrooms_max: property.bathrooms_max || '',
        sqm: property.sqm?.toString() || '',
        sqft: property.sqft?.toString() || '',
        sqm_min: property.sqm_min?.toString() || '',
        sqm_max: property.sqm_max?.toString() || '',
        sqft_min: property.sqft_min?.toString() || '',
        sqft_max: property.sqft_max?.toString() || '',
        lot_size_sqm: property.lot_size_sqm?.toString() || '',
        size_unit: 'sqm' as 'sqm' | 'sqft',
        year_built: property.year_built?.toString() || '',
        furnishing_status: property.furnishing_status || 'unfurnished',
        neighborhood: property.neighborhood || '',
        city: property.city || '',
        state: property.state || '',
        country: property.country || 'Mexico',
        address: property.address || '',
        latitude: property.latitude?.toString() || '',
        longitude: property.longitude?.toString() || '',
        google_maps_url: property.google_maps_url || '',
        tags: property.tags || [],
        seo_title: property.seo_title || '',
        seo_description: property.seo_description || '',
        seo_keywords: property.seo_keywords || '',
        og_title: property.og_title || '',
        og_description: property.og_description || '',
        is_active: property.is_active || false,
        featured: property.featured || false,
        show_in_home: property.show_in_home || false,
        order: property.order?.toString() || '',
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

  // Load global exchange rate on mount (only for new properties)
  useEffect(() => {
    if (!isEdit && !formData.exchange_rate) {
      fetch(`${import.meta.env.VITE_API_URL}/exchange-rate/current`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.rate) {
            setFormData(prev => ({
              ...prev,
              exchange_rate: data.data.rate
            }))
          }
        })
        .catch(err => console.error('Failed to load global exchange rate:', err))
    }
  }, [isEdit, formData.exchange_rate])

  // Map fields to their tabs
  const fieldToTab: Record<string, string> = {
    title: 'info', subtitle: 'info', property_type: 'info', status: 'info', property_categories: 'info', description: 'info', content: 'info',
    seo_title: 'info', seo_description: 'info', og_title: 'info', og_description: 'info',
    price_usd: 'price', exchange_rate: 'price', price_on_demand: 'price', price_negotiable: 'price', price_from_usd: 'price', price_to_usd: 'price',
    bedrooms: 'price', bathrooms: 'price', sqm: 'price', lot_size_sqm: 'price', year_built: 'price', furnishing_status: 'price',
    neighborhood: 'location', city: 'location', state: 'location', country: 'location', address: 'location', google_maps_url: 'location',
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
      // Validate categories: property_categories is always an array
      if (!formData.property_categories || formData.property_categories.length === 0) {
        alert('Please select at least one category')
        setActiveTab('info')
        return
      }
      if (formData.property_type === 'active' && formData.property_categories.length > 1) {
        alert('Active properties can have only one category')
        setActiveTab('info')
        return
      }
      // Price validation: per developments usare range, per active usare price_usd
      if (!formData.price_on_demand) {
        if (formData.property_type === 'active') {
          if (!formData.price_usd || parseFloat(formData.price_usd) <= 0) {
            focusField('price_usd')
            return
          }
        } else if (formData.property_type === 'development') {
          // Per developments: validare che ci sia almeno un range
          if ((!formData.price_from_usd || parseFloat(formData.price_from_usd) <= 0) &&
              (!formData.price_from_mxn || parseFloat(formData.price_from_mxn) <= 0)) {
            alert('Please enter a price range for the development')
            focusField('price_from_usd')
            return
          }
        }
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

    // Costruire payload pulito in base a property_type
    const payload: any = {
      title: formData.title,
      subtitle: formData.subtitle,
      property_type: formData.property_type,
      status: formData.status,
      description: formData.description,
      content: formData.content,
      city: formData.city,
      neighborhood: formData.neighborhood,
      country: formData.country,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      price_base_currency: formData.price_base_currency,
      price_usd: formData.price_usd ? parseFloat(formData.price_usd) : null,
      price_mxn: formData.price_mxn ? parseFloat(formData.price_mxn) : null,
      exchange_rate: formData.exchange_rate ? parseFloat(formData.exchange_rate) : 20.0,
      price_on_demand: formData.price_on_demand,
      price_negotiable: formData.price_negotiable,
      price_from_usd: formData.price_from_usd ? parseFloat(formData.price_from_usd) : null,
      price_to_usd: formData.price_to_usd ? parseFloat(formData.price_to_usd) : null,
      price_from_mxn: formData.price_from_mxn ? parseFloat(formData.price_from_mxn) : null,
      price_to_mxn: formData.price_to_mxn ? parseFloat(formData.price_to_mxn) : null,
      sqm: formData.sqm ? parseFloat(formData.sqm) : null,
      sqft: formData.sqft ? parseFloat(formData.sqft) : null,
      sqm_min: formData.sqm_min ? parseFloat(formData.sqm_min) : null,
      sqm_max: formData.sqm_max ? parseFloat(formData.sqm_max) : null,
      sqft_min: formData.sqft_min ? parseFloat(formData.sqft_min) : null,
      sqft_max: formData.sqft_max ? parseFloat(formData.sqft_max) : null,
      lot_size_sqm: formData.lot_size_sqm ? parseFloat(formData.lot_size_sqm) : null,
      year_built: formData.year_built ? parseInt(formData.year_built) : null,
      furnishing_status: formData.furnishing_status,
      tags: formData.tags,
      is_active: formData.is_active,
      featured: formData.featured,
      show_in_home: formData.show_in_home,
      order: formData.order ? parseInt(formData.order) : 0,
      internal_notes: formData.internal_notes,
      seo_title: formData.seo_title,
      seo_description: formData.seo_description,
      seo_keywords: formData.seo_keywords,
    };

    // Always send property_categories (unified)
    payload.property_categories = formData.property_categories;
    // Backward compat: sync property_category = first element
    payload.property_category = formData.property_categories[0] || null;

    if (formData.property_type === 'development') {
      payload.bedrooms_min = formData.bedrooms_min || null;
      payload.bedrooms_max = formData.bedrooms_max || null;
      payload.bathrooms_min = formData.bathrooms_min || null;
      payload.bathrooms_max = formData.bathrooms_max || null;
    } else {
      // Active property
      payload.bedrooms = formData.bedrooms || null;
      payload.bathrooms = formData.bathrooms || null;
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
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="info">Basic Info & SEO</TabsTrigger>
        <TabsTrigger value="price">Pricing</TabsTrigger>
        <TabsTrigger value="location">Location</TabsTrigger>
        <TabsTrigger value="gallery">Gallery</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
        <TabsTrigger value="landing">Landing</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      {/* TAB 1: Info Base */}
      <TabsContent value="info" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Title <span className="text-red-500">*</span></Label>
            <Input name="title" value={formData.title} onChange={handleChange} required className={!formData.title.trim() ? 'border-red-300' : ''} />
            <p className="text-xs text-muted-foreground mt-1">
              📌 <strong>Main heading</strong> displayed at the top of the property page and in listings
            </p>
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
          <Textarea name="subtitle" value={formData.subtitle} onChange={handleChange} rows={2} />
          <p className="text-xs text-muted-foreground mt-1">
            📝 <strong>Secondary heading</strong> shown below the title (optional short description or tagline)
          </p>
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
            <Label className="text-sm font-medium">
              Property Category <span className="text-red-500">*</span>
              {formData.property_type === 'active' && (
                <span className="text-xs text-muted-foreground font-normal ml-2">(select one)</span>
              )}
              {formData.property_type === 'development' && (
                <span className="text-xs text-muted-foreground font-normal ml-2">(select one or more)</span>
              )}
            </Label>
            <div className="space-y-2 border rounded-md p-3 bg-slate-50">
              {['apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial'].map(cat => (
                <div key={cat} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`cat-${cat}`}
                    checked={formData.property_categories.includes(cat)}
                    onChange={(e) => {
                      if (formData.property_type === 'active') {
                        // Radio-like: only one allowed for active
                        setFormData(prev => ({
                          ...prev,
                          property_categories: e.target.checked ? [cat] : []
                        }))
                      } else {
                        // Multi-select for developments
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            property_categories: [...prev.property_categories, cat]
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            property_categories: prev.property_categories.filter(c => c !== cat)
                          }))
                        }
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor={`cat-${cat}`} className="capitalize cursor-pointer text-sm">
                    {cat}
                  </label>
                </div>
              ))}
              {formData.property_categories.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">Select at least one category</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea name="description" value={formData.description} onChange={handleChange} rows={3} />
        </div>

        <div>
          <Label>Content</Label>
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

        {/* SEO FIELDS */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-2">SEO & Social Media</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These fields control how your property appears in Google search results and when shared on social media platforms.
          </p>
          
          {/* Info Box for SEO vs OG */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-blue-900 mb-2">🔍 SEO Fields (Google Search)</h4>
                <p className="text-xs text-blue-800">
                  Controls what users see when they search for properties on Google, Bing, and other search engines.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-green-900 mb-2">📱 OG Fields (Social Sharing)</h4>
                <p className="text-xs text-green-800">
                  Controls the preview card when someone shares the property link on WhatsApp, Facebook, LinkedIn, or Twitter.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>SEO Title (max 160 chars) <span className="text-red-500">*</span></Label>
              <Input 
                name="seo_title" 
                value={formData.seo_title} 
                onChange={handleChange} 
                maxLength={160}
                className={getFieldClass('seo_title')}
              />
              <p className="text-xs text-muted-foreground mt-1">{formData.seo_title.length}/160 characters</p>
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
              <p className="text-xs text-muted-foreground mt-1">{formData.seo_description.length}/320 characters</p>
            </div>
            
            <div>
              <Label>OG Title (Facebook/LinkedIn) <span className="text-red-500">*</span></Label>
              <Input 
                name="og_title" 
                value={formData.og_title} 
                onChange={handleChange} 
                maxLength={160}
                className={getFieldClass('og_title')}
              />
            </div>
            
            <div>
              <Label>OG Description (Facebook/LinkedIn) <span className="text-red-500">*</span></Label>
              <Textarea 
                name="og_description" 
                value={formData.og_description} 
                onChange={handleChange} 
                maxLength={320} 
                rows={3}
                className={getFieldClass('og_description')}
              />
              <p className="text-xs text-muted-foreground mt-1">{formData.og_description.length}/320 characters</p>
            </div>
          </div>
          
          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-sm mb-3">📋 Quick Reference: Where Each Text Appears</h4>
            <div className="space-y-2 text-xs">
              <div className="flex gap-2">
                <span className="font-semibold min-w-[140px]">Title:</span>
                <span className="text-muted-foreground">Main heading on property page + listing cards</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[140px]">Subtitle:</span>
                <span className="text-muted-foreground">Secondary text below title (optional tagline)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[140px]">Description:</span>
                <span className="text-muted-foreground">Short summary in property cards/previews</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[140px]">Content:</span>
                <span className="text-muted-foreground">Full rich-text description in detail page</span>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <span className="font-semibold min-w-[140px]">Address:</span>
                <span className="text-muted-foreground">Full street address shown on property page</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[140px]">Neighborhood:</span>
                <span className="text-muted-foreground">Area/zone name in property details</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[140px]">City:</span>
                <span className="text-muted-foreground">City name in property details + filters</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[140px]">State:</span>
                <span className="text-muted-foreground">State/region in property details</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[140px]">Google Maps URL:</span>
                <span className="text-muted-foreground">Interactive map embed on property page</span>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <span className="font-semibold min-w-[140px]">SEO Title/Desc:</span>
                <span className="text-muted-foreground">SEO for Google indexing and search results</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold min-w-[140px]">OG Title/Desc:</span>
                <span className="text-muted-foreground">Preview card for social media sharing (WhatsApp, Facebook, LinkedIn)</span>
              </div>
            </div>
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
          <>
            {/* BASE CURRENCY TOGGLE */}
            <div className="bg-slate-50 border rounded-lg p-4 mb-4">
              <Label className="text-sm font-medium mb-2 block">Base Currency</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, price_base_currency: 'USD' }))}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                    formData.price_base_currency === 'USD'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🇺🇸 USD (Dollars)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, price_base_currency: 'MXN' }))}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                    formData.price_base_currency === 'MXN'
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🇲🇽 MXN (Pesos)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, price_base_currency: 'EUR' }))}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                    formData.price_base_currency === 'EUR'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🇪🇺 EUR (Euros)
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.price_base_currency === 'USD' 
                  ? 'Prices entered in USD will be automatically converted to MXN and EUR'
                  : formData.price_base_currency === 'MXN'
                  ? 'Prices entered in MXN will be automatically converted to USD and EUR'
                  : 'Prices entered in EUR will be automatically converted to USD and MXN'}
              </p>
            </div>

            {/* EXCHANGE RATE */}
            <div>
              <Label className="flex items-center gap-2">
                Exchange Rate (1 USD = ? MXN)
                <span className="text-xs font-normal text-muted-foreground bg-blue-50 px-2 py-0.5 rounded">
                  Global Rate (Auto-loaded)
                </span>
              </Label>
              <Input 
                type="number" 
                step="0.01" 
                name="exchange_rate" 
                value={formData.exchange_rate} 
                onChange={(e) => {
                  const newRate = e.target.value;
                  setFormData(prev => {
                    const updated = { ...prev, exchange_rate: newRate };
                    // Auto-recalculate based on base currency
                    if (prev.price_base_currency === 'USD' && prev.price_usd) {
                      updated.price_mxn = (parseFloat(prev.price_usd) * parseFloat(newRate || '0')).toFixed(2);
                    } else if (prev.price_base_currency === 'MXN' && prev.price_mxn) {
                      updated.price_usd = (parseFloat(prev.price_mxn) / parseFloat(newRate || '1')).toFixed(2);
                    }
                    return updated;
                  });
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This rate is automatically loaded from the global settings. You can adjust it if needed for this specific property.
              </p>
            </div>

            {/* MAIN PRICE - CONDITIONAL BASED ON BASE CURRENCY */}
            {/* Per developments, il prezzo singolo è opzionale */}
            {formData.price_base_currency === 'USD' ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Price USD {formData.property_type === 'active' && <span className="text-red-500">*</span>}
                    {formData.property_type === 'development' && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
                  </Label>
                  <Input 
                    type="number" 
                    name="price_usd" 
                    value={formData.price_usd} 
                    onChange={(e) => {
                      const usdValue = e.target.value;
                      const usdToMxn = 17.50; // TODO: Load from exchange_rates
                      const usdToEur = 0.92;
                      const mxnValue = usdValue ? (parseFloat(usdValue) * usdToMxn).toFixed(2) : '';
                      const eurValue = usdValue ? (parseFloat(usdValue) * usdToEur).toFixed(2) : '';
                      setFormData(prev => ({ ...prev, price_usd: usdValue, price_mxn: mxnValue, price_eur: eurValue }));
                    }}
                    step="0.01" 
                    className={getFieldClass('price_usd')} 
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Price MXN (auto)</Label>
                  <Input 
                    type="text" 
                    value={formData.price_mxn ? `$${parseFloat(formData.price_mxn).toLocaleString('es-MX')}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Price EUR (auto)</Label>
                  <Input 
                    type="text" 
                    value={formData.price_eur ? `€${parseFloat(formData.price_eur).toLocaleString('it-IT')}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            ) : formData.price_base_currency === 'MXN' ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Price MXN {formData.property_type === 'active' && <span className="text-red-500">*</span>}
                    {formData.property_type === 'development' && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
                  </Label>
                  <Input 
                    type="number" 
                    name="price_mxn" 
                    value={formData.price_mxn} 
                    onChange={(e) => {
                      const mxnValue = e.target.value;
                      const mxnToUsd = 1 / 17.50;
                      const mxnToEur = 1 / 19.10;
                      const usdValue = mxnValue ? (parseFloat(mxnValue) * mxnToUsd).toFixed(2) : '';
                      const eurValue = mxnValue ? (parseFloat(mxnValue) * mxnToEur).toFixed(2) : '';
                      setFormData(prev => ({ ...prev, price_mxn: mxnValue, price_usd: usdValue, price_eur: eurValue }));
                    }}
                    step="0.01" 
                    className={getFieldClass('price_mxn')} 
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Price USD (auto)</Label>
                  <Input 
                    type="text" 
                    value={formData.price_usd ? `$${parseFloat(formData.price_usd).toLocaleString('en-US')}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Price EUR (auto)</Label>
                  <Input 
                    type="text" 
                    value={formData.price_eur ? `€${parseFloat(formData.price_eur).toLocaleString('it-IT')}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Price EUR {formData.property_type === 'active' && <span className="text-red-500">*</span>}
                    {formData.property_type === 'development' && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
                  </Label>
                  <Input 
                    type="number" 
                    name="price_eur" 
                    value={formData.price_eur} 
                    onChange={(e) => {
                      const eurValue = e.target.value;
                      const eurToUsd = 1 / 0.92;
                      const eurToMxn = 19.10;
                      const usdValue = eurValue ? (parseFloat(eurValue) * eurToUsd).toFixed(2) : '';
                      const mxnValue = eurValue ? (parseFloat(eurValue) * eurToMxn).toFixed(2) : '';
                      setFormData(prev => ({ ...prev, price_eur: eurValue, price_usd: usdValue, price_mxn: mxnValue }));
                    }}
                    step="0.01" 
                    className={getFieldClass('price_eur')} 
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Price USD (auto)</Label>
                  <Input 
                    type="text" 
                    value={formData.price_usd ? `$${parseFloat(formData.price_usd).toLocaleString('en-US')}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Price MXN (auto)</Label>
                  <Input 
                    type="text" 
                    value={formData.price_mxn ? `$${parseFloat(formData.price_mxn).toLocaleString('es-MX')}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* PRICE RANGE FOR DEVELOPMENTS */}
        {formData.property_type === 'development' && !formData.price_on_demand && (
          <div>
            <Label className="text-sm font-medium mb-2">Price Range (for developments)</Label>
            {formData.price_base_currency === 'USD' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">From USD</Label>
                    <Input 
                      type="number" 
                      name="price_from_usd" 
                      value={formData.price_from_usd} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const mxn = val ? (parseFloat(val) * 17.50).toFixed(2) : '';
                        const eur = val ? (parseFloat(val) * 0.92).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, price_from_usd: val, price_from_mxn: mxn, price_from_eur: eur }));
                      }}
                      step="0.01" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">To USD</Label>
                    <Input 
                      type="number" 
                      name="price_to_usd" 
                      value={formData.price_to_usd} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const mxn = val ? (parseFloat(val) * 17.50).toFixed(2) : '';
                        const eur = val ? (parseFloat(val) * 0.92).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, price_to_usd: val, price_to_mxn: mxn, price_to_eur: eur }));
                      }}
                      step="0.01" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>MXN: {formData.price_from_mxn ? `$${parseFloat(formData.price_from_mxn).toLocaleString('es-MX')}` : '-'}</div>
                  <div>MXN: {formData.price_to_mxn ? `$${parseFloat(formData.price_to_mxn).toLocaleString('es-MX')}` : '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>EUR: {formData.price_from_eur ? `€${parseFloat(formData.price_from_eur).toLocaleString('it-IT')}` : '-'}</div>
                  <div>EUR: {formData.price_to_eur ? `€${parseFloat(formData.price_to_eur).toLocaleString('it-IT')}` : '-'}</div>
                </div>
              </div>
            ) : formData.price_base_currency === 'MXN' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">From MXN</Label>
                    <Input 
                      type="number" 
                      name="price_from_mxn" 
                      value={formData.price_from_mxn} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const usd = val ? (parseFloat(val) / 17.50).toFixed(2) : '';
                        const eur = val ? (parseFloat(val) / 19.10).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, price_from_mxn: val, price_from_usd: usd, price_from_eur: eur }));
                      }}
                      step="0.01" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">To MXN</Label>
                    <Input 
                      type="number" 
                      name="price_to_mxn" 
                      value={formData.price_to_mxn} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const usd = val ? (parseFloat(val) / 17.50).toFixed(2) : '';
                        const eur = val ? (parseFloat(val) / 19.10).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, price_to_mxn: val, price_to_usd: usd, price_to_eur: eur }));
                      }}
                      step="0.01" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>USD: {formData.price_from_usd ? `$${parseFloat(formData.price_from_usd).toLocaleString('en-US')}` : '-'}</div>
                  <div>USD: {formData.price_to_usd ? `$${parseFloat(formData.price_to_usd).toLocaleString('en-US')}` : '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>EUR: {formData.price_from_eur ? `€${parseFloat(formData.price_from_eur).toLocaleString('it-IT')}` : '-'}</div>
                  <div>EUR: {formData.price_to_eur ? `€${parseFloat(formData.price_to_eur).toLocaleString('it-IT')}` : '-'}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">From EUR</Label>
                    <Input 
                      type="number" 
                      name="price_from_eur" 
                      value={formData.price_from_eur} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const usd = val ? (parseFloat(val) / 0.92).toFixed(2) : '';
                        const mxn = val ? (parseFloat(val) * 19.10).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, price_from_eur: val, price_from_usd: usd, price_from_mxn: mxn }));
                      }}
                      step="0.01" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">To EUR</Label>
                    <Input 
                      type="number" 
                      name="price_to_eur" 
                      value={formData.price_to_eur} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const usd = val ? (parseFloat(val) / 0.92).toFixed(2) : '';
                        const mxn = val ? (parseFloat(val) * 19.10).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, price_to_eur: val, price_to_usd: usd, price_to_mxn: mxn }));
                      }}
                      step="0.01" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>USD: {formData.price_from_usd ? `$${parseFloat(formData.price_from_usd).toLocaleString('en-US')}` : '-'}</div>
                  <div>USD: {formData.price_to_usd ? `$${parseFloat(formData.price_to_usd).toLocaleString('en-US')}` : '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>MXN: {formData.price_from_mxn ? `$${parseFloat(formData.price_from_mxn).toLocaleString('es-MX')}` : '-'}</div>
                  <div>MXN: {formData.price_to_mxn ? `$${parseFloat(formData.price_to_mxn).toLocaleString('es-MX')}` : '-'}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {formData.price_negotiable && formData.property_type !== 'development' && !formData.price_on_demand && (
          <div>
            <Label className="text-sm font-medium mb-2">Negotiable Range</Label>
            {formData.price_base_currency === 'USD' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">From USD</Label>
                  <Input 
                    type="number" 
                    name="price_from_usd" 
                    value={formData.price_from_usd} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const mxn = val ? (parseFloat(val) * 17.50).toFixed(2) : '';
                      const eur = val ? (parseFloat(val) * 0.92).toFixed(2) : '';
                      setFormData(prev => ({ ...prev, price_from_usd: val, price_from_mxn: mxn, price_from_eur: eur }));
                    }}
                    step="0.01" 
                  />
                </div>
                <div>
                  <Label className="text-xs">To USD</Label>
                  <Input 
                    type="number" 
                    name="price_to_usd" 
                    value={formData.price_to_usd} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const mxn = val ? (parseFloat(val) * 17.50).toFixed(2) : '';
                      const eur = val ? (parseFloat(val) * 0.92).toFixed(2) : '';
                      setFormData(prev => ({ ...prev, price_to_usd: val, price_to_mxn: mxn, price_to_eur: eur }));
                    }}
                    step="0.01" 
                  />
                </div>
              </div>
            ) : formData.price_base_currency === 'MXN' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">From MXN</Label>
                  <Input 
                    type="number" 
                    name="price_from_mxn" 
                    value={formData.price_from_mxn} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const usd = val ? (parseFloat(val) / 17.50).toFixed(2) : '';
                      const eur = val ? (parseFloat(val) / 19.10).toFixed(2) : '';
                      setFormData(prev => ({ ...prev, price_from_mxn: val, price_from_usd: usd, price_from_eur: eur }));
                    }}
                    step="0.01" 
                  />
                </div>
                <div>
                  <Label className="text-xs">To MXN</Label>
                  <Input 
                    type="number" 
                    name="price_to_mxn" 
                    value={formData.price_to_mxn} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const usd = val ? (parseFloat(val) / 17.50).toFixed(2) : '';
                      const eur = val ? (parseFloat(val) / 19.10).toFixed(2) : '';
                      setFormData(prev => ({ ...prev, price_to_mxn: val, price_to_usd: usd, price_to_eur: eur }));
                    }}
                    step="0.01" 
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">From EUR</Label>
                  <Input 
                    type="number" 
                    name="price_from_eur" 
                    value={formData.price_from_eur} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const usd = val ? (parseFloat(val) / 0.92).toFixed(2) : '';
                      const mxn = val ? (parseFloat(val) * 19.10).toFixed(2) : '';
                      setFormData(prev => ({ ...prev, price_from_eur: val, price_from_usd: usd, price_from_mxn: mxn }));
                    }}
                    step="0.01" 
                  />
                </div>
                <div>
                  <Label className="text-xs">To EUR</Label>
                  <Input 
                    type="number" 
                    name="price_to_eur" 
                    value={formData.price_to_eur} 
                    onChange={(e) => {
                      const val = e.target.value;
                      const usd = val ? (parseFloat(val) / 0.92).toFixed(2) : '';
                      const mxn = val ? (parseFloat(val) * 19.10).toFixed(2) : '';
                      setFormData(prev => ({ ...prev, price_to_eur: val, price_to_usd: usd, price_to_mxn: mxn }));
                    }}
                    step="0.01" 
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Switch checked={formData.price_negotiable} onCheckedChange={(c) => handleSwitchChange('price_negotiable', c)} />
          <Label>Price Negotiable</Label>
        </div>

        {/* BEDROOMS AND BATHROOMS - CONDITIONAL BASED ON PROPERTY TYPE */}
        <div className="grid grid-cols-2 gap-4">
          {formData.property_type === 'active' ? (
            // ACTIVE PROPERTY: Single select for bedrooms
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
          ) : (
            // DEVELOPMENT: Range (min to max)
            <div>
              <Label className="text-sm font-medium mb-2">Bedrooms Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600">From</Label>
                  <Select value={formData.bedrooms_min} onValueChange={(v) => handleSelectChange('bedrooms_min', v)}>
                    <SelectTrigger><SelectValue placeholder="Min" /></SelectTrigger>
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
                  <Label className="text-xs text-gray-600">To</Label>
                  <Select value={formData.bedrooms_max} onValueChange={(v) => handleSelectChange('bedrooms_max', v)}>
                    <SelectTrigger><SelectValue placeholder="Max" /></SelectTrigger>
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
              </div>
            </div>
          )}
          
          {formData.property_type === 'active' ? (
            // ACTIVE PROPERTY: Single select for bathrooms
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
          ) : (
            // DEVELOPMENT: Range (min to max)
            <div>
              <Label className="text-sm font-medium mb-2">Bathrooms Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-600">From</Label>
                  <Select value={formData.bathrooms_min} onValueChange={(v) => handleSelectChange('bathrooms_min', v)}>
                    <SelectTrigger><SelectValue placeholder="Min" /></SelectTrigger>
                    <SelectContent>
                      {['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+'].map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">To</Label>
                  <Select value={formData.bathrooms_max} onValueChange={(v) => handleSelectChange('bathrooms_max', v)}>
                    <SelectTrigger><SelectValue placeholder="Max" /></SelectTrigger>
                    <SelectContent>
                      {['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+'].map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIZE FIELDS WITH UNIT SELECTOR */}
        <div className="bg-slate-50 border rounded-lg p-4">
          <Label className="text-sm font-medium mb-3 block">Property Size</Label>
          
          {/* UNIT SELECTOR */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, size_unit: 'sqm' }))}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                formData.size_unit === 'sqm'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              m² (Square Meters)
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, size_unit: 'sqft' }))}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                formData.size_unit === 'sqft'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              sq ft (Square Feet)
            </button>
          </div>

          {formData.property_type === 'active' ? (
            // ACTIVE PROPERTY: Single value
            <div className="grid grid-cols-2 gap-4">
              {formData.size_unit === 'sqm' ? (
                <>
                  <div>
                    <Label className="text-xs">Size (m²)</Label>
                    <Input 
                      type="number" 
                      name="sqm" 
                      value={formData.sqm} 
                      onChange={(e) => {
                        const sqmValue = e.target.value;
                        const sqftValue = sqmValue ? (parseFloat(sqmValue) * 10.7639).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, sqm: sqmValue, sqft: sqftValue }));
                      }}
                      step="0.01" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Size (sq ft) - auto</Label>
                    <Input 
                      type="text" 
                      value={formData.sqft ? `${parseFloat(formData.sqft).toFixed(2)} sq ft` : ''} 
                      disabled 
                      className="bg-gray-50 text-gray-600"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-xs">Size (sq ft)</Label>
                    <Input 
                      type="number" 
                      name="sqft" 
                      value={formData.sqft} 
                      onChange={(e) => {
                        const sqftValue = e.target.value;
                        const sqmValue = sqftValue ? (parseFloat(sqftValue) / 10.7639).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, sqft: sqftValue, sqm: sqmValue }));
                      }}
                      step="0.01" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Size (m²) - auto</Label>
                    <Input 
                      type="text" 
                      value={formData.sqm ? `${parseFloat(formData.sqm).toFixed(2)} m²` : ''} 
                      disabled 
                      className="bg-gray-50 text-gray-600"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            // DEVELOPMENT: Range (min to max)
            <div>
              <Label className="text-sm font-medium mb-2">Size Range (for developments)</Label>
              {formData.size_unit === 'sqm' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">From (m²)</Label>
                    <Input 
                      type="number" 
                      name="sqm_min" 
                      value={formData.sqm_min} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const sqftVal = val ? (parseFloat(val) * 10.7639).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, sqm_min: val, sqft_min: sqftVal }));
                      }}
                      step="0.01" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">To (m²)</Label>
                    <Input 
                      type="number" 
                      name="sqm_max" 
                      value={formData.sqm_max} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const sqftVal = val ? (parseFloat(val) * 10.7639).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, sqm_max: val, sqft_max: sqftVal }));
                      }}
                      step="0.01" 
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-600">Range in sq ft (auto-calculated)</Label>
                    <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                      {formData.sqft_min && formData.sqft_max 
                        ? `${parseFloat(formData.sqft_min).toFixed(2)} - ${parseFloat(formData.sqft_max).toFixed(2)} sq ft`
                        : 'Enter m² range above'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">From (sq ft)</Label>
                    <Input 
                      type="number" 
                      name="sqft_min" 
                      value={formData.sqft_min} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const sqmVal = val ? (parseFloat(val) / 10.7639).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, sqft_min: val, sqm_min: sqmVal }));
                      }}
                      step="0.01" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs">To (sq ft)</Label>
                    <Input 
                      type="number" 
                      name="sqft_max" 
                      value={formData.sqft_max} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const sqmVal = val ? (parseFloat(val) / 10.7639).toFixed(2) : '';
                        setFormData(prev => ({ ...prev, sqft_max: val, sqm_max: sqmVal }));
                      }}
                      step="0.01" 
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-600">Range in m² (auto-calculated)</Label>
                    <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                      {formData.sqm_min && formData.sqm_max 
                        ? `${parseFloat(formData.sqm_min).toFixed(2)} - ${parseFloat(formData.sqm_max).toFixed(2)} m²`
                        : 'Enter sq ft range above'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <div>
              <Label>Lot Size (m²)</Label>
              <Input 
                type="number" 
                name="lot_size_sqm" 
                value={formData.lot_size_sqm} 
                onChange={handleChange} 
                step="0.01" 
              />
            </div>
            <div>
              <Label className="text-gray-600">Lot Size (sq ft) - auto</Label>
              <Input 
                type="text" 
                value={formData.lot_size_sqm ? `${(parseFloat(formData.lot_size_sqm) * 10.7639).toFixed(2)} sq ft` : ''} 
                disabled 
                className="bg-gray-50 text-gray-600"
              />
            </div>
          </div>
          <div>
            <Label>Year Built</Label>
            <Input type="number" name="year_built" value={formData.year_built} onChange={handleChange} />
          </div>
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
