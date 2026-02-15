import { useState } from 'react'
import { DatabaseZap } from 'lucide-react'
import QueryInput from '../components/talkdb/QueryInput'
import ResponseCard from '../components/talkdb/ResponseCard'

export default function TalkToDBPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(query) {
    const entry = { id: Date.now(), question: query, answer: null, loading: true }
    setHistory((prev) => [entry, ...prev])
    setLoading(true)

    try {
      const res = await fetch('/api/talkdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!res.ok) throw new Error(`Request failed with status ${res.status}`)

      const data = await res.json()
      const answer = typeof data === 'string' ? data : data.output || data.response || data.answer || JSON.stringify(data, null, 2)

      setHistory((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, answer, loading: false } : item
        )
      )
    } catch (err) {
      console.error('Talk to DB error:', err)
      setHistory((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? { ...item, answer: `Error: ${err.message}`, loading: false }
            : item
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <DatabaseZap className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold text-gray-900">Ask BantuAI about your data</h2>
        </div>
        <p className="text-sm text-gray-500">
          Ask questions in natural language and get instant insights from your customer service
          database.
        </p>
      </div>

      <QueryInput onSubmit={handleSubmit} loading={loading} />

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-4">
          {history.map((item) => (
            <ResponseCard
              key={item.id}
              question={item.question}
              answer={item.answer}
              loading={item.loading}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && (
        <div className="text-center py-12">
          <DatabaseZap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            Ask a question about your customer service data to get started
          </p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {[
              'Berapa total ticket yang open?',
              'Channel mana yang paling banyak digunakan?',
              'Ticket kategori apa yang paling sering muncul?',
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSubmit(suggestion)}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
