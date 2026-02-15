import { useEffect, useState } from 'react'
import { MessageSquare, Ticket, CheckCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import SummaryCard from '../components/dashboard/SummaryCard'
import TicketsByCategoryChart from '../components/dashboard/TicketsByCategoryChart'
import ConversationsByChannelChart from '../components/dashboard/ConversationsByChannelChart'
import RecentTicketsTable from '../components/dashboard/RecentTicketsTable'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalConversations: 0,
    openTickets: 0,
    resolvedTickets: 0,
    escalationRate: 0,
  })
  const [ticketsByCategory, setTicketsByCategory] = useState([])
  const [conversationsByChannel, setConversationsByChannel] = useState([])
  const [recentTickets, setRecentTickets] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    setError(null)

    try {
      const [
        conversationsRes,
        openTicketsRes,
        resolvedTicketsRes,
        escalatedRes,
        categoriesRes,
        channelsRes,
        recentRes,
      ] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }),
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress']),
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .in('status', ['resolved', 'closed']),
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'escalated'),
        supabase.from('tickets').select('category'),
        supabase.from('conversations').select('channel'),
        supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      // Check for errors
      const results = [conversationsRes, openTicketsRes, resolvedTicketsRes, escalatedRes, categoriesRes, channelsRes, recentRes]
      const firstError = results.find((r) => r.error)
      if (firstError?.error) throw firstError.error

      const totalConversations = conversationsRes.count || 0
      const escalatedCount = escalatedRes.count || 0
      const escalationRate =
        totalConversations > 0
          ? ((escalatedCount / totalConversations) * 100).toFixed(1)
          : 0

      setStats({
        totalConversations,
        openTickets: openTicketsRes.count || 0,
        resolvedTickets: resolvedTicketsRes.count || 0,
        escalationRate,
      })

      // Aggregate tickets by category
      const catCounts = {}
      ;(categoriesRes.data || []).forEach((t) => {
        catCounts[t.category] = (catCounts[t.category] || 0) + 1
      })
      setTicketsByCategory(
        Object.entries(catCounts).map(([category, count]) => ({ category, count }))
      )

      // Aggregate conversations by channel
      const chanCounts = {}
      ;(channelsRes.data || []).forEach((c) => {
        chanCounts[c.channel] = (chanCounts[c.channel] || 0) + 1
      })
      setConversationsByChannel(
        Object.entries(chanCounts).map(([channel, count]) => ({ channel, count }))
      )

      setRecentTickets(recentRes.data || [])
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">
        GadgetNusa — Customer Service Dashboard
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Conversations"
          value={stats.totalConversations}
          icon={MessageSquare}
          color="text-primary"
          loading={loading}
        />
        <SummaryCard
          title="Open Tickets"
          value={stats.openTickets}
          icon={Ticket}
          color="text-amber-500"
          loading={loading}
        />
        <SummaryCard
          title="Resolved Tickets"
          value={stats.resolvedTickets}
          icon={CheckCircle}
          color="text-success"
          loading={loading}
        />
        <SummaryCard
          title="Escalation Rate"
          value={`${stats.escalationRate}%`}
          icon={AlertTriangle}
          color="text-red-500"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TicketsByCategoryChart data={ticketsByCategory} loading={loading} />
        <ConversationsByChannelChart data={conversationsByChannel} loading={loading} />
      </div>

      {/* Recent Tickets */}
      <RecentTicketsTable tickets={recentTickets} loading={loading} />
    </div>
  )
}
