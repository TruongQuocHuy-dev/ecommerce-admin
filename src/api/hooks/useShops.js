import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import { ENDPOINTS } from '../endpoints';
import toast from 'react-hot-toast';

// Get all shops
export const useShops = (filters = {}) => {
    return useQuery({
        queryKey: ['shops', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
            if (filters.page) params.append('page', filters.page);
            if (filters.limit) params.append('limit', filters.limit);

            const response = await api.get(`${ENDPOINTS.SHOPS.LIST}?${params}`);
            return response.data?.data || {};
        },
    });
};

// Get single shop
export const useShop = (shopId) => {
    return useQuery({
        queryKey: ['shop', shopId],
        queryFn: async () => {
            const response = await api.get(ENDPOINTS.SHOPS.DETAIL(shopId));
            return response.data?.data;
        },
        enabled: !!shopId,
    });
};

// Get shop stats
export const useShopStats = () => {
    return useQuery({
        queryKey: ['shopStats'],
        queryFn: async () => {
            const response = await api.get(ENDPOINTS.SHOPS.STATS);
            return response.data?.data;
        },
    });
};

// Get shop revenue
export const useShopRevenue = (shopId, filters = {}) => {
    return useQuery({
        queryKey: ['shopRevenue', shopId, filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await api.get(
                `${ENDPOINTS.SHOPS.REVENUE(shopId)}?${params}`
            );
            return response.data?.data;
        },
        enabled: !!shopId,
    });
};

// Create shop
export const useCreateShop = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (shopData) => {
            const response = await api.post(ENDPOINTS.SHOPS.CREATE, shopData);
            return response.data?.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            queryClient.invalidateQueries({ queryKey: ['shopStats'] });
            toast.success('Shop created successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create shop');
        },
    });
};

// Update shop
export const useUpdateShop = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ shopId, data }) => {
            const response = await api.patch(ENDPOINTS.SHOPS.UPDATE(shopId), data);
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            queryClient.invalidateQueries({ queryKey: ['shop', variables.shopId] });
            toast.success('Shop updated successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update shop');
        },
    });
};

// Approve shop
export const useApproveShop = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (shopId) => {
            const response = await api.patch(ENDPOINTS.SHOPS.APPROVE(shopId));
            return response.data?.data;
        },
        onSuccess: (_, shopId) => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            queryClient.invalidateQueries({ queryKey: ['shop', shopId] });
            queryClient.invalidateQueries({ queryKey: ['shopStats'] });
            toast.success('Shop approved successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to approve shop');
        },
    });
};

// Reject shop
export const useRejectShop = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ shopId, reason }) => {
            const response = await api.patch(ENDPOINTS.SHOPS.REJECT(shopId), { reason });
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            queryClient.invalidateQueries({ queryKey: ['shop', variables.shopId] });
            queryClient.invalidateQueries({ queryKey: ['shopStats'] });
            toast.success('Shop rejected');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to reject shop');
        },
    });
};

// Suspend shop
export const useSuspendShop = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ shopId, reason }) => {
            const response = await api.patch(ENDPOINTS.SHOPS.SUSPEND(shopId), { reason });
            return response.data?.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            queryClient.invalidateQueries({ queryKey: ['shop', variables.shopId] });
            queryClient.invalidateQueries({ queryKey: ['shopStats'] });
            toast.success('Shop suspended');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to suspend shop');
        },
    });
};

// Reactivate shop
export const useReactivateShop = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (shopId) => {
            const response = await api.patch(ENDPOINTS.SHOPS.REACTIVATE(shopId));
            return response.data?.data;
        },
        onSuccess: (_, shopId) => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            queryClient.invalidateQueries({ queryKey: ['shop', shopId] });
            queryClient.invalidateQueries({ queryKey: ['shopStats'] });
            toast.success('Shop reactivated successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to reactivate shop');
        },
    });
};

// Delete shop
export const useDeleteShop = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (shopId) => {
            const response = await api.delete(ENDPOINTS.SHOPS.DELETE(shopId));
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            queryClient.invalidateQueries({ queryKey: ['shopStats'] });
            toast.success('Shop deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete shop');
        },
    });
};
