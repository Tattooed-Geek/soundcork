import { Link } from 'react-router-dom'
import { useDevices } from '../hooks/useDevices'
import { Speaker, Disc3, ChevronRight, Loader2 } from 'lucide-react'

export default function Devices() {
  const { data: devices, isLoading } = useDevices()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-dark-100">Devices</h1>

      {isLoading && (
        <div className="text-dark-400 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading devices...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {devices?.map((device) => (
          <div
            key={device.id}
            className="bg-dark-800 border border-dark-600 rounded-xl p-4 space-y-3 hover:border-dark-500 transition"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-dark-700 border border-dark-600 flex items-center justify-center shrink-0">
                <Speaker size={22} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-dark-100 truncate" title={device.name || device.id}>
                  {device.name || device.id}
                </div>
                <div className="text-xs text-dark-400 truncate" title="Model and IP address">
                  {device.product_code || 'Unknown model'} • {device.ip}
                </div>
              </div>
              <span
                className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${
                  device.online
                    ? 'text-accent-bright border-accent/50 bg-accent-dim/20'
                    : 'text-dark-400 border-dark-600 bg-dark-700'
                }`}
                title={device.online ? 'Device is online' : 'Device is offline'}
              >
                {device.online ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/player?device=${device.id}`}
                title={`Open the music player for ${device.name || device.id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-gradient text-[#1a1206] hover:shadow-gold-glow shadow-gold-glow-sm transition"
              >
                <Disc3 size={16} />
                Player
              </Link>
              <Link
                to={`/devices/${device.id}`}
                title={`Configuration and details for ${device.name || device.id}`}
                className="ml-auto flex items-center gap-1 px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-dark-500 text-sm font-semibold text-dark-200 transition"
              >
                Details
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ))}
        {!devices?.length && !isLoading && (
          <div className="text-dark-400 col-span-full text-center py-12">No devices found. Run a network scan.</div>
        )}
      </div>
    </div>
  )
}
