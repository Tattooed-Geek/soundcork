import { useSpotifyAccounts, useInitSpotify } from '../hooks/useSpotify'
import { Music, ExternalLink, CheckCircle } from 'lucide-react'

export default function Spotify() {
  const { data: accounts, isLoading } = useSpotifyAccounts()
  const init = useInitSpotify()

  const handleLink = () => {
    init.mutate(undefined, {
      onSuccess: (data) => {
        if (data.redirectUrl) window.open(data.redirectUrl, '_blank')
      },
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-dark-100">Spotify</h1>

      <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Music size={20} className="text-accent" />
          <h2 className="text-lg font-semibold text-dark-100">Spotify Integration</h2>
        </div>
        <p className="text-sm text-dark-400">
          Link your Spotify account to enable Spotify Connect playback on your SoundTouch devices.
        </p>
        <button
          onClick={handleLink}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition text-sm font-medium"
        >
          <ExternalLink size={16} />
          Link Spotify Account
        </button>
      </div>

      <h2 className="text-lg font-semibold text-dark-100">Linked Accounts</h2>
      {isLoading && <div className="text-dark-400">Loading...</div>}

      <div className="space-y-2">
        {accounts?.map((acc) => (
          <div key={acc.spotifyUserId} className="flex items-center gap-3 bg-dark-800 border border-dark-600 rounded-lg p-4">
            <CheckCircle size={18} className="text-emerald-400" />
            <div>
              <div className="text-sm font-medium text-dark-100">{acc.displayName}</div>
              <div className="text-xs text-dark-400">{acc.spotifyUserId} • Linked {new Date(acc.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
        {!accounts?.length && !isLoading && (
          <div className="text-dark-400 text-center py-8">No Spotify accounts linked yet.</div>
        )}
      </div>
    </div>
  )
}
