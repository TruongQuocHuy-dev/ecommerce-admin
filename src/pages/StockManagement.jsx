import { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    Package,
    TrendingDown,
    TrendingUp,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Warehouse,
    RefreshCcw,
    ArrowLeftRight,
    Save,
    X,
    PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import { useCreateMovement, useWarehouses } from '../api/hooks/useInventory';
import Modal from '../components/ui/Modal';
import clsx from 'clsx';

const emptyMovementForm = {
    productId: '',
    skuCode: '',
    movementType: 'inbound',
    quantity: '',
    reason: '',
    note: '',
    warehouseId: '',
}

// Sub-component to fetch and render warehouse stock breakdown for a product
const WarehouseBreakdown = ({ productId }) => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchBreakdown = async () => {
            try {
                const response = await api.get('/inventory/overview', {
                    params: { productId, limit: 50 }
                });
                if (isMounted) {
                    setRecords(response.data?.data?.records || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        fetchBreakdown();
        return () => {
            isMounted = false;
        };
    }, [productId]);

    if (loading) {
        return (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 animate-pulse py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-ping" />
                Đang tải thông tin vị trí kho...
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="text-[10px] text-rose-500 font-bold flex items-center gap-1 py-1">
                <AlertCircle className="h-3 w-3" /> Chưa được lưu kho hàng nào
            </div>
        );
    }

    return (
        <div className="mt-2 space-y-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">Kho chứa liên quan:</span>
            <div className="flex flex-wrap gap-1.5">
                {records.map(r => {
                    const qty = r.quantity || 0;
                    const available = r.availableQuantity || 0;
                    const isZero = qty === 0;

                    return (
                        <div
                            key={r.id}
                            className={clsx(
                                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold border shadow-sm transition hover:scale-105 cursor-default",
                                isZero
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : available <= 5
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                        >
                            <span className="text-slate-500 font-medium">{r.warehouse?.code || 'KHO'}:</span>
                            <span>{available} khả dụng (Tổng: {qty})</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StockManagement = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    
    const [activeTab, setActiveTab] = useState('out-of-stock'); // out-of-stock, low-stock
    const [page, setPage] = useState(1);
    const [threshold, setThreshold] = useState(10);

    // Modal and movement forms
    const [isMovementOpen, setIsMovementOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [movementForm, setMovementForm] = useState(emptyMovementForm);

    const { data: warehousesData } = useWarehouses();
    const warehouses = warehousesData || [];
    const createMovement = useCreateMovement();

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

    const skuOptions = useMemo(() => {
        if (!editingProduct) return [];
        return editingProduct.skus || [];
    }, [editingProduct]);

    const handleOpenMovementModal = (product) => {
        const skus = product.skus || [];
        let initialSku = 'default';

        if (product.outOfStockSkus && product.outOfStockSkus.length > 0) {
            initialSku = product.outOfStockSkus[0].skuCode;
        } else if (product.lowStockSkus && product.lowStockSkus.length > 0) {
            initialSku = product.lowStockSkus[0].skuCode;
        } else if (skus.length > 0) {
            initialSku = skus[0].skuCode;
        }

        setMovementForm({
            ...emptyMovementForm,
            productId: product.id || product._id,
            skuCode: initialSku,
            movementType: 'inbound',
            reason: 'Nhập hàng bổ sung cho sản phẩm hết / sắp hết kho',
            warehouseId: warehouses.length > 0 ? warehouses[0].id : '',
            quantity: '',
            note: ''
        });
        setEditingProduct(product);
        setIsMovementOpen(true);
    };

    const handleMovementSubmit = (event) => {
        event.preventDefault();

        const payload = {
            productId: movementForm.productId,
            skuCode: movementForm.skuCode,
            movementType: movementForm.movementType,
            quantity: Number(movementForm.quantity),
            reason: movementForm.reason,
            note: movementForm.note,
            warehouseId: movementForm.warehouseId,
        };

        createMovement.mutate(payload, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['stock'] });
                setMovementForm(emptyMovementForm);
                setIsMovementOpen(false);
            },
        });
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-1">
            {/* Header console */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_28%)]" />
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-100 backdrop-blur">
                            Inventory Watchlist
                        </p>
                        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Quản lý tồn kho</h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
                            Giám sát sản phẩm hết hàng hoặc sắp hết hàng, định vị chi tiết kho chứa và nhập bổ sung tồn kho trực quan.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-white">
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                            <p className="text-xs uppercase tracking-wide text-slate-300">Tổng watchlist</p>
                            <p className="mt-1 text-2xl font-bold">{summary.total}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                            <p className="text-xs uppercase tracking-wide text-slate-300">Trang hiện tại</p>
                            <p className="mt-1 text-2xl font-bold text-orange-300">{summary.low}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-red-600 uppercase tracking-wider">Hết hàng (Out of stock)</p>
                            <p className="mt-2 text-3xl font-black text-red-700">{activeTab === 'out-of-stock' ? pagination.totalItems || 0 : '-'}</p>
                        </div>
                        <div className="rounded-full bg-red-100 p-3 text-red-700">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-orange-600 uppercase tracking-wider">Sắp hết hàng (Low stock)</p>
                            <p className="mt-2 text-3xl font-black text-orange-700">{activeTab === 'low-stock' ? pagination.totalItems || 0 : '-'}</p>
                        </div>
                        <div className="rounded-full bg-orange-100 p-3 text-orange-700">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
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
                                        'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95',
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-md'
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
                            <label className="text-sm text-slate-600 font-semibold">Ngưỡng cảnh báo:</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={threshold}
                                onChange={(e) => {
                                    setThreshold(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-bold text-slate-800 outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Product watchlist table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Danh mục sản phẩm watchlist</h2>
                            <p className="text-sm text-slate-500">Danh sách các sản phẩm đang trong diện cảnh báo thiếu hụt hoặc hết hàng.</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-500">Trang {pagination.currentPage || 1} / {pagination.totalPages || 1}</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/80 border-b border-slate-200">
                            <tr className="text-xs font-bold uppercase tracking-wider text-slate-500 text-left">
                                <th className="px-6 py-3.5">Sản phẩm</th>
                                <th className="px-6 py-3.5">Danh mục</th>
                                <th className="px-6 py-3.5">Người bán</th>
                                <th className="px-6 py-3.5">Đơn giá</th>
                                <th className="px-6 py-3.5 text-center">Tổng tồn</th>
                                <th className="px-6 py-3.5">Cập nhật</th>
                                <th className="px-6 py-3.5 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
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
                                                <p className="text-base font-bold text-slate-800">
                                                    {activeTab === 'out-of-stock' ? 'Không có sản phẩm hết hàng' : 'Không có sản phẩm sắp hết hàng'}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500">Biến động tồn kho của các kho hàng sẽ tự động cập nhật bảng theo dõi này.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="transition-colors hover:bg-slate-50/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-4">
                                                <img
                                                    src={
                                                        (activeTab === 'out-of-stock'
                                                            ? product.outOfStockSkus?.[0]?.images?.[0]
                                                            : product.lowStockSkus?.[0]?.images?.[0]) ||
                                                        product.images?.[0] ||
                                                        '/placeholder.png'
                                                    }
                                                    alt={product.name}
                                                    className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                                                />
                                                <div className="max-w-md">
                                                    <span className="mb-1 block font-bold leading-tight text-slate-900">{product.name}</span>
                                                    
                                                    {/* Variation messages */}
                                                    {activeTab === 'out-of-stock' && product.outOfStockSkus?.length > 0 && (
                                                        <div className="space-y-1 text-xs text-red-600 font-medium">
                                                            {product.outOfStockSkus.map(sku => {
                                                                const parts = [];
                                                                if (product.tierVariations) {
                                                                    sku.tierIndex.forEach((index, i) => {
                                                                        const tier = product.tierVariations[i];
                                                                        if (tier) parts.push(tier.options[index]);
                                                                    });
                                                                }
                                                                const name = parts.join(' - ') || sku.skuCode || 'Phân loại';
                                                                return (
                                                                    <div key={sku._id} className="flex items-center gap-1.5 mt-0.5">
                                                                        {sku.images?.[0] && (
                                                                            <img
                                                                                src={sku.images[0]}
                                                                                alt={name}
                                                                                className="h-5 w-5 rounded object-cover border border-slate-100"
                                                                            />
                                                                        )}
                                                                        <span>• Hết hàng: {name}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    {activeTab === 'low-stock' && product.lowStockSkus?.length > 0 && (
                                                        <div className="space-y-1 text-xs text-orange-600 font-medium">
                                                            {product.lowStockSkus.map(sku => {
                                                                const parts = [];
                                                                if (product.tierVariations) {
                                                                    sku.tierIndex.forEach((index, i) => {
                                                                        const tier = product.tierVariations[i];
                                                                        if (tier) parts.push(tier.options[index]);
                                                                    });
                                                                }
                                                                const name = parts.join(' - ') || sku.skuCode || 'Phân loại';
                                                                return (
                                                                    <div key={sku._id} className="flex items-center gap-1.5 mt-0.5">
                                                                        {sku.images?.[0] && (
                                                                            <img
                                                                                src={sku.images[0]}
                                                                                alt={name}
                                                                                className="h-5 w-5 rounded object-cover border border-slate-100"
                                                                            />
                                                                        )}
                                                                        <span>• {name}: Còn {sku.stock}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Warehouse Location breakdown */}
                                                    <WarehouseBreakdown productId={product.id} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">{product.category?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-slate-600">{product.seller?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 font-bold text-slate-900">{new Intl.NumberFormat('vi-VN').format(product.price)}₫</td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={clsx(
                                                    'inline-flex rounded-full px-3 py-1 text-xs font-bold',
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
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(product.updatedAt).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col gap-1.5 items-center justify-center">
                                                <button
                                                    onClick={() => handleOpenMovementModal(product)}
                                                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-white transition active:scale-95 whitespace-nowrap shadow"
                                                >
                                                    <ArrowLeftRight className="h-3.5 w-3.5" /> Nhập / Điều chỉnh
                                                </button>
                                                <Link
                                                    to={`/products`}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700 transition"
                                                >
                                                    Sửa sản phẩm
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
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

            {/* QUICK RESTOCK / ADJUSTMENT MOVEMENT MODAL */}
            <Modal
                isOpen={isMovementOpen}
                onClose={() => setIsMovementOpen(false)}
                title={editingProduct ? `Nhập / Điều chỉnh tồn kho: ${editingProduct.name}` : ''}
                size="md"
            >
                <form onSubmit={handleMovementSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Selected Product (Readonly) */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Sản phẩm</label>
                            <input
                                readOnly
                                value={editingProduct?.name || ''}
                                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 font-semibold outline-none cursor-not-allowed"
                            />
                        </div>

                        {/* Sku Code Selection */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mã SKU / Phân loại</label>
                            {skuOptions.length > 0 ? (
                                <select
                                    value={movementForm.skuCode}
                                    onChange={(event) => setMovementForm((prev) => ({ ...prev, skuCode: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono font-bold outline-none transition focus:border-indigo-500"
                                >
                                    {skuOptions.map((sku) => (
                                        <option key={sku.skuCode} value={sku.skuCode}>
                                            {sku.skuCode} (Tồn hiện tại: {sku.stock || 0})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    readOnly
                                    value="default"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-mono text-slate-500 outline-none cursor-not-allowed"
                                />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Movement Type */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Loại thao tác</label>
                            <select
                                value={movementForm.movementType}
                                onChange={(event) => setMovementForm((prev) => ({ ...prev, movementType: event.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500"
                            >
                                <option value="inbound">Nhập hàng thêm (Inbound)</option>
                                <option value="outbound">Xuất hàng đi (Outbound)</option>
                                <option value="adjustment">Điều chỉnh số lượng (Adjustment)</option>
                                <option value="reserve">Tạm khóa hàng (Reserve)</option>
                                <option value="release">Giải phóng khóa (Release)</option>
                            </select>
                        </div>

                        {/* Warehouse selector */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Kho hàng tác động</label>
                            <select
                                required
                                value={movementForm.warehouseId}
                                onChange={(event) => setMovementForm((prev) => ({ ...prev, warehouseId: event.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500"
                            >
                                <option value="">Chọn kho hàng</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.code} - {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Quantity */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Số lượng</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={movementForm.quantity}
                                onChange={(event) => setMovementForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                placeholder="E.g. 100"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500"
                            />
                        </div>

                        {/* Reason */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Lý do biến động</label>
                            <input
                                required
                                value={movementForm.reason}
                                onChange={(event) => setMovementForm((prev) => ({ ...prev, reason: event.target.value }))}
                                placeholder="E.g. Nhập thêm hàng mới..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Ghi chú (nếu có)</label>
                        <textarea
                            value={movementForm.note}
                            onChange={(event) => setMovementForm((prev) => ({ ...prev, note: event.target.value }))}
                            placeholder="Mô tả thông tin bổ sung..."
                            rows="2"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 resize-none"
                        />
                    </div>

                    {/* Footer buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsMovementOpen(false)}
                            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={createMovement.isPending}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white transition active:scale-95 shadow disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {createMovement.isPending ? 'Đang lưu...' : 'Ghi nhận biến động'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StockManagement;
