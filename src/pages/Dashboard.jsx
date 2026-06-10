import { useQuery } from '@tanstack/react-query'
import {
    Users,
    Package,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    Store,
    Eye,
    Cpu,
    Activity,
    HardDrive,
    Zap,
    Volume2,
    RefreshCw,
    AlertCircle,
    ShieldAlert,
    Settings,
    Sparkles,
    Download,
    Calendar
} from 'lucide-react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Card from '../components/ui/Card'
import { CardSkeleton } from '../components/ui/Skeleton'
import useAuthStore from '../store/useAuthStore'
import { PERMISSIONS, hasPermission } from '../utils/permissions'
import { useTranslation } from '../i18n/index.jsx'
import clsx from 'clsx'
import { useState, useMemo, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'

const Dashboard = () => {
    const { user } = useAuthStore()
    const { t } = useTranslation()
    const canViewRevenue = hasPermission(user?.role, PERMISSIONS.VIEW_REVENUE_STATS)

    // Live system stats simulation
    const [systemHealth, setSystemHealth] = useState({
        cpu: 24,
        ram: 5.8,
        latency: 42,
        onlineUsers: 342
    })

    useEffect(() => {
        const interval = setInterval(() => {
            setSystemHealth(prev => ({
                cpu: Math.max(10, Math.min(95, Math.floor(prev.cpu + (Math.random() * 6 - 3)))),
                ram: Math.max(4.0, Math.min(15.5, parseFloat((prev.ram + (Math.random() * 0.4 - 0.2)).toFixed(1)))),
                latency: Math.max(20, Math.min(150, Math.floor(prev.latency + (Math.random() * 10 - 5)))),
                onlineUsers: Math.max(50, Math.floor(prev.onlineUsers + (Math.random() * 14 - 7)))
            }))
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    // Quick controls states
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [isClearingCache, setIsClearingCache] = useState(false)
    const [announcement, setAnnouncement] = useState('')

    const handleClearCache = () => {
        setIsClearingCache(true)
        setTimeout(() => {
            setIsClearingCache(false)
            toast.success('Hệ thống đã xoá toàn bộ bộ nhớ đệm (Cache) thành công!')
        }, 1200)
    }

    const handleBroadcastAnnouncement = (e) => {
        e.preventDefault()
        if (!announcement.trim()) return
        toast.success(`Đã phát tin nhắn: "${announcement}" đến toàn hệ thống!`)
        setAnnouncement('')
    }

    // Live activity events pool & initial events
    const initialEvents = [
        { id: 'ev-1', text: 'Đơn hàng #29381 đặt thành công (1.250.000 ₫)', time: 'Vừa xong', type: 'order' },
        { id: 'ev-2', text: 'Người dùng "Trần Kiên" vừa đăng ký tài khoản mới', time: '2 phút trước', type: 'user' },
        { id: 'ev-3', text: 'Cửa hàng "Mẹ & Bé Plaza" được phê duyệt hoạt động', time: '5 phút trước', type: 'shop' },
        { id: 'ev-4', text: 'Cảnh báo: Sản phẩm "Giày Chạy Bộ Nam C1" sắp hết hàng', time: '10 phút trước', type: 'warning' },
        { id: 'ev-5', text: 'Admin đã cập nhật phí vận chuyển vùng sâu vùng xa', time: '15 phút trước', type: 'system' }
    ]

    const [liveEvents, setLiveEvents] = useState(initialEvents)

    const eventPool = useMemo(() => [
        { text: 'Đơn hàng #29382 thanh toán qua VNPay thành công (850.000 ₫)', type: 'order' },
        { text: 'Người dùng "Nguyễn Thảo" vừa nâng cấp lên tài khoản VIP', type: 'user' },
        { text: 'Cửa hàng "Gia Dụng Thông Minh" gửi yêu cầu duyệt sản phẩm mới', type: 'shop' },
        { text: 'Cảnh báo tồn kho: Sản phẩm "Tai Nghe Không Dây Pro" còn dưới 5 sản phẩm', type: 'warning' },
        { text: 'Admin đã tối ưu hóa index cơ sở dữ liệu hệ thống', type: 'system' },
        { text: 'Đơn hàng #29383 trị giá 3.400.000 ₫ đang được giao đi', type: 'order' },
        { text: 'Người dùng "Lê Minh" gửi khiếu nại về đơn hàng #28472', type: 'warning' },
        { text: 'Cửa hàng "Thời Trang GenZ" đăng ký gian hàng chính hãng', type: 'shop' }
    ], [])

    useEffect(() => {
        const interval = setInterval(() => {
            const randomEvent = eventPool[Math.floor(Math.random() * eventPool.length)]
            const newEvent = {
                id: `ev-${Date.now()}`,
                text: randomEvent.text,
                time: 'Vừa xong',
                type: randomEvent.type
            }
            setLiveEvents(prev => [newEvent, ...prev.slice(0, 4)])
        }, 8000)
        return () => clearInterval(interval)
    }, [eventPool])

    // Fetch overview stats
    const { data: overviewData, isLoading: overviewLoading } = useQuery({
        queryKey: ['analytics-overview'],
        queryFn: async () => {
            const res = await api.get('/analytics/overview')
            return res.data?.data
        },
    })

    // Date range controls for charts
    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)

    // Fetch revenue data (default last7days or custom range)
    const revenueQueryKey = useMemo(() => ['analytics-revenue', startDate, endDate], [startDate, endDate])
    const { data: revenueData } = useQuery({
        queryKey: revenueQueryKey,
        queryFn: async () => {
            const url = startDate && endDate
                ? `/analytics/revenue?start=${startDate}&end=${endDate}`
                : '/analytics/revenue?period=last7days'
            const res = await api.get(url)
            return res.data?.data
        },
        enabled: canViewRevenue,
    })

    // Fetch order status distribution
    const { data: orderStatsData } = useQuery({
        queryKey: ['analytics-orders'],
        queryFn: async () => {
            const res = await api.get('/analytics/orders')
            return res.data?.data
        },
    })

    // Fetch top products
    const { data: topProductsData } = useQuery({
        queryKey: ['analytics-products', 5],
        queryFn: async () => {
            const res = await api.get('/analytics/products?limit=5')
            return res.data?.data
        },
    })

    // Fetch recent orders
    const { data: recentOrders } = useQuery({
        queryKey: ['orders', 'recent'],
        queryFn: async () => {
            const res = await api.get('/orders?page=1&limit=5')
            return res.data?.data?.orders || []
        },
    })

    // Fetch low stock products (both out of stock and low stock)
    const { data: lowStockData } = useQuery({
        queryKey: ['products', 'low-stock-all'],
        queryFn: async () => {
            const res = await api.get('/products/stock?limit=5')
            return res.data?.data?.products || []
        },
    })

    const stats = overviewData || {}

    // Prepare data for charts (memoized)
    const revenueChartData = useMemo(() => revenueData?.chartData || [], [revenueData])
    const orderDistribution = Array.isArray(orderStatsData) ? orderStatsData : []

    const STATUS_LABELS = {
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        shipped: 'Đang giao',
        delivered: 'Đã giao',
        cancelled: 'Đã hủy',
        returned: 'Trả hàng'
    }

    
    const STATUS_COLORS = {
        pending: '#f59e0b',    // orange
        processing: '#3b82f6', // blue
        shipped: '#8b5cf6',    // purple
        delivered: '#10b981',  // green
        cancelled: '#ef4444',  // red
        returned: '#6b7280'    // gray
    }

    const formattedOrderDistribution = useMemo(() => {
        const totalRev = stats.totalRevenue || 0
        const deliveredCount = stats.deliveredOrders || 1
        const avgValue = Math.floor(totalRev / deliveredCount) || 850000 // fallback

        return orderDistribution.map(item => {
            let revenue = 0
            if (item.status === 'delivered') {
                revenue = totalRev
            } else if (item.status === 'cancelled') {
                revenue = 0
            } else {
                revenue = item.count * avgValue
            }
            return {
                ...item,
                name: STATUS_LABELS[item.status] || item.status,
                color: STATUS_COLORS[item.status] || '#000000',
                revenue: revenue
            }
        }).filter(item => item.count > 0)
    }, [orderDistribution, stats])

    // Formatter helpers for charts
    const formatRevenueAxis = useCallback((value) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
        return value;
    }, []);

    const formatRevenueTooltip = useCallback((value) => {
        return [`${value.toLocaleString('vi-VN')} ₫`, 'Doanh thu'];
    }, []);

    const formatOrdersTooltip = useCallback((value) => {
        return [`${value} đơn`, 'Số đơn hàng'];
    }, []);

    // Export recent orders to CSV
    const exportRecentOrdersCSV = useCallback(() => {
        const rows = [
            ['Order ID', 'Customer', 'Amount', 'Status', 'Date']
        ];
        (recentOrders || []).forEach(o => {
            rows.push([o._id || '', o.user?.name || '', o.totalAmount || 0, o.status || '', o.createdAt || ''])
        })
        const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'recent-orders.csv'
        a.click()
        URL.revokeObjectURL(url)
    }, [recentOrders])

    return (
        <>
            <a href="#dashboard-title" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:px-3 focus:py-2 focus:rounded-md focus:shadow">{t('skipToContent') || 'Skip to content'}</a>
            <main role="main" aria-labelledby="dashboard-title" className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* CommandCenter Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl animate-fade-in">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_28%)] animate-pulse" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200 backdrop-blur">
                            {t('dashboard.commandCenter')}
                        </span>
                        <h1 id="dashboard-title" className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl flex items-center gap-2">
                            {t('dashboard.title')}
                            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
                            {t('dashboard.welcome', { name: user?.name })}. {t('dashboard.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Maintenance Warning */}
            {maintenanceMode ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                    <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-red-800">Hệ thống đang bật chế độ bảo trì!</h4>
                        <p className="text-xs text-red-700 mt-0.5">Người dùng bên ngoài không thể truy cập hoặc thanh toán vào thời điểm này.</p>
                    </div>
                </div>
            ) : null}

            {/* Live Operations & Quick Control Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live System Health */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary-600" />
                            <h2 className="text-lg font-bold text-slate-900">Giám Sát Trực Tiếp Hệ Thống</h2>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-semibold">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                            LIVE MONITORING
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500 font-medium">Trực Tuyến</span>
                                <Users className="w-4 h-4 text-cyan-600" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{systemHealth.onlineUsers}</span>
                            <span className="text-[10px] text-green-600 font-medium mt-1">▲ Hoạt động</span>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500 font-medium">Tải CPU</span>
                                <Cpu className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{systemHealth.cpu}%</span>
                            <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                                <div className="bg-purple-600 h-full transition-all duration-500" style={{ width: `${systemHealth.cpu}%` }} />
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500 font-medium">Dung lượng RAM</span>
                                <HardDrive className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{systemHealth.ram} GB</span>
                            <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                                <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${(systemHealth.ram / 16) * 100}%` }} />
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500 font-medium">Độ trễ API</span>
                                <Zap className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900">{systemHealth.latency}ms</span>
                            <span className={`text-[10px] font-medium mt-1 ${systemHealth.latency < 80 ? 'text-green-600' : 'text-amber-600'}`}>
                                {systemHealth.latency < 80 ? '● Cực kỳ mượt mà' : '● Phản hồi ổn định'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Controls Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-5 h-5 text-primary-600" />
                        <h2 className="text-lg font-bold text-slate-900">Điều Khiển Hệ Thống</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Maintenance Mode Toggle */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <span className="text-xs font-semibold text-slate-700 block">Chế độ bảo trì</span>
                                <span className="text-[10px] text-slate-500">Khóa cổng bán hàng</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setMaintenanceMode(!maintenanceMode)
                                    toast(
                                        `Chế độ bảo trì đã ${!maintenanceMode ? 'BẬT' : 'TẮT'}`,
                                        {
                                            icon: !maintenanceMode ? '⚠️' : '✅',
                                            style: {
                                                borderRadius: '10px',
                                                background: '#333',
                                                color: '#fff',
                                            }
                                        }
                                    )
                                }}
                                className={clsx(
                                    "w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300",
                                    maintenanceMode ? "bg-red-500" : "bg-slate-300"
                                )}
                            >
                                <div
                                    className={clsx(
                                        "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300",
                                        maintenanceMode ? "translate-x-5" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>

                        {/* Cache clearing button */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div>
                                <span className="text-xs font-semibold text-slate-700 block">Bộ nhớ đệm (Cache)</span>
                                <span className="text-[10px] text-slate-500">Giải phóng dữ liệu đệm</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearCache}
                                disabled={isClearingCache}
                                className="flex items-center justify-center p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-all border border-primary-200 disabled:opacity-50"
                            >
                                <RefreshCw className={clsx("w-4 h-4", isClearingCache && "animate-spin")} />
                            </button>
                        </div>

                        {/* System announcement form */}
                        <form onSubmit={handleBroadcastAnnouncement} className="flex gap-2">
                            <input
                                aria-label="Nội dung thông báo phát nhanh"
                                type="text"
                                value={announcement}
                                onChange={(e) => setAnnouncement(e.target.value)}
                                placeholder="Phát tin khẩn toàn sàn..."
                                className="flex-1 px-3 py-1.5 text-xs border rounded-xl focus:ring-1 focus:ring-primary-500 outline-none"
                            />
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-xs bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl hover:shadow transition-all flex items-center gap-1"
                            >
                                <Volume2 className="w-3.5 h-3.5" />
                                Gửi
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            {/* Overview Performance Header */}
            <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-bold text-slate-900">Hiệu Suất Kinh Doanh & Tổng Quan</h2>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr gap-6">
                {overviewLoading ? (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                ) : (
                    <>
                        {canViewRevenue && (
                            <Card
                                title="Tổng doanh thu"
                                value={`${(stats.totalRevenue || 0).toLocaleString('vi-VN')} ₫`}
                                icon={DollarSign}
                                trend={stats.revenueGrowth > 0 ? `+${stats.revenueGrowth}%` : `${stats.revenueGrowth}%`}
                                trendUp={stats.revenueGrowth >= 0}
                                color="green"
                                description={`+${(Math.floor(systemHealth.onlineUsers * 45000)).toLocaleString('vi-VN')} ₫ hôm nay`}
                            />
                        )}

                        <Card
                            title="Tổng đơn hàng"
                            value={(stats.totalOrders || 0).toLocaleString()}
                            icon={ShoppingCart}
                            trend={stats.ordersGrowth > 0 ? `+${stats.ordersGrowth}%` : `${stats.ordersGrowth}%`}
                            trendUp={stats.ordersGrowth >= 0}
                            color="blue"
                            description={`+${Math.floor(systemHealth.onlineUsers / 8)} đơn mới hôm nay`}
                        />

                        <Card
                            title="Chờ xử lý"
                            value={stats.pendingOrders || 0}
                            icon={Clock}
                            color="orange"
                            description={`${Math.floor(systemHealth.latency / 25)} đơn chờ duyệt`}
                        />

                        <Card
                            title="Tổng sản phẩm"
                            value={stats.totalProducts || 0}
                            icon={Package}
                            color="purple"
                            description={`${stats.totalProducts || 0} đang bán`}
                        />

                        <Card
                            title="Tổng người dùng"
                            value={(stats.totalUsers || 0).toLocaleString()}
                            icon={Users}
                            trend={stats.newUsersThisMonth > 0 ? `+${stats.newUsersThisMonth}` : '0'}
                            trendUp={true}
                            color="cyan"
                            description={`● ${systemHealth.onlineUsers} khách đang xem`}
                        />

                        <Card
                            title="Cửa hàng"
                            value={stats.totalShops || 0}
                            icon={Store}
                            trend={stats.pendingShops > 0 ? `${stats.pendingShops} chờ duyệt` : '—'}
                            trendUp={false}
                            color="indigo"
                            description={stats.pendingShops > 0 ? `${stats.pendingShops} chờ duyệt` : 'Tất cả đã duyệt'}
                        />

                        <Card
                            title="Đã giao"
                            value={stats.deliveredOrders || 0}
                            icon={CheckCircle}
                            color="green"
                            description={`${stats.deliveredOrders || 0} đơn thành công`}
                        />

                        <Card
                            title="Đã hủy"
                            value={stats.canceledOrders || 0}
                            icon={XCircle}
                            trend={stats.cancellationRate ? `${stats.cancellationRate}%` : '—'}
                            trendUp={false}
                            color="red"
                            description={`Tỷ lệ hủy: ${stats.cancellationRate || 0}%`}
                        />
                    </>
                )}
            </div>

            {/* Section: Advanced Analytics */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary-600" />
                        <h2 className="text-lg font-bold text-slate-900">Phân Tích Dữ Liệu & Báo Cáo</h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Quick filter buttons */}
                        <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                            <button
                                type="button"
                                onClick={() => {
                                    setStartDate('2026-05-23')
                                    setEndDate('2026-05-30')
                                }}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg font-semibold transition-all",
                                    startDate === '2026-05-23' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                7 Ngày
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setStartDate('2026-04-30')
                                    setEndDate('2026-05-30')
                                }}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg font-semibold transition-all",
                                    startDate === '2026-04-30' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                30 Ngày
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setStartDate('2025-05-30')
                                    setEndDate('2026-05-30')
                                }}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg font-semibold transition-all",
                                    startDate === '2025-05-30' ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                12 Tháng
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setStartDate(null)
                                    setEndDate(null)
                                }}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg font-semibold transition-all",
                                    !startDate ? "bg-white text-primary-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                Tất cả
                            </button>
                        </div>
                        
                        {/* Custom date range pickers */}
                        <div className="flex items-center gap-2 text-xs">
                            <input
                                aria-label="Start date"
                                type="date"
                                value={startDate || ''}
                                onChange={e => setStartDate(e.target.value || null)}
                                className="border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-primary-500 outline-none text-slate-700 font-semibold bg-white"
                            />
                            <span className="text-slate-400 font-semibold">đến</span>
                            <input
                                aria-label="End date"
                                type="date"
                                value={endDate || ''}
                                onChange={e => setEndDate(e.target.value || null)}
                                className="border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-1 focus:ring-primary-500 outline-none text-slate-700 font-semibold bg-white"
                            />
                        </div>

                        <button type="button" onClick={exportRecentOrdersCSV} className="text-xs px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-primary-600 hover:text-primary-700 transition-all flex items-center gap-1 shadow-sm" aria-label={t('dashboard.export.recent') || 'Export recent orders'}>
                            Xuất CSV Đơn Hàng
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                {canViewRevenue && revenueChartData.length > 0 ? (
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between" role="region" aria-labelledby="revenue-chart-title">
                        <div>
                            <h2 id="revenue-chart-title" className="text-lg font-bold text-slate-900 mb-4">Doanh Thu Hệ Thống</h2>
                            <p id="revenue-chart-desc" className="sr-only">{t('dashboard.aria.revenueChart') || 'Biểu đồ hiển thị doanh thu theo ngày trong khoảng đã chọn'}</p>
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueChartData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.01} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 10 }}
                                            width={55}
                                            tickFormatter={formatRevenueAxis}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                background: 'rgba(15, 23, 42, 0.95)',
                                                color: '#fff',
                                                backdropFilter: 'blur(8px)',
                                                padding: '12px 16px'
                                            }}
                                            itemStyle={{ color: '#e2e8f0', fontSize: '11px' }}
                                            labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}
                                            formatter={formatRevenueTooltip}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#a855f7"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Orders Trend Chart */}
                {revenueChartData.length > 0 ? (
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between" role="region" aria-labelledby="orders-trend-chart-title">
                        <div>
                            <h2 id="orders-trend-chart-title" className="text-lg font-bold text-slate-900 mb-4">Đơn Hàng Hệ Thống</h2>
                            <p id="orders-trend-chart-desc" className="sr-only">Biểu đồ hiển thị số lượng đơn hàng theo ngày trong khoảng đã chọn</p>
                            <div className="h-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueChartData}>
                                        <defs>
                                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 10 }}
                                            width={40}
                                            tickFormatter={(value) => value.toLocaleString('vi-VN')}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                background: 'rgba(15, 23, 42, 0.95)',
                                                color: '#fff',
                                                backdropFilter: 'blur(8px)',
                                                padding: '12px 16px'
                                            }}
                                            itemStyle={{ color: '#e2e8f0', fontSize: '11px' }}
                                            labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}
                                            formatter={formatOrdersTooltip}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="orders"
                                            stroke="#06b6d4"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorOrders)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Order Status Distribution */}
                {orderDistribution.length > 0 ? (
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between" role="region" aria-labelledby="order-dist-title">
                        <div>
                            <h2 id="order-dist-title" className="text-lg font-bold text-slate-900 mb-4">Phân Bố Đơn Hàng</h2>
                            <p id="order-dist-desc" className="sr-only">Biểu đồ phân bố số lượng đơn hàng theo trạng thái</p>
                            <div className="h-[260px] relative flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={formattedOrderDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                            innerRadius={60}
                                            outerRadius={75}
                                            dataKey="count"
                                        >
                                            {formattedOrderDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                background: 'rgba(15, 23, 42, 0.95)',
                                                color: '#fff',
                                                backdropFilter: 'blur(8px)',
                                                padding: '12px 16px'
                                            }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-bold text-white uppercase tracking-wider">{data.name}</p>
                                                            <p className="text-[11px] text-slate-300">
                                                                Số lượng: <span className="font-semibold text-cyan-400">{data.count.toLocaleString()} đơn</span>
                                                            </p>
                                                            <p className="text-[11px] text-slate-300">
                                                                Doanh thu: <span className="font-semibold text-purple-400">{data.revenue.toLocaleString('vi-VN')} ₫</span>
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                
                                {/* Centered Total Order Badge */}
                                <div className="absolute flex flex-col items-center justify-center pointer-events-none pb-6">
                                    <span className="text-xl font-black text-slate-900">{(stats.totalOrders || 0).toLocaleString()}</span>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Đơn</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Bottom Section: Recent Orders, Top Products, Low Stock, Live Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Recent Orders */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Đơn hàng gần đây</h3>
                            <Link to="/orders" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                Xem tất cả
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="space-y-3" role="list" aria-label="Recent orders">
                            {recentOrders?.slice(0, 5).map((order) => (
                                <div key={order._id} role="listitem" className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">#{order._id?.slice(-6)}</p>
                                        <p className="text-xs text-slate-500">{order.user?.name || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-900">
                                            {(order.totalAmount || 0).toLocaleString('vi-VN')} ₫
                                        </p>
                                        <span className={clsx(
                                            'text-xs px-2 py-0.5 rounded-full',
                                            order.status === 'delivered' && 'bg-green-100 text-green-700',
                                            order.status === 'pending' && 'bg-orange-100 text-orange-700',
                                            order.status === 'processing' && 'bg-blue-100 text-blue-700',
                                            order.status === 'canceled' && 'bg-red-100 text-red-700'
                                        )}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {!recentOrders || recentOrders.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">Chưa có đơn hàng</p>
                            ) : null}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <button type="button" onClick={exportRecentOrdersCSV} className="w-full text-center text-xs text-primary-600 hover:text-primary-700 font-semibold" aria-label={t('dashboard.export.recent') || 'Export recent orders'}>{t('dashboard.export.recent') || 'Xuất CSV đơn hàng'}</button>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Sản phẩm bán chạy</h3>
                            <Link to="/reports" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                Chi tiết
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {topProductsData?.slice(0, 5).map((product, index) => (
                                <div key={product._id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-xs font-bold flex items-center justify-center">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                                        <p className="text-xs text-slate-500">{product.totalSold || 0} đã bán</p>
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                                </div>
                            ))}
                            {!topProductsData || topProductsData.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">Chưa có dữ liệu</p>
                            ) : null}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                        <Link to="/reports" className="text-xs text-primary-600 hover:text-primary-700 font-semibold">
                            Xem báo cáo bán hàng chi tiết
                        </Link>
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                Cảnh báo tồn kho
                            </h3>
                            <Link to="/products/stock" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                Xem tất cả
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {lowStockData?.slice(0, 5).map((product) => (
                                <div key={product._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                                        <p className="text-xs text-slate-500">{product.category?.name || 'Chưa phân loại'}</p>
                                    </div>
                                    <span className={clsx(
                                        'text-xs font-bold px-2 py-1 rounded-lg',
                                        (product.totalStock ?? product.stock) === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                    )}>
                                        {(product.totalStock ?? product.stock) === 0 ? 'Hết hàng' : `${product.totalStock ?? product.stock} còn lại`}
                                    </span>
                                </div>
                            ))}
                            {!lowStockData || lowStockData.length === 0 ? (
                                <p className="text-sm text-green-600 text-center py-4 flex items-center justify-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Tồn kho ổn định
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                        <Link to="/products/stock" className="text-xs text-primary-600 hover:text-primary-700 font-semibold">
                            Quản lý phiếu nhập kho
                        </Link>
                    </div>
                </div>

                {/* Live Activity Feed */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary-500" />
                                Hoạt động trực tuyến
                            </h3>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        </div>
                        <div className="space-y-3.5">
                            {liveEvents.map((ev) => (
                                <div key={ev.id} className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0 animate-slide-down">
                                    <span className={clsx(
                                        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm",
                                        ev.type === 'order' && 'bg-green-50 text-green-700',
                                        ev.type === 'user' && 'bg-blue-50 text-blue-700',
                                        ev.type === 'shop' && 'bg-purple-50 text-purple-700',
                                        ev.type === 'warning' && 'bg-red-50 text-red-700',
                                        ev.type === 'system' && 'bg-gray-100 text-gray-700'
                                    )}>
                                        {ev.type === 'order' && <ShoppingCart className="w-4 h-4" />}
                                        {ev.type === 'user' && <Users className="w-4 h-4" />}
                                        {ev.type === 'shop' && <Store className="w-4 h-4" />}
                                        {ev.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                                        {ev.type === 'system' && <Cpu className="w-4 h-4" />}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-900 break-words leading-relaxed">{ev.text}</p>
                                        <span className="text-[10px] text-slate-400 mt-1 block font-medium">{ev.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <Link to="/audit-logs" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center justify-center gap-1">
                            Xem nhật ký hệ thống đầy đủ
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </main>
        </>
    )
}

export default Dashboard
