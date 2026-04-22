import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { useCategories, useCreateCategory, useUpdateCategory } from '../../api/hooks/useCategories'

const getCategoryId = (category) => category?._id || category?.id

const flattenCategories = (cats, level = 0, rows = [], visited = new Set()) => {
    cats.forEach((cat) => {
        const id = getCategoryId(cat)
        if (!id) return
        if (visited.has(id)) return
        visited.add(id)

        rows.push({ id, name: cat.name, level })
        if (Array.isArray(cat.children) && cat.children.length > 0) {
            flattenCategories(cat.children, level + 1, rows, visited)
        }
    })
    return rows
}

const collectAllCategories = (cats, rows = [], level = 0, visited = new Set()) => {
    cats.forEach((cat) => {
        const id = getCategoryId(cat)
        if (!id || visited.has(id)) return
        visited.add(id)

        const parentId = cat.parent?._id || cat.parent?.id || cat.parent || null
        rows.push({ id, name: cat.name, parentId, level })

        if (cat.children?.length) {
            collectAllCategories(cat.children, rows, level + 1, visited)
        }
    })

    return rows
}

const collectDescendantIds = (allCategories, parentId) => {
    const descendants = new Set()
    const childrenByParent = new Map()

    allCategories.forEach((item) => {
        if (!item.parentId) return
        if (!childrenByParent.has(item.parentId)) {
            childrenByParent.set(item.parentId, [])
        }
        childrenByParent.get(item.parentId).push(item.id)
    })

    const stack = [...(childrenByParent.get(parentId) || [])]
    while (stack.length > 0) {
        const childId = stack.pop()
        if (descendants.has(childId)) continue
        descendants.add(childId)
        const nextChildren = childrenByParent.get(childId) || []
        stack.push(...nextChildren)
    }

    return descendants
}

const CategoryModal = ({ isOpen, onClose, category, mode = 'create' }) => {
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent: '',
    })

    // Hooks
    const { data: categories = [] } = useCategories()
    const createCategory = useCreateCategory()
    const updateCategory = useUpdateCategory()

    useEffect(() => {
        if (category && mode === 'edit') {
            setFormData({
                name: category.name || '',
                description: category.description || '',
                parent: category.parent?.id || category.parent?._id || category.parent || '',
            })
            if (category.image) {
                setImagePreview(category.image)
            }
        } else {
            setFormData({
                name: '',
                description: '',
                parent: '',
            })
            setImageFile(null)
            setImagePreview(null)
        }
    }, [category, mode, isOpen])

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
        data.append('name', formData.name.trim())
        data.append('description', formData.description.trim())

        if (formData.parent && formData.parent.trim()) {
            data.append('parent', formData.parent.trim())
        }

        if (imageFile) {
            data.append('file', imageFile)
        }

        if (mode === 'create') {
            createCategory.mutate(data, {
                onSuccess: () => onClose()
            })
        } else {
            const id = category.id || category._id
            updateCategory.mutate({ id, data }, {
                onSuccess: () => onClose()
            })
        }
    }

    const isPending = createCategory.isPending || updateCategory.isPending

    const currentCategoryId = getCategoryId(category)
    const flatCategories = useMemo(() => {
        const allCategories = collectAllCategories(categories)
        const baseList = flattenCategories(categories)
        if (!currentCategoryId) return baseList

        const descendantIds = collectDescendantIds(allCategories, currentCategoryId)
        return baseList.filter((item) => item.id !== currentCategoryId && !descendantIds.has(item.id))
    }, [categories, currentCategoryId])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        {mode === 'create' ? 'Add New Category' : 'Edit Category'}
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
                            Category Image
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden group hover:border-primary-500 transition-colors">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center text-gray-400 text-xs">
                                        Upload Image
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
                                <p>Supported formats: JPG, PNG, WEBP</p>
                                <p>Max size: 5MB</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                            placeholder="Enter category name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none"
                            placeholder="Category description..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Parent Category
                        </label>
                        <select
                            value={formData.parent}
                            onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                        >
                            <option value="">No parent (Root category)</option>
                            {flatCategories.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {'- '.repeat(item.level)}{item.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Edit mode hides current category and descendants to avoid parent-child loops.
                        </p>
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
                            disabled={isPending}
                            className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isPending && (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            )}
                            {mode === 'create' ? 'Create Category' : 'Update Category'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CategoryModal
