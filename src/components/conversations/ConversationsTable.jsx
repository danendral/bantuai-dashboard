import { formatDate, formatLabel } from '../../lib/formatters'
import { Check, X as XIcon, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import ChatBubble from './ChatBubble'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
  escalated: 'bg-red-100 text-red-700',
}

export default function ConversationsTable({ conversations, loading }) {
  const [expandedId, setExpandedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  async function toggleExpand(conversationId) {
    if (expandedId === conversationId) {
      setExpandedId(null)
      return
    }

    setExpandedId(conversationId)
    setLoadingMessages(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setLoadingMessages(false)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg font-medium">No conversations found</p>
        <p className="text-sm mt-1">Conversations will appear here when customers interact</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="w-8"></th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Customer Email</th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Channel</th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Status</th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Started At</th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Ended At</th>
            <th className="text-center py-3 px-3 text-gray-500 font-medium">Resolved</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((conv) => (
            <>
              <tr
                key={conv.id}
                onClick={() => toggleExpand(conv.id)}
                className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors"
              >
                <td className="py-3 px-2 text-gray-400">
                  {expandedId === conv.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </td>
                <td className="py-3 px-3 font-medium text-gray-900">
                  {conv.customer_email}
                </td>
                <td className="py-3 px-3">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                    {conv.channel}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[conv.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {formatLabel(conv.status)}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">
                  {formatDate(conv.started_at)}
                </td>
                <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">
                  {formatDate(conv.ended_at)}
                </td>
                <td className="py-3 px-3 text-center">
                  {conv.resolved ? (
                    <Check className="w-4 h-4 text-green-500 inline" />
                  ) : (
                    <XIcon className="w-4 h-4 text-red-400 inline" />
                  )}
                </td>
              </tr>

              {/* Expanded messages row */}
              {expandedId === conv.id && (
                <tr key={`${conv.id}-messages`}>
                  <td colSpan={7} className="bg-gray-50 px-6 py-4">
                    {loadingMessages ? (
                      <div className="flex items-center gap-2 justify-center text-gray-400 py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">
                        No messages in this conversation
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {messages.map((msg) => (
                          <ChatBubble key={msg.id} message={msg} />
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
