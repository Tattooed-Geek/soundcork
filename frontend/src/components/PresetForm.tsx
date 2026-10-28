import { useEffect, useState } from 'react'
import { X, Save, Trash2, Search, Loader2, Check } from 'lucide-react'
import apiClient from '../api/client'
import type { Preset } from '../hooks/usePresets'
import { useUpdatePreset, useDeletePreset } from '../hooks/usePresets'

const b64encode = (u: string) => btoa(unescape(encodeURIComponent(u)))
const b64decode = (l?: string) => {
  if (!l) return ''
  try {
    return decodeURIComponent(escape(atob(l)))
  } catch {
    return l
  }
}

interface RadioResult {
  uuid: string
  name: string
  url: string
  country: string
  countrycode: string
  tags: string[]
  bitrate: number
  codec: string
  votes: number
}

const flag = (cc: string) =>
  cc && cc.length === 2
    ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))
    : '🌐'

interface Props {
  accountId: string
  /** null = création d'un nouveau preset */
  preset: Preset | null
  /** slots déjà occupés (pour la création) */
  usedSlots?: string[]
  onClose: () => void
}

export default function PresetForm({ accountId, preset, usedSlots = [], onClose }: Props) {
  const updatePreset = useUpdatePreset(accountId)
  const deletePreset = useDeletePreset(accountId)

  const isStation = !preset || preset.type === 'stationurl'
  const [slot, setSlot] = useState(preset?.id || '')
  const [name, setName] = useState(preset?.name || '')
  const [url, setUrl] = useState(isStation ? b64decode(preset?.location) : '')
  const [error, setError] = useState<string | null>(null)

  const [searchQ, setSearchQ] = useState('')
  const [results, setResults] = useState<RadioResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [picked, setPicked] = useState<RadioResult | null>(null)

  const runSearch = async () => {
    const q = searchQ.trim()
    if (q.length < 2) {
      setSearchError('Tape au moins 2 caractères.')
      return
    }
    setSearching(true)
    setSearchError(null)
    setPicked(null)
    try {
      const res = await apiClient.get<RadioResult[]>('/radio/search', {
        params: { q, limit: 60 },
      })
      setResults(res.data)
      if (res.data.length === 0) setSearchError('Aucune station trouvée pour cette recherche.')
    } catch (e: any) {
      setSearchError(e?.response?.data?.detail || 'Recherche impossible, réessaie.')
    } finally {
      setSearching(false)
    }
  }

  const pick = (r: RadioResult) => {
    setPicked(r)
    setName(r.name)
    setUrl(r.url)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const freeSlots = ['1', '2', '3', '4', '5', '6'].filter((s) => !usedSlots.includes(s))

  const save = () => {
    if (!slot) return setError('Choisis un emplacement (1 à 6).')
    if (!name.trim()) return setError('Donne un nom à la station.')
    if (isStation) {
      const trimmed = url.trim()
      if (!/^https?:\/\/.+/i.test(trimmed)) return setError("L'URL doit commencer par http:// ou https://")
    }
    const body: Preset = {
      id: slot,
      name: name.trim(),
      source: isStation ? 'LOCAL_INTERNET_RADIO' : preset!.source,
      type: isStation ? 'stationurl' : preset!.type,
      location: isStation ? b64encode(url.trim()) : preset!.location,
      source_account: preset?.source_account ?? '',
      source_id: preset?.source_id ?? null,
      is_presetable: preset?.is_presetable ?? 'true',
      container_art: preset?.container_art ?? '',
      account: accountId,
    }
    updatePreset.mutate(body, {
      onSuccess: onClose,
      onError: (e: any) => setError(e?.response?.data?.detail || 'Échec de la sauvegarde.'),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-dark-800 border border-dark-600 rounded-2xl shadow-glow-lg w-full max-w-lg p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold bg-gold-gradient bg-clip-text text-transparent">
            {preset ? `Modifier le preset ${preset.id}` : 'Nouvelle station radio'}
          </h2>
          <button
            onClick={onClose}
            title="Fermer la fenêtre"
            className="p-2 rounded-lg bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-dark-500 transition"
          >
            <X size={16} className="text-dark-300" />
          </button>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-dark-400 mb-1">Emplacement (1–6)</label>
          {preset ? (
            <div className="px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-sm text-accent font-bold w-20 text-center">
              {slot}
            </div>
          ) : (
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              title="Numéro du bouton preset sur l'enceinte"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Choisir…</option>
              {freeSlots.map((s) => (
                <option key={s} value={s}>
                  Preset {s}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-dark-400 mb-1">Nom</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex. ÉNERGIE Montréal"
            title="Nom affiché sur l'enceinte et dans le player"
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-dark-500"
          />
        </div>

        {isStation && (
          <div className="rounded-xl border border-dark-600 bg-dark-900/60 p-3 space-y-2">
            <label className="block text-xs uppercase tracking-wide text-dark-400">
              Rechercher parmi 50 000+ stations
            </label>
            <div className="flex gap-2">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), runSearch())}
                placeholder="ex. ÉNERGIE, jazz, Radio-Canada…"
                title="Tape le nom d'une radio et appuie sur Entrée pour chercher dans l'annuaire mondial"
                className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-dark-500"
              />
              <button
                onClick={runSearch}
                disabled={searching}
                title="Lancer la recherche dans l'annuaire Radio-Browser"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold-gradient text-[#1a1206] hover:shadow-gold-glow shadow-gold-glow-sm transition disabled:opacity-50"
              >
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Chercher
              </button>
            </div>
            {searchError && !searching && (
              <p className="text-[11px] text-amber-400">{searchError}</p>
            )}
            {picked && (
              <p className="text-[11px] text-accent flex items-center gap-1">
                <Check size={12} /> « {picked.name} » sélectionnée — Nom et URL remplis ci-dessous.
              </p>
            )}
            {results.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-dark-700 divide-y divide-dark-700/60" title="Clique une station pour l'ajouter">
                {results.map((r) => (
                  <button
                    key={r.uuid}
                    onClick={() => pick(r)}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 transition ${
                      picked?.uuid === r.uuid
                        ? 'bg-accent-dim/30 border-l-2 border-accent'
                        : 'hover:bg-dark-700/60 border-l-2 border-transparent'
                    }`}
                    title={`${r.name} — ${r.url}`}
                  >
                    <span className="text-base leading-5">{flag(r.countrycode)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-dark-100 truncate">{r.name}</span>
                      <span className="block text-[11px] text-dark-400 truncate">
                        {[r.country, r.codec, r.bitrate ? `${r.bitrate} kbps` : ''].filter(Boolean).join(' • ')}
                        {r.tags.length > 0 && ` • ${r.tags.join(', ')}`}
                      </span>
                    </span>
                    {picked?.uuid === r.uuid && <Check size={14} className="text-accent mt-1 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isStation ? (
          <div>
            <label className="block text-xs uppercase tracking-wide text-dark-400 mb-1">URL du flux</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemple.com/flux.mp3"
              title="Adresse du flux audio (radio internet)"
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-dark-500 font-mono"
            />
            <p className="text-[11px] text-dark-500 mt-1">Flux direct MP3/AAC/HLS de la radio.</p>
          </div>
        ) : (
          <div>
            <label className="block text-xs uppercase tracking-wide text-dark-400 mb-1">Source</label>
            <div className="px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-sm text-dark-300">
              {preset?.source} • {preset?.type} — seul le nom est modifiable.
            </div>
          </div>
        )}

        {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={save}
            disabled={updatePreset.isPending}
            title="Enregistrer le preset"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold-gradient text-[#1a1206] hover:shadow-gold-glow shadow-gold-glow-sm transition disabled:opacity-50"
          >
            <Save size={16} />
            {updatePreset.isPending ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
          {preset && (
            <button
              onClick={() => {
                if (window.confirm(`Supprimer le preset ${preset.id} « ${preset.name} » ?`)) {
                  deletePreset.mutate(preset.id, { onSuccess: onClose })
                }
              }}
              disabled={deletePreset.isPending}
              title="Supprimer ce preset"
              className="px-4 py-2.5 rounded-lg bg-dark-700 border border-red-900 text-red-400 hover:bg-red-950/40 hover:border-red-700 transition text-sm font-semibold"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
