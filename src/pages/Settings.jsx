import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Settings as SettingsIcon, Globe, Truck, Image, Save, Plus, Trash2, Edit2,
    Eye, EyeOff, GripVertical, Loader2, X, Upload
} from 'lucide-react';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Settings = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: t('settings.general') || 'Cài đặt chung', icon: Globe },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    {t('settings.title') || 'Cài đặt hệ thống'}
                </h1>
                <p className="text-slate-500 mt-1">
                    {t('settings.subtitle') || 'Quản lý cấu hình chung, phí vận chuyển và banner quảng cáo'}
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                'pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2',
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'general' && <GeneralSettings />}
        </div>
    );
};

// ===== GENERAL SETTINGS TAB =====
const GeneralSettings = () => {
    const queryClient = useQueryClient();

    const { data: setting, isLoading } = useQuery({
        queryKey: ['settings', 'general'],
        queryFn: async () => {
            const res = await api.get('/settings/general');
            return res.data?.data?.value || {};
        },
    });

    const [form, setForm] = useState(null);

    // Initialize form when data loads
    if (setting && !form) {
        setForm({ ...setting });
    }

    const mutation = useMutation({
        mutationFn: (data) => api.put('/settings/general', data),
        onSuccess: () => {
            toast.success('Cài đặt chung đã được cập nhật!');
            queryClient.invalidateQueries({ queryKey: ['settings', 'general'] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Lỗi cập nhật cài đặt');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(form);
    };

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const updateSocial = (field, value) => {
        setForm((prev) => ({
            ...prev,
            socialLinks: { ...prev.socialLinks, [field]: value },
        }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!form) return null;

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl animate-fade-in">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                <h3 className="text-lg font-bold text-slate-800">Thông tin website</h3>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tên website</label>
                    <input
                        type="text"
                        value={form.siteName || ''}
                        onChange={(e) => updateField('siteName', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                        placeholder="ShopeeClone"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">URL Logo</label>
                    <input
                        type="text"
                        value={form.logo || ''}
                        onChange={(e) => updateField('logo', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                        placeholder="https://example.com/logo.png"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email hỗ trợ</label>
                        <input
                            type="email"
                            value={form.supportEmail || ''}
                            onChange={(e) => updateField('supportEmail', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                        <input
                            type="text"
                            value={form.supportPhone || ''}
                            onChange={(e) => updateField('supportPhone', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                    <textarea
                        value={form.address || ''}
                        onChange={(e) => updateField('address', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none resize-none"
                    />
                </div>
            </div>

            {/* Social Links */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                <h3 className="text-lg font-bold text-slate-800">Mạng xã hội</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['facebook', 'instagram', 'youtube', 'tiktok'].map((social) => (
                        <div key={social}>
                            <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">
                                {social}
                            </label>
                            <input
                                type="text"
                                value={form.socialLinks?.[social] || ''}
                                onChange={(e) => updateSocial(social, e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                                placeholder={`https://${social}.com/`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium shadow-md shadow-primary-500/30 hover:shadow-lg hover:shadow-primary-500/40 transition-all disabled:opacity-50"
            >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu cài đặt
            </button>
        </form>
    );
};

// Removed unused Banner and Shipping Sections

export default Settings;
