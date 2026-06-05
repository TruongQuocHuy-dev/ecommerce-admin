import { useState } from 'react'
import { Search, MoreVertical, Edit, Trash2, Shield, Plus, ShoppingBag, Sparkles } from 'lucide-react'
import { useUsers, useUpdateUser, useDeleteUser } from '../api/hooks/useUsers'
import UserModal from '../components/users/UserModal'
import useAuthStore from '../store/useAuthStore'
import { PERMISSIONS, hasPermission } from '../utils/permissions'
import { UserRowSkeleton } from '../components/ui/Skeleton'
import { useTranslation } from '../i18n/index.jsx'
import toast from 'react-hot-toast'

const Users = () => {
    const { user: currentUser } = useAuthStore()
    const { t } = useTranslation()
    const [search, setSearch] = useState('')
    const [selectedRole, setSelectedRole] = useState('')
    const [page, setPage] = useState(1)
    const [selectedUser, setSelectedUser] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Permissions
    const canManageUsers = hasPermission(currentUser?.role, PERMISSIONS.MANAGE_USERS)

    // Data Hooks
    const { data, isLoading } = useUsers(page, 10, search, selectedRole)
    const updateUser = useUpdateUser()
    const deleteUser = useDeleteUser()

    const users = data?.users || []
    const pagination = data?.pagination || {}

    // Handlers
    const handleRoleChange = (role) => {
        setSelectedRole(role)
        setPage(1)
    }

    const handleSearchChange = (value) => {
        setSearch(value)
        setPage(1)
    }

    const handleEdit = (user) => {
        setSelectedUser(user)
        setIsModalOpen(true)
    }

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this user?')) {
            deleteUser.mutate(id)
        }
    }

    const handleSave = async (formData) => {
        if (selectedUser) {
            updateUser.mutate(
                { id: selectedUser._id, data: formData },
                {
                    onSuccess: () => setIsModalOpen(false)
                }
            )
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* CommandCenter Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl animate-fade-in">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_28%)] animate-pulse" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200 backdrop-blur">
                            {t('users.commandCenter')}
                        </span>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl flex items-center gap-2">
                            {t('users.title')}
                            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
                            {t('users.subtitle')}
                        </p>
                    </div>
                    {canManageUsers && (
                        <button
                            onClick={() => { setSelectedUser(null); setIsModalOpen(true) }}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-purple-500/20 transition-transform hover:-translate-y-0.5 hover:bg-purple-50"
                        >
                            <Plus className="w-4 h-4" />
                            {t('users.addUser')}
                        </button>
                    )}
                </div>
            </div>

            {/* Table and Filter Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Tabs & Search Header */}
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 p-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: '', name: t('users.allRoles'), icon: null },
                            { id: 'admin', name: t('users.roles.admin'), icon: Shield },
                            { id: 'seller', name: t('users.roles.seller'), icon: ShoppingBag },
                            { id: 'user', name: t('users.roles.user'), icon: null }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = selectedRole === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleRoleChange(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all border outline-none ${
                                        isActive
                                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                            : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
                                    }`}
                                >
                                    {Icon && <Icon className="w-4 h-4" />}
                                    {tab.name}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative w-full lg:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder={t('users.searchPlaceholder')}
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 placeholder-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <>
                                    <UserRowSkeleton />
                                    <UserRowSkeleton />
                                    <UserRowSkeleton />
                                    <UserRowSkeleton />
                                    <UserRowSkeleton />
                                </>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center text-primary-700 font-bold ring-2 ring-primary-200/50">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{user.name}</p>
                                                    <p className="text-sm text-slate-600">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'admin' || user.role === 'super_admin'
                                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                : user.role === 'seller'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                {user.role === 'super_admin' && <Shield className="w-3 h-3 mr-1" />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                                                    }`}></span>
                                                {user.status || 'active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {canManageUsers && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => window.location.href = `/orders?userId=${user._id}`}
                                                            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                                            title="View Orders"
                                                        >
                                                            <ShoppingBag className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user._id)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">
                        Showing page {page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= pagination.totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <UserModal
                isOpen={isModalOpen}
                user={selectedUser}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                isSaving={updateUser.isLoading}
            />
        </div>
    )
}

export default Users
