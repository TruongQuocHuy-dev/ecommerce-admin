import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import clsx from 'clsx'

const Card = ({ title, value, icon: Icon, trend, trendUp, description, className, color = 'blue' }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-cyan-500',
        green: 'from-emerald-500 to-teal-500',
        purple: 'from-primary-500 to-purple-600',
        orange: 'from-amber-500 to-orange-500',
        red: 'from-red-500 to-pink-500',
        cyan: 'from-cyan-500 to-accent-500',
    }

    const iconBgClasses = {
        blue: 'bg-blue-50',
        green: 'bg-emerald-50',
        purple: 'bg-primary-50',
        orange: 'bg-amber-50',
        red: 'bg-red-50',
        cyan: 'bg-cyan-50',
    }

    const iconTextClasses = {
        blue: 'text-blue-600',
        green: 'text-emerald-600',
        purple: 'text-primary-600',
        orange: 'text-amber-600',
        red: 'text-red-600',
        cyan: 'text-cyan-600',
    }

    return (
        <div
            role="region"
            aria-labelledby={title ? `card-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined}
            tabIndex={0}
            className={clsx(
                "relative group",
                "bg-white border border-slate-200 rounded-2xl p-6",
                "shadow-sm hover:shadow-md",
                "transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2",
                // make cards stretch to equal heights inside grid
                "h-full flex flex-col justify-between",
                className
            )}
        >
            {/* Content */}
            <div className="relative z-10 flex-1">
                <div className="flex items-center justify-between mb-4">
                    <div className={clsx(
                        "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
                        iconBgClasses[color] || iconBgClasses.blue
                    )}>
                        <Icon className={clsx("w-6 h-6", iconTextClasses[color] || iconTextClasses.blue)} />
                    </div>
                    {trend && (
                        <div className={clsx(
                            "flex items-center text-sm font-medium px-3 py-1 rounded-full",
                            trendUp
                                ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                                : "text-red-700 bg-red-50 border border-red-200"
                        )}>
                            {trendUp ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                            {trend}
                        </div>
                    )}
                </div>

                <h3 id={title ? `card-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined} className="text-slate-600 text-sm font-medium mb-1">{title}</h3>
                <div className="flex items-baseline">
                    <p aria-live="polite" className="text-3xl font-bold text-slate-900">{value}</p>
                    {description && <span className="ml-2 text-sm text-slate-500" id={description ? `${title ? `card-${title.replace(/\s+/g, '-').toLowerCase()}-desc` : undefined}` : undefined} aria-hidden="false">{description}</span>}
                </div>
            </div>

            {/* Gradient accent on hover */}
            <div className={clsx(
                "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                "bg-gradient-to-br p-[2px]",
                colorClasses[color] || colorClasses.blue
            )}>
                <div className="w-full h-full bg-white rounded-2xl" />
            </div>
        </div>
    )
}

export default Card
