import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/client'

export interface Account {
  id: string
  label: string
  device_count: number
}

export interface AccountDetail {
  id: string
  label: string
  devices: any[]
  presets: any[]
  sources: any[]
  recents: any[]
  groups: any[]
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await apiClient.get<Account[]>('/accounts')
      return res.data
    },
  })
}

export function useAccountDetail(accountId: string | undefined) {
  return useQuery({
    queryKey: ['account', accountId],
    queryFn: async () => {
      const res = await apiClient.get<AccountDetail>(`/accounts/${accountId}`)
      return res.data
    },
    enabled: !!accountId,
  })
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { account_id: string; account_name: string }) => {
      const res = await apiClient.post<Account>('/accounts', payload)
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (accountId: string) => {
      await apiClient.delete(`/accounts/${accountId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}
