import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../client'
import { ENDPOINTS } from '../endpoints'
import toast from 'react-hot-toast'

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            try {
                const response = await api.get(ENDPOINTS.CATEGORIES.LIST)
                // Backend returns { categories: [...], totalCount: number }
                return response.data?.data?.categories || []
            } catch (error) {
                console.error('Failed to fetch categories', error)
                throw error
            }
        },
    })
}

export const useCreateCategory = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data) => {
            // Check if data is FormData to set correct headers
            const isFormData = data instanceof FormData
            const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {}

            const response = await api.post(ENDPOINTS.CATEGORIES.CREATE, data, { headers })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['categories'])
            toast.success('Category created successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to create category')
    })
}

export const useUpdateCategory = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }) => {
            const isFormData = data instanceof FormData
            const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {}

            const response = await api.put(ENDPOINTS.CATEGORIES.UPDATE(id), data, { headers })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['categories'])
            toast.success('Category updated successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to update category')
    })
}

export const useDeleteCategory = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id) => {
            await api.delete(ENDPOINTS.CATEGORIES.DELETE(id))
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['categories'])
            toast.success('Category deleted successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete category')
    })
}
