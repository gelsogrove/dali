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

export default function VideoFormPage() {
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
    video_url: '',
    thumbnail_url: '',
    thumbnail_alt: '',
    is_home: false,
  })

  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null)

  useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      const response = await api.get(`/videos/${id}`)
      const video = response.data.data
      setFormData({
        title: video.title || '',
        description: video.description || '',
        video_url: video.video_url || '',
        thumbnail_url: video.thumbnail_url || '',
        thumbnail_alt: video.thumbnail_alt || '',
        is_home: video.is_home,
      })
      if (video.thumbnail_url) {
        setImagePreview(toAbsoluteUrl(video.thumbnail_url))
      }
      return video
    },
    enabled: isEdit,
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        return api.put(`/videos/${id}`, data)
      } else {
        return api.post('/videos', data)
      }
    },
    onSuccess: () => {
      navigate('/videos')
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'An error occurred')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.video_url.includes('vimeo.com')) {
      alert('Video URL must be a Vimeo link')
      return
    }
    if (!formData.thumbnail_url) {
      alert('Thumbnail image is required')
      return
    }
    if (!formData.thumbnail_alt.trim()) {
      alert('Thumbnail alt text is required')
      return
    }
    const payload = {
      ...formData,
      is_home: formData.is_home ? 1 : 0,
    }
    mutation.mutate(payload)
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

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB')
      return
    }

    setUploading(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('image', file)

      const response = await api.post('/upload/video-thumbnail', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const imageUrl = response.data.data.url
      setFormData((prev) => ({ ...prev, thumbnail_url: imageUrl }))
      setImagePreview(toAbsoluteUrl(imageUrl))
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!formData.thumbnail_url) return
    if (!confirm('Remove this thumbnail?')) return

    try {
      await api.delete(`/upload/file?url=${encodeURIComponent(formData.thumbnail_url)}`)
      setFormData((prev) => ({ ...prev, thumbnail_url: '', thumbnail_alt: '' }))
      setImagePreview('')
    } catch (error) {
      console.error('Failed to delete image:', error)
      alert('Image delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/videos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Video' : 'New Video'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Video Information</CardTitle>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_home}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_home: checked }))
                }
                className="data-[state=checked]:bg-green-500"
              />
              <span className="text-sm font-medium">Show on Home</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
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
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="video_url" className="text-sm font-medium">
                  Vimeo Video URL *
                </label>
                <Input
                  id="video_url"
                  name="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={handleChange}
                  placeholder="https://player.vimeo.com/video/..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be a Vimeo player URL
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Thumbnail Image *</label>
                {imagePreview ? (
                  <div className="relative w-full">
                    <img
                      src={imagePreview}
                      alt="Thumbnail preview"
                      className="w-full max-w-md rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? 'Uploading...' : 'Upload Thumbnail'}
                    </Button>
                  </div>
                )}
              </div>

              {formData.thumbnail_url && (
                <div className="space-y-2">
                  <label htmlFor="thumbnail_alt" className="text-sm font-medium">
                    Thumbnail Alt Text *
                  </label>
                  <Input
                    id="thumbnail_alt"
                    name="thumbnail_alt"
                    value={formData.thumbnail_alt}
                    onChange={handleChange}
                    placeholder="Describe the thumbnail image"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : isEdit ? 'Update Video' : 'Create Video'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/videos')}
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
