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
    Eye
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

const Dashboard = () => {
    const { user } = useAuthStore()
    const { t } = useTranslation()
    const canViewRevenue = hasPermission(user?.role, PERMISSIONS.VIEW_REVENUE_STATS)

    // Fetch overview stats
    const { data: overviewData, isLoading: overviewLoading } = useQuery({
        queryKey: ['analytics-overview'],
        queryFn: async () => {
            const res = await api.get('/analytics/overview')
            return res.data?.data
        },
    })

    // Fetch revenue data (last 7 days)
    const { data: revenueData } = useQuery({
        queryKey: ['analytics-revenue', 'last7days'],
        queryFn: async () => {
            const res = await api.get('/analytics/revenue?period=last7days')
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

    // Prepare data for charts
    const revenueChartData = revenueData?.chartData || []
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

    const formattedOrderDistribution = orderDistribution.map(item => ({
        ...item,
        name: STATUS_LABELS[item.status] || item.status,
        color: STATUS_COLORS[item.status] || '#000000'
    })).filter(item => item.count > 0)

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.title')}</h1>
                <p className="text-slate-600 mt-1">
                    {t('dashboard.welcome', { name: user?.name })}. {t('dashboard.subtitle')}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                                description="So với tháng trước"
                            />
                        )}

                        <Card
                            title="Tổng đơn hàng"
                            value={(stats.totalOrders || 0).toLocaleString()}
                            icon={ShoppingCart}
                            trend={stats.ordersGrowth > 0 ? `+${stats.ordersGrowth}%` : `${stats.ordersGrowth}%`}
                            trendUp={stats.ordersGrowth >= 0}
                            color="blue"
                        />

                        <Card
                            title="Chờ xử lý"
                            value={stats.pendingOrders || 0}
                            icon={Clock}
                            color="orange"
                            description="Đơn hàng đang chờ"
                        />

                        <Card
                            title="Tổng sản phẩm"
                            value={stats.totalProducts || 0}
                            icon={Package}
                            color="purple"
                        />

                        <Card
                            title="Tổng người dùng"
                            value={(stats.totalUsers || 0).toLocaleString()}
                            icon={Users}
                            trend={stats.newUsersThisMonth > 0 ? `+${stats.newUsersThisMonth}` : '0'}
                            trendUp={true}
                            color="cyan"
                            description="Người dùng mới tháng này"
                        />

                        <Card
                            title="Cửa hàng"
                            value={stats.totalShops || 0}
                            icon={Store}
                            trend={stats.pendingShops > 0 ? `${stats.pendingShops} chờ duyệt` : '—'}
                            trendUp={false}
                            color="indigo"
                        />

                        <Card
                            title="Đã giao"
                            value={stats.deliveredOrders || 0}
                            icon={CheckCircle}
                            color="green"
                        />

                        <Card
                            title="Đã hủy"
                            value={stats.canceledOrders || 0}
                            icon={XCircle}
                            trend={stats.cancellationRate ? `${stats.cancellationRate}%` : '—'}
                            trendUp={false}
                            color="red"
                            description="Tỷ lệ hủy đơn"
                        />
                    </>
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                {canViewRevenue && revenueChartData.length > 0 && (
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Doanh thu 7 ngày qua</h2>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueChartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        width={65}
                                        tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value) => [`${value.toLocaleString('vi-VN')} ₫`, 'Doanh thu']}
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
                )}

                {/* Order Status Distribution */}
                {orderDistribution.length > 0 && (
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Phân bố trạng thái đơn hàng</h2>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={formattedOrderDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        dataKey="count"
                                    >
                                        {formattedOrderDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Section: Recent Orders, Top Products, Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Đơn hàng gần đây</h3>
                        <Link to="/orders" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            Xem tất cả
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentOrders?.slice(0, 5).map((order) => (
                            <div key={order._id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
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
                        {(!recentOrders || recentOrders.length === 0) && (
                            <p className="text-sm text-slate-400 text-center py-4">Chưa có đơn hàng</p>
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Sản phẩm bán chạy</h3>
                        <Link to="/reports" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            Chi tiết
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {topProductsData?.map((product, index) => (
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
                        {(!topProductsData || topProductsData.length === 0) && (
                            <p className="text-sm text-slate-400 text-center py-4">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
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
                        {lowStockData?.map((product) => (
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
                        {(!lowStockData || lowStockData.length === 0) && (
                            <p className="text-sm text-green-600 text-center py-4 flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Tồn kho ổn định
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
