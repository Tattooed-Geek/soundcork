import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface Preset {
  id: string
  name: string
  source: string
  type: string
  location: string
  container_art: string
  source_account?: string
  source_id?: string | null
  is_presetable?: string | null
  account?: string
}

export function usePresets(accountId?: string) {
  return useQuery({
    queryKey: ['presets', accountId],
    queryFn: async () => {
      if (!accountId) return [] as Preset[]
      const res = await apiClient.get(`/accounts/${accountId}/presets`)
      return res.data as Preset[]
    },
    enabled: !!accountId,
  })
}

export function useUpdatePreset(accountId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (p: Preset) => {
      const res = await apiClient.put(`/accounts/${accountId}/presets/${p.id}`, p)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presets', accountId] }),
  })
}

export function useDeletePreset(accountId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (presetId: string) => {
      const res = await apiClient.delete(`/accounts/${accountId}/presets/${presetId}`)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presets', accountId] }),
  })
}
