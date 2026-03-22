import { useParams, useNavigate } from 'react-router-dom'
import {
    Package,
    Calendar,
    MapPin,
    CreditCard,
    ArrowLeft,
    Send,
    CheckCircle,
    XCircle,
    Truck,
    Clock,
    Printer
} from 'lucide-react'
import { useOrder, useUpdateOrderStatus, useCancelOrder } from '../api/hooks/useOrders'
import { format } from 'date-fns'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import React, { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import OrderInvoice from '../components/orders/OrderInvoice'
import { useTranslation } from '../i18n/index.jsx'

const OrderDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { data: order, isLoading, isError } = useOrder(id)
    const updateStatus = useUpdateOrderStatus()
    const cancelOrder = useCancelOrder()

    // Print Invoice Ref and Handler
    const componentRef = useRef()
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Invoice-${order?.orderNumber || id}`,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (isError || !order || !order.status) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 mb-4">
                    {isError ? 'Error loading order details' : 'Order not found'}
                </p>
                <button
                    onClick={() => navigate('/orders')}
                    className="text-primary-600 hover:underline"
                >
                    Back to Orders
                </button>
            </div>
        )
    }

    const handleStatusUpdate = (newStatus) => {
        updateStatus.mutate({
            id: order._id || order.id,
            status: newStatus
        }, {
            onSuccess: () => {
                toast.success(`Order status updated to ${newStatus}`)
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to update status')
            }
        })
    }

    const handleCancelOrder = () => {
        if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
            cancelOrder.mutate(order._id || order.id, {
                onSuccess: () => {
                    toast.success('Order cancelled successfully')
                },
                onError: (error) => {
                    toast.error(error.message || 'Failed to cancel order')
                }
            })
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
            case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200'
            case 'delivered': return 'bg-green-50 text-green-700 border-green-200'
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
            default: return 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return Clock
            case 'processing': return Package
            case 'shipped': return Truck
            case 'delivered': return CheckCircle
            case 'cancelled': return XCircle
            default: return Package
        }
    }

    const StatusIcon = getStatusIcon(order.status)

    return (
        <div className="space-y-6 animate-fade-in relative">

            {/* Hidden Invoice Component for Printing */}
            <div style={{ display: "none" }}>
                <OrderInvoice ref={componentRef} order={order} />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/orders')}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            Order #{order.orderNumber}
                            <span className={clsx(
                                "px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1.5",
                                getStatusColor(order.status)
                            )}>
                                <StatusIcon className="w-4 h-4" />
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Placed on {format(new Date(order.createdAt), 'PPP p')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {/* Print Invoice Button */}
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Print Invoice
                    </button>

                    {/* Action Buttons based on status */}
                    {order.status === 'pending' && (
                        <button
                            onClick={() => handleStatusUpdate('processing')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow font-medium flex items-center gap-2"
                        >
                            <Package className="w-4 h-4" />
                            Process Order
                        </button>
                    )}
                    {order.status === 'processing' && (
                        <button
                            onClick={() => handleStatusUpdate('shipped')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm hover:shadow font-medium flex items-center gap-2"
                        >
                            <Truck className="w-4 h-4" />
                            Ship Order
                        </button>
                    )}
                    {order.status === 'shipped' && (
                        <button
                            onClick={() => handleStatusUpdate('delivered')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow font-medium flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Mark Delivered
                        </button>
                    )}
                    {order.isCancellable && (
                        <button
                            onClick={handleCancelOrder}
                            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" />
                            Cancel Order
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Package className="w-4 h-4 text-slate-500" />
                                Order Items
                            </h2>
                            <span className="text-sm text-slate-500">{order.items.length} items</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {order.items.map((item, index) => (
                                <div key={index} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <Package className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-slate-900 truncate">{item.name}</h3>
                                        <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                            <span>Qty: {item.quantity}</span>
                                            <span>Price: ${item.price}</span>
                                            {item.skuCode && (
                                                <span className="bg-slate-100 px-1.5 rounded text-xs flex items-center">SKU: {item.skuCode}</span>
                                            )}
                                        </div>
                                        {item.variationText && (
                                            <div className="text-xs text-primary-600 mt-1 bg-primary-50 inline-block px-2 py-0.5 rounded-full">
                                                {item.variationText}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right font-medium text-slate-900">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                            <div className="flex justify-end gap-12 text-sm">
                                <div className="space-y-1 text-slate-500">
                                    <p>Subtotal</p>
                                    <p>Shipping</p>
                                    {order.discount && <p>Discount</p>}
                                    <p className="text-base font-semibold text-slate-800 pt-2">Total</p>
                                </div>
                                <div className="space-y-1 text-right font-medium text-slate-900">
                                    <p>${order.totalAmount}</p>
                                    <p>Free</p>
                                    {order.discount && <p className="text-green-600">-${order.discount.amount}</p>}
                                    <p className="text-base font-bold text-primary-600 pt-2">${order.totalAmount}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Activity - Placeholder */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hidden">
                        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            Order Timeline
                        </h2>
                        {/* activity items would go here */}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-slate-500" />
                            Customer & Payment
                        </h2>
                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="text-slate-500 mb-1">Customer</p>
                                <div className="font-medium text-slate-900 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                                        {order.shippingAddress.name.charAt(0)}
                                    </div>
                                    {order.shippingAddress.name}
                                </div>
                                <p className="text-slate-500 ml-8 text-xs">{order.shippingAddress.phone}</p>
                            </div>
                            <div className="pt-3 border-t border-slate-50">
                                <p className="text-slate-500 mb-1">Payment Method</p>
                                <div className="font-medium text-slate-900 uppercase bg-slate-100 inline-block px-2 py-1 rounded text-xs">
                                    {order.paymentInfo.method}
                                </div>
                            </div>
                            <div>
                                <p className="text-slate-500 mb-1">Payment Status</p>
                                <span className={clsx(
                                    "px-2 py-1 rounded text-xs font-medium inline-block",
                                    order.paymentInfo.status === 'paid' ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                                )}>
                                    {order.paymentInfo.status.charAt(0).toUpperCase() + order.paymentInfo.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-500" />
                            Shipping Details
                        </h2>
                        <div className="text-sm text-slate-600 space-y-1">
                            <p className="font-medium text-slate-900">{order.shippingAddress.name}</p>
                            <p>{order.shippingAddress.phone}</p>
                            <p className="pt-2">{order.shippingAddress.address}</p>
                            <p>{order.shippingAddress.city} {order.shippingAddress.province}</p>
                            <p>{order.shippingAddress.postalCode}</p>
                        </div>
                    </div>

                    {/* Note */}
                    {order.notes && (
                        <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-6">
                            <h2 className="font-semibold text-yellow-800 mb-2 text-sm">Order Notes</h2>
                            <p className="text-sm text-yellow-700 italic">"{order.notes}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Invoice for Printing */}
            <div style={{ display: 'none' }}>
                <div ref={componentRef}>
                    <OrderInvoice order={order} />
                </div>
            </div>
        </div>
    )
}

export default OrderDetail
