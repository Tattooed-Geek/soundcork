import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface Source {
  id: string
  display_name: string
  source_key_type: string
  source_key_account: string
}

export function useSources(accountId: string | undefined) {
  return useQuery({
    queryKey: ['sources', accountId],
    queryFn: async () => {
      const res = await apiClient.get<Source[]>(`/accounts/${accountId}/sources`)
      return res.data
    },
    enabled: !!accountId,
  })
}

export function useAddSource(accountId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (source: any) => {
      const res = await apiClient.post(`/accounts/${accountId}/sources`, source)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sources', accountId] }),
  })
}

export function useDeleteSource(accountId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sourceId: string) => {
      await apiClient.delete(`/accounts/${accountId}/sources/${sourceId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sources', accountId] }),
  })
}

export function useAllSources() {
  return useQuery({
    queryKey: ['all-sources'],
    queryFn: async () => {
      // We'll aggregate from known accounts if needed; for now stub
      return [] as Source[]
    },
  })
}
