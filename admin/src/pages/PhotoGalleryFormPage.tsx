import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Upload, X } from 'lucide-react';

interface PhotoFormData {
  property_id: number;
  image_url: string;
  thumbnail_url?: string;
  medium_url?: string;
  caption: string;
  alt_text: string;
  display_order: number;
  is_featured: boolean;
}

export default function PhotoGalleryFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const propertyId = searchParams.get('property_id');

  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState<PhotoFormData>({
    property_id: propertyId ? parseInt(propertyId) : 0,
    image_url: '',
    caption: '',
    alt_text: '',
    display_order: 0,
    is_featured: false,
  });

  // Fetch photo data if editing
  const { data: photoData } = useQuery({
    queryKey: ['photo', id],
    queryFn: async () => {
      const response = await api.get(`/photogallery/${id}`);
      return response.data.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (photoData) {
      setFormData({
        property_id: photoData.property_id,
        image_url: photoData.image_url,
        thumbnail_url: photoData.thumbnail_url,
        medium_url: photoData.medium_url,
        caption: photoData.caption || '',
        alt_text: photoData.alt_text || '',
        display_order: photoData.display_order,
        is_featured: photoData.is_featured,
      });
      setImagePreview(photoData.medium_url || photoData.image_url);
    }
  }, [photoData]);

  const createMutation = useMutation({
    mutationFn: async (data: PhotoFormData) => {
      await api.post('/photogallery', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      navigate(`/photogallery?property_id=${formData.property_id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PhotoFormData>) => {
      await api.put(`/photogallery/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      queryClient.invalidateQueries({ queryKey: ['photo', id] });
      navigate(`/photogallery?property_id=${formData.property_id}`);
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum 10MB');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload/property-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data.data;
      setFormData((prev) => ({
        ...prev,
        image_url: data.original,
        thumbnail_url: data.thumbnail,
        medium_url: data.medium,
      }));
      setImagePreview(data.medium);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error while uploading the image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm('Do you want to remove this image?')) return;

    if (formData.image_url) {
      try {
        await api.delete(`/upload/file?url=${encodeURIComponent(formData.image_url)}`);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    setFormData((prev) => ({
      ...prev,
      image_url: '',
      thumbnail_url: '',
      medium_url: '',
    }));
    setImagePreview('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.image_url) {
      alert('Please upload an image');
      return;
    }

    if (isEdit) {
      // For edit, only send editable fields
      const updateData = {
        caption: formData.caption,
        alt_text: formData.alt_text,
        display_order: formData.display_order,
        is_featured: formData.is_featured,
      };
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    const targetPropertyId = formData.property_id || propertyId;
    if (targetPropertyId) {
      navigate(`/photogallery?property_id=${targetPropertyId}`);
    } else {
      navigate('/photogallery');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Photo' : 'Upload New Photo'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isEdit ? 'Update photo details' : 'Add a new photo to the gallery'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image *</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                {!isEdit && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  )}
                  <p className="text-sm font-medium mb-1">
                    {uploading ? 'Uploading...' : 'Click to upload or drag here'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Input
              id="caption"
              value={formData.caption}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, caption: e.target.value }))
              }
              placeholder="e.g.: Living room view"
            />
          </div>

          {/* Alt Text */}
          <div className="space-y-2">
            <Label htmlFor="alt_text">Alternative Text</Label>
            <Input
              id="alt_text"
              value={formData.alt_text}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, alt_text: e.target.value }))
              }
              placeholder="Description for accessibility and SEO"
            />
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  display_order: parseInt(e.target.value) || 0,
                }))
              }
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first
            </p>
          </div>

          {/* Is Featured */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="is_featured">Featured Photo</Label>
              <p className="text-sm text-muted-foreground">
                This will be the main photo for the property
              </p>
            </div>
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, is_featured: checked }))
              }
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEdit
                  ? 'Update Photo'
                  : 'Upload Photo'}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
