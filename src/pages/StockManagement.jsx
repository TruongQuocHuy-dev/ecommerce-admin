import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Package, TrendingDown, TrendingUp, ExternalLink, ChevronLeft, ChevronRight, Warehouse, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import clsx from 'clsx';

const StockManagement = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('out-of-stock'); // out-of-stock, low-stock
    const [page, setPage] = useState(1);
    const [threshold, setThreshold] = useState(10);

    // Fetch stock data based on active tab
    const { data, isLoading } = useQuery({
        queryKey: ['stock', activeTab, { page, threshold }],
        queryFn: async () => {
            const endpoint = activeTab === 'out-of-stock'
                ? `/products/out-of-stock?page=${page}&limit=10`
                : `/products/low-stock?page=${page}&limit=10&threshold=${threshold}`;

            const response = await api.get(endpoint);
            return response.data?.data || { products: [], pagination: {} };
        },
    });

    const products = data?.products || [];
    const pagination = data?.pagination || {};

    const summary = useMemo(() => ({
        total: pagination.totalItems || 0,
        low: products.length,
    }), [pagination.totalItems, products.length])

    const tabs = [
        { id: 'out-of-stock', label: 'Hết hàng', icon: AlertCircle, color: 'red' },
        { id: 'low-stock', label: 'Sắp hết', icon: TrendingDown, color: 'orange' },
    ];

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_28%)]" />
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-100 backdrop-blur">
                            Inventory Console
                        </p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Quản lý tồn kho</h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">Theo dõi sản phẩm hết hàng và sắp hết hàng bằng bố cục rõ ràng hơn.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-white">
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                            <p className="text-xs uppercase tracking-wide text-slate-300">Total</p>
                            <p className="mt-1 text-2xl font-bold">{summary.total}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                            <p className="text-xs uppercase tracking-wide text-slate-300">Visible</p>
                            <p className="mt-1 text-2xl font-bold text-orange-300">{summary.low}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-red-600">Hết hàng</p>
                            <p className="mt-2 text-3xl font-bold text-red-700">{activeTab === 'out-of-stock' ? pagination.totalItems || 0 : '-'}</p>
                        </div>
                        <div className="rounded-full bg-red-200 p-3 text-red-700">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-orange-600">Sắp hết hàng</p>
                            <p className="mt-2 text-3xl font-bold text-orange-700">{activeTab === 'low-stock' ? pagination.totalItems || 0 : '-'}</p>
                        </div>
                        <div className="rounded-full bg-orange-200 p-3 text-orange-700">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex flex-1 flex-wrap gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setPage(1);
                                    }}
                                    className={clsx(
                                        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                                        isActive
                                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                                            : 'text-slate-600 hover:bg-slate-50'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {activeTab === 'low-stock' && (
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                            <Warehouse className="h-4 w-4 text-slate-500" />
                            <label className="text-sm text-slate-600">Ngưỡng cảnh báo</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value))}
                                className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Inventory watchlist</h2>
                            <p className="text-sm text-slate-500">Gồm các sản phẩm out-of-stock và low-stock theo ngưỡng.</p>
                        </div>
                        <p className="text-sm text-slate-500">Trang {pagination.currentPage || 1} / {pagination.totalPages || 1}</p>
                    </div>
                </div>
                <table className="w-full">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sản phẩm</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Danh mục</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Người bán</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Giá</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tồn kho</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cập nhật</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={7} className="px-6 py-4">
                                        <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-14 text-center">
                                    <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                                        <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                                            <Package className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <p className="text-base font-semibold text-slate-800">
                                                {activeTab === 'out-of-stock' ? 'Không có sản phẩm hết hàng' : 'Không có sản phẩm sắp hết hàng'}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">Khi có biến động kho, danh sách này sẽ tự cập nhật theo tab hiện tại.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="transition-colors hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-3">
                                            <img
                                                src={product.images?.[0] || '/placeholder.png'}
                                                alt={product.name}
                                                className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                                            />
                                            <div>
                                                <span className="mb-1 block font-semibold leading-tight text-slate-900">{product.name}</span>
                                                {activeTab === 'out-of-stock' && product.outOfStockSkus?.length > 0 && (
                                                    <div className="space-y-1 text-xs text-red-600">
                                                        {product.outOfStockSkus.map(sku => {
                                                            const parts = [];
                                                            if (product.tierVariations) {
                                                                sku.tierIndex.forEach((index, i) => {
                                                                    const tier = product.tierVariations[i];
                                                                    if (tier) parts.push(tier.options[index]);
                                                                });
                                                            }
                                                            const name = parts.join(' - ') || sku.skuCode || 'Phân loại';
                                                            return <div key={sku._id}>• Hết hàng: {name}</div>;
                                                        })}
                                                    </div>
                                                )}
                                                {activeTab === 'low-stock' && product.lowStockSkus?.length > 0 && (
                                                    <div className="space-y-1 text-xs text-orange-600">
                                                        {product.lowStockSkus.map(sku => {
                                                            const parts = [];
                                                            if (product.tierVariations) {
                                                                sku.tierIndex.forEach((index, i) => {
                                                                    const tier = product.tierVariations[i];
                                                                    if (tier) parts.push(tier.options[index]);
                                                                });
                                                            }
                                                            const name = parts.join(' - ') || sku.skuCode || 'Phân loại';
                                                            return <div key={sku._id}>• {name}: Còn {sku.stock}</div>;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{product.category?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{product.seller?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-900">{new Intl.NumberFormat('vi-VN').format(product.price)}₫</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={clsx(
                                                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                                                product.totalStock === 0
                                                    ? 'bg-red-100 text-red-700'
                                                    : product.totalStock <= 5
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-amber-100 text-amber-700'
                                            )}
                                        >
                                            {product.totalStock || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(product.updatedAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/products`}
                                            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-primary-600 transition hover:bg-primary-50 hover:text-primary-700"
                                        >
                                            Chỉnh sửa
                                            <ExternalLink className="h-4 w-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
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
        </div>
    );
};

export default StockManagement;
