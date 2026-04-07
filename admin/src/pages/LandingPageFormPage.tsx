import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Upload, X, Lock, Unlock, Plus, Trash2, GripVertical } from 'lucide-react'
import api from '@/lib/api'
import TrixEditor from '@/components/TrixEditor'
import './LandingPageFormPage.css'

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
  is_active: number
  is_home: number
  display_order: number
}

type ContentBlock = {
  id?: number
  landing_page_id?: number
  title: string
  subtitle: string
  description: string
  image: string
  display_order: number
  _isNew?: boolean
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
  is_active: 1,
  is_home: 0,
  display_order: 0,
}

export default function LandingPageFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<LandingPageForm>(emptyForm)
  const [blocks, setBlocks] = useState<ContentBlock[]>(isEdit ? [] : [
    { title: '', subtitle: '', description: '', image: '', display_order: 1, _isNew: true }
  ])
  const [deletedBlockIds, setDeletedBlockIds] = useState<number[]>([])
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [isSlugEditable, setIsSlugEditable] = useState(true)
  const [uploadingBlock, setUploadingBlock] = useState<number | null>(null)
  const [blockImageErrors, setBlockImageErrors] = useState<Record<number, boolean>>({})
  const blockImageRefs = useRef<Record<number, HTMLInputElement | null>>({})
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null)

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
      seoTitle: page.seoTitle || page.seo_title || '',
      seoDescription: page.seoDescription || page.seo_description || '',
      seoKeywords: page.seoKeywords || page.seo_keywords || '',
      ogTitle: page.ogTitle || page.og_title || '',
      ogDescription: page.ogDescription || page.og_description || '',
      is_active: page.is_active ? 1 : 0,
      is_home: page.is_home ? 1 : 0,
      display_order: page.display_order || 0,
    })
    // Load dynamic blocks
    if (page.blocks && page.blocks.length > 0) {
      setBlocks(page.blocks.map((b: any) => ({
        id: b.id,
        landing_page_id: b.landing_page_id,
        title: b.title || '',
        subtitle: b.subtitle || '',
        description: b.description || '',
        image: b.image || '',
        display_order: b.display_order || 0,
      })))
    }
  }, [pageQuery.data])

  const mutation = useMutation({
    mutationFn: async (payload: LandingPageForm) => {
      const body = {
        ...payload,
        is_active: payload.is_active ? 1 : 0,
        is_home: payload.is_home ? 1 : 0,
        ogTitle: payload.seoTitle || payload.title,
        ogDescription: payload.seoDescription || payload.description,
        seo_title: payload.seoTitle,
        seo_description: payload.seoDescription,
        seo_keywords: payload.seoKeywords,
        og_title: payload.seoTitle || payload.title,
        og_description: payload.seoDescription || payload.description,
      }
      let pageId: number
      if (isEdit) {
        await api.put(`/landing-pages/${id}`, body)
        pageId = Number(id)
      } else {
        const res = await api.post('/landing-pages', body)
        pageId = res.data?.data?.id
      }

      // Save blocks
      // Delete removed blocks
      for (const blockId of deletedBlockIds) {
        await api.delete(`/landing-page-blocks/${blockId}`)
      }

      // Create or update blocks
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        const blockData = {
          landing_page_id: pageId,
          title: block.title,
          subtitle: block.subtitle,
          description: block.description,
          image: block.image,
          display_order: i + 1,
        }
        if (block.id && !block._isNew) {
          await api.put(`/landing-page-blocks/${block.id}`, blockData)
        } else {
          await api.post('/landing-page-blocks', blockData)
        }
      }
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
    if (errors.length) {
      alert(errors.join('\n'))
      return
    }
    mutation.mutate({
      ...formData,
      slug: formData.slug.trim() || slugify(formData.title),
      is_active: formData.is_active ? 1 : 0,
      is_home: formData.is_home ? 1 : 0,
    })
  }

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'landing-page'

  const uploadBlockImage = async (blockIndex: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB')
      return
    }
    setUploadingBlock(blockIndex)
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await api.post('/upload/landing-page-image', form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      })
      const url = res.data?.data?.url
      if (url) {
        setBlocks((prev) => prev.map((b, i) => i === blockIndex ? { ...b, image: url } : b))
      }
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    } finally {
      setUploadingBlock(null)
    }
  }

  const removeBlockImage = async (blockIndex: number) => {
    const current = blocks[blockIndex]?.image
    if (!current) return
    if (!confirm('Remove this image?')) return
    try {
      await api.delete(`/upload/file?url=${encodeURIComponent(current)}`)
    } catch (err) {
      console.error(err)
    }
    setBlocks((prev) => prev.map((b, i) => i === blockIndex ? { ...b, image: '' } : b))
  }

  const addBlock = () => {
    setBlocks((prev) => [
      ...prev,
      {
        title: '',
        subtitle: '',
        description: '',
        image: '',
        display_order: prev.length + 1,
        _isNew: true,
      },
    ])
  }

  const removeBlock = (index: number) => {
    const block = blocks[index]
    if (block.id && !block._isNew) {
      setDeletedBlockIds((prev) => [...prev, block.id!])
    }
    setBlocks((prev) => prev.filter((_, i) => i !== index))
  }

  const updateBlock = (index: number, field: keyof ContentBlock, value: string) => {
    setBlocks((prev) => prev.map((b, i) => i === index ? { ...b, [field]: value } : b))
  }

  const handleBlockDragStart = (index: number) => {
    setDraggedBlockIndex(index)
  }

  const handleBlockDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleBlockDrop = (targetIndex: number) => {
    if (draggedBlockIndex === null || draggedBlockIndex === targetIndex) return
    setBlocks((prev) => {
      const newBlocks = [...prev]
      const [removed] = newBlocks.splice(draggedBlockIndex, 1)
      newBlocks.splice(targetIndex, 0, removed)
      return newBlocks
    })
    setDraggedBlockIndex(null)
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

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Subtitle</label>
                <Input
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  placeholder="Optional subtitle"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={!!formData.is_active}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked ? 1 : 0 }))}
                  className="switch-green"
                />
                <span className="text-sm font-medium">Active (Published)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Blocks - Dynamic */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Content Blocks ({blocks.length})</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addBlock}>
                <Plus className="h-4 w-4 mr-1" />
                Add Block
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {blocks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No content blocks yet. Click "Add Block" to create one.
              </p>
            )}
            {blocks.map((block, index) => {
              const hasImageError = blockImageErrors[index]
              return (
                <Card
                  key={block.id || `new-${index}`}
                  className="border-2"
                  draggable
                  onDragStart={() => handleBlockDragStart(index)}
                  onDragOver={handleBlockDragOver}
                  onDrop={() => handleBlockDrop(index)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <span className="font-medium">Block {index + 1}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeBlock(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={block.title}
                        onChange={(e) => updateBlock(index, 'title', e.target.value)}
                        placeholder={`Block ${index + 1} title`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subtitle</label>
                      <Input
                        value={block.subtitle}
                        onChange={(e) => updateBlock(index, 'subtitle', e.target.value)}
                        placeholder={`Block ${index + 1} subtitle`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description (Rich Text)</label>
                      <TrixEditor
                        value={block.description}
                        onChange={(html) => updateBlock(index, 'description', html)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Image</label>
                      {block.image && !hasImageError ? (
                        <div className="relative inline-block">
                          <img
                            src={toAbsoluteUrl(block.image)}
                            alt={`Block ${index + 1}`}
                            className="object-cover rounded-lg border"
                            style={{ width: '100%', maxWidth: 400, height: 240 }}
                            onError={() => setBlockImageErrors((prev) => ({ ...prev, [index]: true }))}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => removeBlockImage(index)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition"
                          onClick={() => blockImageRefs.current[index]?.click()}
                        >
                          <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                          <p className="text-sm font-medium text-gray-700">Upload image for Block {index + 1}</p>
                          <input
                            ref={(el) => (blockImageRefs.current[index] = el)}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) uploadBlockImage(index, e.target.files[0])
                            }}
                            disabled={uploadingBlock === index}
                            className="hidden"
                          />
                          {uploadingBlock === index && <p className="text-sm text-primary mt-2">Uploading...</p>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {blocks.length > 0 && (
              <div className="flex justify-center pt-2">
                <Button type="button" variant="outline" size="sm" onClick={addBlock}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Block
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO Fields */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Optimization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium">URL (slug) *</label>
                {isEdit && (
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
                )}
              </div>
              <div className="space-y-2">
                <Input
                  value={formData.slug}
                  onChange={(e) => {
                    const newSlug = slugify(e.target.value)
                    setFormData((prev) => ({ ...prev, slug: newSlug }))
                    setIsSlugManuallyEdited(true)
                  }}
                  readOnly={isEdit && !isSlugEditable}
                  className={isEdit && !isSlugEditable ? 'bg-gray-50 cursor-not-allowed' : ''}
                  placeholder="landing-page-slug"
                  required
                />
              </div>
            </div>

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

            <input type="hidden" name="ogTitle" value={formData.seoTitle || formData.title} />
            <input type="hidden" name="ogDescription" value={formData.seoDescription || formData.description} />
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
