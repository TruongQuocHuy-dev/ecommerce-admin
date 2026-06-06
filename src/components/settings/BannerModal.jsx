import { useState, useEffect } from 'react'
import { X, Upload, Check } from 'lucide-react'
import { useCreateBanner, useUpdateBanner } from '../../api/hooks/useBanners'
import { useTranslation } from '../../i18n/index.jsx'
import clsx from 'clsx'

const BannerModal = ({ isOpen, onClose, banner, mode = 'create' }) => {
    const { t } = useTranslation()
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        isActive: true,
    })

    const createBanner = useCreateBanner()
    const updateBanner = useUpdateBanner()

    useEffect(() => {
        if (banner && mode === 'edit') {
            setFormData({
                title: banner.title || '',
                link: banner.link || '',
                isActive: banner.isActive !== false,
            })
            if (banner.image) {
                const imageUrl = banner.image.startsWith('http')
                    ? banner.image
                    : `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}/${banner.image.replace(/\\/g, '/')}`;
                setImagePreview(imageUrl)
            }
        } else {
            setFormData({
                title: '',
                link: '',
                isActive: true,
            })
            setImageFile(null)
            setImagePreview(null)
        }
    }, [banner, mode, isOpen])

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        const data = new FormData()
        if (formData.title) data.append('title', formData.title.trim())
        if (formData.link) data.append('link', formData.link.trim())
        data.append('isActive', formData.isActive)

        if (imageFile) {
            data.append('image', imageFile)
        }

        if (mode === 'create') {
            createBanner.mutate(data, {
                onSuccess: () => onClose()
            })
        } else {
            const id = banner.id || banner._id
            updateBanner.mutate({ id, data }, {
                onSuccess: () => onClose()
            })
        }
    }

    const isPending = createBanner.isPending || updateBanner.isPending

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in px-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-scale-in">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
                    <h2 className="text-lg font-bold text-slate-900">
                        {mode === 'create' ? t('banners.addBanner') : t('banners.editBanner')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Image Upload Area */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Hình ảnh Banner *
                        </label>
                        <div className="flex flex-col gap-3">
                            <div className="relative w-full aspect-[2/1] border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden group hover:border-indigo-500 transition-all bg-slate-50 cursor-pointer shadow-inner">
                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                                            <Upload className="w-4.5 h-4.5" />
                                            Thay đổi hình ảnh
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-6 space-y-2">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 mx-auto text-slate-400 group-hover:text-indigo-500 group-hover:scale-105 transition-all">
                                            <Upload className="w-5 h-5 stroke-[1.5]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{t('banners.uploadImage')}</p>
                                            <p className="text-[10px] text-slate-400 mt-1 max-w-[240px] leading-relaxed mx-auto">
                                                Click để chọn tệp tin hình ảnh từ thiết bị của bạn
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="text-[11px] text-slate-400 leading-normal">
                                {t('banners.uploadImageHelp')}
                            </div>
                        </div>
                    </div>

                    {/* Banner Title */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            {t('banners.titleLabel')}
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            placeholder={t('banners.titlePlaceholder')}
                        />
                    </div>

                    {/* Banner Link */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            {t('banners.linkLabel')}
                        </label>
                        <input
                            type="text"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                            placeholder={t('banners.linkPlaceholder')}
                        />
                    </div>

                    {/* Banner Status Switch */}
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                            <p className="text-sm font-bold text-slate-800">Trạng thái hiển thị</p>
                            <p className="text-xs text-slate-400 mt-0.5">Hiển thị hoặc ẩn banner này trên ứng dụng di động</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                            className={clsx(
                                "w-12 h-6 rounded-full transition-colors relative outline-none",
                                formData.isActive ? "bg-green-500" : "bg-slate-300"
                            )}
                        >
                            <div className={clsx(
                                "w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all",
                                formData.isActive ? "left-[26px]" : "left-0.5"
                            )} />
                        </button>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4.5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || (!imageFile && mode === 'create')}
                            className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-slate-950/10"
                        >
                            {isPending && (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            )}
                            {mode === 'create' ? t('banners.addBanner') : t('banners.editBanner')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default BannerModal
