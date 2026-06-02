import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { useAccountDetail } from '../hooks/useAccounts'
import { usePresets } from '../hooks/usePresets'
import { useSources } from '../hooks/useSources'
import { useGroups } from '../hooks/useGroups'
import { ArrowLeft, Music, ListMusic, Users, Layers } from 'lucide-react'

type Tab = 'presets' | 'sources' | 'groups' | 'recents'

export default function AccountDetail() {
  const { id } = useParams()
  const { data: account } = useAccountDetail(id)
  const { data: presets } = usePresets(id)
  const { data: sources } = useSources(id)
  const { data: groups } = useGroups(id)
  const [tab, setTab] = useState<Tab>('presets')

  if (!account) return <div className="text-dark-400">Loading account...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/admin/accounts" className="text-dark-400 hover:text-dark-100 transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-dark-100">{account.label}</h1>
      </div>
      <div className="text-sm text-dark-400">{account.id}</div>

      <div className="flex gap-2 border-b border-dark-600 pb-1">
        {(['presets', 'sources', 'groups', 'recents'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-t-md transition ${tab === t ? 'text-accent border-b-2 border-accent' : 'text-dark-400 hover:text-dark-200'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'presets' && (
        <div className="space-y-2">
          {presets?.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-dark-800 border border-dark-600 rounded-lg p-3">
              <Music size={18} className="text-accent" />
              <div className="flex-1">
                <div className="text-sm font-medium text-dark-100">{p.name}</div>
                <div className="text-xs text-dark-400">{p.source} • {p.type}</div>
              </div>
              <div className="text-xs text-dark-500 font-mono truncate max-w-[10rem]">{p.location}</div>
            </div>
          ))}
          {!presets?.length && <div className="text-dark-400 text-center py-8">No presets.</div>}
        </div>
      )}

      {tab === 'sources' && (
        <div className="space-y-2">
          {sources?.map((s) => (
            <div key={s.id} className="flex items-center gap-3 bg-dark-800 border border-dark-600 rounded-lg p-3">
              <ListMusic size={18} className="text-accent" />
              <div className="flex-1">
                <div className="text-sm font-medium text-dark-100">{s.display_name || 'Unnamed'}</div>
                <div className="text-xs text-dark-400">{s.source_key_type}</div>
              </div>
              <div className="text-xs text-dark-500 font-mono">{s.id}</div>
            </div>
          ))}
          {!sources?.length && <div className="text-dark-400 text-center py-8">No sources.</div>}
        </div>
      )}

      {tab === 'groups' && (
        <div className="space-y-2">
          {groups?.map((g) => (
            <div key={g.id} className="flex items-center gap-3 bg-dark-800 border border-dark-600 rounded-lg p-3">
              <Layers size={18} className="text-accent" />
              <div className="flex-1">
                <div className="text-sm font-medium text-dark-100">{g.name}</div>
                <div className="text-xs text-dark-400">Left: {g.left_id} • Right: {g.right_id}</div>
              </div>
              <div className="text-xs text-dark-500 font-mono">{g.id}</div>
            </div>
          ))}
          {!groups?.length && <div className="text-dark-400 text-center py-8">No groups.</div>}
        </div>
      )}

      {tab === 'recents' && (
        <div className="space-y-2">
          {account.recents.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 bg-dark-800 border border-dark-600 rounded-lg p-3">
              <Users size={18} className="text-accent" />
              <div className="flex-1">
                <div className="text-sm font-medium text-dark-100">{r.name}</div>
                <div className="text-xs text-dark-400">{r.type}</div>
              </div>
            </div>
          ))}
          {!account.recents.length && <div className="text-dark-400 text-center py-8">No recents.</div>}
        </div>
      )}
    </div>
  )
}
