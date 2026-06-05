import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
    Search, Eye, Filter, CheckSquare, Square, X, Truck, 
    Clock, Package, CheckCircle, XCircle, Copy, Check, 
    Printer, Download, ChevronDown, DollarSign, ShoppingBag, 
    Calendar, ChevronRight, User, AlertCircle, Sparkles, MapPin, RefreshCw, Plus
} from 'lucide-react'
import { useOrders, useUpdateOrderStatus, useBulkUpdateOrderStatus, useCancelOrder } from '../api/hooks/useOrders'
import { useOrder } from '../api/hooks/useOrders'
import { PERMISSIONS, hasPermission } from '../utils/permissions'
import { useTranslation } from '../i18n/index.jsx'
import useAuthStore from '../store/useAuthStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { useReactToPrint } from 'react-to-print'
import OrderInvoice from '../components/orders/OrderInvoice'

const getStatusStyles = (status) => {
    switch (status) {
        case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500'
        case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500'
        case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500'
        case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500'
        case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500'
        default: return 'bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-500'
    }
}

const getPaymentStyles = (status) => {
    switch (status) {
        case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
        case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
        case 'failed': return 'bg-rose-50 text-rose-700 border-rose-200'
        default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
}

// Visual overlapping thumbnails for products in the order
const ItemPreviews = ({ items }) => {
    if (!items || items.length === 0) return null
    const maxPreviews = 3
    const previewItems = items.slice(0, maxPreviews)
    const extraCount = items.length - maxPreviews

    return (
        <div className="flex items-center -space-x-2.5 overflow-hidden">
            {previewItems.map((item, idx) => (
                <div 
                    key={idx} 
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 overflow-hidden relative group shadow-sm flex-shrink-0"
                    title={`${item.name} x${item.quantity}`}
                >
                    {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-[9px] text-slate-400 bg-slate-50 font-bold">
                            {item.name?.charAt(0) || 'P'}
                        </div>
                    )}
                </div>
            ))}
            {extraCount > 0 && (
                <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-200 text-[10px] font-bold text-slate-600 z-10 shadow-sm flex-shrink-0">
                    +{extraCount}
                </div>
            )}
        </div>
    )
}

