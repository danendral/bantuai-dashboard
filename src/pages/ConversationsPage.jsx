import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, formatLabel } from '../lib/formatters'
import { MessageSquare, Bot, Headset, Globe, Smartphone, Ticket, Loader2 } from 'lucide-react'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-stone-100 text-stone-600',
  escalated: 'bg-red-100 text-red-700',
}

export default function ConversationsPage() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [ticketCounts, setTicketCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      // Fetch conversations
      const { data: convData, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .order('started_at', { ascending: false })

      if (convErr) throw convErr

      // Sort: escalated first, then human mode, then active, then closed
      const sorted = (convData || []).sort((a, b) => {
        const order = { escalated: 0, active: 1, closed: 2 }
        const oa = order[a.status] ?? 1
        const ob = order[b.status] ?? 1
        if (oa !== ob) return oa - ob
        if (a.mode === 'human' && b.mode !== 'human') return -1
        if (b.mode === 'human' && a.mode !== 'human') return 1
        return new Date(b.started_at) - new Date(a.started_at)
      })

      setConversations(sorted)

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

      <div className="bg-white rounded-xl border border-stone-200 p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-stone-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Memuat percakapan...
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <p className="text-lg font-medium">No conversations found</p>
            <p className="text-sm mt-1">Conversations will appear here when customers interact</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Customer</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Channel</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Mode</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Tickets</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Agent</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Started</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Ended</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conv) => {
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
