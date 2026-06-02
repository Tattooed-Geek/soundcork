import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface Group {
  id: string
  name: string
  master_id: string
  left_id: string
  left_ip: string
  right_id: string
  right_ip: string
}

export function useGroups(accountId: string | undefined) {
  return useQuery({
    queryKey: ['groups', accountId],
    queryFn: async () => {
      const res = await apiClient.get<Group[]>(`/accounts/${accountId}/groups`)
      return res.data
    },
    enabled: !!accountId,
  })
}

export function useCreateGroup(accountId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; left_id: string; right_id: string }) => {
      const res = await apiClient.post(`/accounts/${accountId}/groups`, payload)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', accountId] }),
  })
}

export function useDeleteGroup(accountId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (groupId: string) => {
      await apiClient.delete(`/accounts/${accountId}/groups/${groupId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', accountId] }),
  })
}
