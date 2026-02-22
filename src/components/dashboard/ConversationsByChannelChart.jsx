import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const CHANNEL_COLORS = {
  web: '#3b82f6',
  WhatsApp: '#22c55e',
}

export default function ConversationsByChannelChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Conversations by Channel</h3>
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name: item.channel.charAt(0).toUpperCase() + item.channel.slice(1),
    value: item.count,
    channel: item.channel,
  }))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Conversations by Channel</h3>
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          No conversation data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.channel}
                  fill={CHANNEL_COLORS[entry.channel] || '#6b7280'}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
