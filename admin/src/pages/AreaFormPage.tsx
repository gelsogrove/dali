import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Upload, X } from 'lucide-react'
import api from '@/lib/api'
import TrixEditor from '@/components/TrixEditor'

type AreaForm = {
  city_id: number | ''
  title: string
  subtitle: string
  slug: string
  cover_image: string
  cover_image_alt: string
  content_image: string
  content_image_alt: string
  fullContent: string
  seoTitle: string
  seoDescription: string
  ogTitle: string
  ogDescription: string
  is_home: number
  display_order: number
}

const emptyForm: AreaForm = {
  city_id: '',
  title: '',
  subtitle: '',
  slug: '',
  cover_image: '',
  cover_image_alt: '',
  content_image: '',
  content_image_alt: '',
  fullContent: '',
  seoTitle: '',
  seoDescription: '',
  ogTitle: '',
  ogDescription: '',
  is_home: 0,
  display_order: 0,
}

type City = { id: number; title: string; slug: string }

export default function AreaFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<AreaForm>(emptyForm)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingContent, setUploadingContent] = useState(false)
  const [coverError, setCoverError] = useState(false)
  const [contentError, setContentError] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const contentInputRef = useRef<HTMLInputElement>(null)

  const apiBase = import.meta.env.VITE_API_URL || '/api'
  const assetBase = useMemo(() => apiBase.replace(/\/api$/, ''), [apiBase])
  const toAbsoluteUrl = (url?: string) => (url ? (url.startsWith('http') ? url : `${assetBase}${url}`) : '')

  const { data: cities = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await api.get('/cities')
      return res.data?.data?.cities || []
    },
  })

  const areaQuery = useQuery({
    queryKey: ['area', id],
    enabled: isEdit,
    queryFn: async () => {
      const res = await api.get(`/areas/${id}`)
      return res.data?.data
    },
  })

  // Load data when query succeeds
  useEffect(() => {
    const area = areaQuery.data
    if (!area) return
    setFormData({
      city_id: area.city_id,
      title: area.title || '',
      subtitle: area.subtitle || '',
      slug: area.slug || '',
      cover_image: area.cover_image || '',
      cover_image_alt: area.cover_image_alt || '',
      content_image: area.content_image || '',
      content_image_alt: area.content_image_alt || '',
      fullContent: area.fullContent || '',
      seoTitle: area.seoTitle || '',
      seoDescription: area.seoDescription || '',
      ogTitle: area.ogTitle || '',
      ogDescription: area.ogDescription || '',
      is_home: area.is_home ? 1 : 0,
      display_order: area.display_order || 0,
    })
  }, [areaQuery.data])

  const mutation = useMutation({
    mutationFn: async (payload: AreaForm) => {
      const body = { ...payload, is_home: payload.is_home ? 1 : 0, city_id: Number(payload.city_id) }
      if (isEdit) return api.put(`/areas/${id}`, body)
      return api.post('/areas', body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] })
      navigate('/areas')
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: name === 'city_id' ? Number(value) : value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: string[] = []
    if (!formData.city_id) errors.push('Select a city')
    if (!formData.title.trim()) errors.push('Title is required')
    if (!formData.slug.trim()) errors.push('URL is required')
    if (!formData.seoTitle.trim()) errors.push('Title tag is required')
    if (!formData.seoDescription.trim()) errors.push('Meta description is required')
    if (!formData.ogTitle.trim()) errors.push('OG Title is required')
    if (!formData.ogDescription.trim()) errors.push('OG Description is required')
    if (formData.cover_image && !formData.cover_image_alt.trim()) errors.push('Alt text is required for cover image')
    if (formData.content_image && !formData.content_image_alt.trim()) errors.push('Alt text is required for content image')
    if (errors.length) {
      alert(errors.join('\n'))
      return
    }
    mutation.mutate({
      ...formData,
      slug: formData.slug.trim() || slugify(formData.title),
      is_home: formData.is_home ? 1 : 0,
    })
  }

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'area-slug'

  const uploadImage = async (file: File, target: 'cover_image' | 'content_image') => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB')
      return
    }
    const setUploading = target === 'cover_image' ? setUploadingCover : setUploadingContent
    setUploading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await api.post('/upload/area-image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data?.data?.url
      if (url) {
        setFormData((prev) => ({ ...prev, [target]: url }))
      }
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (target: 'cover_image' | 'content_image') => {
    const current = formData[target]
    if (!current) return
    if (!confirm('Remove this image?')) return
    try {
      await api.delete(`/upload/file?url=${encodeURIComponent(current)}`)
      setFormData((prev) => ({
        ...prev,
        [target]: '',
        ...(target === 'cover_image' ? { cover_image_alt: '' } : { content_image_alt: '' }),
      }))
    } catch (err) {
      console.error(err)
      alert('Failed to remove image')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/areas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{isEdit ? 'Edit Area' : 'New Area'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Area Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">City *</label>
                <select
                  name="city_id"
                  value={formData.city_id}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select a city</option>
                  {cities.map((c: City) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title (H1) *</label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                    if (!isEdit) {
                      setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                    }
                  }}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Short description</label>
                <Textarea
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief summary for listings"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!formData.is_home}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_home: checked ? 1 : 0 }))}
                  className="data-[state=checked]:bg-green-500"
                />
                <span className="text-sm font-medium">Show on Home</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold">Images</p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Upload the cover and (optional) content image
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-gray-200 bg-white/70 p-4">
                <p className="text-sm font-semibold">Cover image</p>
                {formData.cover_image && !coverError ? (
                  <div className="relative inline-block">
                    <img
                      src={toAbsoluteUrl(formData.cover_image)}
                      alt="Cover"
                      className="object-cover rounded-lg border"
                      style={{ width: '100%', maxWidth: 360, height: 240 }}
                      onError={() => setCoverError(true)}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage('cover_image')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition"
                    role="button"
                    tabIndex={0}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-700">Upload cover</p>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) uploadImage(e.target.files[0], 'cover_image')
                      }}
                      disabled={uploadingCover}
                      className="hidden"
                    />
                    {uploadingCover && <p className="text-sm text-primary mt-2">Uploading...</p>}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Alt text *</label>
                  <Input
                    name="cover_image_alt"
                    value={formData.cover_image_alt}
                    onChange={handleChange}
                    required={!!formData.cover_image}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-gray-200 bg-white/70 p-4">
                <p className="text-sm font-semibold">Content image (optional)</p>
                {formData.content_image && !contentError ? (
                  <div className="relative inline-block">
                    <img
                      src={toAbsoluteUrl(formData.content_image)}
                      alt="Content"
                      className="object-cover rounded-lg border"
                      style={{ width: '100%', maxWidth: 360, height: 240 }}
                      onError={() => setContentError(true)}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage('content_image')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition"
                    role="button"
                    tabIndex={0}
                    onClick={() => contentInputRef.current?.click()}
                  >
                    <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-700">Upload content image</p>
                    <input
                      ref={contentInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) uploadImage(e.target.files[0], 'content_image')
                      }}
                      disabled={uploadingContent}
                      className="hidden"
                    />
                    {uploadingContent && <p className="text-sm text-primary mt-2">Uploading...</p>}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-medium">Content image alt</label>
                  <Input
                    name="content_image_alt"
                    value={formData.content_image_alt}
                    onChange={handleChange}
                    required={!!formData.content_image}
                  />
                </div>
              </div>
            </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Full content</label>
              <TrixEditor
              value={formData.fullContent}
              onChange={(value) => setFormData((prev) => ({ ...prev, fullContent: value }))}
              placeholder="Write your content..."
            />
            </div>

            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-semibold">SEO optimization</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">LNK (url)</label>
                  <Input 
                    name="slug"
                    value={formData.slug} 
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                    disabled={isEdit}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Title tag (&lt;title&gt;)</label>
                <Input name="seoTitle" value={formData.seoTitle} onChange={handleChange} maxLength={160} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Meta description (meta=&quot;description&quot;)</label>
                <Textarea name="seoDescription" value={formData.seoDescription} onChange={handleChange} rows={3} maxLength={320} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">OG Title (meta=&quot;og:title&quot;)</label>
                <Input name="ogTitle" value={formData.ogTitle} onChange={handleChange} maxLength={160} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">OG Description (meta=&quot;og:description&quot;)</label>
                <Textarea name="ogDescription" value={formData.ogDescription} onChange={handleChange} rows={3} maxLength={320} />
              </div>
            </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Area' : 'Create Area'}
          </Button>
          <Button variant="outline" type="button" onClick={() => navigate('/areas')}>
            Close
          </Button>
        </div>
      </form>
    </div>
  )
}
