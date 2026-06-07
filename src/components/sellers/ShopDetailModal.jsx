import { useState } from 'react';
import { useTranslation } from '../../i18n/index.jsx';
import Modal from '../ui/Modal';
import { 
    useShop, 
    useApproveShop, 
    useRejectShop, 
    useSuspendShop, 
    useReactivateShop, 
    useDeleteShop 
} from '../../api/hooks/useShops';
import { 
    User, Mail, Phone, MapPin, Building, CreditCard, Box, 
    Star, ShieldCheck, AlertCircle, Calendar, ShieldAlert, 
    Clock, Trash2, ArrowLeftRight, Ban, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const ShopDetailModal = ({ isOpen, onClose, shopId }) => {
    const { t } = useTranslation();
    const [actionType, setActionType] = useState(null); // 'reject' | 'suspend'
    const [reason, setReason] = useState('');
    const [reasonError, setReasonError] = useState('');

    // Fetch fresh shop details
    const { data: shop, isLoading, error } = useShop(shopId);

    // Mutations
    const approveMutation = useApproveShop();
    const rejectMutation = useRejectShop();
    const suspendMutation = useSuspendShop();
    const reactivateMutation = useReactivateShop();
    const deleteMutation = useDeleteShop();

    const handleApprove = () => {
        if (!shop) return;
        if (window.confirm(t('sellers.confirmApprove', { defaultValue: `Bạn có chắc chắn muốn duyệt cửa hàng "${shop.name}" không?` }))) {
            approveMutation.mutate(shop._id, {
                onSuccess: () => {
                    toast.success(t('sellers.toast.approved'));
                    onClose();
                }
            });
        }
    };

    const handleReactivate = () => {
        if (!shop) return;
        if (window.confirm(t('sellers.confirmReactivate', { defaultValue: `Bạn có chắc chắn muốn kích hoạt lại cửa hàng "${shop.name}" không?` }))) {
            reactivateMutation.mutate(shop._id, {
                onSuccess: () => {
                    toast.success(t('sellers.toast.reactivated'));
                    onClose();
                }
            });
        }
    };

    const handleDelete = () => {
        if (!shop) return;
        if (window.confirm(t('sellers.confirmDelete', { defaultValue: `Cảnh báo: Hành động này sẽ xóa vĩnh viễn cửa hàng "${shop.name}". Bạn có chắc chắn muốn tiếp tục?` }))) {
            deleteMutation.mutate(shop._id, {
                onSuccess: () => {
                    toast.success(t('sellers.toast.deleted'));
                    onClose();
                }
            });
        }
    };

    const handleAuditActionSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            setReasonError(t('sellers.detailModal.reasonRequired', { defaultValue: 'Vui lòng nhập lý do' }));
            return;
        }

        if (actionType === 'reject') {
            rejectMutation.mutate({ shopId: shop._id, reason }, {
                onSuccess: () => {
                    toast.success(t('sellers.toast.rejected'));
                    setActionType(null);
                    setReason('');
                    onClose();
                }
            });
        } else if (actionType === 'suspend') {
            suspendMutation.mutate({ shopId: shop._id, reason }, {
                onSuccess: () => {
                    toast.success(t('sellers.toast.suspended'));
                    setActionType(null);
                    setReason('');
                    onClose();
                }
            });
        }
    };

    const formatAddress = (addr) => {
        if (!addr) return 'N/A';
        const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean);
        return parts.join(', ');
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'pending':
                return {
                    label: t('sellers.tabs.pending'),
                    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                    icon: Clock
                };
            case 'approved':
                return {
                    label: t('sellers.tabs.approved'),
                    color: 'bg-green-50 text-green-700 border-green-200',
                    icon: ShieldCheck
                };
            case 'rejected':
                return {
                    label: t('sellers.tabs.rejected'),
                    color: 'bg-red-50 text-red-700 border-red-200',
                    icon: XCircle
                };
            case 'suspended':
                return {
                    label: t('sellers.tabs.suspended'),
                    color: 'bg-slate-50 text-slate-700 border-slate-200',
                    icon: Ban
                };
            default:
                return {
                    label: status,
                    color: 'bg-slate-100 border-slate-200',
                    icon: AlertCircle
                };
        }
    };

    const isMutating = 
        approveMutation.isPending || 
        rejectMutation.isPending || 
        suspendMutation.isPending || 
        reactivateMutation.isPending || 
        deleteMutation.isPending;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('sellers.detailModal.title')}
            size="lg"
        >
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                    <p className="text-sm font-medium">{t('common.loading')}</p>
                </div>
            ) : error || !shop ? (
                <div className="text-center py-16 text-red-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-semibold">{t('common.error')}</p>
                    <p className="text-xs text-slate-400 mt-1">{error?.message || 'Không tìm thấy thông tin cửa hàng'}</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {/* Scrollable Content Container */}
                    <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                        {/* Banner and Profile Card */}
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                            {/* Banner */}
                            <div className="h-32 w-full overflow-hidden bg-gradient-to-r from-slate-200 to-slate-300 relative">
                                {shop.banner ? (
                                    <img 
                                        src={shop.banner} 
                                        alt="Shop Banner" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-60" />
                                )}
                            </div>

                            {/* Profile Info Row */}
                            <div className="px-6 pb-6 pt-4 flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10 relative z-10">
                                {/* Logo */}
                                <div className="w-20 h-20 rounded-2xl border-4 border-white bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-3xl font-bold shadow-md overflow-hidden">
                                    {shop.logo && !shop.logo.includes('placeholder') ? (
                                        <img src={shop.logo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        shop.name.charAt(0).toUpperCase()
                                    )}
                                </div>

                                {/* Name and Status Badge */}
                                <div className="flex-1 text-center sm:text-left">
                                    <h3 className="text-2xl font-bold text-slate-900">{shop.name}</h3>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                                        <span className={clsx(
                                            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                                            getStatusConfig(shop.status).color
                                        )}>
                                            {(() => {
                                                const Icon = getStatusConfig(shop.status).icon;
                                                return <Icon className="w-3 h-3" />;
                                            })()}
                                            {getStatusConfig(shop.status).label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Information Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Side: Shop Profile & Business Info */}
                            <div className="space-y-6">
                                {/* Shop Description */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <Building className="w-4 h-4 text-primary-500" />
                                        {t('sellers.detailModal.shopInfo')}
                                    </h4>
                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                        {shop.description || 'Chưa cung cấp mô tả cửa hàng.'}
                                    </p>
                                </div>

                                {/* Business Profile */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-primary-500" />
                                        {t('sellers.detailModal.businessInfo')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold mb-1">
                                                {t('sellers.tableHeaders.businessType')}
                                            </span>
                                            <span className="font-medium text-slate-900 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                                {shop.businessType === 'company' 
                                                    ? t('sellers.businessTypes.company') 
                                                    : t('sellers.businessTypes.individual')}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold mb-1">
                                                Mã số thuế (Tax ID)
                                            </span>
                                            <span className="font-medium text-slate-900 font-mono bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                                {shop.taxId || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Metrics */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <ArrowLeftRight className="w-4 h-4 text-primary-500" />
                                        {t('sellers.detailModal.metrics')}
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                            <div className="text-slate-500 text-xs mb-1 flex items-center justify-center gap-1">
                                                <Box className="w-3.5 h-3.5" />
                                                Sản phẩm
                                            </div>
                                            <div className="text-lg font-bold text-slate-800">{shop.totalProducts}</div>
                                        </div>
                                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                            <div className="text-slate-500 text-xs mb-1 flex items-center justify-center gap-1">
                                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                Đánh giá
                                            </div>
                                            <div className="text-lg font-bold text-slate-800">
                                                {shop.rating ? `${shop.rating.toFixed(1)}` : 'N/A'}
                                                {shop.reviewCount > 0 && <span className="text-xs font-normal text-slate-500 ml-0.5">({shop.reviewCount})</span>}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 col-span-3 sm:col-span-1">
                                            <div className="text-slate-500 text-xs mb-1">Doanh thu</div>
                                            <div className="text-sm font-bold text-green-600 truncate" title={`${shop.totalRevenue?.toLocaleString('vi-VN')} đ`}>
                                                {shop.totalRevenue?.toLocaleString('vi-VN')} đ
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Owner & Contact & Audit Log */}
                            <div className="space-y-6">
                                {/* Owner & Contact Details */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary-500" />
                                        {t('sellers.detailModal.ownerInfo')}
                                    </h4>
                                    <div className="space-y-3.5 text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 block">Chủ sở hữu</span>
                                                <span className="font-medium text-slate-800">{shop.owner?.name || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div className="truncate">
                                                <span className="text-xs text-slate-400 block">Email đăng ký</span>
                                                <span className="font-medium text-slate-800 font-mono">{shop.email || shop.owner?.email || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 block">Số điện thoại</span>
                                                <span className="font-medium text-slate-800 font-mono">{shop.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 mt-1 flex-shrink-0">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 block">Địa chỉ liên hệ</span>
                                                <span className="font-medium text-slate-800 block text-xs leading-relaxed">
                                                    {formatAddress(shop.address)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Audit Trail & Moderation History */}
                                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-primary-500" />
                                        {t('sellers.detailModal.auditInfo')}
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-slate-50 pb-2">
                                            <span className="text-slate-500 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Ngày đăng ký
                                            </span>
                                            <span className="font-medium text-slate-800">
                                                {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                            </span>
                                        </div>

                                        {/* Approved status details */}
                                        {shop.status === 'approved' && shop.approvedAt && (
                                            <div className="bg-green-50/50 border border-green-100 rounded-xl p-3.5 space-y-1.5">
                                                <div className="text-xs text-green-700 font-semibold flex items-center gap-1">
                                                    <ShieldCheck className="w-4 h-4" />
                                                    Đã duyệt hoạt động
                                                </div>
                                                <div className="text-xs text-slate-600">
                                                    {t('sellers.detailModal.approvedBy')}: <span className="font-semibold text-slate-800">{shop.approvedBy?.name || 'Admin'}</span>
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    Thời gian: {new Date(shop.approvedAt).toLocaleString('vi-VN')}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rejected status details */}
                                        {shop.status === 'rejected' && (
                                            <div className="bg-red-50/50 border border-red-100 rounded-xl p-3.5 space-y-2">
                                                <div className="text-xs text-red-700 font-semibold flex items-center gap-1">
                                                    <XCircle className="w-4 h-4" />
                                                    Đã từ chối đăng ký
                                                </div>
                                                {shop.rejectedBy && (
                                                    <div className="text-xs text-slate-600">
                                                        {t('sellers.detailModal.rejectedBy')}: <span className="font-semibold text-slate-800">{shop.rejectedBy?.name || 'Admin'}</span>
                                                    </div>
                                                )}
                                                {shop.rejectedAt && (
                                                    <div className="text-[11px] text-slate-400">
                                                        Thời gian từ chối: {new Date(shop.rejectedAt).toLocaleString('vi-VN')}
                                                    </div>
                                                )}
                                                <div className="text-xs text-slate-700 bg-white border border-red-100 p-2.5 rounded-lg">
                                                    <span className="font-bold text-red-800 block mb-0.5">{t('sellers.detailModal.rejectionReason')}:</span>
                                                    {shop.rejectionReason || 'Không có lý do chi tiết.'}
                                                </div>
                                            </div>
                                        )}

                                        {/* Suspended status details */}
                                        {shop.status === 'suspended' && (
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                                                <div className="text-xs text-slate-700 font-semibold flex items-center gap-1">
                                                    <Ban className="w-4 h-4 text-slate-600" />
                                                    Cửa hàng đang bị tạm khóa
                                                </div>
                                                {shop.suspendedBy && (
                                                    <div className="text-xs text-slate-600">
                                                        {t('sellers.detailModal.suspendedBy')}: <span className="font-semibold text-slate-800">{shop.suspendedBy?.name || 'Admin'}</span>
                                                    </div>
                                                )}
                                                {shop.suspendedAt && (
                                                    <div className="text-[11px] text-slate-400">
                                                        Thời gian khóa: {new Date(shop.suspendedAt).toLocaleString('vi-VN')}
                                                    </div>
                                                )}
                                                <div className="text-xs text-slate-700 bg-white border border-slate-200 p-2.5 rounded-lg">
                                                    <span className="font-bold text-slate-800 block mb-0.5">{t('sellers.detailModal.suspensionReason')}:</span>
                                                    {shop.suspensionReason || 'Không có lý do chi tiết.'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Moderation Form (Reason Inputs) */}
                        {actionType && (
                            <form onSubmit={handleAuditActionSubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl animate-fade-in space-y-3">
                                <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    {actionType === 'reject' ? 'Lý do từ chối đăng ký' : 'Lý do tạm khóa cửa hàng'}
                                </h4>
                                <div>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => {
                                            setReason(e.target.value);
                                            if (reasonError) setReasonError('');
                                        }}
                                        rows={3}
                                        placeholder={t('sellers.detailModal.actionReasonPlaceholder')}
                                        className={clsx(
                                            "w-full px-3 py-2 text-sm border rounded-xl outline-none focus:ring-2 transition-all bg-white",
                                            reasonError 
                                                ? "border-red-400 focus:ring-red-500/20" 
                                                : "border-slate-300 focus:ring-primary-500/20 focus:border-primary-500"
                                        )}
                                    />
                                    {reasonError && <p className="text-xs text-red-600 mt-1">{reasonError}</p>}
                                </div>
                                <div className="flex justify-end gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActionType(null);
                                            setReason('');
                                            setReasonError('');
                                        }}
                                        className="px-4 py-2 border border-slate-300 bg-white text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isMutating}
                                        className={clsx(
                                            "px-4 py-2 text-white font-medium rounded-xl transition-all shadow-sm",
                                            actionType === 'reject' 
                                                ? "bg-red-600 hover:bg-red-700 hover:shadow-red-500/20" 
                                                : "bg-orange-600 hover:bg-orange-700 hover:shadow-orange-500/20"
                                        )}
                                    >
                                        Xác nhận
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Footer Actions (Fixed at bottom) */}
                    {!actionType && (
                        <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-5 gap-3 mt-4">
                            {/* Left Aligned: Dangerous permanent delete */}
                            <div>
                                <button
                                    onClick={handleDelete}
                                    disabled={isMutating}
                                    className="flex items-center gap-1 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                    title="Xóa vĩnh viễn shop khỏi cơ sở dữ liệu"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Xóa cửa hàng
                                </button>
                            </div>

                            {/* Right Aligned: Main audit controls */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 text-sm font-semibold transition-colors"
                                >
                                    Đóng
                                </button>

                                {/* Action Buttons based on status */}
                                {shop.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => setActionType('reject')}
                                            disabled={isMutating}
                                            className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-red-600 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Từ chối duyệt
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={isMutating}
                                            className="flex items-center gap-1.5 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-green-500/10 hover:shadow-lg transition-all disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Duyệt hoạt động
                                        </button>
                                    </>
                                )}

                                {shop.status === 'approved' && (
                                    <button
                                        onClick={() => setActionType('suspend')}
                                        disabled={isMutating}
                                        className="flex items-center gap-1.5 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-orange-500/10 hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        <Ban className="w-4 h-4" />
                                        Tạm ngừng hoạt động
                                    </button>
                                )}

                                {shop.status === 'suspended' && (
                                    <button
                                        onClick={handleReactivate}
                                        disabled={isMutating}
                                        className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        Kích hoạt lại
                                    </button>
                                )}

                                {shop.status === 'rejected' && (
                                    <button
                                        onClick={handleApprove}
                                        disabled={isMutating}
                                        className="flex items-center gap-1.5 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-green-500/10 hover:shadow-lg transition-all disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Duyệt lại
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default ShopDetailModal;
