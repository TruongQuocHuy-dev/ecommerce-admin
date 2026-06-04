import { useMemo, useState } from 'react'
import { useProducts } from '../api/hooks/useProducts'
import { useCreateMovement, useCreateWarehouse, useInventoryOverview } from '../api/hooks/useInventory'
import api from '../api/client'
import {
    MapPin,
    Warehouse,
    Package,
    Clock3,
    RefreshCcw,
    Plus,
    Search,
    ArrowLeftRight,
    Save,
    AlertTriangle,
    TrendingUp,
    Gauge,
    SlidersHorizontal,
    Activity,
    User,
    ArrowRightLeft,
    CheckCircle2,
    X,
    FileText,
    ArrowRight,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    HelpCircle
} from 'lucide-react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'
import Modal from '../components/ui/Modal'
import clsx from 'clsx'

const emptyWarehouseForm = {
    name: '',
    code: '',
    city: '',
    address: '',
    capacity: '',
    notes: '',
}

const emptyMovementForm = {
    productId: '',
    skuCode: '',
    movementType: 'inbound',
    quantity: '',
    reason: '',
    note: '',
    warehouseId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
}

const InventoryManagement = () => {
    const [activeTab, setActiveTab] = useState('warehouses') // warehouses, ledger, logs
    const [isCreateWarehouseOpen, setIsCreateWarehouseOpen] = useState(false)
    const [isRecordMovementOpen, setIsRecordMovementOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [warehouseFilter, setWarehouseFilter] = useState('')
    const [threshold, setThreshold] = useState(10)
    const [page, setPage] = useState(1)

    const [warehouseForm, setWarehouseForm] = useState(emptyWarehouseForm)
    const [movementForm, setMovementForm] = useState(emptyMovementForm)
    const [productSearch, setProductSearch] = useState('')
    const [productDropdownOpen, setProductDropdownOpen] = useState(false)

    // State for viewing warehouse specific products
    const [selectedWarehouseForProducts, setSelectedWarehouseForProducts] = useState(null)
    const [warehouseProducts, setWarehouseProducts] = useState([])
    const [loadingWarehouseProducts, setLoadingWarehouseProducts] = useState(false)
    const [warehouseProductSearch, setWarehouseProductSearch] = useState('')

    // Fetch lists
    const { data: productsData } = useProducts(1, 100, '', '', 'approved')
    const { data, isLoading } = useInventoryOverview({
        search,
        warehouseId: warehouseFilter,
        threshold,
        page,
        limit: 10,
    })
    const createWarehouse = useCreateWarehouse()
    const createMovement = useCreateMovement()

    const products = productsData?.products || []
    const warehouses = data?.warehouses || []
    const records = data?.records || []
    const movements = data?.movements || []
    const pagination = data?.pagination || { currentPage: 1, totalPages: 1 }
    
    const summary = data?.summary || {
        totalStock: 0,
        reservedStock: 0,
        availableStock: 0,
        recordCount: 0,
        warehouseCount: 0,
        lowStockCount: 0,
        movementCount: 0,
    }

    const productOptions = useMemo(() => products.filter((product) => product.isActive !== false), [products])

    // Filter product search options in modal
    const filteredProducts = useMemo(() => {
        if (!productSearch) return productOptions
        return productOptions.filter(p => 
            p.name.toLowerCase().includes(productSearch.toLowerCase())
        )
    }, [productOptions, productSearch])

    // Load products for specific warehouse
    const handleOpenWarehouseProducts = async (warehouse) => {
        setSelectedWarehouseForProducts(warehouse)
        setLoadingWarehouseProducts(true)
        setWarehouseProductSearch('')
        try {
            const response = await api.get('/inventory/overview', {
                params: {
                    warehouseId: warehouse.id,
                    limit: 100
                }
            })
            setWarehouseProducts(response.data?.data?.records || [])
        } catch (error) {
            console.error("Failed to load products for warehouse:", error)
        } finally {
            setLoadingWarehouseProducts(false)
        }
    }

    const filteredWarehouseProducts = useMemo(() => {
        if (!warehouseProductSearch) return warehouseProducts
        return warehouseProducts.filter(r => 
            r.product?.name?.toLowerCase().includes(warehouseProductSearch.toLowerCase()) ||
            r.skuCode?.toLowerCase().includes(warehouseProductSearch.toLowerCase())
        )
    }, [warehouseProducts, warehouseProductSearch])

    // Get correct image for stock record (SKU-specific if available)
    const getRecordImage = (record) => {
        const product = record.product || {}
        if (record.skuCode && product.skus && product.skus.length > 0) {
            const sku = product.skus.find(s => s.skuCode === record.skuCode)
            if (sku && sku.images && sku.images.length > 0) {
                return sku.images[0]
            }
        }
        return product.images?.[0] || '/placeholder.png'
    }

    // Get selected product object
    const selectedProduct = useMemo(() => {
        return products.find(p => p.id === movementForm.productId)
    }, [products, movementForm.productId])

    // Get SKUs for selected product
    const skuOptions = useMemo(() => {
        if (!selectedProduct) return []
        return selectedProduct.skus || []
    }, [selectedProduct])

    // Auto set skuCode to default if product has no variation SKUs
    const handleProductSelect = (productId, productName) => {
        const prod = products.find(p => p.id === productId)
        const skus = prod?.skus || []
        
        setMovementForm(prev => ({
            ...prev,
            productId,
            skuCode: skus.length > 0 ? skus[0].skuCode : 'default'
        }))
        setProductSearch(productName)
        setProductDropdownOpen(false)
    }

    const openMovementModal = (initials = {}) => {
        const merged = { ...emptyMovementForm, ...initials }
        setMovementForm(merged)
        
        if (merged.productId) {
            const prod = products.find(p => p.id === merged.productId)
            if (prod) {
                setProductSearch(prod.name)
            }
        } else {
            setProductSearch('')
        }
        
        setIsRecordMovementOpen(true)
    }

    const handleWarehouseSubmit = (event) => {
        event.preventDefault()
        createWarehouse.mutate({
            name: warehouseForm.name,
            code: warehouseForm.code,
            location: {
                city: warehouseForm.city,
                address: warehouseForm.address,
            },
            capacity: warehouseForm.capacity ? Number(warehouseForm.capacity) : 0,
            notes: warehouseForm.notes,
        }, {
            onSuccess: () => {
                setWarehouseForm(emptyWarehouseForm)
                setIsCreateWarehouseOpen(false)
            },
        })
    }

    const handleMovementSubmit = (event) => {
        event.preventDefault()

        const payload = {
            productId: movementForm.productId,
            skuCode: movementForm.skuCode,
            movementType: movementForm.movementType,
            quantity: Number(movementForm.quantity),
            reason: movementForm.reason,
            note: movementForm.note,
        }

        if (movementForm.movementType === 'transfer') {
            payload.fromWarehouseId = movementForm.fromWarehouseId
            payload.toWarehouseId = movementForm.toWarehouseId
        } else {
            payload.warehouseId = movementForm.warehouseId
        }

        createMovement.mutate(payload, {
            onSuccess: () => {
                setMovementForm(emptyMovementForm)
                setProductSearch('')
                setIsRecordMovementOpen(false)
            },
        })
    }

    // Chart Data calculations
    const chartData = useMemo(() => {
        return warehouses.map(w => {
            const stock = w.stockCount || 0
            const cap = w.capacity || 1000
            return {
                code: w.code,
                name: w.name,
                "Đã sử dụng": stock,
                "Còn trống": Math.max(cap - stock, 0)
            }
        })
    }, [warehouses])

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-1">
            {/* Header section with Glowing Radial BG */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-6 py-8 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_30%)]" />
                <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200 backdrop-blur">
                            <Gauge className="h-3 w-3" /> System Workspace
                        </span>
                        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Quản lý kho hàng</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-300">
                            Hệ thống tổng quan tồn kho, lập sơ đồ lấp đầy thực tế, giám sát xuất nhập kho và ledger chi tiết.
                        </p>
                    </div>
                    
                    {/* Action buttons in header */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setIsCreateWarehouseOpen(true)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-3 text-sm font-semibold text-white transition backdrop-blur active:scale-95"
                        >
                            <Plus className="h-4 w-4 text-cyan-300" />
                            Thêm kho mới
                        </button>
                        <button
                            onClick={() => openMovementModal()}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/30 active:scale-95"
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                            Ghi nhận biến động
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Dashboard */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng sản phẩm tồn</p>
                            <p className="mt-1.5 text-2xl font-black text-slate-900">{summary.totalStock.toLocaleString()}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-slate-600 transition group-hover:scale-110 group-hover:bg-slate-100">
                            <Package className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="group relative rounded-2xl border border-sky-100 bg-sky-50/50 p-5 shadow-sm transition hover:shadow-md hover:border-sky-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-sky-500">Đang giữ (Reserved)</p>
                            <p className="mt-1.5 text-2xl font-black text-sky-800">{summary.reservedStock.toLocaleString()}</p>
                        </div>
                        <div className="rounded-2xl bg-sky-100/80 p-3 text-sky-600 transition group-hover:scale-110 group-hover:bg-sky-200/50">
                            <Clock3 className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="group relative rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm transition hover:shadow-md hover:border-emerald-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Sẵn có (Available)</p>
                            <p className="mt-1.5 text-2xl font-black text-emerald-800">{summary.availableStock.toLocaleString()}</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-100/80 p-3 text-emerald-600 transition group-hover:scale-110 group-hover:bg-emerald-200/50">
                            <Warehouse className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="group relative rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm transition hover:shadow-md hover:border-amber-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Cảnh báo hết hàng</p>
                            <p className="mt-1.5 text-2xl font-black text-amber-800">{summary.lowStockCount}</p>
                        </div>
                        <div className="rounded-2xl bg-amber-100/80 p-3 text-amber-600 transition group-hover:scale-110 group-hover:bg-amber-200/50">
                            <AlertTriangle className="h-5 w-5 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 p-1 rounded-2xl max-w-fit">
                <button
                    onClick={() => setActiveTab('warehouses')}
                    className={clsx(
                        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                        activeTab === 'warehouses'
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                >
                    <Warehouse className="w-4 h-4" />
                    Kho & Sức chứa
                </button>
                <button
                    onClick={() => setActiveTab('ledger')}
                    className={clsx(
                        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                        activeTab === 'ledger'
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                >
                    <FileText className="w-4 h-4" />
                    Sổ kho chi tiết
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={clsx(
                        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                        activeTab === 'logs'
                            ? "bg-slate-900 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                >
                    <RefreshCcw className="w-4 h-4" />
                    Lịch sử biến động
                </button>
            </div>

            {/* Content Switcher */}
            <div className="space-y-6">
                
                {/* TAB 1: WAREHOUSES OVERVIEW */}
                {activeTab === 'warehouses' && (
                    <div className="space-y-6">
                        {/* Recharts Capacity Chart card */}
                        {chartData.length > 0 && (
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-indigo-500" /> Sơ đồ mức độ lấp đầy các kho hàng
                                    </h3>
                                    <p className="text-sm text-slate-500">So sánh lượng sản phẩm thực tế và không gian trống còn lại theo sức chứa tối đa.</p>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="code" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '16px',
                                                    border: 'none',
                                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                    background: '#0f172a',
                                                    color: '#fff',
                                                    padding: '12px 16px'
                                                }}
                                                labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                            <Bar dataKey="Đã sử dụng" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="Còn trống" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Warehouses Grid */}
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {isLoading ? (
                                <div className="col-span-full py-16 text-center text-slate-500">Đang tải danh sách kho...</div>
                            ) : warehouses.length === 0 ? (
                                <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-300 py-16 text-center">
                                    <Warehouse className="mx-auto h-12 w-12 text-slate-300" />
                                    <h3 className="mt-4 text-lg font-bold text-slate-900">Chưa có kho hàng nào</h3>
                                    <p className="mt-1 text-sm text-slate-500">Đăng ký kho hàng đầu tiên để bắt đầu quản lý tồn kho theo địa điểm.</p>
                                    <button
                                        onClick={() => setIsCreateWarehouseOpen(true)}
                                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                                    >
                                        <Plus className="h-4 w-4" /> Thêm kho mới
                                    </button>
                                </div>
                            ) : warehouses.map((warehouse) => {
                                const stock = warehouse.stockCount || 0
                                const capacity = warehouse.capacity || 1000
                                const percent = Math.min(Math.round((stock / capacity) * 100), 100)
                                
                                return (
                                    <div
                                        key={warehouse.id}
                                        className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                                                        <Warehouse className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{warehouse.name}</h4>
                                                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">{warehouse.code}</span>
                                                    </div>
                                                </div>
                                                <span className={clsx(
                                                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                                    percent < 70 ? "bg-emerald-50 text-emerald-700" :
                                                    percent < 90 ? "bg-amber-50 text-amber-700" :
                                                    "bg-rose-50 text-rose-700 animate-pulse"
                                                )}>
                                                    {percent}% lấp đầy
                                                </span>
                                            </div>

                                            {/* Capacity Progress Bar */}
                                            <div className="mt-4 space-y-1">
                                                <div className="flex justify-between text-xs font-medium text-slate-500">
                                                    <span>Trạng thái lấp đầy</span>
                                                    <span>{stock.toLocaleString()} / {capacity.toLocaleString()}</span>
                                                </div>
                                                <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                        className={clsx(
                                                            "h-full rounded-full transition-all duration-500",
                                                            percent < 70 ? "bg-emerald-500" :
                                                            percent < 90 ? "bg-amber-500" :
                                                            "bg-rose-500"
                                                        )}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Sub stats */}
                                            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                                                <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                                                    <span className="block text-[10px] uppercase font-bold text-slate-400">Tồn kho</span>
                                                    <span className="font-extrabold text-slate-800">{warehouse.stockCount || 0}</span>
                                                </div>
                                                <div className="rounded-xl bg-sky-50/50 p-2 border border-sky-100/50">
                                                    <span className="block text-[10px] uppercase font-bold text-sky-400">Đang giữ</span>
                                                    <span className="font-extrabold text-sky-700">{warehouse.reservedCount || 0}</span>
                                                </div>
                                                <div className="rounded-xl bg-emerald-50/50 p-2 border border-emerald-100/50">
                                                    <span className="block text-[10px] uppercase font-bold text-emerald-400">Khả dụng</span>
                                                    <span className="font-extrabold text-emerald-700">{warehouse.availableCount || 0}</span>
                                                </div>
                                            </div>

                                            {/* Address and details */}
                                            <div className="mt-4 border-t border-slate-100 pt-3">
                                                <p className="flex items-start gap-1 text-xs text-slate-500">
                                                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                    <span>
                                                        {warehouse.location?.city || 'Chưa cập nhật thành phố'}{warehouse.location?.address ? `, ${warehouse.location.address}` : ''}
                                                    </span>
                                                </p>
                                                {warehouse.notes && (
                                                    <p className="mt-2 text-xs italic text-slate-400 line-clamp-1">
                                                        * {warehouse.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action inside card */}
                                        <div className="mt-4 pt-2 flex gap-2">
                                            <button
                                                onClick={() => handleOpenWarehouseProducts(warehouse)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 py-2 text-xs font-bold text-slate-700 transition active:scale-95"
                                            >
                                                <Package className="h-3.5 w-3.5" /> Xem sản phẩm
                                            </button>
                                            <button
                                                onClick={() => openMovementModal({ warehouseId: warehouse.id })}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 py-2 text-xs font-bold text-slate-700 transition active:scale-95"
                                            >
                                                <ArrowLeftRight className="h-3.5 w-3.5" /> Biến động
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 2: DETAILED STOCK LEDGER */}
                {activeTab === 'ledger' && (
                    <div className="space-y-4">
                        {/* Filters Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(event.target.value)
                                            setPage(1)
                                        }}
                                        placeholder="Tìm kiếm theo tên sản phẩm hoặc mã SKU..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <select
                                        value={warehouseFilter}
                                        onChange={(event) => {
                                            setWarehouseFilter(event.target.value)
                                            setPage(1)
                                        }}
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400"
                                    >
                                        <option value="">Tất cả kho hàng</option>
                                        {warehouses.map((warehouse) => (
                                            <option key={warehouse.id} value={warehouse.id}>
                                                {warehouse.code} - {warehouse.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm">
                                        <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-500 font-medium">Cảnh báo dưới:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={threshold}
                                            onChange={(event) => {
                                                setThreshold(Number(event.target.value))
                                                setPage(1)
                                            }}
                                            className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center font-bold text-slate-800 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ledger Table */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            <th className="px-6 py-4 text-left">Sản phẩm</th>
                                            <th className="px-6 py-4 text-left">Mã SKU</th>
                                            <th className="px-6 py-4 text-left">Kho chứa</th>
                                            <th className="px-6 py-4 text-right">Tổng tồn</th>
                                            <th className="px-6 py-4 text-right">Đang giữ</th>
                                            <th className="px-6 py-4 text-right">Có sẵn</th>
                                            <th className="px-6 py-4 text-center">Trạng thái</th>
                                            <th className="px-6 py-4 text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-12 text-center text-slate-400">Đang tải dữ liệu số kho...</td>
                                            </tr>
                                        ) : records.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-12 text-center text-slate-400">Không tìm thấy bản ghi tồn kho nào khớp.</td>
                                            </tr>
                                        ) : records.map((record) => {
                                            const product = record.product || {}
                                            const warehouse = record.warehouse || {}
                                            const isLowStock = record.availableQuantity <= threshold
                                            const isOutOfStock = record.quantity === 0

                                            return (
                                                <tr key={record.id} className="transition-colors hover:bg-slate-50/50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={getRecordImage(record)}
                                                                alt={product.name}
                                                                className="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                                                            />
                                                            <div className="max-w-xs md:max-w-sm">
                                                                <p className="font-semibold text-slate-900 truncate" title={product.name}>
                                                                    {product.name}
                                                                </p>
                                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 mt-1">
                                                                    {product.approvalStatus || 'approved'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{record.skuCode}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                                                            <span className="font-semibold text-slate-800">{warehouse.code || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-900">{record.quantity}</td>
                                                    <td className="px-6 py-4 text-right font-medium text-sky-600">{record.reservedQuantity}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{record.availableQuantity}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={clsx(
                                                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                                                            isOutOfStock ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                                            isLowStock ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                                            "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        )}>
                                                            {isOutOfStock ? 'Hết hàng' : isLowStock ? 'Sắp hết' : 'An toàn'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => openMovementModal({
                                                                productId: product.id,
                                                                skuCode: record.skuCode,
                                                                warehouseId: warehouse._id
                                                            })}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition"
                                                        >
                                                            <ArrowLeftRight className="h-3 w-3" /> Điều chỉnh
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                                    <p className="text-sm text-slate-500">
                                        Hiển thị trang <span className="font-semibold text-slate-800">{pagination.currentPage}</span> trên tổng số <span className="font-semibold text-slate-800">{pagination.totalPages}</span> trang
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                            disabled={page === 1}
                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" /> Trước
                                        </button>
                                        <button
                                            onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                                            disabled={page >= pagination.totalPages}
                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Sau <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: MOVEMENT LOGS */}
                {activeTab === 'logs' && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Lịch sử biến động kho hàng</h3>
                                    <p className="text-sm text-slate-500">Ghi nhận chi tiết tất cả các thao tác nhập, xuất, chuyển hoặc điều chỉnh tồn kho.</p>
                                </div>
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                                    <Activity className="h-3.5 w-3.5 text-slate-500" /> {movements.length} giao dịch gần đây
                                </span>
                            </div>

                            <div className="overflow-x-auto mt-4">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                                            <th className="pb-3 pt-2">Loại biến động</th>
                                            <th className="pb-3 pt-2">Sản phẩm</th>
                                            <th className="pb-3 pt-2">Kho liên quan</th>
                                            <th className="pb-3 pt-2 text-right">Số lượng</th>
                                            <th className="pb-3 pt-2">Lý do</th>
                                            <th className="pb-3 pt-2">Người thực hiện</th>
                                            <th className="pb-3 pt-2 text-right">Thời gian</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {movements.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="py-8 text-center text-slate-400">Chưa ghi nhận biến động kho nào.</td>
                                            </tr>
                                        ) : movements.map((movement) => {
                                            const product = movement.product || {}
                                            const warehouse = movement.warehouse || movement.toWarehouse || movement.fromWarehouse || {}
                                            const type = movement.movementType
                                            
                                            // Format display tags
                                            const typeConfigs = {
                                                inbound: { label: 'Nhập kho', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
                                                outbound: { label: 'Xuất kho', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
                                                transfer: { label: 'Chuyển kho', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
                                                adjustment: { label: 'Điều chỉnh', cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
                                                reserve: { label: 'Giữ hàng', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
                                                release: { label: 'Giải phóng', cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
                                            }
                                            const config = typeConfigs[type] || { label: type, cls: 'bg-slate-50 text-slate-700 border border-slate-200' }

                                            return (
                                                <tr key={movement.id} className="hover:bg-slate-50/30">
                                                    <td className="py-4">
                                                        <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase", config.cls)}>
                                                            {config.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-900">{product.name || 'N/A'}</span>
                                                            <span className="text-[10px] font-mono text-slate-400">SKU: {movement.skuCode}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        {type === 'transfer' ? (
                                                            <div className="flex items-center gap-1 text-slate-700 text-xs font-bold">
                                                                <span className="rounded bg-slate-100 px-1.5 py-0.5">{movement.fromWarehouse?.code || 'N/A'}</span>
                                                                <ArrowRight className="h-3 w-3 text-slate-400" />
                                                                <span className="rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.5">{movement.toWarehouse?.code || 'N/A'}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="font-mono text-xs font-bold bg-slate-100 rounded px-1.5 py-0.5 text-slate-700">
                                                                {warehouse.code || 'N/A'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-right font-extrabold text-slate-900">
                                                        {type === 'outbound' ? `-${movement.quantity}` :
                                                         type === 'inbound' ? `+${movement.quantity}` :
                                                         movement.quantity}
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="max-w-xs">
                                                            <p className="text-slate-700 line-clamp-1" title={movement.reason}>{movement.reason}</p>
                                                            {movement.note && <span className="text-[11px] italic text-slate-400 line-clamp-1">{movement.note}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-slate-600">
                                                        <div className="flex items-center gap-1.5">
                                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                                            <span className="text-xs font-semibold">{movement.actor?.name || 'Hệ thống'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-right text-xs text-slate-400 font-medium">
                                                        {new Date(movement.createdAt).toLocaleString('vi-VN')}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL 1: CREATE WAREHOUSE MODAL */}
            <Modal
                isOpen={isCreateWarehouseOpen}
                onClose={() => setIsCreateWarehouseOpen(false)}
                title="Tạo kho hàng mới"
                size="md"
            >
                <form onSubmit={handleWarehouseSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Tên kho hàng</label>
                            <input
                                required
                                value={warehouseForm.name}
                                onChange={(event) => setWarehouseForm((prev) => ({ ...prev, name: event.target.value }))}
                                placeholder="Kho trung chuyển Hà Nội"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mã viết tắt</label>
                            <input
                                required
                                value={warehouseForm.code}
                                onChange={(event) => setWarehouseForm((prev) => ({ ...prev, code: event.target.value }))}
                                placeholder="E.g. HN-01"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Thành phố / Tỉnh</label>
                            <input
                                required
                                value={warehouseForm.city}
                                onChange={(event) => setWarehouseForm((prev) => ({ ...prev, city: event.target.value }))}
                                placeholder="Hà Nội"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Sức chứa tối đa (sản phẩm)</label>
                            <input
                                type="number"
                                min="10"
                                required
                                value={warehouseForm.capacity}
                                onChange={(event) => setWarehouseForm((prev) => ({ ...prev, capacity: event.target.value }))}
                                placeholder="50000"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Địa chỉ chi tiết</label>
                        <textarea
                            required
                            value={warehouseForm.address}
                            onChange={(event) => setWarehouseForm((prev) => ({ ...prev, address: event.target.value }))}
                            placeholder="Số 10, ngõ 250 Nguyễn Xiển, Thanh Xuân"
                            rows="2"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white resize-none"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Ghi chú thêm</label>
                        <textarea
                            value={warehouseForm.notes}
                            onChange={(event) => setWarehouseForm((prev) => ({ ...prev, notes: event.target.value }))}
                            placeholder="Mô tả phân khu hoặc đặc tính kho lạnh, kho hàng khô..."
                            rows="2"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsCreateWarehouseOpen(false)}
                            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={createWarehouse.isPending}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-6 py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {createWarehouse.isPending ? 'Đang tạo...' : 'Lưu kho hàng'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 2: RECORD MOVEMENT MODAL */}
            <Modal
                isOpen={isRecordMovementOpen}
                onClose={() => setIsRecordMovementOpen(false)}
                title="Ghi nhận biến động tồn kho"
                size="md"
            >
                <form onSubmit={handleMovementSubmit} className="space-y-4">
                    
                    {/* Searchable Product Dropdown */}
                    <div className="relative space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Chọn sản phẩm</label>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                required
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value)
                                    setProductDropdownOpen(true)
                                    setMovementForm(prev => ({ ...prev, productId: '' }))
                                }}
                                onFocus={() => setProductDropdownOpen(true)}
                                placeholder="Nhập tên sản phẩm để tìm nhanh..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                            />
                            {productSearch && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProductSearch('')
                                        setMovementForm(prev => ({ ...prev, productId: '', skuCode: '' }))
                                        setProductDropdownOpen(true)
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200"
                                >
                                    <X className="h-3.5 w-3.5 text-slate-500" />
                                </button>
                            )}
                        </div>

                        {productDropdownOpen && (
                            <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
                                {filteredProducts.length === 0 ? (
                                    <div className="px-4 py-3 text-xs text-slate-400">Không tìm thấy sản phẩm hợp lệ</div>
                                ) : (
                                    filteredProducts.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handleProductSelect(p.id, p.name)}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50 transition"
                                        >
                                            <img
                                                src={p.images?.[0] || '/placeholder.png'}
                                                alt={p.name}
                                                className="h-8 w-8 rounded object-cover border border-slate-100"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 truncate">{p.name}</p>
                                                <span className="text-[10px] text-slate-400">ID: {p.id}</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Movement Type */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Loại thao tác</label>
                            <select
                                value={movementForm.movementType}
                                onChange={(event) => setMovementForm((prev) => ({ ...prev, movementType: event.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                            >
                                <option value="inbound">Nhập kho (Inbound)</option>
                                <option value="outbound">Xuất kho (Outbound)</option>
                                <option value="adjustment">Điều chỉnh số lượng (Adjustment)</option>
                                <option value="reserve">Tạm khóa / Giữ hàng (Reserve)</option>
                                <option value="release">Giải phóng khóa (Release)</option>
                                <option value="transfer">Chuyển kho (Transfer)</option>
                            </select>
                        </div>

                        {/* SKU Selector (Conditional based on selected product) */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mã SKU</label>
                            {skuOptions.length > 0 ? (
                                <select
                                    value={movementForm.skuCode}
                                    onChange={(event) => setMovementForm((prev) => ({ ...prev, skuCode: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white font-mono text-xs font-bold"
                                >
                                    {skuOptions.map((sku) => (
                                        <option key={sku.skuCode} value={sku.skuCode}>
                                            {sku.skuCode} ({sku.stock || 0} đang có)
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    readOnly
                                    value={movementForm.skuCode || 'default'}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-mono text-slate-500 outline-none cursor-not-allowed"
                                    placeholder="default"
                                />
                            )}
                        </div>
                    </div>

                    {/* Warehouse selectors based on movement type */}
                    {movementForm.movementType === 'transfer' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Kho nguồn</label>
                                <select
                                    required
                                    value={movementForm.fromWarehouseId}
                                    onChange={(event) => setMovementForm((prev) => ({ ...prev, fromWarehouseId: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                                >
                                    <option value="">Chọn kho xuất</option>
                                    {warehouses.map((w) => (
                                        <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Kho đích</label>
                                <select
                                    required
                                    value={movementForm.toWarehouseId}
                                    onChange={(event) => setMovementForm((prev) => ({ ...prev, toWarehouseId: event.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                                >
                                    <option value="">Chọn kho nhập</option>
                                    {warehouses.map((w) => (
                                        <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Kho hàng</label>
                            <select
                                required
                                value={movementForm.warehouseId}
                                onChange={(event) => setMovementForm((prev) => ({ ...prev, warehouseId: event.target.value }))}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                            >
                                <option value="">Chọn kho liên quan</option>
                               {warehouses.map((w) => (
                                   <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                               ))}
                            </select>
                        </div>
                    )}

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
                                placeholder="E.g. 50"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                            />
                        </div>

                        {/* Reason */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Lý do điều chỉnh</label>
                            <input
                                required
                                value={movementForm.reason}
                                onChange={(event) => setMovementForm((prev) => ({ ...prev, reason: event.target.value }))}
                                placeholder="E.g. Nhập hàng đợt mới, Bù hao hụt..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Ghi chú chi tiết (nếu có)</label>
                        <textarea
                            value={movementForm.note}
                            onChange={(event) => setMovementForm((prev) => ({ ...prev, note: event.target.value }))}
                            placeholder="Chi tiết nhà vận chuyển hoặc thông tin kiểm định..."
                            rows="2"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white resize-none"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsRecordMovementOpen(false)}
                            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={createMovement.isPending || !movementForm.productId}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-6 py-2.5 text-sm font-semibold text-white transition shadow active:scale-95 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {createMovement.isPending ? 'Đang lưu...' : 'Ghi nhận biến động'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL 3: WAREHOUSE PRODUCTS DETAILS MODAL */}
            <Modal
                isOpen={!!selectedWarehouseForProducts}
                onClose={() => setSelectedWarehouseForProducts(null)}
                title={selectedWarehouseForProducts ? `Sản phẩm tại kho: ${selectedWarehouseForProducts.name}` : ''}
                size="lg"
            >
                <div className="space-y-4">
                    {/* Search inside modal */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={warehouseProductSearch}
                            onChange={(e) => setWarehouseProductSearch(e.target.value)}
                            placeholder="Tìm kiếm sản phẩm hoặc SKU trong kho này..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                        />
                    </div>

                    {/* Table listing products */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 sticky top-0 z-10">
                                    <tr className="border-b border-slate-200">
                                        <th className="px-5 py-3 text-left">Sản phẩm</th>
                                        <th className="px-5 py-3 text-left">Mã SKU</th>
                                        <th className="px-5 py-3 text-right">Tổng tồn</th>
                                        <th className="px-5 py-3 text-right">Đang giữ</th>
                                        <th className="px-5 py-3 text-right">Khả dụng</th>
                                        <th className="px-5 py-3 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingWarehouseProducts ? (
                                        <tr>
                                            <td colSpan="6" className="px-5 py-8 text-center text-slate-400">Đang tải danh sách sản phẩm...</td>
                                        </tr>
                                    ) : filteredWarehouseProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-5 py-8 text-center text-slate-400">Không tìm thấy sản phẩm nào trong kho này.</td>
                                        </tr>
                                    ) : filteredWarehouseProducts.map((record) => {
                                        const product = record.product || {}
                                        return (
                                            <tr key={record.id} className="hover:bg-slate-50/50">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={getRecordImage(record)}
                                                            alt={product.name}
                                                            className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                                                        />
                                                        <p className="font-semibold text-slate-800 line-clamp-1 max-w-[200px]" title={product.name}>
                                                            {product.name}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 font-mono text-xs font-bold text-slate-500">{record.skuCode}</td>
                                                <td className="px-5 py-3 text-right font-bold text-slate-800">{record.quantity}</td>
                                                <td className="px-5 py-3 text-right text-sky-600 font-medium">{record.reservedQuantity}</td>
                                                <td className="px-5 py-3 text-right text-emerald-600 font-bold">{record.availableQuantity}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <div className="flex justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                openMovementModal({
                                                                    productId: product.id,
                                                                    skuCode: record.skuCode,
                                                                    warehouseId: selectedWarehouseForProducts.id
                                                                })
                                                                setSelectedWarehouseForProducts(null) // close products list modal
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 transition"
                                                        >
                                                            Điều chỉnh
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                openMovementModal({
                                                                    productId: product.id,
                                                                    skuCode: record.skuCode,
                                                                    fromWarehouseId: selectedWarehouseForProducts.id,
                                                                    movementType: 'transfer'
                                                                })
                                                                setSelectedWarehouseForProducts(null) // close products list modal
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 transition"
                                                        >
                                                            Chuyển đi
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end pt-3">
                        <button
                            type="button"
                            onClick={() => setSelectedWarehouseForProducts(null)}
                            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white transition active:scale-95"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default InventoryManagement