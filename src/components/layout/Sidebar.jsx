import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  Package,
  DatabaseZap,
  PanelLeftClose,
  PanelLeft,
  Zap,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/conversations', label: 'Conversations', icon: MessageSquare },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/talk-to-db', label: 'Talk to DB', icon: DatabaseZap },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { logout } = useAuth()

  return (
    <aside
      className={`bg-sidebar text-white flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } min-h-screen`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-nusa-orange rounded-lg flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-base font-extrabold leading-tight tracking-tight">
              Gadget<span className="text-nusa-orange">Nusa</span>
            </h1>
            <p className="text-[10px] text-stone-500 leading-tight">
              Admin Dashboard
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-nusa-orange text-white'
                  : 'text-stone-400 hover:bg-sidebar-hover hover:text-white'
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-3">
        {!collapsed && (
          <div className="text-[10px] text-stone-600 space-y-0.5">
            <p>Powered by <span className="text-stone-500">BantuAI</span></p>
          </div>
        )}
        <button
          onClick={logout}
          className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-400 hover:bg-sidebar-hover hover:text-white transition-colors"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-1 p-1.5 rounded hover:bg-sidebar-hover text-stone-500 hover:text-white transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
