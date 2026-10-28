import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccounts, useCreateAccount, useDeleteAccount } from '../hooks/useAccounts'
import { Users, Trash2, Plus, ChevronRight } from 'lucide-react'

export default function Accounts() {
  const { data: accounts, isLoading } = useAccounts()
  const create = useCreateAccount()
  const del = useDeleteAccount()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ account_id: '', account_name: '' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-100">Accounts</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-dark-700 text-dark-100 hover:bg-dark-600 transition text-sm"
        >
          <Plus size={16} />
          Create Account
        </button>
      </div>

      {showForm && (
        <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-dark-100">New Account</h3>
          <div className="flex gap-2">
            <input
              value={form.account_id}
              onChange={(e) => setForm({ ...form, account_id: e.target.value })}
              placeholder="Account ID"
              className="bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              value={form.account_name}
              onChange={(e) => setForm({ ...form, account_name: e.target.value })}
              placeholder="Account Name"
              className="bg-dark-700 border border-dark-600 rounded-md px-3 py-2 text-sm text-dark-100 placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent flex-1"
            />
            <button
              onClick={() => {
                create.mutate({ account_id: form.account_id, account_name: form.account_name })
                setShowForm(false)
                setForm({ account_id: '', account_name: '' })
              }}
              className="px-3 py-2 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition text-sm"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {isLoading && <div className="text-dark-400">Loading...</div>}

      <div className="space-y-2">
        {accounts?.map((acc) => (
          <div key={acc.id} className="flex items-center justify-between bg-dark-800 border border-dark-600 rounded-lg p-4 hover:border-dark-500 transition">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-dark-700 flex items-center justify-center">
                <Users size={18} className="text-accent" />
              </div>
              <div>
                <div className="text-sm font-semibold text-dark-100">{acc.label}</div>
                <div className="text-xs text-dark-400">{acc.id} • {acc.device_count} device{acc.device_count !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/accounts/${acc.id}`} className="px-3 py-1.5 rounded-md bg-dark-700 text-dark-100 hover:bg-dark-600 transition text-sm flex items-center gap-1">
                Manage <ChevronRight size={14} />
              </Link>
              <button
                onClick={() => del.mutate(acc.id)}
                className="p-2 rounded-md bg-dark-700 text-red-400 hover:bg-red-500/10 transition"
                title="Delete account"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!accounts?.length && !isLoading && <div className="text-dark-400 text-center py-12">No accounts found.</div>}
    </div>
  )
}
