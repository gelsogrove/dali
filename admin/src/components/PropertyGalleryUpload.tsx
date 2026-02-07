import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Upload, GripVertical, Trash2, Image as ImageIcon } from 'lucide-react'
import api from '@/lib/api'
import SafeImage from '@/components/SafeImage'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const ASSET_BASE = API_BASE.replace(/\/api$/, '')

const toAbsoluteUrl = (url?: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return `${ASSET_BASE}${url}`
  return `${ASSET_BASE}/${url}`
}

interface PropertyPhoto {
  id: number
  property_id: number
  url: string
  alt_text: string
  is_cover: boolean
  order: number
  created_at: string
}

interface PropertyGalleryUploadProps {
  propertyId: number
}

function SortablePhotoItem({ photo, index, onDelete, onUpdateAlt }: {
  photo: PropertyPhoto
  index: number
  onDelete: (id: number) => void
  onUpdateAlt: (id: number, altText: string) => void
}) {
  const [isEditingAlt, setIsEditingAlt] = useState(false)
  const [altText, setAltText] = useState(photo.alt_text)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSaveAlt = () => {
    onUpdateAlt(photo.id, altText)
    setIsEditingAlt(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:shadow-md transition-shadow"
    >
      {/* Order number */}
      <div className="text-xs text-muted-foreground font-mono w-6 text-center">
        #{index + 1}
      </div>

      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Image Thumbnail */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
        <SafeImage
          src={toAbsoluteUrl(photo.url)}
          alt={photo.alt_text || 'Property photo'}
          className="w-full h-full object-cover"
        />
        {index === 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-xs text-center py-0.5">
            Cover
          </div>
        )}
      </div>

      {/* Alt Text */}
      <div className="flex-1 min-w-0">
        {isEditingAlt ? (
          <div className="flex gap-2">
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Alt text..."
              className="flex-1"
            />
            <Button size="sm" onClick={handleSaveAlt}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditingAlt(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground truncate flex-1">
              {photo.alt_text || <span className="italic">No alt text</span>}
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditingAlt(true)}
              className="text-xs"
            >
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Actions - only delete */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(photo.id)}
          title="Delete photo"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default function PropertyGalleryUpload({ propertyId }: PropertyGalleryUploadProps) {
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch photos
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['property-photos', propertyId],
    queryFn: async () => {
      const response = await api.get(`/property-photos/property/${propertyId}`)
      return response.data.data as PropertyPhoto[]
    },
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('image', file)

      // Upload image first
      const uploadResponse = await api.post('/upload/property-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const imageUrl = uploadResponse.data.data.url

      // Create photo record
      const photoResponse = await api.post('/property-photos', {
        property_id: propertyId,
        url: imageUrl,
        alt_text: '',
        is_cover: photos.length === 0, // First photo is cover by default
      })

      return photoResponse.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-photos', propertyId] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/property-photos/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-photos', propertyId] })
      setDeleteId(null)
    },
  })

  // Update alt text mutation
  const updateAltMutation = useMutation({
    mutationFn: async ({ id, alt_text }: { id: number; alt_text: string }) => {
      await api.put(`/property-photos/${id}`, { alt_text })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-photos', propertyId] })
    },
  })

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (items: { id: number; order: number }[]) => {
      const response = await api.post('/property-photos/reorder', { items })
      return response.data
    },
    onSuccess: () => {
      // Refetch to confirm persistence
      queryClient.invalidateQueries({ queryKey: ['property-photos', propertyId] })
    },
    onError: (error) => {
      console.error('Reorder failed:', error)
      // Refetch to restore correct order
      queryClient.invalidateQueries({ queryKey: ['property-photos', propertyId] })
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image`)
          continue
        }

        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large (max 5MB)`)
          continue
        }

        await uploadMutation.mutateAsync(file)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload one or more images')
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = photos.findIndex((p) => p.id === active.id)
    const newIndex = photos.findIndex((p) => p.id === over.id)

    const reorderedPhotos = arrayMove(photos, oldIndex, newIndex)

    // Optimistic update - immediately update the cache
    queryClient.setQueryData(['property-photos', propertyId], 
      reorderedPhotos.map((photo, index) => ({ ...photo, order: index + 1 }))
    )

    // Update order on server
    const items = reorderedPhotos.map((photo, index) => ({
      id: photo.id,
      order: index + 1,
    }))

    reorderMutation.mutate(items)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label
              htmlFor="photo-upload"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Photos
                </>
              )}
            </Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">
              Max 5MB per image. JPEG, PNG, WebP supported. Multiple selection allowed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Photos List */}
      {photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No photos uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-1">Upload your first photo to get started</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium">
                {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Drag to reorder. The first photo is used as cover.
              </p>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={photos.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {photos.map((photo, index) => (
                    <SortablePhotoItem
                      key={photo.id}
                      photo={photo}
                      index={index}
                      onDelete={(id) => setDeleteId(id)}
                      onUpdateAlt={(id, altText) => updateAltMutation.mutate({ id, alt_text: altText })}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the photo from the property gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
