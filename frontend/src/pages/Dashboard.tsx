import { useDevices } from '../hooks/useDevices'
import { useAccounts } from '../hooks/useAccounts'
import { useSystemStatus } from '../hooks/useSystem'
import { Speaker, Users, Activity, Server } from 'lucide-react'

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
        <Icon size={20} className="text-accent" />
      </div>
      <div>
        <div className="text-2xl font-semibold text-dark-100">{value}</div>
        <div className="text-sm text-dark-400">{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: devices } = useDevices()
  const { data: accounts } = useAccounts()
  const { data: system } = useSystemStatus()

  const onlineCount = devices?.filter((d) => d.online).length || 0
  const totalDevices = devices?.length || 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark-100">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Devices" value={totalDevices} icon={Speaker} />
        <StatCard label="Online" value={onlineCount} icon={Activity} />
        <StatCard label="Accounts" value={accounts?.length || 0} icon={Users} />
        <StatCard label="Version" value={system?.version || '—'} icon={Server} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-dark-100 mb-3">Quick Devices</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {devices?.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-md bg-dark-700">
                <div>
                  <div className="text-sm font-medium text-dark-100">{d.name || d.id}</div>
                  <div className="text-xs text-dark-400">{d.ip}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${d.online ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {d.online ? 'Online' : 'Offline'}
                </div>
              </div>
            ))}
            {!devices?.length && <div className="text-sm text-dark-400">No devices found.</div>}
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-600 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-dark-100 mb-3">System Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Base URL</span>
              <span className="text-dark-100">{system?.base_url || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Data Directory</span>
              <span className="text-dark-100">{system?.data_dir || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Spotify Configured</span>
              <span className="text-dark-100">{system?.spotify_configured ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
