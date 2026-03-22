import { useState } from 'react'
import { Search, Plus, Edit, Trash2, Eye, Filter, CheckSquare, Square, Archive, CheckCircle, XCircle } from 'lucide-react'
import { useProducts, useUpdateProduct, useDeleteProduct, useBulkDeleteProducts, useApproveProduct, useRejectProduct } from '../api/hooks/useProducts'
import { useCategories } from '../api/hooks/useCategories'
import ProductModal from '../components/products/ProductModal'
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('products.title')}</h1>
                    <p className="text-slate-600 mt-1">{t('products.subtitle')}</p>
                </div>
                {canManageProducts && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                )}
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 outline-none bg-white min-w-[150px]"
                    >
                        <option value="">Tất cả</option>
                        {flatCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {'\u00A0'.repeat(cat.level * 2)}{cat.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={approvalFilter}
                        onChange={(e) => setApprovalFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 outline-none bg-white min-w-[150px]"
                    >
                        <option value="">Trạng thái</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="rejected">Đã từ chối</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && canManageProducts && (
                <div className="flex items-center gap-4 bg-primary-50 p-3 rounded-lg border border-primary-100 text-primary-700 animate-fade-in">
                    <span className="text-sm font-medium">{selectedIds.length} items selected</span>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 text-sm font-medium shadow-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Selected
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 text-sm font-medium shadow-sm">
                        <Archive className="w-4 h-4" />
                        Archive Selected
                    </button>
                </div>
            )}

            {/* Products Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Approval</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Active</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
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
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No products found</td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    const isSelected = selectedIds.includes(product.id || product._id)
                                    return (
                                        <tr key={product.id || product._id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary-50/30' : ''}`}>
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
                                                        className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                                                        <p className="text-sm text-gray-500">SKU: {(product.id || product._id)?.slice(-6)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">
                                                {product.category?.name || <span className="text-gray-400 italic">No Category</span>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 font-medium">
                                                ${product.price?.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {product.totalStock || product.stock || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={product.approvalStatus || 'pending'}
                                                    onChange={(e) => handleApprovalChange(product.id || product._id, e.target.value)}
                                                    disabled={!canManageProducts}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border outline-none cursor-pointer ${product.approvalStatus === 'approved' ? 'bg-green-50 border-green-200 text-green-700' :
                                                        product.approvalStatus === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-red-50 border-red-200 text-red-700'
                                                        }`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={product.isActive ? 'true' : 'false'}
                                                    onChange={(e) => handleActiveChange(product.id || product._id, e.target.value === 'true')}
                                                    disabled={!canManageProducts}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border outline-none cursor-pointer ${product.isActive ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'
                                                        }`}
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
                                                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 text-blue-600 hover:bg-blue-50"
                                                                title="Edit"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(product.id || product._id) }}
                                                                className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                                                                title="Delete"
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
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">
                        Showing page {page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= pagination.totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
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
