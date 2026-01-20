import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, X } from 'lucide-react'
import TipTapEditor from '@/components/TipTapEditor'

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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    featured_image: '',
    is_active: true,
    published_date: new Date().toISOString().split('T')[0],
  })

  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')

  useQuery({
    queryKey: ['blog', id],
    queryFn: async () => {
      const response = await api.get(`/blogs/${id}`)
      const blog = response.data.data
      setFormData({
        title: blog.title || '',
        description: blog.description || '',
        content: blog.content || '',
        featured_image: blog.featured_image || '',
        is_active: blog.is_active,
        published_date: blog.published_date || new Date().toISOString().split('T')[0],
      })
      if (blog.featured_image) {
        setImagePreview(toAbsoluteUrl(blog.featured_image))
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
    mutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await api.post('/upload/blog-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const imageUrl = response.data.data.url
      setFormData((prev) => ({ ...prev, featured_image: imageUrl }))
      setImagePreview(toAbsoluteUrl(imageUrl))
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!formData.featured_image) return

    if (!confirm('Are you sure you want to remove this image?')) return

    try {
      await api.delete(`/upload/file?url=${encodeURIComponent(formData.featured_image)}`)
      setFormData((prev) => ({ ...prev, featured_image: '' }))
      setImagePreview('')
    } catch (error) {
      console.error('Failed to delete image:', error)
      alert('Failed to delete image')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/blogs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Blog' : 'Add New Blog'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Blog Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title *
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="published_date" className="text-sm font-medium">
                  Published Date
                </label>
                <Input
                  id="published_date"
                  name="published_date"
                  type="date"
                  value={formData.published_date}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">
                  Featured Image (340 x 250px)
                </label>
                
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
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-4">
                      Click to upload or drag and drop
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    {uploading && (
                      <p className="text-sm text-primary mt-2">Uploading...</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Active (Visible on Website)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Short Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief summary for listing pages"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Full Content
              </label>
              <TipTapEditor
                value={formData.content}
                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                placeholder="Write your blog content here..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : isEdit ? 'Update Blog' : 'Create Blog'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/blogs')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
