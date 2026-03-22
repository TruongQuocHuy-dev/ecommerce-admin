import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../client'
import { ENDPOINTS } from '../endpoints'
import toast from 'react-hot-toast'

export const useUsers = (page = 1, limit = 10, search = '') => {
    return useQuery({
        queryKey: ['users', page, limit, search],
        queryFn: async () => {
            try {
                const response = await api.get(`${ENDPOINTS.USERS.LIST}?page=${page}&limit=${limit}&search=${search}`)
                return response.data?.data || { users: [], pagination: {} }
            } catch (error) {
                console.error('Failed to fetch users', error)
                throw error
            }
        },
        keepPreviousData: true,
    })
}

export const useUser = (id) => {
    return useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            const response = await api.get(ENDPOINTS.USERS.DETAIL(id))
            return response.data.data
        },
        enabled: !!id,
    })
}

export const useUpdateUser = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await api.put(ENDPOINTS.USERS.UPDATE(id), data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users'])
            toast.success('User updated successfully')
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update user')
        }
    })
}

export const useDeleteUser = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id) => {
            await api.delete(ENDPOINTS.USERS.DELETE(id))
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users'])
            toast.success('User deleted successfully')
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to delete user')
        }
    })
}
