import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface SystemStatus {
  uptime_seconds: number
  version: string
  base_url: string
  data_dir: string
  spotify_configured: boolean
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const res = await apiClient.get<SystemStatus>('/system/status')
      return res.data
    },
  })
}

export function useNetworkScan() {
  return useQuery({
    queryKey: ['network-scan'],
    queryFn: async () => {
      const res = await apiClient.post('/network/scan')
      return res.data as any[]
    },
    enabled: false,
  })
}
