import { useEffect, useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { Loader2, Bot, User, Headset } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/formatters'

const POLL_INTERVAL = 5000

function ModeSwitch() {
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex-1 border-t border-dashed border-stone-300" />
      <span className="text-[10px] font-semibold text-stone-400 flex items-center gap-1">
        <Bot className="w-3 h-3" />→<Headset className="w-3 h-3" /> Switched to human agent
      </span>
      <div className="flex-1 border-t border-dashed border-stone-300" />
    </div>
  )
}

function ChatBubble({ message, showModeSwitch }) {
  const isCustomer = message.role === 'customer'
  const isAgent = message.role === 'agent'

  return (
    <>
      {showModeSwitch && <ModeSwitch />}
      <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
        {isCustomer && (
          <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center mr-2 shrink-0 mt-1">
            <User className="w-3.5 h-3.5 text-stone-500" />
          </div>
        )}
        <div
          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
            isCustomer
              ? 'bg-stone-100 text-dark-gray rounded-bl-sm'
              : isAgent
              ? 'bg-fresh-green text-white rounded-br-sm'
              : 'bg-tech-blue text-white rounded-br-sm'
          }`}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-semibold uppercase opacity-70">
              {message.role === 'assistant' ? 'AI' : message.role === 'agent' ? 'Admin' : 'Customer'}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          <p className={`text-[10px] mt-1 ${isCustomer ? 'text-stone-400' : 'text-white/60'}`}>
            {formatDate(message.created_at)}
          </p>
        </div>
        {!isCustomer && (
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ml-2 shrink-0 mt-1 ${
            isAgent ? 'bg-fresh-green/20' : 'bg-tech-blue/20'
          }`}>
            {isAgent ? (
              <Headset className={`w-3.5 h-3.5 text-fresh-green`} />
            ) : (
              <Bot className={`w-3.5 h-3.5 text-tech-blue`} />
            )}
          </div>
        )}
      </div>
    </>
  )
}

const ChatHistory = forwardRef(function ChatHistory({ conversationId }, ref) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)

  // Expose appendMessage to parent via ref
  useImperativeHandle(ref, () => ({
    appendMessage(msg) {
      setMessages((prev) => [...prev, msg])
    },
  }))

  const fetchMessages = useCallback(async (showLoader) => {
    if (!conversationId) return
    if (showLoader) setLoading(true)

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error) {
      setMessages(data)
    }
    if (showLoader) setLoading(false)
  }, [conversationId])

  // Initial fetch
  useEffect(() => {
    fetchMessages(true)
  }, [fetchMessages])

  // Polling for new messages
  useEffect(() => {
    if (!conversationId) return
    const interval = setInterval(() => fetchMessages(false), POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [conversationId, fetchMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 py-12">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Memuat percakapan...</span>
      </div>
    )
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 py-12">
        <p className="text-sm">Tidak ada percakapan terkait dengan tiket ini</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 py-12">
        <p className="text-sm">Belum ada pesan dalam percakapan ini</p>
      </div>
    )
  }

  // Detect mode switch points: first 'agent' message after a non-agent message
  const modeSwitchIndices = new Set()
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'agent') {
      if (i === 0 || messages[i - 1].role !== 'agent') {
        modeSwitchIndices.add(i)
      }
      break // only show the first switch
    }
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg, i) => (
        <ChatBubble
          key={msg.id || `optimistic-${i}`}
          message={msg}
          showModeSwitch={modeSwitchIndices.has(i)}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
})

export default ChatHistory
