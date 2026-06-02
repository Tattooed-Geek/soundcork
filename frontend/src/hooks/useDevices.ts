import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface Device {
  id: string
  ip: string
  name: string
  online: boolean
  account: string | null
  in_soundcork: boolean
  marge_server: string
  reachable: boolean
  language_code: string | null
  product_code: string | null
  firmware_version: string | null
}

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await apiClient.get<Device[]>('/devices')
      return res.data
    },
    refetchInterval: 5000,
  })
}

export function useDeviceDetail(deviceId: string | undefined) {
  return useQuery({
    queryKey: ['device', deviceId],
    queryFn: async () => {
      const res = await apiClient.get<Device>(`/devices/${deviceId}`)
      return res.data
    },
    enabled: !!deviceId,
    refetchInterval: 5000,
  })
}
