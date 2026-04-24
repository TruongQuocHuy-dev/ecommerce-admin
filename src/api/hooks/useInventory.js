import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../client'
import { ENDPOINTS } from '../endpoints'

export const useInventoryOverview = (params = {}) => {
    return useQuery({
        queryKey: ['inventory-overview', params],
        queryFn: async () => {
            const response = await api.get(ENDPOINTS.INVENTORY.OVERVIEW, { params })
            return response.data?.data || null
        },
    })
}

export const useWarehouses = () => {
    return useQuery({
        queryKey: ['inventory-warehouses'],
        queryFn: async () => {
            const response = await api.get(ENDPOINTS.INVENTORY.WAREHOUSES)
            return response.data?.data?.warehouses || []
        },
    })
}

export const useCreateWarehouse = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(ENDPOINTS.INVENTORY.WAREHOUSES, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['inventory-overview'])
            queryClient.invalidateQueries(['inventory-warehouses'])
            toast.success('Warehouse created successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to create warehouse'),
    })
}

export const useUpdateWarehouse = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await api.put(ENDPOINTS.INVENTORY.WAREHOUSE_DETAIL(id), data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['inventory-overview'])
            queryClient.invalidateQueries(['inventory-warehouses'])
            toast.success('Warehouse updated successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to update warehouse'),
    })
}

export const useCreateMovement = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post(ENDPOINTS.INVENTORY.MOVEMENTS, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['inventory-overview'])
            queryClient.invalidateQueries(['inventory-warehouses'])
            toast.success('Inventory movement recorded successfully')
        },
        onError: (error) => toast.error(error.response?.data?.message || 'Failed to record inventory movement'),
    })
}