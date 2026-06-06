import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Star, Search, Shield, AlertTriangle, Trash2, CheckCircle,
    XCircle, ThumbsUp, Sparkles, Clock, ChevronRight, Package,
    Filter, RefreshCw, MessageSquare
} from 'lucide-react';
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
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const queryClient = useQueryClient();

    // Fetch products that have reviews
    const { data: productsData, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['admin-products-with-reviews'],
        queryFn: async () => {
            const response = await api.get('/reviews/admin/products');
            return response.data?.data || [];
        },
    });

    // Fetch rating distribution for selected product
    const { data: distributionData, isLoading: isLoadingDistribution } = useQuery({
        queryKey: ['admin-rating-distribution', selectedProductId],
        queryFn: async () => {
            const response = await api.get(`/products/${selectedProductId}/rating-distribution`);
            return response.data?.data || { averageRating: 0, totalReviews: 0, distribution: {} };
        },
        enabled: !!selectedProductId,
    });

    // Fetch reviews with filters and potential selected product
    const { data, isLoading } = useQuery({
        queryKey: ['admin-reviews', { page, search, ratingFilter, statusFilter, selectedProductId }],
        queryFn: async () => {
            const params = new URLSearchParams({
                page,
                limit: 10,
                ...(search && { search }),
                ...(ratingFilter !== 'all' && { rating: ratingFilter }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(selectedProductId && { productId: selectedProductId }),
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
            queryClient.invalidateQueries(['admin-products-with-reviews']);
            if (selectedProductId) {
                queryClient.invalidateQueries(['admin-rating-distribution', selectedProductId]);
            }
        },
        onError: () => toast.error(t('toast.error')),
    });

    // Approve/Reject mutations
    const approveMutation = useMutation({
        mutationFn: (id) => api.patch(`/reviews/${id}/approve`),
        onSuccess: () => {
            toast.success('Đã duyệt đánh giá');
            queryClient.invalidateQueries(['admin-reviews']);
            queryClient.invalidateQueries(['admin-products-with-reviews']);
            if (selectedProductId) {
                queryClient.invalidateQueries(['admin-rating-distribution', selectedProductId]);
            }
        },
        onError: () => toast.error(t('toast.error')),
    });

    const rejectMutation = useMutation({
        mutationFn: (id) => api.patch(`/reviews/${id}/reject`),
        onSuccess: () => {
            toast.success('Đã từ chối đánh giá');
            queryClient.invalidateQueries(['admin-reviews']);
            queryClient.invalidateQueries(['admin-products-with-reviews']);
            if (selectedProductId) {
                queryClient.invalidateQueries(['admin-rating-distribution', selectedProductId]);
            }
        },
        onError: () => toast.error(t('toast.error')),
    });

    const reviews = data?.reviews || [];
    const pagination = data?.pagination || {};
    const productsList = productsData || [];

    // Filter products list based on search
    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return productsList;
        return productsList.filter(p =>
            p.name?.toLowerCase().includes(productSearch.toLowerCase())
        );
    }, [productsList, productSearch]);

    // Find the currently selected product details from productsList
    const selectedProduct = useMemo(() => {
        if (!selectedProductId) return null;
        return productsList.find(p => p.id === selectedProductId);
    }, [productsList, selectedProductId]);

    const renderStars = (rating) => {
        const numericRating = Math.round(Number(rating) || 0);
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={clsx(
                            'w-4 h-4',
                            star <= numericRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                        )}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-1">
            {/* CommandCenter Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_28%)] animate-pulse" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur">
                            {t('reviews.commandCenter')}
                        </span>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl flex items-center gap-2">
                            {t('reviews.title')}
                            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
                            {t('reviews.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Split Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Sidebar - Products list */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col h-[calc(100vh-220px)] min-h-[500px] lg:sticky lg:top-20">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                            <Package className="w-4 h-4 text-indigo-500" />
                            Sản phẩm có đánh giá
                        </h3>
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {productsList.length}
                        </span>
                    </div>

                    {/* Search inside Products List */}
                    <div className="relative mt-3 mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Tìm sản phẩm..."
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Products List Scrollable */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin mt-2">
                        <button
                          onClick={() => {
                            setSelectedProductId(null);
                            setPage(1);
                          }}
                          className={clsx(
                            "w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group",
                            selectedProductId === null
                              ? "bg-slate-900 border-slate-900 text-white font-semibold shadow-md"
                              : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700 bg-white shadow-sm"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm transition-all",
                                selectedProductId === null ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                            )}>
                              ALL
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Tất cả sản phẩm</p>
                              <p className={clsx("text-xs font-normal", selectedProductId === null ? "text-slate-200" : "text-slate-400")}>
                                Hiển thị toàn bộ đánh giá
                              </p>
                            </div>
                          </div>
                          <ChevronRight className={clsx("w-4 h-4 transition-transform", selectedProductId === null ? "text-white translate-x-0.5" : "text-slate-400 group-hover:translate-x-0.5")} />
                        </button>

                        {isLoadingProducts ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                              <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                              </div>
                            </div>
                          ))
                        ) : filteredProducts.length === 0 ? (
                          <div className="text-center text-slate-400 text-xs py-8">
                              <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                              Không tìm thấy sản phẩm
                          </div>
                        ) : (
                          filteredProducts.map((prod) => (
                            <button
                              key={prod.id}
                              onClick={() => {
                                setSelectedProductId(prod.id);
                                setPage(1);
                              }}
                              className={clsx(
                                "w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 justify-between group bg-white shadow-sm",
                                selectedProductId === prod.id
                                  ? "bg-indigo-50/70 border-indigo-200 text-indigo-950 font-semibold"
                                  : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={prod.images?.[0] || '/placeholder.png'}
                                  alt={prod.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate text-slate-900 group-hover:text-indigo-950">{prod.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                                      {prod.averageRating || 0}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-normal">
                                      • {prod.reviewCount || 0} đánh giá
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className={clsx("w-4 h-4 shrink-0 transition-transform", selectedProductId === prod.id ? "text-indigo-600 translate-x-0.5" : "text-slate-300 group-hover:translate-x-0.5")} />
                            </button>
                          ))
                        )}
                    </div>
                </div>

                {/* Right Column - Product details stats & Reviews list */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Selected Product summary stats breakdown card */}
                    {selectedProduct && (
                        isLoadingDistribution ? (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex justify-center py-12">
                                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />
                                
                                {/* Selected Product Header Info */}
                                <div className="flex items-center gap-4 border-b border-slate-100 pb-5 mb-5">
                                    <img
                                      src={selectedProduct.images?.[0] || '/placeholder.png'}
                                      alt={selectedProduct.name}
                                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-bold text-slate-900 leading-snug truncate" title={selectedProduct.name}>
                                            {selectedProduct.name}
                                        </h2>
                                        <p className="text-sm font-semibold text-indigo-600 mt-0.5">
                                            {selectedProduct.price ? `$${selectedProduct.price.toLocaleString('en-US')}` : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                    {/* Big stars display */}
                                    <div className="md:col-span-4 text-center md:border-r md:border-slate-100 md:pr-6 py-2">
                                        <p className="text-5xl font-black text-slate-900">{distributionData?.averageRating || selectedProduct.averageRating || 0}</p>
                                        <div className="flex justify-center my-2">
                                            {renderStars(distributionData?.averageRating || selectedProduct.averageRating || 0)}
                                        </div>
                                        <p className="text-xs text-slate-500 font-semibold">
                                            Dựa trên {distributionData?.totalReviews || selectedProduct.reviewCount || 0} đánh giá
                                        </p>
                                    </div>

                                    {/* Rating progress bars breakdown */}
                                    <div className="md:col-span-8 space-y-2">
                                        {[5, 4, 3, 2, 1].map((stars) => {
                                            const percent = distributionData?.distribution?.[stars] || 0;
                                            return (
                                                <div key={stars} className="flex items-center gap-3 text-xs">
                                                    <span className="w-10 text-slate-600 font-bold shrink-0 flex items-center gap-0.5">
                                                        {stars} <Star className="w-3 h-3 fill-slate-400 text-slate-400 shrink-0" />
                                                    </span>
                                                    <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                    <span className="w-8 text-right text-slate-500 font-semibold shrink-0">{percent}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {/* Filter reviews workspace */}
                    <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                        {/* Search review text content */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tiêu đề, nội dung đánh giá..."
                                className="w-full pl-9.5 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Rating Filter selector */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden md:block" />
                            <select
                                value={ratingFilter}
                                onChange={(e) => setRatingFilter(e.target.value)}
                                className="text-sm px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                            >
                                <option value="all">Tất cả sao</option>
                                <option value="5">5 sao</option>
                                <option value="4">4 sao</option>
                                <option value="3">3 sao</option>
                                <option value="2">2 sao</option>
                                <option value="1">1 sao</option>
                            </select>
                        </div>

                        {/* Status Filter selector */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-sm px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
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
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <div className="animate-pulse flex items-start gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
                                        <div className="flex-1 space-y-2.5">
                                            <div className="h-4 bg-slate-100 rounded w-1/4" />
                                            <div className="h-3 bg-slate-100 rounded w-1/3" />
                                            <div className="h-3.5 bg-slate-100 rounded w-5/6" />
                                            <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : reviews.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
                                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 font-medium">Chưa có đánh giá nào phù hợp</p>
                                <p className="text-slate-400 text-xs mt-1">Vui lòng thay đổi bộ lọc hoặc chọn sản phẩm khác</p>
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div
                                    key={review._id || review.id}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden"
                                >
                                    {/* Subtle Top-border status accent indicator */}
                                    {review.isReported && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />}
                                    {review.isApproved === false && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />}

                                    <div className="flex items-start justify-between">
                                        {/* Review Content details */}
                                        <div className="flex-1 min-w-0">
                                            
                                            {/* User & Product Info row */}
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                                                        {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="font-semibold text-slate-900 text-sm leading-none">{review.user?.name || 'Ẩn danh'}</p>
                                                            {review.user?.email && (
                                                                <span className="text-xs text-slate-400 font-normal">({review.user.email})</span>
                                                            )}
                                                            {review.isVerifiedPurchase && (
                                                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-200">
                                                                    <Shield className="w-3 h-3" />
                                                                    Đã mua hàng
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            Đánh giá vào {new Date(review.createdAt).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Show Product Reference Badge ONLY when looking at "All Products" review list */}
                                            {!selectedProductId && review.product && (
                                                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2 mb-3.5 max-w-full hover:bg-slate-100 transition-colors">
                                                    <img
                                                        src={review.product.images?.[0] || '/placeholder.png'}
                                                        alt={review.product.name}
                                                        className="w-7 h-7 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-400 font-medium leading-none">Sản phẩm</p>
                                                        <p className="text-[11px] text-slate-700 font-bold truncate max-w-[200px] sm:max-w-[300px] mt-0.5">
                                                            {review.product.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Rating and Title */}
                                            <div className="mb-2.5">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {renderStars(review.rating)}
                                                    <span className="text-xs font-bold text-slate-700">({review.rating}/5)</span>
                                                </div>
                                                {review.title && (
                                                    <h3 className="font-bold text-slate-900 text-sm">{review.title}</h3>
                                                )}
                                            </div>

                                            {/* Comment */}
                                            <p className="text-slate-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{review.comment}</p>

                                            {/* Footer - Helpful Votes & Status */}
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-slate-500">
                                                    <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-xs font-semibold">{review.helpfulVotes || 0} hữu ích</span>
                                                </div>

                                                {review.isReported && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
                                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                        Bị báo cáo
                                                    </span>
                                                )}

                                                {review.isApproved === false && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 animate-pulse">
                                                        <Clock className="w-3.5 h-3.5 shrink-0" />
                                                        Chờ duyệt
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-col gap-1.5 ml-4 shrink-0 border-l border-slate-100 pl-4">
                                            {review.isApproved === false && (
                                                <button
                                                    onClick={() => approveMutation.mutate(review._id || review.id)}
                                                    className="p-2 hover:bg-green-50 rounded-xl text-green-600 transition-colors"
                                                    title="Duyệt đánh giá"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                            {(review.isApproved === true || review.isApproved === undefined) && (
                                                <button
                                                    onClick={() => rejectMutation.mutate(review._id || review.id)}
                                                    className="p-2 hover:bg-orange-50 rounded-xl text-orange-600 transition-colors"
                                                    title="Từ chối/Ẩn đánh giá"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (confirm('Xóa đánh giá này? Thao tác không thể hoàn tác.')) {
                                                        deleteMutation.mutate(review._id || review.id);
                                                    }
                                                }}
                                                className="p-2 hover:bg-red-50 rounded-xl text-red-600 transition-colors"
                                                title="Xóa vĩnh viễn"
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
                        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                            <p className="text-xs text-slate-500 font-semibold">
                                Trang {page} / {pagination.totalPages} ({pagination.totalItems || 0} đánh giá)
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4.5 py-2 text-xs font-bold border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page >= pagination.totalPages}
                                    className="px-4.5 py-2 text-xs font-bold border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Tiếp
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reviews;