// Side Drawer for Order Details
const OrderDrawer = ({ orderId, onClose, canManageOrders, updateStatus, cancelOrder }) => {
    const { data: order, isLoading, isError } = useOrder(orderId)
    const [copiedAddress, setCopiedAddress] = useState(false)
    const componentRef = useRef()
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Invoice-${order?.orderNumber || orderId}`,
    })

    if (!orderId) return null

    const handleCopyAddress = (addressStr) => {
        navigator.clipboard.writeText(addressStr)
        setCopiedAddress(true)
        setTimeout(() => setCopiedAddress(false), 2000)
        toast.success("Đã sao chép địa chỉ giao hàng!")
    }

    const getTimelineSteps = (status) => {
        const steps = [
            { key: 'pending', label: 'Chờ xử lý', icon: Clock, color: 'text-amber-500 bg-amber-50 border-amber-200' },
            { key: 'processing', label: 'Đang xử lý', icon: Package, color: 'text-blue-500 bg-blue-50 border-blue-200' },
            { key: 'shipped', label: 'Đã gửi', icon: Truck, color: 'text-purple-500 bg-purple-50 border-purple-200' },
            { key: 'delivered', label: 'Đã giao', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
        ]

        if (status === 'cancelled') {
            return [
                ...steps.slice(0, 2),
                { key: 'cancelled', label: 'Đã hủy', icon: XCircle, color: 'text-rose-500 bg-rose-50 border-rose-200' }
            ]
        }

        return steps
    }

    const getStepStatus = (stepKey, currentStatus) => {
        const orderOfSteps = ['pending', 'processing', 'shipped', 'delivered']
        if (currentStatus === 'cancelled') {
            if (stepKey === 'cancelled') return 'active'
            const curIdx = orderOfSteps.indexOf(stepKey)
            return curIdx <= 1 ? 'completed' : 'disabled'
        }
        
        const curIdx = orderOfSteps.indexOf(currentStatus)
        const stepIdx = orderOfSteps.indexOf(stepKey)

        if (stepIdx < curIdx) return 'completed'
        if (stepIdx === curIdx) return 'active'
        return 'upcoming'
    }

    return (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Slide-over container */}
            <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out animate-slide-up border-l border-slate-100">
                
                {/* Print Invoice Ref */}
                <div style={{ display: "none" }}>
                    {order && <OrderInvoice ref={componentRef} order={order} />}
                </div>

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-900">
                                Đơn hàng #{order?.orderNumber || '...'}
                            </h2>
                            {order && (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyles(order.status)}`}>
                                    {order.status === 'pending' && 'Chờ xử lý'}
                                    {order.status === 'processing' && 'Đang xử lý'}
                                    {order.status === 'shipped' && 'Đã gửi'}
                                    {order.status === 'delivered' && 'Đã giao'}
                                    {order.status === 'cancelled' && 'Đã hủy'}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">
                            {order && `Đặt lúc: ${new Date(order.createdAt).toLocaleString('vi-VN')}`}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body (scrollable) */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            <span className="text-sm">Đang tải chi tiết...</span>
                        </div>
                    ) : isError || !order ? (
                        <div className="text-center py-12 text-rose-500 space-y-3">
                            <XCircle className="w-12 h-12 mx-auto" />
                            <p>Không thể tải chi tiết đơn hàng.</p>
                            <button onClick={onClose} className="text-sm text-primary-600 underline">Đóng</button>
                        </div>
                    ) : (
                        <>
                            {/* Stepper Timeline */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Lộ trình đơn hàng</h3>
                                <div className="flex items-center justify-between relative">
                                    {/* Line connector */}
                                    <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-200 z-0" />
                                    
                                    {getTimelineSteps(order.status).map((step) => {
                                        const stepStatus = getStepStatus(step.key, order.status)
                                        const StepIcon = step.icon

                                        let iconBg = 'bg-slate-100 text-slate-400 border-slate-200'
                                        if (stepStatus === 'completed') {
                                            iconBg = 'bg-emerald-600 text-white border-emerald-600'
                                        } else if (stepStatus === 'active') {
                                            iconBg = step.color
                                        }

                                        return (
                                            <div key={step.key} className="flex flex-col items-center text-center relative z-10 flex-1">
                                                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-sm transition-all duration-300 ${iconBg}`}>
                                                    {stepStatus === 'completed' ? (
                                                        <Check className="w-5 h-5" />
                                                    ) : (
                                                        <StepIcon className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <span className={`text-[10px] sm:text-[11px] font-semibold mt-2 ${
                                                    stepStatus === 'active' ? 'text-slate-800' : 'text-slate-400'
                                                }`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Operations Actions Panel */}
                            {canManageOrders && (
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thao tác xử lý nhanh</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => {
                                                    updateStatus.mutate({ id: order.id || order._id, status: 'processing' })
                                                    onClose()
                                                }}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2"
                                            >
                                                <Package className="w-4 h-4" />
                                                Xử lý đơn hàng
                                            </button>
                                        )}
                                        {order.status === 'processing' && (
                                            <button
                                                onClick={() => {
                                                    updateStatus.mutate({ id: order.id || order._id, status: 'shipped' })
                                                    onClose()
                                                }}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2"
                                            >
                                                <Truck className="w-4 h-4" />
                                                Gửi vận chuyển
                                            </button>
                                        )}
                                        {order.status === 'shipped' && (
                                            <button
                                                onClick={() => {
                                                    updateStatus.mutate({ id: order.id || order._id, status: 'delivered' })
                                                    onClose()
                                                }}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Xác nhận đã giao
                                            </button>
                                        )}
                                        <button
                                            onClick={handlePrint}
                                            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                                        >
                                            <Printer className="w-4 h-4 text-slate-500" />
                                            In hóa đơn
                                        </button>
                                        
                                        {order.isCancellable && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này? Thao tác không thể hoàn tác.')) {
                                                        cancelOrder.mutate(order.id || order._id)
                                                        onClose()
                                                    }
                                                }}
                                                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-semibold rounded-xl transition-all border border-rose-200 flex items-center gap-2 sm:ml-auto"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Hủy đơn hàng
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Customer & Shipping Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <DollarSign className="w-4 h-4 text-primary-500" />
                                        <h4 className="text-sm font-bold text-slate-900">Thanh toán</h4>
                                    </div>
                                    <div className="text-xs space-y-2 text-slate-600">
                                        <p>Phương thức: <span className="font-semibold uppercase bg-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-800">{order.paymentInfo?.method}</span></p>
                                        <p>Trạng thái: 
                                            <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                                order.paymentInfo?.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                                {order.paymentInfo?.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <MapPin className="w-4 h-4 text-primary-500" />
                                            <h4 className="text-sm font-bold text-slate-900">Người nhận hàng</h4>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const addrStr = `${order.shippingAddress.name}, ${order.shippingAddress.phone}, ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.province || ''}`
                                                handleCopyAddress(addrStr)
                                            }}
                                            className="text-xs text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1 bg-white hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 shadow-sm transition-colors"
                                        >
                                            {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copiedAddress ? "Đã chép" : "Sao chép"}
                                        </button>
                                    </div>
                                    <div className="text-xs space-y-1 text-slate-600">
                                        <p className="font-bold text-slate-800">{order.shippingAddress?.name}</p>
                                        <p>SĐT: {order.shippingAddress?.phone}</p>
                                        <p className="truncate" title={order.shippingAddress?.address}>{order.shippingAddress?.address}</p>
                                        <p>{order.shippingAddress?.city} {order.shippingAddress?.province || ''}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Notes */}
                            {order.notes && (
                                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-amber-800 text-xs italic">
                                    <span className="font-bold block not-italic mb-1 text-amber-900">Ghi chú từ khách hàng:</span>
                                    "{order.notes}"
                                </div>
                            )}

                            {/* Order Items Table */}
                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-700">Chi tiết sản phẩm</span>
                                    <span className="text-xs text-slate-500">{order.items?.length || 0} mặt hàng</span>
                                </div>
                                <div className="divide-y divide-slate-100 bg-white">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="p-4 flex items-center gap-3 hover:bg-slate-50/50 transition-colors">
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <Package className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                                                <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-x-3">
                                                    <span>Số lượng: {item.quantity}</span>
                                                    <span>Đơn giá: {item.price.toLocaleString('vi-VN')} ₫</span>
                                                    {item.skuCode && <span className="bg-slate-100 px-1 rounded text-slate-700 font-mono">SKU: {item.skuCode}</span>}
                                                </div>
                                                {item.variationText && (
                                                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full inline-block mt-1 font-medium border border-indigo-100">
                                                        {item.variationText}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-slate-900 ml-auto">
                                                {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {/* Financial summary in drawer */}
                                <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Tạm tính:</span>
                                        <span className="font-semibold text-slate-800">{order.subtotal?.toLocaleString('vi-VN') || order.totalAmount?.toLocaleString('vi-VN')} ₫</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Vận chuyển:</span>
                                        <span className="font-semibold text-slate-800">Miễn phí</span>
                                    </div>
                                    {order.discount?.amount > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Mã giảm giá ({order.discount.code}):</span>
                                            <span className="font-semibold">-{order.discount.amount.toLocaleString('vi-VN')} ₫</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                                        <span>Tổng cộng:</span>
                                        <span className="text-primary-600 text-base font-extrabold">{(order.totalAmount || 0).toLocaleString('vi-VN')} ₫</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                {/* Footer of Drawer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all"
                    >
                        Đóng chi tiết
                    </button>
                </div>
            </div>
        </div>
    )
}

// Stats Card Component
const StatCard = ({ title, value, icon: Icon, colorClass, loading }) => {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <div className="space-y-2">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{title}</span>
                {loading ? (
                    <div className="h-7 w-24 bg-slate-100 rounded-lg animate-pulse" />
                ) : (
                    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
                )}
            </div>
            <div className={clsx("p-3 rounded-xl", colorClass)}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    )
}

const Orders = () => {
    const { user: currentUser } = useAuthStore()
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const userIdParam = searchParams.get('userId')

    // Filter and Pagination states
    const [status, setStatus] = useState('')
    const [page, setPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [paymentStatus, setPaymentStatus] = useState('')
    const [selectedIds, setSelectedIds] = useState([])
    const [drawerOrderId, setDrawerOrderId] = useState(null)
    const [copiedOrderId, setCopiedOrderId] = useState(null)

    // Debounce search string
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm)
            setPage(1)
        }, 400)
        return () => clearTimeout(handler)
    }, [searchTerm])

    // Permissions
    const canManageOrders = hasPermission(currentUser?.role, PERMISSIONS.MANAGE_ORDERS)

    // Hooks
    const { data, isLoading } = useOrders(page, 10, status, userIdParam, debouncedSearch, paymentStatus)
    const updateStatus = useUpdateOrderStatus()
    const bulkUpdateStatus = useBulkUpdateOrderStatus()
    const cancelOrder = useCancelOrder()

    const orders = data?.orders || []
    const pagination = data?.pagination || {}

    // Fetch analytic statistics for counters and cards
    const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
        queryKey: ['analytics-overview-orders-page'],
        queryFn: async () => {
            try {
                const res = await api.get('/analytics/overview')
                return res.data?.data || {}
            } catch (err) {
                console.error(err)
                return {}
            }
        }
    })

    const { data: orderStatsData } = useQuery({
        queryKey: ['analytics-orders-distribution-orders-page'],
        queryFn: async () => {
            try {
                const res = await api.get('/analytics/orders')
                return res.data?.data || []
            } catch (err) {
                console.error(err)
                return []
            }
        }
    })

    const statusCountMap = orderStatsData?.reduce((acc, curr) => ({
        ...acc,
        [curr.status]: curr.count
    }), {}) || {}

    // Handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === orders.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(orders.map(o => o.id || o._id))
        }
    }

    const toggleSelect = (e, id) => {
        e.stopPropagation() // Avoid triggering drawer open
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id))
        } else {
            setSelectedIds(prev => [...prev, id])
        }
    }

    const handleCopyOrderNumber = (e, orderNo, id) => {
        e.stopPropagation() // Avoid triggering drawer open
        navigator.clipboard.writeText(orderNo)
        setCopiedOrderId(id)
        setTimeout(() => setCopiedOrderId(null), 2000)
        toast.success(`Đã sao chép mã đơn hàng: #${orderNo}`)
    }

    const handleBulkStatusChange = (newStatus) => {
        if (confirm(`Cập nhật trạng thái của ${selectedIds.length} đơn hàng thành "${newStatus}"?`)) {
            bulkUpdateStatus.mutate({ ids: selectedIds, status: newStatus }, {
                onSuccess: () => setSelectedIds([])
            })
        }
    }

    // Status Tab Definitions
    const tabs = [
        { value: '', label: 'Tất cả', count: overviewData?.totalOrders || pagination?.totalItems || 0, icon: ShoppingBag },
        { value: 'pending', label: 'Chờ xử lý', count: statusCountMap.pending || 0, icon: Clock },
        { value: 'processing', label: 'Đang xử lý', count: statusCountMap.processing || 0, icon: Package },
        { value: 'shipped', label: 'Đã gửi', count: statusCountMap.shipped || 0, icon: Truck },
        { value: 'delivered', label: 'Đã giao', count: statusCountMap.delivered || 0, icon: CheckCircle },
        { value: 'cancelled', label: 'Đã hủy', count: statusCountMap.cancelled || 0, icon: XCircle }
    ]

    const handleQuickAction = (e, order, nextStatus) => {
        e.stopPropagation() // Prevent drawer opening
        const id = order.id || order._id
        updateStatus.mutate({ id, status: nextStatus }, {
            onSuccess: () => toast.success(`Đơn hàng #${order.orderNumber} chuyển sang "${nextStatus}"`)
        })
    }

    return (
        <div className="space-y-6 animate-fade-in relative min-h-screen pb-20">
            {/* CommandCenter Header (Synchronized with Products) */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl mb-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_28%)] animate-pulse" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200 backdrop-blur">
                                {t('orders.commandCenter')}
                            </span>
                            {userIdParam && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-primary-500/20 px-3 py-1 text-xs font-semibold text-primary-200 backdrop-blur">
                                    Đang lọc theo ID khách hàng: {userIdParam}
                                    <button
                                        onClick={() => setSearchParams({})}
                                        className="ml-1 hover:text-white hover:bg-white/10 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl flex items-center gap-2">
                            {t('orders.title')}
                            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">{t('orders.subtitle')}</p>
                    </div>
                    {canManageOrders && (
                        <button
                            onClick={() => navigate('/orders/create')}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-purple-500/20 transition-transform hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-xl hover:shadow-purple-500/30"
                        >
                            <Plus className="w-4 h-4 text-purple-600 font-bold" />
                            {t('orders.createOrder')}
                        </button>
                    )}
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Doanh thu hệ thống" 
                    value={`${(overviewData?.totalRevenue || 0).toLocaleString('vi-VN')} ₫`} 
                    icon={DollarSign}
                    colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100" 
                    loading={isOverviewLoading}
                />
                <StatCard 
                    title="Tổng đơn hàng" 
                    value={(overviewData?.totalOrders || 0).toLocaleString()} 
                    icon={ShoppingBag}
                    colorClass="bg-blue-50 text-blue-600 border border-blue-100" 
                    loading={isOverviewLoading}
                />
                <StatCard 
                    title="Đơn chờ xử lý" 
                    value={(overviewData?.pendingOrders || 0).toLocaleString()} 
                    icon={Clock}
                    colorClass="bg-amber-50 text-amber-600 border border-amber-100" 
                    loading={isOverviewLoading}
                />
                <StatCard 
                    title="Đơn hàng đã hủy" 
                    value={(overviewData?.canceledOrders || 0).toLocaleString()} 
                    icon={XCircle}
                    colorClass="bg-rose-50 text-rose-600 border border-rose-100" 
                    loading={isOverviewLoading}
                />
            </div>

            {/* Tabbed Status Filter */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex overflow-x-auto no-scrollbar scroll-smooth border-b border-slate-200 bg-slate-50/30">
                    {tabs.map((tab) => {
                        const TabIcon = tab.icon
                        const isActive = status === tab.value
                        return (
                            <button
                                key={tab.value}
                                onClick={() => {
                                    setStatus(tab.value)
                                    setPage(1)
                                }}
                                className={clsx(
                                    "flex items-center gap-2 px-5 py-4 border-b-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap outline-none",
                                    isActive
                                        ? "border-primary-600 text-primary-600 bg-primary-50/30"
                                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                )}
                            >
                                <TabIcon className={clsx("w-4.5 h-4.5", isActive ? "text-primary-600" : "text-slate-400")} />
                                <span>{tab.label}</span>
                                <span className={clsx(
                                    "text-xs px-2 py-0.5 rounded-full transition-all",
                                    isActive 
                                        ? "bg-primary-100 text-primary-700 font-bold" 
                                        : "bg-slate-100 text-slate-600"
                                )}>
                                    {tab.count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Search & Advanced Filters Panel */}
                <div className="p-5 flex flex-col md:flex-row gap-4 items-center justify-between bg-white border-b border-slate-100">
                    <div className="relative w-full md:max-w-md">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã đơn, tên hoặc email khách hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all text-sm"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                        <div className="flex items-center gap-2 text-sm text-slate-600 w-full sm:w-auto">
                            <span className="font-semibold text-xs text-slate-400 uppercase tracking-wider whitespace-nowrap">Thanh toán:</span>
                            <select
                                value={paymentStatus}
                                onChange={(e) => {
                                    setPaymentStatus(e.target.value)
                                    setPage(1)
                                }}
                                className="px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50/50 text-xs font-semibold w-full sm:w-auto"
                            >
                                <option value="">Tất cả</option>
                                <option value="pending">Chưa thanh toán</option>
                                <option value="paid">Đã thanh toán</option>
                                <option value="failed">Lỗi thanh toán</option>
                            </select>
                        </div>

                        {(searchTerm || paymentStatus || status) && (
                            <button
                                onClick={() => {
                                    setStatus('')
                                    setSearchTerm('')
                                    setPaymentStatus('')
                                    setPage(1)
                                }}
                                className="text-xs px-3 py-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-bold border border-rose-100 hover:border-rose-200 rounded-xl transition-all flex items-center gap-1.5 w-full sm:w-auto justify-center"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                </div>

                {/* Orders Table Container */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-4 w-12 text-center">
                                    <button 
                                        type="button"
                                        onClick={toggleSelectAll} 
                                        className="flex items-center justify-center text-slate-400 hover:text-primary-600 transition-colors mx-auto"
                                    >
                                        {selectedIds.length === orders.length && orders.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-primary-600 animate-scale-up" />
                                        ) : (
                                            <Square className="w-5 h-5" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-5 py-4">Mã đơn</th>
                                <th className="px-5 py-4">Khách hàng</th>
                                <th className="px-5 py-4">Sản phẩm</th>
                                <th className="px-5 py-4">Tổng tiền</th>
                                <th className="px-5 py-4">Trạng thái</th>
                                <th className="px-5 py-4">Thanh toán</th>
                                <th className="px-5 py-4">Ngày đặt</th>
                                <th className="px-5 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                            <span className="text-xs font-semibold">Đang tải danh sách đơn hàng...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <AlertCircle className="w-8 h-8 text-slate-300" />
                                            <span className="font-semibold text-sm">Không tìm thấy đơn hàng nào</span>
                                            <p className="text-xs text-slate-400">Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const id = order.id || order._id
                                    const isSelected = selectedIds.includes(id)
                                    const isCopied = copiedOrderId === id

                                    return (
                                        <tr 
                                            key={id} 
                                            onClick={() => setDrawerOrderId(id)}
                                            className={clsx(
                                                "hover:bg-slate-50/70 transition-colors cursor-pointer group",
                                                isSelected ? "bg-primary-50/20" : ""
                                            )}
                                        >
                                            {/* Select Checkbox */}
                                            <td className="px-5 py-4 text-center">
                                                <button 
                                                    type="button"
                                                    onClick={(e) => toggleSelect(e, id)} 
                                                    className="flex items-center justify-center text-slate-300 hover:text-primary-600 transition-colors mx-auto"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-primary-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5 opacity-70 group-hover:opacity-100" />
                                                    )}
                                                </button>
                                            </td>

                                            {/* Order Number */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-slate-900 font-mono">#{order.orderNumber}</span>
                                                    <button 
                                                        onClick={(e) => handleCopyOrderNumber(e, order.orderNumber, id)}
                                                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Sao chép mã đơn"
                                                    >
                                                        {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-slate-200">
                                                        {order.customer?.name?.charAt(0) || 'K'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800">{order.customer?.name || 'Khách vãng lai'}</span>
                                                        <span className="text-[11px] text-slate-400 font-mono">{order.customer?.email}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Overlapping Thumbnails */}
                                            <td className="px-5 py-4">
                                                <ItemPreviews items={order.items} />
                                            </td>

                                            {/* Total Amount */}
                                            <td className="px-5 py-4">
                                                <span className="font-extrabold text-slate-900">
                                                    {(order.totalAmount || 0).toLocaleString('vi-VN')} ₫
                                                </span>
                                            </td>

                                            {/* Order Status Select */}
                                            <td className="px-5 py-4">
                                                {canManageOrders ? (
                                                    <select
                                                        value={order.status}
                                                        onClick={(e) => e.stopPropagation()} 
                                                        onChange={(e) => updateStatus.mutate({
                                                            id: id,
                                                            status: e.target.value,
                                                        }, {
                                                            onSuccess: () => toast.success('Đã cập nhật trạng thái đơn hàng')
                                                        })}
                                                        className={clsx(
                                                            "px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none transition-all shadow-sm focus:ring-2 focus:ring-offset-1",
                                                            getStatusStyles(order.status)
                                                        )}
                                                    >
                                                        <option value="pending">Chờ xử lý</option>
                                                        <option value="processing">Đang xử lý</option>
                                                        <option value="shipped">Đã gửi</option>
                                                        <option value="delivered">Đã giao</option>
                                                        <option value="cancelled">Đã hủy</option>
                                                    </select>
                                                ) : (
                                                    <span className={clsx(
                                                        "inline-flex px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm",
                                                        getStatusStyles(order.status)
                                                    )}>
                                                        {order.status === 'pending' && 'Chờ xử lý'}
                                                        {order.status === 'processing' && 'Đang xử lý'}
                                                        {order.status === 'shipped' && 'Đã gửi'}
                                                        {order.status === 'delivered' && 'Đã giao'}
                                                        {order.status === 'cancelled' && 'Đã hủy'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Payment Status */}
                                            <td className="px-5 py-4">
                                                <span className={clsx(
                                                    "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm uppercase",
                                                    getPaymentStyles(order.paymentInfo?.status)
                                                )}>
                                                    {order.paymentInfo?.status === 'paid' ? 'Đã trả' : 'Chưa trả'}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-5 py-4 text-slate-500 font-medium text-xs">
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Quick workflow helper button */}
                                                    {order.status === 'pending' && (
                                                        <button
                                                            onClick={(e) => handleQuickAction(e, order, 'processing')}
                                                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors flex items-center gap-0.5 shadow-sm"
                                                            title="Bắt đầu xử lý đơn"
                                                        >
                                                            <Package className="w-3 h-3" />
                                                            Xử lý
                                                        </button>
                                                    )}
                                                    {order.status === 'processing' && (
                                                        <button
                                                            onClick={(e) => handleQuickAction(e, order, 'shipped')}
                                                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-colors flex items-center gap-0.5 shadow-sm"
                                                            title="Gửi vận chuyển đơn hàng"
                                                        >
                                                            <Truck className="w-3 h-3" />
                                                            Gửi đi
                                                        </button>
                                                    )}
                                                    {order.status === 'shipped' && (
                                                        <button
                                                            onClick={(e) => handleQuickAction(e, order, 'delivered')}
                                                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors flex items-center gap-0.5 shadow-sm"
                                                            title="Xác nhận giao hàng thành công"
                                                        >
                                                            <CheckCircle className="w-3 h-3" />
                                                            Giao
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setDrawerOrderId(id)
                                                        }}
                                                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 shadow-sm transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination section */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-500">
                            Hiển thị trang {page} / {pagination.totalPages} (Tổng {pagination.totalItems} đơn)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 transition-all shadow-sm"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= pagination.totalPages}
                                className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 transition-all shadow-sm"
                            >
                                Tiếp
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Bulk Action Bar */}
            {selectedIds.length > 0 && canManageOrders && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-5 animate-slide-up select-none">
                    <span className="text-xs font-semibold tracking-wide border-r border-slate-700 pr-4">
                        Đã chọn <strong className="text-primary-400 text-sm font-extrabold mx-1">{selectedIds.length}</strong> đơn hàng
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Đánh dấu thành:</span>
                        <button 
                            onClick={() => handleBulkStatusChange('processing')} 
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center gap-1 shadow-sm"
                        >
                            <Package className="w-3.5 h-3.5" />
                            Đang xử lý
                        </button>
                        <button 
                            onClick={() => handleBulkStatusChange('shipped')} 
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all flex items-center gap-1 shadow-sm"
                        >
                            <Truck className="w-3.5 h-3.5" />
                            Đã gửi đi
                        </button>
                        <button 
                            onClick={() => handleBulkStatusChange('delivered')} 
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center gap-1 shadow-sm"
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Đã giao xong
                        </button>
                        
                        <button 
                            onClick={() => setSelectedIds([])}
                            className="ml-2 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Bỏ chọn tất cả"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Sliding Drawer component overlay */}
            {drawerOrderId && (
                <OrderDrawer 
                    orderId={drawerOrderId}
                    onClose={() => setDrawerOrderId(null)}
                    canManageOrders={canManageOrders}
                    updateStatus={updateStatus}
                    cancelOrder={cancelOrder}
                />
            )}
        </div>
    )
}

export default Orders
