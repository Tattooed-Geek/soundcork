import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface CommandPayload {
  action: string
  value?: string
  content_item_id?: string
}

export interface NowPlayingData {
  track?: string
  artist?: string
  album?: string
  station?: string
  art?: string
  play_state?: string
  source?: string
}

export interface VolumeData {
  volume?: number
  muted?: boolean
  target?: string | null
}

export function useNowPlaying(deviceId?: string) {
  return useQuery({
    queryKey: ['nowplaying', deviceId],
    queryFn: async () => {
      const res = await apiClient.get(`/devices/${deviceId}/now-playing`)
      return res.data as NowPlayingData
    },
    enabled: !!deviceId,
    refetchInterval: 3000,
  })
}

export function useVolume(deviceId?: string) {
  return useQuery({
    queryKey: ['volume', deviceId],
    queryFn: async () => {
      const res = await apiClient.get(`/devices/${deviceId}/volume`)
      return res.data as VolumeData
    },
    enabled: !!deviceId,
    refetchInterval: 4000,
  })
}

export function useBass(deviceId?: string) {
  return useQuery({
    queryKey: ['bass', deviceId],
    queryFn: async () => {
      const res = await apiClient.get(`/devices/${deviceId}/bass`)
      return res.data as { level?: number | null; target?: number | null; min?: number; max?: number; available?: boolean }
    },
    enabled: !!deviceId,
    refetchInterval: 5000,
    retry: false,
  })
}

export function useSendCommand(deviceId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CommandPayload) => {
      const res = await apiClient.post(`/devices/${deviceId}/command`, payload)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nowplaying', deviceId] })
      qc.invalidateQueries({ queryKey: ['volume', deviceId] })
    },
  })
}

export function useSetBass(deviceId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (level: number) => {
      const res = await apiClient.post(`/devices/${deviceId}/bass`, { level })
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bass', deviceId] }),
  })
}

export function useSendKey(deviceId?: string) {
  return useMutation({
    mutationFn: async (key: string) => {
      const res = await apiClient.post(`/devices/${deviceId}/key`, { key })
      return res.data
    },
  })
}
