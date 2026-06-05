import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
    Plus, Trash2, Search, User as UserIcon, MapPin, 
    ShoppingCart, Save, ArrowLeft, Package, Sparkles, X, PlusCircle, MinusCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import clsx from 'clsx';

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
            return res.data?.data?.users || [];
        },
        enabled: searchTerm.length > 2
    });

    // --- Search Products ---
    const { data: products = [] } = useQuery({
        queryKey: ['products', productSearchTerm],
        queryFn: async () => {
            if (!productSearchTerm) return [];
            const res = await api.get(`/products?search=${productSearchTerm}&limit=5`);
            return res.data?.data?.products || [];
        },
        enabled: productSearchTerm.length > 2
    });

    // --- Create Order Mutation ---
    const createOrderMutation = useMutation({
        mutationFn: async (data) => {
            return await api.post('/orders/manual', data);
        },
        onSuccess: (data) => {
            toast.success('Đã tạo đơn hàng thủ công thành công!');
            navigate(`/orders`);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Không thể tạo đơn hàng');
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
                if (newItems[existingItemIndex].quantity >= (sku ? sku.stock : product.stock)) {
                    toast.error('Số lượng vượt quá tồn kho khả dụng');
                    return prev;
                }
                newItems[existingItemIndex].quantity += 1;
                return newItems;
            }

            const itemImage = (sku && sku.images && sku.images.length > 0) ? sku.images[0] : (product.images?.[0] || '');
            const itemPrice = sku ? sku.price : product.price;
            const itemStock = sku ? sku.stock : product.stock;

            return [...prev, {
                productId: product.id,
                name: product.name,
                image: itemImage,
                price: itemPrice,
                stock: itemStock,
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
                toast.error(`Chỉ còn lại ${item.stock} sản phẩm trong kho`);
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
            toast.error('Vui lòng chọn một khách hàng');
            return;
        }
        if (orderItems.length === 0) {
            toast.error('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }
        if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address) {
            toast.error('Vui lòng điền thông tin địa chỉ giao nhận');
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
            paymentMethod: 'COD',
            paymentStatus: 'pending'
        });
    };

    const getVariationText = (product, sku) => {
        if (!product.tierVariations || !sku.tierIndex) return '';
        return sku.tierIndex.map((idx, i) => product.tierVariations[i]?.options[idx]).join(' / ');
    };

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative">
            
            {/* CommandCenter Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_28%)] animate-pulse" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => navigate('/orders')}
                                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-colors border border-white/10 shadow-sm"
                                title="Quay lại danh sách"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200 backdrop-blur">
                                {t('orders.commandCenter')}
                            </span>
                        </div>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl flex items-center gap-2">
                            Tạo đơn hàng thủ công
                            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
                            Hỗ trợ tạo đơn đặt hàng trực tiếp, chỉ định thông tin khách hàng và lên đơn vị vận chuyển thủ công.
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Customer & Address Form */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Customer Selection Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-primary-500" />
                            Khách hàng đặt mua
                        </h2>

                        {!selectedUser ? (
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Search className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên/email khách hàng..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all text-sm"
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')} 
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}

                                {users.length > 0 && (
                                    <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl max-h-60 overflow-y-auto divide-y divide-slate-50">
                                        {users.map(user => (
                                            <button
                                                key={user.id || user._id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setSearchTerm('');
                                                    // Auto-fill shipping address details if available
                                                    setShippingAddress(prev => ({
                                                        ...prev,
                                                        name: user.name || '',
                                                        phone: user.phone || ''
                                                    }));
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-slate-50/50 transition-colors flex items-center gap-3"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200 uppercase">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-slate-800 text-xs truncate">{user.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono truncate">{user.email}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-primary-50/40 border border-primary-100 rounded-2xl flex justify-between items-center animate-fade-in">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs uppercase border border-primary-200">
                                        {selectedUser.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-xs">{selectedUser.name}</div>
                                        <div className="text-[10px] text-primary-600 font-mono mt-0.5">{selectedUser.email}</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedUser(null)} 
                                    className="p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100 shadow-sm"
                                    title="Hủy chọn khách hàng"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Shipping Address Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary-500" />
                            Địa chỉ giao hàng
                        </h2>
                        <div className="space-y-3.5">
                            <input
                                type="text"
                                placeholder="Họ và tên người nhận"
                                value={shippingAddress.name}
                                onChange={e => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                                className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            />
                            <input
                                type="text"
                                placeholder="Số điện thoại nhận hàng"
                                value={shippingAddress.phone}
                                onChange={e => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            />
                            <textarea
                                placeholder="Số nhà, tên đường, xã/phường..."
                                rows={2}
                                value={shippingAddress.address}
                                onChange={e => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                                className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="Thành phố / Tỉnh"
                                    value={shippingAddress.city}
                                    onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                />
                                <input
                                    type="text"
                                    placeholder="Mã bưu điện (tùy chọn)"
                                    value={shippingAddress.postalCode}
                                    onChange={e => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Product Selection & Order Items Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-primary-500" />
                                Chi tiết giỏ hàng lên đơn
                            </h2>

                            {/* Product Search Input */}
                            <div className="relative mb-6">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Search className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..."
                                    value={productSearchTerm}
                                    onChange={e => setProductSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 outline-none w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all text-sm"
                                />
                                {productSearchTerm && (
                                    <button 
                                        onClick={() => setProductSearchTerm('')} 
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}

                                {products.length > 0 && (
                                    <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl max-h-80 overflow-y-auto divide-y divide-slate-100">
                                        {products.map(product => {
                                            // Handle variation options
                                            if (product.skus && product.skus.length > 0) {
                                                return (
                                                    <React.Fragment key={product.id || product._id}>
                                                        {product.skus.map(sku => (
                                                            <button
                                                                key={sku._id}
                                                                type="button"
                                                                onClick={() => handleAddProduct(product, sku)}
                                                                className="w-full text-left px-4 py-3 hover:bg-slate-50/50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
                                                            >
                                                                <img src={(sku.images && sku.images.length > 0) ? sku.images[0] : (product.images?.[0] || '/placeholder.png')} alt="" className="w-10 h-10 rounded object-cover border border-slate-200" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-semibold text-slate-800 text-xs truncate">{product.name}</div>
                                                                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-1">
                                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">SKU: {sku.skuCode}</span>
                                                                        <span className="bg-primary-50 px-1.5 py-0.5 rounded text-primary-600 font-bold">{getVariationText(product, sku)}</span>
                                                                        <span className="ml-auto text-amber-600 font-bold">Còn: {sku.stock}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="font-extrabold text-slate-800 text-xs">{sku.price.toLocaleString('vi-VN')} ₫</div>
                                                            </button>
                                                        ))}
                                                    </React.Fragment>
                                                );
                                            }
                                            return (
                                                <button
                                                    key={product.id || product._id}
                                                    type="button"
                                                    onClick={() => handleAddProduct(product)}
                                                    className="w-full text-left px-4 py-3 hover:bg-slate-50/50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
                                                >
                                                    <img src={product.images?.[0] || '/placeholder.png'} alt="" className="w-10 h-10 rounded object-cover border border-slate-200" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-slate-800 text-xs truncate">{product.name}</div>
                                                        <p className="text-[10px] text-amber-600 font-bold mt-1">Còn: {product.stock}</p>
                                                    </div>
                                                    <div className="font-extrabold text-slate-800 text-xs">{product.price.toLocaleString('vi-VN')} ₫</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Cart Items Table */}
                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Sản phẩm</th>
                                            <th className="px-4 py-3 text-center">Đơn giá</th>
                                            <th className="px-4 py-3 text-center">Số lượng</th>
                                            <th className="px-4 py-3 text-right">Tổng</th>
                                            <th className="px-4 py-3 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {orderItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={item.image || '/placeholder.png'} alt="" className="w-10 h-10 rounded object-cover bg-slate-100 border border-slate-200" />
                                                        <div className="min-w-0 max-w-xs">
                                                            <div className="font-bold text-slate-800 text-xs truncate">{item.name}</div>
                                                            {item.variationText && (
                                                                <div className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full inline-block mt-1 font-semibold border border-indigo-100">
                                                                    {item.variationText}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-900 font-medium text-xs">
                                                    {item.price.toLocaleString('vi-VN')} ₫
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(index, -1)}
                                                            className="text-slate-400 hover:text-primary-600 transition-colors"
                                                        >
                                                            <MinusCircle className="w-5 h-5" />
                                                        </button>
                                                        <span className="w-6 text-center font-bold text-xs text-slate-800">{item.quantity}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(index, 1)}
                                                            className="text-slate-400 hover:text-primary-600 transition-colors"
                                                        >
                                                            <PlusCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-extrabold text-slate-900 text-xs">
                                                    {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button 
                                                        onClick={() => handleRemoveItem(index)} 
                                                        className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {orderItems.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-12 text-center text-slate-400">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <ShoppingCart className="w-8 h-8 text-slate-300 animate-bounce" />
                                                        <span className="font-semibold text-xs text-slate-400">Giỏ hàng trống. Hãy tìm kiếm sản phẩm phía trên.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Billing Calculation Totals Card */}
                        <div className="mt-6 border-t border-slate-100 pt-4 flex justify-end">
                            <div className="w-full sm:w-72 space-y-2.5">
                                <div className="flex justify-between text-xs text-slate-500 font-semibold">
                                    <span>Tạm tính:</span>
                                    <span className="text-slate-800 font-bold">{subtotal.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 font-semibold">
                                    <span>Phí giao hàng:</span>
                                    <span className="text-slate-800 font-bold">Miễn phí</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2 flex-wrap">
                                    <span>Tổng cộng:</span>
                                    <span className="text-primary-600 text-lg font-extrabold">{subtotal.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={createOrderMutation.isPending}
                                    className="w-full mt-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 rounded-xl hover:shadow-xl hover:shadow-primary-500/20 font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {createOrderMutation.isPending ? 'Đang tạo đơn hàng...' : 'Xác nhận tạo đơn'}
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
