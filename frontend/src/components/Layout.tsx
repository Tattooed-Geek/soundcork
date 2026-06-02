import { NavLink } from 'react-router-dom'
import {
  Home,
  Speaker,
  Users,
  Radio,
  ListMusic,
  Group,
  Settings,
  Music,
} from 'lucide-react'

const sidebarLinks = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/devices', label: 'Devices', icon: Speaker },
  { to: '/accounts', label: 'Accounts', icon: Users },
  { to: '/presets', label: 'Presets', icon: Radio },
  { to: '/sources', label: 'Sources', icon: ListMusic },
  { to: '/groups', label: 'Groups', icon: Group },
  { to: '/spotify', label: 'Spotify', icon: Music },
  { to: '/settings/system', label: 'System Settings', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-dark-600 flex flex-col">
        <div className="p-6 text-xl font-semibold text-accent">SoundCork Admin</div>
        <nav className="flex-1 px-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-dark-600 text-accent'
                      : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100'
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-4 border-t border-dark-600">
          <div className="text-xs text-dark-400 text-center">SoundCork v1.0</div>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-6 bg-dark-900">
        {children}
      </main>
    </div>
  )
}
