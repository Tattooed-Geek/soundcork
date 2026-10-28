import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Loader2, Plus, Check, RotateCcw, RadioTower, Heart } from 'lucide-react'
import apiClient from '../api/client'
import { useAccounts } from '../hooks/useAccounts'
import { usePresets } from '../hooks/usePresets'
import type { Preset } from '../hooks/usePresets'

interface RadioResult {
  uuid: string
  name: string
  url: string
  country: string
  countrycode: string
  state: string
  tags: string[]
  bitrate: number
  codec: string
  votes: number
  clickcount: number
}

interface Country {
  name: string
  code: string
  count: number
}

interface Genre {
  name: string
  count: number
}

const flag = (cc: string) =>
  cc && cc.length === 2
    ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))
    : '🌐'

const b64encode = (u: string) => btoa(unescape(encodeURIComponent(u)))

const BITRATES = [
  { v: 0, label: 'Tous' },
  { v: 64, label: '≥ 64 kbps' },
  { v: 96, label: '≥ 96 kbps' },
  { v: 128, label: '≥ 128 kbps' },
  { v: 192, label: '≥ 192 kbps' },
  { v: 320, label: '≥ 320 kbps' },
]

const CODECS = ['Tous', 'MP3', 'AAC', 'OGG', 'FLAC']

const bitrateBadge = (b: number) =>
  b >= 256
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
    : b >= 128
      ? 'bg-accent-dim/40 text-accent border-accent/40'
      : 'bg-dark-600/60 text-dark-300 border-dark-500'

/** L'annuaire renvoie parfois des débits en octets/s (512000 = 512 kbps). */
const fmtK = (b: number) => (b >= 10000 ? Math.round(b / 1000) : b)

const inputCls =
  'bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-dark-100 focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-dark-500'
const selectCls = inputCls + ' cursor-pointer'

