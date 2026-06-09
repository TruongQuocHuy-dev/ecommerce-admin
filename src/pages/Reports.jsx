import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
    Calendar, DollarSign, ShoppingBag, Users, TrendingUp, TrendingDown, Package, 
    AlertCircle, Sparkles, RefreshCw, FileText, CheckCircle, XCircle, Clock, 
    ArrowUpRight, Percent, Download, ArrowRight, Store, ChevronRight 
} from 'lucide-react';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import clsx from 'clsx';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

const Reports = () => {
    const { t } = useTranslation();
    const [period, setPeriod] = useState('last7days'); // last7days, last30days, thisMonth, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // overview, revenue, products, orders
    const [productsLimit, setProductsLimit] = useState(10);

    // Fetch Overview Stats
    const { data: overviewData, isLoading: isLoadingOverview, refetch: refetchOverview } = useQuery({
        queryKey: ['analytics-overview'],
        queryFn: async () => {
            const res = await api.get('/analytics/overview');
            return res.data?.data || {};
        }
    });

    // Fetch Revenue Analytics
    const { data: revenueData, isLoading: isLoadingRevenue, refetch: refetchRevenue } = useQuery({
        queryKey: ['analytics-revenue', period, startDate, endDate],
        queryFn: async () => {
            let url = `/analytics/revenue?period=${period}`;
            if (period === 'custom' && startDate && endDate) {
                url = `/analytics/revenue?startDate=${startDate}&endDate=${endDate}`;
            }
            const res = await api.get(url);
            return res.data?.data || { chartData: [], totalRevenue: 0, totalOrders: 0 };
        },
        enabled: activeTab === 'overview' || activeTab === 'revenue'
    });

    // Fetch Top Products
    const { data: productsData, isLoading: isLoadingProducts, refetch: refetchProducts } = useQuery({
        queryKey: ['analytics-products', productsLimit],
        queryFn: async () => {
            const res = await api.get(`/analytics/products?limit=${productsLimit}`);
            return res.data?.data || [];
        },
        enabled: activeTab === 'overview' || activeTab === 'products'
    });

    // Fetch Order Stats
    const { data: orderStats, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery({
        queryKey: ['analytics-orders'],
        queryFn: async () => {
            const res = await api.get('/analytics/orders');
            return res.data?.data || [];
        },
        enabled: activeTab === 'overview' || activeTab === 'orders'
    });

    const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    const handleRefresh = () => {
        refetchOverview();
        refetchRevenue();
        refetchProducts();
        refetchOrders();
    };

    const exportRevenueCSV = () => {
        const rows = [['Ngày', 'Số Đơn Hàng', 'Doanh Thu']];
        revenueData?.chartData?.forEach(item => {
            rows.push([item.date, item.orders, item.revenue]);
        });
        const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bao-cao-doanh-thu-${period}-${startDate || 'default'}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportProductsCSV = () => {
        const rows = [['Hạng', 'Sản phẩm', 'Danh mục', 'Đã bán', 'Doanh thu']];
        productsData?.forEach((p, idx) => {
            rows.push([idx + 1, p.name, p.category, p.totalSold, p.totalRevenue]);
        });
        const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bao-cao-san-pham-ban-chay.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const StatCard = ({ title, value, subtext, icon: Icon, color, trend, onClick }) => (
        <div 
            onClick={onClick}
            className={clsx(
                "p-6 rounded-2xl border border-slate-100 shadow-sm bg-white relative overflow-hidden group",
                "hover:shadow-md transition-all duration-300",
                onClick && "cursor-pointer hover:border-slate-300"
            )}
        >
            <div className={clsx(
                "absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110",
                color
            )} />
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-800">{value}</span>
                        {trend !== undefined && (
                            <span className={clsx(
                                "flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
                                trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                            )}>
                                {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                {Math.abs(trend).toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>
                <div className={clsx("p-3 rounded-xl bg-opacity-10", color.replace('bg-', 'bg-opacity-10 text-'))}>
                    <Icon className={clsx("w-6 h-6", color.replace('bg-', 'text-'))} />
                </div>
            </div>
            {subtext && (
                <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                    <span>{subtext}</span>
                    {onClick && <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-slate-400" />}
                </div>
            )}
        </div>
    );

    const renderOverview = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('dashboard.totalRevenue') || 'Doanh thu'}
                    value={formatCurrency(overviewData?.totalRevenue || 0)}
                    trend={overviewData?.revenueGrowth}
                    subtext={t('dashboard.vsLastMonth') || 'so với tháng trước'}
                    icon={DollarSign}
                    color="bg-indigo-500 text-indigo-600"
                    onClick={() => setActiveTab('revenue')}
                />
                <StatCard
                    title={t('dashboard.totalOrders') || 'Đơn hàng'}
                    value={(overviewData?.totalOrders || 0).toLocaleString()}
                    trend={overviewData?.ordersGrowth}
                    subtext={t('dashboard.vsLastMonth') || 'so với tháng trước'}
                    icon={ShoppingBag}
                    color="bg-pink-500 text-pink-600"
                    onClick={() => setActiveTab('orders')}
                />
                <StatCard
                    title={t('dashboard.totalProducts') || 'Sản phẩm'}
                    value={(overviewData?.totalProducts || 0).toLocaleString()}
                    subtext={`${overviewData?.totalProducts || 0} sản phẩm trực tuyến`}
                    icon={Package}
                    color="bg-cyan-500 text-cyan-600"
                    onClick={() => setActiveTab('products')}
                />
                <StatCard
                    title={t('dashboard.totalUsers') || 'Khách hàng'}
                    value={(overviewData?.totalUsers || 0).toLocaleString()}
                    subtext={`+${overviewData?.newUsersThisMonth || 0} đăng ký tháng này`}
                    icon={Users}
                    color="bg-emerald-500 text-emerald-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{t('reports.revenueOverTime') || 'Biểu đồ doanh thu'}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Xu hướng dòng tiền giao dịch thực tế</p>
                        </div>
                        <button 
                            onClick={() => setActiveTab('revenue')}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
                        >
                            Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="h-[300px] flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData?.chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value} />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{t('reports.orderStatus') || 'Trạng thái đơn hàng'}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Tỷ lệ các trạng thái xử lý đơn hàng</p>
                        </div>
                        <button 
                            onClick={() => setActiveTab('orders')}
                            className="text-xs font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1 hover:underline"
                        >
                            Phân tích <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="h-[300px] flex items-center justify-center flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={orderStats?.filter(o => o.count > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="count"
                                >
                                    {orderStats?.filter(o => o.count > 0).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value, name, props) => [`${value} đơn`, t(`orders.status.${props.payload.status}`) || props.payload.status]}
                                />
                                <Legend 
                                    formatter={(value, entry) => <span className="text-xs font-medium text-slate-600 capitalize">{t(`orders.status.${entry.payload.status}`) || entry.payload.status}</span>}
                                    layout="horizontal" 
                                    verticalAlign="bottom" 
                                    align="center"
                                    iconType="circle"
                                    iconSize={8}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{t('reports.topProducts') || 'Sản phẩm bán chạy'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Top 5 sản phẩm đạt sản lượng tiêu thụ lớn nhất</p>
                    </div>
                    <button
                        onClick={() => setActiveTab('products')}
                        className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 hover:underline"
                    >
                        Tất cả sản phẩm <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 text-left">
                                <th className="pb-3 text-sm font-semibold text-slate-600 pl-4">Hạng</th>
                                <th className="pb-3 text-sm font-semibold text-slate-600">{t('table.product') || 'Sản phẩm'}</th>
                                <th className="pb-3 text-sm font-semibold text-slate-600">{t('table.category') || 'Danh mục'}</th>
                                <th className="pb-3 text-sm font-semibold text-slate-600 text-right">{t('table.sold') || 'Đã bán'}</th>
                                <th className="pb-3 text-sm font-semibold text-slate-600 text-right pr-4">{t('table.revenue') || 'Doanh thu'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productsData?.slice(0, 5).map((product, index) => (
                                <tr key={product._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="py-4 pl-4 text-sm font-bold text-slate-500">
                                        #{index + 1}
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100 shadow-sm" />
                                            <span className="font-semibold text-slate-800 line-clamp-1 max-w-sm">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm font-medium text-slate-500">{product.category}</td>
                                    <td className="py-4 text-right font-bold text-slate-800">{product.totalSold}</td>
                                    <td className="py-4 text-right pr-4 font-bold text-indigo-600">{formatCurrency(product.totalRevenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderRevenueTab = () => {
        const totalDelivered = overviewData?.deliveredOrders || 1;
        const avgOrderValue = Math.round((overviewData?.totalRevenue || 0) / totalDelivered);

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Filters */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { id: 'last7days', label: '7 ngày qua' },
                            { id: 'last30days', label: '30 ngày qua' },
                            { id: 'thisMonth', label: 'Tháng này' },
                            { id: 'custom', label: 'Tùy chọn' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                    period === p.id
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {period === 'custom' && (
                        <div className="flex items-center gap-2 text-xs">
                            <input
                                aria-label="Start date"
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700 bg-white"
                            />
                            <span className="text-slate-400 font-semibold">đến</span>
                            <input
                                aria-label="End date"
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-slate-700 bg-white"
                            />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={exportRevenueCSV}
                            className="text-xs px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                        >
                            <Download className="w-4 h-4 text-slate-500" />
                            {t('reports.exportCSV') || 'Xuất CSV'}
                        </button>
                    </div>
                </div>

                {/* Sub Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md relative overflow-hidden group">
                        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                            <DollarSign className="w-32 h-32" />
                        </div>
                        <h4 className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Doanh Thu Trong Kỳ</h4>
                        <p className="text-3xl font-extrabold mt-3">{formatCurrency(revenueData?.totalRevenue || 0)}</p>
                        <div className="flex justify-between items-center mt-4 text-xs text-indigo-100 border-t border-indigo-400/30 pt-3">
                            <span>Sản lượng đơn hàng:</span>
                            <span className="font-bold text-white text-sm">{(revenueData?.totalOrders || 0).toLocaleString()} đơn</span>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
                        <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Giá Trị Đơn Trung Bình (AOV)</h4>
                        <p className="text-3xl font-extrabold text-slate-800 mt-3">{formatCurrency(avgOrderValue)}</p>
                        <div className="flex justify-between items-center mt-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                            <span>Tính trên tổng đơn hoàn thành:</span>
                            <span className="font-semibold text-slate-700">{totalDelivered.toLocaleString()} đơn</span>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
                        <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tỷ Lệ Tăng Trưởng Doanh Thu</h4>
                        <p className={clsx(
                            "text-3xl font-extrabold mt-3 flex items-center gap-1",
                            (overviewData?.revenueGrowth || 0) >= 0 ? "text-green-600" : "text-red-500"
                        )}>
                            {(overviewData?.revenueGrowth || 0) >= 0 ? '+' : ''}
                            {(overviewData?.revenueGrowth || 0).toFixed(1)}%
                        </p>
                        <div className="flex justify-between items-center mt-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                            <span>{t('reports.vsLastMonth')}</span>
                            <span className="font-semibold text-slate-700">Tháng trước</span>
                        </div>
                    </div>
                </div>

                {/* Revenue Analytics Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Phân Tích Chi Tiết Biểu Đồ</h3>
                        <p className="text-xs text-slate-400">Tương quan doanh thu (Area) và lượng đơn hàng đặt mua thành công (Bar)</p>
                    </div>

                    {isLoadingRevenue ? (
                        <div className="flex justify-center items-center h-64">
                            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : revenueData?.chartData?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                            <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-sm font-medium text-slate-500">{t('reports.noData')}</p>
                        </div>
                    ) : (
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData?.chartData}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(val) => `${val / 1000000}M`} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            background: '#0f172a',
                                            color: '#fff',
                                            padding: '12px 16px'
                                        }}
                                        formatter={(value, name) => {
                                            if (name === 'revenue') return [formatCurrency(value), 'Doanh thu'];
                                            if (name === 'orders') return [`${value} đơn`, 'Số đơn'];
                                            return [value, name];
                                        }}
                                    />
                                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" />
                                    <Bar yAxisId="right" dataKey="orders" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={30} opacity={0.8} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Details Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">{t('reports.revenueDetails') || 'Chi tiết doanh thu theo ngày'}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Số liệu phân phối tổng hợp</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-500 text-sm font-semibold">
                                    <th className="py-3 px-6">Ngày</th>
                                    <th className="py-3 px-6 text-right">Số đơn hàng</th>
                                    <th className="py-3 px-6 text-right">Doanh thu giao dịch</th>
                                    <th className="py-3 px-6 text-right">Trung bình / Đơn</th>
                                </tr>
                            </thead>
                            <tbody>
                                {revenueData?.chartData?.slice().reverse().map((item) => (
                                    <tr key={item.date} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm text-slate-700">
                                        <td className="py-3 px-6 font-semibold">{item.date}</td>
                                        <td className="py-3 px-6 text-right font-bold text-slate-800">{item.orders}</td>
                                        <td className="py-3 px-6 text-right font-bold text-slate-900">{formatCurrency(item.revenue)}</td>
                                        <td className="py-3 px-6 text-right font-medium text-slate-500">
                                            {item.orders > 0 ? formatCurrency(Math.round(item.revenue / item.orders)) : formatCurrency(0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderProductsTab = () => {
        const topSoldValue = productsData?.[0]?.totalSold || 1;

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Header configuration */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500">Hiển thị tối đa:</span>
                        <select 
                            value={productsLimit} 
                            onChange={(e) => setProductsLimit(Number(e.target.value))}
                            className="border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-cyan-500 outline-none text-xs font-bold text-slate-700 bg-slate-50"
                        >
                            <option value={5}>Top 5</option>
                            <option value={10}>Top 10</option>
                            <option value={20}>Top 20</option>
                            <option value={50}>Top 50</option>
                        </select>
                    </div>

                    <button
                        onClick={exportProductsCSV}
                        className="text-xs px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                    >
                        <Download className="w-4 h-4 text-slate-500" />
                        Xuất báo cáo bán chạy
                    </button>
                </div>

                {/* Top Selling Products List with Progress bars */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-base font-bold text-slate-800">{t('reports.topSellingProducts') || 'Sản phẩm bán chạy nhất'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Xếp hạng theo sản lượng bán ra thực tế</p>
                    </div>

                    {isLoadingProducts ? (
                        <div className="flex justify-center items-center h-64">
                            <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
                        </div>
                    ) : productsData?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-200 rounded-xl bg-slate-50 m-6">
                            <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-sm font-medium text-slate-500">Chưa có dữ liệu sản phẩm nào được tiêu thụ.</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {productsData?.map((product, index) => {
                                const progressPercent = Math.min(100, Math.round((product.totalSold / topSoldValue) * 100));

                                return (
                                    <div key={product._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-extrabold border border-slate-200">
                                                {index + 1}
                                            </div>
                                            <img src={product.image || 'https://via.placeholder.com/150'} alt={product.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-sm" />
                                            <div className="space-y-0.5 max-w-md">
                                                <h4 className="font-semibold text-slate-800 line-clamp-1">{product.name}</h4>
                                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">{product.category}</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="flex-1 max-w-md hidden md:block">
                                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                <span>Tỷ lệ bán</span>
                                                <span className="font-bold text-slate-600">{progressPercent}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 text-right self-end md:self-auto">
                                            <div>
                                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Đã bán</span>
                                                <span className="font-bold text-slate-800">{product.totalSold}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Doanh thu</span>
                                                <span className="font-extrabold text-indigo-600">{formatCurrency(product.totalRevenue)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderOrdersTab = () => {
        // Parse Order Stats
        const totalOrders = overviewData?.totalOrders || 0;
        const pending = overviewData?.pendingOrders || 0;
        const delivered = overviewData?.deliveredOrders || 0;
        const cancelled = overviewData?.canceledOrders || 0;
        const cancellationRate = overviewData?.cancellationRate || 0;

        const STATUS_DETAILS = [
            { id: 'pending', name: t('orders.status.pending') || 'Chờ xử lý', count: pending, color: 'bg-amber-500 text-amber-600 border-amber-200' },
            { id: 'delivered', name: t('reports.deliveredOrders') || 'Đơn giao thành công', count: delivered, color: 'bg-emerald-500 text-emerald-600 border-emerald-200' },
            { id: 'cancelled', name: t('orders.status.cancelled') || 'Đã hủy', count: cancelled, color: 'bg-rose-500 text-rose-600 border-rose-200' },
            { id: 'others', name: t('reports.otherStatuses') || 'Trạng thái khác', count: Math.max(0, totalOrders - pending - delivered - cancelled), color: 'bg-slate-500 text-slate-600 border-slate-200' },
        ];

        return (
            <div className="space-y-6 animate-fade-in">
                {/* Orders metrics cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.totalOrders') || 'Tổng đơn hàng'}</span>
                            <ShoppingBag className="w-5 h-5 text-indigo-500" />
                        </div>
                        <p className="text-3xl font-extrabold text-slate-800 mt-4">{(totalOrders).toLocaleString()}</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('reports.deliveredOrders') || 'Đơn giao thành công'}</span>
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <p className="text-3xl font-extrabold text-slate-800 mt-4">{(delivered).toLocaleString()}</p>
                        <span className="text-[10px] text-slate-400 mt-2 block">
                            {t('reports.ratioOfTotal', { percent: totalOrders > 0 ? ((delivered / totalOrders) * 100).toFixed(1) : 0 })}
                        </span>
                    </div>

                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('orders.status.pending') || 'Chờ xử lý'}</span>
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-3xl font-extrabold text-slate-800 mt-4">{(pending).toLocaleString()}</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('reports.cancellationRate') || 'Tỷ lệ hủy đơn'}</span>
                            <XCircle className="w-5 h-5 text-rose-500" />
                        </div>
                        <p className="text-3xl font-extrabold text-rose-600 mt-4">{cancellationRate}%</p>
                        <span className="text-[10px] text-slate-400 mt-2 block">
                            {t('reports.totalCancelledText', { count: cancelled })}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status Distribution Table */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">{t('reports.orderStatusDistribution') || 'Phân bố trạng thái đơn hàng'}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Số lượng đơn hàng chi tiết theo từng trạng thái</p>
                        </div>
                        <div className="space-y-3 pt-2">
                            {STATUS_DETAILS.map((status) => {
                                const percent = totalOrders > 0 ? ((status.count / totalOrders) * 100).toFixed(1) : 0;
                                return (
                                    <div key={status.id} className="p-3.5 rounded-xl border border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <span className={clsx("w-2.5 h-2.5 rounded-full", status.color.split(' ')[0])} />
                                            <span className="text-xs font-semibold text-slate-700">{status.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-slate-800 text-sm">{status.count}</span>
                                            <span className="text-[10px] text-slate-400 ml-1.5">({percent}%)</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chart Distribution */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Biểu đồ phân bố</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Phân tích trực quan tỷ lệ trạng thái đơn</p>
                        </div>

                        {isLoadingOrders ? (
                            <div className="flex justify-center items-center h-64">
                                <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="h-[280px] flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={orderStats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="status" tickFormatter={(val) => t(`orders.status.${val}`) || val} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <Tooltip labelFormatter={(label) => t(`orders.status.${label}`) || label} formatter={(value) => [`${value} đơn`, 'Số lượng']} />
                                        <Bar dataKey="count" fill="#ec4899" radius={[4, 4, 0, 0]}>
                                            {orderStats?.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.12),transparent_30%)] animate-pulse" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300 backdrop-blur">
                            {t('reports.commandCenter')}
                        </span>
                        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl flex items-center gap-2">
                            {t('reports.title')}
                            <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                        </h1>
                        <p className="mt-2 text-sm text-slate-300 md:text-base max-w-xl">
                            {t('reports.subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start lg:self-center">
                        <button
                            onClick={handleRefresh}
                            className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur transition-all flex items-center gap-1.5 shadow-sm text-xs font-bold"
                            title="Tải lại dữ liệu"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Làm mới
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200">
                <nav className="flex space-x-8 -mb-px">
                    {[
                        { id: 'overview', label: t('reports.overview') || 'Tổng quan', icon: FileText },
                        { id: 'revenue', label: t('reports.revenueTab') || 'Doanh thu', icon: DollarSign },
                        { id: 'products', label: t('reports.productsTab') || 'Sản phẩm', icon: Package },
                        { id: 'orders', label: t('reports.ordersTab') || 'Đơn hàng', icon: ShoppingBag },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "pb-4 px-1 border-b-2 font-bold text-sm transition-all flex items-center gap-2",
                                    isActive
                                        ? "border-indigo-600 text-indigo-600"
                                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                )}
                            >
                                <Icon className={clsx("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Display Loader on General overview fetching */}
            {isLoadingOverview ? (
                <div className="flex flex-col items-center justify-center h-80">
                    <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                    <p className="text-sm text-slate-500 font-semibold">{t('reports.loading')}</p>
                </div>
            ) : (
                <div className="pb-12">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'revenue' && renderRevenueTab()}
                    {activeTab === 'products' && renderProductsTab()}
                    {activeTab === 'orders' && renderOrdersTab()}
                </div>
            )}
        </div>
    );
};

export default Reports;
