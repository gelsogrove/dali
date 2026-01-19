import { useQuery } from '@tantml:react-query'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function BlogsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['blogs'],
    queryFn: async () => {
      const response = await api.get('/blogs?is_active=all')
      return response.data.data
    },
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog?')) return
    
    try {
      await api.delete(`/blogs/${id}`)
      refetch()
    } catch (error) {
      console.error('Failed to delete blog:', error)
    }
  }

  if (isLoading) {
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

  const blogs = data?.blogs || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blogs</h1>
          <p className="text-muted-foreground">
            {data?.pagination?.total || 0} total blogs
          </p>
        </div>
        <Button asChild>
          <Link to="/blogs/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Blog
          </Link>
        </Button>
      </div>

      {blogs.length === 0 ? (
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
          {blogs.map((blog: any) => (
            <Card key={blog.id} className="overflow-hidden">
              <div className="flex gap-4">
                {blog.featured_image && (
                  <img
                    src={blog.featured_image}
                    alt={blog.title}
                    className="w-48 h-48 object-cover"
                  />
                )}
                {!blog.featured_image && (
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
                
                <div className="flex-1 py-4 pr-4">
                  <CardHeader className="p-0 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-1">{blog.title}</CardTitle>
                        {blog.subtitle && (
                          <p className="text-sm text-muted-foreground mt-1">{blog.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                          blog.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {blog.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 whitespace-nowrap">
                          Order: {blog.display_order}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {blog.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {blog.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {blog.published_date 
                            ? format(new Date(blog.published_date), 'MMM dd, yyyy')
                            : 'No date'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/blogs/${blog.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(blog.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  )
}
