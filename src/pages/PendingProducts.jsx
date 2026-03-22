import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Eye, Package, User, Calendar, Filter } from 'lucide-react';
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
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Sản phẩm chờ duyệt</h1>
                    <p className="text-slate-600 mt-1">Duyệt sản phẩm từ người bán</p>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-primary-700 font-medium">
                        Đã chọn {selectedIds.length} sản phẩm
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => bulkApproveMutation.mutate(selectedIds)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Duyệt tất cả
                        </button>
                        <button
                            onClick={() => setRejectModal({ open: true, productId: null, isBulk: true })}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Từ chối tất cả
                        </button>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === products.length && products.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Sản phẩm</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Người bán</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Danh mục</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Giá</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tồn kho</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Ngày tạo</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={8} className="px-6 py-4">
                                        <div className="h-16 bg-slate-100 rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center">
                                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">Không có sản phẩm chờ duyệt</p>
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(product.id)}
                                            onChange={() => toggleSelect(product.id)}
                                            className="rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={product.images?.[0]}
                                                alt={product.name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                            <span className="font-medium text-slate-900">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{product.seller?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-slate-700">{product.category?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-slate-900 font-medium">
                                        {new Intl.NumberFormat('vi-VN').format(product.price)}₫
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">{product.stock || 0}</td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                        {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => approveMutation.mutate(product.id)}
                                                className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                                                title="Duyệt"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setRejectModal({ open: true, productId: product.id, isBulk: false })}
                                                className="p-2 hover:bg-orange-50 rounded-lg text-orange-600 transition-colors"
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-600">
                        Trang {pagination.currentPage} / {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => p - 1)}
                            disabled={page === 1}
                            className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50"
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= pagination.totalPages}
                            className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50"
                        >
                            Sau
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
