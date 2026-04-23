import { useEffect, useMemo, useState } from 'react'
import { Plus, Edit, Trash2, FolderTree, ChevronDown, ChevronRight, Search, Layers3 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
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
            ? `Delete this category and unlink ${childrenCount} subcategories?`
            : 'Delete this category?'

        if (confirm(message)) {
            deleteCategory.mutate(getCategoryId(category))
        }
    }

    const paginationItems = useMemo(
        () => getPaginationItems(currentPage, totalPages),
        [currentPage, totalPages]
    )



    return (
        <main className="space-y-6 animate-fade-in">
            <header className="flex items-center justify-between">
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
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4" aria-label="Category statistics">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Total Categories</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total || 0}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Danh mục gốc</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{categoryTree.length || 0}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-xs uppercase tracking-wider text-slate-500">Tree Depth</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{stats.maxDepth || 0}</p>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-4" aria-label="Category filter and paging controls">
                <label htmlFor="category-search" className="text-sm font-medium text-slate-700">Search category</label>
                <div className="mt-2 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        id="category-search"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Search by name, slug, or description"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                </div>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-slate-600">
                        Hiển thị danh mục gốc {totalRoots === 0 ? 0 : startRootIndex + 1}-{Math.min(endRootIndex, totalRoots)} trên tổng {totalRoots}
                    </p>
                    <div className="flex items-center gap-2">
                        <label htmlFor="page-size" className="text-sm text-slate-600">Rows per page</label>
                        <select
                            id="page-size"
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        >
                            <option value={5}>5</option>
                            <option value={8}>8</option>
                            <option value={12}>12</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden" aria-label="Category tree table">
                {isLoading ? (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CategoryCardSkeleton />
                        <CategoryCardSkeleton />
                        <CategoryCardSkeleton />
                        <CategoryCardSkeleton />
                    </div>
                ) : treeRows.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No categories found</div>
                ) : (
                    <div>
                        <div className="grid grid-cols-[1.8fr_1fr_auto] gap-4 px-4 py-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <span>Name</span>
                            <span>Details</span>
                            <span>Actions</span>
                        </div>

                        {treeRows.map(({ node: category, nodeId, level, hasChildren, childrenCount }) => {
                            const isExpanded = expandedIds.has(nodeId)

                            return (
                                <div
                                    key={nodeId}
                                    className="grid grid-cols-[1.8fr_1fr_auto] gap-4 px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 18}px` }}>
                                            {hasChildren ? (
                                                <button
                                                    onClick={() => toggleExpand(nodeId)}
                                                    className="p-1 rounded hover:bg-slate-200 text-slate-600"
                                                    aria-label={isExpanded ? 'Collapse category' : 'Expand category'}
                                                >
                                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>
                                            ) : (
                                                <span className="w-6" />
                                            )}

                                            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                                                <FolderTree className="w-4 h-4 text-primary-600" />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">{category.name}</p>
                                                <p className="text-xs text-slate-500 truncate">/{category.slug}</p>
                                            </div>

                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] bg-slate-100 text-slate-700 shrink-0">
                                                <Layers3 className="w-3 h-3" />
                                                Level {level + 1}
                                            </span>
                                        </div>

                                        {category.description && (
                                            <p className="mt-2 text-sm text-slate-600 line-clamp-1" style={{ paddingLeft: `${level * 18 + 38}px` }}>
                                                {category.description}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm text-slate-700">
                                            {category.parent?.name ? `Danh mục cha: ${category.parent.name}` : 'Danh mục gốc'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {hasChildren ? `${childrenCount} danh mục con trực tiếp` : 'Không có danh mục con'}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 justify-end">
                                        <button
                                            onClick={() => handleEdit(category)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                                            disabled={!canManageCategories}
                                            title={canManageCategories ? 'Edit category' : 'No permission'}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category)}
                                            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                                            disabled={!canManageCategories || deleteCategory.isPending}
                                            title={canManageCategories ? 'Delete category' : 'No permission'}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {!isLoading && totalPages > 1 && (
                <nav className="flex items-center justify-between" aria-label="Category pagination">
                    <p className="text-sm text-slate-600">Page {currentPage} / {totalPages}</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            First
                        </button>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {paginationItems.map((item, index) => {
                            if (typeof item !== 'number') {
                                return <span key={`${item}-${index}`} className="px-1 text-slate-500">...</span>
                            }

                            const pageNumber = item
                            const isActive = currentPage === pageNumber

                            return (
                                <button
                                    key={pageNumber}
                                    onClick={() => setCurrentPage(pageNumber)}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`px-3 py-2 text-sm rounded-lg border ${isActive
                                        ? 'bg-primary-600 text-white border-primary-600'
                                        : 'border-slate-300 hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    {pageNumber}
                                </button>
                            )
                        })}
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Last
                        </button>
                    </div>
                </nav>
            )}

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
