import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    Package,
    FolderTree,
    ShoppingCart,
    Ticket,
    LogOut,
    Store,
    Settings,
    ChevronDown,
    ChevronRight,
    Star,
    BarChart3,
    Shield,
    Box,
    Clock,
    TrendingUp,
    Plus,
    Image as ImageIcon
} from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import useUIStore from '../../store/useUIStore'
import { PERMISSIONS, hasPermission } from '../../utils/permissions'
import { useTranslation } from '../../i18n/index.jsx'
import clsx from 'clsx'

const MenuItem = ({ item, level = 0, userRole }) => {
    const location = useLocation()
    const [isOpen, setIsOpen] = useState(false)
    const hasChildren = item.children && item.children.length > 0
    const isActive = location.pathname === item.path || (hasChildren && location.pathname.startsWith(item.path))

    if (item.permissions && !hasPermission(userRole, item.permissions)) {
        return null
    }

    if (hasChildren) {
        return (
            <div className="mb-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={clsx(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300",
                        isActive
                            ? "bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 border border-primary-200"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    style={{ paddingLeft: `${level * 16 + 16}px` }}
                >
                    <div className="flex items-center">
                        {item.icon && <item.icon className="w-5 h-5" />}
                        <span className={clsx("font-medium", item.icon ? "ml-3" : "")}>{item.label}</span>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                {isOpen && (
                    <div className="mt-1 space-y-1 animate-slide-down">
                        {item.children.map(child => (
                            <MenuItem key={child.path} item={child} level={level + 1} userRole={userRole} />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <NavLink
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
                clsx(
                    "flex items-center px-4 py-3 rounded-xl transition-all duration-300 mb-1 group relative",
                    isActive
                        ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/30"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )
            }
            style={{ paddingLeft: `${level * 16 + 16}px` }}
        >
            {({ isActive }) => (
                <>
                    {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500 rounded-r-full" />
                    )}
                    {item.icon && <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />}
                    <span className={clsx("font-medium", item.icon ? "ml-3" : "")}>{item.label}</span>
                </>
            )}
        </NavLink>
    )
}

const Sidebar = () => {
    const { user, logout } = useAuthStore()
    const { sidebarOpen, toggleSidebar } = useUIStore()
    const { t } = useTranslation()

    const menuItems = [
        { path: '/', label: t('sidebar.dashboard'), icon: LayoutDashboard, exact: true, permissions: PERMISSIONS.VIEW_DASHBOARD },
        { path: '/users', label: t('sidebar.users'), icon: Users, permissions: PERMISSIONS.VIEW_USERS },
        {
            path: '/products',
            label: t('sidebar.products'),
            icon: Package,
            permissions: PERMISSIONS.VIEW_PRODUCTS,
            children: [
                { path: '/products', label: 'Tất cả sản phẩm', icon: Box, exact: true },
                { path: '/products/pending', label: 'Chờ duyệt', icon: Clock, permissions: ['admin'] },
                { path: '/products/stock', label: 'Quản lý tồn kho', icon: TrendingUp },
            ]
        },
        { path: '/categories', label: t('sidebar.categories'), icon: FolderTree, permissions: PERMISSIONS.VIEW_PRODUCTS },
        {
            path: '/orders',
            label: t('sidebar.orders'),
            icon: ShoppingCart,
            permissions: PERMISSIONS.VIEW_ORDERS,
            children: [
                { path: '/orders', label: 'All Orders', icon: ShoppingCart, exact: true },
                { path: '/orders/create', label: 'Create Order', icon: Plus, permissions: ['admin', 'order_manager'] }
            ]
        },
        { path: '/sellers', label: t('sidebar.sellers'), icon: Store, permissions: PERMISSIONS.VIEW_SELLERS },
        { path: '/reviews', label: t('sidebar.reviews'), icon: Star, permissions: PERMISSIONS.VIEW_REVIEWS },
        { path: '/discounts', label: t('sidebar.coupons'), icon: Ticket, permissions: PERMISSIONS.MANAGE_PRODUCTS },
        { path: '/reports', label: t('sidebar.reports'), icon: BarChart3, permissions: PERMISSIONS.VIEW_REPORTS },
        { path: '/audit-logs', label: 'Nhật ký hoạt động', icon: Shield, permissions: ['admin'] },
        {
            path: '/settings',
            label: t('sidebar.settings'),
            icon: Settings,
            permissions: PERMISSIONS.MANAGE_SETTINGS,
            children: [
                { path: '/settings', label: 'General', icon: Settings, exact: true },
                { path: '/banners', label: 'Banners', icon: ImageIcon }
            ]
        },
    ]

    if (!sidebarOpen) {
        return null
    }

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                onClick={toggleSidebar}
            />

            {/* Sidebar */}
            <aside className={clsx(
                "fixed left-0 top-0 h-full w-64 z-50 transition-transform duration-300 shadow-xl",
                "bg-white border-r border-slate-200",
                "lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="relative h-full flex flex-col p-4">
                    {/* Logo Section with Gradient */}
                    <div className="mb-8 p-4 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-lg">
                        <div className="flex items-center justify-center">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Store className="w-6 h-6 text-white drop-shadow-lg" />
                            </div>
                            <div className="ml-3">
                                <h1 className="text-lg font-bold text-white drop-shadow-lg">ShopeeClone</h1>
                                <p className="text-xs text-white/90">Admin Panel</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="space-y-1">
                            {menuItems.map(item => (
                                <MenuItem key={item.path} item={item} userRole={user?.role} />
                            ))}
                        </div>
                    </nav>

                    {/* User Profile Section */}
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-slate-900">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-slate-600 capitalize">{user?.role || 'super_admin'}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-all duration-300 border border-red-200 hover:border-red-300 group"
                        >
                            <LogOut className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Custom Scrollbar Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(168, 85, 247, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(168, 85, 247, 0.5);
                }
            `}</style>
        </>
    )
}

export default Sidebar
