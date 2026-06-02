import { useState } from 'react'
import { useAccounts } from '../hooks/useAccounts'
import { useGroups, useCreateGroup, useDeleteGroup } from '../hooks/useGroups'
import { Layers, Plus, Trash2 } from 'lucide-react'

export default function Groups() {
  const { data: accounts } = useAccounts()
  const [selectedAccount, setSelectedAccount] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', left_id: '', right_id: '' })

  const { data: groups } = useGroups(selectedAccount || undefined)
  const create = useCreateGroup(selectedAccount || undefined)
  const del = useDeleteGroup(selectedAccount || undefined)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-dark-100">Groups</h1>

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
        {selectedAccount && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 px-3 py-2 rounded-md bg-dark-700 text-dark-100 hover:bg-dark-600 transition text-sm"
          >
            <Plus size={16} />
            Create Group
          </button>
        )}
      </div>

      {showForm && selectedAccount && (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-dark-100">New Stereo Group</h3>
          <div className="flex gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Group Name"
              className="bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent flex-1"
            />
            <input
              value={form.left_id}
              onChange={(e) => setForm({ ...form, left_id: e.target.value })}
              placeholder="Left Device ID"
              className="bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              value={form.right_id}
              onChange={(e) => setForm({ ...form, right_id: e.target.value })}
              placeholder="Right Device ID"
              className="bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={() => {
                create.mutate({ name: form.name, left_id: form.left_id, right_id: form.right_id })
                setShowForm(false)
                setForm({ name: '', left_id: '', right_id: '' })
              }}
              className="px-3 py-2 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition text-sm"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {selectedAccount && (
        <div className="space-y-2">
          {groups?.map((g) => (
            <div key={g.id} className="flex items-center justify-between bg-dark-800 border border-dark-600 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Layers size={18} className="text-accent" />
                <div>
                  <div className="text-sm font-semibold text-dark-100">{g.name}</div>
                  <div className="text-xs text-dark-400">Left: {g.left_id} | Right: {g.right_id}</div>
                </div>
              </div>
              <button
                onClick={() => del.mutate(g.id)}
                className="p-2 rounded-md bg-dark-700 text-red-400 hover:bg-red-500/10 transition"
                title="Delete group"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {!groups?.length && <div className="text-dark-400 text-center py-8">No groups found.</div>}
        </div>
      )}

      {!selectedAccount && <div className="text-dark-400 text-center py-12">Select an account to view groups.</div>}
    </div>
  )
}
