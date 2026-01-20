import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Calendar, GripVertical, X, Upload } from 'lucide-react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import DefaultEditor from 'react-simple-wysiwyg'

export default function BlogsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['blogs', searchTerm],
    queryFn: async () => {
      const q = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ''
      const response = await api.get(`/blogs?is_active=all${q}`)
      return response.data.data
    },
    refetchOnWindowFocus: false,
  })
  const API_BASE = import.meta.env.VITE_API_URL || '/api'
  const assetBase = useMemo(() => API_BASE.replace(/\/api$/, ''), [API_BASE])
  const toAbsoluteUrl = (url?: string) => {
    if (!url) return ''
    const base = assetBase || window.location.origin
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `${base}${url}`
    return `${base}/${url}`
  }

  const [list, setList] = useState<any[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<any | null>(null)
  const defaultForm = {
    title: '',
    description: '',
    content: '',
    slug: '',
    featured_image: '',
    content_image: '',
    is_active: true,
    published_date: new Date().toISOString().split('T')[0],
  }
  const [formData, setFormData] = useState({ ...defaultForm })
  const [imagePreview, setImagePreview] = useState('')
  const [contentImagePreview, setContentImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadingContent, setUploadingContent] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    if (data?.blogs) {
      setList(data.blogs)
    }
  }, [data])

  const openModal = (blog: any | null) => {
    if (blog) {
      setEditingBlog(blog)
      const formDate = blog.published_date || new Date().toISOString().split('T')[0];
      console.log('Opening blog for edit:', { blogId: blog.id, published_date: formDate });
      setFormData({
        title: blog.title || '',
        description: blog.description || '',
        content: blog.content || '',
        slug: blog.slug || '',
        featured_image: blog.featured_image || '',
        content_image: blog.content_image || '',
        is_active: !!blog.is_active,
        published_date: formDate,
      })
      setImagePreview(toAbsoluteUrl(blog.featured_image))
      setContentImagePreview(toAbsoluteUrl(blog.content_image))
    } else {
      setEditingBlog(null)
      const newDate = new Date().toISOString().split('T')[0];
      console.log('Opening new blog modal with date:', newDate);
      setFormData({ 
        ...defaultForm,
        published_date: newDate
      })
      setImagePreview('')
      setContentImagePreview('')
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingBlog(null)
    setFormData({ ...defaultForm })
    setImagePreview('')
    setUploading(false)
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingBlog) {
        return api.put(`/blogs/${editingBlog.id}`, payload)
      }
      return api.post('/blogs', payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['blogs'] })
      const refreshed = await refetch()
      if (refreshed?.data?.blogs) {
        setList(refreshed.data.blogs)
      }
      closeModal()
    },
  })

  const handleDelete = async (id: number) => {
    setDeleteId(id)
  }

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      return
    }

    const updated = [...list]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(targetIndex, 0, moved)

    // Update local order
    const ordered = updated.map((b, i) => ({ ...b, display_order: i + 1 }))
    setList(ordered)
    setDragIndex(null)

    try {
      await api.post('/blogs/reorder', {
        order: ordered.map((b, i) => ({ id: b.id, display_order: i + 1 })),
      })
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      refetch()
    } catch (error) {
      console.error('Failed to reorder blogs:', error)
      refetch()
    }
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const payload = new FormData()
    payload.append('image', file)
    setUploading(true)

    try {
      const response = await api.post('/upload/blog-image', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploaded =
        response.data?.data?.url ||
        response.data?.urls?.original ||
        response.data?.data?.filename ||
        ''
      if (uploaded) {
        setFormData((p) => ({ ...p, featured_image: uploaded }))
        setImagePreview(toAbsoluteUrl(uploaded))
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (formData.featured_image) {
      try {
        await api.delete(`/upload/file?url=${encodeURIComponent(formData.featured_image)}`)
      } catch (error) {
        console.error('Failed to remove image:', error)
      }
    }
    setFormData((p) => ({ ...p, featured_image: '' }))
    setImagePreview('')
  }

  const handleContentImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const payload = new FormData()
    payload.append('image', file)
    setUploadingContent(true)

    try {
      const response = await api.post('/upload/blog-image', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploaded =
        response.data?.data?.url ||
        response.data?.urls?.original ||
        response.data?.data?.filename ||
        ''
      if (uploaded) {
        setFormData((p) => ({ ...p, content_image: uploaded }))
        setContentImagePreview(toAbsoluteUrl(uploaded))
      }
    } catch (error) {
      console.error('Failed to upload content image:', error)
    } finally {
      setUploadingContent(false)
    }
  }

  const handleRemoveContentImage = async () => {
    if (formData.content_image) {
      try {
        await api.delete(`/upload/file?url=${encodeURIComponent(formData.content_image)}`)
      } catch (error) {
        console.error('Failed to remove content image:', error)
      }
    }
    setFormData((p) => ({ ...p, content_image: '' }))
    setContentImagePreview('')
  }

  const toggleActive = async (blog: any, value: boolean) => {
    try {
      setList((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, is_active: value } : b))
      )
      await api.put(`/blogs/${blog.id}`, { is_active: value ? 1 : 0 })
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
    } catch (error) {
      console.error('Failed to update status', error)
      refetch()
    }
  }

  const handleSave = () => {
    if (uploading || uploadingContent) {
      alert('Please wait for image uploads to complete before saving.')
      return
    }
    const effectiveImage =
      formData.featured_image ||
      (imagePreview
        ? imagePreview.startsWith(assetBase)
          ? imagePreview.replace(assetBase, '')
          : imagePreview
        : '')

    if (!effectiveImage) {
      alert('Featured image is required. Please upload an image.')
      return
    }
    if (!formData.title || !formData.title.trim()) {
      alert('Title is required')
      return
    }
    if (formData.title.trim().length < 3) {
      alert('Title must be at least 3 characters long')
      return
    }
    if (formData.title.length > 255) {
      alert('Title must be less than 255 characters')
      return
    }
    if (formData.description && formData.description.length > 500) {
      alert('Short description must be less than 500 characters')
      return
    }
    if (!formData.published_date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.published_date)) {
      alert('Please select a valid published date')
      return
    }

    const payload: any = {
      ...formData,
      featured_image: effectiveImage,
      published_date: formData.published_date,
      slug: formData.slug?.trim() || undefined,
    }

    // Debug: verifica il payload prima dell'invio
    console.log('Saving blog with payload:', payload)

    if (!editingBlog) {
      payload.display_order = (list?.length || 0) + 1
    }

    saveMutation.mutate(payload)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/blogs/${deleteId}`)
      setDeleteId(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete blog:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Blogs</h1>
          <Button asChild>
            <Link to="/blogs/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Blog
            </Link>
          </Button>
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
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Blogs</h1>
            <p className="text-muted-foreground">
              {data?.pagination?.total || 0} total blogs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56"
            />
            <Button onClick={() => openModal(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Blog
            </Button>
          </div>
        </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No blogs found</p>
            <Button onClick={() => openModal(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first blog
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map((blog: any, idx: number) => (
            <Card
              key={blog.id}
              className="overflow-hidden border border-dashed"
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => setDragIndex(null)}
            >
              <div className="flex gap-4 items-start">
                <div className="p-2 text-muted-foreground cursor-grab">
                  <GripVertical className="h-5 w-5" />
                  <div className="text-xs text-muted-foreground text-center mt-1">#{idx + 1}</div>
                </div>

                {blog.featured_image ? (
                  <img
                    src={toAbsoluteUrl(blog.featured_image)}
                    alt={blog.title}
                    className="w-48 h-48 object-cover my-4 ml-2 mr-4 rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center flex-shrink-0 my-4 ml-2 mr-4 rounded-lg">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                
                <div className="flex-1 py-4 pr-4">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1">{blog.title}</CardTitle>
                        {blog.subtitle && (
                          <p className="text-sm text-muted-foreground mt-1">{blog.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs text-muted-foreground">Active</span>
                        <Switch
                          checked={!!blog.is_active}
                          onCheckedChange={(v) => toggleActive(blog, v)}
                          className="data-[state=checked]:bg-green-500"
                          aria-label="Toggle blog visibility"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {blog.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {blog.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {blog.published_date 
                            ? format(new Date(blog.published_date), 'MMM dd, yyyy')
                            : 'No date'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openModal(blog)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(blog.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-[3px]">Blog</p>
                <h2 className="text-2xl font-semibold">
                  {editingBlog ? 'Edit Blog' : 'New Blog'}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    required
                    minLength={3}
                    maxLength={255}
                    placeholder="Enter blog title (min 3 characters)"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Published Date *</label>
                  <Input
                    type="date"
                    value={formData.published_date}
                    onChange={(e) => setFormData((p) => ({ ...p, published_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Short Description</label>
                  <Textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    maxLength={500}
                    placeholder="Brief description for listing page (max 500 characters)"
                  />
                  <p className="text-xs text-muted-foreground">{formData.description?.length || 0}/500 characters</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Full Content</label>
                  <DefaultEditor
                    value={formData.content}
                    onChange={(e: any) => setFormData((p) => ({ ...p, content: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the toolbar to format text: bold, italic, lists, etc.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <label className="text-sm font-medium">Image *</label>
                  <p className="text-xs text-muted-foreground mb-2">Recommended: 340 x 250px</p>
                  {imagePreview ? (
                    <div className="space-y-2">
                      <div 
                        className="relative inline-block cursor-pointer group"
                        onClick={() => {
                          const popup = document.createElement('div');
                          popup.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4';
                          popup.onclick = () => popup.remove();
                          popup.innerHTML = `
                            <div class="relative">
                              <img src="${imagePreview}" class="max-w-full max-h-[90vh] rounded-lg" />
                              <button 
                                onclick="this.parentElement.parentElement.remove()" 
                                class="absolute top-2 right-2 bg-white/90 hover:bg-white text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-xl"
                                style="line-height: 1;"
                              >
                                ×
                              </button>
                            </div>
                          `;
                          document.body.appendChild(popup);
                        }}
                      >
                        <img src={imagePreview} alt="Preview" style={{ width: '170px', height: '125px' }} className="object-cover rounded border group-hover:opacity-80 transition" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">Click to enlarge</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <label className="cursor-pointer block">
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload</span>
                        </div>
                        <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                      </label>
                      {uploading && <p className="text-sm text-primary mt-2 text-center">Uploading...</p>}
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-1">
                  <label className="text-sm font-medium">Content Image (Optional)</label>
                  <p className="text-xs text-muted-foreground mb-2">680 x 500px</p>
                  {contentImagePreview ? (
                    <div className="space-y-2">
                      <div 
                        className="relative inline-block cursor-pointer group"
                        onClick={() => {
                          const popup = document.createElement('div');
                          popup.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4';
                          popup.onclick = () => popup.remove();
                          popup.innerHTML = `
                            <div class="relative">
                              <img src="${contentImagePreview}" class="max-w-full max-h-[90vh] rounded-lg" />
                              <button 
                                onclick="this.parentElement.parentElement.remove()" 
                                class="absolute top-2 right-2 bg-white/90 hover:bg-white text-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-xl"
                                style="line-height: 1;"
                              >
                                ×
                              </button>
                            </div>
                          `;
                          document.body.appendChild(popup);
                        }}
                      >
                        <img src={contentImagePreview} alt="Content Preview" style={{ width: '340px', height: '250px' }} className="object-cover rounded border group-hover:opacity-80 transition" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">Click to enlarge</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveContentImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <label className="cursor-pointer block">
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">Click to upload (optional)</span>
                        </div>
                        <Input type="file" accept="image/*" onChange={handleContentImageUpload} disabled={uploadingContent} className="hidden" />
                      </label>
                      {uploadingContent && <p className="text-sm text-primary mt-2 text-center">Uploading...</p>}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[2px] text-muted-foreground">SEO</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL</label>
                    <Input
                      placeholder="es. 010-luxury-condo"
                      value={formData.slug}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s+/g, '-');
                        setFormData((p) => ({ ...p, slug: value }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL: /blog/{formData.slug || 'your-slug'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-semibold">Delete blog?</h3>
            <p className="text-muted-foreground">
              Are you sure you want to delete this blog? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
