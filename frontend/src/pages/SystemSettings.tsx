import { useSystemStatus, useNetworkScan } from '../hooks/useSystem'
import { Server, RefreshCw, Wifi, Activity } from 'lucide-react'

export default function SystemSettings() {
  const { data: system, isLoading: sysLoading } = useSystemStatus()
  const { data: scanResult, refetch: runScan } = useNetworkScan()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark-100">System Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-dark-100">Server Info</h2>
          </div>
          {sysLoading ? (
            <div className="text-dark-400">Loading...</div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Version</span>
                <span className="text-dark-100 font-mono">{system?.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Base URL</span>
                <span className="text-dark-100 font-mono">{system?.base_url || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Data Directory</span>
                <span className="text-dark-100 font-mono">{system?.data_dir || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Spotify Configured</span>
                <span className="text-dark-100">{system?.spotify_configured ? 'Yes' : 'No'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wifi size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-dark-100">Network Scan</h2>
          </div>
          <p className="text-sm text-dark-400">
            Scan for Bose SoundTouch devices on your local network.
          </p>
          <button
            onClick={() => runScan()}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-dark-700 text-dark-100 hover:bg-dark-600 transition text-sm"
          >
            <RefreshCw size={16} />
            Scan Network
          </button>
        </div>
      </div>

      {scanResult && (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
            <Activity size={18} className="text-accent" />
            Scan Results
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-dark-400 border-b border-dark-600">
                <tr>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">IP</th>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {scanResult.map((d: any, i: number) => (
                  <tr key={i} className="border-b border-dark-700 hover:bg-dark-700/50">
                    <td className="py-2 px-3 text-dark-100">{d.name}</td>
                    <td className="py-2 px-3 text-dark-300 font-mono">{d.ip}</td>
                    <td className="py-2 px-3 text-dark-300 font-mono">{d.id}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2 py-1 rounded ${d.online ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {d.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!scanResult.length && <div className="text-dark-400 text-center py-4">No devices found.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
