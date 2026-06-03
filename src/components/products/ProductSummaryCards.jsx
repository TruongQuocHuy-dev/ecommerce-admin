import { BadgeCheck, AlertTriangle, Package, RefreshCw } from 'lucide-react'
import { useTranslation } from '../../i18n/index.jsx'

const cards = [
    {
        key: 'currentPage',
        summaryKey: 'total',
        icon: Package,
        color: 'text-slate-700',
        bg: 'bg-slate-100',
    },
    {
        key: 'approved',
        summaryKey: 'approved',
        icon: BadgeCheck,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
    },
    {
        key: 'pending',
        summaryKey: 'pending',
        icon: AlertTriangle,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
    },
    {
        key: 'inactive',
        summaryKey: 'inactive',
        icon: RefreshCw,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
    },
]

const ProductSummaryCards = ({ summary }) => {
    const { t } = useTranslation()
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon
                return (
                    <div key={card.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {t(`products.summary.${card.key}`)}
                                </p>
                                <p className={`mt-1 text-3xl font-bold ${card.color}`}>
                                    {summary?.[card.summaryKey] || 0}
                                </p>
                            </div>
                            <div className={`rounded-2xl p-3 ${card.bg} ${card.color}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                            {t(`products.summary.${card.key}Desc`)}
                        </p>
                    </div>
                )
            })}
        </div>
    )
}

export default ProductSummaryCards
