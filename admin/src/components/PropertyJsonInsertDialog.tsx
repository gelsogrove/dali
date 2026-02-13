import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { CheckCircle, Copy, FileJson, Upload, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react'

// ─── SQL SCHEMA EXACT VALUES ──────────────────────────────
// These MUST match the DB ENUM definitions exactly

const ENUM_PROPERTY_TYPE = ['active', 'development', 'hot_deal', 'off_market', 'land'] as const
const ENUM_STATUS = ['for_sale', 'sold', 'reserved'] as const
const ENUM_PRICE_CURRENCY = ['USD', 'MXN', 'EUR'] as const
const ENUM_CATEGORIES = ['apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial'] as const
const ENUM_FURNISHING = ['furnished', 'semi-furnished', 'unfurnished'] as const
const ENUM_BEDROOMS = ['studio', '1', '2', '3', '4', '5+'] as const
const ENUM_BATHROOMS = ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+'] as const

// SQL varchar limits
const MAX_LENGTHS: Record<string, number> = {
  title: 255,
  subtitle: 255,
  neighborhood: 255,
  city: 100,
  state: 100,
  country: 100,
  seo_title: 160,
  seo_description: 320,
  og_title: 160,
  og_description: 320,
}

// ─── ACCEPTED JSON KEYS ──────────────────────────────────
const ACCEPTED_KEYS = new Set([
  'title', 'subtitle', 'property_type', 'status', 'property_categories',
  'description', 'content',
  'bedrooms', 'bedrooms_min', 'bedrooms_max',
  'bathrooms', 'bathrooms_min', 'bathrooms_max',
  'sqm', 'sqft', 'sqm_min', 'sqm_max', 'sqft_min', 'sqft_max',
  'lot_size_sqm', 'year_built',
  'furnishing_status', 'tags',
  'address', 'neighborhood', 'city', 'state', 'country', 'google_maps_url',
  'price_base_currency', 'price_usd', 'price_mxn',
  'price_on_demand', 'price_negotiable',
  'price_from_usd', 'price_to_usd', 'price_from_mxn', 'price_to_mxn',
  'seo_title', 'seo_description', 'og_title', 'og_description',
  'featured',
  // Legacy / auto fields (accepted but ignored or auto-handled)
  'slug', 'property_id_reference', 'property_category',
  'latitude', 'longitude', 'seo_keywords',
  'is_active', 'show_in_home', 'order', 'views_count', 'internal_notes',
  'exchange_rate',
])

const REQUIRED_FIELDS = ['title', 'property_type', 'status', 'city', 'country'] as const

const NUMBER_FIELDS = new Set([
  'price_usd', 'price_mxn', 'price_from_usd', 'price_to_usd', 'price_from_mxn', 'price_to_mxn',
  'sqm', 'sqft', 'sqm_min', 'sqm_max', 'sqft_min', 'sqft_max',
  'lot_size_sqm', 'year_built', 'exchange_rate',
  'latitude', 'longitude', 'order', 'views_count',
])

const BOOLEAN_FIELDS = new Set([
  'price_on_demand', 'price_negotiable', 'is_active', 'featured', 'show_in_home',
])

// ─── STANDARD TAGS ──────────────────────────────────
const TAGS_STANDARD = new Set([
  'Central Air Conditioning', 'Elevator', 'Laundry Area', 'Fireplace', 'Storage', 'Basement', 'Lobby',
  'Terrace', 'Balcony', 'Rooftop', 'Solarium', 'Garden', 'Zen Area', 'Hammock Area', 'Jungle Bar',
  'Parking', 'Garage', 'Underground Parking', 'Bike Parking', 'Motor Lobby', 'Electric Bicycles', 'Free Beach Shuttle',
  '24/7 Security', 'Controlled Access', 'CCTV', 'Perimeter Fence', 'Concierge 24/7',
  'Pool', 'Rooftop Pool', 'Beach-like Pool', 'Private Beach Club', 'Waterfront Access', 'Beach Access',
  'Spa', 'Sauna', 'Steam Room', 'Lockers', 'Temazcal', 'Yoga Studio', 'Meditation Room',
  'Gym', 'Jogging Track', 'Paddle Court', 'Pickleball Court', 'Tennis Court', 'Mini-golf', 'Pet Park',
  'Club House', 'Lounge', 'Cinema', 'Bar', 'Pub', 'Kids Playroom', 'Playground', 'Restaurant', 'Coffee Shop', 'Organic Market', 'Food Pavilion',
  'Co-working Space', 'Business Lounge',
  'Solar Panels', 'Rainwater Collection', 'Water Treatment', 'Eco-Friendly',
  'Golf View', 'Ocean View', 'City View', 'Mountain View', 'Lake View', 'Jungle View',
  'Pet Friendly', 'Furnished', 'Smart Home', 'Newly Renovated', 'Investment Opportunity', 'Beachfront', 'Gated Community', 'Walk to Beach',
])

const TAG_MAP = new Map(Array.from(TAGS_STANDARD).map((t) => [t.toLowerCase(), t]))

// ─── NORMALIZATION MAPS ──────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  apartment: 'apartment', apartments: 'apartment', apt: 'apartment', flat: 'apartment',
  house: 'house', home: 'house',
  villa: 'villa',
  condo: 'condo', condominium: 'condo', condominiums: 'condo',
  penthouse: 'penthouse', penthouses: 'penthouse',
  land: 'land', plot: 'land', lot: 'land',
  commercial: 'commercial',
}

