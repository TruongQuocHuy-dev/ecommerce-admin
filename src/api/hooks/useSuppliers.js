import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../client'
import { ENDPOINTS } from '../endpoints'

export const useSuppliers = () => {
    return useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const response = await api.get(ENDPOINTS.SUPPLIERS.LIST)
            return response.data?.data?.suppliers || []
        },
    })
}

export const useCreateSupplier = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(ENDPOINTS.SUPPLIERS.CREATE, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['suppliers'])
            toast.success('Supplier created successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to create supplier'),
    })
}

export const useUpdateSupplier = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await api.put(ENDPOINTS.SUPPLIERS.UPDATE(id), data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['suppliers'])
            toast.success('Supplier updated successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to update supplier'),
    })
}

export const useDeleteSupplier = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id) => {
            await api.delete(ENDPOINTS.SUPPLIERS.DELETE(id))
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['suppliers'])
            toast.success('Supplier deleted successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete supplier'),
    })
}
