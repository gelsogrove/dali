import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Home, Building2, Flame, Lock, TreePine } from 'lucide-react'
import api from '@/lib/api'

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  active: { label: 'Active', icon: Home, color: 'bg-blue-100 text-blue-600' },
  development: { label: 'Development', icon: Building2, color: 'bg-emerald-100 text-emerald-600' },
  hot_deal: { label: 'Hot Deals', icon: Flame, color: 'bg-orange-100 text-orange-600' },
  off_market: { label: 'Off Market', icon: Lock, color: 'bg-red-100 text-red-600' },
  land: { label: 'Land', icon: TreePine, color: 'bg-green-100 text-green-600' },
}

export default function PropertyTypeStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['property-type-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/property-types')
      return res.data?.data || {}
    },
  })

  if (isLoading) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-3">Properties by Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-20 bg-gray-100" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const types = data?.types || []

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Properties by Type</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {types.map((item: any) => {
          const config = typeConfig[item.property_type] || {
            label: item.property_type,
            icon: Home,
            color: 'bg-gray-100 text-gray-600',
          }
          const Icon = config.icon
          return (
            <Card key={item.property_type}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{config.label}</p>
                    <p className="text-2xl font-bold mt-1">{item.count}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
