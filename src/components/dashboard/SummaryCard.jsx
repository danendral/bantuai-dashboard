export default function SummaryCard({ title, value, icon: Icon, color = 'text-primary', loading }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-gray-50 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
        <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      </div>
    </div>
  )
}
