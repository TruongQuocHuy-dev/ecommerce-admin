import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../client'
import { ENDPOINTS } from '../endpoints'
import toast from 'react-hot-toast'
import { useTranslation } from '../../i18n'

export const useProducts = (
    page = 1,
    limit = 10,
    search = '',
    category = '',
    approvalStatus = '',
    brand = '',
    supplier = ''
) => {
    return useQuery({
        queryKey: ['products', page, limit, search, category, approvalStatus, brand, supplier],
        queryFn: async () => {
            try {
                const params = new URLSearchParams({ page, limit })
                if (search) params.append('search', search)
                if (category) params.append('category', category)
                if (approvalStatus) params.append('approvalStatus', approvalStatus)
                if (brand) params.append('brand', brand)
                if (supplier) params.append('supplier', supplier)

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
    const { t } = useTranslation()
    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(ENDPOINTS.PRODUCTS.CREATE, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            toast.success(t('toast.productCreated'))
        },
        onError: (error) => toast.error(error.response?.data?.message || t('toast.productCreatedError'))
    })
}

export const useUpdateProduct = () => {
    const queryClient = useQueryClient()
    const { t } = useTranslation()
    return useMutation({
        mutationFn: async ({ id, data }) => {
            const isFormData = data instanceof FormData
            const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {}

            const response = await api.put(ENDPOINTS.PRODUCTS.UPDATE(id), data, { headers })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            toast.success(t('toast.productUpdated'))
        },
        onError: (error) => toast.error(error.response?.data?.message || t('toast.productUpdatedError'))
    })
}

export const useDeleteProduct = () => {
    const queryClient = useQueryClient()
    const { t } = useTranslation()
    return useMutation({
        mutationFn: async (id) => {
            await api.delete(ENDPOINTS.PRODUCTS.DELETE(id))
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            toast.success(t('toast.productDeleted'))
        },
        onError: (error) => toast.error(error.response?.data?.message || t('toast.productDeletedError'))
    })
}

export const useBulkDeleteProducts = () => {
    const queryClient = useQueryClient()
    const { t } = useTranslation()
    return useMutation({
        mutationFn: async (ids) => {
            await api.post(ENDPOINTS.PRODUCTS.BULK_DELETE, { ids })
            return ids
        },
        onSuccess: (ids) => {
            queryClient.invalidateQueries(['products'])
            toast.success(t('toast.bulkProductsDeleted', { count: ids.length }))
        },
        onError: (error) => toast.error(error.response?.data?.message || t('toast.bulkProductsDeletedError'))
    })
}

export const useApproveProduct = () => {
    const queryClient = useQueryClient()
    const { t } = useTranslation()
    return useMutation({
        mutationFn: async (id) => {
            const response = await api.post(ENDPOINTS.PRODUCTS.APPROVE(id))
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            toast.success(t('toast.productApproved'))
        },
        onError: (error) => toast.error(error.response?.data?.message || t('toast.productApprovedError'))
    })
}

export const useRejectProduct = () => {
    const queryClient = useQueryClient()
    const { t } = useTranslation()
    return useMutation({
        mutationFn: async ({ id, details }) => {
            const response = await api.post(ENDPOINTS.PRODUCTS.REJECT(id), { reason: details })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['products'])
            toast.success(t('toast.productRejected'))
        },
        onError: (error) => toast.error(error.response?.data?.message || t('toast.productRejectedError'))
    })
}
