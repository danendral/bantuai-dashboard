import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, MessageCircle, X, Send, Loader2, RotateCcw } from 'lucide-react'

const CHAT_WEBHOOK_URL = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL

function generateSessionId() {
  return crypto.randomUUID()
}

function ChatBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0 mt-1">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
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
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 shrink-0 mt-1">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => generateSessionId())
  const [error, setError] = useState(null)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

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
          text: 'Halo! Selamat datang di GadgetNusa. Ada yang bisa saya bantu hari ini? Silakan tanya tentang produk, harga, atau layanan kami.',
        },
      ])
    }
  }, [isOpen, messages.length])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    setError(null)
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
          channel: 'web'
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
        text: 'Halo! Selamat datang di GadgetNusa. Ada yang bisa saya bantu hari ini? Silakan tanya tentang produk, harga, atau layanan kami.',
      },
    ])
    setError(null)
    // Note: sessionId stays the same within a page session.
    // A new session starts on page reload.
  }

  return (
    <div id="support" className="fixed bottom-6 right-6 z-50">
      {/* Chat panel */}
      {isOpen && (
        <div className="mb-3 w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-white" />
              <div>
                <span className="text-sm font-medium text-white">GadgetNusa Support</span>
                <span className="block text-[10px] text-white/60">Powered by BantuAI</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewChat}
                className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                title="New conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {messages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role} text={msg.text} />
            ))}
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
          <div className="border-t border-gray-200 p-3 shrink-0 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan Anda..."
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:bg-gray-50 max-h-[80px] overflow-y-auto"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0"
                title="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Tekan Enter untuk kirim, Shift+Enter untuk baris baru
            </p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary hover:bg-primary-dark text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ml-auto"
        title="Chat with us"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}
