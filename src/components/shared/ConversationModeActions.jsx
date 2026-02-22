import { useState } from 'react'
import { Headset, Bot, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const ADMIN_REPLY_URL = import.meta.env.VITE_N8N_ADMIN_REPLY_WEBHOOK_URL
const ADMIN_NAME = 'Admin'

export default function ConversationModeActions({ conversation, onModeChange }) {
  const [loading, setLoading] = useState(false)

  if (!conversation) return null

  const isHuman = conversation.mode === 'human'

  async function handleTakeOver() {
    setLoading(true)
    try {
      // 1. Update conversation in Supabase
      const { error } = await supabase
        .from('conversations')
        .update({ mode: 'human', assigned_agent: ADMIN_NAME })
        .eq('id', conversation.id)

      if (error) throw error

      // 2. Send system message via webhook
      try {
        await fetch(ADMIN_REPLY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation.id,
            message: `Agent ${ADMIN_NAME} telah bergabung dalam percakapan ini.`,
            agentName: ADMIN_NAME,
          }),
        })
      } catch {
        // Webhook failure is non-critical
      }

      if (onModeChange) onModeChange({ ...conversation, mode: 'human', assigned_agent: ADMIN_NAME })
    } catch (err) {
      console.error('Take over error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleReturnToAI() {
    setLoading(true)
    try {
      // 1. Update conversation in Supabase
      const { error } = await supabase
        .from('conversations')
        .update({ mode: 'ai', assigned_agent: null })
        .eq('id', conversation.id)

      if (error) throw error

      // 2. Send system message via webhook
      try {
        await fetch(ADMIN_REPLY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation.id,
            message: 'Percakapan dilanjutkan oleh AI assistant.',
            agentName: ADMIN_NAME,
          }),
        })
      } catch {
        // Webhook failure is non-critical
      }

      if (onModeChange) onModeChange({ ...conversation, mode: 'ai', assigned_agent: null })
    } catch (err) {
      console.error('Return to AI error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isHuman ? (
        <button
          onClick={handleReturnToAI}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          Return to AI
        </button>
      ) : (
        <button
          onClick={handleTakeOver}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-nusa-orange hover:bg-nusa-orange-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Headset className="w-4 h-4" />}
          Take Over
        </button>
      )}
    </div>
  )
}
