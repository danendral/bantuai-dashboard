import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, RotateCcw, Zap, Headset } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const CHAT_WEBHOOK_URL = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: 'Halo! Selamat datang di GadgetNusa. Saya AI Assistant yang siap membantu Anda. Mau tanya soal produk, harga, atau stok? Silakan ketik atau pilih topik di bawah.',
}

function generateSessionId() {
  return crypto.randomUUID()
}

function ChatBubble({ role, text }) {
  const isUser = role === 'user'
  const isAgent = role === 'agent'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2 shrink-0 mt-1 ${
            isAgent ? 'bg-fresh-green/10' : 'bg-nusa-orange/10'
          }`}
        >
          {isAgent ? (
            <Headset className="w-3.5 h-3.5 text-fresh-green" />
          ) : (
            <Zap className="w-3.5 h-3.5 text-nusa-orange" />
          )}
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-nusa-orange text-white rounded-br-md'
            : isAgent
            ? 'bg-green-50 text-dark-gray border border-green-200 rounded-bl-md'
            : 'bg-stone-100 text-dark-gray rounded-bl-md'
        }`}
      >
        {text}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="w-7 h-7 rounded-lg bg-nusa-orange/10 flex items-center justify-center mr-2 shrink-0 mt-1">
        <Zap className="w-3.5 h-3.5 text-nusa-orange" />
      </div>
      <div className="bg-stone-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}

