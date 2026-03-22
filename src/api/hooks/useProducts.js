import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../client'
import { ENDPOINTS } from '../endpoints'
import toast from 'react-hot-toast'

export const useProducts = (page = 1, limit = 10, search = '', category = '') => {
    return useQuery({
        queryKey: ['products', page, limit, search, category],
        queryFn: async () => {
            try {
                const params = new URLSearchParams({ page, limit })
                if (search) params.append('search', search)
                if (category) params.append('category', category)

                const response = await api.get(`${ENDPOINTS.PRODUCTS.LIST}?${params}`)
                return response.data?.data || { products: [], pagination: {} }
            } catch (error) {
                console.error('Failed to fetch products', error)
                throw error
            }
        },
        keepPreviousData: true,
    })
}

export const useCreateProduct = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(ENDPOINTS.PRODUCTS.CREATE, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            toast.success('Product created successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to create product')
    })
}

export const useUpdateProduct = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }) => {
            const isFormData = data instanceof FormData
            const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {}

            const response = await api.put(ENDPOINTS.PRODUCTS.UPDATE(id), data, { headers })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            toast.success('Product updated successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to update product')
    })
}

export const useDeleteProduct = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id) => {
            await api.delete(ENDPOINTS.PRODUCTS.DELETE(id))
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            toast.success('Product deleted successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete product')
    })
}

export const useBulkDeleteProducts = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (ids) => {
            await api.post(ENDPOINTS.PRODUCTS.BULK_DELETE, { ids })
            return ids
        },
        onSuccess: (ids) => {
            queryClient.invalidateQueries(['products'])
            toast.success(`${ids.length} products deleted successfully`)
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete products')
    })
}

export const useApproveProduct = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id) => {
            const response = await api.post(ENDPOINTS.PRODUCTS.APPROVE(id))
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            toast.success('Product approved successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to approve product')
    })
}

export const useRejectProduct = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, details }) => {
            const response = await api.post(ENDPOINTS.PRODUCTS.REJECT(id), { reason: details })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            toast.success('Product rejected successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to reject product')
    })
}
