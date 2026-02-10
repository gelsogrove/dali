import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Upload, CheckCircle, XCircle, FileJson } from 'lucide-react'

export default function PropertyJsonImportPage() {
  const navigate = useNavigate()
  const [jsonText, setJsonText] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [errors, setErrors] = useState<string[]>([])

  const exampleJson = {
    title: 'Luxury Beachfront Villa in Tulum',
    subtitle: 'Modern 3BR villa with private pool',
    property_type: 'active',
    status: 'for_sale',
    property_categories: ['villa'],
    description: 'Stunning beachfront villa...',
    content: '<h2>Welcome</h2><p>Description...</p>',
    price_usd: 850000,
    price_on_demand: false,
    bedrooms: '3',
    bathrooms: '3.5',
    sqm: 250,
    furnishing_status: 'furnished',
    neighborhood: 'Tulum Beach',
    city: 'Tulum',
    country: 'Mexico',
    latitude: 20.2114185,
    longitude: -87.4653502,
    tags: ['Ocean View', 'Private Pool', 'Security 24/7'],
    seo_title: 'Luxury Villa in Tulum - 3BR with Pool',
    seo_description: 'Discover this stunning villa...',
    is_active: true,
    featured: false,
  }

  const validateMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/properties/import-json?validate_only=true', data)
    },
    onSuccess: (response) => {
      setValidationResult(response.data.data)
      setErrors([])
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || 'Validation failed'
      setErrors([errorMsg])
      setValidationResult(null)
    },
  })

  const importMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/properties/import-json', data)
    },
    onSuccess: (response) => {
      const propertyId = response.data.data?.id
      alert('Property imported successfully!')
      if (propertyId) {
        navigate(`/properties/${propertyId}`)
      } else {
        navigate('/properties')
      }
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || 'Import failed'
      setErrors([errorMsg])
    },
  })

  const handleValidate = () => {
    setErrors([])
    setValidationResult(null)

    try {
      const parsed = JSON.parse(jsonText)
      validateMutation.mutate(parsed)
    } catch (e: any) {
      setErrors([`Invalid JSON syntax: ${e.message}`])
    }
  }

  const handleImport = () => {
    if (!validationResult?.valid) {
      setErrors(['Please validate JSON first'])
      return
    }

    try {
      const parsed = JSON.parse(jsonText)
      importMutation.mutate(parsed)
    } catch (e: any) {
      setErrors([`Invalid JSON: ${e.message}`])
    }
  }

  const handleShowExample = () => {
    setJsonText(JSON.stringify(exampleJson, null, 2))
    setValidationResult(null)
    setErrors([])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/properties')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Import Property from JSON</h1>
          <p className="text-muted-foreground">
            Import properties in bulk or migrate from external systems
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Import Area */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>JSON Data</CardTitle>
                <Button variant="outline" size="sm" onClick={handleShowExample}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Show Example
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="Paste your JSON here..."
                rows={20}
                className="font-mono text-sm"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleValidate}
                  disabled={!jsonText || validateMutation.isPending}
                  variant="outline"
                >
                  {validateMutation.isPending ? 'Validating...' : 'Validate JSON'}
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!validationResult?.valid || importMutation.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {importMutation.isPending ? 'Importing...' : 'Import Property'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validation Result */}
          {validationResult && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong className="text-green-900">✓ JSON is valid</strong>
                <div className="mt-2 text-sm text-green-800">
                  <p>Title: {validationResult.preview?.title}</p>
                  <p>Type: {validationResult.preview?.property_type}</p>
                  <p>Price: ${validationResult.preview?.price_usd?.toLocaleString()}</p>
                  <p>City: {validationResult.preview?.city}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Validation Errors:</strong>
                <ul className="mt-2 list-disc list-inside">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Instructions Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Required Fields</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li>title (string)</li>
                <li>property_type (active/development)</li>
                <li>property_categories (array)</li>
                <li>city (string)</li>
                <li>latitude (number)</li>
                <li>longitude (number)</li>
                <li>price_usd or price_on_demand</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags Format</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="mb-2">Tags must be an array:</p>
              <code className="block bg-gray-100 p-2 rounded text-xs">
                "tags": ["Pool", "Gym", "Security 24/7"]
              </code>
              <p className="mt-2 text-muted-foreground">Max 20 tags</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Use Cases</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Migrate from WordPress</li>
                <li>Bulk property import</li>
                <li>Duplicate existing property</li>
                <li>Backup & restore</li>
                <li>Testing with sample data</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
