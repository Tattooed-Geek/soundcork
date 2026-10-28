import { NavLink } from 'react-router-dom'
import {
  Home,
  Disc3,
  Speaker,
  Users,
  Radio,
  RadioTower,
  ListMusic,
  Group,
  Settings,
  Music,
} from 'lucide-react'

const sidebarLinks = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/player', label: 'Player', icon: Disc3 },
  { to: '/devices', label: 'Devices', icon: Speaker },
  { to: '/accounts', label: 'Accounts', icon: Users },
  { to: '/presets', label: 'Presets', icon: Radio },
  { to: '/stations', label: 'Stations', icon: RadioTower },
  { to: '/sources', label: 'Sources', icon: ListMusic },
  { to: '/groups', label: 'Groups', icon: Group },
  { to: '/spotify', label: 'Spotify', icon: Music },
  { to: '/settings/system', label: 'System Settings', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 h-full w-64 bg-dark-800 border-r border-gold/30 flex flex-col">
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-gradient flex items-center justify-center gold-edge">
            <Disc3 size={20} className="text-dark-950" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-wide gold-script">SoundCork</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold/80">TattooedGeek</div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                title={link.label}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-dark-600 text-accent border border-gold/40 shadow-gold-glow-sm'
                      : 'text-dark-300 hover:bg-dark-700 hover:text-dark-100 border border-transparent'
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gold/30">
          <div className="text-xs text-gold/70 text-center">SoundCork v1.1 — TattooedGeek</div>
        </div>
      </aside>
      <main className="ml-64 flex-1 p-6 bg-dark-900 min-h-screen">
        {children}
      </main>
    </div>
  )
}
