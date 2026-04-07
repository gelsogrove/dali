import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RefreshCw, Map } from 'lucide-react'
import api from '@/lib/api'
import './SeoTreeView.css'

export default function SeoTreeModal() {
  const [open, setOpen] = useState(false)
  const [asciiTree, setAsciiTree] = useState('')

  const treeQuery = useQuery({
    queryKey: ['seo-tree-modal'],
    enabled: open,
    queryFn: async () => {
      const res = await api.get('/seo/tree')
      return res.data?.data?.tree
    },
  })

  // Convert tree to ASCII art
  const generateTree = () => {
    if (!treeQuery.data) return ''

    let ascii = ''
    const printNode = (node: any, prefix = '', isLast = true) => {
      const connector = isLast ? '└── ' : '├── '
      let line = prefix + connector + node.name

      if (node.type === 'category') {
        line += ` (${node.count || 0})`
      } else if (node.path && node.path !== '/') {
        line += ` → ${node.path}`
      }

      if (node.is_home) {
        line += ' [HOME]'
      }

      if (!node.is_active) {
        line += ' [OFF]'
      }

      ascii += line + '\n'

      if (node.children && node.children.length > 0) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ')
        node.children.forEach((child: any, idx: number) => {
          const isLastChild = idx === node.children.length - 1
          printNode(child, newPrefix, isLastChild)
        })
      }
    }

    ascii = 'SITE STRUCTURE\n\n'
    if (treeQuery.data.children) {
      treeQuery.data.children.forEach((node: any, idx: number) => {
        const isLast = idx === treeQuery.data.children.length - 1
        printNode(node, '', isLast)
      })
    }

    return ascii
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setAsciiTree('')
    }
  }

  // Generate tree when query finishes loading
  if (treeQuery.isFetched && !asciiTree && treeQuery.data) {
    setAsciiTree(generateTree())
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full h-auto bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border-blue-200 py-6">
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <Map className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">SEO & Structure</span>
            </div>
            <p className="text-xs text-blue-700">View site structure, URLs & SEO settings</p>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Site Structure & SEO</DialogTitle>
          <DialogDescription>
            Complete URL hierarchy and content overview
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {treeQuery.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading structure...</div>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="font-mono text-xs whitespace-pre-wrap break-words overflow-auto max-h-96 text-gray-700">
                  {asciiTree}
                </pre>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>📌 Items in brackets = metadata about pages</p>
                <p>✓ = Show on homepage | [OFF] = Not published</p>
              </div>

              <Button
                onClick={() => treeQuery.refetch()}
                disabled={treeQuery.isFetching}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${treeQuery.isFetching ? 'animate-spin' : ''}`} />
                Refresh Structure
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
