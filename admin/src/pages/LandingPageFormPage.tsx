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

type LandingPageForm = {
  title: string
  subtitle: string
  slug: string
  description: string
  content: string
  cover_image: string
  cover_image_alt: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  is_active: number
  featured: number
  display_order: number
}

const emptyForm: LandingPageForm = {
  title: '',
  subtitle: '',
  slug: '',
  description: '',
  content: '',
  cover_image: '',
  cover_image_alt: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  is_active: 1,
  featured: 0,
  display_order: 0,
}

export default function LandingPageFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<LandingPageForm>(emptyForm)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverError, setCoverError] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const apiBase = import.meta.env.VITE_API_URL || '/api'
  const assetBase = useMemo(() => apiBase.replace(/\/api$/, ''), [apiBase])
  const toAbsoluteUrl = (url?: string) => (url ? (url.startsWith('http') ? url : `${assetBase}${url}`) : '')

  const pageQuery = useQuery({
    queryKey: ['landing-page', id],
    enabled: isEdit,
    queryFn: async () => {
      const res = await api.get(`/landing-pages/${id}`)
      return res.data?.data
    },
  })

  useEffect(() => {
    const page = pageQuery.data
    if (!page) return
    setFormData({
      title: page.title || '',
      subtitle: page.subtitle || '',
      slug: page.slug || '',
      description: page.description || '',
      content: page.content || '',
      cover_image: page.cover_image || '',
      cover_image_alt: page.cover_image_alt || '',
      seoTitle: page.seoTitle || '',
      seoDescription: page.seoDescription || '',
      seoKeywords: page.seoKeywords || '',
      ogTitle: page.ogTitle || '',
      ogDescription: page.ogDescription || '',
      ogImage: page.ogImage || '',
      is_active: page.is_active ? 1 : 0,
      featured: page.featured ? 1 : 0,
      display_order: page.display_order || 0,
    })
  }, [pageQuery.data])

  const mutation = useMutation({
    mutationFn: async (payload: LandingPageForm) => {
      const body = {
        ...payload,
        is_active: payload.is_active ? 1 : 0,
        featured: payload.featured ? 1 : 0,
      }
      if (isEdit) return api.put(`/landing-pages/${id}`, body)
      return api.post('/landing-pages', body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] })
      navigate('/landing-pages')
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: string[] = []
    if (!formData.title.trim()) errors.push('Title is required')
    if (!formData.slug.trim()) errors.push('URL is required')
    if (!formData.seoTitle.trim()) errors.push('SEO Title is required')
    if (!formData.seoDescription.trim()) errors.push('SEO Description is required')
    if (!formData.seoKeywords.trim()) errors.push('SEO Keywords is required')
    if (formData.cover_image && !formData.cover_image_alt.trim()) errors.push('Alt text is required for cover image')
    if (errors.length) {
      alert(errors.join('\n'))
      return
    }
    mutation.mutate({
      ...formData,
      slug: formData.slug.trim() || slugify(formData.title),
      is_active: formData.is_active ? 1 : 0,
      featured: formData.featured ? 1 : 0,
    })
  }

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'landing-page'

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      console.warn('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      console.warn('Image must be smaller than 10MB')
      return
    }
    setUploadingCover(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await api.post('/upload/landing-page-image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data?.data?.url
      if (url) {
        setFormData((prev) => ({ ...prev, cover_image: url }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingCover(false)
    }
  }

  const removeImage = async () => {
    const current = formData.cover_image
    if (!current) return
    if (!confirm('Remove this image?')) return
    try {
      await api.delete(`/upload/file?url=${encodeURIComponent(current)}`)
    } catch (err) {
      console.error(err)
    }
    setFormData((prev) => ({
      ...prev,
      cover_image: '',
      cover_image_alt: '',
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/landing-pages')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{isEdit ? 'Edit Landing Page' : 'New Landing Page'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Title (H1) *</label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                    if (!isEdit && !isSlugManuallyEdited) {
                      setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                    }
                  }}
                  required
                />
              </div>

              {/* URL Field - Visible and Editable */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">URL (slug) {isEdit ? '(Read-only)' : '*'}</label>
                <div className="space-y-2">
                  <Input
                    value={formData.slug}
                    onChange={(e) => {
                      const newSlug = slugify(e.target.value)
                      setFormData((prev) => ({ ...prev, slug: newSlug }))
                      setIsSlugManuallyEdited(true)
                    }}
                    disabled={isEdit}
                    placeholder="landing-page-slug"
                    required={!isEdit}
                  />
                    <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded border">
                    <span className="font-medium">Public URL:</span><br />
                    <code>/{formData.slug}</code>
                    </div>
                  </div>
                </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Subtitle</label>
                <Input
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  placeholder="Optional subtitle"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Short Description</label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief description for previews"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={!!formData.is_active}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked ? 1 : 0 }))}
                />
                <span className="text-sm font-medium">Active (Published)</span>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={!!formData.featured}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, featured: checked ? 1 : 0 }))}
                />
                <span className="text-sm font-medium">Featured (Homepage)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cover Image */}
        <Card>
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {formData.cover_image && !coverError ? (
              <div className="relative inline-block">
                <img
                  src={toAbsoluteUrl(formData.cover_image)}
                  alt="Cover"
                  className="object-cover rounded-lg border"
                  style={{ width: '100%', maxWidth: 400, height: 240 }}
                  onError={() => setCoverError(true)}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition"
                onClick={() => coverInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700">Upload cover image</p>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) uploadImage(e.target.files[0])
                  }}
                  disabled={uploadingCover}
                  className="hidden"
                />
                {uploadingCover && <p className="text-sm text-primary mt-2">Uploading...</p>}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Alt Text</label>
              <Input
                name="cover_image_alt"
                value={formData.cover_image_alt}
                onChange={handleChange}
                required={!!formData.cover_image}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rich Text Content</label>
              <TrixEditor
                value={formData.content}
                onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Fields */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Optimization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title Tag *</label>
              <Input
                name="seoTitle"
                value={formData.seoTitle}
                onChange={handleChange}
                placeholder="SEO title (60 chars max)"
                maxLength={160}
                required
              />
              <div className="text-xs text-muted-foreground">{formData.seoTitle.length} / 160</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meta Description *</label>
              <Textarea
                name="seoDescription"
                value={formData.seoDescription}
                onChange={handleChange}
                placeholder="Meta description (160 chars max)"
                rows={3}
                maxLength={160}
                required
              />
              <div className="text-xs text-muted-foreground">{formData.seoDescription.length} / 160</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Keywords *</label>
              <Input
                name="seoKeywords"
                value={formData.seoKeywords}
                onChange={handleChange}
                placeholder="Keywords (comma-separated)"
                required
              />
            </div>

            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium">OG Title (Social Media)</label>
              <Input
                name="ogTitle"
                value={formData.ogTitle}
                onChange={handleChange}
                placeholder="Title for social sharing"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">OG Description (Social Media)</label>
              <Textarea
                name="ogDescription"
                value={formData.ogDescription}
                onChange={handleChange}
                placeholder="Description for social sharing"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">OG Image URL (Social Media)</label>
              <Input
                name="ogImage"
                value={formData.ogImage}
                onChange={handleChange}
                placeholder="Image URL for social sharing"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={mutation.isPending} className="px-6">
            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Landing Page' : 'Create Landing Page'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/landing-pages')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
