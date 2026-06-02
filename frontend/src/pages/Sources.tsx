import { useState } from 'react'
import { useAccounts } from '../hooks/useAccounts'
import { useSources } from '../hooks/useSources'
import { ListMusic } from 'lucide-react'

export default function Sources() {
  const { data: accounts } = useAccounts()
  const [selectedAccount, setSelectedAccount] = useState('')
  const { data: sources } = useSources(selectedAccount || undefined)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-dark-100">Sources</h1>

      <div className="flex gap-2 items-center">
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="bg-dark-800 border border-dark-600 rounded-md px-3 py-2 text-sm text-dark-100 focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">Select an account...</option>
          {accounts?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label} ({a.id})
            </option>
          ))}
        </select>
      </div>

      {selectedAccount && (
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
          {!sources?.length && <div className="text-dark-400 text-center py-8">No sources found.</div>}
        </div>
      )}

      {!selectedAccount && <div className="text-dark-400 text-center py-12">Select an account to view sources.</div>}
    </div>
  )
}
