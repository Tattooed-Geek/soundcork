import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDevices } from '../hooks/useDevices'
import { useSendCommand } from '../hooks/useCommand'
import { Speaker, Activity, Power, RotateCcw } from 'lucide-react'

function DeviceCard({ device }: { device: any }) {
  const sendCmd = useSendCommand(device.id)

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center">
            <Speaker size={18} className="text-accent" />
          </div>
          <div>
            <div className="text-sm font-semibold text-dark-100">{device.name || device.id}</div>
            <div className="text-xs text-dark-400">{device.product_code || 'Unknown model'}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${device.online ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          <Activity size={12} />
          {device.online ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="text-xs text-dark-400 space-y-1">
        <div className="flex justify-between">
          <span>IP</span>
          <span className="text-dark-300">{device.ip}</span>
        </div>
        <div className="flex justify-between">
          <span>Marge</span>
          <span className="text-dark-300">{device.marge_server}</span>
        </div>
        <div className="flex justify-between">
          <span>Account</span>
          <span className="text-dark-300">{device.account || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span>Firmware</span>
          <span className="text-dark-300">{device.firmware_version || '—'}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={() => sendCmd.mutate({ action: 'power', value: '' })}
          className="px-3 py-1.5 text-xs rounded-md bg-dark-700 text-dark-100 hover:bg-dark-600 transition"
        >
          <Power size={12} className="inline mr-1" />
          Toggle Power
        </button>
        <button
          onClick={() => sendCmd.mutate({ action: 'reboot', value: '' })}
          className="px-3 py-1.5 text-xs rounded-md bg-dark-700 text-dark-100 hover:bg-dark-600 transition"
        >
          <RotateCcw size={12} className="inline mr-1" />
          Reboot
        </button>
        <Link
          to={`/devices/${device.id}`}
          className="px-3 py-1.5 text-xs rounded-md bg-dark-700 text-dark-100 hover:bg-dark-600 transition inline-block"
        >
          Details
        </Link>
        {!device.in_soundcork && (
          <button
            onClick={() => sendCmd.mutate({ action: 'configure_account', value: '' })}
            className="px-3 py-1.5 text-xs rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
          >
            Configure
          </button>
        )}
        {device.reachable && device.marge_server !== 'Soundcork' && (
          <button
            onClick={() => sendCmd.mutate({ action: 'switch_to_soundcork', value: '' })}
            className="px-3 py-1.5 text-xs rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
          >
            Switch to Soundcork
          </button>
        )}
      </div>
    </div>
  )
}

export default function Devices() {
  const { data: devices, isLoading } = useDevices()
  const [filter, setFilter] = useState('')

  const filtered = devices?.filter((d) =>
    (d.name + d.id + d.ip).toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-100">Devices</h1>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search devices..."
          className="bg-dark-800 border border-dark-600 rounded-md px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent w-64"
        />
      </div>

      {isLoading && <div className="text-dark-400">Loading...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered?.map((d) => (
          <DeviceCard key={d.id} device={d} />
        ))}
      </div>
      {!filtered?.length && !isLoading && (
        <div className="text-dark-400 text-center py-12">No devices found.</div>
      )}
    </div>
  )
}
