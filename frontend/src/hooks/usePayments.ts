import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys, getInvalidationKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

export interface WalletBalance {
  coin_balance: number
  user_id: string
}

export interface Transaction {
  id: string
  user_id: string
  transaction_type: 'topup' | 'purchase'
  amount: number
  stripe_session_id?: string
  book_id?: string
  chapter_id?: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  book_title?: string
  chapter_title?: string
}

export interface TransactionListResponse {
  transactions: Transaction[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PurchaseRequest {
  book_id?: string
  chapter_id?: string
  amount: number
}

export interface TopUpRequest {
  amount: number // Amount in coins to purchase
}

// Wallet balance query
export function useWalletBalance() {
  return useQuery({
    queryKey: queryKeys.payments.wallet(),
    queryFn: async (): Promise<WalletBalance> => {
      const response = await api.get('/api/v1/wallet')
      return response.data
    },
    staleTime: 30 * 1000, // 30 seconds - wallet balance should be fresh
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// Transaction history query
export function useTransactions(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.payments.transactions(page, limit),
    queryFn: async (): Promise<TransactionListResponse> => {
      const response = await api.get(`/api/v1/transactions?page=${page}&limit=${limit}`)
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Top up wallet mutation
export function useTopUpWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: TopUpRequest): Promise<{ checkout_url: string }> => {
      const response = await api.post('/api/v1/wallet/topup', request)
      return response.data
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.checkout_url
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create checkout session')
    },
  })
}

// Purchase content mutation
export function usePurchaseContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: PurchaseRequest): Promise<Transaction> => {
      const response = await api.post('/api/v1/purchases', request)
      return response.data
    },
    onMutate: async (request) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.payments.wallet() })

      // Optimistically update wallet balance
      queryClient.setQueryData(
        queryKeys.payments.wallet(),
        (oldData: WalletBalance | undefined) => {
          if (oldData) {
            return {
              ...oldData,
              coin_balance: Math.max(0, oldData.coin_balance - request.amount),
            }
          }
          return oldData
        }
      )

      return { previousBalance: queryClient.getQueryData(queryKeys.payments.wallet()) }
    },
    onSuccess: (transaction, request) => {
      // Invalidate wallet balance to get fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.wallet() })
      
      // Invalidate transaction history
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.transactions() })
      
      // Invalidate library if book was purchased
      if (request.book_id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.library.all })
      }
      
      // Show success message
      if (request.book_id) {
        toast.success('Book purchased successfully!')
      } else if (request.chapter_id) {
        toast.success('Chapter purchased successfully!')
      }
    },
    onError: (error: any, request, context) => {
      // Revert optimistic update
      if (context?.previousBalance) {
        queryClient.setQueryData(queryKeys.payments.wallet(), context.previousBalance)
      }
      
      const message = error.response?.data?.detail || 'Purchase failed'
      
      // Handle insufficient funds
      if (error.response?.status === 400 && message.includes('insufficient')) {
        toast.error('Insufficient coins. Please top up your wallet.', {
          action: {
            label: 'Top Up',
            onClick: () => {
              // This could trigger a top-up modal or redirect
              console.log('Redirect to top-up')
            },
          },
        })
      } else {
        toast.error(message)
      }
    },
  })
}

// Check if user can afford content
export function useCanAfford(amount: number) {
  const { data: wallet } = useWalletBalance()
  
  return {
    canAfford: wallet ? wallet.coin_balance >= amount : false,
    shortfall: wallet ? Math.max(0, amount - wallet.coin_balance) : amount,
    balance: wallet?.coin_balance || 0,
  }
}

// Webhook handler for successful payments (called from success page)
export function useHandlePaymentSuccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string): Promise<Transaction> => {
      const response = await api.post('/api/v1/wallet/payment-success', {
        session_id: sessionId
      })
      return response.data
    },
    onSuccess: (transaction) => {
      // Invalidate wallet balance to get fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.wallet() })
      
      // Invalidate transaction history
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.transactions() })
      
      toast.success(`Successfully added ${transaction.amount} coins to your wallet!`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to process payment')
    },
  })
}

// Get pricing for content
export function useContentPricing(bookId?: string, chapterId?: string) {
  return useQuery({
    queryKey: ['content-pricing', bookId, chapterId],
    queryFn: async (): Promise<{ price: number; type: 'free' | 'fixed' | 'per_chapter' }> => {
      const params = new URLSearchParams()
      if (bookId) params.append('book_id', bookId)
      if (chapterId) params.append('chapter_id', chapterId)
      
      const response = await api.get(`/api/v1/pricing?${params}`)
      return response.data
    },
    enabled: !!(bookId || chapterId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Check if user has access to content
export function useContentAccess(bookId?: string, chapterId?: string) {
  return useQuery({
    queryKey: ['content-access', bookId, chapterId],
    queryFn: async (): Promise<{ has_access: boolean; reason?: string }> => {
      const params = new URLSearchParams()
      if (bookId) params.append('book_id', bookId)
      if (chapterId) params.append('chapter_id', chapterId)
      
      const response = await api.get(`/api/v1/access?${params}`)
      return response.data
    },
    enabled: !!(bookId || chapterId),
    staleTime: 1 * 60 * 1000, // 1 minute - access should be fresh
  })
}