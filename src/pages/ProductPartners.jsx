import { useMemo, useState, useEffect } from 'react'
import { 
    Building2, 
    Save, 
    Tag, 
    Trash2, 
    Truck, 
    Pencil, 
    X,
    Search,
    Plus,
    Globe,
    Mail,
    Phone,
    User,
    ExternalLink,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
    useBrands,
    useCreateBrand,
    useUpdateBrand,
    useDeleteBrand,
} from '../api/hooks/useBrands'
import {
    useSuppliers,
    useCreateSupplier,
    useUpdateSupplier,
    useDeleteSupplier,
} from '../api/hooks/useSuppliers'

// Helper for initials
const getInitials = (name) => {
    if (!name) return '??'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Helper for stable gradients
const getAvatarGradient = (name) => {
    const colors = [
        'from-pink-500 to-rose-500',
        'from-purple-500 to-indigo-500',
        'from-blue-500 to-cyan-500',
        'from-teal-500 to-emerald-500',
        'from-emerald-500 to-green-500',
        'from-amber-500 to-orange-500',
        'from-orange-500 to-red-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
}

// Format URL helper
const formatUrl = (url) => {
    if (!url) return ''
    if (/^https?:\/\//i.test(url)) return url
    return `https://${url}`
}

// Brand Modal Component
const BrandModal = ({ isOpen, onClose, brand, isPending, onSubmit }) => {
    const [form, setForm] = useState({ name: '', country: '', website: '' })

    useEffect(() => {
        if (brand) {
            setForm({
                name: brand.name || '',
                country: brand.country || '',
                website: brand.website || '',
            })
        } else {
            setForm({ name: '', country: '', website: '' })
        }
    }, [brand, isOpen])

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(form)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">
                        {brand ? 'Cập nhật nhãn hiệu' : 'Thêm nhãn hiệu mới'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                            Tên nhãn hiệu <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ví dụ: Apple, Samsung..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                            Quốc gia
                        </label>
                        <input
                            type="text"
                            value={form.country}
                            onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
                            placeholder="Ví dụ: USA, Hàn Quốc..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                            Website
                        </label>
                        <input
                            type="text"
                            value={form.website}
                            onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="Ví dụ: apple.com"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white text-sm"
                        />
                    </div>
                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-2xl text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold transition-colors text-sm"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-white bg-slate-900 hover:bg-slate-800 font-semibold transition-all shadow-md text-sm disabled:opacity-50"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {brand ? 'Cập nhật' : 'Lưu nhãn hiệu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Supplier Modal Component
const SupplierModal = ({ isOpen, onClose, supplier, isPending, onSubmit }) => {
    const [form, setForm] = useState({ name: '', contactName: '', email: '', phone: '' })

    useEffect(() => {
        if (supplier) {
            setForm({
                name: supplier.name || '',
                contactName: supplier.contactName || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
            })
        } else {
            setForm({ name: '', contactName: '', email: '', phone: '' })
        }
    }, [supplier, isOpen])

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(form)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">
                        {supplier ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                            Tên nhà cung cấp <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Nhập tên nhà cung cấp"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                            Người liên hệ
                        </label>
                        <input
                            type="text"
                            value={form.contactName}
                            onChange={(e) => setForm(prev => ({ ...prev, contactName: e.target.value }))}
                            placeholder="Tên người đại diện liên hệ"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white text-sm"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Email"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                Điện thoại
                            </label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Số điện thoại"
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-400 focus:bg-white text-sm"
                            />
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-2xl text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-semibold transition-colors text-sm"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-white bg-slate-900 hover:bg-slate-800 font-semibold transition-all shadow-md text-sm disabled:opacity-50"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {supplier ? 'Cập nhật' : 'Lưu nhà cung cấp'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const ProductPartners = () => {
    const { data: brands = [], isLoading: loadingBrands } = useBrands()
    const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers()

    const createBrand = useCreateBrand()
    const updateBrand = useUpdateBrand()
    const deleteBrand = useDeleteBrand()

    const createSupplier = useCreateSupplier()
    const updateSupplier = useUpdateSupplier()
    const deleteSupplier = useDeleteSupplier()

    // Tab state: 'brands' or 'suppliers'
    const [activeTab, setActiveTab] = useState('brands')

    // Search query states
    const [brandSearch, setBrandSearch] = useState('')
    const [supplierSearch, setSupplierSearch] = useState('')

    // Modal open states
    const [brandModalOpen, setBrandModalOpen] = useState(false)
    const [supplierModalOpen, setSupplierModalOpen] = useState(false)

    // Selected items for Edit mode
    const [selectedBrand, setSelectedBrand] = useState(null)
    const [selectedSupplier, setSelectedSupplier] = useState(null)

    // Pagination states
    const [brandPage, setBrandPage] = useState(1)
    const [supplierPage, setSupplierPage] = useState(1)
    const pageSize = 6 // Compact but structured

    // Reset pagination when tab switches or search query updates
    useEffect(() => {
        setBrandPage(1)
    }, [brandSearch])

    useEffect(() => {
        setSupplierPage(1)
    }, [supplierSearch])

    const stats = useMemo(() => ({
        brands: brands.length,
        suppliers: suppliers.length,
    }), [brands, suppliers])

    // Filtering lists based on search queries
    const filteredBrands = useMemo(() => {
        return brands.filter(brand => {
            const query = brandSearch.toLowerCase().trim()
            if (!query) return true
            return (
                brand.name?.toLowerCase().includes(query) ||
                brand.country?.toLowerCase().includes(query)
            )
        })
    }, [brands, brandSearch])

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(supplier => {
            const query = supplierSearch.toLowerCase().trim()
            if (!query) return true
            return (
                supplier.name?.toLowerCase().includes(query) ||
                supplier.contactName?.toLowerCase().includes(query) ||
                supplier.email?.toLowerCase().includes(query) ||
                supplier.phone?.toLowerCase().includes(query)
            )
        })
    }, [suppliers, supplierSearch])

    // Pagination calculation
    const totalPages = activeTab === 'brands' 
        ? Math.ceil(filteredBrands.length / pageSize)
        : Math.ceil(filteredSuppliers.length / pageSize)

    const currentPage = activeTab === 'brands' ? brandPage : supplierPage
    const setCurrentPage = activeTab === 'brands' ? setBrandPage : setSupplierPage
    const totalItems = activeTab === 'brands' ? filteredBrands.length : filteredSuppliers.length
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
    const endItem = Math.min(currentPage * pageSize, totalItems)

    const paginatedBrands = useMemo(() => {
        const start = (brandPage - 1) * pageSize
        return filteredBrands.slice(start, start + pageSize)
    }, [filteredBrands, brandPage, pageSize])

    const paginatedSuppliers = useMemo(() => {
        const start = (supplierPage - 1) * pageSize
        return filteredSuppliers.slice(start, start + pageSize)
    }, [filteredSuppliers, supplierPage, pageSize])

    // Loading status
    const isLoading = activeTab === 'brands' ? loadingBrands : loadingSuppliers

    // Handlers for Brand
    const handleBrandSubmit = (form) => {
        if (selectedBrand) {
            updateBrand.mutate({ id: selectedBrand._id || selectedBrand.id, data: form }, {
                onSuccess: () => {
                    setBrandModalOpen(false)
                    setSelectedBrand(null)
                    toast.success('Cập nhật nhãn hiệu thành công!')
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Lỗi cập nhật nhãn hiệu')
                }
            })
        } else {
            createBrand.mutate(form, {
                onSuccess: () => {
                    setBrandModalOpen(false)
                    toast.success('Thêm nhãn hiệu thành công!')
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Lỗi thêm nhãn hiệu')
                }
            })
        }
    }

    const handleDeleteBrand = (brand) => {
        if (confirm(`Bạn chắc chắn muốn xóa nhãn hiệu "${brand.name}"?`)) {
            deleteBrand.mutate(brand._id || brand.id, {
                onSuccess: () => {
                    toast.success('Xóa nhãn hiệu thành công!')
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Lỗi xóa nhãn hiệu')
                }
            })
        }
    }

    // Handlers for Supplier
    const handleSupplierSubmit = (form) => {
        if (selectedSupplier) {
            updateSupplier.mutate({ id: selectedSupplier._id || selectedSupplier.id, data: form }, {
                onSuccess: () => {
                    setSupplierModalOpen(false)
                    setSelectedSupplier(null)
                    toast.success('Cập nhật nhà cung cấp thành công!')
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Lỗi cập nhật nhà cung cấp')
                }
            })
        } else {
            createSupplier.mutate(form, {
                onSuccess: () => {
                    setSupplierModalOpen(false)
                    toast.success('Thêm nhà cung cấp thành công!')
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Lỗi thêm nhà cung cấp')
                }
            })
        }
    }

    const handleDeleteSupplier = (supplier) => {
        if (confirm(`Bạn chắc chắn muốn xóa nhà cung cấp "${supplier.name}"?`)) {
            deleteSupplier.mutate(supplier._id || supplier.id, {
                onSuccess: () => {
                    toast.success('Xóa nhà cung cấp thành công!')
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Lỗi xóa nhà cung cấp')
                }
            })
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header section with Stats */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_35%)]" />
                <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 backdrop-blur">
                            Product Partners
                        </p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Nhãn hiệu & Nhà cung cấp</h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300">Quản lý danh mục nhãn hiệu và nhà cung cấp để gắn trực tiếp vào từng sản phẩm.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur min-w-[120px] transition-all hover:bg-white/10">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nhãn hiệu</p>
                            <p className="mt-1 text-3xl font-bold text-white">{stats.brands}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur min-w-[120px] transition-all hover:bg-white/10">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Nhà cung cấp</p>
                            <p className="mt-1 text-3xl font-bold text-white">{stats.suppliers}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Search Controls */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Navigation Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl self-start">
                        <button
                            onClick={() => setActiveTab('brands')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'brands'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Tag className="w-4 h-4" />
                            Nhãn hiệu
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                activeTab === 'brands' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/60 text-slate-500'
                            }`}>
                                {stats.brands}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('suppliers')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                activeTab === 'suppliers'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Truck className="w-4 h-4" />
                            Nhà cung cấp
                            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                                activeTab === 'suppliers' ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/60 text-slate-500'
                            }`}>
                                {stats.suppliers}
                            </span>
                        </button>
                    </div>

                    {/* Action button & Search combination */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder={activeTab === 'brands' ? "Tìm kiếm nhãn hiệu..." : "Tìm kiếm nhà cung cấp..."}
                                value={activeTab === 'brands' ? brandSearch : supplierSearch}
                                onChange={(e) => activeTab === 'brands' ? setBrandSearch(e.target.value) : setSupplierSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none transition focus:border-slate-400 focus:bg-white text-sm"
                            />
                            {(activeTab === 'brands' ? brandSearch : supplierSearch) && (
                                <button
                                    onClick={() => activeTab === 'brands' ? setBrandSearch('') : setSupplierSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        
                        <button
                            onClick={() => {
                                if (activeTab === 'brands') {
                                    setSelectedBrand(null)
                                    setBrandModalOpen(true)
                                } else {
                                    setSelectedSupplier(null)
                                    setSupplierModalOpen(true)
                                }
                            }}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-2xl transition-all shadow-md active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            {activeTab === 'brands' ? 'Thêm nhãn hiệu' : 'Thêm nhà cung cấp'}
                        </button>
                    </div>
                </div>
            </div>

            {/* List & Table Representation */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        <p className="text-sm">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'brands' && (
                            filteredBrands.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Tag className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-semibold text-slate-900">Không tìm thấy nhãn hiệu nào</h4>
                                    <p className="text-sm text-slate-400 max-w-xs text-center">
                                        {brands.length === 0 ? 'Hệ thống chưa có nhãn hiệu nào. Hãy tạo nhãn hiệu đầu tiên của bạn.' : 'Thử tìm kiếm với tên hoặc từ khóa khác.'}
                                    </p>
                                    {brands.length === 0 && (
                                        <button
                                            onClick={() => {
                                                setSelectedBrand(null)
                                                setBrandModalOpen(true)
                                            }}
                                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm animate-fade-in"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Thêm nhãn hiệu
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                                                <th className="px-6 py-4">Nhãn hiệu</th>
                                                <th className="px-6 py-4">Quốc gia</th>
                                                <th className="px-6 py-4">Website</th>
                                                <th className="px-6 py-4 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {paginatedBrands.map((brand) => (
                                                <tr key={brand._id || brand.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(brand.name)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                                                {getInitials(brand.name)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 text-sm">{brand.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {brand.country ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                                <Globe className="w-3.5 h-3.5 text-slate-500" />
                                                                {brand.country}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Chưa cập nhật</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {brand.website ? (
                                                            <a
                                                                href={formatUrl(brand.website)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                Ghé thăm trang web
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Không có</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBrand(brand)
                                                                    setBrandModalOpen(true)
                                                                }}
                                                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors"
                                                                title="Sửa nhãn hiệu"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteBrand(brand)}
                                                                className="p-2 hover:bg-rose-50 rounded-xl text-rose-600 hover:text-rose-700 transition-colors"
                                                                title="Xóa nhãn hiệu"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}

                        {activeTab === 'suppliers' && (
                            filteredSuppliers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Truck className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-semibold text-slate-900">Không tìm thấy nhà cung cấp nào</h4>
                                    <p className="text-sm text-slate-400 max-w-xs text-center">
                                        {suppliers.length === 0 ? 'Hệ thống chưa có nhà cung cấp nào. Hãy tạo nhà cung cấp đầu tiên của bạn.' : 'Thử tìm kiếm với tên hoặc từ khóa khác.'}
                                    </p>
                                    {suppliers.length === 0 && (
                                        <button
                                            onClick={() => {
                                                setSelectedSupplier(null)
                                                setSupplierModalOpen(true)
                                            }}
                                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm animate-fade-in"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Thêm nhà cung cấp
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
                                                <th className="px-6 py-4">Nhà cung cấp</th>
                                                <th className="px-6 py-4">Người liên hệ</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4">Điện thoại</th>
                                                <th className="px-6 py-4 text-right">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {paginatedSuppliers.map((supplier) => (
                                                <tr key={supplier._id || supplier.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(supplier.name)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                                                {getInitials(supplier.name)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-900 text-sm">{supplier.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {supplier.contactName ? (
                                                            <span className="inline-flex items-center gap-1.5 text-slate-700 text-sm">
                                                                <User className="w-3.5 h-3.5 text-slate-400 animate-fade-in" />
                                                                {supplier.contactName}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Chưa cập nhật</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {supplier.email ? (
                                                            <a
                                                                href={`mailto:${supplier.email}`}
                                                                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                                                            >
                                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                                {supplier.email}
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Không có</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {supplier.phone ? (
                                                            <span className="inline-flex items-center gap-1.5 text-slate-700 text-sm">
                                                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                                {supplier.phone}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">Không có</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedSupplier(supplier)
                                                                    setSupplierModalOpen(true)
                                                                }}
                                                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors"
                                                                title="Sửa nhà cung cấp"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSupplier(supplier)}
                                                                className="p-2 hover:bg-rose-50 rounded-xl text-rose-600 hover:text-rose-700 transition-colors"
                                                                title="Xóa nhà cung cấp"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}

                        {/* Pagination Controls */}
                        {!isLoading && totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-150 bg-slate-50/40 px-6 py-4 gap-4">
                                <p className="text-xs text-slate-500">
                                    Hiển thị <span className="font-semibold text-slate-800">{startItem}</span> - <span className="font-semibold text-slate-800">{endItem}</span> trong tổng số <span className="font-semibold text-slate-800">{totalItems}</span> mục
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors bg-white"
                                        title="Trang trước"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                        const isCurrent = currentPage === pageNum
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-9 h-9 text-xs font-semibold rounded-xl border transition-all ${
                                                    isCurrent
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    })}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors bg-white"
                                        title="Trang sau"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Brand Modal */}
            <BrandModal 
                isOpen={brandModalOpen}
                onClose={() => {
                    setBrandModalOpen(false)
                    setSelectedBrand(null)
                }}
                brand={selectedBrand}
                isPending={createBrand.isPending || updateBrand.isPending}
                onSubmit={handleBrandSubmit}
            />

            {/* Supplier Modal */}
            <SupplierModal 
                isOpen={supplierModalOpen}
                onClose={() => {
                    setSupplierModalOpen(false)
                    setSelectedSupplier(null)
                }}
                supplier={selectedSupplier}
                isPending={createSupplier.isPending || updateSupplier.isPending}
                onSubmit={handleSupplierSubmit}
            />
        </div>
    )
}

export default ProductPartners
