import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../client'
import { ENDPOINTS } from '../endpoints'
import toast from 'react-hot-toast'

export const useOrders = (page = 1, limit = 10, status = '', userId = '') => {
    return useQuery({
        queryKey: ['orders', page, limit, status, userId],
        queryFn: async () => {
            try {
                const params = new URLSearchParams({ page, limit })
                if (status) params.append('status', status)
                if (userId) params.append('userId', userId)
                const response = await api.get(`/orders?${params}`)
                return response.data?.data || { orders: [], pagination: {} }
            } catch (error) {
                console.error('Failed to fetch orders', error)
                return { orders: [], pagination: {} }
            }
        },
        keepPreviousData: true
    })
}

export const useOrder = (id) => {
    return useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            const response = await api.get(`/orders/${id}`)
            return response.data?.data?.order
        },
        enabled: !!id
    })
}

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, status }) => {
            const response = await api.put(ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['orders'])
            queryClient.invalidateQueries(['order'])
            toast.success('Order status updated')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to update status')
    })
}

export const useBulkUpdateOrderStatus = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ ids, status }) => {
            const response = await api.put(ENDPOINTS.ORDERS.BULK_STATUS, { ids, status })
            return response.data.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['orders'])
            toast.success(`Updated ${data.ids?.length || 'orders'} successfully`)
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to update orders')
    })
}

export const useCancelOrder = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id) => {
            const response = await api.delete(ENDPOINTS.ORDERS.CANCEL(id))
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['orders'])
            queryClient.invalidateQueries(['order'])
        },
    })
}
