import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface CommandPayload {
  action: string
  value?: string
  content_item_id?: string
}

export function useSendCommand(deviceId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CommandPayload) => {
      if (!deviceId) throw new Error('No device selected')
      const res = await apiClient.post(`/devices/${deviceId}/command`, payload)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      qc.invalidateQueries({ queryKey: ['device', deviceId] })
    },
  })
}

export function useNowPlaying(deviceId: string | undefined) {
  return useQuery({
    queryKey: ['now-playing', deviceId],
    queryFn: async () => {
      if (!deviceId) return null
      const res = await apiClient.get(`/devices/${deviceId}/now-playing`)
      return res.data
    },
    enabled: !!deviceId,
    refetchInterval: 3000,
  })
}

export function useVolume(deviceId: string | undefined) {
  return useQuery({
    queryKey: ['volume', deviceId],
    queryFn: async () => {
      if (!deviceId) return { volume: 0, muted: false }
      const res = await apiClient.get(`/devices/${deviceId}/volume`)
      return res.data as { volume: number; muted: boolean }
    },
    enabled: !!deviceId,
    refetchInterval: 3000,
  })
}
