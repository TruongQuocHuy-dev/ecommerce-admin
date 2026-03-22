import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Shield, Search, Filter, Calendar, User, FileText, AlertCircle,
    CheckCircle, XCircle, Eye, Trash2, Edit2, Plus, Loader2,
} from 'lucide-react';
import api from '../api/client';
import { useTranslation } from '../i18n/index.jsx';
import clsx from 'clsx';

const AuditLogs = () => {
    const { t } = useTranslation();
    const [filters, setFilters] = useState({
        action: '',
        entity: '',
        status: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 50,
    });

    const { data, isLoading } = useQuery({
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

    const logs = data?.logs || [];
    const total = data?.total || 0;
    const pages = data?.pages || 1;

    const updateFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const resetFilters = () => {
        setFilters({
            action: '',
            entity: '',
            status: '',
            startDate: '',
            endDate: '',
            page: 1,
            limit: 50,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-primary-600" />
                    {t('auditLogs.title') || 'Nhật Ký Hoạt Động'}
                </h1>
                <p className="text-slate-500 mt-1">
                    {t('auditLogs.subtitle') || 'Theo dõi tất cả các hành động của quản trị viên và người bán'}
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Bộ lọc
                    </h3>
                    <button
                        onClick={resetFilters}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Đặt lại
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hành động</label>
                        <select
                            value={filters.action}
                            onChange={(e) => updateFilter('action', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                        >
                            <option value="">Tất cả</option>
                            <option value="CREATE">Tạo</option>
                            <option value="UPDATE">Cập nhật</option>
                            <option value="DELETE">Xóa</option>
                            <option value="APPROVE">Duyệt</option>
                            <option value="REJECT">Từ chối</option>
                            <option value="LOGIN">Đăng nhập</option>
                            <option value="LOGOUT">Đăng xuất</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Đối tượng</label>
                        <select
                            value={filters.entity}
                            onChange={(e) => updateFilter('entity', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                        >
                            <option value="">Tất cả</option>
                            <option value="User">Người dùng</option>
                            <option value="Product">Sản phẩm</option>
                            <option value="Order">Đơn hàng</option>
                            <option value="Shop">Cửa hàng</option>
                            <option value="Category">Danh mục</option>
                            <option value="Discount">Mã giảm giá</option>
                            <option value="Setting">Cài đặt</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                        <select
                            value={filters.status}
                            onChange={(e) => updateFilter('status', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                        >
                            <option value="">Tất cả</option>
                            <option value="success">Thành công</option>
                            <option value="failed">Thất bại</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Từ ngày</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => updateFilter('startDate', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Đến ngày</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => updateFilter('endDate', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">
                        Tổng cộng: {total} bản ghi
                    </h3>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-slate-600">Không có dữ liệu</h4>
                        <p className="text-sm text-slate-400 mt-1">Chưa có nhật ký hoạt động nào.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Thời gian
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Người dùng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Hành động
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Đối tượng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        IP
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map((log) => (
                                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {log.userId?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {log.userId?.name || 'Unknown'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{log.userId?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <ActionBadge action={log.action} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {log.entity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={log.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                                            {log.ipAddress || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            Trang {filters.page} / {pages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                                disabled={filters.page === 1}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                                disabled={filters.page >= pages}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Action Badge Component
const ActionBadge = ({ action }) => {
    const config = {
        CREATE: { bg: 'bg-green-100', text: 'text-green-700', icon: Plus, label: 'Tạo' },
        UPDATE: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Edit2, label: 'Sửa' },
        DELETE: { bg: 'bg-red-100', text: 'text-red-700', icon: Trash2, label: 'Xóa' },
        APPROVE: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: 'Duyệt' },
        REJECT: { bg: 'bg-orange-100', text: 'text-orange-700', icon: XCircle, label: 'Từ chối' },
        LOGIN: { bg: 'bg-purple-100', text: 'text-purple-700', icon: User, label: 'Đăng nhập' },
        LOGOUT: { bg: 'bg-gray-100', text: 'text-gray-700', icon: User, label: 'Đăng xuất' },
    };

    const { bg, text, icon: Icon, label } = config[action] || config.UPDATE;

    return (
        <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium', bg, text)}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </span>
    );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
    if (status === 'success') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle className="w-3.5 h-3.5" />
                Thành công
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3.5 h-3.5" />
            Thất bại
        </span>
    );
};

export default AuditLogs;
