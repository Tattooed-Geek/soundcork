import { useParams } from 'react-router-dom'
import { useDeviceDetail } from '../hooks/useDevices'
import { useNowPlaying, useVolume, useSendCommand } from '../hooks/useCommand'
import { Speaker, Play, Square, Volume2 } from 'lucide-react'
import { useState } from 'react'

export default function DeviceDetail() {
  const { id } = useParams()
  const { data: device } = useDeviceDetail(id)
  const { data: np } = useNowPlaying(id)
  const { data: vol } = useVolume(id)
  const sendCmd = useSendCommand(id)
  const [volInput, setVolInput] = useState(vol?.volume || 50)

  if (!device) {
    return <div className="text-dark-400">Loading device...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-dark-700 flex items-center justify-center">
          <Speaker size={32} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark-100">{device.name || device.id}</h1>
          <div className="text-sm text-dark-400">{device.product_code || 'Unknown model'} • {device.ip}</div>
        </div>
      </div>

      {/* Now Playing Card */}
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-dark-100">Now Playing</h2>
        <div className="flex items-center gap-4">
          {np?.art ? (
            <img src={np.art} alt="art" className="w-24 h-24 rounded-lg object-cover bg-dark-700" />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-dark-700 flex items-center justify-center">
              <Speaker size={32} className="text-dark-500" />
            </div>
          )}
          <div className="flex-1">
            <div className="text-lg font-semibold text-dark-100 truncate">{np?.track || 'Nothing playing'}</div>
            <div className="text-sm text-dark-400 truncate">{np?.artist || ''}</div>
            <div className="text-xs text-dark-500 truncate">{np?.album || ''}</div>
            {np?.station && <div className="text-xs text-dark-400 mt-1">Station: {np.station}</div>}
            <div className="text-xs text-dark-500 mt-1">{np?.play_state || 'Unknown'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => sendCmd.mutate({ action: 'play', value: '' })}
            className="p-3 rounded-full bg-dark-700 hover:bg-dark-600 transition"
          >
            <Play size={18} className="text-dark-100" />
          </button>
          <button
            onClick={() => sendCmd.mutate({ action: 'stop', value: '' })}
            className="p-3 rounded-full bg-dark-700 hover:bg-dark-600 transition"
          >
            <Square size={18} className="text-dark-100" />
          </button>
          <button
            onClick={() => sendCmd.mutate({ action: 'power', value: '' })}
            className="px-4 py-2 rounded-md bg-dark-700 hover:bg-dark-600 transition text-sm text-dark-100 ml-auto"
          >
            Toggle Power
          </button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-100">Volume</h2>
          <div className="text-sm text-dark-300">{vol?.volume || 0}%{vol?.muted && <span className="ml-2 text-red-400">Muted</span>}</div>
        </div>
        <div className="flex items-center gap-3">
          <Volume2 size={18} className="text-dark-400" />
          <input
            type="range"
            min={0}
            max={100}
            value={vol?.volume || 0}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              setVolInput(v)
            }}
            onMouseUp={() => sendCmd.mutate({ action: 'volume', value: String(volInput) })}
            className="flex-1 accent-accent"
          />
        </div>
      </div>

      {/* Device Info */}
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-2">
        <h2 className="text-lg font-semibold text-dark-100">Device Info</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-dark-400">ID</div>
          <div className="text-dark-300 font-mono">{device.id}</div>

          <div className="text-dark-400">Firmvare</div>
          <div className="text-dark-300">{device.firmware_version || '—'}</div>

          <div className="text-dark-400">Marge Server</div>
          <div className="text-dark-300">{device.marge_server}</div>

          <div className="text-dark-400">In Soundcork</div>
          <div className="text-dark-300">{device.in_soundcork ? 'Yes' : 'No'}</div>

          <div className="text-dark-400">Reachable (SSH)</div>
          <div className="text-dark-300">{device.reachable ? 'Yes' : 'No'}</div>

          <div className="text-dark-400">Language</div>
          <div className="text-dark-300">{device.language_code || '—'}</div>

          <div className="text-dark-400">Account</div>
          <div className="text-dark-300">{device.account || '—'}</div>
        </div>
      </div>
    </div>
  )
}
