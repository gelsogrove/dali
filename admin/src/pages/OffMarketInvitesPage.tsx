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
  Link2,
  Plus,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  X,
  Shield,
} from 'lucide-react'

interface Invite {
  id: number
  property_id: number | null
  token: string
  access_code: string
  client_name: string | null
  client_email: string | null
  expires_at: string
  is_expired: boolean
  created_at: string
  invite_link: string
  property_title: string | null
  property_slug: string | null
  property_image: string | null
}

export default function OffMarketInvitesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [revealedCodes, setRevealedCodes] = useState<Record<number, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    client_name: '',
    client_email: '',
  })
  const [newInvite, setNewInvite] = useState<any>(null)

  // Fetch invites
  const { data, isLoading } = useQuery({
    queryKey: ['off-market-invites', page],
    queryFn: async () => {
      const res = await api.get(`/off-market-invites?page=${page}&per_page=20`)
      return res.data
    },
  })

  // Create invite
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/off-market-invites', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['off-market-invites'] })
      setNewInvite(response.data.data)
      setCreateForm({ client_name: '', client_email: '' })
    },
  })

  // Regenerate
  const regenerateMutation = useMutation({
    mutationFn: (id: number) => api.post(`/off-market-invites/${id}/regenerate`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['off-market-invites'] })
      setRevealedCodes(prev => ({ ...prev, [id]: true }))
    },
  })

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/off-market-invites/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['off-market-invites'] })
      setDeleteConfirmId(null)
    },
  })

  const toggleRevealCode = (id: number) => {
    setRevealedCodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(key)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    if (diff <= 0) return null
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const invites = data?.data?.invites || []
  const pagination = data?.data?.pagination || { page: 1, total_pages: 1, total: 0 }
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      property_id: null,
      client_name: createForm.client_name,
      client_email: createForm.client_email,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Off Market Invites</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage private access invites for off-market properties
          </p>
        </div>
        <Button
          onClick={() => { setShowCreateForm(true); setNewInvite(null) }}
          className="bg-gray-900 hover:bg-gray-800 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Invite
        </Button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-violet-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {newInvite ? 'Invite Created!' : 'Create New Invite'}
                </h2>
              </div>
              <button onClick={() => { setShowCreateForm(false); setNewInvite(null) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!newInvite ? (
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-100">
                  <p className="font-semibold text-gray-900">Scope: Entire Off-Market Collection</p>
                  <p className="text-xs text-gray-500 mt-1">This invite unlocks all off-market listings (no property selection needed).</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Name</label>
                    <input
                      type="text"
                      value={createForm.client_name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, client_name: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Email</label>
                    <input
                      type="email"
                      value={createForm.client_email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, client_email: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                  <p>An invite link and 6-character access code will be generated. The invite expires after <strong>7 days</strong>.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                    Generate Invite
                  </Button>
                </div>
              </form>
            ) : (
              /* Success: Show generated invite details */
              <div className="p-6 space-y-5">
                {(() => {
                  const createdTitle = newInvite.property_title || 'Off-Market Collection'
                  return (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-800 font-medium">Invite created for "{createdTitle}"</p>
                </div>
                )})()}

                {/* Invite Link */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Invite Link</label>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <code className="flex-1 text-sm text-violet-700 break-all">{newInvite.invite_link}</code>
                    <button
                      onClick={() => copyToClipboard(newInvite.invite_link, 'new-link')}
                      className="flex-shrink-0 p-2 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                      {copiedField === 'new-link' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Access Code */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Access Code</label>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <code className="flex-1 text-2xl font-bold tracking-[0.3em] text-center text-gray-800">{newInvite.access_code}</code>
                    <button
                      onClick={() => copyToClipboard(newInvite.access_code, 'new-code')}
                      className="flex-shrink-0 p-2 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                      {copiedField === 'new-code' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  Expires: {formatDate(newInvite.expires_at)}
                </div>

                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => { setShowCreateForm(false); setNewInvite(null) }}
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && invites.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No invites yet</h3>
          <p className="text-sm text-gray-400 mt-1">
            Create an invite to share the private off-market collection with a client
          </p>
        </div>
      )}

      {/* Invites list */}
      {!isLoading && invites.length > 0 && (
        <div className="space-y-4">
          {invites.map((inv: Invite) => {
            const displayTitle = inv.property_title || 'Off-Market Collection'
            return (
            <div
              key={inv.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all ${
                inv.is_expired ? 'border-gray-200 opacity-75' : 'border-violet-200 shadow-sm'
              }`}
            >
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                  {/* Property & Client Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                        inv.is_expired
                          ? 'bg-red-50 text-red-600'
                          : 'bg-green-50 text-green-600'
                      }`}>
                        {inv.is_expired ? (
                          <><AlertCircle className="h-3 w-3" /> Expired</>
                        ) : (
                          <><CheckCircle2 className="h-3 w-3" /> Active</>
                        )}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(inv.created_at)}</span>
                    </div>

                    {/* Property / Scope */}
                    <h3 className="font-semibold text-gray-900 mb-2 truncate">{displayTitle}</h3>

                    {/* Client */}
                    {(inv.client_name || inv.client_email) && (
                      <div className="text-sm text-gray-500 mb-3">
                        {inv.client_name && <span className="font-medium text-gray-700">{inv.client_name}</span>}
                        {inv.client_name && inv.client_email && <span className="mx-1">·</span>}
                        {inv.client_email && <a href={`mailto:${inv.client_email}`} className="hover:text-violet-600">{inv.client_email}</a>}
                      </div>
                    )}

                    {/* Invite Link */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                      <Link2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <code className="text-violet-600 truncate flex-1">{inv.invite_link}</code>
                      <button
                        onClick={() => copyToClipboard(inv.invite_link, `link-${inv.id}`)}
                        className="p-1 rounded hover:bg-gray-200 text-gray-400 transition-colors flex-shrink-0"
                        title="Copy link"
                      >
                        {copiedField === `link-${inv.id}` ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <a href={inv.invite_link} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-gray-200 text-gray-400 transition-colors flex-shrink-0" title="Open link">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Code + Expiry */}
                  <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Access Code</h4>

                      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-2.5 mb-3">
                        <code className="font-mono text-lg font-bold tracking-widest text-gray-800">
                          {revealedCodes[inv.id] ? inv.access_code : '••••••'}
                        </code>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleRevealCode(inv.id)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {revealedCodes[inv.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(inv.access_code, `code-${inv.id}`)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {copiedField === `code-${inv.id}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {inv.is_expired ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium">
                            <AlertCircle className="h-3.5 w-3.5" /> Expired
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-violet-300 text-violet-700 hover:bg-violet-50"
                            onClick={() => regenerateMutation.mutate(inv.id)}
                            disabled={regenerateMutation.isPending}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                            Regenerate (7 days)
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Active
                          </div>
                          {inv.expires_at && (
                            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                              <Clock className="h-3 w-3" />
                              {getTimeRemaining(inv.expires_at) || 'Expiring soon'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <div className="lg:w-10 flex lg:flex-col items-center gap-2">
                    {deleteConfirmId === inv.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteMutation.mutate(inv.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Confirm">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteConfirmId(null)} className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors" title="Cancel">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(inv.id)} className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.total_pages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))} disabled={page >= pagination.total_pages}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
