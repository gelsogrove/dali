import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import TrixEditor from '@/components/TrixEditor'
import { Calendar, Edit, GripVertical, Plus, Trash2, X } from 'lucide-react'

type TestimonialForm = {
  author: string
  content: string
  testimonial_date: string
  is_active: boolean
}

const defaultForm: TestimonialForm = {
  author: '',
  content: '',
  testimonial_date: new Date().toISOString().split('T')[0],
  is_active: true,
}

export default function TestimonialsPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [list, setList] = useState<any[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [formData, setFormData] = useState<TestimonialForm>({ ...defaultForm })
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['testimonials', searchTerm],
    queryFn: async () => {
      const q = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ''
      const response = await api.get(`/testimonials?is_active=all${q}`)
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

  const openModal = (item: any | null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        author: item.author || '',
        content: item.content || '',
        testimonial_date: item.testimonial_date || new Date().toISOString().split('T')[0],
        is_active: !!item.is_active,
      })
    } else {
      setEditingItem(null)
      setFormData({
        ...defaultForm,
        testimonial_date: new Date().toISOString().split('T')[0],
      })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingItem(null)
    setFormData({
      ...defaultForm,
      testimonial_date: new Date().toISOString().split('T')[0],
    })
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingItem) {
        return api.put(`/testimonials/${editingItem.id}`, payload)
      }
      return api.post('/testimonials', payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      const refreshed = await refetch()
      if (refreshed?.data?.testimonials) {
        const ordered = [...refreshed.data.testimonials].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
        setList(ordered)
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

  const handleSave = () => {
    if (!formData.author.trim()) {
      alert('Author is required')
      return
    }
    if (!formData.content.trim()) {
      alert('Content is required')
      return
    }

    const payload = {
      ...formData,
      testimonial_date: formData.testimonial_date || null,
      is_active: formData.is_active ? 1 : 0,
    }

    saveMutation.mutate(payload)
  }

  const toggleActive = async (item: any, value: boolean) => {
    try {
      setList((prev) => prev.map((t) => (t.id === item.id ? { ...t, is_active: value } : t)))
      await api.put(`/testimonials/${item.id}`, { is_active: value ? 1 : 0 })
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
    } catch (error) {
      console.error('Failed to update status', error)
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
          <Button onClick={() => openModal(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Testimonial
          </Button>
        </div>
      </div>

      {list.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No testimonials yet</p>
            <Button onClick={() => openModal(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first testimonial
            </Button>
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
                <CardHeader className="p-0 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-lg">{item.author}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{item.testimonial_date ? format(new Date(item.testimonial_date), 'dd MMM yyyy') : 'No date'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Active</span>
                      <Switch
                        checked={!!item.is_active}
                        onCheckedChange={(v) => toggleActive(item, v)}
                        className="data-[state=checked]:bg-green-500"
                        aria-label="Toggle testimonial visibility"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <p className="text-muted-foreground leading-relaxed">
                    {shortContent(item.content)}
                  </p>
                </CardContent>

                <div className="flex items-center gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => openModal(item)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-[3px]">Testimonials</p>
                <h2 className="text-2xl font-semibold">
                  {editingItem ? 'Edit Testimonial' : 'New Testimonial'}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Author *</label>
                  <Input
                    value={formData.author}
                    onChange={(e) => setFormData((p) => ({ ...p, author: e.target.value }))}
                    placeholder="Full name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formData.testimonial_date}
                    onChange={(e) => setFormData((p) => ({ ...p, testimonial_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Content *</label>
                  <TrixEditor
                    value={formData.content}
                    onChange={(value) => setFormData((p) => ({ ...p, content: value }))}
                    placeholder="Add testimonial text"
                  />
                  <p className="text-xs text-muted-foreground">
                    Rich text supported; plain text will be shown on site.
                  </p>
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <Switch
                    checked={!!formData.is_active}
                    onCheckedChange={(v) => setFormData((p) => ({ ...p, is_active: v }))}
                    className="data-[state=checked]:bg-green-500"
                  />
                  <span className="text-sm font-medium">Active (visible on site)</span>
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
