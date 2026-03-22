import { useState } from 'react';
import { Search, Store, CheckCircle, XCircle, AlertCircle, Ban, RotateCcw, Trash2, DollarSign } from 'lucide-react';
import { useShops, useApproveShop, useRejectShop, useSuspendShop, useReactivateShop, useDeleteShop } from '../api/hooks/useShops';
import { useTranslation } from '../i18n/index.jsx';
import useAuthStore from '../store/useAuthStore';
import { PERMISSIONS, hasPermission } from '../utils/permissions';
import toast from 'react-hot-toast';

const statusConfig = {
    pending: {
        label: 'Chờ duyệt',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: AlertCircle,
    },
    approved: {
        label: 'Đã duyệt',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: CheckCircle,
    },
    rejected: {
        label: 'Từ chối',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle,
    },
    suspended: {
        label: 'Tạm ngừng',
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: Ban,
    },
};

const Sellers = () => {
    const { user: currentUser } = useAuthStore();
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [actionModal, setActionModal] = useState({ isOpen: false, type: null, shop: null });

    const canManageShops = hasPermission(currentUser?.role, PERMISSIONS.MANAGE_SELLERS);

    // Fetch shops
    const { data, isLoading } = useShops({
        search,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 12,
    });

    const shops = data?.shops || [];
    const totalPages = data?.pages || 1;

    // Mutations
    const approveMutation = useApproveShop();
    const rejectMutation = useRejectShop();
    const suspendMutation = useSuspendShop();
    const reactivateMutation = useReactivateShop();
    const deleteMutation = useDeleteShop();

    const handleAction = (type, shop) => {
        if (type === 'approve') {
            if (window.confirm(`Bạn có chắc muốn duyệt cửa hàng "${shop.name}"?`)) {
                approveMutation.mutate(shop._id);
            }
        } else if (type === 'reactivate') {
            if (window.confirm(`Bạn có chắc muốn kích hoạt lại cửa hàng "${shop.name}"?`)) {
                reactivateMutation.mutate(shop._id);
            }
        } else {
            setActionModal({ isOpen: true, type, shop });
        }
    };

    const confirmAction = () => {
        const { type, shop } = actionModal;
        const reason = document.getElementById('action-reason')?.value;

        if (!reason && (type === 'reject' || type === 'suspend')) {
            toast.error('Vui lòng nhập lý do');
            return;
        }

        if (type === 'reject') {
            rejectMutation.mutate({ shopId: shop._id, reason });
        } else if (type === 'suspend') {
            suspendMutation.mutate({ shopId: shop._id, reason });
        } else if (type === 'delete') {
            deleteMutation.mutate(shop._id);
        }

        setActionModal({ isOpen: false, type: null, shop: null });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('sellers.title')}</h1>
                <p className="text-slate-600 mt-1">{t('sellers.subtitle')}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm cửa hàng..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 placeholder-slate-500"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Từ chối</option>
                    <option value="suspended">Tạm ngừng</option>
                </select>
            </div>

            {/* Shop Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse">
                            <div className="h-24 bg-slate-200 rounded-lg mb-4" />
                            <div className="h-6 bg-slate-200 rounded mb-2" />
                            <div className="h-4 bg-slate-200 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            ) : shops.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                    <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg">Không tìm thấy cửa hàng</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shops.map((shop) => {
                        const StatusIcon = statusConfig[shop.status]?.icon;
                        return (
                            <div
                                key={shop._id}
                                className="bg-white rounded-xl p-6 border border-slate-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
                            >
                                {/* Shop Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                        {shop.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 mb-1">{shop.name}</h3>
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[shop.status]?.color}`}>
                                            {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                                            {statusConfig[shop.status]?.label}
                                        </div>
                                    </div>
                                </div>

                                {/* Shop Info */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Chủ shop:</span>
                                        <span className="font-medium text-slate-900">{shop.owner?.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Sản phẩm:</span>
                                        <span className="font-medium text-slate-900">{shop.totalProducts}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Doanh thu:</span>
                                        <span className="font-medium text-green-600">${shop.totalRevenue?.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {canManageShops && (
                                    <div className="flex gap-2 flex-wrap">
                                        {shop.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleAction('approve', shop)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Duyệt
                                                </button>
                                                <button
                                                    onClick={() => handleAction('reject', shop)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Từ chối
                                                </button>
                                            </>
                                        )}
                                        {shop.status === 'approved' && (
                                            <button
                                                onClick={() => handleAction('suspend', shop)}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
                                            >
                                                <Ban className="w-4 h-4" />
                                                Tạm ngừng
                                            </button>
                                        )}
                                        {shop.status === 'suspended' && (
                                            <button
                                                onClick={() => handleAction('reactivate', shop)}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                Kích hoạt
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleAction('delete', shop)}
                                            className="px-3 py-1.5 bg-slate-100 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Action Modal */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl animate-slide-up">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                            {actionModal.type === 'reject' && 'Từ chối cửa hàng'}
                            {actionModal.type === 'suspend' && 'Tạm ngừng cửa hàng'}
                            {actionModal.type === 'delete' && 'Xóa cửa hàng'}
                        </h3>
                        <p className="text-slate-600 mb-4">
                            Cửa hàng: <span className="font-medium text-slate-900">{actionModal.shop?.name}</span>
                        </p>
                        {(actionModal.type === 'reject' || actionModal.type === 'suspend') && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Lý do:
                                </label>
                                <textarea
                                    id="action-reason"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    placeholder="Nhập lý do..."
                                />
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionModal({ isOpen: false, type: null, shop: null })}
                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmAction}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sellers;
