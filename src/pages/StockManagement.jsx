import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Package, TrendingDown, TrendingUp, ExternalLink } from 'lucide-react';
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

    const tabs = [
        { id: 'out-of-stock', label: 'Hết hàng', icon: AlertCircle, color: 'red' },
        { id: 'low-stock', label: 'Sắp hết', icon: TrendingDown, color: 'orange' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Quản lý tồn kho</h1>
                    <p className="text-slate-600 mt-1">Theo dõi sản phẩm hết hàng và sắp hết hàng</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-600 font-medium text-sm">Hết hàng</p>
                            <p className="text-3xl font-bold text-red-700 mt-2">
                                {activeTab === 'out-of-stock' ? pagination.totalItems || 0 : '-'}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-red-700" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-600 font-medium text-sm">Sắp hết hàng</p>
                            <p className="text-3xl font-bold text-orange-700 mt-2">
                                {activeTab === 'low-stock' ? pagination.totalItems || 0 : '-'}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                            <TrendingDown className="w-6 h-6 text-orange-700" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
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
                                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                                isActive
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}

                {/* Threshold Input (only for low-stock) */}
                {activeTab === 'low-stock' && (
                    <div className="ml-auto flex items-center gap-2">
                        <label className="text-sm text-slate-600">Ngưỡng cảnh báo:</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                        />
                    </div>
                )}
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Sản phẩm</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Danh mục</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Người bán</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Giá</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tồn kho</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cập nhật</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={7} className="px-6 py-4">
                                        <div className="h-16 bg-slate-100 rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">
                                        {activeTab === 'out-of-stock'
                                            ? 'Không có sản phẩm hết hàng'
                                            : 'Không có sản phẩm sắp hết hàng'}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-3">
                                            <img
                                                src={product.images?.[0]}
                                                alt={product.name}
                                                className="w-12 h-12 object-cover rounded mt-1"
                                            />
                                            <div>
                                                <span className="font-medium text-slate-900 leading-tight block mb-1">{product.name}</span>
                                                {activeTab === 'out-of-stock' && product.outOfStockSkus?.length > 0 && (
                                                    <div className="text-xs text-red-600 space-y-0.5">
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
                                                    <div className="text-xs text-orange-600 space-y-0.5">
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
                                    <td className="px-6 py-4 text-slate-700">{product.category?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-slate-700">{product.seller?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-slate-900 font-medium">
                                        {new Intl.NumberFormat('vi-VN').format(product.price)}₫
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={clsx(
                                                'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                                                product.totalStock === 0
                                                    ? 'bg-red-100 text-red-700'
                                                    : product.totalStock <= 5
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                            )}
                                        >
                                            {product.totalStock || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">
                                        {new Date(product.updatedAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            to={`/products`}
                                            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
                                        >
                                            Chỉnh sửa
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
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
        </div>
    );
};

export default StockManagement;
