import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react'

export default function VideosPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [list, setList] = useState<any[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [readyAfterDelay, setReadyAfterDelay] = useState(false)
  const [thumbErrors, setThumbErrors] = useState<Record<string, boolean>>({})

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
      const payload = response.data?.data ?? response.data ?? {}
      if (Array.isArray(payload?.videos)) {
        return { videos: payload.videos, pagination: payload.pagination ?? null }
      }
      if (Array.isArray(payload)) {
        return { videos: payload, pagination: null }
      }
      return { videos: [], pagination: null }
    },
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const videos = (data as any)?.videos || []
    if (videos.length) {
      const ordered = [...videos].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      setList(ordered)
    } else {
      setList([])
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
          <Link to="/videos/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Video
            </Button>
          </Link>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 bg-gray-200 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-gray-100 rounded" />
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
        <h1 className="text-3xl font-bold">Videos</h1>
        <Link to="/videos/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Video
          </Button>
        </Link>
      </div>

      <Input
        placeholder="Search videos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {list.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No videos found.{' '}
            <Link to="/videos/new" className="text-primary hover:underline">
              Create your first video
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map((video, index) => (
            <Card
              key={video.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              onDragEnd={() => setDragIndex(null)}
              className={`overflow-hidden border border-dashed cursor-move transition ${
                dragIndex === index ? 'opacity-50' : ''
              }`}
            >
              <div className="flex gap-4 items-start">
                <div className="p-3 text-muted-foreground cursor-grab">
                  <GripVertical className="h-5 w-5" />
                  <div className="text-xs text-muted-foreground text-center mt-1">#{index + 1}</div>
                </div>

                {video.thumbnail_url && !thumbErrors[video.id] ? (
                  <img
                    src={toAbsoluteUrl(video.thumbnail_url)}
                    alt={video.thumbnail_alt || video.title}
                    className="w-48 h-48 object-cover my-4 mr-4 rounded-lg"
                    onError={() => setThumbErrors((prev) => ({ ...prev, [video.id]: true }))}
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center flex-shrink-0 my-4 mr-4 rounded-lg border border-dashed border-gray-300 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <div className="placeholder-box w-full h-full rounded-md"></div>
                  </div>
                )}
                
                <div className="flex-1 py-4 pr-4">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1">{video.title}</CardTitle>
                        {video.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {video.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs text-muted-foreground">Show in Home</span>
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
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {/* Placeholder for additional info */}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/videos/${video.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteId(video.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirm Delete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Are you sure you want to delete this video?</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteId(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDelete}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
