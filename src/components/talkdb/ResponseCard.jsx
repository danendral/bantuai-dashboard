export default function ResponseCard({ question, answer, loading }) {
  return (
    <div className="space-y-2">
      {/* Question */}
      <div className="bg-gray-100 rounded-lg px-4 py-3">
        <p className="text-sm text-gray-700">{question}</p>
      </div>

      {/* Answer */}
      {loading ? (
        <div className="bg-white border border-gray-100 rounded-lg px-4 py-4 shadow-sm">
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-lg px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}
