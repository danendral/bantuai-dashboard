import { useState } from 'react'
import { Send, Loader2, Globe, Smartphone } from 'lucide-react'

const ADMIN_REPLY_URL = import.meta.env.VITE_N8N_ADMIN_REPLY_WEBHOOK_URL
const ADMIN_NAME = 'Admin'

export default function ReplyInput({ conversationId, channel, onMessageSent }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const channelLabel = channel === 'WhatsApp' ? 'WhatsApp' : 'Web chat'
  const ChannelIcon = channel === 'WhatsApp' ? Smartphone : Globe

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setError(null)
    setSending(true)

    try {
      if (!ADMIN_REPLY_URL) {
        throw new Error('VITE_N8N_ADMIN_REPLY_WEBHOOK_URL is not configured. Restart the dev server after adding it to .env')
      }

      console.log('Sending admin reply to:', ADMIN_REPLY_URL, { conversationId, message: trimmed })

      const res = await fetch(ADMIN_REPLY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: trimmed,
          agentName: ADMIN_NAME,
        }),
      })

      if (!res.ok) throw new Error(`Request failed with status ${res.status}`)

      setText('')
      if (onMessageSent) onMessageSent()
    } catch (err) {
      console.error('Reply error:', err)
      setError(err.message || 'Gagal mengirim pesan. Silakan coba lagi.')
    } finally {
      setSending(false)
    }
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
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik balasan..."
          rows={1}
          disabled={sending}
          className="flex-1 resize-none rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nusa-orange/30 focus:border-nusa-orange disabled:opacity-50 disabled:bg-stone-50 max-h-[80px] overflow-y-auto"
          style={{ minHeight: '40px' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="bg-fresh-green hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0"
          title="Kirim balasan"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-stone-400">
        <ChannelIcon className="w-3 h-3" />
        <span>Balasan akan dikirim ke: <strong className="text-stone-500">{channelLabel}</strong></span>
      </div>
    </div>
  )
}
