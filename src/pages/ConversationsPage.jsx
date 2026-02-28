import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, formatLabel } from '../lib/formatters'
import {
  MessageSquare,
  Bot,
  Headset,
  Globe,
  Smartphone,
  Ticket,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
} from 'lucide-react'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-stone-100 text-stone-600',
  escalated: 'bg-red-100 text-red-700',
}

const CHANNEL_OPTIONS = ['WhatsApp', 'Web']
const MODE_OPTIONS = ['ai', 'human']
const STATUS_OPTIONS = ['active', 'closed', 'escalated']
const AGENT_OPTIONS = ['Agent Dewi', 'Agent Budi']

export default function ConversationsPage() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [ticketCounts, setTicketCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sort state — default: started_at descending
  const [sortField, setSortField] = useState('started_at')
  const [sortAsc, setSortAsc] = useState(false)

  // Filter state
  const [search, setSearch] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [filterMode, setFilterMode] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterAgent, setFilterAgent] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const { data: convData, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .order('started_at', { ascending: false })

      if (convErr) throw convErr
      setConversations(convData || [])

      // Fetch ticket counts per conversation
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('conversation_id, status')

      if (ticketsData) {
        const counts = {}
        for (const t of ticketsData) {
          if (!t.conversation_id) continue
          if (!counts[t.conversation_id]) counts[t.conversation_id] = { open: 0, resolved: 0, total: 0 }
          counts[t.conversation_id].total++
          if (t.status === 'open' || t.status === 'in_progress') counts[t.conversation_id].open++
          else counts[t.conversation_id].resolved++
        }
        setTicketCounts(counts)
      }
    } catch (err) {
      console.error('Conversations fetch error:', err)
      setError(err.message || 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  // Filter + sort
  const filtered = useMemo(() => {
    let list = conversations

    // Text search on customer email
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => (c.customer_email || '').toLowerCase().includes(q))
    }

    // Dropdown filters
    if (filterChannel) list = list.filter((c) => c.channel === filterChannel)
    if (filterMode) list = list.filter((c) => c.mode === filterMode)
    if (filterStatus) list = list.filter((c) => c.status === filterStatus)
    if (filterAgent) {
      if (filterAgent === '__none__') {
        list = list.filter((c) => !c.assigned_agent)
      } else {
        list = list.filter((c) => c.assigned_agent === filterAgent)
      }
    }

    // Sort
    list = [...list].sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]

      // Handle nulls — push them to the end
      if (valA == null && valB == null) return 0
      if (valA == null) return 1
      if (valB == null) return -1

      // Date fields
      if (sortField === 'started_at' || sortField === 'ended_at') {
        valA = new Date(valA).getTime()
        valB = new Date(valB).getTime()
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = (valB || '').toLowerCase()
      }

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })

    return list
  }, [conversations, search, filterChannel, filterMode, filterStatus, filterAgent, sortField, sortAsc])

  function handleSort(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(field === 'customer_email' || field === 'channel') // text fields default asc
    }
  }

  const hasActiveFilters = search || filterChannel || filterMode || filterStatus || filterAgent

  function clearFilters() {
    setSearch('')
    setFilterChannel('')
    setFilterMode('')
    setFilterStatus('')
    setFilterAgent('')
  }

  // Sort icon helper
  function SortIcon({ field }) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-stone-300" />
    return sortAsc
      ? <ArrowUp className="w-3 h-3 text-nusa-orange" />
      : <ArrowDown className="w-3 h-3 text-nusa-orange" />
  }

  function SortHeader({ field, children }) {
    return (
      <th className="text-left py-3 px-3 text-stone-500 font-medium">
        <button
          onClick={() => handleSort(field)}
          className="flex items-center gap-1 hover:text-stone-700 transition-colors"
        >
          {children}
          <SortIcon field={field} />
        </button>
      </th>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-nusa-orange" />
        <h2 className="text-xl font-bold text-dark-gray">Conversations</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari customer..."
            className="pl-8 pr-3 py-1.5 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-nusa-orange/30 w-48"
          />
        </div>

        {/* Channel filter */}
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-nusa-orange/30"
        >
          <option value="">Semua Channel</option>
          {CHANNEL_OPTIONS.map((ch) => (
            <option key={ch} value={ch}>{ch}</option>
          ))}
        </select>

        {/* Mode filter */}
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-nusa-orange/30"
        >
          <option value="">Semua Mode</option>
          {MODE_OPTIONS.map((m) => (
            <option key={m} value={m}>{m === 'ai' ? 'AI' : 'Human'}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-nusa-orange/30"
        >
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{formatLabel(s)}</option>
          ))}
        </select>

        {/* Agent filter */}
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-nusa-orange/30"
        >
          <option value="">Semua Agent</option>
          {AGENT_OPTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
          <option value="__none__">Belum ditugaskan</option>
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" /> Reset filter
          </button>
        )}

        {/* Result count */}
        {!loading && (
          <span className="text-xs text-stone-400 ml-auto">
            {filtered.length} dari {conversations.length} percakapan
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-stone-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Memuat percakapan...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <p className="text-lg font-medium">
              {hasActiveFilters ? 'Tidak ada hasil yang cocok' : 'No conversations found'}
            </p>
            <p className="text-sm mt-1">
              {hasActiveFilters
                ? 'Coba ubah filter atau kata kunci pencarian'
                : 'Conversations will appear here when customers interact'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <SortHeader field="customer_email">Customer</SortHeader>
                  <SortHeader field="channel">Channel</SortHeader>
                  <SortHeader field="mode">Mode</SortHeader>
                  <SortHeader field="status">Status</SortHeader>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Tickets</th>
                  <SortHeader field="assigned_agent">Agent</SortHeader>
                  <SortHeader field="started_at">Started</SortHeader>
                  <SortHeader field="ended_at">Ended</SortHeader>
                </tr>
              </thead>
              <tbody>
                {filtered.map((conv) => {
                  const tc = ticketCounts[conv.id]
                  const isHuman = conv.mode === 'human'

                  return (
                    <tr
                      key={conv.id}
                      onClick={() => navigate(`/admin/conversations/${conv.id}`)}
                      className="border-b border-stone-50 hover:bg-nusa-orange-light/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-dark-gray">
                        {conv.customer_email}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-xs text-stone-600">
                          {conv.channel === 'WhatsApp' ? (
                            <><Smartphone className="w-3 h-3 text-fresh-green" /> WhatsApp</>
                          ) : (
                            <><Globe className="w-3 h-3 text-tech-blue" /> Web</>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isHuman ? 'bg-green-100 text-green-700' : 'bg-sky-100 text-sky-700'
                        }`}>
                          {isHuman ? <><Headset className="w-3 h-3" /> Human</> : <><Bot className="w-3 h-3" /> AI</>}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[conv.status] || 'bg-stone-100 text-stone-600'
                        }`}>
                          {formatLabel(conv.status)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {tc ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <Ticket className="w-3 h-3 text-stone-400" />
                            {tc.open > 0 && (
                              <span className="text-red-600 font-semibold">{tc.open} open</span>
                            )}
                            {tc.open > 0 && tc.resolved > 0 && <span className="text-stone-300">/</span>}
                            {tc.resolved > 0 && (
                              <span className="text-green-600">{tc.resolved} resolved</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-stone-600 text-xs">
                        {conv.assigned_agent || '—'}
                      </td>
                      <td className="py-3 px-3 text-stone-400 text-xs whitespace-nowrap">
                        {formatDate(conv.started_at)}
                      </td>
                      <td className="py-3 px-3 text-stone-400 text-xs whitespace-nowrap">
                        {formatDate(conv.ended_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
