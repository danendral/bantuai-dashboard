import { useState, useRef, useEffect } from 'react'
import { Send, Globe, Smartphone } from 'lucide-react'

const ADMIN_REPLY_URL = import.meta.env.VITE_N8N_ADMIN_REPLY_WEBHOOK_URL
const ADMIN_NAME = 'Admin'

export default function ReplyInput({ conversationId, channel, onOptimisticSend }) {
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const channelLabel = channel === 'WhatsApp' ? 'WhatsApp' : 'Web chat'
  const ChannelIcon = channel === 'WhatsApp' ? Smartphone : Globe

  // Auto-clear error after 4 seconds
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 4000)
    return () => clearTimeout(t)
  }, [error])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return

    // Optimistically show the message in ChatHistory immediately
    if (onOptimisticSend) {
      onOptimisticSend({
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        role: 'agent',
        content: trimmed,
        created_at: new Date().toISOString(),
      })
    }

    // Clear input immediately
    setText('')
    inputRef.current?.focus()

    // Fire-and-forget: send to n8n in the background
    if (!ADMIN_REPLY_URL) {
      setError('Webhook URL belum dikonfigurasi')
      return
    }

    fetch(ADMIN_REPLY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        message: trimmed,
        agentName: ADMIN_NAME,
      }),
    })
      .then((res) => {
        if (!res.ok) setError('Gagal mengirim ke server')
      })
      .catch(() => {
        setError('Gagal mengirim ke server')
      })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-stone-200 p-3 bg-white shrink-0">
      {error && (
        <div className="mb-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
          {error}
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik balasan..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nusa-orange/30 focus:border-nusa-orange max-h-[80px] overflow-y-auto"
          style={{ minHeight: '40px' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-fresh-green hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0"
          title="Kirim balasan"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-stone-400">
        <ChannelIcon className="w-3 h-3" />
        <span>Balasan akan dikirim ke: <strong className="text-stone-500">{channelLabel}</strong></span>
      </div>
    </div>
  )
}
