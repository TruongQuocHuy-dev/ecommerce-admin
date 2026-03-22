import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCreateBanner, useUpdateBanner } from '../../api/hooks/useBanners'

const BannerModal = ({ isOpen, onClose, banner, mode = 'create' }) => {
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
                // Determine if absolute or relative path
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        {mode === 'create' ? 'Add New Banner' : 'Edit Banner'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Banner Image *
                        </label>
                        <div className="flex flex-col gap-4">
                            <div className="relative w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden group hover:border-primary-500 transition-colors bg-gray-50">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center text-gray-400 text-sm">
                                        Click to Upload Image
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                            <div className="text-xs text-gray-500">
                                <p>Recommended size: 1200x600px | Supported: JPG, PNG, WEBP | Max: 5MB</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            placeholder="e.g., Summer Sale (Optional)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Link / URL
                        </label>
                        <input
                            type="text"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            placeholder="e.g., https://example.com/sale (Optional)"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Active (Visible on App)
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || (!imageFile && mode === 'create')}
                            className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isPending && (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            )}
                            {mode === 'create' ? 'Create Banner' : 'Update Banner'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default BannerModal
