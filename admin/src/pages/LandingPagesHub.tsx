import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function LandingPagesHub() {
  const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Landing Pages</h1>
        <p className="text-sm text-muted-foreground">Manage Cities and Areas landing pages</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Cities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Create and edit city landing pages with hero images, content, and SEO meta tags.
            </p>
            <Button onClick={() => navigate('/cities')}>Manage Cities</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Manage area landing pages linked to cities, with full SEO controls and images.
            </p>
            <Button onClick={() => navigate('/areas')}>Manage Areas</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
