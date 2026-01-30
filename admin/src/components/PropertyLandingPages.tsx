import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { MapPin, Layers } from 'lucide-react'
import api from '@/lib/api'

interface PropertyLandingPagesProps {
  propertyId: number
}

export default function PropertyLandingPages({ propertyId }: PropertyLandingPagesProps) {
  const queryClient = useQueryClient()
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Fetch cities
  const { data: citiesData = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await api.get('/cities')
      return response.data?.data?.cities || response.data?.data || []
    },
  })

  // Fetch areas
  const { data: areasData = [] } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const response = await api.get('/areas')
      return response.data?.data?.areas || response.data?.data || []
    },
  })

  // Ensure cities and areas are arrays
  const cities = Array.isArray(citiesData) ? citiesData : []
  const areas = Array.isArray(areasData) ? areasData : []

  // Fetch property's current landing pages
  const { data: currentLandingPages = [], isLoading } = useQuery({
    queryKey: ['property-landing-pages', propertyId],
    queryFn: async () => {
      const response = await api.get(`/properties/${propertyId}/landing-pages`)
      return response.data.data || []
    },
  })

  // Initialize selected slugs when data loads
  useEffect(() => {
    if (currentLandingPages.length >= 0) {
      setSelectedSlugs(currentLandingPages)
    }
  }, [currentLandingPages])

  // Auto-save function
  const saveToServer = async (newSlugs: string[]) => {
    setIsSaving(true)
    try {
      await api.put(`/properties/${propertyId}/landing-pages`, {
        landing_pages: newSlugs,
      })
      queryClient.invalidateQueries({ queryKey: ['property-landing-pages', propertyId] })
    } catch (error) {
      console.error('Failed to save landing pages:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (slug: string, checked: boolean) => {
    const newSlugs = checked 
      ? [...selectedSlugs, slug] 
      : selectedSlugs.filter((s) => s !== slug)
    setSelectedSlugs(newSlugs)
    // Auto-save immediately
    saveToServer(newSlugs)
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
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-medium mb-2">Landing Pages Association</h3>
              <p className="text-sm text-muted-foreground">
                Select which landing pages (Cities & Areas) will display this property.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {selectedSlugs.length} landing page{selectedSlugs.length !== 1 ? 's' : ''}
                {isSaving && <span className="ml-2 text-blue-500">Saving...</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Landing Pages Selection */}
      <Card>
        <CardContent className="pt-6">
          <Accordion type="multiple" defaultValue={['cities', 'areas']} className="w-full">
            {/* Cities */}
            <AccordionItem value="cities">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Cities ({cities.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {cities.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4">No cities available</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    {cities.map((city: any) => {
                      const isChecked = selectedSlugs.includes(city.slug)
                      return (
                        <div key={city.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`city-${city.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => handleToggle(city.slug, !!checked)}
                          />
                          <Label
                            htmlFor={`city-${city.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {city.title}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Areas */}
            <AccordionItem value="areas">
              <AccordionTrigger className="text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Areas ({areas.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {areas.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-4">No areas available</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    {areas.map((area: any) => {
                      const isChecked = selectedSlugs.includes(area.slug)
                      return (
                        <div key={area.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`area-${area.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => handleToggle(area.slug, !!checked)}
                          />
                          <Label
                            htmlFor={`area-${area.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {area.title}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-sm space-y-2">
            <p className="font-medium">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Select landing pages where this property should appear</li>
              <li>Cities: Main destination pages (e.g., Tulum, Playa del Carmen)</li>
              <li>Areas: Sub-locations within cities (e.g., Downtown, Beach Zone)</li>
              <li>Property will be visible in search results on selected pages</li>
              <li><strong>Changes are saved automatically</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
