import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, GripVertical, Upload, X, Link2, Play } from 'lucide-react'

type VideoForm = {
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  thumbnail_alt: string
  is_home: boolean
}

export default function VideosPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [list, setList] = useState<any[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<any | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [readyAfterDelay, setReadyAfterDelay] = useState(false)

  const defaultForm: VideoForm = {
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    thumbnail_alt: '',
    is_home: false,
  }
  const [formData, setFormData] = useState<VideoForm>({ ...defaultForm })

  const API_BASE = import.meta.env.VITE_API_URL || '/api'
  const assetBase = useMemo(() => API_BASE.replace(/\/api$/, ''), [API_BASE])
  const toAbsoluteUrl = (url?: string) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `${assetBase}${url}`
    return `${assetBase}/${url}`
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['videos', searchTerm],
    queryFn: async () => {
      const q = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ''
      const response = await api.get(`/videos?include_deleted=false${q}`)
      return response.data.data
    },
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (data?.videos) {
      const ordered = [...data.videos].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      setList(ordered)
    }
  }, [data])

  useEffect(() => {
    if (isLoading) {
      setReadyAfterDelay(false)
      return
    }
    const timer = setTimeout(() => setReadyAfterDelay(true), 1000)
    return () => clearTimeout(timer)
  }, [isLoading, searchTerm])

  const openModal = (video: any | null) => {
    if (video) {
      setEditingVideo(video)
      setFormData({
        title: video.title || '',
        description: video.description || '',
        video_url: video.video_url || '',
        thumbnail_url: video.thumbnail_url || '',
        thumbnail_alt: video.thumbnail_alt || '',
        is_home: !!video.is_home,
      })
      setImagePreview(toAbsoluteUrl(video.thumbnail_url))
    } else {
      setEditingVideo(null)
      setFormData({ ...defaultForm })
      setImagePreview('')
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingVideo(null)
    setFormData({ ...defaultForm })
    setImagePreview('')
    setUploading(false)
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingVideo) {
        return api.put(`/videos/${editingVideo.id}`, payload)
      }
      return api.post('/videos', payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['videos'] })
      const refreshed = await refetch()
      if (refreshed?.data?.videos) {
        setList(refreshed.data.videos)
      }
      closeModal()
    },
  })

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      return
    }

    const updated = [...list]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(targetIndex, 0, moved)

    const ordered = updated.map((v, i) => ({ ...v, display_order: i + 1 }))
    setList(ordered)
    setDragIndex(null)

    try {
      await api.post('/videos/reorder', {
        order: ordered.map((v, i) => ({ id: v.id, display_order: i + 1 })),
      })
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      refetch()
    } catch (error) {
      console.error('Failed to reorder videos:', error)
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
      const response = await api.post('/upload/video-image', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploaded =
        response.data?.data?.url ||
        response.data?.urls?.original ||
        response.data?.data?.filename ||
        ''
      if (uploaded) {
        setFormData((p) => ({ ...p, thumbnail_url: uploaded }))
        setImagePreview(toAbsoluteUrl(uploaded))
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (formData.thumbnail_url) {
      try {
        await api.delete(`/upload/file?url=${encodeURIComponent(formData.thumbnail_url)}`)
      } catch (error) {
        console.error('Failed to remove image:', error)
      }
    }
    setFormData((p) => ({ ...p, thumbnail_url: '', thumbnail_alt: '' }))
    setImagePreview('')
  }

  const toggleHome = async (video: any, value: boolean) => {
    try {
      setList((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, is_home: value } : v))
      )
      await api.put(`/videos/${video.id}`, { is_home: value ? 1 : 0 })
      queryClient.invalidateQueries({ queryKey: ['videos'] })
    } catch (error) {
      console.error('Failed to update home flag', error)
      refetch()
    }
  }

  const handleSave = () => {
    if (uploading) {
      alert('Please wait for image upload to complete before saving.')
      return
    }

    const effectiveThumb =
      formData.thumbnail_url ||
      (imagePreview
        ? imagePreview.startsWith(assetBase)
          ? imagePreview.replace(assetBase, '')
          : imagePreview
        : '')

    if (!effectiveThumb) {
      alert('Thumbnail is required. Please upload an image.')
      return
    }
    if (!formData.thumbnail_alt || !formData.thumbnail_alt.trim()) {
      alert('Thumbnail alt is required')
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
    if (!formData.video_url || !formData.video_url.trim()) {
      alert('Video URL is required')
      return
    }
    const videoUrl = formData.video_url.trim()
    if (!videoUrl.includes('vimeo.com')) {
      alert('Please provide a Vimeo link')
      return
    }

    const payload: any = {
      ...formData,
      video_url: videoUrl,
      thumbnail_url: effectiveThumb,
      thumbnail_alt: formData.thumbnail_alt,
    }

    if (!editingVideo) {
      payload.display_order = (list?.length || 0) + 1
    }

    saveMutation.mutate(payload)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/videos/${deleteId}`)
      setDeleteId(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete video:', error)
    }
  }

  const loadingState = isLoading || !readyAfterDelay

  if (loadingState) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Videos</h1>
          <Button onClick={() => openModal(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Video
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
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-muted-foreground">
            {data?.pagination?.total || list.length || 0} total videos
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-56"
          />
          <Button onClick={() => openModal(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Video
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No videos found</p>
            <Button onClick={() => openModal(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first video
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map((video: any, idx: number) => (
            <Card
              key={video.id}
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

                {video.thumbnail_url ? (
                  <div className="relative my-4 ml-2 mr-4">
                    <img
                      src={toAbsoluteUrl(video.thumbnail_url)}
                      alt={video.title}
                      className="w-48 h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/40 rounded-full p-2 text-white">
                        <Play className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-32 bg-gray-200 flex items-center justify-center flex-shrink-0 my-4 ml-2 mr-4 rounded-lg">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                
                <div className="flex-1 py-4 pr-4">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1">{video.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          <span className="break-all">{video.video_url}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs text-muted-foreground">Show on Home</span>
                        <Switch
                          checked={!!video.is_home}
                          onCheckedChange={(v) => toggleHome(video, v)}
                          className="data-[state=checked]:bg-green-500"
                          aria-label="Toggle video on home"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {video.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {video.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Display order: {video.display_order || idx + 1}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openModal(video)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteId(video.id)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-[3px]">Video</p>
                <h2 className="text-2xl font-semibold">
                  {editingVideo ? 'Edit Video' : 'New Video'}
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
                    placeholder="Enter video title"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Vimeo Link *</label>
                  <Input
                    value={formData.video_url}
                    onChange={(e) => setFormData((p) => ({ ...p, video_url: e.target.value }))}
                    placeholder="https://player.vimeo.com/video/..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Only Vimeo links are allowed. Paste the full embed/link URL.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Short Description</label>
                  <Textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    maxLength={500}
                    placeholder="Brief description (max 500 characters)"
                  />
                  <p className="text-xs text-muted-foreground">{formData.description?.length || 0}/500 characters</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Thumbnail *</label>
                  <p className="text-xs text-muted-foreground mb-2">Recommended: 1000 x 570px</p>
                  {imagePreview ? (
                    <div className="space-y-2">
                      <div className="relative inline-block cursor-pointer group">
                        <img src={imagePreview} alt="Preview" style={{ width: '340px', height: '200px' }} className="object-cover rounded border group-hover:opacity-80 transition" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">Click to enlarge</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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
                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium">Thumbnail Alt *</label>
                    <Input
                      value={formData.thumbnail_alt}
                      onChange={(e) => setFormData((p) => ({ ...p, thumbnail_alt: e.target.value }))}
                      required
                      placeholder="Descrizione dell'immagine"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <Switch
                    checked={!!formData.is_home}
                    onCheckedChange={(v) => setFormData((p) => ({ ...p, is_home: v }))}
                    className="data-[state=checked]:bg-green-500"
                  />
                  <span className="text-sm font-medium">Show on Home</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeModal}>
                  Close
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
            <h3 className="text-xl font-semibold">Delete video?</h3>
            <p className="text-muted-foreground">
              If the video is older than 24h it will be archived (not removed) and a redirect placeholder will be created for SEO safety.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Close</Button>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