const FURNISHING_MAP: Record<string, string> = {
  furnished: 'furnished',
  'semi furnished': 'semi-furnished', semifurnished: 'semi-furnished', 'semi-furnished': 'semi-furnished',
  unfurnished: 'unfurnished', 'un-furnished': 'unfurnished',
}

// ─── TEMPLATE JSON ──────────────────────────────────
const TEMPLATE_JSON = {
  title: '',
  subtitle: '',
  property_type: 'development',
  status: 'for_sale',
  property_categories: [],
  description: '',
  content: '',
  bedrooms: null,
  bedrooms_min: null,
  bedrooms_max: null,
  bathrooms: null,
  bathrooms_min: null,
  bathrooms_max: null,
  sqm: null,
  sqft: null,
  sqm_min: null,
  sqm_max: null,
  sqft_min: null,
  sqft_max: null,
  lot_size_sqm: null,
  year_built: null,
  furnishing_status: 'unfurnished',
  tags: [],
  address: '',
  neighborhood: '',
  city: '',
  state: '',
  country: 'Mexico',
  google_maps_url: '',
  price_base_currency: 'USD',
  price_usd: null,
  price_mxn: null,
  price_on_demand: false,
  price_negotiable: false,
  price_from_usd: null,
  price_to_usd: null,
  price_from_mxn: null,
  price_to_mxn: null,
  seo_title: '',
  seo_description: '',
  og_title: '',
  og_description: '',
  featured: false,
}

// ─── NORMALIZE FUNCTIONS ──────────────────────────────────

function normalizeCategory(v: unknown) {
  if (typeof v !== 'string') return v
  return CATEGORY_MAP[v.trim().toLowerCase()] ?? v.trim().toLowerCase()
}

function normalizeStatus(v: unknown) {
  if (typeof v !== 'string') return v
  let s = v.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (s === 'forsale') s = 'for_sale'
  return s
}

function normalizePropertyType(v: unknown) {
  if (typeof v !== 'string') return v
  const s = v.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (['active_property', 'active_properties', 'activeproperty'].includes(s)) return 'active'
  if (['new_development', 'new_developments'].includes(s)) return 'development'
  if (['hot_deal', 'hot_deals', 'hotdeal', 'hotdeals', 'opportunity', 'opportunities', 'oportunidad', 'oportunidades'].includes(s)) return 'hot_deal'
  if (['off_market', 'offmarket'].includes(s)) return 'off_market'
  if (['land', 'lands', 'tierra'].includes(s)) return 'land'
  return s
}

