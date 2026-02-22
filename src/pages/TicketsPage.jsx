import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatDate, formatLabel } from '../lib/formatters'
import { Filter, Ticket } from 'lucide-react'

const STATUS_OPTIONS = ['all', 'open', 'in_progress', 'resolved', 'closed']
const CATEGORY_OPTIONS = [
  'all', 'product_defect', 'wrong_item', 'shipping_delay',
  'payment_issue', 'return_request', 'general_inquiry', 'other',
]
const PRIORITY_OPTIONS = ['all', 'low', 'medium', 'high']

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-stone-100 text-stone-600',
}

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-sky-100 text-sky-700',
}

const CATEGORY_COLORS = {
  product_defect: 'bg-red-100 text-red-700',
  wrong_item: 'bg-orange-100 text-orange-700',
  shipping_delay: 'bg-yellow-100 text-yellow-700',
  payment_issue: 'bg-purple-100 text-purple-700',
  return_request: 'bg-pink-100 text-pink-700',
  general_inquiry: 'bg-sky-100 text-sky-700',
  other: 'bg-stone-100 text-stone-600',
}

function Badge({ value, colorMap }) {
  const classes = colorMap[value] || 'bg-stone-100 text-stone-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {formatLabel(value)}
    </span>
  )
}

function formatOption(val) {
  if (val === 'all') return 'All'
  return val.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function TicketsPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, categoryFilter, priorityFilter])

  async function fetchTickets() {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      if (categoryFilter !== 'all') query = query.eq('category', categoryFilter)
      if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter)

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setTickets(data || [])
    } catch (err) {
      console.error('Tickets fetch error:', err)
      setError(err.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Ticket className="w-5 h-5 text-nusa-orange" />
        <h2 className="text-xl font-bold text-dark-gray">Tickets</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <div className="flex items-center gap-2 mb-3 text-sm text-stone-500">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Status', value: statusFilter, setter: setStatusFilter, options: STATUS_OPTIONS },
            { label: 'Category', value: categoryFilter, setter: setCategoryFilter, options: CATEGORY_OPTIONS },
            { label: 'Priority', value: priorityFilter, setter: setPriorityFilter, options: PRIORITY_OPTIONS },
          ].map(({ label, value, setter, options }) => (
            <div key={label}>
              <label className="block text-xs text-stone-400 mb-1">{label}</label>
              <select
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="border border-stone-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-nusa-orange/20 focus:border-nusa-orange"
              >
                {options.map((opt) => (
                  <option key={opt} value={opt}>{formatOption(opt)}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-stone-100 rounded animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <p className="text-lg font-medium">No tickets found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Subject</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Category</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Priority</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Customer</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Assigned</th>
                  <th className="text-left py-3 px-3 text-stone-500 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                    className="border-b border-stone-50 hover:bg-nusa-orange-light/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 max-w-[220px] truncate font-medium text-dark-gray" title={ticket.subject}>
                      {ticket.subject}
                    </td>
                    <td className="py-3 px-3"><Badge value={ticket.category} colorMap={CATEGORY_COLORS} /></td>
                    <td className="py-3 px-3"><Badge value={ticket.priority} colorMap={PRIORITY_COLORS} /></td>
                    <td className="py-3 px-3"><Badge value={ticket.status} colorMap={STATUS_COLORS} /></td>
                    <td className="py-3 px-3 text-stone-600 text-xs">{ticket.customer_email}</td>
                    <td className="py-3 px-3 text-stone-600 text-xs">{ticket.assigned_to || '—'}</td>
                    <td className="py-3 px-3 text-stone-400 text-xs whitespace-nowrap">{formatDate(ticket.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
