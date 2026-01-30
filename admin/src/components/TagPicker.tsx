import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { X, Plus, Search } from 'lucide-react'

// 60+ Predefined tags organized by category
const PREDEFINED_TAGS = {
  'Essential Features': [
    'A/C',
    'Elevator',
    'Laundry Room',
    'Fireplace',
    'Storage Room',
    'Basement',
  ],
  'Outdoor & Terraces': [
    'Terrace',
    'Balcony',
    'Rooftop',
    'Solarium',
    'Garden',
    'Private Garden',
    'Zen Garden',
    'Patio',
  ],
  'Parking & Mobility': [
    'Parking',
    'Garage',
    'Underground Parking',
    'Covered Parking',
    'Street Parking',
    'Bike Parking',
    'Shuttle Service',
  ],
  'Security & Access': [
    'Controlled Access',
    'Security 24/7',
    'CCTV',
    'Perimeter Fence',
    'Concierge',
    'Gated Community',
    'Intercom',
    'Alarm System',
  ],
  'Pools & Water': [
    'Pool',
    'Rooftop Pool',
    'Infinity Pool',
    'Beach-like Pool',
    'Waterfront',
    'Beach Club',
    'Jacuzzi',
  ],
  'Wellness & Spa': [
    'Spa',
    'Sauna',
    'Steam Room',
    'Temazcal',
    'Yoga Area',
    'Meditation Space',
  ],
  'Fitness & Sports': [
    'Gym',
    'Jogging Track',
    'Paddle Court',
    'Pickleball Court',
    'Tennis Court',
    'Mini Golf',
    'Pet Park',
  ],
  'Community & Entertainment': [
    'Clubhouse',
    'Lounge',
    'Cinema Room',
    'Bar',
    'Kids Area',
    'Playground',
    'BBQ Area',
  ],
  'Work & Connectivity': [
    'Co-working Space',
    'Business Lounge',
    'High Speed Internet',
    'Smart Home',
  ],
  'Sustainability': [
    'Solar Panels',
    'Rainwater Harvesting',
    'Water Treatment',
    'Energy Efficient',
    'Eco-Friendly',
  ],
  'Views & Setting': [
    'Ocean View',
    'Beach Front',
    'Golf View',
    'City View',
    'Mountain View',
    'Lake View',
    'Marina View',
    'Jungle View',
  ],
  'Interior Features': [
    'Furnished',
    'Semi-Furnished',
    'Unfurnished',
    'Walk-in Closet',
    'High Ceilings',
    'Hardwood Floors',
    'Marble Floors',
    'Modern Kitchen',
    'Open Plan',
  ],
  'Property Status': [
    'New Construction',
    'Recently Renovated',
    'Move-in Ready',
    'Pre-sale',
    'Investment Opportunity',
  ],
  'Legal & Rentals': [
    'HOA',
    'No HOA',
    'Short Term Rental OK',
    'Long Term Rental OK',
    'Pet Friendly',
  ],
  'Proximity': [
    'Near Beach',
    'Near Golf',
    'Near Downtown',
    'Near Airport',
    'Near Shopping',
    'Near Schools',
    'Near Hospital',
    'Quiet Neighborhood',
  ],
}

interface TagPickerProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
}

export default function TagPicker({ selectedTags, onChange, maxTags = 20 }: TagPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [customTag, setCustomTag] = useState('')

  // Filter tags by search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return PREDEFINED_TAGS

    const filtered: Record<string, string[]> = {}
    Object.entries(PREDEFINED_TAGS).forEach(([category, tags]) => {
      const matchingTags = tags.filter((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (matchingTags.length > 0) {
        filtered[category] = matchingTags
      }
    })
    return filtered
  }, [searchTerm])

  const addTag = (tag: string) => {
    if (selectedTags.length >= maxTags) {
      return
    }

    if (selectedTags.includes(tag)) {
      return
    }

    onChange([...selectedTags, tag])
  }

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag))
  }

  const addCustomTag = () => {
    const trimmed = customTag.trim()
    if (!trimmed) return

    if (selectedTags.includes(trimmed)) {
      setCustomTag('')
      return
    }

    if (selectedTags.length >= maxTags) {
      return
    }

    onChange([...selectedTags, trimmed])
    setCustomTag('')
  }

  const handleCustomTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTag()
    }
  }

  return (
    <div className="space-y-4">
      {/* Selected Tags */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">
              Selected Tags ({selectedTags.length}/{maxTags})
            </h3>
            {selectedTags.length > 0 && (
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => onChange([])}
                className="h-7 text-xs"
              >
                Clear All
              </Button>
            )}
          </div>

          {selectedTags.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No tags selected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="px-3 py-1.5 text-sm">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Custom Tag Input */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium mb-3">Add Custom Tag</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter custom tag..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={handleCustomTagKeyDown}
              className="flex-1"
            />
            <Button type="button" onClick={addCustomTag} disabled={!customTag.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Predefined Tags by Category */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium mb-3">Predefined Tags</h3>

          {Object.keys(filteredCategories).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No tags found</p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(filteredCategories).map(([category, tags]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-sm font-medium">
                    {category} ({tags.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {tags.map((tag) => {
                        const isSelected = selectedTags.includes(tag)
                        const isDisabled = !isSelected && selectedTags.length >= maxTags

                        return (
                          <Button
                            key={tag}
                            type="button"
                            size="sm"
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => (isSelected ? removeTag(tag) : addTag(tag))}
                            disabled={isDisabled}
                            className="h-7 text-xs"
                          >
                            {isSelected && <X className="w-3 h-3 mr-1" />}
                            {!isSelected && <Plus className="w-3 h-3 mr-1" />}
                            {tag}
                          </Button>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
