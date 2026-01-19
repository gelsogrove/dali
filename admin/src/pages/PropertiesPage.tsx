import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function PropertiesPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const response = await api.get('/properties?status=all')
      return response.data.data
    },
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this property?')) return
    
    try {
      await api.delete(`/properties/${id}`)
      refetch()
    } catch (error) {
      console.error('Failed to delete property:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Properties</h1>
          <Button asChild>
            <Link to="/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200" />
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

  const properties = data?.properties || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground">
            {data?.pagination?.total || 0} total properties
          </p>
        </div>
        <Button asChild>
          <Link to="/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No properties found</p>
            <Button asChild>
              <Link to="/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first property
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property: any) => (
            <Card key={property.id} className="overflow-hidden">
              {property.featured_image && (
                <img
                  src={property.featured_image}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
              )}
              {!property.featured_image && (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="line-clamp-1">{property.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="font-semibold text-primary">
                    {formatCurrency(property.price)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    property.status === 'active' ? 'bg-green-100 text-green-700' :
                    property.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    property.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {property.status}
                  </span>
                  {property.featured && (
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  {property.bedrooms && <span>{property.bedrooms} beds</span>}
                  {property.bathrooms && <span>{property.bathrooms} baths</span>}
                  {property.square_feet && <span>{property.square_feet} sqft</span>}
                </div>
                
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/properties/${property.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(property.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
