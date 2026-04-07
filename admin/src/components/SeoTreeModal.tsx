import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

  const generateTree = () => {
    if (!treeQuery.data) return ''

    if (typeof treeQuery.data === 'string') {
      return treeQuery.data
    }

    const activePaths: string[] = []
    const collectActivePaths = (node: any) => {
      if (node?.path && node.is_active) {
        activePaths.push(node.path)
      }
      if (node?.children?.length) {
        node.children.forEach((child: any) => collectActivePaths(child))
      }
    }

    if (Array.isArray(treeQuery.data)) {
      treeQuery.data.forEach((node: any) => collectActivePaths(node))
    } else if (treeQuery.data.children) {
      treeQuery.data.children.forEach((node: any) => collectActivePaths(node))
    } else {
      collectActivePaths(treeQuery.data)
    }

    const uniquePaths = Array.from(new Set(activePaths)).sort((a, b) => a.localeCompare(b))

    type TreeNode = {
      segment: string
      fullPath: string
      children: Record<string, TreeNode>
    }

    const root: TreeNode = { segment: '', fullPath: '', children: {} }

    const insertPath = (path: string) => {
      if (path === '/' || path === '') {
        if (!root.children['/']) {
          root.children['/'] = { segment: '/', fullPath: '/', children: {} }
        }
        return
      }

      const parts = path.split('/').filter(Boolean)
      let current = root
      let currentPath = ''
      for (const segment of parts) {
        currentPath += '/' + segment
        if (!current.children[segment]) {
          current.children[segment] = { segment, fullPath: currentPath, children: {} }
        }
        current = current.children[segment]
      }
    }

    uniquePaths.forEach((path) => insertPath(path))

    let ascii = ''
    const printNode = (node: TreeNode, prefix = '', isLast = true) => {
      const connector = isLast ? '└── ' : '├── '
      ascii += prefix + connector + node.fullPath + '\n'

      const children = Object.values(node.children).sort((a, b) => a.fullPath.localeCompare(b.fullPath))
      if (children.length > 0) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ')
        children.forEach((child, idx) => {
          const isLastChild = idx === children.length - 1
          printNode(child, newPrefix, isLastChild)
        })
      }
    }

    const topLevel = Object.values(root.children).sort((a, b) => a.fullPath.localeCompare(b.fullPath))
    topLevel.forEach((node, idx) => {
      const isLast = idx === topLevel.length - 1
      printNode(node, '', isLast)
    })

    return ascii
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setAsciiTree('')
    }
  }

  useEffect(() => {
    if (!open) return
    if (treeQuery.data) {
      setAsciiTree(generateTree())
    }
  }, [open, treeQuery.data])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
          <CardContent className="p-6 flex flex-col items-center justify-center h-full gap-3">
            <div className="p-3 rounded-full bg-blue-50">
              <Map className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">SEO & Structure</p>
              <p className="text-xs text-muted-foreground mt-1">View site structure & URLs</p>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Site Structure & SEO</DialogTitle>
          <DialogDescription>Active URL hierarchy</DialogDescription>
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
