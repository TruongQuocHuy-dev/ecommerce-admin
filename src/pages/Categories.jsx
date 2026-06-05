import { useEffect, useMemo, useState } from 'react'
import { 
    Plus, 
    Edit, 
    Trash2, 
    FolderTree, 
    ChevronDown, 
    ChevronRight, 
    Search, 
    Layers3,
    ChevronLeft,
    X,
    Loader2
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCategories, useDeleteCategory } from '../api/hooks/useCategories'
import CategoryModal from '../components/categories/CategoryModal'
import { PERMISSIONS, hasPermission } from '../utils/permissions'
import { CategoryCardSkeleton } from '../components/ui/Skeleton'
import { useTranslation } from '../i18n/index.jsx'
import useAuthStore from '../store/useAuthStore'

const getCategoryId = (category) => category?._id || category?.id

const buildTreeFromFlat = (items) => {
    const map = new Map()
    const roots = []

    items.forEach((item) => {
        const id = getCategoryId(item)
        if (!id) return
        map.set(id, { ...item, _nodeId: id, children: [] })
    })

    map.forEach((node) => {
        const parentId = node.parent?._id || node.parent?.id || node.parent
        if (parentId && map.has(parentId)) {
            map.get(parentId).children.push(node)
        } else {
            roots.push(node)
        }
    })

    return roots
}

const hasNestedChildren = (items) => {
    return items.some((item) => Array.isArray(item.children) && item.children.length > 0)
}

const collectStats = (nodes, depth = 0) => {
    let total = 0
    let maxDepth = depth

    nodes.forEach((node) => {
        total += 1
        const nextDepth = depth + 1
        if (nextDepth > maxDepth) maxDepth = nextDepth
        if (node.children?.length) {
            const childStats = collectStats(node.children, nextDepth)
            total += childStats.total
            if (childStats.maxDepth > maxDepth) maxDepth = childStats.maxDepth
        }
    })

    return { total, maxDepth }
}

const filterTree = (nodes, keyword) => {
    if (!keyword) return nodes

    return nodes
        .map((node) => {
            const children = filterTree(node.children || [], keyword)
            const value = `${node.name || ''} ${node.slug || ''} ${node.description || ''}`.toLowerCase()
            const isMatch = value.includes(keyword)
            if (isMatch || children.length > 0) return { ...node, children }
            return null
        })
        .filter(Boolean)
}

const flattenTree = (nodes, expandedIds, level = 0, rows = []) => {
    nodes.forEach((node) => {
        const nodeId = node._nodeId || getCategoryId(node)
        const children = Array.isArray(node.children) ? node.children : []
        rows.push({ node, nodeId, level, hasChildren: children.length > 0, childrenCount: children.length })

        if (children.length > 0 && expandedIds.has(nodeId)) {
            flattenTree(children, expandedIds, level + 1, rows)
        }
    })
    return rows
}

const collectAllIds = (nodes, ids = new Set()) => {
    nodes.forEach((node) => {
        const nodeId = node._nodeId || getCategoryId(node)
        if (nodeId) ids.add(nodeId)
        if (node.children?.length) collectAllIds(node.children, ids)
    })
    return ids
}

const parsePositiveInteger = (value, fallback) => {
    const num = Number.parseInt(value || '', 10)
    if (Number.isNaN(num) || num < 1) return fallback
    return num
}

const getPaginationItems = (current, total) => {
    if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1)

    if (current <= 4) {
        return [1, 2, 3, 4, 5, 'ellipsis-right', total]
    }

    if (current >= total - 3) {
        return [1, 'ellipsis-left', total - 4, total - 3, total - 2, total - 1, total]
    }

    return [1, 'ellipsis-left', current - 1, current, current + 1, 'ellipsis-right', total]
}

