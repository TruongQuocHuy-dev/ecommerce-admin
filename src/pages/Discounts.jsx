import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Ticket, Calendar, Search, CheckCircle, XCircle, Clock, AlertTriangle, Sparkles, Shield, Store, Eye, Percent, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import DiscountModal from '../components/discounts/DiscountModal';
import DiscountUsageModal from '../components/discounts/DiscountUsageModal';
import clsx from 'clsx';

const Discounts = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [scopeFilter, setScopeFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    
    // Usage History Modal state
    const [selectedDiscountForHistory, setSelectedDiscountForHistory] = useState(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    
    const queryClient = useQueryClient();

    // Fetch discounts with filters
    const { data, isLoading } = useQuery({
        queryKey: ['discounts', { page, search, typeFilter, statusFilter, scopeFilter }],
        queryFn: async () => {
            const params = new URLSearchParams({
                page,
                limit: 10,
                ...(search && { search }),
                ...(typeFilter !== 'all' && { type: typeFilter }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(scopeFilter !== 'all' && { scope: scopeFilter }),
            });
            const response = await api.get(`/discounts?${params}`);
            return response.data?.data || { discounts: [], pagination: {} };
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/discounts/${id}`),
        onSuccess: () => {
            toast.success(t('discounts.toast.deleted'));
            queryClient.invalidateQueries(['discounts']);
        },
        onError: () => toast.error(t('toast.error')),
    });

    // Toggle status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, isActive }) => {
            const response = await api.patch(`/discounts/${id}`, { isActive });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Đã cập nhật trạng thái');
            queryClient.invalidateQueries(['discounts']);
            setOpenDropdownId(null);
        },
        onError: (error) => {
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

    // Quick Statistics computations for current page
    const totalCount = pagination.totalItems || 0;
    const activeCount = discounts.filter(d => {
        const now = new Date();
        const end = new Date(d.endDate);
        return d.isActive && end >= now;
    }).length;
    const systemCount = discounts.filter(d => d.scope === 'system').length;
    const sellerCount = discounts.filter(d => d.scope === 'shop').length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* CommandCenter Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_28%)] animate-pulse" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200 backdrop-blur">
                            {t('discounts.commandCenter')}
                        </span>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl flex items-center gap-2">
                            {t('discounts.title')}
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
                            {t('discounts.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingDiscount(null);
                            setModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-purple-500/20 transition-transform hover:-translate-y-0.5 hover:bg-purple-50"
                    >
                        <Plus className="w-4 h-4" />
                        {t('discounts.addDiscount')}
                    </button>
                </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Coupons */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <Ticket className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">{t('discounts.stats.total')}</div>
                        <div className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</div>
                    </div>
                </div>

                {/* Active Coupons */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">{t('discounts.stats.active')}</div>
                        <div className="text-2xl font-bold text-slate-900 mt-0.5">{activeCount}</div>
                    </div>
                </div>

                {/* System Coupons */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">{t('discounts.stats.system')}</div>
                        <div className="text-2xl font-bold text-slate-900 mt-0.5">{systemCount}</div>
                    </div>
                </div>

                {/* Seller Coupons */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <Store className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">{t('discounts.stats.seller')}</div>
                        <div className="text-2xl font-bold text-slate-900 mt-0.5">{sellerCount}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                {/* Search */}
                <div className="relative md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('discounts.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all text-slate-900 placeholder-slate-500"
                    />
                </div>

                {/* Scope Filter */}
                <select
                    value={scopeFilter}
                    onChange={(e) => setScopeFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all text-slate-900"
                >
                    <option value="all">{t('discounts.allScopes')}</option>
                    <option value="system">{t('discounts.scopeSystem')}</option>
                    <option value="shop">{t('discounts.scopeShop')}</option>
                </select>

                {/* Type Filter */}
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all text-slate-900"
                >
                    <option value="all">{t('discounts.allTypes')}</option>
                    <option value="percentage">{t('discounts.types.percentage')}</option>
                    <option value="fixed">{t('discounts.types.fixed')}</option>
                </select>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all text-slate-900"
                >
                    <option value="all">{t('discounts.allStatus')}</option>
                    <option value="active">{t('discounts.status.active')}</option>
                    <option value="inactive">{t('discounts.status.inactive')}</option>
                    <option value="expired">{t('discounts.status.expired')}</option>
                </select>
            </div>

            {/* Discounts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed min-w-[950px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">{t('discounts.tableHeaders.code')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[18%]">{t('discounts.tableHeaders.name')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">{t('discounts.tableHeaders.scope')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">{t('discounts.tableHeaders.type')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[10%]">{t('discounts.tableHeaders.value')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">{t('discounts.tableHeaders.usage')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">{t('discounts.tableHeaders.validUntil')}</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">{t('discounts.tableHeaders.status')}</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-[12%]">{t('discounts.tableHeaders.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={9} className="px-6 py-6">
                                            <div className="h-12 bg-slate-50 rounded-xl animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : discounts.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center">
                                        <div className="max-w-md mx-auto">
                                            <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                            <p className="text-slate-600 font-semibold text-lg">{t('discounts.noDiscounts')}</p>
                                            <p className="text-slate-400 text-sm mt-1">Hãy tạo mã giảm giá mới để bắt đầu chương trình thu hút khách hàng.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                discounts.map((discount) => {
                                    const statusConfig = getStatusConfig(discount);
                                    const StatusIcon = statusConfig.icon;
                                    const usagePercent = getUsagePercentage(discount);

                                    return (
                                        <tr key={discount.id || discount._id} className="hover:bg-slate-50/50 transition-colors">
                                            {/* Code */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-purple-50 border border-purple-100 text-purple-700 px-2.5 py-1.5 rounded-xl text-center font-mono font-bold text-xs tracking-wider shadow-sm">
                                                        {discount.code}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Name */}
                                            <td className="px-6 py-4">
                                                <div className="truncate">
                                                    <div className="font-semibold text-slate-900 truncate" title={discount.name}>
                                                        {discount.name}
                                                    </div>
                                                    {discount.description && (
                                                        <div className="text-xs text-slate-500 truncate" title={discount.description}>
                                                            {discount.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Scope */}
                                            <td className="px-6 py-4">
                                                {discount.scope === 'system' ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">
                                                        <Shield className="w-3.5 h-3.5" />
                                                        <span>{t('discounts.scopeSystem')}</span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">
                                                            <Store className="w-3.5 h-3.5" />
                                                            <span>{t('discounts.scopeShop')}</span>
                                                        </div>
                                                        <div className="text-xs font-medium text-slate-600 truncate max-w-[130px]" title={discount.shopId?.name || 'N/A'}>
                                                            {discount.shopId?.name || 'Seller Shop'}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Type */}
                                            <td className="px-6 py-4">
                                                <span className={clsx(
                                                    'inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border',
                                                    discount.type === 'percentage'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : discount.type === 'fixed'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-orange-50 text-orange-700 border-orange-200'
                                                )}>
                                                    {t(`discounts.types.${discount.type}`)}
                                                </span>
                                            </td>

                                            {/* Value */}
                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value?.toLocaleString('vi-VN')} đ`}
                                            </td>

                                            {/* Usage */}
                                            <td className="px-6 py-4">
                                                <div className="space-y-1.5">
                                                    <div className="text-xs font-semibold text-slate-700">
                                                        {discount.usageCount || 0} / {discount.usageLimit || '∞'}
                                                    </div>
                                                    {discount.usageLimit && (
                                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={clsx(
                                                                    'h-full transition-all',
                                                                    usagePercent >= 90 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                                                                )}
                                                                style={{ width: `${usagePercent}%` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Valid Until */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium">
                                                        {new Date(discount.endDate).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center">
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === discount.id ? null : discount.id)}
                                                            className={clsx(
                                                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer hover:opacity-85 shadow-sm transition-all',
                                                                statusConfig.color
                                                            )}
                                                            title="Thay đổi trạng thái hoạt động"
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

                                                                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20">
                                                                    <button
                                                                        onClick={() => {
                                                                            toggleStatusMutation.mutate({
                                                                                id: discount.id,
                                                                                isActive: !discount.isActive
                                                                            });
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 text-slate-700 font-medium"
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

                                            {/* Actions */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* View Usage History */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedDiscountForHistory(discount);
                                                            setHistoryModalOpen(true);
                                                        }}
                                                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors"
                                                        title={t('discounts.usageHistory')}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {/* Edit */}
                                                    <button
                                                        onClick={() => {
                                                            setEditingDiscount(discount);
                                                            setModalOpen(true);
                                                        }}
                                                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(t('discounts.confirmDelete'))) {
                                                                deleteMutation.mutate(discount.id);
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-red-50 rounded-xl text-red-600 transition-colors"
                                                        title="Vô hiệu hóa/Xóa"
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
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-600">
                        {t('common.page')} {page} / {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm text-slate-700"
                        >
                            {t('common.previous')}
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= pagination.totalPages}
                            className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm text-slate-700"
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

            {/* Usage History Modal */}
            <DiscountUsageModal
                isOpen={historyModalOpen}
                onClose={() => {
                    setHistoryModalOpen(false);
                    setSelectedDiscountForHistory(null);
                }}
                discountId={selectedDiscountForHistory?.id || selectedDiscountForHistory?._id}
                discountCode={selectedDiscountForHistory?.code}
            />
        </div>
    );
};

export default Discounts;
