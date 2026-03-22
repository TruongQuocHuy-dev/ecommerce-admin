import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Search, Shield, AlertTriangle, Trash2, CheckCircle, XCircle, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import clsx from 'clsx';

const Reviews = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const queryClient = useQueryClient();

    // Fetch reviews (admin - list all)
    const { data, isLoading } = useQuery({
        queryKey: ['admin-reviews', { page, search, ratingFilter, statusFilter }],
        queryFn: async () => {
            // Note: This endpoint needs to be created in backend
            // For now, we'll simulate with product reviews
            const params = new URLSearchParams({
                page,
                limit: 15,
                ...(search && { search }),
                ...(ratingFilter !== 'all' && { rating: ratingFilter }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
            });
            const response = await api.get(`/reviews/admin?${params}`);
            return response.data?.data || { reviews: [], pagination: {} };
        },
    });

    // Delete review mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/reviews/${id}`),
        onSuccess: () => {
            toast.success('Đã xóa đánh giá');
            queryClient.invalidateQueries(['admin-reviews']);
        },
        onError: () => toast.error(t('toast.error')),
    });

    // Approve/Reject mutations (to be implemented in backend)
    const approveMutation = useMutation({
        mutationFn: (id) => api.patch(`/reviews/${id}/approve`),
        onSuccess: () => {
            toast.success('Đã duyệt đánh giá');
            queryClient.invalidateQueries(['admin-reviews']);
        },
        onError: () => toast.error(t('toast.error')),
    });

    const rejectMutation = useMutation({
        mutationFn: (id) => api.patch(`/reviews/${id}/reject`),
        onSuccess: () => {
            toast.success('Đã từ chối đánh giá');
            queryClient.invalidateQueries(['admin-reviews']);
        },
        onError: () => toast.error(t('toast.error')),
    });

    const reviews = data?.reviews || [];
    const pagination = data?.pagination || {};

    const renderStars = (rating) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={clsx(
                            'w-4 h-4',
                            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                        )}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản lý đánh giá</h1>
                <p className="text-slate-600 mt-1">Kiểm duyệt và quản lý đánh giá sản phẩm</p>
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
                        placeholder="Tìm theo tên sản phẩm, người dùng..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                </div>

                {/* Rating Filter */}
                <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                    <option value="all">Tất cả đánh giá</option>
                    <option value="5">5 sao</option>
                    <option value="4">4 sao</option>
                    <option value="3">3 sao</option>
                    <option value="2">2 sao</option>
                    <option value="1">1 sao</option>
                </select>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="reported">Bị báo cáo</option>
                </select>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="h-24 bg-slate-100 rounded animate-pulse" />
                        </div>
                    ))
                ) : reviews.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                        <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Chưa có đánh giá nào</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div
                            key={review._id || review.id}
                            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                {/* Review Content */}
                                <div className="flex-1">
                                    {/* User & Product Info */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold">
                                            {review.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-slate-900">{review.user?.name || 'Ẩn danh'}</p>
                                                {review.isVerifiedPurchase && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                                                        <Shield className="w-3 h-3" />
                                                        Đã mua hàng
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                Sản phẩm: <span className="font-medium">{review.product?.name || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rating & Title */}
                                    <div className="mb-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            {renderStars(review.rating)}
                                            <span className="text-sm text-slate-600">
                                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-slate-900">{review.title}</h3>
                                    </div>

                                    {/* Comment */}
                                    <p className="text-slate-700 mb-3">{review.comment}</p>

                                    {/* Footer - Helpful Votes & Status */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-slate-500">
                                            <ThumbsUp className="w-4 h-4" />
                                            <span className="text-sm">{review.helpfulVotes || 0} hữu ích</span>
                                        </div>

                                        {review.isReported && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200">
                                                <AlertTriangle className="w-3 h-3" />
                                                Bị báo cáo
                                            </span>
                                        )}

                                        {review.isApproved === false && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200">
                                                <Clock className="w-3 h-3" />
                                                Chờ duyệt
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 ml-4">
                                    {review.isApproved === false && (
                                        <button
                                            onClick={() => approveMutation.mutate(review._id || review.id)}
                                            className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                                            title="Duyệt"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                    {(review.isApproved === true || review.isApproved === undefined) && (
                                        <button
                                            onClick={() => rejectMutation.mutate(review._id || review.id)}
                                            className="p-2 hover:bg-orange-50 rounded-lg text-orange-600 transition-colors"
                                            title="Từ chối"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (confirm('Xóa đánh giá này?')) {
                                                deleteMutation.mutate(review._id || review.id);
                                            }
                                        }}
                                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm text-slate-600">
                        Trang {page} / {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= pagination.totalPages}
                            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Tiếp
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reviews;
