import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Info } from 'lucide-react'

export default function PropertyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    property_type: '',
    status: 'draft',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    featured: false,
  })

  useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await api.get(`/properties/${id}`)
      setFormData(response.data.data)
      return response.data.data
    },
    enabled: isEdit,
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        return api.put(`/properties/${id}`, data)
      } else {
        return api.post('/properties', data)
      }
    },
    onSuccess: () => {
      navigate('/properties')
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'An error occurred')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/properties')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Property' : 'Add New Property'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                <label htmlFor="price" className="text-sm font-medium">
                  Price *
                </label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="bedrooms" className="text-sm font-medium">
                  Bedrooms
                </label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="bathrooms" className="text-sm font-medium">
                  Bathrooms
                </label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="square_feet" className="text-sm font-medium">
                  Square Feet
                </label>
                <Input
                  id="square_feet"
                  name="square_feet"
                  type="number"
                  value={formData.square_feet}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="property_type" className="text-sm font-medium">
                  Property Type
                </label>
                <Input
                  id="property_type"
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  placeholder="Single Family, Condo, etc."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm font-medium focus:border-primary focus:outline-none"
                >
                  <option value="draft">📝 Draft (Not Visible)</option>
                  <option value="active">✅ Active (Visible on Website)</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="sold">🏷️ Sold</option>
                </select>
                <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md text-sm">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-blue-800 dark:text-blue-200">
                    <strong>Status Info:</strong>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• <strong>Active:</strong> Visible on public website</li>
                      <li>• <strong>Draft:</strong> Hidden from public, work in progress</li>
                      <li>• <strong>Pending/Sold:</strong> Marked but still visible</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Featured Property</span>
                </label>
              </div>
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
                rows={4}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Address</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="address" className="text-sm font-medium">
                    Street Address
                  </label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium">
                    City
                  </label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="state" className="text-sm font-medium">
                    State
                  </label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="zip_code" className="text-sm font-medium">
                    Zip Code
                  </label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : isEdit ? 'Update Property' : 'Create Property'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/properties')}
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
