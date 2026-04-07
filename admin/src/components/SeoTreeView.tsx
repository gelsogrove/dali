import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import './SeoTreeView.css'

export default function SeoTreeView() {
  const [asciiTree, setAsciiTree] = useState('')
  const [stats, setStats] = useState({ total: 0, good: 0, warning: 0 })

  // Fetch SEO tree
  const treeQuery = useQuery({
    queryKey: ['seo-tree'],
    queryFn: async () => {
      const res = await api.get('/seo/tree')
      return res.data?.data?.tree
    },
  })

  // Regenerate sitemap
  const sitemapMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/seo/regenerate-sitemap', {})
      return res.data
    },
    onSuccess: (data) => {
      alert('✅ Sitemap regenerated successfully!\n\n' + data.data.message)
    },
    onError: (error) => {
      const errMsg = error.response?.data?.error || error.message
      alert('❌ Error regenerating sitemap:\n\n' + errMsg)
    }
  })

  // Convert tree to ASCII art
  useEffect(() => {
    if (!treeQuery.data) return

    let ascii = ''
    let itemCount = 0
    let goodCount = 0
    let warningCount = 0

    const printNode = (node, prefix = '', isLast = true) => {
      const connector = isLast ? '└── ' : '├── '
      const quality = node.quality || 'normal'
      let line = prefix + connector

      // Add icon based on quality
      if (quality === 'good') {
        line += '✓ '
        goodCount++
      } else if (quality === 'warning') {
        line += '⚠ '
        warningCount++
      } else {
        line += '○ '
      }

      // Add name
      line += node.name

      // Add metadata
      if (node.type === 'category') {
        line += ` (${node.count || 0})`
      } else if (node.slug) {
        line += ` → ${node.path}`
      }

      if (node.is_home) {
        line += ' [HOME]'
      }

      if (!node.is_active) {
        line += ' [INACTIVE]'
      }

      ascii += line + '\n'
      itemCount++

      // Process children
      if (node.children && node.children.length > 0) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ')
        node.children.forEach((child, idx) => {
          const isLastChild = idx === node.children.length - 1
          printNode(child, newPrefix, isLastChild)
        })
      }
    }

    // Start with root
    if (treeQuery.data.children) {
      ascii = 'SEO Structure\n'
      ascii += '├─ Base URL: /\n'
      ascii += '│\n'

      treeQuery.data.children.forEach((node, idx) => {
        const isLast = idx === treeQuery.data.children.length - 1
        printNode(node, '', isLast)
      })
    }

    setAsciiTree(ascii)
    setStats({ total: itemCount, good: goodCount, warning: warningCount })
  }, [treeQuery.data])

  if (treeQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SEO Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading SEO tree...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="seo-tree-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>SEO Structure Hierarchy</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Complete URL tree with quality indicators
            </p>
          </div>
          <Button
            onClick={() => sitemapMutation.mutate()}
            disabled={sitemapMutation.isPending}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {sitemapMutation.isPending ? 'Regenerating...' : 'Regenerate Sitemap'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-600">Total URLs</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-5 w-5" />
              {stats.good}
            </div>
            <div className="text-xs text-green-600">Good URLs</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
              <AlertTriangle className="h-5 w-5" />
              {stats.warning}
            </div>
            <div className="text-xs text-yellow-600">Warning URLs</div>
          </div>
        </div>

        {/* ASCII Tree */}
        <div className="seo-tree-container">
          <pre className="seo-tree-pre">{asciiTree}</pre>
        </div>

        {/* Legend */}
        <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span> = Good URL (proper slug format)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠</span> = Warning URL (needs improvement)
          </div>
          <div className="flex items-center gap-2">
            <span>○</span> = Neutral (ID-based or special URLs)
          </div>
          <div className="flex items-center gap-2">
            <span>[HOME]</span> = Shown on homepage
          </div>
          <div className="flex items-center gap-2">
            <span>[INACTIVE]</span> = Not published
          </div>
        </div>

        {/* Sitemap Status */}
        {sitemapMutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Sitemap regenerated successfully</span>
            </div>
          </div>
        )}

        {sitemapMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-semibold">Sitemap regeneration failed</p>
                <p className="mt-1">{sitemapMutation.error?.response?.data?.error || sitemapMutation.error?.message}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
