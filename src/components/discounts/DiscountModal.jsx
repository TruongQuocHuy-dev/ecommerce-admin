import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useTranslation } from '../../i18n/index.jsx';
import Modal from '../ui/Modal';
import useAuthStore from '../../store/useAuthStore';
import { useShops } from '../../api/hooks/useShops';

const DiscountModal = ({ isOpen, onClose, discount = null }) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const isEditing = !!discount;

    // Fetch shops for shop-scoped vouchers
    const { data: shopsData } = useShops({ status: 'approved', limit: 100 });
    const shops = shopsData?.shops || [];

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        type: 'percentage',
        value: '',
        minOrderValue: '',
        maxDiscount: '',
        usageLimit: '',
        usagePerUser: '1',
        startDate: '',
        endDate: '',
        isActive: true,
        scope: 'system',
        shopId: '',
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (discount) {
            setFormData({
                name: discount.name || '',
                code: discount.code || '',
                description: discount.description || '',
                type: discount.type || 'percentage',
                value: discount.value || '',
                minOrderValue: discount.minOrderValue || '',
                maxDiscount: discount.maxDiscount || '',
                usageLimit: discount.usageLimit || '',
                usagePerUser: discount.usagePerUser || '1',
                startDate: discount.startDate ? new Date(discount.startDate).toISOString().split('T')[0] : '',
                endDate: discount.endDate ? new Date(discount.endDate).toISOString().split('T')[0] : '',
                isActive: discount.isActive ?? true,
                scope: discount.scope || 'system',
                shopId: discount.shopId?._id || discount.shopId || '',
            });
        } else {
            setFormData({
                name: '',
                code: '',
                description: '',
                type: 'percentage',
                value: '',
                minOrderValue: '',
                maxDiscount: '',
                usageLimit: '',
                usagePerUser: '1',
                startDate: '',
                endDate: '',
                isActive: true,
                scope: 'system',
                shopId: '',
            });
        }
        setErrors({});
    }, [discount, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.code.trim()) {
            newErrors.code = 'Mã giảm giá là bắt buộc';
        } else if (formData.code.length < 4 || formData.code.length > 20) {
            newErrors.code = 'Mã phải từ 4-20 ký tự';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Tên chương trình là bắt buộc';
        }

        if (formData.type !== 'freeship') {
            if (!formData.value || formData.value <= 0) {
                newErrors.value = 'Giá trị giảm phải lớn hơn 0';
            } else if (formData.type === 'percentage' && formData.value > 100) {
                newErrors.value = 'Phần trăm giảm không được vượt quá 100%';
            }
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc';
        } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
        }

        if (formData.scope === 'shop' && !formData.shopId) {
            newErrors.shopId = 'Vui lòng chọn cửa hàng áp dụng';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/discounts', {
                ...data,
                createdBy: user._id,
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success(t('discounts.toast.created'));
            queryClient.invalidateQueries(['discounts']);
            onClose();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || t('toast.error'));
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.patch(`/discounts/${discount.id || discount._id}`, data);
            return response.data;
        },
        onSuccess: () => {
            toast.success(t('discounts.toast.updated'));
            queryClient.invalidateQueries(['discounts']);
            onClose();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || t('toast.error'));
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const submitData = {
            name: formData.name.trim(),
            code: formData.code.trim().toUpperCase(),
            description: formData.description.trim(),
            type: formData.type,
            value: formData.type === 'freeship' ? 0 : parseFloat(formData.value),
            minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : 0,
            maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
            usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
            usagePerUser: parseInt(formData.usagePerUser) || 1,
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
            isActive: formData.isActive,
            scope: formData.scope,
            shopId: formData.scope === 'shop' ? formData.shopId : undefined,
        };

        if (isEditing) {
            updateMutation.mutate(submitData);
        } else {
            createMutation.mutate(submitData);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? t('discounts.modal.edit') : t('discounts.modal.add')}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                    {/* Scope & Shop selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('discounts.modal.scope')} *
                            </label>
                            <select
                                value={formData.scope}
                                onChange={(e) => {
                                    handleChange('scope', e.target.value);
                                    if (e.target.value === 'system') {
                                        handleChange('shopId', '');
                                    }
                                }}
                                disabled={isEditing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white text-gray-900 transition-all"
                            >
                                <option value="system">{t('discounts.scopeSystem')}</option>
                                <option value="shop">{t('discounts.scopeShop')}</option>
                            </select>
                        </div>

                        {formData.scope === 'shop' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('discounts.modal.shopLabel')} *
                                </label>
                                <select
                                    value={formData.shopId}
                                    onChange={(e) => handleChange('shopId', e.target.value)}
                                    disabled={isEditing}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.shopId
                                        ? 'border-red-400 focus:ring-red-500/20'
                                        : 'border-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                                        } bg-white text-gray-900 transition-all`}
                                >
                                    <option value="">{t('discounts.modal.selectShop')}</option>
                                    {shops.map((shop) => (
                                        <option key={shop._id} value={shop.owner?._id || shop.owner}>
                                            {shop.name} (Seller: {shop.owner?.name || 'N/A'})
                                        </option>
                                    ))}
                                </select>
                                {errors.shopId && <p className="mt-1 text-xs text-red-600">{errors.shopId}</p>}
                            </div>
                        )}
                    </div>

                    {/* Code & Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('discounts.modal.code')} *
                            </label>
                            <input
                                type="text"
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                placeholder={t('discounts.modal.codePlaceholder')}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.code
                                    ? 'border-red-400 focus:ring-red-500/20'
                                    : 'border-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                                    } outline-none transition-all`}
                                disabled={isEditing}
                            />
                            {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('discounts.modal.name')} *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.name
                                    ? 'border-red-400 focus:ring-red-500/20'
                                    : 'border-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                                    } outline-none transition-all`}
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('discounts.modal.description')}
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900"
                        />
                    </div>

                    {/* Type & Value */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('discounts.modal.discountType')} *
                            </label>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        value="percentage"
                                        checked={formData.type === 'percentage'}
                                        onChange={(e) => handleChange('type', e.target.value)}
                                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 font-medium">{t('discounts.types.percentage')}</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        value="fixed"
                                        checked={formData.type === 'fixed'}
                                        onChange={(e) => handleChange('type', e.target.value)}
                                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 font-medium">{t('discounts.types.fixed')}</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        value="freeship"
                                        checked={formData.type === 'freeship'}
                                        onChange={(e) => handleChange('type', e.target.value)}
                                        className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 font-medium">Miễn phí vận chuyển</span>
                                </label>
                            </div>
                        </div>

                        {formData.type !== 'freeship' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('discounts.modal.discountValue')} *
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => handleChange('value', e.target.value)}
                                        min="0"
                                        step="0.01"
                                        className={`w-full px-4 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 ${errors.value
                                            ? 'border-red-400 focus:ring-red-500/20'
                                            : 'border-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                                            } outline-none transition-all`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                        {formData.type === 'percentage' ? '%' : 'đ'}
                                    </span>
                                </div>
                                {errors.value && <p className="mt-1 text-xs text-red-600">{errors.value}</p>}
                            </div>
                        )}
                    </div>

                    {/* Min Order & Max Discount */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('discounts.modal.minOrder')}
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={formData.minOrderValue}
                                    onChange={(e) => handleChange('minOrderValue', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                    đ
                                </span>
                            </div>
                        </div>

                        {formData.type === 'percentage' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('discounts.modal.maxDiscount')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.maxDiscount}
                                        onChange={(e) => handleChange('maxDiscount', e.target.value)}
                                        min="0"
                                        step="0.01"
                                        placeholder="Không giới hạn"
                                        className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                        đ
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Usage Limits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('discounts.modal.usageLimit')}
                            </label>
                            <input
                                type="number"
                                value={formData.usageLimit}
                                onChange={(e) => handleChange('usageLimit', e.target.value)}
                                min="1"
                                placeholder="Không giới hạn"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('discounts.modal.usagePerUser')}
                            </label>
                            <input
                                type="number"
                                value={formData.usagePerUser}
                                onChange={(e) => handleChange('usagePerUser', e.target.value)}
                                min="1"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('discounts.modal.startDate')} *
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.startDate
                                    ? 'border-red-400 focus:ring-red-500/20'
                                    : 'border-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                                    } outline-none transition-all`}
                            />
                            {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('discounts.modal.endDate')} *
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.endDate
                                    ? 'border-red-400 focus:ring-red-500/20'
                                    : 'border-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                                    } outline-none transition-all`}
                            />
                            {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => handleChange('isActive', e.target.checked)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                            {t('discounts.modal.active')}
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 mt-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2.5 text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {isLoading ? 'Đang lưu...' : t('common.save')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DiscountModal;
