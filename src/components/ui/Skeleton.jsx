import clsx from 'clsx'

const Skeleton = ({ className, variant = 'default', animation = 'shimmer' }) => {
    const variants = {
        default: 'rounded',
        circle: 'rounded-full',
        text: 'rounded h-4',
        title: 'rounded h-6',
        button: 'rounded-lg h-10',
        card: 'rounded-xl',
        avatar: 'rounded-full w-10 h-10',
    }

    const animations = {
        shimmer: 'animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:400%_100%]',
        pulse: 'animate-pulse bg-slate-200',
        none: 'bg-slate-200',
    }

    return (
        <div
            className={clsx(
                variants[variant],
                animations[animation],
                className
            )}
        />
    )
}

// Card Skeleton for Dashboard stats
export const CardSkeleton = () => (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circle" className="w-12 h-12" />
            <Skeleton className="w-20 h-6 rounded-full" />
        </div>
        <Skeleton variant="text" className="w-24 mb-2" />
        <Skeleton variant="title" className="w-32" />
    </div>
)

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 5 }) => (
    <tr className="animate-pulse">
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="px-6 py-4">
                <Skeleton className="h-4 w-full" />
            </td>
        ))}
    </tr>
)

// User Row Skeleton (with avatar)
export const UserRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4">
            <div className="flex items-center gap-3">
                <Skeleton variant="avatar" />
                <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                </div>
            </div>
        </td>
        <td className="px-6 py-4">
            <Skeleton className="h-6 w-20 rounded-full" />
        </td>
        <td className="px-6 py-4">
            <Skeleton className="h-6 w-16 rounded-full" />
        </td>
        <td className="px-6 py-4">
            <Skeleton className="h-4 w-24" />
        </td>
        <td className="px-6 py-4">
            <div className="flex gap-2 justify-end">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
        </td>
    </tr>
)

// Product Card Skeleton
export const ProductCardSkeleton = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
        <Skeleton className="w-full h-48 rounded-lg mb-4" />
        <Skeleton variant="title" className="w-3/4 mb-2" />
        <Skeleton variant="text" className="w-1/2 mb-3" />
        <div className="flex items-center justify-between">
            <Skeleton className="w-20 h-6" />
            <Skeleton className="w-16 h-8 rounded-lg" />
        </div>
    </div>
)

// Category Card Skeleton
export const CategoryCardSkeleton = () => (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <div className="flex gap-1">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
    </div>
)

export default Skeleton
