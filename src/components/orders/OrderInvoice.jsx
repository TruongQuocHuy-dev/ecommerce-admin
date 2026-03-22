import React from 'react';
import { format } from 'date-fns';

const OrderInvoice = React.forwardRef(({ order }, ref) => {
    if (!order) return null;

    return (
        <div ref={ref} className="p-8 bg-white text-gray-900" style={{ minWidth: '800px' }}>
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary-700 mb-2">INVOICE</h1>
                    <p className="text-gray-500">Order #{order.orderNumber}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-800">Your Store Name</h2>
                    <p className="text-sm text-gray-500">123 Commerce St.</p>
                    <p className="text-sm text-gray-500">New York, NY 10001</p>
                    <p className="text-sm text-gray-500">support@store.com</p>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
                    <p className="font-medium text-gray-900">{order.shippingAddress?.name}</p>
                    <p className="text-gray-600">{order.shippingAddress?.address}</p>
                    <p className="text-gray-600">
                        {order.shippingAddress?.city}, {order.shippingAddress?.province} {order.shippingAddress?.postalCode}
                    </p>
                    <p className="text-gray-600">{order.shippingAddress?.phone}</p>
                </div>
                <div className="text-right">
                    <div className="mb-2">
                        <span className="text-gray-500 mr-4">Invoice Date:</span>
                        <span className="font-medium">{format(new Date(), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="mb-2">
                        <span className="text-gray-500 mr-4">Order Date:</span>
                        <span className="font-medium">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 mr-4">Payment Method:</span>
                        <span className="font-medium uppercase">{order.paymentInfo?.method}</span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Item</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Qty</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Price</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, index) => (
                        <tr key={index}>
                            <td className="px-4 py-3">
                                <span className="font-medium text-gray-900">{item.name}</span>
                                {item.variationText && (
                                    <span className="block text-xs text-gray-500">{item.variationText}</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-gray-600">${item.price}</td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                                ${(item.price * item.quantity).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>${order.totalAmount}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Tax (0%)</span>
                        <span>$0.00</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span>$0.00</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-200 pt-2 mt-2">
                        <span>Total</span>
                        <span>${order.totalAmount}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-400 border-t border-gray-100 pt-8">
                <p>Thank you for your business!</p>
                <p>For any questions, please contact support@store.com</p>
            </div>
        </div>
    );
});

export default OrderInvoice;
