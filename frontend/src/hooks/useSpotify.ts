import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface SpotifyAccount {
  displayName: string
  createdAt: string
  spotifyUserId: string
}

export function useSpotifyAccounts() {
  return useQuery({
    queryKey: ['spotify-accounts'],
    queryFn: async () => {
      const res = await apiClient.get<SpotifyAccount[]>('/spotify/accounts')
      return res.data
    },
  })
}

export function useInitSpotify() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ redirectUrl: string }>('/spotify/init')
      return res.data
    },
  })
}
