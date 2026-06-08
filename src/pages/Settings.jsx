import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Globe, Shield, Bell, Save, Loader2, Sparkles,
    KeyRound, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const Settings = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: t('settings.general') || 'Cài đặt chung', icon: Globe },
        { id: 'security', label: t('settings.security') || 'Bảo mật', icon: Shield },
        { id: 'notifications', label: t('settings.notifications') || 'Thông báo', icon: Bell },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-1">
            {/* CommandCenter Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl animate-fade-in">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_28%)] animate-pulse" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 backdrop-blur">
                            {t('settings.commandCenter') || 'Trung tâm cấu hình hệ thống'}
                        </span>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl flex items-center gap-2">
                            {t('settings.title') || 'Cài đặt hệ thống'}
                            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
                            {t('settings.subtitle') || 'Quản lý cấu hình chung, bảo mật và cấu hình thông báo'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">
                <nav className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    'px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center gap-2.5 outline-none',
                                    isActive
                                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15 scale-[1.02]'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                )}
                            >
                                <Icon className={clsx('w-4 h-4', isActive ? 'text-white' : 'text-slate-500')} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab content area */}
            <div className="transition-all duration-300">
                {activeTab === 'general' && <GeneralSettings />}
                {activeTab === 'security' && <SecuritySettings />}
                {activeTab === 'notifications' && <NotificationSettings />}
            </div>
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

    useEffect(() => {
        if (setting) {
            setForm({ ...setting });
        }
    }, [setting]);

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

    if (isLoading || !form) {
        return (
            <div className="flex justify-center py-12 bg-white rounded-3xl border border-slate-200">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl animate-fade-in">
            {/* Website Information Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-500 animate-pulse">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Thông tin website</h3>
                        <p className="text-xs text-slate-500">Cài đặt các thông tin định danh chính của hệ thống e-commerce</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên website</label>
                        <input
                            type="text"
                            value={form.siteName || ''}
                            onChange={(e) => updateField('siteName', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                            placeholder="ShopeeClone"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL Logo</label>
                        <input
                            type="text"
                            value={form.logo || ''}
                            onChange={(e) => updateField('logo', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                            placeholder="https://example.com/logo.png"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email hỗ trợ</label>
                        <input
                            type="email"
                            value={form.supportEmail || ''}
                            onChange={(e) => updateField('supportEmail', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                            placeholder="support@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại hỗ trợ</label>
                        <input
                            type="text"
                            value={form.supportPhone || ''}
                            onChange={(e) => updateField('supportPhone', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                            placeholder="0123456789"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ</label>
                    <textarea
                        value={form.address || ''}
                        onChange={(e) => updateField('address', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none"
                        placeholder="Nhập địa chỉ trụ sở chính..."
                    />
                </div>
            </div>

            {/* Social Links Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-500">
                        <Save className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Liên kết mạng xã hội</h3>
                        <p className="text-xs text-slate-500">Các đường dẫn liên kết chân trang của ứng dụng và website</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['facebook', 'instagram', 'youtube', 'tiktok'].map((social) => (
                        <div key={social}>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 capitalize">{social}</label>
                            <input
                                type="text"
                                value={form.socialLinks?.[social] || ''}
                                onChange={(e) => updateSocial(social, e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                                placeholder={`https://${social}.com/yourchannel`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl font-semibold shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 active:scale-95"
            >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu cài đặt chung
            </button>
        </form>
    );
};

// ===== SECURITY SETTINGS TAB =====
const SecuritySettings = () => {
    const queryClient = useQueryClient();
    const { data: security, isLoading } = useQuery({
        queryKey: ['settings', 'security'],
        queryFn: async () => {
            const res = await api.get('/settings/security');
            return res.data?.data?.value || {};
        },
    });

    const [form, setForm] = useState(null);

    useEffect(() => {
        if (security) {
            setForm({
                twoFactorAuth: security.twoFactorAuth ?? false,
                passwordMinLength: security.passwordMinLength ?? 8,
                sessionTimeout: security.sessionTimeout ?? '2h',
                loginAttemptsLimit: security.loginAttemptsLimit ?? 5,
            });
        }
    }, [security]);

    const mutation = useMutation({
        mutationFn: (data) => api.put('/settings/security', data),
        onSuccess: () => {
            toast.success('Cài đặt bảo mật đã được cập nhật!');
            queryClient.invalidateQueries({ queryKey: ['settings', 'security'] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Lỗi cập nhật cài đặt');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            passwordMinLength: Number(form.passwordMinLength),
            loginAttemptsLimit: Number(form.loginAttemptsLimit),
        };
        mutation.mutate(payload);
    };

    if (isLoading || !form) {
        return (
            <div className="flex justify-center py-12 bg-white rounded-3xl border border-slate-200">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Chính sách bảo mật hệ thống</h3>
                        <p className="text-xs text-slate-500">Cấu hình các tham số bảo vệ tài khoản và quản trị viên</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                        <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50/60 border border-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0">
                                <KeyRound className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-800">Xác thực 2 yếu tố (2FA)</h4>
                                <p className="text-xs text-slate-500 mt-0.5">Bắt buộc toàn bộ quản trị viên và người bán phải cấu hình OTP khi đăng nhập</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, twoFactorAuth: !prev.twoFactorAuth }))}
                            className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                        >
                            {form.twoFactorAuth ? (
                                <ToggleRight className="w-12 h-12 text-indigo-600 cursor-pointer" />
                            ) : (
                                <ToggleLeft className="w-12 h-12 text-slate-300 cursor-pointer" />
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Độ dài tối thiểu mật khẩu</label>
                            <input
                                type="number"
                                value={form.passwordMinLength}
                                onChange={(e) => setForm(prev => ({ ...prev, passwordMinLength: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                min="6"
                                max="20"
                                required
                            />
                            <p className="mt-1 text-xs text-slate-400">Số ký tự tối thiểu khi người dùng thay đổi mật khẩu</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời hạn phiên đăng nhập</label>
                            <select
                                value={form.sessionTimeout}
                                onChange={(e) => setForm(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none bg-white"
                            >
                                <option value="15m">15 phút</option>
                                <option value="30m">30 phút</option>
                                <option value="1h">1 giờ</option>
                                <option value="2h">2 giờ</option>
                                <option value="24h">24 giờ</option>
                            </select>
                            <p className="mt-1 text-xs text-slate-400">Phiên tự động kết thúc và đăng xuất sau khoảng thời gian này</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giới hạn số lần đăng nhập sai</label>
                            <input
                                type="number"
                                value={form.loginAttemptsLimit}
                                onChange={(e) => setForm(prev => ({ ...prev, loginAttemptsLimit: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                min="3"
                                max="10"
                                required
                            />
                            <p className="mt-1 text-xs text-slate-400">Tài khoản sẽ bị tạm khóa nếu đăng nhập sai vượt mức này</p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl font-semibold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 active:scale-95"
            >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu cài đặt bảo mật
            </button>
        </form>
    );
};

// ===== NOTIFICATION SETTINGS TAB =====
const NotificationSettings = () => {
    const queryClient = useQueryClient();
    const { data: notifications, isLoading } = useQuery({
        queryKey: ['settings', 'notifications'],
        queryFn: async () => {
            const res = await api.get('/settings/notifications');
            return res.data?.data?.value || {};
        },
    });

    const [form, setForm] = useState(null);

    useEffect(() => {
        if (notifications) {
            setForm({
                emailNotifications: notifications.emailNotifications ?? true,
                orderCreatedAlert: notifications.orderCreatedAlert ?? true,
                lowStockAlert: notifications.lowStockAlert ?? true,
                lowStockThreshold: notifications.lowStockThreshold ?? 10,
                weeklyReport: notifications.weeklyReport ?? false,
            });
        }
    }, [notifications]);

    const mutation = useMutation({
        mutationFn: (data) => api.put('/settings/notifications', data),
        onSuccess: () => {
            toast.success('Cài đặt thông báo đã được cập nhật!');
            queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Lỗi cập nhật cài đặt');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            lowStockThreshold: Number(form.lowStockThreshold),
        };
        mutation.mutate(payload);
    };

    if (isLoading || !form) {
        return (
            <div className="flex justify-center py-12 bg-white rounded-3xl border border-slate-200">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl animate-fade-in">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                        <Bell className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Cấu hình thông báo hệ thống</h3>
                        <p className="text-xs text-slate-500">Kiểm soát các loại cảnh báo và thông tin gửi tới email/hệ thống</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800">Gửi thông báo qua Email</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Gửi các thông báo quan trọng của hệ thống tới email hỗ trợ</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                            className="focus:outline-none"
                        >
                            {form.emailNotifications ? (
                                <ToggleRight className="w-12 h-12 text-rose-500 cursor-pointer" />
                            ) : (
                                <ToggleLeft className="w-12 h-12 text-slate-300 cursor-pointer" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800">Cảnh báo đơn hàng mới</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Thông báo tức thời trên web và qua email mỗi khi phát sinh đơn hàng mới</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, orderCreatedAlert: !prev.orderCreatedAlert }))}
                            className="focus:outline-none"
                        >
                            {form.orderCreatedAlert ? (
                                <ToggleRight className="w-12 h-12 text-rose-500 cursor-pointer" />
                            ) : (
                                <ToggleLeft className="w-12 h-12 text-slate-300 cursor-pointer" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800">Cảnh báo sắp hết hàng</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Cảnh báo khi số lượng tồn kho của một sản phẩm chạm ngưỡng tối thiểu</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, lowStockAlert: !prev.lowStockAlert }))}
                            className="focus:outline-none"
                        >
                            {form.lowStockAlert ? (
                                <ToggleRight className="w-12 h-12 text-rose-500 cursor-pointer" />
                            ) : (
                                <ToggleLeft className="w-12 h-12 text-slate-300 cursor-pointer" />
                            )}
                        </button>
                    </div>

                    {form.lowStockAlert && (
                        <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/30 grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngưỡng tồn kho tối thiểu</label>
                                <input
                                    type="number"
                                    value={form.lowStockThreshold}
                                    onChange={(e) => setForm(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none bg-white"
                                    min="1"
                                    required
                                />
                                <p className="mt-1 text-xs text-slate-400">Hệ thống sẽ kích hoạt trạng thái "sắp hết hàng" khi tồn kho bằng hoặc nhỏ hơn số này</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-800">Báo cáo tóm tắt hàng tuần</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Tự động xuất và gửi email báo cáo hiệu quả doanh thu mỗi sáng thứ Hai</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, weeklyReport: !prev.weeklyReport }))}
                            className="focus:outline-none"
                        >
                            {form.weeklyReport ? (
                                <ToggleRight className="w-12 h-12 text-rose-500 cursor-pointer" />
                            ) : (
                                <ToggleLeft className="w-12 h-12 text-slate-300 cursor-pointer" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-2xl font-semibold shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 transition-all disabled:opacity-50 active:scale-95"
            >
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu cấu hình thông báo
            </button>
        </form>
    );
};

export default Settings;
