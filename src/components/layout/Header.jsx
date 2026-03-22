import useAuthStore from '../../store/useAuthStore'
import useUIStore from '../../store/useUIStore'
import { Bell, Search, Menu, X, Languages, Check, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '../../i18n/index.jsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import clsx from 'clsx'

const Header = () => {
    const { user } = useAuthStore()
    const { toggleSidebar, sidebarOpen } = useUIStore()
    const { t, language, changeLanguage } = useTranslation()
    const [searchFocused, setSearchFocused] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    // Fetch notifications
    const { data: notifData } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications?limit=10')
            return res.data?.data
        },
        refetchInterval: 30000, // Refetch every 30s
    })

    const notifications = notifData?.notifications || []
    const unreadCount = notifData?.unreadCount || 0

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: (id) => api.patch(`/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: () => api.patch('/notifications/mark-all-read'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    // Delete mutation
    const deleteNotifMutation = useMutation({
        mutationFn: (id) => api.delete(`/notifications/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    return (
        <header className="h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4 flex-1">
                {/* Menu toggle */}
                <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-300 text-slate-600 hover:text-slate-900"
                >
                    {sidebarOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <Menu className="w-6 h-6" />
                    )}
                </button>

                {/* Search */}
                <div className="flex items-center flex-1 max-w-md hidden md:flex">
                    <div className="relative w-full">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${searchFocused ? 'text-primary-600' : 'text-slate-400'
                            }`} />
                        <input
                            type="text"
                            placeholder={t('header.searchPlaceholder')}
                            className="w-full px-4 py-2 pl-10 bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 placeholder-slate-500"
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                        />
                    </div>
                </div>
            </div>

            {/* Right Section - Language, Notifications, Profile */}
            <div className="flex items-center gap-3">
                {/* Language Switcher */}
                <div className="relative group">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <Languages className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <button
                            onClick={() => changeLanguage('vi')}
                            className={`w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors first:rounded-t-lg ${language === 'vi' ? 'text-primary-600 font-medium' : 'text-slate-600'
                                }`}
                        >
                            🇻🇳 {t('language.vietnamese')}
                        </button>
                        <button
                            onClick={() => changeLanguage('en')}
                            className={`w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors last:rounded-b-lg ${language === 'en' ? 'text-primary-600 font-medium' : 'text-slate-600'
                                }`}
                        >
                            🇬🇧 {t('language.english')}
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setNotifOpen(!notifOpen)}
                        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                    >
                        <Bell className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {notifOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                            <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-scale-in">
                                {/* Header */}
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800">Thông báo</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllAsReadMutation.mutate()}
                                            disabled={markAllAsReadMutation.isPending}
                                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            Đánh dấu tất cả đã đọc
                                        </button>
                                    )}
                                </div>

                                {/* Notifications List */}
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                            <p className="text-sm text-slate-500">Không có thông báo</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif._id}
                                                className={clsx(
                                                    'p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group cursor-pointer',
                                                    !notif.isRead && 'bg-primary-50/30'
                                                )}
                                                onClick={() => {
                                                    if (!notif.isRead) markAsReadMutation.mutate(notif._id);
                                                    if (notif.link) {
                                                        setNotifOpen(false);
                                                        navigate(notif.link);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium text-slate-900">
                                                            {notif.title}
                                                        </h4>
                                                        <p className="text-xs text-slate-600 mt-0.5">
                                                            {notif.message}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {new Date(notif.createdAt).toLocaleString('vi-VN')}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!notif.isRead && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); markAsReadMutation.mutate(notif._id) }}
                                                                className="p-1.5 hover:bg-green-100 rounded-lg transition-colors"
                                                                title="Đánh dấu đã đọc"
                                                            >
                                                                <Check className="w-3.5 h-3.5 text-green-600" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteNotifMutation.mutate(notif._id) }}
                                                            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer */}
                                {notifications.length > 0 && (
                                    <div className="p-3 border-t border-slate-100 text-center">
                                        <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                                            Xem tất cả thông báo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header
