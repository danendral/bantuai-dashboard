import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Loader2, RotateCcw, Zap } from 'lucide-react'

const CHAT_WEBHOOK_URL = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL

function generateSessionId() {
  return crypto.randomUUID()
}

function ChatBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-nusa-orange/10 flex items-center justify-center mr-2 shrink-0 mt-1">
          <Zap className="w-3.5 h-3.5 text-nusa-orange" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-nusa-orange text-white rounded-br-md'
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
  const [sessionId] = useState(() => generateSessionId())
  const [error, setError] = useState(null)
  const [showQuickReplies, setShowQuickReplies] = useState(true)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const QUICK_REPLIES = [
    'Rekomendasi HP budget',
    'Laptop untuk kerja',
    'Earbuds terbaik',
    'Cek stok produk',
  ]

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
      setMessages([
        {
          role: 'assistant',
          text: 'Halo! Selamat datang di GadgetNusa. Saya AI Assistant yang siap membantu Anda. Mau tanya soal produk, harga, atau stok? Silakan ketik atau pilih topik di bawah.',
        },
      ])
    }
  }, [isOpen, messages.length])

  // Listen for external events to open chat + send product inquiry
  useEffect(() => {
    function handleOpenChat(e) {
      setIsOpen(true)
      // If a message is provided, auto-send it
      if (e.detail?.message) {
        // Small delay to let widget open and render first
        setTimeout(() => {
          sendMessage(e.detail.message)
        }, 300)
      }
    }

    window.addEventListener('gadgetnusa:open-chat', handleOpenChat)
    return () => window.removeEventListener('gadgetnusa:open-chat', handleOpenChat)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, sessionId]) // re-register when dependencies change

  const sendMessage = async (messageText) => {
    const trimmed = (messageText || input).trim()
    if (!trimmed || isLoading) return

    setError(null)
    setShowQuickReplies(false)
    const userMessage = { role: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMessage])
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

      // Handle different response shapes from n8n
      const reply =
        data.response ||
        data.output ||
        data.text ||
        data.message ||
        (typeof data === 'string' ? data : JSON.stringify(data))

      setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: 'Halo! Selamat datang di GadgetNusa. Saya AI Assistant yang siap membantu Anda. Mau tanya soal produk, harga, atau stok? Silakan ketik atau pilih topik di bawah.',
      },
    ])
    setError(null)
    setShowQuickReplies(true)
  }

  return (
    <div id="support" className="fixed bottom-6 right-6 z-50">
      {/* Chat panel */}
      {isOpen && (
        <div className="mb-3 w-[380px] sm:w-[420px] h-[560px] bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-fade-in">
          {/* Header */}
          <div className="bg-nusa-dark px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-nusa-orange rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">GadgetNusa</span>
                <span className="flex items-center gap-1.5 text-[10px] text-stone-500">
                  <span className="w-1.5 h-1.5 bg-fresh-green rounded-full" />
                  AI Assistant &middot; Online
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
            {messages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} text={msg.text} />
            ))}

            {/* Quick replies */}
            {showQuickReplies && messages.length <= 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_REPLIES.map((text) => (
                  <QuickReplyButton key={text} text={text} onClick={sendMessage} />
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
                onClick={() => sendMessage()}
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
