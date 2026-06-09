import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Shield, Search, Filter, Calendar, User, FileText, AlertCircle,
    CheckCircle, XCircle, Eye, Trash2, Edit2, Plus, Loader2, Sparkles,
    Download, RefreshCw, Globe, Laptop, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import clsx from 'clsx';

const AuditLogs = () => {
    const { t } = useTranslation();
    const [filters, setFilters] = useState({
        searchUser: '',
        action: '',
        entity: '',
        status: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 20,
    });

    const [selectedLog, setSelectedLog] = useState(null);

    // Fetch Logs
    const { data, isLoading, refetch: refetchLogs } = useQuery({
        queryKey: ['auditLogs', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            const res = await api.get(`/audit-logs?${params}`);
            return res.data?.data;
        },
    });

    // Fetch Statistics
    const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
        queryKey: ['auditLogsStats', filters.startDate, filters.endDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            const res = await api.get(`/audit-logs/stats?${params}`);
            return res.data?.data || {};
        }
    });

    const logs = data?.logs || [];
    const total = data?.total || 0;
    const pages = data?.pages || 1;

    const handleRefresh = () => {
        refetchLogs();
        refetchStats();
    };

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const resetFilters = () => {
        setFilters({
            searchUser: '',
            action: '',
            entity: '',
            status: '',
            startDate: '',
            endDate: '',
            page: 1,
            limit: 20,
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pages) {
            setFilters((prev) => ({ ...prev, page: newPage }));
        }
    };

    // Pagination numbers list builder
    const getPaginationNumbers = () => {
        const range = [];
        const maxVisible = 5;
        let start = Math.max(1, filters.page - 2);
        let end = Math.min(pages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
            range.push(i);
        }
        return range;
    };

    // CSV logs export
    const exportLogsCSV = () => {
        const rows = [['Thời gian', 'Người dùng', 'Email', 'Vai trò', 'Hành động', 'Đối tượng', 'Trạng thái', 'IP Address', 'User Agent', 'Chi tiết lỗi']];
        logs.forEach(log => {
            rows.push([
                new Date(log.createdAt).toLocaleString('vi-VN'),
                log.userId?.name || 'N/A',
                log.userId?.email || 'N/A',
                log.userId?.role || 'N/A',
                log.action,
                log.entity,
                log.status === 'success' ? 'Thành công' : 'Thất bại',
                log.ipAddress || 'N/A',
                log.userAgent || 'N/A',
                log.errorMessage || ''
            ]);
        });
        const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-page-${filters.page}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderDiff = (before = {}, after = {}) => {
        const allKeys = Array.from(new Set([
            ...Object.keys(before || {}), 
            ...Object.keys(after || {})
        ])).filter(k => k !== '_id' && k !== 'password' && k !== 'passwordConfirm' && k !== 'createdAt' && k !== 'updatedAt' && k !== '__v');

        if (allKeys.length === 0) {
            return <p className="text-xs text-slate-500 italic py-2">Không có chi tiết thay đổi cấu trúc dữ liệu.</p>;
        }

        return (
            <div className="border border-slate-100 rounded-xl overflow-hidden text-xs max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold sticky top-0">
                            <th className="py-2.5 px-4 w-1/4">Trường</th>
                            <th className="py-2.5 px-4 w-3/8 text-rose-700 bg-rose-50/10">Giá trị cũ</th>
                            <th className="py-2.5 px-4 w-3/8 text-emerald-700 bg-emerald-50/10">Giá trị mới</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px] break-all">
                        {allKeys.map(key => {
                            const valBefore = before?.[key];
                            const valAfter = after?.[key];
                            const isChanged = JSON.stringify(valBefore) !== JSON.stringify(valAfter);

                            const renderVal = (v) => {
                                if (v === undefined || v === null) return <span className="text-slate-400 font-sans italic">Trống</span>;
                                if (typeof v === 'object') return JSON.stringify(v);
                                if (typeof v === 'boolean') return v ? 'true' : 'false';
                                return String(v);
                            };

                            return (
                                <tr key={key} className={clsx("hover:bg-slate-50/30 transition-colors", isChanged && "bg-amber-50/10")}>
                                    <td className="py-2 px-4 font-semibold text-slate-600 font-sans">{key}</td>
                                    <td className="py-2 px-4 text-slate-400 bg-rose-50/5">
                                        {valBefore !== undefined ? (
                                            <span className={clsx(isChanged && "text-rose-600 line-through")}>
                                                {renderVal(valBefore)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-sans italic">—</span>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 text-slate-700 bg-emerald-50/5">
                                        {valAfter !== undefined ? (
                                            <span className={clsx(isChanged && "text-emerald-700 font-bold bg-emerald-50 px-1 rounded")}>
                                                {renderVal(valAfter)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-sans italic">Đã xóa</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_28%)] animate-pulse" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300 backdrop-blur">
                            {t('auditLogs.commandCenter') || 'Trung tâm kiểm toán hệ thống'}
                        </span>
                        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl flex items-center gap-2">
                            {t('auditLogs.title') || 'Nhật ký hoạt động'}
                            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                        </h1>
                        <p className="mt-2 text-sm text-slate-300 md:text-base">
                            {t('auditLogs.subtitle') || 'Theo dõi và giám sát chi tiết các hành động cấu hình và tác vụ của quản trị viên'}
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur transition-all flex items-center gap-1.5 shadow-sm text-xs font-bold self-start lg:self-center"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Statistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Operator widget */}
                <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-2">Thao Tác Nhiều Nhất</span>
                        {isLoadingStats ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-6 bg-slate-100 rounded w-2/3" />
                                <div className="h-4 bg-slate-50 rounded w-1/2" />
                            </div>
                        ) : statsData?.topUsers?.length > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                        {statsData.topUsers[0].name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{statsData.topUsers[0].name}</h4>
                                        <span className="text-xs text-slate-500 break-all">{statsData.topUsers[0].email}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-50 pt-2.5">
                                    <span>Tác vụ đã thực hiện:</span>
                                    <span className="font-extrabold text-indigo-600">{statsData.topUsers[0].count} lần</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic py-4">Chưa có thống kê người dùng</p>
                        )}
                    </div>
                </div>

                {/* Top Action widget */}
                <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-2">Hành Động Phổ Biến</span>
                        {isLoadingStats ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-6 bg-slate-100 rounded w-2/3" />
                                <div className="h-4 bg-slate-50 rounded w-1/2" />
                            </div>
                        ) : statsData?.byAction?.length > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        {statsData.byAction[0]._id}
                                    </span>
                                    <span className="text-2xl font-black text-slate-800">{statsData.byAction[0].count} <span className="text-xs font-semibold text-slate-400">lần</span></span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '85%' }} />
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic py-4">Chưa ghi nhận hành động</p>
                        )}
                    </div>
                </div>

                {/* Top Entity widget */}
                <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-2">Đối Tượng Bị Tác Động Nhiều</span>
                        {isLoadingStats ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-6 bg-slate-100 rounded w-2/3" />
                                <div className="h-4 bg-slate-50 rounded w-1/2" />
                            </div>
                        ) : statsData?.byEntity?.length > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-700">{statsData.byEntity[0]._id}</span>
                                    <span className="text-2xl font-black text-slate-800">{statsData.byEntity[0].count} <span className="text-xs font-semibold text-slate-400">lần</span></span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '70%' }} />
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic py-4">Chưa ghi nhận đối tượng</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-indigo-500" />
                        Tìm kiếm nâng cao
                    </h3>
                    <button
                        onClick={resetFilters}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-bold hover:underline"
                    >
                        Khôi phục bộ lọc
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* User Search Input */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Tên / Email người dùng</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={filters.searchUser}
                                onChange={(e) => updateFilter('searchUser', e.target.value)}
                                placeholder="Nhập tên, email để lọc..."
                                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50/50"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Hành động</label>
                        <select
                            value={filters.action}
                            onChange={(e) => updateFilter('action', e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50/50 font-medium text-slate-700"
                        >
                            <option value="">Tất cả hành động</option>
                            <optgroup label="Tương tác & Ghi (Write)">
                                <option value="CREATE">Tạo mới (CREATE)</option>
                                <option value="REGISTER">Đăng ký mới (REGISTER)</option>
                            </optgroup>
                            <optgroup label="Chỉnh sửa & Cập nhật (Edit)">
                                <option value="UPDATE">Cập nhật (UPDATE)</option>
                                <option value="PROFILE_UPDATE">Sửa hồ sơ (PROFILE_UPDATE)</option>
                                <option value="PASSWORD_CHANGE">Đổi mật khẩu (PASSWORD_CHANGE)</option>
                            </optgroup>
                            <optgroup label="Kiểm duyệt & Cấu hình (Moderation)">
                                <option value="APPROVE">Phê duyệt (APPROVE)</option>
                                <option value="REJECT">Từ chối (REJECT)</option>
                                <option value="SUSPEND">Tạm khóa (SUSPEND)</option>
                                <option value="ACTIVATE">Kích hoạt lại (ACTIVATE)</option>
                            </optgroup>
                            <optgroup label="Hệ thống & Bảo mật (System & Security)">
                                <option value="LOGIN">Đăng nhập (LOGIN)</option>
                                <option value="LOGOUT">Đăng xuất (LOGOUT)</option>
                                <option value="LOGIN_FAILED">Đăng nhập lỗi (LOGIN_FAILED)</option>
                                <option value="EXPORT">Xuất dữ liệu (EXPORT)</option>
                                <option value="DELETE">Xóa bỏ (DELETE)</option>
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Đối tượng</label>
                        <select
                            value={filters.entity}
                            onChange={(e) => updateFilter('entity', e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50/50 font-medium"
                        >
                            <option value="">Tất cả</option>
                            <option value="User">Người dùng</option>
                            <option value="Product">Sản phẩm</option>
                            <option value="Order">Đơn hàng</option>
                            <option value="Shop">Cửa hàng</option>
                            <option value="Category">Danh mục</option>
                            <option value="Discount">Mã giảm giá</option>
                            <option value="Setting">Cài đặt</option>
                            <option value="Brand">Thương hiệu</option>
                            <option value="Supplier">Nhà cung cấp</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Trạng thái</label>
                        <select
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50/50 font-medium"
                        >
                            <option value="">Tất cả</option>
                            <option value="success">Thành công</option>
                            <option value="failed">Thất bại</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Từ ngày</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => updateFilter('startDate', e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50/50 text-slate-700 font-semibold"
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table Area */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30">
                    <h3 className="text-sm font-bold text-slate-700">
                        Danh sách nhật ký: <span className="font-extrabold text-indigo-600">{total}</span> kết quả
                    </h3>
                    <button
                        onClick={exportLogsCSV}
                        disabled={logs.length === 0}
                        className="text-xs px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                    >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        Xuất trang hiện tại (CSV)
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <span className="text-xs text-slate-400 font-semibold">Đang truy vấn dữ liệu...</span>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-16 text-center">
                        <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h4 className="text-sm font-bold text-slate-600">Không tìm thấy nhật ký</h4>
                        <p className="text-xs text-slate-400 mt-1">Vui lòng thay đổi từ khóa lọc hoặc quay lại sau.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-left text-slate-500 text-xs font-bold bg-slate-50/30">
                                    <th className="py-3 px-6">Thời gian</th>
                                    <th className="py-3 px-6">Người dùng</th>
                                    <th className="py-3 px-6">Hành động</th>
                                    <th className="py-3 px-6">Đối tượng</th>
                                    <th className="py-3 px-6">IP / Thiết bị</th>
                                    <th className="py-3 px-6">Trạng thái</th>
                                    <th className="py-3 px-6 text-right">Tác vụ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors text-sm text-slate-700">
                                        <td className="py-4 px-6 text-xs text-slate-500 font-semibold whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                    {log.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="font-bold text-slate-800 text-xs">
                                                        {log.userId?.name || 'Unknown'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">{log.userId?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap">
                                            <ActionBadge action={log.action} />
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap text-xs text-slate-600 font-semibold">
                                            {log.entity}
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap">
                                            <div className="text-xs text-slate-600 font-mono flex items-center gap-1">
                                                <Globe className="w-3 h-3 text-slate-400" />
                                                {log.ipAddress || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 whitespace-nowrap">
                                            <StatusBadge status={log.status} />
                                        </td>
                                        <td className="py-4 px-6 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all"
                                                title="Xem chi tiết thay đổi"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!isLoading && pages > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20 text-xs">
                        <div className="flex items-center gap-4 text-slate-500">
                            <span>
                                Hiển thị {logs.length} / {total} bản ghi
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span>Mỗi trang:</span>
                                <select
                                    value={filters.limit}
                                    onChange={(e) => updateFilter('limit', Number(e.target.value))}
                                    className="border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 bg-white"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>

                        {pages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(filters.page - 1)}
                                    disabled={filters.page === 1}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    aria-label="Previous Page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {getPaginationNumbers().map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handlePageChange(num)}
                                        className={clsx(
                                            "w-8 h-8 rounded-lg font-bold border transition-all",
                                            filters.page === num
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        {num}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(filters.page + 1)}
                                    disabled={filters.page >= pages}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    aria-label="Next Page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Log Details Modal / Diff Drawer */}
            {selectedLog && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" role="dialog" aria-modal="true">
                    <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-150 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-600" />
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-base">Chi tiết nhật ký hoạt động</h3>
                                    <span className="text-[10px] text-slate-400 font-mono">ID: {selectedLog._id}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 bg-slate-100 rounded-lg"
                            >
                                Đóng
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                                        <span className="text-slate-400 font-semibold">Tài khoản:</span>
                                        <span className="font-bold text-slate-800">{selectedLog.userId?.name} ({selectedLog.userId?.role})</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                                        <span className="text-slate-400 font-semibold">IP Address:</span>
                                        <span className="font-mono text-slate-800">{selectedLog.ipAddress || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                                        <span className="text-slate-400 font-semibold">Trạng thái:</span>
                                        <StatusBadge status={selectedLog.status} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                                        <span className="text-slate-400 font-semibold">Hành động:</span>
                                        <ActionBadge action={selectedLog.action} />
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                                        <span className="text-slate-400 font-semibold">Đối tượng tác động:</span>
                                        <span className="font-bold text-slate-800">{selectedLog.entity}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                                        <span className="text-slate-400 font-semibold">Thời gian:</span>
                                        <span className="font-semibold text-slate-800">{new Date(selectedLog.createdAt).toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* User Agent */}
                            {selectedLog.userAgent && (
                                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider flex items-center gap-1">
                                        <Laptop className="w-3.5 h-3.5 text-slate-400" />
                                        Thông tin thiết bị (User Agent)
                                    </span>
                                    <p className="text-slate-600 font-mono leading-relaxed break-all text-[11px]">{selectedLog.userAgent}</p>
                                </div>
                            )}

                            {/* Error Details */}
                            {selectedLog.status === 'failed' && selectedLog.errorMessage && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs space-y-1.5 animate-pulse">
                                    <span className="font-bold text-rose-800 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Mô tả chi tiết lỗi hệ thống
                                    </span>
                                    <p className="text-rose-700 font-mono font-medium">{selectedLog.errorMessage}</p>
                                </div>
                            )}

                            {/* Data Changes Diff */}
                            <div className="space-y-2.5">
                                <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block flex items-center gap-1">
                                    <Info className="w-3.5 h-3.5 text-slate-400" />
                                    Bảng so sánh chi tiết thay đổi (JSON Diff)
                                </span>
                                {renderDiff(selectedLog.changes?.before, selectedLog.changes?.after)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Action Badge Component
const ActionBadge = ({ action }) => {
    const config = {
        CREATE: { bg: 'bg-green-50 text-green-700 border-green-200', icon: Plus, label: 'Tạo mới' },
        UPDATE: { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Edit2, label: 'Cập nhật' },
        DELETE: { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: Trash2, label: 'Xóa' },
        APPROVE: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Phê duyệt' },
        REJECT: { bg: 'bg-orange-50 text-orange-700 border-orange-200', icon: XCircle, label: 'Từ chối' },
        SUSPEND: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle, label: 'Tạm khóa' },
        ACTIVATE: { bg: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle, label: 'Kích hoạt' },
        LOGIN: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: User, label: 'Đăng nhập' },
        LOGOUT: { bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: User, label: 'Đăng xuất' },
        EXPORT: { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Download, label: 'Xuất CSV' },
        VIEW: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Eye, label: 'Xem' },
        REGISTER: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: User, label: 'Đăng ký' },
        PASSWORD_CHANGE: { bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Shield, label: 'Đổi mật khẩu' },
        PROFILE_UPDATE: { bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: User, label: 'Sửa hồ sơ' },
        LOGIN_FAILED: { bg: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle, label: 'Đăng nhập lỗi' },
    };

    const { bg, text, icon: Icon, label } = config[action] || { bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: Edit2, label: action };

    return (
        <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border', bg, text)}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
    if (status === 'success') {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle className="w-3 h-3" />
                Thành công
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            Thất bại
        </span>
    );
};

export default AuditLogs;