// Helper for stable gradients
const getAvatarGradient = (name) => {
    const colors = [
        'from-pink-500 to-rose-500',
        'from-purple-500 to-indigo-500',
        'from-blue-500 to-cyan-500',
        'from-teal-500 to-emerald-500',
        'from-emerald-500 to-green-500',
        'from-amber-500 to-orange-500',
        'from-orange-500 to-red-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
}

const Categories = () => {
    const { user: currentUser } = useAuthStore()
    const { t } = useTranslation()
    const [searchParams, setSearchParams] = useSearchParams()

    const initialPage = parsePositiveInteger(searchParams.get('page'), 1)
    const initialPageSize = parsePositiveInteger(searchParams.get('pageSize'), 8)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [modalMode, setModalMode] = useState('create')
    const [keyword, setKeyword] = useState('')
    const [expandedIds, setExpandedIds] = useState(new Set())
    const [currentPage, setCurrentPage] = useState(initialPage)
    const [pageSize, setPageSize] = useState(initialPageSize)

    // Permissions
    const canManageCategories = hasPermission(currentUser?.role, PERMISSIONS.MANAGE_CATEGORIES)

    // Hooks
    const { data: categories = [], isLoading } = useCategories()
    const deleteCategory = useDeleteCategory()

    const categoryTree = useMemo(() => {
        if (!Array.isArray(categories) || categories.length === 0) return []

        if (hasNestedChildren(categories)) {
            return categories.map((item) => ({ ...item, _nodeId: getCategoryId(item) }))
        }

        return buildTreeFromFlat(categories)
    }, [categories])

    const normalizedKeyword = keyword.trim().toLowerCase()
    const filteredTree = useMemo(
        () => filterTree(categoryTree, normalizedKeyword),
        [categoryTree, normalizedKeyword]
    )

    const totalRoots = filteredTree.length
    const totalPages = Math.max(1, Math.ceil(totalRoots / pageSize))
    const startRootIndex = (currentPage - 1) * pageSize
    const endRootIndex = startRootIndex + pageSize

    const paginatedRoots = useMemo(
        () => filteredTree.slice(startRootIndex, endRootIndex),
        [filteredTree, startRootIndex, endRootIndex]
    )

    const treeRows = useMemo(() => {
        const expanded = normalizedKeyword ? collectAllIds(paginatedRoots) : expandedIds
        return flattenTree(paginatedRoots, expanded)
    }, [paginatedRoots, expandedIds, normalizedKeyword])

    const stats = useMemo(() => collectStats(categoryTree), [categoryTree])

    useEffect(() => {
        let metaDescription = document.querySelector('meta[name="description"]')
        if (!metaDescription) {
            metaDescription = document.createElement('meta')
            metaDescription.name = 'description'
            document.head.appendChild(metaDescription)
        }

        metaDescription.setAttribute(
            'content',
            'Quản lý danh mục sản phẩm theo cây cha-con, có tìm kiếm và phân trang trong trang quản trị.'
        )
    }, [])

    useEffect(() => {
        const urlPage = parsePositiveInteger(searchParams.get('page'), 1)
        const urlPageSize = parsePositiveInteger(searchParams.get('pageSize'), 8)

        if (urlPage !== currentPage) setCurrentPage(urlPage)
        if (urlPageSize !== pageSize) setPageSize(urlPageSize)
    }, [searchParams])

    useEffect(() => {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.set('page', String(currentPage))
        nextParams.set('pageSize', String(pageSize))

        if (nextParams.toString() !== searchParams.toString()) {
            setSearchParams(nextParams, { replace: true })
        }
    }, [currentPage, pageSize, searchParams, setSearchParams])

    useEffect(() => {
        setCurrentPage(1)
    }, [keyword])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

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

    const toggleExpand = (id) => {
        setExpandedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const handleDelete = (category) => {
        const childrenCount = Array.isArray(category.children) ? category.children.length : 0
        const message = childrenCount > 0
            ? t('categories.deleteConfirmWithSub', { count: childrenCount })
            : t('categories.deleteConfirm')

        if (confirm(message)) {
            deleteCategory.mutate(getCategoryId(category), {
                onSuccess: () => {
                    toast.success('Xóa danh mục thành công!')
                },
                onError: (err) => {
                    toast.error(err.response?.data?.message || 'Lỗi khi xóa danh mục')
                }
            })
        }
    }

    const paginationItems = useMemo(
        () => getPaginationItems(currentPage, totalPages),
        [currentPage, totalPages]
    )

    return (
        <main className="space-y-6 animate-fade-in">
            {/* Header section with Stats */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_35%)]" />
                <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200 backdrop-blur">
                            Product Structure
                        </p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{t('categories.title')}</h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300">Quản lý danh mục sản phẩm theo cây cha-con, có tìm kiếm và phân trang trong trang quản trị.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur min-w-[110px] transition-all hover:bg-white/10 text-center sm:text-left">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('categories.totalCategories')}</p>
                            <p className="mt-1 text-2xl font-bold text-white">{stats.total || 0}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur min-w-[110px] transition-all hover:bg-white/10 text-center sm:text-left">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('categories.rootCategories')}</p>
                            <p className="mt-1 text-2xl font-bold text-white">{categoryTree.length || 0}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur min-w-[110px] transition-all hover:bg-white/10 text-center sm:text-left">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('categories.treeDepth')}</p>
                            <p className="mt-1 text-2xl font-bold text-white">{stats.maxDepth || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Left: Search input + rows per page */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                id="category-search"
                                type="text"
                                placeholder={t('categories.searchPlaceholder')}
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 outline-none transition focus:border-slate-400 focus:bg-white text-sm"
                            />
                            {keyword && (
                                <button
                                    onClick={() => setKeyword('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Page size select dropdown */}
                        <div className="flex items-center gap-2 border border-slate-200 rounded-2xl bg-slate-50 px-3.5 py-2">
                            <label htmlFor="page-size" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                                {t('categories.rowsPerPage')}
                            </label>
                            <select
                                id="page-size"
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                            >
                                <option value={5}>5</option>
                                <option value={8}>8</option>
                                <option value={12}>12</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>

                    {/* Right: Plus Button */}
                    {canManageCategories && (
                        <button
                            onClick={handleCreate}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-2xl transition-all shadow-md active:scale-95 self-stretch sm:self-auto"
                        >
                            <Plus className="w-4 h-4" />
                            {t('categories.addCategory')}
                        </button>
                    )}
                </div>
            </div>

            {/* Tree list Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CategoryCardSkeleton />
                        <CategoryCardSkeleton />
                        <CategoryCardSkeleton />
                        <CategoryCardSkeleton />
                    </div>
                ) : treeRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <FolderTree className="w-6 h-6" />
                        </div>
                        <h4 className="font-semibold text-slate-900">Không tìm thấy danh mục nào</h4>
                        <p className="text-sm text-slate-400 max-w-xs text-center">
                            {categories.length === 0 ? t('categories.noCategories') : 'Thử tìm kiếm với tên hoặc từ khóa khác.'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {/* Table Header */}
                        <div className="grid grid-cols-[1.8fr_1fr_auto] gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <span>{t('categories.tableHeaders.name')}</span>
                            <span>{t('categories.tableHeaders.details')}</span>
                            <span className="text-right px-2">{t('categories.tableHeaders.actions')}</span>
                        </div>

                        {/* Table Rows */}
                        <div className="divide-y divide-slate-100">
                            {treeRows.map(({ node: category, nodeId, level, hasChildren, childrenCount }) => {
                                const isExpanded = expandedIds.has(nodeId)

                                return (
                                    <div
                                        key={nodeId}
                                        className="grid grid-cols-[1.8fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-slate-50/50 transition-colors group"
                                    >
                                        {/* Column 1: Name, Slug, Indentation & Expand/Collapse */}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3" style={{ paddingLeft: `${level * 20}px` }}>
                                                {hasChildren ? (
                                                    <button
                                                        onClick={() => toggleExpand(nodeId)}
                                                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                                                        aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className="w-4 h-4 text-slate-700" />
                                                        ) : (
                                                            <ChevronRight className="w-4 h-4 text-slate-700" />
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className="w-6 shrink-0" />
                                                )}

                                                {/* Visual avatar folder wrapper */}
                                                <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(category.name)} flex items-center justify-center text-white font-bold shadow-sm shrink-0`}>
                                                    <FolderTree className="w-4 h-4" />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate">{category.name}</p>
                                                    <p className="text-xs text-slate-400 truncate">/{category.slug}</p>
                                                </div>

                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                                    {t('categories.level', { level: level + 1 })}
                                                </span>
                                            </div>

                                            {category.description && (
                                                <p 
                                                    className="mt-2 text-xs text-slate-500 line-clamp-1" 
                                                    style={{ paddingLeft: `${level * 20 + (hasChildren ? 68 : 60)}px` }}
                                                >
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Column 2: Parent information & children counts */}
                                        <div className="text-xs">
                                            <p className="text-slate-700 font-semibold truncate">
                                                {category.parent?.name ? (
                                                    <span>Cha: <span className="text-slate-900">{category.parent.name}</span></span>
                                                ) : (
                                                    <span className="text-slate-500 italic">{t('categories.rootCategory')}</span>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {hasChildren ? (
                                                    t('categories.directSubcategories', { count: childrenCount })
                                                ) : (
                                                    t('categories.noSubcategories')
                                                )}
                                            </p>
                                        </div>

                                        {/* Column 3: Actions */}
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-colors"
                                                disabled={!canManageCategories}
                                                title={canManageCategories ? t('categories.editTooltip') : t('categories.noPermission')}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category)}
                                                className="p-2 hover:bg-rose-50 rounded-xl text-rose-600 hover:text-rose-700 transition-colors"
                                                disabled={!canManageCategories || deleteCategory.isPending}
                                                title={canManageCategories ? t('categories.deleteTooltip') : t('categories.noPermission')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Pagination Controls */}
                        {!isLoading && totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-150 bg-slate-50/40 px-6 py-4 gap-4 rounded-b-3xl">
                                <p className="text-xs text-slate-500">
                                    {t('categories.showingRootCategories', {
                                        start: totalRoots === 0 ? 0 : startRootIndex + 1,
                                        end: Math.min(endRootIndex, totalRoots),
                                        total: totalRoots
                                    })}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    {/* Go to First Page */}
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors bg-white text-xs font-semibold"
                                    >
                                        {t('categories.pagination.first')}
                                    </button>
                                    
                                    {/* Go to Previous Page */}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors bg-white"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    
                                    {paginationItems.map((item, index) => {
                                        if (typeof item !== 'number') {
                                            return <span key={`${item}-${index}`} className="px-1 text-slate-500 text-xs">...</span>
                                        }

                                        const pageNumber = item
                                        const isActive = currentPage === pageNumber

                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => setCurrentPage(pageNumber)}
                                                className={`w-9 h-9 text-xs font-semibold rounded-xl border transition-all ${
                                                    isActive
                                                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        )
                                    })}

                                    {/* Go to Next Page */}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors bg-white"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>

                                    {/* Go to Last Page */}
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors bg-white text-xs font-semibold"
                                    >
                                        {t('categories.pagination.last')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                category={selectedCategory}
                mode={modalMode}
            />
        </main>
    )
}

export default Categories
