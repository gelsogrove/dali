import { useState, useEffect, useRef } from 'react'
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
import { ArrowLeft, Save, Lock, Unlock } from 'lucide-react'
import TrixEditor from '@/components/TrixEditor'
import PropertyGalleryUpload from '@/components/PropertyGalleryUpload'
import PropertyLandingPages from '@/components/PropertyLandingPages'
import PropertyAttachments from '@/components/PropertyAttachments'
import TagPicker from '@/components/TagPicker'

export default function PropertyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  // Slugify function
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
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
    youtube_video_url: '',
    tags: [] as string[],
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    og_title: '',
    og_description: '',
    og_image: '',
    is_active: false,
    featured: false,
    show_in_home: false,
    order: '',
    internal_notes: '',
  })

  const isDevelopment = formData.property_type === 'development'
  const isActiveLike = !isDevelopment
  const isLand = formData.property_type === 'land'
  const [rateUsdToMxn, setRateUsdToMxn] = useState(17.5)
  const [rateUsdToEur, setRateUsdToEur] = useState(0.92)
  const [isSlugEditable, setIsSlugEditable] = useState(false)

  const usdToMxn = rateUsdToMxn || 0
  const usdToEur = rateUsdToEur || 0
  const mxnToUsd = usdToMxn ? 1 / usdToMxn : 0
  const mxnToEur = usdToMxn ? usdToEur / usdToMxn : 0
  const eurToUsd = usdToEur ? 1 / usdToEur : 0
  const eurToMxn = usdToEur ? usdToMxn / usdToEur : 0

  useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await api.get(`/properties/${id}`)
      const property = response.data.data
      setFormData({
        title: property.title || '',
        slug: property.slug || '',
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
        youtube_video_url: property.youtube_video_url || '',
        tags: property.tags || [],
        seo_title: property.seo_title || '',
        seo_description: property.seo_description || '',
        seo_keywords: property.seo_keywords || '',
        og_title: property.og_title || '',
        og_description: property.og_description || '',
        og_image: property.og_image || '',
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
  const ogFileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadingOg, setUploadingOg] = useState(false)
  const [ogImageError, setOgImageError] = useState(false)

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

  useEffect(() => {
    const loadRates = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || '/api'
        const [mxnRes, eurRes] = await Promise.all([
          fetch(`${baseUrl}/exchange-rate/current?currency_from=USD&currency_to=MXN`),
          fetch(`${baseUrl}/exchange-rate/current?currency_from=USD&currency_to=EUR`),
        ])
        const mxnData = await mxnRes.json()
        const eurData = await eurRes.json()
        if (mxnData?.success && mxnData?.data?.rate) {
          setRateUsdToMxn(parseFloat(mxnData.data.rate))
        }
        if (eurData?.success && eurData?.data?.rate) {
          setRateUsdToEur(parseFloat(eurData.data.rate))
        }
      } catch (err) {
        console.error('Failed to load exchange rates:', err)
      }
    }
    loadRates()
  }, [])

  useEffect(() => {
    if (formData.property_type === 'land' && !formData.property_categories.includes('land')) {
      setFormData(prev => ({ ...prev, property_categories: ['land'] }))
    }
  }, [formData.property_type, formData.property_categories])

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
      // Require SEO/OG fields before first save to avoid publishing without meta
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
      if (isActiveLike && formData.property_categories.length > 1) {
        alert('Active-like properties can have only one category')
        setActiveTab('info')
        return
      }
      if (formData.property_type === 'land' && !formData.property_categories.includes('land')) {
        alert('Land properties must include the "land" category')
        setActiveTab('info')
        return
      }
      // Price validation removed - no longer required
      
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
      slug: formData.slug,
      subtitle: formData.subtitle,
      property_type: formData.property_type,
      status: formData.status,
      description: formData.description,
      content: formData.content,
      city: formData.city,
      neighborhood: formData.neighborhood,
      state: formData.state,
      address: formData.address,
      google_maps_url: formData.google_maps_url,
      youtube_video_url: formData.youtube_video_url,
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
      og_image: formData.og_image,
    };

    // Always send property_categories (unified)
    payload.property_categories = formData.property_categories;
    // Backward compat: sync property_category = first element
    payload.property_category = formData.property_categories[0] || null;

    if (isDevelopment) {
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
    if (name === 'property_type') {
      setFormData((prev) => {
        const next = { ...prev, [name]: value }
        if (value === 'land') {
          next.property_categories = ['land']
        }
        return next
      })
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const uploadOgImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB')
      return
    }
    setUploadingOg(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('image', file)
      const res = await api.post('/upload/property-image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data?.data?.url
      if (url) {
        setFormData(prev => ({ ...prev, og_image: url }))
        setOgImageError(false)
      }
    } catch (err) {
      console.error('OG image upload failed', err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploadingOg(false)
    }
  }

  const removeOgImage = async () => {
    if (!formData.og_image) return
    if (!confirm('Remove this OG image?')) return
    try {
      await api.delete(`/upload/file?url=${encodeURIComponent(formData.og_image)}`)
    } catch (err) {
      console.error('Failed to delete OG image', err)
    }
    setFormData(prev => ({ ...prev, og_image: '' }))
    setOgImageError(false)
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
              <SelectItem value="hot_deal">Hot Deals (Oportunidades)</SelectItem>
            <SelectItem value="off_market">Off Market</SelectItem>
            <SelectItem value="land">Land (Tierra)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label className="text-sm font-medium">OG Image</Label>
        <div className="flex items-start gap-3">
          {formData.og_image && !ogImageError ? (
            <div className="relative">
              <img
                src={formData.og_image}
                alt="OG preview"
                className="w-40 h-24 object-cover rounded-md border"
                onError={() => setOgImageError(true)}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeOgImage}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-md p-3 text-center w-40 h-24 flex flex-col items-center justify-center bg-muted/30">
              <p className="text-xs text-muted-foreground">Upload OG image</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => ogFileInputRef.current?.click()}
                disabled={uploadingOg}
              >
                {uploadingOg ? 'Uploading...' : 'Select file'}
              </Button>
            </div>
          )}
          <input
            ref={ogFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadOgImage(file)
            }}
          />
          <div className="text-xs text-muted-foreground flex-1">
            Usa un’immagine 1200×630 ottimizzata (&lt;300KB). Se non presente, verrà usata quella di default.
          </div>
        </div>
      </div>
    </div>
  )

  // EDIT: 7 tabs with all fields
  const editForm = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className={`grid w-full ${formData.property_type === 'off_market' ? 'grid-cols-8' : 'grid-cols-9'}`}>
        <TabsTrigger value="info">Basic Info & SEO</TabsTrigger>
        <TabsTrigger value="location">Location</TabsTrigger>
        <TabsTrigger value="price">Pricing</TabsTrigger>
        <TabsTrigger value="gallery">Gallery</TabsTrigger>
        <TabsTrigger value="attachments">Attachments</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
        {formData.property_type !== 'off_market' && <TabsTrigger value="landing">Landing</TabsTrigger>}
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      {/* TAB 1: Info Base */}
      <TabsContent value="info" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Title <span className="text-red-500">*</span></Label>
            <Input 
              name="title" 
              value={formData.title} 
              onChange={(e) => {
                const title = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  title,
                  // Auto-generate slug from title only for new properties
                  slug: isEdit ? prev.slug : slugify(title)
                }));
              }}
              required 
              className={!formData.title.trim() ? 'border-red-300' : ''} 
            />
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
                <SelectItem value="hot_deal">Hot Deals (Oportunidades)</SelectItem>
                <SelectItem value="off_market">Off Market</SelectItem>
                <SelectItem value="land">Land (Tierra)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Slug field - only visible in edit mode */}
        {isEdit && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">URL Slug <span className="text-red-500">*</span></Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSlugEditable(!isSlugEditable)}
                className="h-7 gap-1.5"
              >
                {isSlugEditable ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Lock URL
                  </>
                ) : (
                  <>
                    <Unlock className="h-3.5 w-3.5" />
                    Change URL
                  </>
                )}
              </Button>
            </div>
            <Input 
              name="slug" 
              value={formData.slug} 
              onChange={(e) => setFormData(prev => ({ ...prev, slug: slugify(e.target.value) }))}
              readOnly={!isSlugEditable}
              className={!isSlugEditable ? 'bg-gray-50 cursor-not-allowed' : ''}
              required 
            />
            <p className="text-xs text-muted-foreground mt-1">
              🔗 URL-friendly version: <strong>/properties/{formData.slug || 'property-url'}</strong>
            </p>
          </div>
        )}

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
              {isActiveLike && (
                <span className="text-xs text-muted-foreground font-normal ml-2">(select one)</span>
              )}
              {isDevelopment && (
                <span className="text-xs text-muted-foreground font-normal ml-2">(select one or more)</span>
              )}
            </Label>
            <div className="space-y-2 border rounded-md p-3 bg-slate-50">
              {['apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial'].map(cat => (
                <div key={cat} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`cat-${cat}`}
                    checked={isLand ? cat === 'land' : formData.property_categories.includes(cat)}
                    disabled={isLand && cat !== 'land'}
                    onChange={(e) => {
                      if (isLand) {
                        return
                      }
                      if (isActiveLike) {
                        // Radio-like: only one allowed for active-like types
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

            <div className="space-y-2">
              <Label>OG Image (1200×630)</Label>
              <div className="flex items-start gap-3">
                {formData.og_image && !ogImageError ? (
                  <div className="relative">
                    <img
                      src={formData.og_image}
                      alt="OG preview"
                      className="w-48 h-28 object-cover rounded-md border"
                      onError={() => setOgImageError(true)}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeOgImage}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-md p-4 text-center w-48 h-28 flex flex-col items-center justify-center bg-muted/30">
                    <p className="text-xs text-muted-foreground">Upload OG image</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => ogFileInputRef.current?.click()}
                      disabled={uploadingOg}
                    >
                      {uploadingOg ? 'Uploading...' : 'Select file'}
                    </Button>
                  </div>
                )}
                <input
                  ref={ogFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadOgImage(file)
                  }}
                />
                <div className="text-xs text-muted-foreground flex-1">
                  Raccomandato: JPG/WebP 1200×630 &lt;300KB. Se vuoto, useremo l’immagine di default.
                </div>
              </div>
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
      <TabsContent value="price" className="space-y-6">
        {/* SECTION 1: Price on Demand */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Switch checked={formData.price_on_demand} onCheckedChange={(c) => handleSwitchChange('price_on_demand', c)} />
            <Label className="font-medium">Price on Demand</Label>
          </div>
          <p className="text-xs text-amber-800 mt-2">Enable this if you prefer to show "Contact for pricing" instead of actual price</p>
        </div>

        {!formData.price_on_demand && (
          <>
            {/* SECTION 2: Base Currency */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-900">💱 Base Currency</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, price_base_currency: 'USD' }))}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                    formData.price_base_currency === 'USD'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🇺🇸 USD
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, price_base_currency: 'MXN' }))}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                    formData.price_base_currency === 'MXN'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🇲🇽 MXN
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, price_base_currency: 'EUR' }))}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                    formData.price_base_currency === 'EUR'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🇪🇺 EUR
                </button>
              </div>
              <p className="text-xs text-blue-800 mt-3">
                {formData.price_base_currency === 'USD' 
                  ? 'Enter price in USD - other currencies auto-calculated'
                  : formData.price_base_currency === 'MXN'
                  ? 'Enter price in MXN - other currencies auto-calculated'
                  : 'Enter price in EUR - other currencies auto-calculated'}
              </p>
            </div>

            {/* SECTION 3: Main Price */}
            {!formData.price_negotiable && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-900">💰 {isDevelopment ? 'Fixed Price (Optional)' : 'Property Price'}</h3>
            {formData.price_base_currency === 'USD' ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Price USD
                  </Label>
                  <Input 
                    type="number" 
                    name="price_usd" 
                    value={formData.price_usd} 
                    onChange={(e) => {
                      const usdValue = e.target.value;
                      const mxnValue = usdValue ? Math.round(parseFloat(usdValue) * usdToMxn).toString() : '';
                      const eurValue = usdValue ? Math.round(parseFloat(usdValue) * usdToEur).toString() : '';
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
                    value={formData.price_mxn ? `$${parseFloat(formData.price_mxn).toLocaleString('es-MX', { maximumFractionDigits: 0 })}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Price EUR (auto)</Label>
                  <Input 
                    type="text" 
                    value={formData.price_eur ? `€${parseFloat(formData.price_eur).toLocaleString('it-IT', { maximumFractionDigits: 0 })}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            ) : formData.price_base_currency === 'MXN' ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Price MXN {isActiveLike && <span className="text-red-500">*</span>}
                    {isDevelopment && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
                  </Label>
                  <Input 
                    type="number" 
                    name="price_mxn" 
                    value={formData.price_mxn} 
                    onChange={(e) => {
                      const mxnValue = e.target.value;
                      const usdValue = mxnValue ? Math.round(parseFloat(mxnValue) * mxnToUsd).toString() : '';
                      const eurValue = mxnValue ? Math.round(parseFloat(mxnValue) * mxnToEur).toString() : '';
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
                    value={formData.price_usd ? `$${parseFloat(formData.price_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Price EUR (auto)</Label>
                  <Input 
                    type="text" 
                    value={formData.price_eur ? `€${parseFloat(formData.price_eur).toLocaleString('it-IT', { maximumFractionDigits: 0 })}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Price EUR {isActiveLike && <span className="text-red-500">*</span>}
                    {isDevelopment && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
                  </Label>
                  <Input 
                    type="number" 
                    name="price_eur" 
                    value={formData.price_eur} 
                    onChange={(e) => {
                      const eurValue = e.target.value;
                      const usdValue = eurValue ? Math.round(parseFloat(eurValue) * eurToUsd).toString() : '';
                      const mxnValue = eurValue ? Math.round(parseFloat(eurValue) * eurToMxn).toString() : '';
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
                    value={formData.price_usd ? `$${parseFloat(formData.price_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Price MXN (auto)</Label>
                  <Input 
                    type="text" 
                    value={formData.price_mxn ? `$${parseFloat(formData.price_mxn).toLocaleString('es-MX', { maximumFractionDigits: 0 })}` : ''} 
                    disabled 
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            )}
            </div>
            )}

            {/* SECTION 4: Price Range for Developments */}
            {isDevelopment && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-900">📊 Price Range</h3>
                <p className="text-xs text-purple-800 mb-3">For developments, specify a price range for units</p>
          <div>
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
                        const mxn = val ? Math.round(parseFloat(val) * usdToMxn).toString() : '';
                        const eur = val ? Math.round(parseFloat(val) * usdToEur).toString() : '';
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
                        const mxn = val ? Math.round(parseFloat(val) * usdToMxn).toString() : '';
                        const eur = val ? Math.round(parseFloat(val) * usdToEur).toString() : '';
                        setFormData(prev => ({ ...prev, price_to_usd: val, price_to_mxn: mxn, price_to_eur: eur }));
                      }}
                      step="0.01" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>MXN: {formData.price_from_mxn ? `$${parseFloat(formData.price_from_mxn).toLocaleString('es-MX', { maximumFractionDigits: 0 })}` : '-'}</div>
                  <div>MXN: {formData.price_to_mxn ? `$${parseFloat(formData.price_to_mxn).toLocaleString('es-MX', { maximumFractionDigits: 0 })}` : '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>EUR: {formData.price_from_eur ? `€${parseFloat(formData.price_from_eur).toLocaleString('it-IT', { maximumFractionDigits: 0 })}` : '-'}</div>
                  <div>EUR: {formData.price_to_eur ? `€${parseFloat(formData.price_to_eur).toLocaleString('it-IT', { maximumFractionDigits: 0 })}` : '-'}</div>
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
                        const usd = val ? Math.round(parseFloat(val) * mxnToUsd).toString() : '';
                        const eur = val ? Math.round(parseFloat(val) * mxnToEur).toString() : '';
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
                        const usd = val ? Math.round(parseFloat(val) * mxnToUsd).toString() : '';
                        const eur = val ? Math.round(parseFloat(val) * mxnToEur).toString() : '';
                        setFormData(prev => ({ ...prev, price_to_mxn: val, price_to_usd: usd, price_to_eur: eur }));
                      }}
                      step="0.01" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>USD: {formData.price_from_usd ? `$${parseFloat(formData.price_from_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '-'}</div>
                  <div>USD: {formData.price_to_usd ? `$${parseFloat(formData.price_to_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>EUR: {formData.price_from_eur ? `€${parseFloat(formData.price_from_eur).toLocaleString('it-IT', { maximumFractionDigits: 0 })}` : '-'}</div>
                  <div>EUR: {formData.price_to_eur ? `€${parseFloat(formData.price_to_eur).toLocaleString('it-IT', { maximumFractionDigits: 0 })}` : '-'}</div>
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
                        const usd = val ? Math.round(parseFloat(val) * eurToUsd).toString() : '';
                        const mxn = val ? Math.round(parseFloat(val) * eurToMxn).toString() : '';
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
                        const usd = val ? Math.round(parseFloat(val) * eurToUsd).toString() : '';
                        const mxn = val ? Math.round(parseFloat(val) * eurToMxn).toString() : '';
                        setFormData(prev => ({ ...prev, price_to_eur: val, price_to_usd: usd, price_to_mxn: mxn }));
                      }}
                      step="0.01" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>USD: {formData.price_from_usd ? `$${parseFloat(formData.price_from_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '-'}</div>
                  <div>USD: {formData.price_to_usd ? `$${parseFloat(formData.price_to_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '-'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>MXN: {formData.price_from_mxn ? `$${parseFloat(formData.price_from_mxn).toLocaleString('es-MX', { maximumFractionDigits: 0 })}` : '-'}</div>
                  <div>MXN: {formData.price_to_mxn ? `$${parseFloat(formData.price_to_mxn).toLocaleString('es-MX', { maximumFractionDigits: 0 })}` : '-'}</div>
                </div>
              </div>
            )}
          </div>
              </div>
            )}

            {/* SECTION 5: Price Negotiable Toggle */}
            {!isDevelopment && (
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-900">🤝 Price Negotiable</h3>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.price_negotiable} onCheckedChange={(c) => handleSwitchChange('price_negotiable', c)} />
                  <Label>Allow price negotiation (shows negotiable range below)</Label>
                </div>
              </div>
            )}

            {/* SECTION 6: Negotiable Range */}
            {formData.price_negotiable && !isDevelopment && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-900">🔄 Negotiable Price Range</h3>
                <p className="text-xs text-indigo-800 mb-3">Specify the negotiable price range for this property</p>
          <div>
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
                      const mxn = val ? Math.round(parseFloat(val) * usdToMxn).toString() : '';
                      const eur = val ? Math.round(parseFloat(val) * usdToEur).toString() : '';
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
                      const mxn = val ? Math.round(parseFloat(val) * usdToMxn).toString() : '';
                      const eur = val ? Math.round(parseFloat(val) * usdToEur).toString() : '';
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
                      const usd = val ? Math.round(parseFloat(val) * mxnToUsd).toString() : '';
                      const eur = val ? Math.round(parseFloat(val) * mxnToEur).toString() : '';
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
                      const usd = val ? Math.round(parseFloat(val) * mxnToUsd).toString() : '';
                      const eur = val ? Math.round(parseFloat(val) * mxnToEur).toString() : '';
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
                      const usd = val ? Math.round(parseFloat(val) * eurToUsd).toString() : '';
                      const mxn = val ? Math.round(parseFloat(val) * eurToMxn).toString() : '';
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
                      const usd = val ? Math.round(parseFloat(val) * eurToUsd).toString() : '';
                      const mxn = val ? Math.round(parseFloat(val) * eurToMxn).toString() : '';
                      setFormData(prev => ({ ...prev, price_to_eur: val, price_to_usd: usd, price_to_mxn: mxn }));
                    }}
                    step="0.01" 
                  />
                </div>
              </div>
            )}
          </div>
              </div>
            )}
          </>
        )}
      </TabsContent>

      {/* TAB 3: Details */}
      <TabsContent value="details" className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {isActiveLike ? (
            // ACTIVE-LIKE: Single select for bedrooms
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
          
          {isActiveLike ? (
            // ACTIVE-LIKE: Single select for bathrooms
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

          {isActiveLike ? (
            // ACTIVE-LIKE: Single value
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
                        const sqftValue = sqmValue ? (parseFloat(sqmValue) * 10.7639).toFixed(0) : '';
                        setFormData(prev => ({ ...prev, sqm: sqmValue, sqft: sqftValue }));
                      }}
                      step="0.01" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Size (sq ft) - auto</Label>
                    <Input 
                      type="text" 
                      value={formData.sqft ? `${parseFloat(formData.sqft).toFixed(0)} sq ft` : ''} 
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
                        const sqftVal = val ? (parseFloat(val) * 10.7639).toFixed(0) : '';
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
                        const sqftVal = val ? (parseFloat(val) * 10.7639).toFixed(0) : '';
                        setFormData(prev => ({ ...prev, sqm_max: val, sqft_max: sqftVal }));
                      }}
                      step="0.01" 
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-600">Range in sq ft (auto-calculated)</Label>
                    <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                      {formData.sqft_min && formData.sqft_max 
                        ? `${parseFloat(formData.sqft_min).toFixed(0)} - ${parseFloat(formData.sqft_max).toFixed(0)} sq ft`
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
                value={formData.lot_size_sqm ? `${(parseFloat(formData.lot_size_sqm) * 10.7639).toFixed(0)} sq ft` : ''} 
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
          <Label>Google Maps URL</Label>
          <Textarea 
            name="google_maps_url" 
            value={formData.google_maps_url} 
            onChange={handleChange} 
            rows={3}
            placeholder="Paste any Google Maps URL (e.g., https://www.google.com/maps/place/...)"
          />
          <p className="text-xs text-muted-foreground mt-1">
            🗺️ You can paste any Google Maps link. We'll automatically convert it to the correct format for embedding.
          </p>
        </div>
      </TabsContent>

      {/* TAB 4: Gallery */}
      <TabsContent value="gallery" className="space-y-4">
        {/* Video URL */}
        <div>
          <Label>Video URL (YouTube, Vimeo, o Instagram, opzionale)</Label>
          <Textarea 
            name="youtube_video_url" 
            value={formData.youtube_video_url} 
            onChange={handleChange} 
            rows={3}
            placeholder="Incolla il link YouTube, Vimeo o Instagram (es. https://youtu.be/VIDEO_ID, https://vimeo.com/VIDEO_ID, https://instagram.com/reel/...)"
          />
          <p className="text-xs text-muted-foreground mt-1">
            🎥 Accettiamo YouTube, Vimeo o Instagram; il video sarà mostrato nella pagina del listing.
          </p>
        </div>

        {/* Photo Gallery */}
        {id ? (
          <PropertyGalleryUpload propertyId={parseInt(id)} />
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50">
            <p className="text-muted-foreground mb-2">Gallery Upload</p>
            <p className="text-sm">Save the property first to upload images</p>
          </div>
        )}
      </TabsContent>

      {/* TAB 5: Attachments */}
      <TabsContent value="attachments" className="space-y-4">
        {id ? (
          <PropertyAttachments propertyId={Number(id)} />
        ) : (
          <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/50">
            <p className="text-muted-foreground mb-2">Attachments</p>
            <p className="text-sm">Save the property first to upload attachments</p>
          </div>
        )}
      </TabsContent>

      {/* TAB 6: Tags */}
      <TabsContent value="tags" className="space-y-4">
        <TagPicker
          selectedTags={formData.tags}
          onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
        />
      </TabsContent>

      {/* TAB 7: Landing Pages */}
      {formData.property_type !== 'off_market' && (
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
      )}

      {/* TAB 7: Notes (Internal) */}
      <TabsContent value="notes" className="space-y-4">
         
        <div>
           
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
