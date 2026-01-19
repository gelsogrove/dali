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

export default function BlogsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const response = await api.get('/blogs?is_active=all')
      return response.data.data
    },
  })
  const API_BASE = import.meta.env.VITE_API_URL || '/api'
  const assetBase = useMemo(() => API_BASE.replace(/\/api$/, ''), [API_BASE])
  const toAbsoluteUrl = (url?: string) => {
    if (!url) return ''
    return url.startsWith('http') ? url : `${assetBase}${url}`
  }

  const [list, setList] = useState<any[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<any | null>(null)
  const defaultForm = {
    title: '',
    subtitle: '',
    description: '',
    content: '',
    featured_image: '',
    is_active: true,
    published_date: new Date().toISOString().split('T')[0],
  }
  const [formData, setFormData] = useState({ ...defaultForm })
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (data?.blogs) {
      setList(data.blogs)
    }
  }, [data])

  const openModal = (blog: any | null) => {
    if (blog) {
      setEditingBlog(blog)
      setFormData({
        title: blog.title || '',
        subtitle: blog.subtitle || '',
        description: blog.description || '',
        content: blog.content || '',
        featured_image: blog.featured_image || '',
        is_active: !!blog.is_active,
        published_date: blog.published_date
          ? new Date(blog.published_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      })
      setImagePreview(toAbsoluteUrl(blog.featured_image))
    } else {
      setEditingBlog(null)
      setFormData({ ...defaultForm })
      setImagePreview('')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      refetch()
      closeModal()
    },
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog?')) return
    
    try {
      await api.delete(`/blogs/${id}`)
      refetch()
    } catch (error) {
      console.error('Failed to delete blog:', error)
    }
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
      await Promise.all(
        ordered.map((b, i) => api.put(`/blogs/${b.id}`, { display_order: i + 1 }))
      )
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
    payload.append('file', file)
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

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('Title is required')
      return
    }

    const payload: any = {
      ...formData,
      published_date: formData.published_date || new Date().toISOString().split('T')[0],
    }

    if (!editingBlog) {
      payload.display_order = (list?.length || 0) + 1
    }

    saveMutation.mutate(payload)
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Blogs</h1>
            <p className="text-muted-foreground">
              {data?.pagination?.total || 0} total blogs
            </p>
          </div>
          <Button onClick={() => openModal(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Blog
          </Button>
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
                    className="w-48 h-48 object-cover"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center flex-shrink-0">
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
                        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                          blog.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {blog.is_active ? 'Active' : 'Inactive'}
                        </span>
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
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Subtitle</label>
                  <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Published Date</label>
                  <Input
                    type="date"
                    value={formData.published_date}
                    onChange={(e) => setFormData((p) => ({ ...p, published_date: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData((p) => ({ ...p, is_active: v }))}
                  />
                  <span className="text-sm font-medium">Active (visible on site)</span>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Short Description</label>
                  <Textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Full Content</label>
                  <Textarea
                    rows={10}
                    value={formData.content}
                    onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Featured Image</label>
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg border" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 mb-3">Click to upload</p>
                      <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                      {uploading && <p className="text-sm text-primary mt-2">Uploading...</p>}
                    </div>
                  )}
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
    </div>
  )
}
