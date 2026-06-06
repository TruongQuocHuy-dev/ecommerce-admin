import { useState } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon, ChevronUp, ChevronDown, Sparkles, ExternalLink } from 'lucide-react'
import { useBanners, useDeleteBanner, useReorderBanners } from '../api/hooks/useBanners'
import BannerModal from '../components/settings/BannerModal'
import { PERMISSIONS, hasPermission } from '../utils/permissions'
import { CategoryCardSkeleton } from '../components/ui/Skeleton'
import { useTranslation } from '../i18n/index.jsx'
import useAuthStore from '../store/useAuthStore'
import clsx from 'clsx'

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
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-1">
            {/* CommandCenter Header Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_28%)] animate-pulse" />
                <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur">
                            {t('banners.commandCenter')}
                        </span>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl flex items-center gap-2">
                            {t('banners.title')}
                            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
                            {t('banners.subtitle')}
                        </p>
                    </div>
                    {canManageSettings && (
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 px-5 py-3 text-xs font-bold text-slate-955 shadow-md active:scale-95 transition-all self-start md:self-center shrink-0"
                        >
                            <Plus className="w-4 h-4 shrink-0 text-slate-950 font-bold" />
                            {t('banners.addBanner')}
                        </button>
                    )}
                </div>
            </div>

            {/* Banners Workspace Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4 animate-pulse">
                            <div className="aspect-[2/1] bg-slate-100 rounded-xl" />
                            <div className="h-4 bg-slate-100 rounded w-2/3" />
                            <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : banners.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center max-w-xl mx-auto mt-6">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="text-slate-600 font-semibold text-sm">{t('banners.noBanners')}</p>
                    {canManageSettings && (
                        <button
                            onClick={handleCreate}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold transition-colors shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {t('banners.addBanner')}
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id || banner._id}
                            className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col"
                        >
                            {/* Overlay Card Order Controls & Badges */}
                            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-white/10 text-white text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-2 shadow-md z-10">
                                <span>#{index + 1}</span>
                                {canManageSettings && (
                                    <div className="flex items-center gap-1 border-l border-white/20 pl-1.5">
                                        <button
                                            onClick={() => handleMoveUp(index)}
                                            disabled={index === 0}
                                            className="hover:text-amber-400 disabled:opacity-20 transition-colors"
                                            title="Di chuyển lên"
                                        >
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleMoveDown(index)}
                                            disabled={index === banners.length - 1}
                                            className="hover:text-amber-400 disabled:opacity-20 transition-colors"
                                            title="Di chuyển xuống"
                                        >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Status Overlay Badge */}
                            <div className={clsx(
                                "absolute top-3 right-3 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg shadow-md z-10 border",
                                banner.isActive !== false
                                    ? "bg-green-505/80 text-white border-green-400/20 bg-green-500"
                                    : "bg-slate-700/80 text-white/90 border-slate-600/20"
                            )}>
                                {banner.isActive !== false ? t('banners.active') : t('banners.inactive')}
                            </div>

                            {/* Image Preview Window */}
                            <div className="relative aspect-[2/1] overflow-hidden bg-slate-50 border-b border-slate-100 shrink-0">
                                {banner.image ? (
                                    <img
                                        src={getImageUrl(banner.image)}
                                        alt={banner.title || 'Banner'}
                                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                                    </div>
                                )}

                                {/* Hover action overlay */}
                                {canManageSettings && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-20">
                                        <button
                                            onClick={() => handleEdit(banner)}
                                            className="p-2.5 bg-white text-slate-800 hover:text-indigo-600 rounded-xl transition-all shadow-md hover:scale-105"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit className="w-4.5 h-4.5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(t('banners.confirmDelete'))) {
                                                    deleteBanner.mutate(banner.id || banner._id)
                                                }
                                            }}
                                            className="p-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl transition-all shadow-md hover:scale-105"
                                            title="Xóa banner"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Banner details container */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <h4 className="font-bold text-slate-900 line-clamp-1 text-sm">
                                    {banner.title || 'Không có tiêu đề'}
                                </h4>
                                {banner.link ? (
                                    <a
                                        href={banner.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline mt-2.5 truncate max-w-full"
                                    >
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{banner.link}</span>
                                    </a>
                                ) : (
                                    <span className="inline-flex items-center text-xs text-slate-400 font-normal mt-2.5">
                                        Không có liên kết điều hướng
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
