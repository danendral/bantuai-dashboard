import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate, formatLabel } from '../../lib/formatters'

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
}

export default function TicketDetailModal({ ticket, onClose }) {
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  useEffect(() => {
    if (ticket?.conversation_id) {
      fetchMessages(ticket.conversation_id)
    }
  }, [ticket])

  async function fetchMessages(conversationId) {
    setLoadingMessages(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error) setMessages(data || [])
    setLoadingMessages(false)
  }

  if (!ticket) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="pr-8">
            <h3 className="text-lg font-semibold text-gray-900">{ticket.subject}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {formatLabel(ticket.status)}
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  PRIORITY_COLORS[ticket.priority] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {formatLabel(ticket.priority)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Customer:</span>
              <p className="text-gray-900">{ticket.customer_email}</p>
            </div>
            <div>
              <span className="text-gray-500">Assigned To:</span>
              <p className="text-gray-900">{ticket.assigned_to || '—'}</p>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <p className="text-gray-900">{formatDate(ticket.created_at)}</p>
            </div>
            <div>
              <span className="text-gray-500">Resolved:</span>
              <p className="text-gray-900">{formatDate(ticket.resolved_at)}</p>
            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          )}

          {/* Linked Messages */}
          {ticket.conversation_id && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Conversation Messages
              </h4>
              {loadingMessages ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <p className="text-gray-400 text-sm">No messages found</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg text-sm ${
                        msg.role === 'customer'
                          ? 'bg-gray-100 text-gray-800'
                          : msg.role === 'assistant'
                          ? 'bg-blue-50 text-blue-900'
                          : 'bg-emerald-50 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs capitalize">{msg.role}</span>
                        <span className="text-xs text-gray-400">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
