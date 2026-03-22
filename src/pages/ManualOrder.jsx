import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Search, User as UserIcon, MapPin, ShoppingCart, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';

const ManualOrder = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [orderItems, setOrderItems] = useState([]);
    const [shippingAddress, setShippingAddress] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        province: '',
        postalCode: ''
    });

    // --- Search Users ---
    const { data: users = [] } = useQuery({
        queryKey: ['users', searchTerm],
        queryFn: async () => {
            if (!searchTerm) return [];
            const res = await api.get(`/users?search=${searchTerm}&limit=5`);
            return res.data.data.users;
        },
        enabled: searchTerm.length > 2
    });

    // --- Search Products ---
    const { data: products = [] } = useQuery({
        queryKey: ['products', productSearchTerm],
        queryFn: async () => {
            if (!productSearchTerm) return [];
            const res = await api.get(`/products?search=${productSearchTerm}&limit=5`);
            return res.data.data.products;
        },
        enabled: productSearchTerm.length > 2
    });

    // --- Create Order Mutation ---
    const createOrderMutation = useMutation({
        mutationFn: async (data) => {
            return await api.post('/orders/manual', data);
        },
        onSuccess: (data) => {
            toast.success('Order created successfully');
            navigate(`/orders/${data.data.data.order.id}`);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to create order');
        }
    });

    // --- Handlers ---

    const handleAddProduct = (product, sku = null) => {
        setOrderItems(prev => {
            const existingItemIndex = prev.findIndex(item =>
                item.productId === product.id && item.skuId === (sku ? sku._id : null)
            );

            if (existingItemIndex >= 0) {
                const newItems = [...prev];
                newItems[existingItemIndex].quantity += 1;
                return newItems;
            }

            return [...prev, {
                productId: product.id,
                name: product.name,
                image: product.images[0],
                price: sku ? sku.price : product.price,
                stock: sku ? sku.stock : product.stock,
                skuId: sku ? sku._id : null,
                skuCode: sku ? sku.skuCode : null,
                variationText: sku ? getVariationText(product, sku) : '',
                quantity: 1
            }];
        });
        setProductSearchTerm('');
    };

    const handleQuantityChange = (index, delta) => {
        setOrderItems(prev => {
            const newItems = [...prev];
            const item = newItems[index];
            const newQty = item.quantity + delta;

            if (newQty > item.stock) {
                toast.error(`Only ${item.stock} in stock`);
                return prev;
            }

            if (newQty < 1) return prev;

            item.quantity = newQty;
            return newItems;
        });
    };

    const handleRemoveItem = (index) => {
        setOrderItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedUser) {
            toast.error('Please select a customer');
            return;
        }
        if (orderItems.length === 0) {
            toast.error('Please add products');
            return;
        }
        if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address) {
            toast.error('Please fill shipping address');
            return;
        }

        createOrderMutation.mutate({
            userId: selectedUser.id || selectedUser._id,
            items: orderItems.map(item => ({
                productId: item.productId,
                skuId: item.skuId,
                quantity: item.quantity
            })),
            shippingAddress,
            paymentMethod: 'COD', // Default for manual, could include selector
            paymentStatus: 'pending'
        });
    };

    const getVariationText = (product, sku) => {
        if (!product.tierVariations || !sku.tierIndex) return '';
        return sku.tierIndex.map((idx, i) => product.tierVariations[i]?.options[idx]).join(' / ');
    };

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-8 h-8 text-primary-600" />
                Create Manual Order
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Customer & Address */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Customer Selection */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-gray-500" /> Customer
                        </h2>

                        {!selectedUser ? (
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search user by name/email..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                                {users.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 shadow-lg rounded-lg max-h-60 overflow-y-auto">
                                        {users.map(user => (
                                            <button
                                                key={user.id || user._id}
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setSearchTerm('');
                                                    // Auto-fill address if user has saved address (not implemented in this mock but typical)
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                                            >
                                                <div className="font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-primary-900">{selectedUser.name}</div>
                                    <div className="text-sm text-primary-600">{selectedUser.email}</div>
                                </div>
                                <button onClick={() => setSelectedUser(null)} className="text-primary-400 hover:text-primary-700">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Shipping Address */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-gray-500" /> Shipping Address
                        </h2>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Recipient Name"
                                value={shippingAddress.name}
                                onChange={e => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 outline-none"
                            />
                            <input
                                type="text"
                                placeholder="Phone Number"
                                value={shippingAddress.phone}
                                onChange={e => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 outline-none"
                            />
                            <textarea
                                placeholder="Address"
                                rows={2}
                                value={shippingAddress.address}
                                onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 outline-none resize-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={shippingAddress.city}
                                    onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 outline-none"
                                />
                                <input
                                    type="text"
                                    placeholder="Postal Code"
                                    value={shippingAddress.postalCode}
                                    onChange={e => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Products & Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-gray-500" /> Order Items
                        </h2>

                        {/* Product Search */}
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search products directly..."
                                value={productSearchTerm}
                                onChange={e => setProductSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                            {products.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 shadow-lg rounded-lg max-h-80 overflow-y-auto">
                                    {products.map(product => {
                                        // If product has skus, show them
                                        if (product.skus && product.skus.length > 0) {
                                            return (
                                                <React.Fragment key={product.id || product._id}>
                                                    {product.skus.map(sku => (
                                                        <button
                                                            key={sku._id}
                                                            onClick={() => handleAddProduct(product, sku)}
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 flex items-center gap-3"
                                                        >
                                                            <img src={product.images[0]} alt="" className="w-10 h-10 rounded object-cover" />
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-900">{product.name}</div>
                                                                <div className="text-sm text-gray-500 flex gap-2">
                                                                    <span className="bg-slate-100 px-1.5 rounded">{sku.skuCode}</span>
                                                                    <span className="bg-primary-50 px-1.5 rounded text-primary-700">{getVariationText(product, sku)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="font-semibold text-gray-900">${sku.price}</div>
                                                        </button>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        }
                                        return (
                                            <button
                                                key={product.id || product._id}
                                                onClick={() => handleAddProduct(product)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center gap-3"
                                            >
                                                <img src={product.images[0]} alt="" className="w-10 h-10 rounded object-cover" />
                                                <div className="flex-1 font-medium text-gray-900">{product.name}</div>
                                                <div className="font-semibold text-gray-900">${product.price}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-2 text-left rounded-l-lg">Product</th>
                                        <th className="px-4 py-2 text-center">Price</th>
                                        <th className="px-4 py-2 text-center">Qty</th>
                                        <th className="px-4 py-2 text-right">Total</th>
                                        <th className="px-4 py-2 text-center rounded-r-lg"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orderItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={item.image} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{item.name}</div>
                                                        {item.variationText && (
                                                            <div className="text-xs text-gray-500">{item.variationText}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">${item.price}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleQuantityChange(index, -1)}
                                                        className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleQuantityChange(index, 1)}
                                                        className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {orderItems.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                                                No items added yet. Search products to add.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="mt-6 border-t border-gray-100 pt-4 flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span>$0.00</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-100 pt-2">
                                    <span>Total</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={createOrderMutation.isPending}
                                    className="w-full mt-4 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
                                >
                                    <Save className="w-4 h-4" />
                                    {createOrderMutation.isPending ? 'Creating Order...' : 'Create Order'}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManualOrder;
