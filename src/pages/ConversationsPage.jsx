import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ConversationsTable from '../components/conversations/ConversationsTable'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchConversations()
  }, [])

  async function fetchConversations() {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .order('started_at', { ascending: false })

      if (fetchError) throw fetchError
      setConversations(data || [])
    } catch (err) {
      console.error('Conversations fetch error:', err)
      setError(err.message || 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Conversations</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <ConversationsTable conversations={conversations} loading={loading} />
      </div>
    </div>
  )
}
