import { formatDate, formatLabel } from '../../lib/formatters'

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
}

const CATEGORY_COLORS = {
  product_defect: 'bg-red-100 text-red-700',
  wrong_item: 'bg-orange-100 text-orange-700',
  shipping_delay: 'bg-yellow-100 text-yellow-700',
  payment_issue: 'bg-purple-100 text-purple-700',
  return_request: 'bg-pink-100 text-pink-700',
  general_inquiry: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-600',
}

function Badge({ value, colorMap }) {
  const classes = colorMap[value] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {formatLabel(value)}
    </span>
  )
}

export default function TicketsTable({ tickets, loading, onSelectTicket }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg font-medium">No tickets found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Subject</th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Category</th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Priority</th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Status</th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Customer Email</th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Assigned To</th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Created At</th>
            <th className="text-left py-3 px-3 text-gray-500 font-medium">Resolved At</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors"
            >
              <td className="py-3 px-3 max-w-[220px] truncate font-medium text-gray-900" title={ticket.subject}>
                {ticket.subject}
              </td>
              <td className="py-3 px-3">
                <Badge value={ticket.category} colorMap={CATEGORY_COLORS} />
              </td>
              <td className="py-3 px-3">
                <Badge value={ticket.priority} colorMap={PRIORITY_COLORS} />
              </td>
              <td className="py-3 px-3">
                <Badge value={ticket.status} colorMap={STATUS_COLORS} />
              </td>
              <td className="py-3 px-3 text-gray-600">{ticket.customer_email}</td>
              <td className="py-3 px-3 text-gray-600">{ticket.assigned_to || '—'}</td>
              <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">
                {formatDate(ticket.created_at)}
              </td>
              <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">
                {formatDate(ticket.resolved_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
