import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, formatLabel } from '../lib/formatters'
import ChatHistory from '../components/shared/ChatHistory'
import ReplyInput from '../components/shared/ReplyInput'
import ConversationModeActions from '../components/shared/ConversationModeActions'
import Toast from '../components/ui/Toast'
import {
  ArrowLeft,
  Loader2,
  Globe,
  Smartphone,
  Bot,
  Headset,
  CheckCircle,
} from 'lucide-react'

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-stone-100 text-stone-600',
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-sky-100 text-sky-700',
}

const CATEGORY_COLORS = {
  product_defect: 'bg-red-100 text-red-700',
  wrong_item: 'bg-orange-100 text-orange-700',
  shipping_delay: 'bg-yellow-100 text-yellow-700',
  payment_issue: 'bg-purple-100 text-purple-700',
  return_request: 'bg-pink-100 text-pink-700',
  general_inquiry: 'bg-sky-100 text-sky-700',
  other: 'bg-stone-100 text-stone-600',
}

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed']

function Badge({ value, colorMap }) {
  const classes = colorMap[value] || 'bg-stone-100 text-stone-600'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {formatLabel(value)}
    </span>
  )
}

export default function TicketDetailPage() {
  const { ticketId } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const chatHistoryRef = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch ticket
      const { data: ticketData, error: ticketErr } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single()

      if (ticketErr) throw ticketErr
      setTicket(ticketData)

      // Fetch linked conversation if exists
      if (ticketData.conversation_id) {
        const { data: convData } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', ticketData.conversation_id)
          .single()

        setConversation(convData || null)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setToast({ message: 'Gagal memuat tiket', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleStatusChange(newStatus) {
    const updates = { status: newStatus }
    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    }

    const { error } = await supabase.from('tickets').update(updates).eq('id', ticketId)
    if (error) {
      setToast({ message: 'Gagal mengubah status', type: 'error' })
    } else {
      setTicket((prev) => ({ ...prev, ...updates }))
      setToast({ message: `Status diubah ke ${formatLabel(newStatus)}`, type: 'success' })
    }
  }

  async function handleAssignedChange(value) {
    const { error } = await supabase.from('tickets').update({ assigned_to: value || null }).eq('id', ticketId)
    if (error) {
      setToast({ message: 'Gagal mengubah assigned to', type: 'error' })
    } else {
      setTicket((prev) => ({ ...prev, assigned_to: value || null }))
    }
  }

  async function handleResolveTicket() {
    const updates = {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    }

    const { error: ticketErr } = await supabase.from('tickets').update(updates).eq('id', ticketId)
    if (ticketErr) {
      setToast({ message: 'Gagal resolve tiket', type: 'error' })
      return
    }

    // Also return conversation to AI
    if (conversation) {
      await supabase
        .from('conversations')
        .update({ mode: 'ai', assigned_agent: null })
        .eq('id', conversation.id)

      setConversation((prev) => prev ? { ...prev, mode: 'ai', assigned_agent: null } : null)
    }

    setTicket((prev) => ({ ...prev, ...updates }))
    setToast({ message: 'Tiket resolved & AI aktif kembali', type: 'success' })
  }

  function handleModeChange(updatedConv) {
    setConversation(updatedConv)
    setToast({
      message: updatedConv.mode === 'human' ? 'Anda mengambil alih percakapan' : 'Percakapan dikembalikan ke AI',
      type: 'success',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400 mr-2" />
        <span className="text-stone-400">Memuat tiket...</span>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-24 text-stone-400">
        <p className="text-lg font-semibold">Tiket tidak ditemukan</p>
        <button onClick={() => navigate('/admin/tickets')} className="mt-4 text-nusa-orange text-sm font-medium">
          ← Kembali ke Tickets
        </button>
      </div>
    )
  }

  const isHumanMode = conversation?.mode === 'human'

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Back button */}
      <button
        onClick={() => navigate('/admin/tickets')}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-nusa-orange mb-3 font-medium transition-colors self-start shrink-0"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Tickets
      </button>

      {/* Split layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
        {/* LEFT PANEL — Ticket Info (scrollable independently) */}
        <div className="lg:w-[40%] bg-white rounded-2xl border border-stone-200 p-5 overflow-y-auto space-y-5 shrink-0">
          {/* Subject */}
          <div>
            <h2 className="text-lg font-bold text-dark-gray">{ticket.subject}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge value={ticket.category} colorMap={CATEGORY_COLORS} />
              <Badge value={ticket.priority} colorMap={PRIORITY_COLORS} />
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1">Status</label>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nusa-orange/30"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{formatLabel(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1">Assigned To</label>
              <input
                type="text"
                value={ticket.assigned_to || ''}
                onChange={(e) => handleAssignedChange(e.target.value)}
                placeholder="—"
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nusa-orange/30"
              />
            </div>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1">Customer</label>
              <p className="text-dark-gray">{ticket.customer_email}</p>
            </div>
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1">Channel</label>
              <div className="flex items-center gap-1.5 text-dark-gray">
                {conversation?.channel === 'WhatsApp' ? (
                  <><Smartphone className="w-3.5 h-3.5 text-fresh-green" /> WhatsApp</>
                ) : (
                  <><Globe className="w-3.5 h-3.5 text-tech-blue" /> Web</>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1">Created</label>
              <p className="text-dark-gray text-xs">{formatDate(ticket.created_at)}</p>
            </div>
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1">Resolved</label>
              <p className="text-dark-gray text-xs">{formatDate(ticket.resolved_at)}</p>
            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1.5">Description</label>
              <p className="text-sm text-stone-600 bg-stone-50 rounded-xl p-3 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          )}

          {/* Conversation mode info */}
          {conversation && (
            <div className="border-t border-stone-200 pt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  {isHumanMode ? (
                    <><Headset className="w-4 h-4 text-fresh-green" /> <span className="font-medium text-fresh-green">Human Mode</span></>
                  ) : (
                    <><Bot className="w-4 h-4 text-tech-blue" /> <span className="font-medium text-tech-blue">AI Mode</span></>
                  )}
                </div>
                {conversation.assigned_agent && (
                  <span className="text-xs text-stone-400">Agent: {conversation.assigned_agent}</span>
                )}
              </div>
              <ConversationModeActions conversation={conversation} onModeChange={handleModeChange} />
            </div>
          )}

          {/* Action buttons */}
          <div className="border-t border-stone-200 pt-4 flex flex-wrap gap-2">
            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
              <button
                onClick={handleResolveTicket}
                className="inline-flex items-center gap-2 px-4 py-2 bg-fresh-green hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Resolve Ticket
              </button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Chat + Reply */}
        <div className="lg:w-[60%] bg-white rounded-2xl border border-stone-200 flex flex-col min-h-0 overflow-hidden">
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-stone-200 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-dark-gray flex items-center gap-2">
                💬 Conversation History
              </h3>
              {conversation && (
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  {conversation.channel === 'WhatsApp' ? (
                    <><Smartphone className="w-3 h-3" /> WhatsApp</>
                  ) : (
                    <><Globe className="w-3 h-3" /> Web</>
                  )}
                  <span>&middot;</span>
                  {isHumanMode ? (
                    <span className="text-fresh-green font-medium">🧑 Human</span>
                  ) : (
                    <span className="text-tech-blue font-medium">🤖 AI</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat messages — scrollable */}
          <ChatHistory ref={chatHistoryRef} conversationId={ticket.conversation_id} />

          {/* Reply input or take-over prompt */}
          {conversation && (
            isHumanMode ? (
              <ReplyInput
                conversationId={conversation.id}
                channel={conversation.channel}
                onOptimisticSend={(msg) => chatHistoryRef.current?.appendMessage(msg)}
              />
            ) : (
              <div className="border-t border-stone-200 p-4 bg-stone-50 text-center shrink-0">
                <p className="text-xs text-stone-400 mb-2">
                  Percakapan sedang ditangani oleh AI. Klik "Take Over" untuk membalas secara manual.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
