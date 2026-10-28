import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAccounts } from '../hooks/useAccounts'
import { usePresets } from '../hooks/usePresets'
import type { Preset } from '../hooks/usePresets'
import PresetForm from '../components/PresetForm'
import { Music, Loader2, Plus, Pencil, Radio } from 'lucide-react'

const b64decode = (l?: string) => {
  if (!l) return ''
  try {
    return decodeURIComponent(escape(atob(l)))
  } catch {
    return l
  }
}

export default function AccountDetail() {
  const { id } = useParams()
  const { data: accounts, isLoading } = useAccounts()
  const account = accounts?.find((a) => a.id === id)
  const { data: presets } = usePresets(id)
  const [editing, setEditing] = useState<Preset | null>(null)
  const [creating, setCreating] = useState(false)

  if (isLoading) {
    return <div className="text-dark-400 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading...</div>
  }

  if (!account) {
    return <div className="text-dark-400">Account not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-dark-700 flex items-center justify-center border border-dark-600">
          <Radio size={26} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-dark-100">{account.label}</h1>
          <div className="text-sm text-dark-400 font-mono">Account {account.id}</div>
        </div>
        <button
          onClick={() => setCreating(true)}
          title="Ajouter une station radio sur un bouton preset libre"
          className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold-gradient text-[#1a1206] hover:shadow-gold-glow shadow-gold-glow-sm transition"
        >
          <Plus size={16} />
          Add station
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets?.map((p) => (
          <div
            key={p.id}
            className="bg-dark-800 border border-dark-600 rounded-xl overflow-hidden hover:border-dark-500 transition group"
          >
            <div className="aspect-video bg-dark-700 flex items-center justify-center relative">
              {p.container_art ? (
                <img src={p.container_art} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <Music size={32} className="text-dark-500 group-hover:text-accent transition" />
              )}
              <div
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-dark-950/80 border border-accent/60 text-xs font-bold flex items-center justify-center text-accent"
                title={`Preset slot ${p.id}`}
              >
                {p.id}
              </div>
            </div>
            <div className="p-3 space-y-1">
              <div className="text-sm font-semibold text-dark-100 truncate" title={p.name}>{p.name}</div>
              <div className="text-xs text-dark-400" title="Source et type de flux">{p.source} • {p.type}</div>
              {p.type === 'stationurl' && (
                <div className="text-xs text-dark-500 font-mono truncate" title={b64decode(p.location)}>
                  {b64decode(p.location) || '—'}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditing(p)}
                  title="Modifier ce preset (nom, URL, emplacement)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-accent text-xs font-semibold text-dark-200 transition"
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <Link
                  to="/player"
                  title="Ouvrir le player pour écouter ce compte"
                  className="ml-auto px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-accent text-xs font-semibold text-accent transition"
                >
                  Player
                </Link>
              </div>
            </div>
          </div>
        ))}
        {!presets?.length && (
          <div className="col-span-full bg-dark-800 border border-dark-600 rounded-xl p-10 text-center text-sm text-dark-400">
            No presets on this account yet.
            <button onClick={() => setCreating(true)} className="text-accent hover:underline ml-1">
              Add the first station
            </button>
          </div>
        )}
      </div>

      {(editing || creating) && (
        <PresetForm
          accountId={account.id}
          preset={editing}
          usedSlots={presets?.map((p) => p.id) || []}
          onClose={() => {
            setEditing(null)
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}
