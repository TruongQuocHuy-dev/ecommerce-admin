import { Plus } from 'lucide-react'

const ProductCommandCenterHeader = ({ title, subtitle, onCreate, canCreate }) => {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.12),transparent_28%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur">
                        Product Command Center
                    </p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h1>
                    <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">{subtitle}</p>
                </div>
                {canCreate && (
                    <button
                        onClick={onCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/20 transition-transform hover:-translate-y-0.5 hover:bg-cyan-50"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                )}
            </div>
        </div>
    )
}

export default ProductCommandCenterHeader
