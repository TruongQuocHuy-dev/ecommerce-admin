import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useTranslation } from '../../i18n/index.jsx';
import Modal from '../ui/Modal';
import useAuthStore from '../../store/useAuthStore';

const DiscountModal = ({ isOpen, onClose, discount = null }) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const isEditing = !!discount;

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
            scope: 'system',
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
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Code & Name */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {t('discounts.modal.code')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                            placeholder={t('discounts.modal.codePlaceholder')}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.code
                                ? 'border-red-500 focus:ring-red-500/20'
                                : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                                }`}
                            disabled={isEditing}
                        />
                        {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {t('discounts.modal.name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.name
                                ? 'border-red-500 focus:ring-red-500/20'
                                : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                                }`}
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t('discounts.modal.description')}
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                </div>

                {/* Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('discounts.modal.discountType')} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    value="percentage"
                                    checked={formData.type === 'percentage'}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="ml-2 text-sm">{t('discounts.types.percentage')}</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    value="fixed"
                                    checked={formData.type === 'fixed'}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="ml-2 text-sm">{t('discounts.types.fixed')}</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    value="freeship"
                                    checked={formData.type === 'freeship'}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="ml-2 text-sm">Miễn phí vận chuyển</span>
                            </label>
                        </div>
                    </div>

                    {formData.type !== 'freeship' ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t('discounts.modal.discountValue')} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => handleChange('value', e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.value
                                        ? 'border-red-500 focus:ring-red-500/20'
                                        : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                                        }`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    {formData.type === 'percentage' ? '%' : '$'}
                                </span>
                            </div>
                            {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value}</p>}
                        </div>
                    ) : (
                        <div></div>
                    )}
                </div>

                {/* Min Order & Max Discount */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {t('discounts.modal.minOrder')}
                        </label>
                        <input
                            type="number"
                            value={formData.minOrderValue}
                            onChange={(e) => handleChange('minOrderValue', e.target.value)}
                            min="0"
                            step="0.01"
                            placeholder="0"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>

                    {formData.type === 'percentage' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t('discounts.modal.maxDiscount')}
                            </label>
                            <input
                                type="number"
                                value={formData.maxDiscount}
                                onChange={(e) => handleChange('maxDiscount', e.target.value)}
                                min="0"
                                step="0.01"
                                placeholder="Không giới hạn"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                    )}
                </div>

                {/* Usage Limits */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {t('discounts.modal.usageLimit')}
                        </label>
                        <input
                            type="number"
                            value={formData.usageLimit}
                            onChange={(e) => handleChange('usageLimit', e.target.value)}
                            min="1"
                            placeholder="Không giới hạn"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {t('discounts.modal.usagePerUser')}
                        </label>
                        <input
                            type="number"
                            value={formData.usagePerUser}
                            onChange={(e) => handleChange('usagePerUser', e.target.value)}
                            min="1"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {t('discounts.modal.startDate')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleChange('startDate', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.startDate
                                ? 'border-red-500 focus:ring-red-500/20'
                                : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                                }`}
                        />
                        {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            {t('discounts.modal.endDate')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => handleChange('endDate', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.endDate
                                ? 'border-red-500 focus:ring-red-500/20'
                                : 'border-slate-300 focus:ring-primary-500/20 focus:border-primary-500'
                                }`}
                        />
                        {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                    </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => handleChange('isActive', e.target.checked)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm font-medium text-slate-700">
                        {t('discounts.modal.active')}
                    </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white rounded-lg transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Đang lưu...' : t('common.save')}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DiscountModal;