function QuickReplyButton({ text, onClick }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="inline-flex items-center px-3 py-1.5 bg-nusa-orange-light border border-nusa-orange/20 rounded-full text-xs font-medium text-nusa-orange-dark hover:bg-nusa-orange/10 transition-colors"
    >
      {text}
    </button>
  )
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(() => generateSessionId())
  const [error, setError] = useState(null)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [pendingMessage, setPendingMessage] = useState(null)

  // Polling state
  const [conversationStarted, setConversationStarted] = useState(false)
  const [agentConnected, setAgentConnected] = useState(false)
  const loadingRef = useRef(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const QUICK_REPLIES = [
    'Rekomendasi HP budget',
    'Laptop untuk kerja',
    'Earbuds terbaik',
    'Cek stok produk',
  ]

  // Keep loadingRef in sync with isLoading state
  useEffect(() => {
    loadingRef.current = isLoading
  }, [isLoading])

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([WELCOME_MESSAGE])
    }
  }, [isOpen, messages.length])

  // Process pending message after widget opens and is ready
  useEffect(() => {
    if (isOpen && pendingMessage && !isLoading && messages.length > 0) {
      const msg = pendingMessage
      setPendingMessage(null)
      doSendMessage(msg)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingMessage, isLoading, messages.length])

  // Listen for external events to open chat + optionally send a message
  useEffect(() => {
    function handleOpenChat(e) {
      setIsOpen(true)
      if (e.detail?.message) {
        setPendingMessage(e.detail.message)
      }
    }

    window.addEventListener('gadgetnusa:open-chat', handleOpenChat)
    return () => window.removeEventListener('gadgetnusa:open-chat', handleOpenChat)
  }, [])

  // ---- Poll Supabase for new messages (picks up admin agent replies) ----
  useEffect(() => {
    if (!conversationStarted || !isOpen) return

    let cancelled = false

    async function poll() {
      // Skip while a webhook request is in-flight so we don't overwrite the
      // optimistic user message before Supabase has stored it
      if (loadingRef.current) return

      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', sessionId)
        .order('created_at', { ascending: true })

      if (cancelled || !data || data.length === 0) return

      const mapped = data.map((m) => ({
        id: m.id,
        role: m.role,
        text: m.content,
      }))

      // Prepend the welcome message so it always appears first
      setMessages([WELCOME_MESSAGE, ...mapped])

      // Detect agent takeover
      if (data.some((m) => m.role === 'agent')) {
        setAgentConnected(true)
      }
    }

    // First poll immediately, then every 5 seconds
    poll()
    const interval = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [conversationStarted, isOpen, sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function doSendMessage(messageText) {
    const trimmed = messageText.trim()
    if (!trimmed || isLoading) return

    setError(null)
    setShowQuickReplies(false)
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch(CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
          channel: 'web',
        }),
      })

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }

      const data = await res.json()

      const reply =
        data.response ||
        data.output ||
        data.text ||
        data.message ||
        (typeof data === 'string' ? data : JSON.stringify(data))

      setMessages((prev) => [...prev, { role: 'assistant', text: reply }])

      // Mark conversation as started — polling begins on next render
      if (!conversationStarted) setConversationStarted(true)
    } catch (err) {
      console.error('Chat error:', err)
      setError('Maaf, terjadi kesalahan. Silakan coba lagi.')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi dalam beberapa saat.',
        },
      ])
      // Still start polling even on error — the user message may have been stored
      if (!conversationStarted) setConversationStarted(true)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSend() {
    if (input.trim()) {
      doSendMessage(input)
    }
  }

  function handleQuickReply(text) {
    doSendMessage(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = () => {
    setSessionId(generateSessionId())
    setConversationStarted(false)
    setAgentConnected(false)
    setMessages([WELCOME_MESSAGE])
    setError(null)
    setShowQuickReplies(true)
  }

  return (
    <div id="support" className="fixed bottom-6 right-6 z-50">
      {/* Chat panel */}
      {isOpen && (
        <div className="mb-3 w-[380px] sm:w-[420px] h-[560px] bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-fade-in">
          {/* Header — switches icon + label when an agent takes over */}
          <div className="bg-nusa-dark px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-nusa-orange rounded-lg flex items-center justify-center">
                {agentConnected ? (
                  <Headset className="w-4 h-4 text-white" />
                ) : (
                  <Zap className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <span className="text-sm font-bold text-white">GadgetNusa</span>
                <span className="flex items-center gap-1.5 text-[10px] text-stone-500">
                  <span className="w-1.5 h-1.5 bg-fresh-green rounded-full" />
                  {agentConnected ? 'Live Agent \u00b7 Online' : 'AI Assistant \u00b7 Online'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={handleNewChat}
                className="text-stone-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Percakapan baru"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-stone-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-warm-gray/50">
            {messages.map((msg, i) => {
              // Show agent-connected banner right before the first agent message
              const isFirstAgent =
                msg.role === 'agent' &&
                !messages.slice(0, i).some((m) => m.role === 'agent')

              return (
                <div key={msg.id || `msg-${i}`}>
                  {isFirstAgent && (
                    <div className="flex justify-center py-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-[11px] text-green-700 font-medium">
                        <Headset className="w-3 h-3" />
                        Anda sekarang terhubung dengan agent kami
                      </span>
                    </div>
                  )}
                  <ChatBubble role={msg.role} text={msg.text} />
                </div>
              )
            })}

            {/* Quick replies */}
            {showQuickReplies && messages.length <= 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_REPLIES.map((text) => (
                  <QuickReplyButton key={text} text={text} onClick={handleQuickReply} />
                ))}
              </div>
            )}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Error bar */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-stone-200 p-3 shrink-0 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan..."
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nusa-orange/30 focus:border-nusa-orange disabled:opacity-50 disabled:bg-stone-50 max-h-[80px] overflow-y-auto"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-nusa-orange hover:bg-nusa-orange-dark disabled:opacity-40 disabled:cursor-not-allowed text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0"
                title="Kirim pesan"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-stone-400 mt-1.5 text-center">
              Enter untuk kirim &middot; Shift+Enter baris baru
            </p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-nusa-orange hover:bg-nusa-orange-dark text-white w-14 h-14 rounded-full shadow-lg shadow-nusa-orange/25 flex items-center justify-center transition-all duration-200 ml-auto hover:scale-105"
        title="Chat dengan kami"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}
