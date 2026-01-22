import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Calendar, Edit, GripVertical, Plus, Trash2 } from 'lucide-react'

export default function TestimonialsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [list, setList] = useState<any[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['testimonials', searchTerm],
    queryFn: async () => {
      const q = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ''
      const response = await api.get(`/testimonials${q ? `?${q.slice(1)}` : ''}`)
      return response.data.data
    },
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (data?.testimonials) {
      const ordered = [...data.testimonials].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      setList(ordered)
    }
  }, [data])

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      return
    }

    const updated = [...list]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(targetIndex, 0, moved)

    const ordered = updated.map((item, i) => ({ ...item, display_order: i + 1 }))
    setList(ordered)
    setDragIndex(null)

    try {
      await api.post('/testimonials/reorder', {
        order: ordered.map((item, i) => ({ id: item.id, display_order: i + 1 })),
      })
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      refetch()
    } catch (error) {
      console.error('Failed to reorder testimonials:', error)
      refetch()
    }
  }

  const toggleHome = async (item: any, value: boolean) => {
    try {
      setList((prev) => prev.map((t) => (t.id === item.id ? { ...t, is_home: value } : t)))
      await api.put(`/testimonials/${item.id}`, { is_home: value ? 1 : 0 })
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
    } catch (error) {
      console.error('Failed to update home flag', error)
      refetch()
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/testimonials/${deleteId}`)
      setList((prev) => prev.filter((item) => item.id !== deleteId))
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
    } catch (error) {
      console.error('Failed to delete testimonial', error)
    } finally {
      setDeleteId(null)
    }
  }

  const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '')

  const shortContent = (value: string) => {
    const clean = stripHtml(value || '')
    if (clean.length <= 160) return clean
    return `${clean.slice(0, 160)}…`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Testimonials</h1>
          <p className="text-muted-foreground">
            {data?.pagination?.total || 0} total testimonials
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search testimonials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-56"
          />
          <Link to="/testimonials/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Testimonial
            </Button>
          </Link>
        </div>
      </div>

      {list.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No testimonials yet</p>
            <Link to="/testimonials/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create your first testimonial
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {list.map((item: any, idx: number) => (
          <Card
            key={item.id}
            className="overflow-hidden border border-dashed"
            draggable
            onDragStart={() => setDragIndex(idx)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => setDragIndex(null)}
          >
            <div className="flex gap-4 items-start">
              <div className="p-3 text-muted-foreground cursor-grab">
                <GripVertical className="h-5 w-5" />
                <div className="text-xs text-muted-foreground text-center mt-1">#{idx + 1}</div>
              </div>

              <div className="flex-1 py-4 pr-4">
                <CardHeader className="p-0 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{item.author}</CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{item.testimonial_date ? format(new Date(item.testimonial_date), 'dd MMM yyyy') : 'No date'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs text-muted-foreground">Show in Home</span>
                        <Switch
                          checked={!!item.is_home}
                          onCheckedChange={(v) => toggleHome(item, v)}
                          className="data-[state=checked]:bg-green-500"
                          aria-label="Toggle testimonial visibility"
                        />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {shortContent(item.content)}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{item.testimonial_date ? format(new Date(item.testimonial_date), 'dd MMM yyyy') : 'No date'}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/testimonials/${item.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteId(item.id)}>
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

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-semibold">Delete testimonial?</h3>
            <p className="text-muted-foreground">
              This action cannot be undone. The testimonial will be permanently removed.
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
