import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Trash2,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Clock,
  Mail,
  Phone,
  Home,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react'

interface AccessRequest {
  id: number
  property_id: number
  first_name: string
  last_name: string
  phone: string
  email: string
  message: string
  access_code: string | null
  code_generated_at: string | null
  code_expires_at: string | null
  code_expired: boolean
  viewed: number
  status: string
  created_at: string
  updated_at: string
  property_title: string
  property_slug: string
  property_type: string
  property_image: string
}

export default function AccessRequestsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [revealedCodes, setRevealedCodes] = useState<Record<number, boolean>>({})
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // Fetch requests
  const { data, isLoading } = useQuery({
    queryKey: ['access-requests', page],
    queryFn: async () => {
      const res = await api.get(`/access-requests?page=${page}&per_page=20`)
      return res.data
    },
  })

  // Mark all as viewed on load
  const markAllViewed = useMutation({
    mutationFn: () => api.post('/access-requests/mark-all-viewed'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests-count'] })
    },
  })

  // Auto mark all as viewed when page loads
  useState(() => {
    markAllViewed.mutate()
  })

  // Generate code mutation
  const generateCodeMutation = useMutation({
    mutationFn: (id: number) => api.post(`/access-requests/${id}/generate-code`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] })
      setRevealedCodes(prev => ({ ...prev, [id]: true }))
    },
  })

  // Regenerate code mutation
  const regenerateCodeMutation = useMutation({
    mutationFn: (id: number) => api.post(`/access-requests/${id}/regenerate-code`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] })
      setRevealedCodes(prev => ({ ...prev, [id]: true }))
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/access-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-requests'] })
      queryClient.invalidateQueries({ queryKey: ['access-requests-count'] })
      setDeleteConfirmId(null)
    },
  })

  const toggleRevealCode = (id: number) => {
    setRevealedCodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime()
    const expires = new Date(expiresAt).getTime()
    const diff = expires - now

    if (diff <= 0) return null

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const requests = data?.data?.requests || []
  const pagination = data?.data?.pagination || { page: 1, total_pages: 1, total: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage document access requests for Hot Deals properties
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-lg border border-amber-200">
          <KeyRound className="h-4 w-4" />
          <span className="text-sm font-medium">{pagination.total} total request{pagination.total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && requests.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Mail className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No access requests yet</h3>
          <p className="text-sm text-gray-400 mt-1">
            Requests will appear here when clients request access to property documents
          </p>
        </div>
      )}

      {/* Requests list */}
      {!isLoading && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((req: AccessRequest) => (
            <div
              key={req.id}
              className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                !req.viewed ? 'border-blue-300 shadow-md shadow-blue-50' : 'border-gray-200'
              }`}
            >
              {/* New badge */}
              {!req.viewed && (
                <div className="bg-blue-500 text-white text-xs font-semibold px-3 py-1">
                  NEW REQUEST
                </div>
              )}

              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                  {/* Client Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        {req.first_name[0]}{req.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {req.first_name} {req.last_name}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {formatDate(req.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        <a href={`mailto:${req.email}`} className="hover:text-blue-600 truncate">
                          {req.email}
                        </a>
                      </div>
                      {req.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <a href={`tel:${req.phone}`} className="hover:text-blue-600">
                            {req.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Property */}
                    <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <Home className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500">Property:</span>
                      <span className="font-medium text-gray-900 truncate">{req.property_title}</span>
                    </div>

                    {/* Message */}
                    {req.message && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 italic">
                        "{req.message}"
                      </div>
                    )}
                  </div>

                  {/* Access Code Section */}
                  <div className="lg:w-72 flex-shrink-0">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Access Code
                      </h4>

                      {!req.access_code ? (
                        /* No code generated yet */
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                            <KeyRound className="h-5 w-5 text-amber-600" />
                          </div>
                          <p className="text-xs text-gray-500 mb-3">No code generated</p>
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                            onClick={() => generateCodeMutation.mutate(req.id)}
                            disabled={generateCodeMutation.isPending}
                          >
                            {generateCodeMutation.isPending ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <KeyRound className="h-4 w-4 mr-2" />
                            )}
                            Generate Code
                          </Button>
                        </div>
                      ) : (
                        /* Code exists */
                        <div>
                          {/* Code display */}
                          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-2.5 mb-3">
                            <code className="font-mono text-lg font-bold tracking-widest text-gray-800">
                              {revealedCodes[req.id] ? req.access_code : '••••••'}
                            </code>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleRevealCode(req.id)}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                title={revealedCodes[req.id] ? 'Hide code' : 'Show code'}
                              >
                                {revealedCodes[req.id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                              {req.access_code && (
                                <button
                                  onClick={() => copyCode(req.access_code!, req.id)}
                                  className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Copy code"
                                >
                                  {copiedId === req.id ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expiration status */}
                          {req.code_expired ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Code expired
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                                onClick={() => regenerateCodeMutation.mutate(req.id)}
                                disabled={regenerateCodeMutation.isPending}
                              >
                                {regenerateCodeMutation.isPending ? (
                                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                )}
                                Regenerate Code
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Active
                              </div>
                              {req.code_expires_at && (
                                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                                  <Clock className="h-3 w-3" />
                                  {getTimeRemaining(req.code_expires_at) || 'Expiring soon'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:w-10 flex lg:flex-col items-center gap-2">
                    {deleteConfirmId === req.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteMutation.mutate(req.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Confirm delete"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(req.id)}
                        className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete request"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {pagination.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
            disabled={page >= pagination.total_pages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
