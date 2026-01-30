import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Upload, X } from 'lucide-react'
import TrixEditor from '@/components/TrixEditor'

export default function BlogFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const API_BASE = import.meta.env.VITE_API_URL || '/api'
  const assetBase = API_BASE.replace(/\/api$/, '')
  const toAbsoluteUrl = (url: string) => {
    if (!url) return ''
    return url.startsWith('http') ? url : `${assetBase}${url}`
  }

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    seoTitle: '',
    seoDescription: '',
    ogTitle: '',
    ogDescription: '',
    description: '',
    content: '',
    featured_image: '',
    featured_image_alt: '',
    content_image: '',
    content_image_alt: '',
    is_home: false,
    published_date: new Date().toISOString().split('T')[0],
  })

  const [uploading, setUploading] = useState(false)
  const [uploadingContent, setUploadingContent] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [contentImagePreview, setContentImagePreview] = useState('')
  const featuredInputRef = useRef<HTMLInputElement | null>(null)
  const contentInputRef = useRef<HTMLInputElement | null>(null)

  useQuery({
    queryKey: ['blog', id],
    queryFn: async () => {
      const response = await api.get(`/blogs/${id}`)
      const blog = response.data.data
      setFormData({
        title: blog.title || '',
        slug: blog.slug || '',
        seoTitle: blog.seoTitle || '',
        seoDescription: blog.seoDescription || '',
        ogTitle: blog.ogTitle || '',
        ogDescription: blog.ogDescription || '',
        description: blog.description || '',
        content: blog.content || '',
        featured_image: blog.featured_image || '',
        featured_image_alt: blog.featured_image_alt || '',
        content_image: blog.content_image || '',
        content_image_alt: blog.content_image_alt || '',
        is_home: blog.is_home,
        published_date: blog.published_date || new Date().toISOString().split('T')[0],
      })
      if (blog.featured_image) {
        setImagePreview(toAbsoluteUrl(blog.featured_image))
      }
      if (blog.content_image) {
        setContentImagePreview(toAbsoluteUrl(blog.content_image))
      }
      return blog
    },
    enabled: isEdit,
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        return api.put(`/blogs/${id}`, data)
      } else {
        return api.post('/blogs', data)
      }
    },
    onSuccess: () => {
      navigate('/blogs')
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'An error occurred')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const slug = formData.slug?.trim() || slugify(formData.title)
    if (!formData.seoTitle.trim() || !formData.seoDescription.trim() || !formData.ogTitle.trim() || !formData.ogDescription.trim()) {
      alert('SEO fields (title, meta description, OG title, OG description) are required')
      return
    }
    if (formData.featured_image && !formData.featured_image_alt.trim()) {
      alert('Alt text is required when you upload an image')
      return
    }
    if (formData.content_image && !formData.content_image_alt.trim()) {
      alert('Alt text is required when you upload the content image')
      return
    }
    const payload = {
      ...formData,
      slug,
      is_home: formData.is_home ? 1 : 0,
    }
    mutation.mutate(payload)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      ...(name === 'title' && !isEdit
        ? { slug: prev.slug ? prev.slug : slugify(value) }
        : {}),
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'featured' | 'content') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.warn('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.warn('Image must be smaller than 10MB')
      return
    }

    const setUploadingFn = target === 'featured' ? setUploading : setUploadingContent
    const setPreviewFn = target === 'featured' ? setImagePreview : setContentImagePreview
    const fieldName = target === 'featured' ? 'featured_image' : 'content_image'

    setUploadingFn(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('image', file)

      const response = await api.post('/upload/blog-image', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const imageUrl = response.data.data.url
      setFormData((prev) => ({ ...prev, [fieldName]: imageUrl }))
      setPreviewFn(toAbsoluteUrl(imageUrl))
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploadingFn(false)
    }
  }

  const handleRemoveImage = async (target: 'featured' | 'content') => {
    const currentUrl = target === 'featured' ? formData.featured_image : formData.content_image
    if (!currentUrl) return

    if (!confirm('Remove this image?')) return

    try {
      await api.delete(`/upload/file?url=${encodeURIComponent(currentUrl)}`)
    } catch (error) {
      console.error('Failed to delete image:', error)
      // Continue anyway - file may not exist anymore
    }
    
    // Remove image reference from form even if delete failed
    setFormData((prev) => ({
      ...prev,
      ...(target === 'featured'
        ? { featured_image: '', featured_image_alt: '' }
        : { content_image: '', content_image_alt: '' }),
    }))
    if (target === 'featured') {
      setImagePreview('')
    } else {
      setContentImagePreview('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/blogs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Blog' : 'New Blog'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Blog Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Page title (H1) *
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Short description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Short summary for listings"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="published_date" className="text-sm font-medium">
                  Published date
                </label>
                <Input
                  id="published_date"
                  name="published_date"
                  type="date"
                  value={formData.published_date}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_home}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_home: checked }))}
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
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Cover image</p>
                     
                  </div>
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: '340px', height: '250px' }}
                        className="object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveImage('featured')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rimuovi
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition"
                      role="button"
                      tabIndex={0}
                      onClick={() => featuredInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          featuredInputRef.current?.click()
                        }
                      }}
                    >
                      <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm font-medium text-gray-700">Upload image</p>
                      <p className="text-xs text-muted-foreground mb-3">340 x 250px</p>
                      <input
                        ref={featuredInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleImageUpload(event, 'featured')}
                        disabled={uploading}
                        className="hidden"
                      />
                      {uploading && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                          <p className="text-sm text-primary">Uploading...</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-1 pt-1 max-w-xl">
                    <label className="text-sm font-medium">Alt text *</label>
                    <Input
                      name="featured_image_alt"
                      value={formData.featured_image_alt}
                      onChange={handleChange}
                      
                      required={!!formData.featured_image}
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-gray-200 bg-white/70 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Content image (optional)</p>
                    
                  </div>
                  {contentImagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={contentImagePreview}
                        alt="Content preview"
                        style={{ width: '340px', height: '250px' }}
                        className="object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemoveImage('content')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rimuovi
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition"
                      role="button"
                      tabIndex={0}
                      onClick={() => contentInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          contentInputRef.current?.click()
                        }
                      }}
                    >
                      <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm font-medium text-gray-700">Upload content image</p>
                      <p className="text-xs text-muted-foreground mb-3">16:9 recommended, max 10MB</p>
                      <input
                        ref={contentInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleImageUpload(event, 'content')}
                        disabled={uploadingContent}
                        className="hidden"
                      />
                      {uploadingContent && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                          <p className="text-sm text-primary">Uploading...</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-1 pt-1 max-w-xl">
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
              <label htmlFor="content" className="text-sm font-medium">
                Full content
              </label>
              <TrixEditor
                value={formData.content}
                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                placeholder="Write your blog content..."
              />
            </div>

            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-semibold">SEO optimization</p>
                
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="slug" className="text-sm font-medium">
                    LNK (url)
                  </label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={(e) => {
                      if (isEdit) return
                      setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                    }}
                    disabled={isEdit}
                     
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Title tag (&lt;title&gt;)</label>
                  <Input
                    name="seoTitle"
                    value={formData.seoTitle}
                    onChange={handleChange}
                    maxLength={160}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Meta description (meta=&quot;description&quot;)</label>
                  <Textarea
                    name="seoDescription"
                    value={formData.seoDescription}
                    onChange={handleChange}
                    rows={3}
                    maxLength={320}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">OG Title  (meta=&quot;og:title&quot;)</label>
                  <Input
                    name="ogTitle"
                    value={formData.ogTitle}
                    onChange={handleChange}
                    maxLength={160}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">OG Description  (meta=&quot;og:description&quot;)</label>
                  <Textarea
                    name="ogDescription"
                    value={formData.ogDescription}
                    onChange={handleChange}
                    rows={3}
                    maxLength={320}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : isEdit ? 'Update Blog' : 'Create Blog'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/blogs')}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
