import { useState } from 'react'
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react'
import { useCategories, useDeleteCategory } from '../api/hooks/useCategories'
import CategoryModal from '../components/categories/CategoryModal'
import { PERMISSIONS, hasPermission } from '../utils/permissions'
import { CategoryCardSkeleton } from '../components/ui/Skeleton'
import { useTranslation } from '../i18n/index.jsx'
import useAuthStore from '../store/useAuthStore'

const Categories = () => {
    const { user: currentUser } = useAuthStore()
    const { t } = useTranslation()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [modalMode, setModalMode] = useState('create')

    // Permissions
    const canManageCategories = hasPermission(currentUser?.role, PERMISSIONS.MANAGE_CATEGORIES)

    // Hooks
    const { data: categories = [], isLoading } = useCategories()
    const deleteCategory = useDeleteCategory()

    const handleCreate = () => {
        setModalMode('create')
        setSelectedCategory(null)
        setIsModalOpen(true)
    }

    const handleEdit = (category) => {
        setModalMode('edit')
        setSelectedCategory(category)
        setIsModalOpen(true)
    }



    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">{t('categories.title')}</h1>
                {canManageCategories && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {t('categories.addCategory')}
                    </button>
                )}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <>
                        <CategoryCardSkeleton />
                        <CategoryCardSkeleton />
                        <CategoryCardSkeleton />
                        <CategoryCardSkeleton />
                        <CategoryCardSkeleton />
                        <CategoryCardSkeleton />
                    </>
                ) : categories.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">No categories found</div>
                ) : (
                    categories.map((category) => (
                        <div
                            key={category._id}
                            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl flex items-center justify-center ring-2 ring-primary-200/30">
                                        <FolderTree className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{category.name}</h3>
                                        <p className="text-sm text-slate-600">{category.slug}</p>
                                    </div>
                                </div>
                                {canManageCategories && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this category?')) {
                                                    deleteCategory.mutate(category._id)
                                                }
                                            }}
                                            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {category.description && (
                                <p className="mt-3 text-sm text-slate-600 line-clamp-2">{category.description}</p>
                            )}
                            {category.parent && (
                                <p className="mt-2 text-xs text-slate-500">
                                    Parent: {category.parent.name}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                category={selectedCategory}
                mode={modalMode}
            />
        </div>
    )
}

export default Categories
