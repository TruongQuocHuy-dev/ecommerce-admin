import { useState } from 'react';
import { 
    Search, Store, CheckCircle, XCircle, AlertCircle, Ban, 
    RotateCcw, Trash2, Sparkles, Eye, Star, User, 
    Mail, Phone, Building, ArrowUpRight, ShieldAlert, Award, MoreHorizontal
} from 'lucide-react';
import { 
    useShops, 
    useShopStats,
    useApproveShop, 
    useRejectShop, 
    useSuspendShop, 
    useReactivateShop, 
    useDeleteShop 
} from '../api/hooks/useShops';
import { useTranslation } from '../i18n/index.jsx';
import useAuthStore from '../store/useAuthStore';
import { PERMISSIONS, hasPermission } from '../utils/permissions';
import ShopDetailModal from '../components/sellers/ShopDetailModal';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const statusConfig = {
    pending: {
        label: 'Chờ duyệt',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: AlertCircle,
    },
    approved: {
        label: 'Đã duyệt',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle,
    },
    rejected: {
        label: 'Từ chối',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
    },
    suspended: {
        label: 'Tạm ngừng',
        color: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: Ban,
    },
};

const Sellers = () => {
    const { user: currentUser } = useAuthStore();
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    
    // Modal state for details
    const [selectedShopId, setSelectedShopId] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    
    // Action Modal state (reject/suspend with reason)
    const [actionModal, setActionModal] = useState({ isOpen: false, type: null, shop: null });
    
    // Action Dropdown state
    const [openActionDropdownId, setOpenActionDropdownId] = useState(null);

    const canManageShops = hasPermission(currentUser?.role, PERMISSIONS.MANAGE_SELLERS);

    // Fetch shops
    const { data, isLoading } = useShops({
        search,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 10,
    });

    // Fetch shop statistics
    const { data: statsData, isLoading: statsLoading } = useShopStats();

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
                approveMutation.mutate(shop._id, {
                    onSuccess: () => {
                        toast.success('Duyệt cửa hàng thành công');
                    }
                });
            }
        } else if (type === 'reactivate') {
            if (window.confirm(`Bạn có chắc muốn kích hoạt lại cửa hàng "${shop.name}"?`)) {
                reactivateMutation.mutate(shop._id, {
                    onSuccess: () => {
                        toast.success('Đã kích hoạt lại cửa hàng');
                    }
                });
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
            rejectMutation.mutate({ shopId: shop._id, reason }, {
                onSuccess: () => {
                    toast.success('Đã từ chối duyệt cửa hàng');
                }
            });
        } else if (type === 'suspend') {
            suspendMutation.mutate({ shopId: shop._id, reason }, {
                onSuccess: () => {
                    toast.success('Đã tạm ngừng hoạt động cửa hàng');
                }
            });
        } else if (type === 'delete') {
            deleteMutation.mutate(shop._id, {
                onSuccess: () => {
                    toast.success('Đã xóa cửa hàng');
                }
            });
        }

        setActionModal({ isOpen: false, type: null, shop: null });
    };

    const openDetails = (shopId) => {
        setSelectedShopId(shopId);
        setDetailModalOpen(true);
    };

    // Tab lists configuration
    const tabs = [
        { key: 'all', label: t('sellers.tabs.all'), count: statsData?.total || 0 },
        { key: 'pending', label: t('sellers.tabs.pending'), count: statsData?.pending || 0, highlight: true },
        { key: 'approved', label: t('sellers.tabs.approved'), count: statsData?.approved || 0 },
        { key: 'suspended', label: t('sellers.tabs.suspended'), count: statsData?.suspended || 0 },
        { key: 'rejected', label: t('sellers.tabs.rejected'), count: statsData?.rejected || 0 },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* CommandCenter Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_28%)] animate-pulse" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 backdrop-blur">
                            {t('sellers.commandCenter')}
                        </span>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl flex items-center gap-2">
                            {t('sellers.title')}
                            <Sparkles className="w-5 h-5 text-sky-400" />
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
                            {t('sellers.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Partners */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                        <Store className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">{t('sellers.stats.total')}</div>
                        <div className="text-2xl font-bold text-slate-900 mt-0.5">
                            {statsLoading ? '...' : (statsData?.total || 0)}
                        </div>
                    </div>
                </div>

                {/* Pending Approval */}
                <div className={clsx(
                    "bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300",
                    !statsLoading && statsData?.pending > 0 ? "border-yellow-200 bg-yellow-50/10" : "border-slate-200"
                )}>
                    <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center relative",
                        !statsLoading && statsData?.pending > 0 ? "bg-yellow-100 text-yellow-600 animate-pulse" : "bg-yellow-50 text-yellow-600"
                    )}>
                        <ShieldAlert className="w-6 h-6" />
                        {!statsLoading && statsData?.pending > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                            </span>
                        )}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">{t('sellers.stats.pending')}</div>
                        <div className={clsx(
                            "text-2xl font-bold mt-0.5",
                            !statsLoading && statsData?.pending > 0 ? "text-yellow-600" : "text-slate-900"
                        )}>
                            {statsLoading ? '...' : (statsData?.pending || 0)}
                        </div>
                    </div>
                </div>

                {/* Active Vouchers */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">{t('sellers.stats.approved')}</div>
                        <div className="text-2xl font-bold text-slate-900 mt-0.5">
                            {statsLoading ? '...' : (statsData?.approved || 0)}
                        </div>
                    </div>
                </div>

                {/* Suspended */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                        <Ban className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">{t('sellers.stats.suspended')}</div>
                        <div className="text-2xl font-bold text-slate-900 mt-0.5">
                            {statsLoading ? '...' : (statsData?.suspended || 0)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Shopee-style Tabs and Filters Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50">
                    {tabs.map((tab) => {
                        const isActive = statusFilter === tab.key;
                        const hasItemsHighlight = tab.highlight && tab.count > 0;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setStatusFilter(tab.key);
                                    setPage(1);
                                }}
                                className={clsx(
                                    "flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer",
                                    isActive 
                                        ? "border-primary-600 text-primary-600 bg-white" 
                                        : "border-transparent text-slate-500 hover:text-slate-950 hover:bg-slate-50"
                                )}
                            >
                                <span>{tab.label}</span>
                                <span className={clsx(
                                    "px-2 py-0.5 rounded-full text-xs font-bold",
                                    isActive 
                                        ? "bg-primary-50 text-primary-700" 
                                        : hasItemsHighlight 
                                        ? "bg-yellow-100 text-yellow-800 animate-pulse" 
                                        : "bg-slate-100 text-slate-600"
                                )}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Filters Input Area */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên shop hoặc chủ shop..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 placeholder-slate-500 text-sm"
                        />
                    </div>
                </div>

                {/* Seller Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed min-w-[1050px]">
                        <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left w-[18%]">{t('sellers.tableHeaders.shop')}</th>
                                <th className="px-6 py-4 text-left w-[12%]">{t('sellers.tableHeaders.owner')}</th>
                                <th className="px-6 py-4 text-left w-[22%]">{t('sellers.tableHeaders.contact')}</th>
                                <th className="px-6 py-4 text-center w-[10%]">{t('sellers.tableHeaders.businessType')}</th>
                                <th className="px-6 py-4 text-left w-[16%]">{t('sellers.tableHeaders.metrics')}</th>
                                <th className="px-6 py-4 text-center w-[14%]">{t('sellers.tableHeaders.status')}</th>
                                <th className="px-6 py-4 text-right w-[8%]">{t('sellers.tableHeaders.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white text-sm">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={7} className="px-6 py-6">
                                            <div className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : shops.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                                        <Store className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                                        <p className="font-semibold text-base">Không tìm thấy cửa hàng nào</p>
                                        <p className="text-xs text-slate-400 mt-1">Hệ thống chưa ghi nhận tài khoản đăng ký ở trạng thái này.</p>
                                    </td>
                                </tr>
                            ) : (
                                shops.map((shop) => {
                                    const statusData = statusConfig[shop.status] || { label: shop.status, color: 'bg-slate-50 border-slate-100 text-slate-700', icon: AlertCircle };
                                    const StatusIcon = statusData.icon;

                                    return (
                                        <tr key={shop._id} className="hover:bg-slate-50/40 transition-colors">
                                            {/* Shop Identity */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {/* Logo */}
                                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white font-bold text-base flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden">
                                                        {shop.logo && !shop.logo.includes('placeholder') ? (
                                                            <img src={shop.logo} alt="Logo" className="w-full h-full object-cover" />
                                                        ) : (
                                                            shop.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="truncate">
                                                        <div 
                                                            onClick={() => openDetails(shop._id)}
                                                            className="font-bold text-slate-900 truncate cursor-pointer hover:text-primary-600 hover:underline flex items-center gap-1"
                                                        >
                                                            {shop.name}
                                                            <ArrowUpRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Owner Profile */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                                                        <User className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="font-semibold text-slate-800 truncate" title={shop.owner?.name}>
                                                        {shop.owner?.name || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Contact Details */}
                                            <td className="px-6 py-4 space-y-0.5 text-xs">
                                                <div className="flex items-center gap-1.5 text-slate-700 truncate" title={shop.email}>
                                                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                    <span className="font-mono">{shop.email || shop.owner?.email || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                    <span>{shop.phone || 'N/A'}</span>
                                                </div>
                                            </td>

                                            {/* Business Category Type */}
                                            <td className="px-6 py-4 text-center">
                                                <span className={clsx(
                                                    "inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border",
                                                    shop.businessType === 'company' 
                                                        ? 'bg-blue-50 border-blue-100 text-blue-700' 
                                                        : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                                )}>
                                                    {shop.businessType === 'company' 
                                                        ? t('sellers.businessTypes.company') 
                                                        : t('sellers.businessTypes.individual')}
                                                </span>
                                            </td>

                                            {/* Performance Statistics */}
                                            <td className="px-6 py-4 space-y-1 text-xs">
                                                <div className="text-slate-600 font-medium">
                                                    Sản phẩm: <span className="font-bold text-slate-800">{shop.totalProducts}</span>
                                                </div>
                                                <div className="text-slate-600 font-medium">
                                                    Doanh thu: <span className="font-bold text-green-600">{shop.totalRevenue?.toLocaleString('vi-VN')} đ</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-500 font-semibold text-[11px]">
                                                    <Star className="w-3 h-3 fill-amber-500" />
                                                    <span>{shop.rating ? `${shop.rating.toFixed(1)}` : 'N/A'}</span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4 text-center">
                                                <span className={clsx(
                                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                                                    statusData.color
                                                )}>
                                                    <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                                    {statusData.label}
                                                </span>
                                            </td>

                                            {/* Actions Group */}
                                            <td className="px-6 py-4 relative">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setOpenActionDropdownId(openActionDropdownId === shop._id ? null : shop._id)}
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                                        title="Thao tác"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                    
                                                    {openActionDropdownId === shop._id && (
                                                        <>
                                                            <div 
                                                                className="fixed inset-0 z-20"
                                                                onClick={() => setOpenActionDropdownId(null)}
                                                            />
                                                            <div className="absolute right-12 top-4 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-fade-in text-left">
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenActionDropdownId(null);
                                                                        openDetails(shop._id);
                                                                    }}
                                                                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                                                                >
                                                                    <Eye className="w-4 h-4 text-slate-400" />
                                                                    <span>Xem chi tiết</span>
                                                                </button>
                                                                {canManageShops && (
                                                                    <>
                                                                        {shop.status === 'pending' && (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setOpenActionDropdownId(null);
                                                                                        handleAction('approve', shop);
                                                                                    }}
                                                                                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                                                                                >
                                                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                                                    <span>Duyệt nhanh</span>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setOpenActionDropdownId(null);
                                                                                        handleAction('reject', shop);
                                                                                    }}
                                                                                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                                                                                >
                                                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                                                    <span>Từ chối duyệt</span>
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        {shop.status === 'approved' && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setOpenActionDropdownId(null);
                                                                                    handleAction('suspend', shop);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                                                                            >
                                                                                <Ban className="w-4 h-4 text-orange-500" />
                                                                                <span>Tạm khóa shop</span>
                                                                            </button>
                                                                        )}
                                                                        {shop.status === 'suspended' && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setOpenActionDropdownId(null);
                                                                                    handleAction('reactivate', shop);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                                                                            >
                                                                                <RotateCcw className="w-4 h-4 text-blue-500" />
                                                                                <span>Mở khóa shop</span>
                                                                            </button>
                                                                        )}
                                                                        {shop.status === 'rejected' && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    setOpenActionDropdownId(null);
                                                                                    handleAction('approve', shop);
                                                                                }}
                                                                                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                                                                            >
                                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                                                <span>Duyệt lại</span>
                                                                            </button>
                                                                        )}
                                                                        <div className="border-t border-slate-100 my-1" />
                                                                        <button
                                                                            onClick={() => {
                                                                                setOpenActionDropdownId(null);
                                                                                handleAction('delete', shop);
                                                                            }}
                                                                            className="w-full px-3.5 py-2 text-left hover:bg-red-50 text-red-600 font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                            <span>Xóa cửa hàng</span>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 p-4 bg-white">
                        <p className="text-sm font-medium text-slate-500">
                            {t('common.page')} {page} / {totalPages}
                        </p>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold text-slate-700"
                            >
                                {t('common.previous')}
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= totalPages}
                                className="px-4 py-2 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold text-slate-700"
                            >
                                {t('common.next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Action Overlay (Reject/Suspend prompt) */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-slide-up border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            {actionModal.type === 'reject' && 'Từ chối duyệt đối tác'}
                            {actionModal.type === 'suspend' && 'Tạm khóa đối tác'}
                            {actionModal.type === 'delete' && 'Xóa vĩnh viễn đối tác'}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 bg-slate-50 border border-slate-100 p-2.5 rounded-lg leading-relaxed">
                            Thực hiện thao tác đối với cửa hàng: <span className="font-bold text-slate-800">{actionModal.shop?.name}</span>
                        </p>

                        {(actionModal.type === 'reject' || actionModal.type === 'suspend') && (
                            <div className="mb-5">
                                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">
                                    Lý do chi tiết *
                                </label>
                                <textarea
                                    id="action-reason"
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                    placeholder="Nhập lý do gửi đến đối tác..."
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setActionModal({ isOpen: false, type: null, shop: null })}
                                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmAction}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-red-500/10"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Inspection Modal */}
            <ShopDetailModal
                isOpen={detailModalOpen}
                onClose={() => {
                    setDetailModalOpen(false);
                    setSelectedShopId(null);
                }}
                shopId={selectedShopId}
            />
        </div>
    );
};

export default Sellers;
