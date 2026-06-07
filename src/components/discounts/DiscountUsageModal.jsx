import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../i18n/index.jsx';
import Modal from '../ui/Modal';
import api from '../../api/client';
import { User, Receipt, Calendar, Clock, Loader2, ArrowRight } from 'lucide-react';

const DiscountUsageModal = ({ isOpen, onClose, discountId, discountCode }) => {
    const { t } = useTranslation();

    const { data: discount, isLoading, error } = useQuery({
        queryKey: ['discount', discountId],
        queryFn: async () => {
            const response = await api.get(`/discounts/${discountId}`);
            return response.data?.data?.discount || null;
        },
        enabled: !!discountId && isOpen,
    });

    const usedBy = discount?.usedBy || [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('discounts.usageModal.title', { code: discountCode || discount?.code || '' })}
            size="xl"
        >
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                        <p className="text-sm">{t('common.loading')}</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-red-500">
                        <p>{t('common.error')}</p>
                    </div>
                ) : usedBy.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600 font-medium">{t('discounts.usageModal.noUsage')}</p>
                    </div>
                ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed min-w-[600px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/3">
                                            {t('discounts.usageModal.customer')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/4">
                                            {t('discounts.usageModal.order')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/5">
                                            {t('discounts.usageModal.amount')}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/4">
                                            {t('discounts.usageModal.date')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {usedBy.map((usage, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div className="truncate">
                                                        <div className="font-medium text-slate-900 truncate">
                                                            {usage.user?.name || 'Khách hàng'}
                                                        </div>
                                                        <div className="text-xs text-slate-500 truncate">
                                                            {usage.user?.email || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <Receipt className="w-4 h-4 text-slate-400" />
                                                    <span className="font-mono text-xs truncate max-w-[120px]" title={usage.orderId}>
                                                        {usage.orderId}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-green-600 font-semibold">
                                                    <span>{usage.amount?.toLocaleString('vi-VN')} đ</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5 text-slate-500 text-sm">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>
                                                        {new Date(usage.usedAt).toLocaleDateString('vi-VN')} {new Date(usage.usedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors text-sm"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DiscountUsageModal;
