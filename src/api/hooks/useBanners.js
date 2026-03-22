import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../client'
import { ENDPOINTS } from '../endpoints'
import toast from 'react-hot-toast'

export const useBanners = () => {
    return useQuery({
        queryKey: ['banners'],
        queryFn: async () => {
            try {
                const response = await api.get(ENDPOINTS.SETTINGS.BANNERS)
                return response.data?.data || []
            } catch (error) {
                console.error('Failed to fetch banners', error)
                throw error
            }
        },
    })
}

export const useCreateBanner = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data) => {
            const isFormData = data instanceof FormData
            const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {}

            const response = await api.post(ENDPOINTS.SETTINGS.BANNERS, data, { headers })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['banners'])
            toast.success('Banner created successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to create banner')
    })
}

export const useUpdateBanner = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }) => {
            const isFormData = data instanceof FormData
            const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {}

            const response = await api.put(ENDPOINTS.SETTINGS.BANNER_DETAIL(id), data, { headers })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['banners'])
            toast.success('Banner updated successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to update banner')
    })
}

export const useDeleteBanner = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id) => {
            await api.delete(ENDPOINTS.SETTINGS.BANNER_DETAIL(id))
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['banners'])
            toast.success('Banner deleted successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete banner')
    })
}

export const useReorderBanners = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (orderedIds) => {
            const response = await api.put(ENDPOINTS.SETTINGS.BANNER_REORDER, { orderedIds })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['banners'])
            toast.success('Banners reordered successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to reorder banners')
    })
}
