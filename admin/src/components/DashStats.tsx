import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Home, MapPin, Film, Mail, Lock } from 'lucide-react'
import api from '@/lib/api'

export default function DashStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['dash-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats')
      return res.data?.data || {}
    },
  })

  const stats = [
    { label: 'Active Properties', value: data?.active_properties ?? 0, icon: Home, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Landing Pages', value: data?.active_landing_pages ?? 0, icon: MapPin, color: 'bg-green-100 text-green-600' },
    { label: 'Active Videos', value: data?.active_videos ?? 0, icon: Film, color: 'bg-purple-100 text-purple-600' },
    { label: 'Access Requests', value: data?.access_requests ?? 0, icon: Mail, color: 'bg-amber-100 text-amber-600' },
    { label: 'Off Market Invites', value: data?.off_market_invites ?? 0, icon: Lock, color: 'bg-red-100 text-red-600' },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 h-24 bg-gray-200" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
