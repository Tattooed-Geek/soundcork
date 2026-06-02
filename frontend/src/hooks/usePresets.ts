import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface Preset {
  id: string
  name: string
  source: string
  type: string
  location: string
  container_art: string | null
}

export function usePresets(accountId: string | undefined) {
  return useQuery({
    queryKey: ['presets', accountId],
    queryFn: async () => {
      const res = await apiClient.get<Preset[]>(`/accounts/${accountId}/presets`)
      return res.data
    },
    enabled: !!accountId,
  })
}

export function useUpdatePreset(accountId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (preset: Preset) => {
      const res = await apiClient.put<Preset>(`/accounts/${accountId}/presets/${preset.id}`, preset)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presets', accountId] }),
  })
}

export function useDeletePreset(accountId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (presetId: string) => {
      await apiClient.delete(`/accounts/${accountId}/presets/${presetId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['presets', accountId] }),
  })
}
