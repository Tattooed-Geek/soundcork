import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useDevices } from '../hooks/useDevices'
import { usePresets } from '../hooks/usePresets'
import {
  useNowPlaying,
  useVolume,
  useBass,
  useSendCommand,
  useSetBass,
  useSendKey,
} from '../hooks/useCommand'
import {
  Play,
  Pause,
  Square,
  Power,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Music2,
  Speaker,
  AudioLines,
  Plus,
  ChevronDown,
} from 'lucide-react'

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

function EqBars() {
  return (
    <span className="flex items-end gap-[3px]" title="En cours de lecture">
      <span className="w-1 h-2 bg-accent rounded-full animate-pulse" />
      <span className="w-1 h-3.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.25s' }} />
      <span className="w-1 h-2.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
    </span>
  )
}

export default function Player() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: devices, isLoading: loadingDevices } = useDevices()

  const deviceId = searchParams.get('device') || devices?.[0]?.id
  const device = devices?.find((d) => d.id === deviceId)

  const { data: np } = useNowPlaying(deviceId)
  const { data: vol } = useVolume(deviceId)
  const { data: bass } = useBass(deviceId)
  const sendCmd = useSendCommand(deviceId)
  const setBass = useSetBass(deviceId)
  const sendKey = useSendKey(deviceId)
  const { data: presets } = usePresets(device?.account || undefined)

  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const flashTimer = useRef<number | undefined>(undefined)
  const notify = (msg: string) => {
    setFlash(msg)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 1800)
  }

  const cmd = (p: { action: string; value?: string; content_item_id?: string }, msg?: string) =>
    sendCmd.mutate(p, { onSuccess: () => notify(msg || 'Commande envoyée ✓'), onError: () => notify('Échec de la commande') })
  const key = (k: string, msg?: string) =>
    sendKey.mutate(k, { onSuccess: () => notify(msg || 'Touche envoyée ✓'), onError: () => notify('Échec de la touche') })

  const playPreset = (id: string, name: string) => {
    setActivePreset(id)
    sendCmd.mutate(
      { action: 'play', content_item_id: id },
      { onSuccess: () => notify(`« ${name} » lancé ✓`), onError: () => notify('Échec du lancement') },
    )
  }

  // ---- Volume : valeur locale optimiste, envoi débouncé, re-sync tranquille
  const [localVol, setLocalVol] = useState<number | null>(null)
  const lastVolSend = useRef(0)
  const debounceVol = useRef<number | undefined>(undefined)
  const changeVol = (v: number) => {
    setLocalVol(v)
    window.clearTimeout(debounceVol.current)
    debounceVol.current = window.setTimeout(() => {
      lastVolSend.current = Date.now()
      sendCmd.mutate({ action: 'volume', value: String(v) })
    }, 350)
  }
  useEffect(() => {
    if (vol?.volume != null && Date.now() - lastVolSend.current > 2500) setLocalVol(vol.volume)
  }, [vol?.volume])

  // ---- Basses : même logique
  const [localBass, setLocalBass] = useState<number | null>(null)
  const lastBassSend = useRef(0)
  const debounceBass = useRef<number | undefined>(undefined)
  const changeBass = (v: number) => {
    setLocalBass(v)
    window.clearTimeout(debounceBass.current)
    debounceBass.current = window.setTimeout(() => {
      lastBassSend.current = Date.now()
      setBass.mutate(v)
    }, 350)
  }
  useEffect(() => {
    if (bass?.level != null && Date.now() - lastBassSend.current > 2500) setLocalBass(bass.level)
  }, [bass?.level])

  const volVal = clamp(localVol ?? vol?.volume ?? 0, 0, 100)
  const bassMin = bass?.min ?? -9
  const bassMax = bass?.max ?? 0
  const bassVal = clamp(localBass ?? bass?.level ?? bassMax, bassMin, bassMax)
  const playing = np?.play_state === 'PLAY_STATE'

  if (loadingDevices) {
    return <div className="text-dark-400 text-center py-24">Chargement des appareils…</div>
  }

  if (!devices?.length) {
    return (
      <div className="max-w-md mx-auto mt-24 bg-dark-800 border border-dark-600 rounded-2xl p-8 text-center space-y-3">
        <Speaker size={40} className="text-accent mx-auto" />
        <h2 className="text-lg font-bold text-dark-100">Aucun appareil détecté</h2>
        <p className="text-sm text-dark-400">
          Lance un scan réseau depuis l'onglet Devices de l'admin pour découvrir tes enceintes SoundTouch.
        </p>
        <Link
          to="/devices"
          className="inline-block px-4 py-2 rounded-lg bg-gold-gradient text-[#1a1206] hover:shadow-gold-glow shadow-gold-glow-sm transition"
        >
          Aller aux Devices
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ---- Barre du haut : titre + sélecteur ---- */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold bg-gold-gradient bg-clip-text text-transparent">Player</h1>
        <div className="relative ml-auto">
          <select
            value={deviceId || ''}
            onChange={(e) => setSearchParams({ device: e.target.value })}
            title="Choisir l'enceinte à piloter"
            className="appearance-none bg-dark-800 border border-dark-600 rounded-xl pl-10 pr-9 py-2.5 text-sm text-dark-100 font-semibold focus:outline-none focus:ring-1 focus:ring-accent hover:border-dark-500 transition cursor-pointer"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || d.id} {d.online ? '' : '(hors ligne)'}
              </option>
            ))}
          </select>
          <Speaker size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent pointer-events-none" />
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
        </div>
      </div>

      {/* ---- Now Playing ---- */}
      <div className="bg-hero-gradient border border-dark-600 rounded-2xl p-6 shadow-glow-sm">
        <div className="flex items-start gap-5">
          <div className="w-28 h-28 rounded-xl overflow-hidden bg-dark-700 border border-dark-600 flex items-center justify-center shrink-0">
            {np?.art ? (
              <img src={np.art} alt="Pochette" className="w-full h-full object-cover" />
            ) : (
              <Music2 size={36} className="text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {playing ? (
                <EqBars />
              ) : (
                <span className="w-2 h-2 rounded-full bg-dark-500" title="Lecture arrêtée" />
              )}
              <span className={`text-[11px] uppercase tracking-widest font-bold ${playing ? 'text-accent' : 'text-dark-400'}`}>
                {playing ? 'En lecture' : np?.play_state === 'PAUSE_STATE' ? 'En pause' : 'En veille'}
              </span>
            </div>
            <div className="text-xl font-bold text-dark-100 truncate" title="Titre en cours">
              {np?.track || 'Rien en lecture'}
            </div>
            <div className="text-sm text-dark-300 truncate" title="Artiste / station">
              {np?.artist || np?.station || '—'}
            </div>
            {np?.album && (
              <div className="text-xs text-dark-500 truncate" title="Album">
                {np.album}
              </div>
            )}
          </div>
        </div>

        {/* ---- Transport ---- */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => key('PREV', 'Piste précédente ✓')}
            title="Piste précédente"
            className="w-12 h-12 rounded-full bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-dark-500 transition flex items-center justify-center"
          >
            <SkipBack size={18} className="text-dark-100" />
          </button>
          <button
            onClick={() => key('PLAY_PAUSE', playing ? 'Pause ✓' : 'Lecture ✓')}
            title={playing ? 'Mettre en pause' : 'Reprendre la lecture'}
            className="w-16 h-16 rounded-full bg-gold-gradient text-[#1a1206] shadow-gold-glow hover:shadow-gold-glow hover:scale-105 transition flex items-center justify-center"
          >
            {playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
          </button>
          <button
            onClick={() => cmd({ action: 'stop' }, 'Lecture arrêtée ✓')}
            title="Arrêter la lecture"
            className="w-12 h-12 rounded-full bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-dark-500 transition flex items-center justify-center"
          >
            <Square size={16} className="text-dark-100" fill="currentColor" />
          </button>
          <button
            onClick={() => key('NEXT', 'Piste suivante ✓')}
            title="Piste suivante"
            className="w-12 h-12 rounded-full bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-dark-500 transition flex items-center justify-center"
          >
            <SkipForward size={18} className="text-dark-100" />
          </button>
          <button
            onClick={() => cmd({ action: 'power' }, 'Alimentation basculée ✓')}
            title="Allumer / éteindre l'enceinte"
            className="w-12 h-12 rounded-full bg-dark-700 border border-dark-600 hover:bg-red-950/50 hover:border-red-800 transition flex items-center justify-center ml-2"
          >
            <Power size={18} className="text-dark-300 hover:text-red-400" />
          </button>
        </div>
      </div>

      {/* ---- Presets ---- */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-dark-100">Presets</h2>
          <span className="text-xs text-dark-500" title="Boutons physiques 1 à 6 de l'enceinte">
            {presets?.length ?? 0}/6
          </span>
          {device?.account && (
            <Link
              to={`/accounts/${device.account}`}
              title="Gérer les presets (ajouter, modifier, supprimer)"
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-accent text-xs font-semibold text-dark-200 transition"
            >
              <Plus size={14} className="text-accent" />
              Gérer les stations
            </Link>
          )}
        </div>

        {!device?.account ? (
          <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 text-center text-sm text-dark-400">
            Cet appareil n'est pas encore provisionné dans SoundCork — aucun preset associé.
            <Link to={`/devices/${device?.id}`} className="text-accent hover:underline ml-1">
              Voir l'appareil
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {presets?.map((p) => (
              <button
                key={p.id}
                onClick={() => playPreset(p.id, p.name)}
                title={`Lancer « ${p.name} » sur ${device?.name || 'l\'enceinte'}`}
                className={`group relative rounded-xl border overflow-hidden text-left transition ${
                  activePreset === p.id
                    ? 'border-accent shadow-glow bg-dark-700'
                    : 'border-dark-600 bg-dark-800 hover:border-accent hover:bg-dark-700'
                }`}
              >
                <div className="aspect-video bg-dark-700 flex items-center justify-center overflow-hidden">
                  {p.container_art ? (
                    <img src={p.container_art} alt={p.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                  ) : (
                    <Music2 size={28} className="text-accent opacity-60 group-hover:opacity-100 transition" />
                  )}
                </div>
                <div
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-dark-950/80 border border-accent/60 text-[11px] font-bold flex items-center justify-center text-accent"
                  title={`Bouton ${p.id} de l'enceinte`}
                >
                  {p.id}
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-bold text-dark-100 truncate" title={p.name}>
                    {p.name}
                  </div>
                  <div className="text-[10px] text-dark-500 truncate" title={p.source}>
                    {p.source === 'LOCAL_INTERNET_RADIO' ? 'Radio internet' : p.source}
                  </div>
                </div>
                {activePreset === p.id && playing && (
                  <div className="absolute bottom-2 right-2">
                    <EqBars />
                  </div>
                )}
              </button>
            ))}
            {!presets?.length && (
              <div className="col-span-full bg-dark-800 border border-dark-600 rounded-xl p-8 text-center text-sm text-dark-400">
                Aucun preset sur ce compte.
                <Link to={`/accounts/${device?.account}`} className="text-accent hover:underline ml-1">
                  Ajouter une station
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- Réglages sonores ---- */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 size={18} className="text-accent" />
              <h3 className="font-bold text-dark-100">Volume</h3>
            </div>
            <span className="text-sm font-bold text-accent tabular-nums">{volVal}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={volVal}
            onChange={(e) => changeVol(parseInt(e.target.value))}
            className="w-full"
            style={{ '--fill': `${volVal}%` } as React.CSSProperties}
            title="Glisse pour régler le volume de l'enceinte"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeVol(clamp(volVal - 10, 0, 100))}
              title="Baisser le volume de 10"
              className="px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-dark-500 text-sm font-bold text-dark-200 transition"
            >
              −10
            </button>
            <button
              onClick={() => changeVol(clamp(volVal + 10, 0, 100))}
              title="Augmenter le volume de 10"
              className="px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-dark-500 text-sm font-bold text-dark-200 transition"
            >
              +10
            </button>
            <button
              onClick={() => key('MUTE', vol?.muted ? 'Son réactivé ✓' : 'Muet ✓')}
              title={vol?.muted ? 'Réactiver le son' : 'Couper le son'}
              className={`ml-auto w-10 h-10 rounded-full border transition flex items-center justify-center ${
                vol?.muted
                  ? 'bg-gold-gradient border-gold text-[#1a1206] shadow-gold-glow-sm'
                  : 'bg-dark-700 border-dark-600 hover:bg-dark-600 hover:border-dark-500 text-dark-300'
              }`}
            >
              {vol?.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AudioLines size={18} className="text-accent" />
              <h3 className="font-bold text-dark-100">Basses</h3>
            </div>
            <span className="text-sm font-bold text-accent tabular-nums" title="Niveau de basses mémorisé sur l'enceinte">
              {bassVal > 0 ? '+' : ''}{bassVal} dB
            </span>
          </div>
          <input
            type="range"
            min={bassMin}
            max={bassMax}
            step={1}
            value={bassVal}
            onChange={(e) => changeBass(parseInt(e.target.value))}
            className="w-full"
            style={{ '--fill': `${((bassVal - bassMin) / Math.max(bassMax - bassMin, 1)) * 100}%` } as React.CSSProperties}
            title="Glisse pour doser les basses de l'enceinte"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeBass(clamp(bassVal - 1, bassMin, bassMax))}
              title="Baisser les basses de 1 dB"
              className="px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-dark-500 text-sm font-bold text-dark-200 transition"
            >
              −1 dB
            </button>
            <button
              onClick={() => changeBass(clamp(bassVal + 1, bassMin, bassMax))}
              title="Augmenter les basses de 1 dB"
              className="px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-dark-500 text-sm font-bold text-dark-200 transition"
            >
              +1 dB
            </button>
            <span className="ml-auto text-[11px] text-dark-500" title="Valeur mémorisée sur l'enceinte">
              cible : {bass?.target ?? bassVal} dB
            </span>
          </div>
        </div>
      </div>

      {/* ---- Flash de confirmation ---- */}
      {flash && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-dark-800 border border-accent text-sm text-accent-bright shadow-glow font-semibold">
          {flash}
        </div>
      )}
    </div>
  )
}
