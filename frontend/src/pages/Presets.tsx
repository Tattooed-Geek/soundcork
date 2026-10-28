import { useState } from 'react'
import { useAccounts } from '../hooks/useAccounts'
import { usePresets } from '../hooks/usePresets'
import type { Preset } from '../hooks/usePresets'
import PresetForm from '../components/PresetForm'
import { Link } from 'react-router-dom'
import { Music, Loader2, Plus, Pencil, RadioTower } from 'lucide-react'

const b64decode = (l?: string) => {
  if (!l) return ''
  try {
    return decodeURIComponent(escape(atob(l)))
  } catch {
    return l
  }
}

export default function Presets() {
  const { data: accounts } = useAccounts()
  const [selectedAccount, setSelectedAccount] = useState('')
  const { data: presets, isLoading } = usePresets(selectedAccount || undefined)
  const [editing, setEditing] = useState<Preset | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-dark-100">Presets</h1>

      <div className="flex gap-2 items-center">
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          title="Choose which account's presets to display"
          className="bg-dark-800 border border-dark-600 rounded-md px-3 py-2 text-sm text-dark-100 focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Select an account...</option>
          {accounts?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label} ({a.id})
            </option>
          ))}
        </select>
        {selectedAccount && (
          <button
            onClick={() => setCreating(true)}
            title="Add a new radio station on a free preset slot"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-gradient text-[#1a1206] hover:shadow-gold-glow shadow-gold-glow-sm transition"
          >
            <Plus size={16} />
            Add station
          </button>
        )}
        {selectedAccount && (
          <Link
            to={`/stations?account=${selectedAccount}`}
            title="Rechercher parmi 50 000+ stations avec filtres (pays, qualité, genre, ville)"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-accent font-bold text-sm hover:bg-dark-600 transition"
          >
            <RadioTower size={16} />
            Find stations
          </Link>
        )}
      </div>

      {isLoading && (
        <div className="text-dark-400 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading presets...
        </div>
      )}

      {selectedAccount && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {presets?.map((p) => (
            <div key={p.id} className="bg-dark-800 border border-dark-600 rounded-lg overflow-hidden hover:border-dark-500 transition group">
              <div className="aspect-square bg-dark-700 flex items-center justify-center relative">
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
              <div className="p-3">
                <div className="text-sm font-semibold text-dark-100 truncate" title={p.name}>{p.name}</div>
                <div className="text-xs text-dark-400 mt-1" title="Source and stream type">{p.source} • {p.type}</div>
                {p.type === 'stationurl' && (
                  <div className="text-xs text-dark-500 font-mono mt-1 truncate" title={b64decode(p.location)}>
                    {b64decode(p.location) || '—'}
                  </div>
                )}
                <button
                  onClick={() => setEditing(p)}
                  title="Edit this preset (name, URL, slot)"
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-600 hover:bg-dark-600 hover:border-accent text-xs font-semibold text-dark-200 transition"
                >
                  <Pencil size={12} />
                  Edit
                </button>
              </div>
            </div>
          ))}
          {!presets?.length && <div className="text-dark-400 col-span-full text-center py-12">No presets found.</div>}
        </div>
      )}

      {!selectedAccount && <div className="text-dark-400 text-center py-12">Select an account to view presets.</div>}

      {(editing || creating) && selectedAccount && (
        <PresetForm
          accountId={selectedAccount}
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
