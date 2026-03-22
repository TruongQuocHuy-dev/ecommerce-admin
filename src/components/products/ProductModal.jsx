import { useState, useEffect } from 'react'
import { X, Upload, Package, Layers, Search, Save, Loader2 } from 'lucide-react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useCategories } from '../../api/hooks/useCategories'
import { useCreateProduct, useUpdateProduct } from '../../api/hooks/useProducts'
import ProductVariants from './ProductVariants'
import ProductSEO from './ProductSEO'
import clsx from 'clsx'
import { useTranslation } from '../../i18n/index.jsx'

const ProductModal = ({ isOpen, onClose, product, mode = 'create' }) => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState('general')
    const [imageFiles, setImageFiles] = useState([])

    // Initialize state from product if editing
    const [formData, setFormData] = useState(() => {
        if (product && mode === 'edit') {
            return {
                name: product.name || '',
                description: product.description || '',
                price: product.price || '',
                stock: product.stock || '',
                category: typeof product.category === 'object' ? (product.category?._id || product.category?.id) : product.category || '',
                metaTitle: product.metaTitle || '',
                metaDescription: product.metaDescription || '',
                metaKeywords: product.metaKeywords || '',
                isFeatured: product.isFeatured || false
            }
        }
        return {
            name: '',
            description: '',
            price: '',
            stock: '',
            category: '',
            metaTitle: '',
            metaDescription: '',
            metaKeywords: '',
            isFeatured: false
        }
    })

    const [imagePreviews, setImagePreviews] = useState(() => (product && mode === 'edit' ? product.images || [] : []))
    const [tierVariations, setTierVariations] = useState(() => (product && mode === 'edit' ? product.tierVariations || [] : []))
    const [skus, setSkus] = useState(() => (product && mode === 'edit' ? product.skus || [] : []))

    // Hooks
    const { data: categories = [] } = useCategories()
    const createProduct = useCreateProduct()
    const updateProduct = useUpdateProduct()

    // Helper to flatten hierarchical categories for the dropdown
    const flattenCategories = (cats, level = 0) => {
        let flat = []
        cats.forEach(cat => {
            flat.push({ ...cat, level })
            if (cat.children && cat.children.length > 0) {
                flat = flat.concat(flattenCategories(cat.children, level + 1))
            }
        })
        return flat
    }

    const flatCategories = flattenCategories(categories)

    useEffect(() => {
        if (product && mode === 'edit') {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price || '',
                stock: product.stock || '',
                category: typeof product.category === 'object' ? (product.category?._id || product.category?.id) : product.category || '',
                metaTitle: product.metaTitle || '',
                metaDescription: product.metaDescription || '',
                metaKeywords: product.metaKeywords || '',
                isFeatured: product.isFeatured || false
            })

            // Populate Variants
            // Backend might send stringified JSON or object depending on implementation
            // Assuming object from service
            setTierVariations(product.tierVariations || [])
            setSkus(product.skus || [])

            if (product.images && product.images.length > 0) {
                setImagePreviews(product.images)
            }
        } else {
            // Reset form
            setFormData({
                name: '',
                description: '',
                price: '',
                stock: '',
                category: '',
                metaTitle: '',
                metaDescription: '',
                metaKeywords: '',
                isFeatured: false
            })
            setTierVariations([])
            setSkus([])
            setImagePreviews([])
            setImageFiles([])
            setActiveTab('general')
        }
    }, [product, mode, isOpen])

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files)
        if (files.length > 0) {
            setImageFiles(prev => [...prev, ...files])
            const newPreviews = files.map(file => URL.createObjectURL(file))
            setImagePreviews(prev => [...prev, ...newPreviews])
        }
    }

    const handleRemoveImage = (index) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index))
        setImageFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        const data = new FormData()
        // Basic Fields
        data.append('name', formData.name)
        data.append('description', formData.description)
        data.append('price', formData.price)
        data.append('stock', formData.stock)
        data.append('category', formData.category)
        data.append('isFeatured', formData.isFeatured)

        // SEO Fields
        data.append('metaTitle', formData.metaTitle)
        data.append('metaDescription', formData.metaDescription)
        data.append('metaKeywords', formData.metaKeywords)

        // Clean up helper UI fields before sending to API
        const cleanedSkus = skus.map(sku => {
            const { imageFile, preview, ...rest } = sku;
            return rest;
        });

        // Variants (Serialize as JSON string)
        data.append('tierVariations', JSON.stringify(tierVariations))
        data.append('skus', JSON.stringify(cleanedSkus))

        // Append SKU specific images
        skus.forEach((sku, index) => {
            if (sku.imageFile) {
                data.append(`skuImages_${index}`, sku.imageFile);
            }
        });

        imageFiles.forEach(file => {
            data.append('images', file)
        })

        if (mode === 'create') {
            createProduct.mutate(data, {
                onSuccess: () => onClose()
            })
        } else {
            const id = product.id || product._id
            updateProduct.mutate({ id, data }, {
                onSuccess: () => onClose()
            })
        }
    }

    const isPending = createProduct.isPending || updateProduct.isPending

    if (!isOpen) return null

    // Tabs Configuration
    const tabs = [
        { id: 'general', label: 'General Info', icon: Package },
        { id: 'variants', label: 'Variants', icon: Layers },
        { id: 'seo', label: 'SEO', icon: Search },
    ]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        {mode === 'create' ? 'Add New Product' : 'Edit Product'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Tabs & Content Container */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-2 hidden md:block overflow-y-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                    activeTab === tab.id
                                        ? "bg-white text-primary-600 shadow-sm border border-slate-200 ring-1 ring-primary-100"
                                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                                )}
                            >
                                <tab.icon className={clsx("w-4 h-4", activeTab === tab.id ? "text-primary-500" : "text-slate-400")} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                        {/* Mobile Tabs */}
                        <div className="flex md:hidden border-b border-gray-200 mb-6 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={clsx(
                                        "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                                        activeTab === tab.id
                                            ? "border-primary-500 text-primary-600"
                                            : "border-transparent text-slate-500"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form id="product-form" onSubmit={handleSubmit} className="space-y-6">

                            {/* General Tab */}
                            <div className={clsx(activeTab === 'general' ? 'block' : 'hidden', "space-y-6")}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Product Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                            placeholder="Enter product name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Price ($) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Stock *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                            placeholder="0"
                                            disabled={skus.length > 0} // Disable if variants exist
                                        />
                                        {skus.length > 0 && (
                                            <p className="text-xs text-orange-500 mt-1">Managed automatically by variants</p>
                                        )}
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category *
                                        </label>
                                        <select
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                        >
                                            <option value="">Select a Category</option>
                                            {flatCategories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {'\u00A0'.repeat(cat.level * 2)}{cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2 flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isFeatured"
                                            checked={formData.isFeatured}
                                            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                        />
                                        <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700 cursor-pointer">
                                            Feature this product (shows on homepage)
                                        </label>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description *
                                        </label>
                                        <ReactQuill
                                            theme="snow"
                                            value={formData.description}
                                            onChange={(value) => setFormData({ ...formData, description: value })}
                                            className="rounded-lg overflow-hidden border-gray-300"
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, false] }],
                                                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                    ['link', 'clean']
                                                ],
                                            }}
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Product Images
                                        </label>
                                        <div className="mb-4 flex flex-wrap gap-4">
                                            {imagePreviews.map((src, index) => (
                                                <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                                                    <img src={src} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(index)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden hover:border-primary-500 transition-colors cursor-pointer group">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                />
                                                <div className="text-center text-gray-400 group-hover:text-primary-500 transition-colors">
                                                    <Upload className="w-6 h-6 mx-auto mb-1" />
                                                    <span className="text-xs">Upload</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Upload up to 5 images. Supported formats: JPG, PNG, WEBP.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Variants Tab */}
                            <div className={clsx(activeTab === 'variants' ? 'block' : 'hidden')}>
                                <ProductVariants
                                    formData={formData}
                                    setFormData={setFormData}
                                    tierVariations={tierVariations}
                                    setTierVariations={setTierVariations}
                                    skus={skus}
                                    setSkus={setSkus}
                                />
                            </div>

                            {/* SEO Tab */}
                            <div className={clsx(activeTab === 'seo' ? 'block' : 'hidden')}>
                                <ProductSEO
                                    formData={formData}
                                    setFormData={setFormData}
                                />
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="flex items-center gap-2 px-6 py-2.5 text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {mode === 'create' ? 'Create Product' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Styles for ReactQuill override */}
            <style>{`
                .ql-container {
                    border-bottom-left-radius: 0.5rem;
                    border-bottom-right-radius: 0.5rem;
                    min-height: 150px;
                }
                .ql-toolbar {
                    border-top-left-radius: 0.5rem;
                    border-top-right-radius: 0.5rem;
                }
            `}</style>
        </div>
    )
}

export default ProductModal
