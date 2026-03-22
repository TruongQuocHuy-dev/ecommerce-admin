import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Eye, Filter, CheckSquare, Square, X, Truck } from 'lucide-react'
import { useOrders, useUpdateOrderStatus, useBulkUpdateOrderStatus } from '../api/hooks/useOrders'
import { PERMISSIONS, hasPermission } from '../utils/permissions'
import { useTranslation } from '../i18n/index.jsx'
import useAuthStore from '../store/useAuthStore'

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
}

const Orders = () => {
    const { user: currentUser } = useAuthStore()
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const userIdParam = searchParams.get('userId')

    const [status, setStatus] = useState('')
    const [page, setPage] = useState(1)
    const [selectedIds, setSelectedIds] = useState([])

    // Permissions
    const canManageOrders = hasPermission(currentUser?.role, PERMISSIONS.MANAGE_ORDERS)

    // Hooks
    const { data, isLoading } = useOrders(page, 10, status, userIdParam)
    const updateStatus = useUpdateOrderStatus()
    const bulkUpdateStatus = useBulkUpdateOrderStatus()

    const orders = data?.orders || []
    const pagination = data?.pagination || {}

    // Handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === orders.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(orders.map(o => o.id || o._id))
        }
    }

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id))
        } else {
            setSelectedIds(prev => [...prev, id])
        }
    }

    const handleBulkStatusChange = (newStatus) => {
        if (confirm(`Update status of ${selectedIds.length} orders to ${newStatus}?`)) {
            bulkUpdateStatus.mutate({ ids: selectedIds, status: newStatus }, {
                onSuccess: () => setSelectedIds([])
            })
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('orders.title')}</h1>
                    <p className="text-slate-600 mt-1">{t('orders.subtitle')}</p>
                </div>
                {userIdParam && (
                    <div className="flex items-center bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
                        <span>Filtering by User ID: {userIdParam}</span>
                        <button
                            onClick={() => setSearchParams({})}
                            className="ml-2 hover:text-primary-900"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex-1">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:border-primary-500 outline-none bg-white min-w-[200px]"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && canManageOrders && (
                <div className="flex items-center gap-4 bg-primary-50 p-3 rounded-lg border border-primary-100 text-primary-700 animate-fade-in">
                    <span className="text-sm font-medium">{selectedIds.length} items selected</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Mark as:</span>
                        <button onClick={() => handleBulkStatusChange('processing')} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200">Processing</button>
                        <button onClick={() => handleBulkStatusChange('shipped')} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200">Shipped</button>
                        <button onClick={() => handleBulkStatusChange('delivered')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200">Delivered</button>
                    </div>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 w-10">
                                    <button onClick={toggleSelectAll} className="flex items-center justify-center text-gray-400 hover:text-gray-600">
                                        {selectedIds.length === orders.length && orders.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-primary-600" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">No orders found</td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const isSelected = selectedIds.includes(order.id || order._id)
                                    return (
                                        <tr key={order.id || order._id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <button onClick={() => toggleSelect(order.id || order._id)} className="flex items-center justify-center text-gray-400 hover:text-gray-600">
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-primary-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{order.customer?.name || 'Guest'}</span>
                                                    <span className="text-xs text-gray-500">{order.customer?.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {order.items?.length || 0} items
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                ${order.totalAmount?.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {canManageOrders ? (
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => updateStatus.mutate({
                                                            id: order.id || order._id,
                                                            status: e.target.value,
                                                        })}
                                                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-500 ${statusColors[order.status]}`}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="shipped">Shipped</option>
                                                        <option value="delivered">Delivered</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                ) : (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                                        {order.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${order.paymentInfo?.status === 'paid'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {order.paymentInfo?.status || 'pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => navigate(`/orders/${order.id || order._id}`)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
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
        </div>
    )
}

export default Orders
