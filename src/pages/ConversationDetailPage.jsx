import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, formatLabel } from '../lib/formatters'
import ChatHistory from '../components/shared/ChatHistory'
import ReplyInput from '../components/shared/ReplyInput'
import ConversationModeActions from '../components/shared/ConversationModeActions'
import CreateTicketModal from '../components/shared/CreateTicketModal'
import Toast from '../components/ui/Toast'
import {
  ArrowLeft,
  Loader2,
  Globe,
  Smartphone,
  Bot,
  Headset,
  Ticket,
  Plus,
} from 'lucide-react'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-stone-100 text-stone-600',
  escalated: 'bg-red-100 text-red-700',
}

const TICKET_STATUS_COLORS = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-stone-100 text-stone-600',
}

const PRIORITY_COLORS = {
  high: 'text-red-600',
  medium: 'text-amber-600',
  low: 'text-sky-600',
}

export default function ConversationDetailPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()

  const [conversation, setConversation] = useState(null)
  const [linkedTickets, setLinkedTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showCreateTicket, setShowCreateTicket] = useState(false)
  const chatHistoryRef = useRef(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch conversation
      const { data: convData, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convErr) throw convErr
      setConversation(convData)

      // Fetch linked tickets
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })

      setLinkedTickets(ticketsData || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setToast({ message: 'Gagal memuat percakapan', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleModeChange(updatedConv) {
    setConversation(updatedConv)
    setToast({
      message: updatedConv.mode === 'human' ? 'Anda mengambil alih percakapan' : 'Percakapan dikembalikan ke AI',
      type: 'success',
    })
  }

  function handleTicketCreated() {
    setToast({ message: 'Tiket berhasil dibuat', type: 'success' })
    fetchData() // Refresh linked tickets
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400 mr-2" />
        <span className="text-stone-400">Memuat percakapan...</span>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="text-center py-24 text-stone-400">
        <p className="text-lg font-semibold">Percakapan tidak ditemukan</p>
        <button onClick={() => navigate('/admin/conversations')} className="mt-4 text-nusa-orange text-sm font-medium">
          ← Kembali ke Conversations
        </button>
      </div>
    )
  }

  const isHumanMode = conversation.mode === 'human'

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Back button */}
      <button
        onClick={() => navigate('/admin/conversations')}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-nusa-orange mb-3 font-medium transition-colors self-start shrink-0"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Conversations
      </button>

      {/* Split layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
        {/* LEFT PANEL — Conversation Info (scrollable independently) */}
        <div className="lg:w-[40%] bg-white rounded-2xl border border-stone-200 p-5 overflow-y-auto space-y-5 shrink-0">
          {/* Customer info */}
          <div>
            <h2 className="text-lg font-bold text-dark-gray">{conversation.customer_email}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                STATUS_COLORS[conversation.status] || 'bg-stone-100 text-stone-600'
              }`}>
                {formatLabel(conversation.status)}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isHumanMode ? 'bg-green-100 text-green-700' : 'bg-sky-100 text-sky-700'
              }`}>
                {isHumanMode ? <><Headset className="w-3 h-3" /> Human</> : <><Bot className="w-3 h-3" /> AI</>}
              </span>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1">Channel</label>
              <div className="flex items-center gap-1.5 text-dark-gray">
                {conversation.channel === 'WhatsApp' ? (
                  <><Smartphone className="w-3.5 h-3.5 text-fresh-green" /> WhatsApp</>
                ) : (
                  <><Globe className="w-3.5 h-3.5 text-tech-blue" /> Web</>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1">Agent</label>
              <p className="text-dark-gray">{conversation.assigned_agent || '—'}</p>
            </div>
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1">Started</label>
              <p className="text-dark-gray text-xs">{formatDate(conversation.started_at)}</p>
            </div>
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1">Ended</label>
              <p className="text-dark-gray text-xs">{formatDate(conversation.ended_at)}</p>
            </div>
          </div>

          {/* Linked Tickets */}
          <div className="border-t border-stone-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-dark-gray flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-nusa-orange" />
                Linked Tickets
              </h3>
              <span className="text-xs text-stone-400">{linkedTickets.length}</span>
            </div>
            {linkedTickets.length === 0 ? (
              <p className="text-xs text-stone-400">Belum ada tiket terkait</p>
            ) : (
              <div className="space-y-2">
                {linkedTickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/admin/tickets/${t.id}`)}
                    className="w-full text-left bg-stone-50 hover:bg-nusa-orange-light/50 rounded-xl p-3 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-dark-gray group-hover:text-nusa-orange truncate">
                        {t.subject}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        TICKET_STATUS_COLORS[t.status] || 'bg-stone-100 text-stone-600'
                      }`}>
                        {formatLabel(t.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-400">
                      <span className={`font-semibold uppercase ${PRIORITY_COLORS[t.priority] || 'text-stone-400'}`}>
                        {t.priority}
                      </span>
                      <span>&middot;</span>
                      <span>{formatLabel(t.category)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-stone-200 pt-4 space-y-3">
            <h3 className="text-sm font-bold text-dark-gray">Actions</h3>
            <ConversationModeActions conversation={conversation} onModeChange={handleModeChange} />
            <button
              onClick={() => setShowCreateTicket(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Ticket
            </button>
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
            </div>
          </div>

          {/* Chat messages — scrollable */}
          <ChatHistory ref={chatHistoryRef} conversationId={conversationId} />

          {/* Reply input or take-over prompt */}
          {isHumanMode ? (
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
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateTicket && (
        <CreateTicketModal
          conversationId={conversationId}
          customerEmail={conversation.customer_email}
          onClose={() => setShowCreateTicket(false)}
          onTicketCreated={handleTicketCreated}
        />
      )}
    </div>
  )
}
