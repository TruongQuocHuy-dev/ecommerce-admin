import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../client'
import { ENDPOINTS } from '../endpoints'

export const useBrands = () => {
    return useQuery({
        queryKey: ['brands'],
        queryFn: async () => {
            const response = await api.get(ENDPOINTS.BRANDS.LIST)
            return response.data?.data?.brands || []
        },
    })
}

export const useCreateBrand = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(ENDPOINTS.BRANDS.CREATE, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['brands'])
            toast.success('Brand created successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to create brand'),
    })
}

export const useUpdateBrand = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await api.put(ENDPOINTS.BRANDS.UPDATE(id), data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['brands'])
            toast.success('Brand updated successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to update brand'),
    })
}

export const useDeleteBrand = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id) => {
            await api.delete(ENDPOINTS.BRANDS.DELETE(id))
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['brands'])
            toast.success('Brand deleted successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete brand'),
    })
}
