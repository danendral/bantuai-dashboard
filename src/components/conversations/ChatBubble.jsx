import { formatDate } from '../../lib/formatters'

export default function ChatBubble({ message }) {
  const isCustomer = message.role === 'customer'
  const isAgent = message.role === 'agent'

  return (
    <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isCustomer
            ? 'bg-gray-200 text-gray-800 rounded-bl-sm'
            : isAgent
            ? 'bg-emerald-500 text-white rounded-br-sm'
            : 'bg-blue-500 text-white rounded-br-sm'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase opacity-70">
            {message.role}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p
          className={`text-[10px] mt-1 ${
            isCustomer ? 'text-gray-500' : 'text-white/60'
          }`}
        >
          {formatDate(message.created_at)}
        </p>
      </div>
    </div>
  )
}
