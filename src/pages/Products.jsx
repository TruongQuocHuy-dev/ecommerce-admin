import { useMemo, useState } from 'react'
import { Search, Edit, Trash2, Eye, Filter, CheckSquare, Square, CheckCircle, XCircle, Package } from 'lucide-react'
import { useProducts, useUpdateProduct, useDeleteProduct, useBulkDeleteProducts, useApproveProduct, useRejectProduct } from '../api/hooks/useProducts'
import { useCategories } from '../api/hooks/useCategories'
import ProductModal from '../components/products/ProductModal'
import ProductCommandCenterHeader from '../components/products/ProductCommandCenterHeader'
import ProductSummaryCards from '../components/products/ProductSummaryCards'
import { PERMISSIONS, hasPermission } from '../utils/permissions'
import { useTranslation } from '../i18n/index.jsx'
import useAuthStore from '../store/useAuthStore'

const Products = () => {
    const { user: currentUser } = useAuthStore()
    const { t } = useTranslation()
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [categoryFilter, setCategoryFilter] = useState('')
    const [approvalFilter, setApprovalFilter] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [modalMode, setModalMode] = useState('create')
    const [selectedIds, setSelectedIds] = useState([])

    // Permissions
    const canManageProducts = hasPermission(currentUser?.role, PERMISSIONS.MANAGE_PRODUCTS)

    // Data Hooks
    const { data, isLoading } = useProducts(page, 10, search, categoryFilter, approvalFilter)
    const { data: categories = [] } = useCategories()
    const updateProduct = useUpdateProduct()
    const deleteProduct = useDeleteProduct()
    const bulkDeleteProducts = useBulkDeleteProducts()
    const approveProduct = useApproveProduct()
    const rejectProduct = useRejectProduct()

    const products = data?.products || []
    const pagination = data?.pagination || {}

    const summary = useMemo(() => {
        const counts = products.reduce(
            (acc, product) => {
                const approvalStatus = product.approvalStatus || 'pending'
                acc.total += 1
                acc[approvalStatus] = (acc[approvalStatus] || 0) + 1
                if (product.isActive) {
                    acc.active += 1
                } else {
                    acc.inactive += 1
                }
                return acc
            },
            { total: 0, pending: 0, approved: 0, rejected: 0, active: 0, inactive: 0 }
        )

        return counts
    }, [products])

    const clearFilters = () => {
        setSearch('')
        setCategoryFilter('')
        setApprovalFilter('')
        setPage(1)
    }

    const hasActiveFilters = search || categoryFilter || approvalFilter

    // Helper to flatten hierarchical categories for the dropdown
    const flattenCategories = (cats, level = 0) => {
        let flat = []
        cats.forEach(cat => {
            flat.push({ ...cat, level })
            if (cat.children && cat.children.length > 0) {
                flat = flat.concat(flattenCategories(cat.children, level + 1))
            }
        })
        return flat
    }

    const flatCategories = flattenCategories(categories)

    // Methods
    const handleCreate = () => {
        setModalMode('create')
        setSelectedProduct(null)
        setIsModalOpen(true)
    }

    const handleEdit = (product) => {
        setModalMode('edit')
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteProduct.mutate(id)
        }
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(products.map(p => p.id || p._id))
        }
    }

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id))
        } else {
            setSelectedIds(prev => [...prev, id])
        }
    }

    const handleBulkDelete = () => {
        if (confirm(`Delete ${selectedIds.length} selected products?`)) {
            bulkDeleteProducts.mutate(selectedIds, {
                onSuccess: () => setSelectedIds([])
            })
        }
    }

    const handleApprovalChange = (id, newStatus) => {
        if (newStatus === 'approved') {
            if (confirm('Approve this product?')) {
                approveProduct.mutate(id)
            }
        } else if (newStatus === 'rejected') {
            const reason = prompt('Enter rejection reason (optional):')
            if (reason !== null) {
                rejectProduct.mutate({ id, details: reason })
            }
        }
    }

    const handleActiveChange = (id, isActive) => {
        updateProduct.mutate({ id, data: { isActive } })
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <ProductCommandCenterHeader
                title={t('products.title')}
                subtitle={t('products.subtitle')}
                onCreate={handleCreate}
                canCreate={canManageProducts}
            />

            <ProductSummaryCards summary={summary} />

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by product name or SKU code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                        />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-auto xl:min-w-[540px]">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                        >
                            <option value="">All categories</option>
                            {flatCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {'\u00A0'.repeat(cat.level * 2)}{cat.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={approvalFilter}
                            onChange={(e) => setApprovalFilter(e.target.value)}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                        >
                            <option value="">Approval status</option>
                            <option value="pending">Chờ duyệt</option>
                            <option value="approved">Đã duyệt</option>
                            <option value="rejected">Đã từ chối</option>
                        </select>

                        <button
                            type="button"
                            onClick={clearFilters}
                            disabled={!hasActiveFilters}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Filter className="h-4 w-4" />
                            Clear filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && canManageProducts && (
                <div className="flex flex-col gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-800 shadow-sm md:flex-row md:items-center md:justify-between animate-fade-in">
                    <span className="text-sm font-medium">{selectedIds.length} items selected</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleBulkDelete}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Product roster</h2>
                            <p className="text-sm text-slate-500">Use the table for status updates, moderation, and quick edits.</p>
                        </div>
                        <p className="text-sm text-slate-500">
                            Showing page {page} of {pagination.totalPages || 1}
                        </p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 w-10">
                                    <button onClick={toggleSelectAll} className="flex items-center justify-center text-gray-400 hover:text-gray-600">
                                        {selectedIds.length === products.length && products.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-primary-600" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Approval</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Active</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-14 text-center text-gray-500">
                                        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
                                            <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                                                <Package className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <p className="text-base font-semibold text-slate-800">No products found</p>
                                                <p className="mt-1 text-sm text-slate-500">Try changing filters or create a new product to get started.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    const isSelected = selectedIds.includes(product.id || product._id)
                                    const approvalTone = product.approvalStatus === 'approved'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : product.approvalStatus === 'rejected'
                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'

                                    const activeTone = product.isActive
                                        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'

                                    return (
                                        <tr key={product.id || product._id} className={`transition-colors hover:bg-slate-50 ${isSelected ? 'bg-cyan-50/40' : ''}`}>
                                            <td className="px-6 py-4">
                                                <button onClick={() => toggleSelect(product.id || product._id)} className="flex items-center justify-center text-gray-400 hover:text-gray-600">
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-primary-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={product.images?.[0] || '/placeholder.png'}
                                                        alt={product.name}
                                                        className="h-14 w-14 rounded-2xl object-cover bg-slate-100 border border-slate-200 shadow-sm"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-slate-900 line-clamp-1">{product.name}</p>
                                                        <p className="text-sm text-slate-500">SKU: {(product.id || product._id)?.slice(-6)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {product.category?.name || <span className="italic text-slate-400">No Category</span>}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                ${product.price?.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.stock > 10 ? 'bg-emerald-50 text-emerald-700' : product.stock > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                                                    {product.totalStock || product.stock || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <select
                                                        value={product.approvalStatus || 'pending'}
                                                        onChange={(e) => handleApprovalChange(product.id || product._id, e.target.value)}
                                                        disabled={!canManageProducts}
                                                        className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide outline-none transition ${approvalTone}`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="approved">Approved</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                    {product.approvalStatus === 'rejected' && (
                                                        <p className="text-xs text-rose-600 line-clamp-1">Needs rework before republish</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={product.isActive ? 'true' : 'false'}
                                                    onChange={(e) => handleActiveChange(product.id || product._id, e.target.value === 'true')}
                                                    disabled={!canManageProducts}
                                                    className={`rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide outline-none transition ${activeTone}`}
                                                >
                                                    <option value="true">Active</option>
                                                    <option value="false">Inactive</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canManageProducts && (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(product) }}
                                                                className="rounded-xl p-2 text-blue-600 transition hover:bg-blue-50"
                                                                title="Edit product"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(product.id || product._id) }}
                                                                className="rounded-xl p-2 text-red-500 transition hover:bg-red-50"
                                                                title="Delete product"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                    <p className="text-sm font-medium text-slate-600">
                        Showing page {page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= pagination.totalPages}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            <ProductModal
                key={selectedProduct?.id || selectedProduct?._id || 'new'}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
                mode={modalMode}
            />
        </div>
    )
}

export default Products
