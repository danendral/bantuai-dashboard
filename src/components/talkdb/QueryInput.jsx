import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

export default function QueryInput({ onSubmit, loading }) {
  const [query, setQuery] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
    setQuery('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g., Berapa ticket yang masih open minggu ini?"
        className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={!query.trim() || loading}
        className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">Ask</span>
      </button>
    </form>
  )
}
