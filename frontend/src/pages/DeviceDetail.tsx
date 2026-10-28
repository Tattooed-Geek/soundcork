import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDeviceDetail } from '../hooks/useDevices'
import { useNowPlaying, useVolume, useSendCommand, useSendKey } from '../hooks/useCommand'
import { Speaker, Play, Pause, Square, Volume2, VolumeX, Power, Disc3 } from 'lucide-react'

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export default function DeviceDetail() {
  const { id } = useParams()
  const { data: device } = useDeviceDetail(id)
  const { data: np } = useNowPlaying(id)
  const { data: vol } = useVolume(id)
  const sendCmd = useSendCommand(id)
  const sendKey = useSendKey(id)

  // Volume local optimiste : évite le « saut » du slider pendant le rafraîchissement
  const [localVol, setLocalVol] = useState<number | null>(null)
  const lastSend = useRef(0)
  const debounce = useRef<number | undefined>(undefined)
  const changeVol = (v: number) => {
    setLocalVol(v)
    window.clearTimeout(debounce.current)
    debounce.current = window.setTimeout(() => {
      lastSend.current = Date.now()
      sendCmd.mutate({ action: 'volume', value: String(v) })
    }, 350)
  }
  useEffect(() => {
    if (vol?.volume != null && Date.now() - lastSend.current > 2500) setLocalVol(vol.volume)
  }, [vol?.volume])

  const volVal = clamp(localVol ?? vol?.volume ?? 0, 0, 100)
  const playing = np?.play_state === 'PLAY_STATE'

  if (!device) {
    return <div className="text-dark-400">Loading device...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-dark-700 border border-dark-600 flex items-center justify-center">
          <Speaker size={32} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark-100">{device.name || device.id}</h1>
          <div className="text-sm text-dark-400">{device.product_code || 'Unknown model'} • {device.ip}</div>
        </div>
        <Link
          to={`/player?device=${device.id}`}
          title="Open the music player for this device"
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold-gradient text-[#1a1206] hover:shadow-gold-glow shadow-gold-glow-sm transition"
        >
          <Disc3 size={16} />
          Open Player
        </Link>
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
            onClick={() => sendKey.mutate('PLAY_PAUSE')}
            title={playing ? 'Pause' : 'Play / resume'}
            className="p-3 rounded-full bg-gold-gradient text-[#1a1206] hover:shadow-gold-glow shadow-gold-glow-sm transition"
          >
            {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={() => sendCmd.mutate({ action: 'stop', value: '' })}
            title="Stop playback"
            className="p-3 rounded-full bg-dark-700 border border-dark-600 hover:bg-dark-600 transition"
          >
            <Square size={16} className="text-dark-100" fill="currentColor" />
          </button>
          <button
            onClick={() => sendKey.mutate('MUTE')}
            title={vol?.muted ? 'Unmute' : 'Mute'}
            className={`p-3 rounded-full border transition ${
              vol?.muted
                ? 'bg-accent-dim/30 border-accent text-accent-bright'
                : 'bg-dark-700 border-dark-600 hover:bg-dark-600 text-dark-300'
            }`}
          >
            {vol?.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={() => sendCmd.mutate({ action: 'power', value: '' })}
            title="Toggle power"
            className="px-4 py-2 rounded-md bg-dark-700 border border-dark-600 hover:bg-red-950/40 hover:border-red-800 transition text-sm text-dark-200 ml-auto"
          >
            <span className="flex items-center gap-1.5">
              <Power size={14} />
              Toggle Power
            </span>
          </button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-100">Volume</h2>
          <div className="text-sm text-dark-300 tabular-nums">
            {volVal}%{vol?.muted && <span className="ml-2 text-accent">Muted</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Volume2 size={18} className="text-dark-400" />
          <input
            type="range"
            min={0}
            max={100}
            value={volVal}
            onChange={(e) => changeVol(parseInt(e.target.value))}
            className="flex-1"
            style={{ '--fill': `${volVal}%` } as React.CSSProperties}
            title="Drag to set the device volume"
          />
        </div>
      </div>

      {/* Device Info */}
      <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-2">
        <h2 className="text-lg font-semibold text-dark-100">Device Info</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-dark-400">ID</div>
          <div className="text-dark-300 font-mono">{device.id}</div>

          <div className="text-dark-400">Firmware</div>
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
