import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Ticket, Calendar, Search, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import DiscountModal from '../components/discounts/DiscountModal';
import clsx from 'clsx';

const Discounts = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const queryClient = useQueryClient();

    // Fetch discounts with filters
    const { data, isLoading } = useQuery({
        queryKey: ['discounts', { page, search, typeFilter, statusFilter }],
        queryFn: async () => {
            const params = new URLSearchParams({
                page,
                limit: 10,
                ...(search && { search }),
                ...(typeFilter !== 'all' && { type: typeFilter }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
            });
            const response = await api.get(`/discounts?${params}`);
            return response.data?.data || { discounts: [], pagination: {} };
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/discounts/${id}`),
        onSuccess: () => {
            toast.success(t('discounts.toast.deactivated'));
            queryClient.invalidateQueries(['discounts']);
        },
        onError: () => toast.error(t('toast.error')),
    });

    // Toggle status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, isActive }) => {
            console.log('Sending PATCH request:', {
                url: `/discounts/${id}`,
                data: { isActive }
            });
            const response = await api.patch(`/discounts/${id}`, { isActive });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Đã cập nhật trạng thái');
            queryClient.invalidateQueries(['discounts']);
            setOpenDropdownId(null);
        },
        onError: (error) => {
            console.error('Toggle status error:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || t('toast.error'));
        },
    });

    const discounts = data?.discounts || [];
    const pagination = data?.pagination || {};

    // Status configuration
    const getStatusConfig = (discount) => {
        const now = new Date();
        const endDate = new Date(discount.endDate);
        const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        if (!discount.isActive) {
            return {
                label: t('discounts.status.inactive'),
                color: 'bg-slate-100 text-slate-700 border-slate-200',
                icon: XCircle,
            };
        }

        if (endDate < now) {
            return {
                label: t('discounts.status.expired'),
                color: 'bg-red-100 text-red-700 border-red-200',
                icon: AlertTriangle,
            };
        }

        if (daysUntilExpiry <= 7) {
            return {
                label: t('discounts.status.active'),
                color: 'bg-orange-100 text-orange-700 border-orange-200',
                icon: Clock,
                expiring: true,
            };
        }

        return {
            label: t('discounts.status.active'),
            color: 'bg-green-100 text-green-700 border-green-200',
            icon: CheckCircle,
        };
    };

    // Calculate usage percentage
    const getUsagePercentage = (discount) => {
        if (!discount.usageLimit) return 0;
        return Math.min(100, (discount.usageCount / discount.usageLimit) * 100);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('discounts.title')}</h1>
                <p className="text-slate-600 mt-1">{t('discounts.subtitle')}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('discounts.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                </div>

                {/* Type Filter */}
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                    <option value="all">{t('discounts.allTypes')}</option>
                    <option value="percentage">{t('discounts.types.percentage')}</option>
                    <option value="fixed">{t('discounts.types.fixed')}</option>
                </select>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                    <option value="all">{t('discounts.allStatus')}</option>
                    <option value="active">{t('discounts.status.active')}</option>
                    <option value="inactive">{t('discounts.status.inactive')}</option>
                    <option value="expired">{t('discounts.status.expired')}</option>
                </select>

                {/* Add Button */}
                <button
                    onClick={() => {
                        setEditingDiscount(null);
                        setModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white rounded-lg transition-all shadow-lg shadow-primary-500/20"
                >
                    <Plus className="w-4 h-4" />
                    {t('discounts.addDiscount')}
                </button>
            </div>

            {/* Discounts Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('discounts.tableHeaders.code')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('discounts.tableHeaders.name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('discounts.tableHeaders.type')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('discounts.tableHeaders.value')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('discounts.tableHeaders.usage')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('discounts.tableHeaders.validUntil')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{t('discounts.tableHeaders.status')}</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">{t('discounts.tableHeaders.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={8} className="px-6 py-4">
                                            <div className="h-12 bg-slate-100 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : discounts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500">{t('discounts.noDiscounts')}</p>
                                    </td>
                                </tr>
                            ) : (
                                discounts.map((discount) => {
                                    const statusConfig = getStatusConfig(discount);
                                    const StatusIcon = statusConfig.icon;
                                    const usagePercent = getUsagePercentage(discount);

                                    return (
                                        <tr key={discount.id || discount._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Ticket className="w-4 h-4 text-primary-600" />
                                                    <span className="font-mono font-medium text-slate-900">{discount.code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">{discount.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={clsx(
                                                    'inline-flex px-2.5 py-1 rounded-full text-xs font-medium border',
                                                    discount.type === 'percentage'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                )}>
                                                    {t(`discounts.types.${discount.type}`)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                {discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm text-slate-600">
                                                        {discount.usageCount || 0} / {discount.usageLimit || '∞'}
                                                    </div>
                                                    {discount.usageLimit && (
                                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                                                                style={{ width: `${usagePercent}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        {new Date(discount.endDate).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center">
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === discount.id ? null : discount.id)}
                                                            className={clsx(
                                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity',
                                                                statusConfig.color
                                                            )}
                                                            title="Click để thay đổi trạng thái"
                                                        >
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {statusConfig.label}
                                                        </button>

                                                        {openDropdownId === discount.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() => setOpenDropdownId(null)}
                                                                />

                                                                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                                                                    <button
                                                                        onClick={() => {
                                                                            console.log('Toggle status for discount:', {
                                                                                id: discount.id,
                                                                                current: discount.isActive,
                                                                                willBe: !discount.isActive
                                                                            });
                                                                            toggleStatusMutation.mutate({
                                                                                id: discount.id,
                                                                                isActive: !discount.isActive
                                                                            });
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                                                                    >
                                                                        {discount.isActive ? (
                                                                            <>
                                                                                <XCircle className="w-4 h-4 text-orange-600" />
                                                                                <span>Tạm ngừng</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                                                <span>Kích hoạt</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            console.log('Editing discount:', discount);
                                                            setEditingDiscount(discount);
                                                            setModalOpen(true);
                                                        }}
                                                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(t('discounts.confirmDelete'))) {
                                                                deleteMutation.mutate(discount.id);
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-600">
                        {t('common.page')} {page} / {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('common.previous')}
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= pagination.totalPages}
                            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {t('common.next')}
                        </button>
                    </div>
                </div>
            )}

            {/* Discount Modal */}
            <DiscountModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingDiscount(null);
                }}
                discount={editingDiscount}
            />
        </div>
    );
};

export default Discounts;
