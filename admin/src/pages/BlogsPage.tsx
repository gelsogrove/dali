import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, GripVertical, Calendar, Link2 } from 'lucide-react'
import { format } from 'date-fns'
import SafeImage from '@/components/SafeImage'

type Blog = {
  id: number
  title: string
  slug: string
  description?: string
  featured_image?: string
  featured_image_alt?: string
  published_date?: string
  display_order?: number
  is_home?: boolean
}

export default function BlogsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [list, setList] = useState<Blog[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [readyAfterDelay, setReadyAfterDelay] = useState(false)

  const API_BASE = import.meta.env.VITE_API_URL || '/api'
  const assetBase = useMemo(() => API_BASE.replace(/\/api$/, ''), [API_BASE])
  const toAbsoluteUrl = (url?: string) => {
    if (!url) return ''
    const base = assetBase || window.location.origin
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return `${base}${url}`
    return `${base}/${url}`
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['blogs', searchTerm],
    queryFn: async () => {
      const q = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ''
      const response = await api.get(`/blogs?include_deleted=false${q}`)
      // normalize: payload can be {blogs:[]}, or directly []
      const raw = response.data?.data ?? response.data ?? []
      const blogs = Array.isArray(raw?.blogs) ? raw.blogs : Array.isArray(raw) ? raw : []
      const pagination = raw?.pagination ?? null
      return { blogs, pagination }
    },
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const blogs = (data as any)?.blogs || []
    if (blogs.length) {
      const ordered = [...blogs].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
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
    const timer = setTimeout(() => setReadyAfterDelay(true), 600)
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

  const toggleHome = async (blog: Blog, value: boolean) => {
    try {
      setList((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, is_home: value } : b))
      )
      await api.put(`/blogs/${blog.id}`, { is_home: value ? 1 : 0 })
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
    } catch (error) {
      console.error('Failed to update isHome', error)
      refetch()
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/blogs/${id}`),
    onSuccess: async (res) => {
      setDeleteId(null)
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      refetch()
      console.log(res?.data?.data?.message || 'Blog removed')
    },
    onError: (error: any) => {
      console.error(error?.response?.data?.error || 'Failed to delete blog')
    },
  })

  const confirmDelete = () => {
    if (!deleteId) return
    deleteMutation.mutate(deleteId)
  }

  const loadingState = isLoading || !readyAfterDelay

  if (loadingState) {
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
            {(data as any)?.pagination?.total ?? list.length ?? 0} total blogs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-56"
          />
          <Button asChild>
            <Link to="/blogs/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Blog
            </Link>
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No blogs found</p>
            <Button asChild>
              <Link to="/blogs/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first blog
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map((blog, idx) => (
            <Card
              key={blog.id}
              className="overflow-hidden border border-dashed"
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              onDragEnd={() => setDragIndex(null)}
            >
              <div className="flex gap-4 items-center p-4">
                <div className="text-muted-foreground cursor-grab flex flex-col items-center gap-1">
                  <GripVertical className="h-5 w-5" />
                  <span className="text-xs">#{idx + 1}</span>
                </div>

                <SafeImage
                  src={toAbsoluteUrl(blog.featured_image)}
                  alt={blog.featured_image_alt || blog.title}
                  className="w-32 h-20 object-cover rounded flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base mb-1 truncate">{blog.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Link2 className="h-3 w-3" />
                    <span className="truncate">/blog/{blog.slug}</span>
                  </p>
                  {blog.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {blog.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Home</span>
                    <Switch
                      checked={!!blog.is_home}
                      onCheckedChange={(v) => toggleHome(blog, v)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {blog.published_date
                        ? format(new Date(blog.published_date), 'MMM dd, yyyy')
                        : 'No date'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/blogs/${blog.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(blog.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-semibold">Delete blog?</h3>
            <p className="text-muted-foreground">
              If the blog is older than 24h it will be archived (not removed) and a redirect placeholder will be created for SEO safety.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Close</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
