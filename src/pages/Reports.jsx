import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Calendar, DollarSign, ShoppingBag, Users, TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import clsx from 'clsx';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Reports = () => {
    const { t } = useTranslation();
    const [period, setPeriod] = useState('last7days'); // last7days, last30days, thisMonth
    const [activeTab, setActiveTab] = useState('overview'); // overview, revenue, products, orders

    // Fetch Overview Stats
    const { data: overviewData, isLoading: isLoadingOverview } = useQuery({
        queryKey: ['analytics-overview'],
        queryFn: async () => {
            const res = await api.get('/analytics/overview');
            return res.data?.data || {};
        }
    });

    // Fetch Revenue Analytics
    const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
        queryKey: ['analytics-revenue', period],
        queryFn: async () => {
            const res = await api.get(`/analytics/revenue?period=${period}`);
            return res.data?.data || { chartData: [], totalRevenue: 0, totalOrders: 0 };
        },
        enabled: activeTab === 'overview' || activeTab === 'revenue'
    });

    // Fetch Top Products
    const { data: productsData, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['analytics-products'],
        queryFn: async () => {
            const res = await api.get('/analytics/products?limit=5');
            return res.data?.data || [];
        },
        enabled: activeTab === 'overview' || activeTab === 'products'
    });

    // Fetch Order Stats
    const { data: orderStats, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['analytics-orders'],
        queryFn: async () => {
            const res = await api.get('/analytics/orders');
            return res.data?.data || [];
        },
        enabled: activeTab === 'overview' || activeTab === 'orders'
    });

    // Fetch User Growth
    const { data: userData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['analytics-users', period],
        queryFn: async () => {
            const res = await api.get(`/analytics/users?period=${period}`);
            return res.data?.data || [];
        },
        enabled: activeTab === 'overview'
    });

    const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    const StatCard = ({ title, value, subtext, icon: Icon, color, trend }) => (
        <div className={clsx(
            "p-6 rounded-2xl border border-slate-100 shadow-sm bg-white relative overflow-hidden group",
            "hover:shadow-md transition-all duration-300"
        )}>
            <div className={clsx(
                "absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110",
                color
            )} />
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-800">{value}</span>
                        {trend && (
                            <span className={clsx(
                                "flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
                                trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                            )}>
                                {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                {Math.abs(trend).toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>
                <div className={clsx("p-3 rounded-xl", color.replace('bg-', 'bg-opacity-10 text-'))}>
                    <Icon className={clsx("w-6 h-6", color.replace('bg-', 'text-'))} />
                </div>
            </div>
            {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
        </div>
    );

    const renderOverview = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('dashboard.totalRevenue') || 'Doanh thu'}
                    value={formatCurrency(overviewData?.revenue?.total || 0)}
                    trend={overviewData?.revenue?.growth}
                    icon={DollarSign}
                    color="bg-purple-500"
                />
                <StatCard
                    title={t('dashboard.totalOrders') || 'Đơn hàng'}
                    value={overviewData?.orders?.total || 0}
                    icon={ShoppingBag}
                    color="bg-pink-500"
                />
                <StatCard
                    title={t('dashboard.totalProducts') || 'Sản phẩm'}
                    value={overviewData?.products?.total || 0}
                    icon={Package}
                    color="bg-blue-500"
                />
                <StatCard
                    title={t('dashboard.activeUsers') || 'Khách hàng'}
                    value={overviewData?.users?.total || 0}
                    icon={Users}
                    color="bg-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">{t('reports.revenueOverTime') || 'Biểu đồ doanh thu'}</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData?.chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `${value / 1000000}M`} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">{t('reports.orderStatus') || 'Trạng thái đơn hàng'}</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={orderStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {orderStats?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">{t('reports.topProducts') || 'Sản phẩm bán chạy'}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 text-left">
                                <th className="pb-3 text-sm font-semibold text-slate-600 pl-4">{t('table.product') || 'Sản phẩm'}</th>
                                <th className="pb-3 text-sm font-semibold text-slate-600">{t('table.category') || 'Danh mục'}</th>
                                <th className="pb-3 text-sm font-semibold text-slate-600 text-right">{t('table.sold') || 'Đã bán'}</th>
                                <th className="pb-3 text-sm font-semibold text-slate-600 text-right pr-4">{t('table.revenue') || 'Doanh thu'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productsData?.map((product, index) => (
                                <tr key={product._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 pl-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                                            <span className="font-medium text-slate-800 line-clamp-1">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-sm text-slate-600">{product.category}</td>
                                    <td className="py-3 text-right font-medium text-slate-800">{product.totalSold}</td>
                                    <td className="py-3 text-right pr-4 font-medium text-primary-600">{formatCurrency(product.totalRevenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('sidebar.reports') || 'Báo cáo & Thống kê'}</h1>
                    <p className="text-slate-500 mt-1">{t('reports.subtitle') || 'Tổng quan về hiệu quả kinh doanh của cửa hàng'}</p>
                </div>

                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    {[
                        { id: 'last7days', label: t('reports.last7days') || '7 ngày qua' },
                        { id: 'last30days', label: t('reports.last30days') || '30 ngày qua' },
                        { id: 'thisMonth', label: t('reports.thisMonth') || 'Tháng này' },
                    ].map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPeriod(p.id)}
                            className={clsx(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                period === p.id
                                    ? "bg-primary-50 text-primary-700 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-8">
                    {[
                        { id: 'overview', label: t('reports.overview') || 'Tổng quan' },
                        { id: 'revenue', label: t('reports.revenue') || 'Doanh thu' },
                        { id: 'products', label: t('sidebar.products') || 'Sản phẩm' },
                        { id: 'orders', label: t('sidebar.orders') || 'Đơn hàng' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "pb-4 px-1 border-b-2 font-medium text-sm transition-colors",
                                activeTab === tab.id
                                    ? "border-primary-500 text-primary-600"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {isLoadingOverview ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
                </div>
            ) : (
                renderOverview()
            )}
        </div>
    );
};

export default Reports;