function normalizeBedrooms(v: unknown): unknown {
  if (v === null || v === undefined) return v
  if (typeof v === 'string') {
    const raw = v.trim().toLowerCase()
    if (raw === 'studio' || raw === '0') return 'studio'
    if (raw.endsWith('+')) return '5+'
    if (!isNaN(Number(raw))) return normalizeBedrooms(Number(raw))
    return v
  }
  if (typeof v === 'number') {
    if (v <= 0) return 'studio'
    if (v >= 5) return '5+'
    if ([1, 2, 3, 4].includes(v)) return String(v)
  }
  return v
}

function normalizeBathrooms(v: unknown): unknown {
  if (v === null || v === undefined) return v
  if (typeof v === 'string') {
    const raw = v.trim()
    if (raw.endsWith('+')) return '5+'
    if (!isNaN(Number(raw))) return normalizeBathrooms(Number(raw))
    return v
  }
  if (typeof v === 'number') {
    if (v >= 5) return '5+'
    const allowed = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
    if (allowed.includes(v)) return String(v)
  }
  return v
}

function normalizeBoolean(v: unknown) {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['true', '1', 'yes'].includes(s)) return true
    if (['false', '0', 'no'].includes(s)) return false
  }
  return v
}

function normalizeNumber(v: unknown) {
  if (typeof v === 'number' || v === null) return v
  if (typeof v === 'string') {
    const cleaned = v.trim().replace(/[$€,\s]/g, '')
    if (cleaned !== '' && !isNaN(Number(cleaned))) return Number(cleaned)
  }
  return v
}

function normalizeJsonData(input: any): any {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input
  const data = { ...input }

  // Normalize enums
  data.property_type = normalizePropertyType(data.property_type)
  data.status = normalizeStatus(data.status)

  if (typeof data.price_base_currency === 'string') {
    const v = data.price_base_currency.trim().toUpperCase()
    data.price_base_currency = v === 'US$' ? 'USD' : v === 'MX$' ? 'MXN' : v
  }

  // Auto-convert legacy property_category → property_categories
  if (data.property_category && (!data.property_categories || (Array.isArray(data.property_categories) && data.property_categories.length === 0))) {
    data.property_categories = [normalizeCategory(data.property_category)]
  }
  delete data.property_category

  if (typeof data.property_categories === 'string') {
    data.property_categories = data.property_categories.split(/[,;]+/).map((v: string) => v.trim()).filter(Boolean)
  }
  if (Array.isArray(data.property_categories)) {
    data.property_categories = data.property_categories.map(normalizeCategory).filter((v: unknown) => v !== '' && v !== null)
  }

  if (typeof data.furnishing_status === 'string') {
    const key = data.furnishing_status.trim().toLowerCase()
    data.furnishing_status = FURNISHING_MAP[key] ?? key
  }

  if (typeof data.state === 'string') data.state = data.state.trim().toLowerCase()

  // Normalize tags
  if (Array.isArray(data.tags)) {
    data.tags = data.tags.map((tag: string) => {
      const trimmed = String(tag).trim()
      return TAG_MAP.get(trimmed.toLowerCase()) ?? trimmed
    })
  }

  // Normalize booleans
  BOOLEAN_FIELDS.forEach((field) => {
    if (field in data) data[field] = normalizeBoolean(data[field])
  })

  // Normalize numbers
  NUMBER_FIELDS.forEach((field) => {
    if (field in data) data[field] = normalizeNumber(data[field])
  })

  // Normalize bedrooms/bathrooms
  data.bedrooms = normalizeBedrooms(data.bedrooms)
  data.bedrooms_min = normalizeBedrooms(data.bedrooms_min)
  data.bedrooms_max = normalizeBedrooms(data.bedrooms_max)
  data.bathrooms = normalizeBathrooms(data.bathrooms)
  data.bathrooms_min = normalizeBathrooms(data.bathrooms_min)
  data.bathrooms_max = normalizeBathrooms(data.bathrooms_max)

  // Remove excluded/auto fields
  const autoFields = ['slug', 'property_id_reference', 'seo_keywords', 'latitude', 'longitude',
    'is_active', 'show_in_home', 'order', 'views_count', 'internal_notes', 'exchange_rate']
  autoFields.forEach((f) => delete data[f])

  return data
}

