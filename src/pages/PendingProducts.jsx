import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Eye, Package, User, Calendar, Filter, Search, ChevronLeft, ChevronRight, AlertTriangle, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import clsx from 'clsx';

const PendingProducts = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [rejectModal, setRejectModal] = useState({ open: false, productId: null, isBulk: false });
    const [reason, setReason] = useState('');

    // Fetch pending products
    const { data, isLoading } = useQuery({
        queryKey: ['pendingProducts', { page }],
        queryFn: async () => {
            const response = await api.get(`/products/pending?page=${page}&limit=10`);
            return response.data?.data || { products: [], pagination: {} };
        },
    });

    const products = data?.products || [];
    const pagination = data?.pagination || {};

    const summary = useMemo(() => ({
        total: products.length,
        readyToApprove: products.filter((product) => (product.price || 0) > 0).length,
    }), [products]);

    // Approve single
    const approveMutation = useMutation({
        mutationFn: (id) => api.post(`/products/${id}/approve`),
        onSuccess: () => {
            toast.success('Đã duyệt sản phẩm');
            queryClient.invalidateQueries(['pendingProducts']);
        },
        onError: () => toast.error('Lỗi khi duyệt sản phẩm'),
    });

    // Reject single/bulk
    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }) => api.post(`/products/${id}/reject`, { reason }),
        onSuccess: () => {
            toast.success('Đã từ chối sản phẩm');
            setRejectModal({ open: false, productId: null, isBulk: false });
            setReason('');
            queryClient.invalidateQueries(['pendingProducts']);
        },
        onError: () => toast.error('Lỗi khi từ chối sản phẩm'),
    });

    // Bulk approve
    const bulkApproveMutation = useMutation({
        mutationFn: (productIds) => api.post('/products/bulk-approve', { productIds }),
        onSuccess: () => {
            toast.success(`Đã duyệt ${selectedIds.length} sản phẩm`);
            setSelectedIds([]);
            queryClient.invalidateQueries(['pendingProducts']);
        },
        onError: () => toast.error('Lỗi khi duyệt hàng loạt'),
    });

    // Bulk reject
    const bulkRejectMutation = useMutation({
        mutationFn: ({ productIds, reason }) => api.post('/products/bulk-reject', { productIds, reason }),
        onSuccess: () => {
            toast.success(`Đã từ chối ${selectedIds.length} sản phẩm`);
            setSelectedIds([]);
            setRejectModal({ open: false, productId: null, isBulk: false });
            setReason('');
            queryClient.invalidateQueries(['pendingProducts']);
        },
        onError: () => toast.error('Lỗi khi từ chối hàng loạt'),
    });

    const handleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(products.map(p => p.id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const submitReject = () => {
        if (!reason.trim()) return;

        if (rejectModal.isBulk) {
            bulkRejectMutation.mutate({ productIds: selectedIds, reason });
        } else {
            rejectMutation.mutate({ id: rejectModal.productId, reason });
        }
    };

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_28%)]" />
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100 backdrop-blur">
                            Moderation Console
                        </p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Sản phẩm chờ duyệt</h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">Duyệt sản phẩm từ người bán với luồng bulk action rõ ràng và ít thao tác hơn.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-white">
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                            <p className="text-xs uppercase tracking-wide text-slate-300">Total</p>
                            <p className="mt-1 text-2xl font-bold">{summary.total}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                            <p className="text-xs uppercase tracking-wide text-slate-300">Ready</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-300">{summary.readyToApprove}</p>
                        </div>
                    </div>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-amber-900">Đã chọn {selectedIds.length} sản phẩm</p>
                            <p className="text-sm text-amber-700">Bạn có thể duyệt hoặc từ chối hàng loạt ngay tại đây.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => bulkApproveMutation.mutate(selectedIds)}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Duyệt tất cả
                            </button>
                            <button
                                onClick={() => setRejectModal({ open: true, productId: null, isBulk: true })}
                                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                            >
                                <XCircle className="h-4 w-4" />
                                Từ chối tất cả
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Approval queue</h2>
                            <p className="text-sm text-slate-500">Kiểm tra nhanh ảnh, giá, người bán và quyết định duyệt.</p>
                        </div>
                        <p className="text-sm text-slate-500">Trang {pagination.currentPage || 1} / {pagination.totalPages || 1}</p>
                    </div>
                </div>
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === products.length && products.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded border-slate-300"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sản phẩm</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Người bán</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Danh mục</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Giá</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tồn kho</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày tạo</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={8} className="px-6 py-4">
                                        <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-14 text-center">
                                    <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                                        <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                                            <Package className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <p className="text-base font-semibold text-slate-800">Không có sản phẩm chờ duyệt</p>
                                            <p className="mt-1 text-sm text-slate-500">Khi người bán tạo sản phẩm mới, chúng sẽ xuất hiện ở đây để bạn xét duyệt.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="transition-colors hover:bg-slate-50">
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                            className="rounded border-slate-300"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={product.images?.[0] || '/placeholder.png'}
                                                alt={product.name}
                                                className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                                            />
                                            <div>
                                                <p className="font-semibold text-slate-900 line-clamp-1">{product.name}</p>
                                                <p className="text-sm text-slate-500 line-clamp-1">SKU: {product.skus?.[0]?.skuCode || (product.id || '').slice(-6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{product.seller?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{product.category?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-900">{new Intl.NumberFormat('vi-VN').format(product.price)}₫</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700">{product.stock || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(product.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => approveMutation.mutate(product.id)}
                                                className="rounded-xl p-2 text-emerald-600 transition hover:bg-emerald-50"
                                                title="Duyệt"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setRejectModal({ open: true, productId: product.id, isBulk: false })}
                                                className="rounded-xl p-2 text-orange-600 transition hover:bg-orange-50"
                                                title="Từ chối"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-600">Trang {pagination.currentPage} / {pagination.totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 1}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Trước
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= pagination.totalPages}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Sau
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 mb-4">
                            Từ chối sản phẩm
                        </h3>
                        <p className="text-slate-600 mb-4">
                            {rejectModal.isBulk
                                ? `Bạn đang từ chối ${selectedIds.length} sản phẩm. Vui lòng nhập lý do:`
                                : 'Vui lòng nhập lý do từ chối:'}
                        </p>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Lý do từ chối..."
                            className="w-full border border-slate-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setRejectModal({ open: false, productId: null, isBulk: false });
                                    setReason('');
                                }}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={submitReject}
                                disabled={!reason.trim()}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50"
                            >
                                Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingProducts;
