import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowDown, ArrowUp, Download, FileText, GripVertical, Trash } from 'lucide-react'
import api from '@/lib/api'

type Attachment = {
  id: number
  property_id: number
  title: string
  filename: string
  url: string
  mime_type?: string
  size_bytes?: number
  display_order: number
}

interface Props {
  propertyId: number
}

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain'

export default function PropertyAttachments({ propertyId }: Props) {
  const queryClient = useQueryClient()
  const [localItems, setLocalItems] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)

  const { data = [], isLoading } = useQuery({
    queryKey: ['property-attachments', propertyId],
    queryFn: async () => {
      const res = await api.get(`/properties/${propertyId}/attachments`)
      return res.data.data || res.data || []
    },
  })

  useEffect(() => {
    if (Array.isArray(data)) {
      setLocalItems(data)
    }
  }, [data])

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await api.post('/upload/attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const meta = uploadRes.data.data
      const title = file.name.replace(/\.[^.]+$/, '')

      await api.post(`/properties/${propertyId}/attachments`, {
        title,
        filename: meta.filename,
        url: meta.url,
        mime_type: meta.mime_type,
        size_bytes: meta.size,
        display_order: localItems.length,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-attachments', propertyId] })
    },
    onSettled: () => setUploading(false),
  })

  const saveMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      setSavingId(id)
      await api.put(`/properties/${propertyId}/attachments/${id}`, { title })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['property-attachments', propertyId] }),
    onSettled: () => setSavingId(null),
  })

  const reorderMutation = useMutation({
    mutationFn: async (items: Attachment[]) => {
      const order = items.map((item, idx) => ({ id: item.id, display_order: idx }))
      await api.put(`/properties/${propertyId}/attachments/reorder`, { order })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['property-attachments', propertyId] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ['property-attachments', propertyId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/properties/${propertyId}/attachments/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['property-attachments', propertyId] }),
  })

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) {
      alert('File too large. Max 10MB.')
      return
    }
    setUploading(true)
    uploadMutation.mutate(file)
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const next = [...localItems]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setLocalItems(next)
    reorderMutation.mutate(next)
  }

  const handleTitleChange = (id: number, title: string) => {
    setLocalItems((prev) => prev.map((item) => (item.id === id ? { ...item, title } : item)))
  }

  const handleSaveTitle = (id: number, title: string) => {
    if (!title.trim()) return
    saveMutation.mutate({ id, title: title.trim() })
  }

  const handleDelete = (id: number) => {
    if (!confirm('Delete this attachment? The file will be removed from the server.')) return
    deleteMutation.mutate(id)
  }

  const iconFor = (mime?: string, filename?: string) => {
    const ext = (filename || '').split('.').pop()?.toLowerCase() || ''
    if ((mime && mime.includes('pdf')) || ext === 'pdf') return 'PDF'
    if (['doc', 'docx'].includes(ext)) return 'DOC'
    if (['xls', 'xlsx'].includes(ext)) return 'XLS'
    if (['ppt', 'pptx'].includes(ext)) return 'PPT'
    return 'FILE'
  }

  const formatSize = (size?: number) => {
    if (!size) return ''
    const kb = size / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-medium">Attachments</h3>
              <p className="text-sm text-muted-foreground">
                Upload PDFs, Word, Excel, PowerPoint or TXT files (max 10MB). Visible on the property page for download.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input type="file" accept={ACCEPT} onChange={handleUpload} disabled={uploading} />
              {uploading && <span className="text-sm text-blue-600">Uploading...</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading attachments...</p>
          ) : localItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attachments yet.</p>
          ) : (
            <div className="space-y-3">
              {localItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{iconFor(item.mime_type, item.filename)}</Badge>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" title="Download">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Title (shown on frontend)</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => handleTitleChange(item.id, e.target.value)}
                        onBlur={(e) => handleSaveTitle(item.id, e.target.value)}
                        disabled={savingId === item.id}
                      />
                      <div className="text-xs text-muted-foreground mt-1 space-x-2">
                        <span>{item.filename}</span>
                        {item.size_bytes ? <span>• {formatSize(item.size_bytes)}</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0 || reorderMutation.isPending}
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === localItems.length - 1 || reorderMutation.isPending}
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />
      <div className="text-xs text-muted-foreground">
        Tip: give each attachment a clear, concise title (e.g., “Masterplan PDF”, “Floorplans - Tower A”).
      </div>
    </div>
  )
}