// ─── JSON ERROR LOCATION ──────────────────────────────────

function getJsonErrorLocation(error: Error, text: string) {
  const match = /position (\d+)/i.exec(error.message)
  if (!match) return null
  const idx = Number(match[1])
  if (Number.isNaN(idx)) return null
  const before = text.slice(0, idx)
  const lines = before.split('\n')
  return { line: lines.length, column: lines[lines.length - 1].length + 1 }
}

// ─── VALIDATION (DB-SCHEMA ALIGNED) ──────────────────────

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
  expected?: string
  received?: string
}

function validateJsonData(data: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [{ field: 'root', message: 'JSON must be an object', severity: 'error' }]
  }

  // 1. Check for unknown fields
  const extra = Object.keys(data).filter((k) => !ACCEPTED_KEYS.has(k))
  if (extra.length) {
    errors.push({ field: 'root', message: `Unknown fields will be ignored: ${extra.join(', ')}`, severity: 'warning' })
  }

  // 2. Required fields
  REQUIRED_FIELDS.forEach((field) => {
    const v = data[field]
    if (v === null || v === undefined || String(v).trim() === '') {
      errors.push({ field, message: `Required field "${field}" is missing or empty`, severity: 'error' })
    }
  })

  // 3. ENUM validations (exact match → SQL error if wrong)
  const enumChecks: [string, readonly string[], unknown][] = [
    ['property_type', ENUM_PROPERTY_TYPE, data.property_type],
    ['status', ENUM_STATUS, data.status],
    ['furnishing_status', ENUM_FURNISHING, data.furnishing_status],
    ['price_base_currency', ENUM_PRICE_CURRENCY, data.price_base_currency],
  ]
  enumChecks.forEach(([field, allowed, value]) => {
    if (value && !allowed.includes(value as any)) {
      errors.push({
        field,
        message: `Invalid ${field}: "${value}"`,
        severity: 'error',
        expected: allowed.join(' | '),
        received: String(value),
      })
    }
  })

  const isDevelopment = data.property_type === 'development'
  const isActiveLike = !!data.property_type && data.property_type !== 'development'

  // 4. property_categories (ENUM per row in DB table)
  if (!Array.isArray(data.property_categories)) {
    errors.push({ field: 'property_categories', message: 'property_categories must be an array', severity: 'error' })
  } else {
    if (data.property_categories.length === 0) {
      errors.push({ field: 'property_categories', message: 'property_categories must have at least one value', severity: 'error' })
    }
    if (isActiveLike && data.property_categories.length > 1) {
      errors.push({
        field: 'property_categories',
        message: `Active-like properties must have exactly 1 category, got ${data.property_categories.length}`,
        severity: 'error',
        expected: '["apartment"]',
        received: JSON.stringify(data.property_categories),
      })
    }
    if (data.property_type === 'land' && !data.property_categories.includes('land')) {
      errors.push({
        field: 'property_categories',
        message: 'Land properties must include category "land"',
        severity: 'error',
        expected: '["land"]',
        received: JSON.stringify(data.property_categories),
      })
    }
    data.property_categories.forEach((cat: string, i: number) => {
      if (!(ENUM_CATEGORIES as readonly string[]).includes(cat)) {
        errors.push({
          field: `property_categories[${i}]`,
          message: `Invalid category: "${cat}"`,
          severity: 'error',
          expected: ENUM_CATEGORIES.join(' | '),
          received: cat,
        })
      }
    })
  }

  // 5. Bedrooms/Bathrooms ENUM checks
  const bedroomFields = ['bedrooms', 'bedrooms_min', 'bedrooms_max'] as const
  bedroomFields.forEach((field) => {
    const v = data[field]
    if (v !== null && v !== undefined && !(ENUM_BEDROOMS as readonly string[]).includes(String(v))) {
      errors.push({
        field,
        message: `Invalid ${field}: "${v}"`,
        severity: 'error',
        expected: ENUM_BEDROOMS.join(' | '),
        received: String(v),
      })
    }
  })

  const bathroomFields = ['bathrooms', 'bathrooms_min', 'bathrooms_max'] as const
  bathroomFields.forEach((field) => {
    const v = data[field]
    if (v !== null && v !== undefined && !(ENUM_BATHROOMS as readonly string[]).includes(String(v))) {
      errors.push({
        field,
        message: `Invalid ${field}: "${v}"`,
        severity: 'error',
        expected: ENUM_BATHROOMS.join(' | '),
        received: String(v),
      })
    }
  })

  // 6. Active vs Development field rules
  if (isActiveLike) {
    const mustBeNull = ['bedrooms_min', 'bedrooms_max', 'bathrooms_min', 'bathrooms_max', 'sqm_min', 'sqm_max', 'sqft_min', 'sqft_max', 'price_from_usd', 'price_to_usd', 'price_from_mxn', 'price_to_mxn']
    mustBeNull.forEach((f) => {
      if (data[f] !== null && data[f] !== undefined) {
        errors.push({ field: f, message: `"${f}" must be null for active-like properties`, severity: 'error' })
      }
    })
  }
  if (isDevelopment) {
    const mustBeNull = ['bedrooms', 'bathrooms', 'sqm', 'sqft', 'price_usd', 'price_mxn']
    mustBeNull.forEach((f) => {
      if (data[f] !== null && data[f] !== undefined) {
        errors.push({ field: f, message: `"${f}" must be null for developments`, severity: 'error' })
      }
    })
  }

  // 7. Number type checks (removed price validation per user request)
  NUMBER_FIELDS.forEach((field) => {
    const v = data[field]
    if (v !== null && v !== undefined && typeof v !== 'number') {
      errors.push({ field, message: `"${field}" must be a number or null, got ${typeof v}: "${v}"`, severity: 'error' })
    }
  })

  // 9. Boolean type checks
  BOOLEAN_FIELDS.forEach((field) => {
    if (field in data && typeof data[field] !== 'boolean') {
      errors.push({ field, message: `"${field}" must be true or false, got ${typeof data[field]}: "${data[field]}"`, severity: 'error' })
    }
  })

  // 10. String length checks (SQL varchar limits)
  Object.entries(MAX_LENGTHS).forEach(([field, maxLen]) => {
    const v = data[field]
    if (typeof v === 'string' && v.length > maxLen) {
      errors.push({
        field,
        message: `"${field}" exceeds max length: ${v.length}/${maxLen} chars`,
        severity: 'error',
        expected: `max ${maxLen} chars`,
        received: `${v.length} chars`,
      })
    }
  })

  // 11. Tags validation
  if (Array.isArray(data.tags)) {
    data.tags.forEach((tag: string, i: number) => {
      if (!TAGS_STANDARD.has(tag)) {
        // Find closest match for suggestion
        const lower = tag.toLowerCase()
        const closest = TAG_MAP.get(lower)
        errors.push({
          field: `tags[${i}]`,
          message: `Invalid tag: "${tag}"${closest ? ` — did you mean "${closest}"?` : ''}`,
          severity: 'error',
          expected: 'See standard tags list',
          received: tag,
        })
      }
    })
  }

  // 12. Content quality check (250+ words REQUIRED for SEO)
  if (data.content) {
    const wordCount = data.content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
    if (wordCount < 250) {
      errors.push({
        field: 'content',
        message: `❌ Content has only ${wordCount} words but MUST have at least 250 words for proper SEO. Add more detail about: location highlights, amenities, lifestyle, investment potential.`,
        severity: 'error',
      })
    }
  } else {
    errors.push({ field: 'content', message: '❌ Content is required and must be at least 250 words in HTML format.', severity: 'error' })
  }

  // 13. Description check
  if (!data.description || String(data.description).trim() === '') {
    errors.push({ field: 'description', message: 'Description is empty. A short summary is recommended for property cards.', severity: 'warning' })
  }

  // 14. State lowercase check
  if (data.state && typeof data.state === 'string' && data.state !== data.state.toLowerCase()) {
    errors.push({ field: 'state', message: `State must be lowercase: "${data.state}" → "${data.state.toLowerCase()}"`, severity: 'error' })
  }

  // 15. google_maps_url check
  if (data.google_maps_url && typeof data.google_maps_url === 'string' && data.google_maps_url.trim() !== '') {
    if (!data.google_maps_url.includes('google.com/maps') && !data.google_maps_url.includes('goo.gl/maps')) {
      errors.push({ field: 'google_maps_url', message: 'google_maps_url should be a Google Maps URL', severity: 'warning' })
    }
  }

  return errors
}

