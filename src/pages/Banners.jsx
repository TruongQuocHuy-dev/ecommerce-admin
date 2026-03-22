import { useState } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon, GripVertical } from 'lucide-react'
import { useBanners, useDeleteBanner, useReorderBanners } from '../api/hooks/useBanners'
import BannerModal from '../components/settings/BannerModal'
import { PERMISSIONS, hasPermission } from '../utils/permissions'
import { CategoryCardSkeleton } from '../components/ui/Skeleton'
import { useTranslation } from '../i18n/index.jsx'
import useAuthStore from '../store/useAuthStore'

const Banners = () => {
    const { user: currentUser } = useAuthStore()
    const { t } = useTranslation()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedBanner, setSelectedBanner] = useState(null)
    const [modalMode, setModalMode] = useState('create')

    // Permissions
    const canManageSettings = hasPermission(currentUser?.role, PERMISSIONS.MANAGE_SETTINGS)

    // Hooks
    const { data: banners = [], isLoading } = useBanners()
    const deleteBanner = useDeleteBanner()
    const reorderBanners = useReorderBanners()

    const handleCreate = () => {
        setModalMode('create')
        setSelectedBanner(null)
        setIsModalOpen(true)
    }

    const handleEdit = (banner) => {
        setModalMode('edit')
        setSelectedBanner(banner)
        setIsModalOpen(true)
    }

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}/${imagePath.replace(/\\/g, '/')}`;
    }

    // Simple Up/Down Arrow reordering for demonstration
    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newBanners = [...banners];
        const temp = newBanners[index - 1];
        newBanners[index - 1] = newBanners[index];
        newBanners[index] = temp;

        reorderBanners.mutate(newBanners.map(b => b.id || b._id));
    }

    const handleMoveDown = (index) => {
        if (index === banners.length - 1) return;
        const newBanners = [...banners];
        const temp = newBanners[index + 1];
        newBanners[index + 1] = newBanners[index];
        newBanners[index] = temp;

        reorderBanners.mutate(newBanners.map(b => b.id || b._id));
    }


    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Banner Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage image banners displayed in the mobile app</p>
                </div>
                {canManageSettings && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Banner
                    </button>
                )}
            </div>

            {/* Banners List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                                <th className="px-6 py-4 font-medium">Order</th>
                                <th className="px-6 py-4 font-medium">Image</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8">
                                        <div className="flex justify-center flex-col items-center gap-4">
                                            <CategoryCardSkeleton />
                                            <CategoryCardSkeleton />
                                        </div>
                                    </td>
                                </tr>
                            ) : banners.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <ImageIcon className="w-12 h-12 text-slate-300 mb-3" />
                                            <p>No banners found. Create one to display in the app.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                banners.map((banner, index) => (
                                    <tr key={banner.id || banner._id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            {canManageSettings && (
                                                <div className="flex flex-col items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleMoveUp(index)}
                                                        disabled={index === 0}
                                                        className={`p-1 rounded ${index === 0 ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                                                    >
                                                        ▲
                                                    </button>
                                                    <span className="text-xs font-medium text-slate-500">{index + 1}</span>
                                                    <button
                                                        onClick={() => handleMoveDown(index)}
                                                        disabled={index === banners.length - 1}
                                                        className={`p-1 rounded ${index === banners.length - 1 ? 'text-slate-300' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                                                    >
                                                        ▼
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-32 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                                                {banner.image ? (
                                                    <img
                                                        src={getImageUrl(banner.image)}
                                                        alt={banner.title || 'Banner'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{banner.title || 'Untitled Banner'}</div>
                                            {banner.link && (
                                                <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline line-clamp-1 max-w-[200px] mt-1">
                                                    {banner.link}
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${banner.isActive !== false
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {banner.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {canManageSettings && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(banner)}
                                                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this banner?')) {
                                                                deleteBanner.mutate(banner.id || banner._id)
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-red-100 rounded-lg text-red-500 hover:text-red-700 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <BannerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                banner={selectedBanner}
                mode={modalMode}
            />
        </div>
    )
}

export default Banners
