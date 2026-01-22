import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Save, Trash2 } from 'lucide-react'

type RedirectRule = {
  id: number
  urlOld: string
  urlNew: string
}

const normalize = (url: string) => {
  const trimmed = (url || '').trim().toLowerCase()
  if (!trimmed) return ''
  try {
    const parsed = new URL(trimmed, 'https://dummy.host')
    let path = parsed.pathname || '/'
    path = path.replace(/\/\/+/g, '/').replace(/\/+$/, '')
    if (path === '') path = '/'
    return path
  } catch {
    const path = trimmed.replace(/\/\/+/g, '/').replace(/\/+$/, '')
    return path === '' ? '/' : path
  }
}

const wouldCreateCycle = (rules: RedirectRule[], urlOld: string, urlNew: string, excludeId?: number) => {
  if (!urlNew) return false
  const graph: Record<string, string> = {}
  rules.forEach((r) => {
    if (excludeId && r.id === excludeId) return
    if (!r.urlNew) return
    graph[normalize(r.urlOld)] = normalize(r.urlNew)
  })
  graph[normalize(urlOld)] = normalize(urlNew)

  const start = normalize(urlOld)
  const visited: Record<string, boolean> = {}
  let current = start
  while (graph[current]) {
    current = graph[current]
    if (current === start) return true
    if (visited[current]) break
    visited[current] = true
  }
  return false
}

const validateRule = (urlOld: string, urlNew: string, rules: RedirectRule[], excludeId?: number) => {
  const o = normalize(urlOld)
  const n = normalize(urlNew)
  if (!o) throw new Error('urlOld is required')
  if (!n) throw new Error('urlNew is required')
  if (n && o === n) throw new Error('urlOld and urlNew cannot match')
  if (rules.some((r) => normalize(r.urlOld) === o && r.id !== excludeId)) {
    throw new Error('urlOld must be unique')
  }
  if (n && rules.some((r) => normalize(r.urlOld) === n && r.id !== excludeId)) {
    throw new Error('urlNew already exists as urlOld (double redirect)')
  }
  if (wouldCreateCycle(rules, o, n, excludeId)) {
    throw new Error('Rule would create a redirect loop')
  }
  return { urlOld: o, urlNew: n }
}

export default function RedirectsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['redirects'],
    queryFn: async () => {
      const res = await api.get('/redirects')
      return res.data.data?.redirects || []
    },
    refetchOnWindowFocus: false,
  })

  const [newRule, setNewRule] = useState({ urlOld: '', urlNew: '' })
  const [newInvalid, setNewInvalid] = useState({ old: false, neu: false })
  const [rowInvalid, setRowInvalid] = useState<Record<number, { old: boolean; neu: boolean }>>({})
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const rules: RedirectRule[] = useMemo(() => {
    const base = data || []
    if (!search.trim()) return base
    const term = search.trim().toLowerCase()
    return base.filter(
      (r: RedirectRule) => r.urlOld.toLowerCase().includes(term) || r.urlNew.toLowerCase().includes(term)
    )
  }, [data, search])

  const createMutation = useMutation({
    mutationFn: async (payload: { urlOld: string; urlNew: string }) => api.post('/redirects', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] })
      setNewRule({ urlOld: '', urlNew: '' })
      setNewInvalid({ old: false, neu: false })
      setError('')
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || 'Errore creazione redirect')
      setNewInvalid({ old: true, neu: true })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, urlOld, urlNew }: { id: number; urlOld: string; urlNew: string }) =>
      api.put(`/redirects/${id}`, { urlOld, urlNew }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redirects'] })
      setError('')
      setRowInvalid((prev) => {
        const next = { ...prev }
        delete next[0]
        return next
      })
    },
    onError: (err: any, variables) => {
      setError(err?.response?.data?.error || 'Errore salvataggio redirect')
      setRowInvalid((prev) => ({
        ...prev,
        [variables.id]: { old: true, neu: true },
      }))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/redirects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['redirects'] }),
  })

  const handleCreate = () => {
    try {
      const validated = validateRule(newRule.urlOld, newRule.urlNew, rules)
      createMutation.mutate(validated)
    } catch (e: any) {
      setError(e?.message || 'Validazione fallita')
      const msg = (e?.message || '').toLowerCase()
      setNewInvalid({
        old: msg.includes('old') || msg.includes('loop') || msg.includes('match'),
        neu: msg.includes('new') || msg.includes('loop') || msg.includes('match'),
      })
    }
  }

  const handleUpdate = (rule: RedirectRule) => {
    try {
      const validated = validateRule(rule.urlOld, rule.urlNew, rules, rule.id)
      updateMutation.mutate({ id: rule.id, ...validated })
    } catch (e: any) {
      setError(e?.message || 'Validazione fallita')
      const msg = (e?.message || '').toLowerCase()
      setRowInvalid((prev) => ({
        ...prev,
        [rule.id]: {
          old: msg.includes('old') || msg.includes('loop') || msg.includes('match'),
          neu: msg.includes('new') || msg.includes('loop') || msg.includes('match'),
        },
      }))
    }
  }

  const handleDelete = (id: number) => {
    if (!confirm('Delete this redirect?')) return
    deleteMutation.mutate(id)
  }

  const handleLocalChange = (id: number, field: 'urlOld' | 'urlNew', value: string) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    queryClient.setQueryData(['redirects'], updated)
    if (value.trim()) {
      setRowInvalid((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || {}), [field === 'urlOld' ? 'old' : 'neu']: false },
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Redirect</h1>
          <p className="text-muted-foreground text-sm">Manage 301 redirects with anti-loop checks.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>new redirect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">OLD *</label>
              <Input
                value={newRule.urlOld}
                onChange={(e) => {
                  const value = e.target.value
                  setNewRule((p) => ({ ...p, urlOld: value }))
                  if (value.trim()) {
                    setNewInvalid((p) => ({ ...p, old: false }))
                  }
                }}
                className={
                  newInvalid.old && !newRule.urlOld.trim()
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : ''
                }
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">NEW *</label>
              <Input
                value={newRule.urlNew}
                onChange={(e) => {
                  const value = e.target.value
                  setNewRule((p) => ({ ...p, urlNew: value }))
                  if (value.trim()) {
                    setNewInvalid((p) => ({ ...p, neu: false }))
                  }
                }}
                className={newInvalid.neu && !newRule.urlNew.trim() ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
            </div>
            <div className="pt-1">
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full md:w-auto">
                {createMutation.isPending ? 'Saving...' : 'Add redirect'}
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
   
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {!isLoading && rules.length === 0 && (
            <p className="text-sm text-muted-foreground">No redirects found.</p>
          )}
          {!isLoading && rules.length > 0 && (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs uppercase tracking-[2px] text-muted-foreground">OLD</label>
                      <Input
                        value={rule.urlOld}
                        onChange={(e) => handleLocalChange(rule.id, 'urlOld', e.target.value)}
                        className={
                          rowInvalid[rule.id]?.old && !rule.urlOld.trim()
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : ''
                        }
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs uppercase tracking-[2px] text-muted-foreground">NEW</label>
                      <Input
                        value={rule.urlNew}
                        onChange={(e) => handleLocalChange(rule.id, 'urlNew', e.target.value)}
                        className={
                          rowInvalid[rule.id]?.neu && !rule.urlNew.trim()
                            ? 'border-red-500 focus-visible:ring-red-500'
                            : ''
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end md:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdate(rule)}
                        disabled={updateMutation.isPending}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(rule.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