// ─── FORMAT ERRORS FOR CLIPBOARD ──────────────────────────

function formatErrorsForCopy(errors: ValidationError[]): string {
  const lines = ['=== VALIDATION ERRORS ===', '']
  const errs = errors.filter((e) => e.severity === 'error')
  const warns = errors.filter((e) => e.severity === 'warning')

  if (errs.length) {
    lines.push(`❌ ${errs.length} ERROR${errs.length > 1 ? 'S' : ''} (must fix):`)
    errs.forEach((e, i) => {
      lines.push(`${i + 1}. [${e.field}] ${e.message}`)
      if (e.expected) lines.push(`   Expected: ${e.expected}`)
      if (e.received) lines.push(`   Got: ${e.received}`)
    })
  }
  if (warns.length) {
    lines.push('', `⚠️ ${warns.length} WARNING${warns.length > 1 ? 'S' : ''} (recommended):`)
    warns.forEach((e, i) => { lines.push(`${i + 1}. [${e.field}] ${e.message}`) })
  }
  lines.push('', 'Fix these errors in the JSON and try again.')
  return lines.join('\n')
}

// ─── COMPONENT ──────────────────────────────────

export default function PropertyJsonInsertDialog({
  onImported,
}: {
  onImported?: (id?: number) => void
}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1) // Step 1: select category, Step 2: paste JSON
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [jsonText, setJsonText] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [serverValid, setServerValid] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const errorCount = validationErrors.filter((e) => e.severity === 'error').length
  const warningCount = validationErrors.filter((e) => e.severity === 'warning').length

  const validateMutation = useMutation({
    mutationFn: async (data: any) => api.post('/properties/import-json?validate_only=true', data),
    onSuccess: (response) => setServerValid(response.data.data),
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Server validation failed'
      setValidationErrors((prev) => [...prev, { field: 'server', message: msg, severity: 'error' }])
      setServerValid(null)
    },
  })

  const importMutation = useMutation({
    mutationFn: async (data: any) => api.post('/properties/import-json', data),
    onSuccess: (response) => {
      const propertyId = response.data.data?.id
      setOpen(false)
      setJsonText('')
      setValidationErrors([])
      setServerValid(null)
      if (onImported) onImported(propertyId)
      if (propertyId) navigate(`/properties/${propertyId}`)
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Import failed'
      setValidationErrors([{ field: 'server', message: `Server error: ${msg}`, severity: 'error' }])
    },
  })

  const handleValidate = useCallback(() => {
    setValidationErrors([])
    setServerValid(null)
    setCopied(false)

    // 1. Parse JSON
    let parsed: any
    try {
      parsed = JSON.parse(jsonText)
    } catch (error: any) {
      const loc = getJsonErrorLocation(error, jsonText)
      const locText = loc ? ` (line ${loc.line}, col ${loc.column})` : ''
      setValidationErrors([{
        field: 'JSON syntax',
        message: `Invalid JSON${locText}: ${error.message}`,
        severity: 'error',
      }])
      return
    }

    // 2. Normalize
    const normalized = normalizeJsonData(parsed)

    // 3. OVERRIDE property_type with selected category (user selection wins)
    if (selectedCategory) {
      normalized.property_type = selectedCategory
    }

    // 4. Client-side validation
    const clientErrors = validateJsonData(normalized)
    setValidationErrors(clientErrors)

    // 5. If no hard errors → server validation
    const hardErrors = clientErrors.filter((e) => e.severity === 'error')
    if (hardErrors.length === 0) {
      validateMutation.mutate(normalized)
    }
  }, [jsonText, selectedCategory, validateMutation])

  const handleImport = useCallback(() => {
    if (!serverValid?.valid) return
    try {
      const parsed = JSON.parse(jsonText)
      const normalized = normalizeJsonData(parsed)
      // OVERRIDE: User's selected category wins
      if (selectedCategory) {
        normalized.property_type = selectedCategory
      }
      importMutation.mutate(normalized)
    } catch (error: any) {
      setValidationErrors([{ field: 'JSON', message: error.message, severity: 'error' }])
    }
  }, [jsonText, selectedCategory, serverValid, importMutation])

  const handleCopyErrors = useCallback(() => {
    const text = formatErrorsForCopy(validationErrors)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [validationErrors])

  const handleUseTemplate = () => {
    setJsonText(JSON.stringify(TEMPLATE_JSON, null, 2))
    setValidationErrors([])
    setServerValid(null)
  }

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category)
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
    setSelectedCategory(null)
    setJsonText('')
    setValidationErrors([])
    setServerValid(null)
  }

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // Reset all state when closing
      setStep(1)
      setSelectedCategory(null)
      setJsonText('')
      setValidationErrors([])
      setServerValid(null)
      setCopied(false)
    }
  }

  const categoryIcons: Record<string, string> = {
    active: '🏠',
    development: '🏗️',
    hot_deal: '🔥',
    off_market: '🔒',
    land: '🌳',
  }

  const categoryLabels: Record<string, string> = {
    active: 'Active Properties',
    development: 'New Developments',
    hot_deal: 'Hot Deals',
    off_market: 'Off Market',
    land: 'Land',
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileJson className="mr-2 h-4 w-4" />
          Import JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {step === 1 ? 'Select Property Category' : `Import Property — ${categoryLabels[selectedCategory!]}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'First, select the property category. This will override any property_type in the JSON.' 
              : 'Paste the JSON generated by ChatGPT. The property will be created as the selected category.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          /* ─── STEP 1: CATEGORY SELECTION ────────────────────── */
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ENUM_PROPERTY_TYPE.map((category) => (
                <button
                  key={category}
                  onClick={() => handleSelectCategory(category)}
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
                  type="button"
                >
                  <span className="text-4xl">{categoryIcons[category]}</span>
                  <span className="font-medium text-sm text-center">
                    {categoryLabels[category]}
                  </span>
                </button>
              ))}
            </div>
            <div className="text-sm text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="font-medium text-amber-900 mb-1">⚠️ Important:</p>
              <p className="text-amber-800">
                If your JSON contains a <code className="bg-amber-100 px-1 rounded">property_type</code> field, 
                <strong> your selection here will override it</strong>. The property will be created with the category you choose.
              </p>
            </div>
          </div>
        ) : (
          /* ─── STEP 2: JSON PASTE ───────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
                <ArrowLeft className="h-3 w-3" />
                Change Category
              </Button>
              <span className="text-sm flex items-center gap-2 text-muted-foreground">
                Selected: 
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium text-xs">
                  {categoryIcons[selectedCategory!]} {categoryLabels[selectedCategory!]}
                </span>
              </span>
            </div>

            {/* Textarea */}
            <Textarea
              value={jsonText}
              onChange={(e) => { setJsonText(e.target.value); setValidationErrors([]); setServerValid(null) }}
              placeholder={'Paste your JSON here...\n\nTip: Use the ChatGPT prompt from _docs/PROPERTIES_POSTMAN_TEMPLATE.md'}
              rows={16}
              className="font-mono text-xs leading-relaxed"
              spellCheck={false}
            />

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={handleValidate} disabled={!jsonText.trim() || validateMutation.isPending} variant="outline" size="sm">
                {validateMutation.isPending ? 'Validating...' : '✓ Validate'}
              </Button>
              <Button onClick={handleImport} disabled={!serverValid?.valid || importMutation.isPending} size="sm">
                <Upload className="mr-2 h-3 w-3" />
                {importMutation.isPending ? 'Importing...' : 'Import'}
              </Button>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" onClick={handleUseTemplate} className="text-xs">
                📋 Use Template
              </Button>
            </div>
          </div>
        )}

        {/* ── SERVER VALID ── */}
        {serverValid?.valid && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div>
                  <strong className="text-green-900">✓ Ready to import</strong>
                  <div className="mt-1 text-sm text-green-800 grid grid-cols-2 gap-x-6 gap-y-0.5">
                    <span>Title: <strong>{serverValid.preview?.title}</strong></span>
                    <span>Type: <strong>{serverValid.preview?.property_type}</strong></span>
                    <span>City: <strong>{serverValid.preview?.city}</strong></span>
                    <span>Price: <strong>{serverValid.preview?.price_usd ? `$${Number(serverValid.preview.price_usd).toLocaleString()}` : 'On demand'}</strong></span>
                  </div>
                </div>
              </div>
              {warningCount > 0 && (
                <p className="text-xs text-amber-700 mt-2">⚠️ {warningCount} warning{warningCount > 1 ? 's' : ''} below (non-blocking)</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* ── VALIDATION ERRORS ── */}
        {validationErrors.length > 0 && (
          <div className="space-y-3">
            {/* Error summary + Copy button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {errorCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <XCircle className="h-4 w-4" /> {errorCount} error{errorCount > 1 ? 's' : ''}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <AlertTriangle className="h-4 w-4" /> {warningCount} warning{warningCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {errorCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleCopyErrors} className="text-xs gap-1.5">
                  <Copy className="h-3 w-3" />
                  {copied ? 'Copied!' : 'Copy errors → ChatGPT'}
                </Button>
              )}
            </div>

            {/* Error list */}
            <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto text-sm">
              {validationErrors.map((err, i) => (
                <div key={i} className={`px-3 py-2 ${err.severity === 'error' ? 'bg-red-50' : 'bg-amber-50'}`}>
                  <div className="flex items-start gap-2">
                    {err.severity === 'error'
                      ? <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                      : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                    }
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-muted-foreground">{err.field}</span>
                      <p className={err.severity === 'error' ? 'text-red-800' : 'text-amber-800'}>
                        {err.message}
                      </p>
                      {err.expected && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Expected: <code className="bg-gray-100 px-1 rounded">{err.expected}</code>
                        </p>
                      )}
                      {err.received && (
                        <p className="text-xs text-muted-foreground">
                          Got: <code className="bg-red-100 px-1 rounded">{err.received}</code>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errorCount > 0 && (
              <p className="text-xs text-muted-foreground italic">
                💡 Tip: Click "Copy errors → ChatGPT" and paste them to ChatGPT to fix the JSON automatically.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
