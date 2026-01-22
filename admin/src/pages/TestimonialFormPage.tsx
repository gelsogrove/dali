import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft } from 'lucide-react'

export default function TestimonialFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    author: '',
    content: '',
    testimonial_date: new Date().toISOString().split('T')[0],
    is_home: false,
  })

  useQuery({
    queryKey: ['testimonial', id],
    queryFn: async () => {
      const response = await api.get(`/testimonials/${id}`)
      const testimonial = response.data.data
      setFormData({
        author: testimonial.author || '',
        content: testimonial.content || '',
        testimonial_date: testimonial.testimonial_date || new Date().toISOString().split('T')[0],
        is_home: testimonial.is_home,
      })
      return testimonial
    },
    enabled: isEdit,
  })

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        return api.put(`/testimonials/${id}`, data)
      } else {
        return api.post('/testimonials', data)
      }
    },
    onSuccess: () => {
      navigate('/testimonials')
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'An error occurred')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...formData,
      is_home: formData.is_home ? 1 : 0,
    }
    mutation.mutate(payload)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/testimonials')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEdit ? 'Edit Testimonial' : 'New Testimonial'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Testimonial Information</CardTitle>
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
                <label htmlFor="author" className="text-sm font-medium">
                  Author *
                </label>
                <Input
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium">
                  Testimonial Content *
                </label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="testimonial_date" className="text-sm font-medium">
                  Date
                </label>
                <Input
                  id="testimonial_date"
                  name="testimonial_date"
                  type="date"
                  value={formData.testimonial_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : isEdit ? 'Update Testimonial' : 'Create Testimonial'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/testimonials')}
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