export default function Stations() {
  const [params, setParams] = useSearchParams()
  const { data: accounts = [] } = useAccounts()
  const accountId = params.get('account') || ''
  const activeAccount = accounts.find((a) => a.id === accountId)

  // filtres
  const [q, setQ] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [genre, setGenre] = useState('')
  const [minBitrate, setMinBitrate] = useState(0)
  const [codec, setCodec] = useState('Tous')
  const [region, setRegion] = useState('')
  const [sortBy, setSortBy] = useState<'pop' | 'bitrate' | 'name'>('pop')

  const searchParams = useMemo(
    () => ({
      q: q.trim(),
      countrycode: countryCode,
      tag: genre,
      min_bitrate: minBitrate,
      codec: codec === 'Tous' ? '' : codec,
      region: region.trim(),
      limit: 120,
    }),
    [q, countryCode, genre, minBitrate, codec, region],
  )

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['radio-search', searchParams],
    queryFn: async () => {
      const res = await apiClient.get<RadioResult[]>('/radio/search', { params: searchParams })
      return res.data
    },
    placeholderData: (prev) => prev,
  })

  const sorted = useMemo(() => {
    const arr = [...results]
    if (sortBy === 'bitrate') arr.sort((a, b) => b.bitrate - a.bitrate || b.votes - a.votes)
    else if (sortBy === 'name') arr.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    return arr
  }, [results, sortBy])

  const { data: countries = [] } = useQuery({
    queryKey: ['radio-countries'],
    queryFn: async () => (await apiClient.get<Country[]>('/radio/countries')).data,
    staleTime: 24 * 3600 * 1000,
  })

  const { data: genres = [] } = useQuery({
    queryKey: ['radio-genres'],
    queryFn: async () => (await apiClient.get<Genre[]>('/radio/genres')).data,
    staleTime: 24 * 3600 * 1000,
  })

  const { data: presets = [] } = usePresets(accountId || undefined)
  const usedSlots = presets.map((p) => p.id)
  const freeSlots = ['1', '2', '3', '4', '5', '6'].filter((s) => !usedSlots.includes(s))

  const qc = useQueryClient()
  const [added, setAdded] = useState<Record<string, string>>({}) // uuid -> slot

  const addPreset = useMutation({
    mutationFn: async (r: RadioResult) => {
      const slot = freeSlots[0]
      if (!slot) throw new Error('Aucun emplacement libre (1 à 6).')
      const body: Preset = {
        id: slot,
        name: r.name,
        source: 'LOCAL_INTERNET_RADIO',
        type: 'stationurl',
        location: b64encode(r.url),
        source_account: '',
        source_id: null,
        is_presetable: 'true',
        container_art: '',
        account: accountId,
      }
      await apiClient.put(`/accounts/${accountId}/presets/${slot}`, body)
      return slot
    },
    onSuccess: (slot, r) => {
      setAdded((a) => ({ ...a, [r.uuid]: slot }))
      qc.invalidateQueries({ queryKey: ['presets', accountId] })
    },
  })

  const hasFilters =
    countryCode || genre || minBitrate || codec !== 'Tous' || region.trim() || q.trim()

  const resetFilters = () => {
    setQ('')
    setCountryCode('')
    setGenre('')
    setMinBitrate(0)
    setCodec('Tous')
    setRegion('')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gold-gradient bg-clip-text text-transparent flex items-center gap-2">
            <RadioTower size={24} className="text-accent" /> Stations
          </h1>
          <p className="text-sm text-dark-400 mt-1">
            Recherche parmi 50 000+ radios du monde entier — même annuaire qu'EasyRadio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={accountId}
            onChange={(e) => setParams(e.target.value ? { account: e.target.value } : {})}
            title="Compte Bose qui recevra les presets ajoutés"
            className={selectCls + ' min-w-[180px]'}
          >
            <option value="">— Choisir un compte —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          {accountId && (
            <Link
              to={`/accounts/${accountId}`}
              title="Voir les presets du compte"
              className="px-3 py-2 rounded-lg bg-dark-700 border border-dark-600 text-sm text-dark-200 hover:bg-dark-600 transition"
            >
              Presets
            </Link>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-dark-800/70 rounded-2xl p-4 space-y-3 gold-edge">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom d'une station… ex. ÉNERGIE, FIP, Radio-Canada, jazz…"
            title="Tape le nom d'une station. Laisse vide pour voir les stations les plus écoutées au monde."
            className={inputCls + ' flex-1 text-base py-2.5'}
          />
          <button
            onClick={() => {}}
            title="La recherche se met à jour automatiquement (Entrée aussi)"
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold-gradient text-[#1a1206] font-bold text-sm shadow-gold-glow-sm hover:shadow-gold-glow transition"
          >
            <Search size={16} /> {isFetching ? 'Recherche…' : 'Live'}
          </button>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            title="Filtrer par pays"
            className={selectCls}
          >
            <option value="">🌍 Tous les pays</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {flag(c.code)} {c.name} ({c.count})
              </option>
            ))}
          </select>

          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            title="Filtrer par genre musical"
            className={selectCls}
          >
            <option value="">🎵 Tous les genres</option>
            {genres.map((g) => (
              <option key={g.name} value={g.name}>
                {g.name} ({g.count})
              </option>
            ))}
          </select>

          <select
            value={minBitrate}
            onChange={(e) => setMinBitrate(Number(e.target.value))}
            title="Qualité audio minimale (bitrate du flux)"
            className={selectCls}
          >
            {BITRATES.map((b) => (
              <option key={b.v} value={b.v}>
                {b.label}
              </option>
            ))}
          </select>

          <select
            value={codec}
            onChange={(e) => setCodec(e.target.value)}
            title="Format audio du flux"
            className={selectCls}
          >
            {CODECS.map((c) => (
              <option key={c} value={c}>
                {c === 'Tous' ? '🎚 Tous formats' : c}
              </option>
            ))}
          </select>

          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Ville / région…"
            title="Filtre sur la région, la province ou le nom (ex. Québec, Montréal, Texas…)"
            className={inputCls}
          />
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-dark-400">
            <span className="uppercase tracking-wide">Trier :</span>
            {(
              [
                ['pop', 'Popularité'],
                ['bitrate', 'Qualité'],
                ['name', 'A → Z'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setSortBy(k)}
                title={`Trier par ${label.toLowerCase()}`}
                className={`px-2.5 py-1 rounded-md border transition ${
                  sortBy === k
                    ? 'bg-accent-dim/40 border-accent/50 text-accent'
                    : 'bg-dark-700 border-dark-600 text-dark-300 hover:text-dark-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs">
            {hasFilters ? (
              <button
                onClick={resetFilters}
                title="Effacer la recherche et tous les filtres"
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-dark-700 border border-dark-600 text-dark-300 hover:text-dark-100 transition"
              >
                <RotateCcw size={12} /> Réinitialiser
              </button>
            ) : null}
            <span className="text-dark-400">
              {isFetching ? '…' : `${sorted.length} station${sorted.length > 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
      </div>

      {/* Compte non choisi */}
      {accounts.length > 0 && !accountId && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          Choisis un compte en haut à droite pour pouvoir ajouter des stations à ses presets (slots 1 à 6).
        </p>
      )}
      {accountId && freeSlots.length === 0 && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          Tous les emplacements (1 à 6) du compte {activeAccount?.label} sont occupés — supprime un
          preset d'abord.
        </p>
      )}

      {/* Résultats */}
      {sorted.length === 0 && !isFetching ? (
        <div className="text-center py-16 text-dark-400">
          <RadioTower size={40} className="mx-auto mb-3 text-dark-600" />
          <p className="text-sm">Aucune station ne correspond — élargis les filtres ou change la recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sorted.map((r) => {
            const slot = added[r.uuid]
            return (
              <div
                key={r.uuid}
                className={`bg-dark-800 border rounded-xl p-3.5 flex flex-col gap-2 transition ${
                  slot
                    ? 'border-gold/70 shadow-gold-glow-sm'
                    : 'border-gold/25 hover:border-gold/60 hover:shadow-gold-glow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-dark-100 truncate" title={r.name}>
                      {flag(r.countrycode)} {r.name}
                    </div>
                    <div className="text-[11px] text-dark-400 truncate">
                      {[r.country, r.state].filter(Boolean).join(' — ') || 'Origine inconnue'}
                    </div>
                  </div>
                  {r.bitrate > 0 && (
                    <span
                      className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${bitrateBadge(r.bitrate)}`}
                      title={`Qualité du flux : ${r.bitrate} kbps (${r.codec || '?'})`}
                    >
                      {fmtK(r.bitrate)}k
                    </span>
                  )}
                </div>

                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {r.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-dark-700 text-dark-300 border border-dark-600"
                        title={`Genre : ${t}`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mt-auto">
                  <span className="text-[11px] text-dark-500 flex items-center gap-1" title="Votes d'auditeurs dans l'annuaire">
                    <Heart size={11} /> {r.votes}
                  </span>
                  <button
                    onClick={() => addPreset.mutate(r)}
                    disabled={!accountId || !!slot || freeSlots.length === 0}
                    title={
                      slot
                        ? `Ajoutée au preset ${slot}`
                        : !accountId
                          ? 'Choisis un compte en haut'
                          : freeSlots.length === 0
                            ? 'Aucun slot libre'
                            : `Ajouter au preset ${freeSlots[0]} du compte ${activeAccount?.label}`
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      slot
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                        : 'bg-gold-gradient text-[#1a1206] hover:shadow-gold-glow shadow-gold-glow-sm'
                    } disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-none disabled:bg-dark-600 disabled:text-dark-400 disabled:border-dark-600 disabled:border`}
                  >
                    {slot ? (
                      <>
                        <Check size={13} /> Preset {slot}
                      </>
                    ) : addPreset.isPending && addPreset.variables?.uuid === r.uuid ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <>
                        <Plus size={13} /> Ajouter
                      </>
                    )}
                  </button>
                </div>
                {addPreset.isError && addPreset.variables?.uuid === r.uuid && (
                  <p className="text-[10px] text-red-400">
                    {(addPreset.error as Error).message || "Échec de l'ajout."}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
