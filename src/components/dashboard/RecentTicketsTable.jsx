import { formatDate, formatLabel } from '../../lib/formatters'
import { ArrowUpDown } from 'lucide-react'
import { useState } from 'react'

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

export default function RecentTicketsTable({ tickets, loading }) {
  const [sortAsc, setSortAsc] = useState(false)

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Tickets</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const sorted = [...tickets].sort((a, b) => {
    const da = new Date(a.created_at)
    const db = new Date(b.created_at)
    return sortAsc ? da - db : db - da
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Tickets</h3>
      {sorted.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No tickets found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Subject</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Category</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Priority</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Customer Email</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">
                  <button
                    onClick={() => setSortAsc(!sortAsc)}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Created At
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 px-3 max-w-[200px] truncate" title={ticket.subject}>
                    {ticket.subject}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge value={ticket.category} colorMap={CATEGORY_COLORS} />
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge value={ticket.priority} colorMap={PRIORITY_COLORS} />
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge value={ticket.status} colorMap={STATUS_COLORS} />
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">{ticket.customer_email}</td>
                  <td className="py-2.5 px-3 text-gray-500 text-xs whitespace-nowrap">
                    {formatDate(ticket.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
