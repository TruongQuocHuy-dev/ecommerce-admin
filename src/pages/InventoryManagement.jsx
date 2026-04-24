import { useMemo, useState } from 'react'
import { useProducts } from '../api/hooks/useProducts'
import { useCreateMovement, useCreateWarehouse, useInventoryOverview } from '../api/hooks/useInventory'
import { ArrowLeftRight, Clock3, History, MapPin, Package, Plus, RefreshCcw, Save, Search, Warehouse } from 'lucide-react'

const emptyWarehouseForm = {
    name: '',
    code: '',
    city: '',
    address: '',
    capacity: '',
    notes: '',
}

const emptyMovementForm = {
    productId: '',
    skuCode: '',
    movementType: 'inbound',
    quantity: '',
    reason: '',
    note: '',
    warehouseId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
}

const InventoryManagement = () => {
    const [search, setSearch] = useState('')
    const [warehouseFilter, setWarehouseFilter] = useState('')
    const [threshold, setThreshold] = useState(10)
    const [ledgerTab, setLedgerTab] = useState('records')
    const [warehouseForm, setWarehouseForm] = useState(emptyWarehouseForm)
    const [movementForm, setMovementForm] = useState(emptyMovementForm)

    const { data: productsData } = useProducts(1, 100, '', '', 'approved')
    const { data, isLoading } = useInventoryOverview({
        search,
        warehouseId: warehouseFilter,
        threshold,
        page: 1,
        limit: 20,
    })
    const createWarehouse = useCreateWarehouse()
    const createMovement = useCreateMovement()

    const products = productsData?.products || []
    const warehouses = data?.warehouses || []
    const records = data?.records || []
    const movements = data?.movements || []
    const summary = data?.summary || {
        totalStock: 0,
        reservedStock: 0,
        availableStock: 0,
        recordCount: 0,
        warehouseCount: 0,
        lowStockCount: 0,
        movementCount: 0,
    }

    const productOptions = useMemo(() => products.filter((product) => product.isActive !== false), [products])

    const handleWarehouseSubmit = (event) => {
        event.preventDefault()
        createWarehouse.mutate({
            name: warehouseForm.name,
            code: warehouseForm.code,
            location: {
                city: warehouseForm.city,
                address: warehouseForm.address,
            },
            capacity: warehouseForm.capacity ? Number(warehouseForm.capacity) : 0,
            notes: warehouseForm.notes,
        }, {
            onSuccess: () => setWarehouseForm(emptyWarehouseForm),
        })
    }

    const handleMovementSubmit = (event) => {
        event.preventDefault()

        const payload = {
            productId: movementForm.productId,
            skuCode: movementForm.skuCode,
            movementType: movementForm.movementType,
            quantity: Number(movementForm.quantity),
            reason: movementForm.reason,
            note: movementForm.note,
        }

        if (movementForm.movementType === 'transfer') {
            payload.fromWarehouseId = movementForm.fromWarehouseId
            payload.toWarehouseId = movementForm.toWarehouseId
        } else {
            payload.warehouseId = movementForm.warehouseId
        }

        createMovement.mutate(payload, {
            onSuccess: () => setMovementForm(emptyMovementForm),
        })
    }

    const productLookup = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_28%)]" />
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur">
                            Inventory / Warehouse
                        </p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Quản lý kho hàng</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">Theo dõi tồn kho theo kho, ghi nhận nhập - xuất - điều chỉnh và xem ledger ngay trong một workspace.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-white">
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                            <p className="text-xs uppercase tracking-wide text-slate-300">Warehouses</p>
                            <p className="mt-1 text-2xl font-bold">{summary.warehouseCount}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                            <p className="text-xs uppercase tracking-wide text-slate-300">Low stock</p>
                            <p className="mt-1 text-2xl font-bold text-amber-300">{summary.lowStockCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total stock</p>
                            <p className="mt-1 text-3xl font-bold text-slate-900">{summary.totalStock}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                            <Package className="h-5 w-5" />
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Reserved</p>
                            <p className="mt-1 text-3xl font-bold text-sky-700">{summary.reservedStock}</p>
                        </div>
                        <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                            <Clock3 className="h-5 w-5" />
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Available</p>
                            <p className="mt-1 text-3xl font-bold text-emerald-700">{summary.availableStock}</p>
                        </div>
                        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                            <Warehouse className="h-5 w-5" />
                        </div>
                    </div>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Movements</p>
                            <p className="mt-1 text-3xl font-bold text-amber-700">{summary.movementCount}</p>
                        </div>
                        <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                            <RefreshCcw className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search product name or SKU code..."
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                        />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                            value={warehouseFilter}
                            onChange={(event) => setWarehouseFilter(event.target.value)}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                        >
                            <option value="">All warehouses</option>
                            {warehouses.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.code} - {warehouse.name}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <span className="text-sm text-slate-600">Threshold</span>
                            <input
                                type="number"
                                min="1"
                                value={threshold}
                                onChange={(event) => setThreshold(Number(event.target.value))}
                                className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Warehouse directory</h2>
                                    <p className="text-sm text-slate-500">Tổng quan từng kho với stock, reserved và available.</p>
                                </div>
                                <p className="text-sm text-slate-500">{warehouses.length} active warehouses</p>
                            </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {isLoading ? (
                                <div className="px-5 py-10 text-sm text-slate-500">Loading inventory overview...</div>
                            ) : warehouses.length === 0 ? (
                                <div className="px-5 py-12 text-center">
                                    <div className="mx-auto max-w-sm">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                            <Warehouse className="h-6 w-6" />
                                        </div>
                                        <p className="mt-4 text-base font-semibold text-slate-800">No warehouse yet</p>
                                        <p className="mt-1 text-sm text-slate-500">Create the first warehouse to start tracking inventory by location.</p>
                                    </div>
                                </div>
                            ) : warehouses.map((warehouse) => (
                                <div key={warehouse.id} className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                                                <MapPin className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{warehouse.name}</p>
                                                <p className="text-sm text-slate-500">{warehouse.code}</p>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-500">
                                            {warehouse.location?.city || 'Unknown city'}{warehouse.location?.address ? ` · ${warehouse.location.address}` : ''}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 text-right text-sm">
                                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">Stock</p>
                                            <p className="font-semibold text-slate-900">{warehouse.stockCount}</p>
                                        </div>
                                        <div className="rounded-2xl bg-sky-50 px-3 py-2">
                                            <p className="text-xs uppercase tracking-wide text-sky-500">Reserved</p>
                                            <p className="font-semibold text-sky-700">{warehouse.reservedCount}</p>
                                        </div>
                                        <div className="rounded-2xl bg-emerald-50 px-3 py-2">
                                            <p className="text-xs uppercase tracking-wide text-emerald-500">Available</p>
                                            <p className="font-semibold text-emerald-700">{warehouse.availableCount}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Inventory ledger</h2>
                                    <p className="text-sm text-slate-500">Switch between stock records and movement history.</p>
                                </div>
                                <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
                                    <button
                                        onClick={() => setLedgerTab('records')}
                                        className={`rounded-xl px-3 py-2 text-sm font-medium transition ${ledgerTab === 'records' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Stock records
                                    </button>
                                    <button
                                        onClick={() => setLedgerTab('movements')}
                                        className={`rounded-xl px-3 py-2 text-sm font-medium transition ${ledgerTab === 'movements' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Movements
                                    </button>
                                </div>
                            </div>
                        </div>

                        {ledgerTab === 'records' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/80 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">SKU</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Warehouse</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reserved</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Available</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {records.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">No stock records match the current filters.</td>
                                            </tr>
                                        ) : records.map((record) => {
                                            const product = record.product || {}
                                            const warehouse = record.warehouse || {}
                                            return (
                                                <tr key={record.id} className="transition-colors hover:bg-slate-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={product.images?.[0] || '/placeholder.png'}
                                                                alt={product.name}
                                                                className="h-12 w-12 rounded-2xl object-cover border border-slate-200"
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-slate-900">{product.name}</p>
                                                                <p className="text-xs text-slate-500">{product.approvalStatus || 'approved'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-700">{record.skuCode}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-700">{warehouse.code || 'N/A'}</td>
                                                    <td className="px-6 py-4 font-semibold text-slate-900">{record.quantity}</td>
                                                    <td className="px-6 py-4 text-sm text-sky-700">{record.reservedQuantity}</td>
                                                    <td className="px-6 py-4 text-sm text-emerald-700">{record.availableQuantity}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/80 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Product</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Warehouse</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Qty</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {movements.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-sm text-slate-500">No movements recorded yet.</td>
                                            </tr>
                                        ) : movements.map((movement) => {
                                            const product = movement.product || {}
                                            const warehouse = movement.warehouse || movement.toWarehouse || movement.fromWarehouse || {}
                                            return (
                                                <tr key={movement.id} className="transition-colors hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-sm font-semibold uppercase tracking-wide text-slate-700">{movement.movementType}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-700">{product.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-700">{warehouse.code || 'N/A'}</td>
                                                    <td className="px-6 py-4 font-semibold text-slate-900">{movement.quantity}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{movement.reason}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{movement.actor?.name || 'System'}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <form onSubmit={handleWarehouseSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Create warehouse</h2>
                                <p className="text-sm text-slate-500">Register a new warehouse or fulfillment node.</p>
                            </div>
                            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                                <Plus className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                            <input
                                value={warehouseForm.name}
                                onChange={(event) => setWarehouseForm((prev) => ({ ...prev, name: event.target.value }))}
                                placeholder="Warehouse name"
                                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            />
                            <input
                                value={warehouseForm.code}
                                onChange={(event) => setWarehouseForm((prev) => ({ ...prev, code: event.target.value }))}
                                placeholder="Code e.g. HN-01"
                                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    value={warehouseForm.city}
                                    onChange={(event) => setWarehouseForm((prev) => ({ ...prev, city: event.target.value }))}
                                    placeholder="City"
                                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                />
                                <input
                                    value={warehouseForm.capacity}
                                    onChange={(event) => setWarehouseForm((prev) => ({ ...prev, capacity: event.target.value }))}
                                    placeholder="Capacity"
                                    type="number"
                                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                />
                            </div>
                            <textarea
                                value={warehouseForm.address}
                                onChange={(event) => setWarehouseForm((prev) => ({ ...prev, address: event.target.value }))}
                                placeholder="Address"
                                rows="3"
                                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            />
                            <textarea
                                value={warehouseForm.notes}
                                onChange={(event) => setWarehouseForm((prev) => ({ ...prev, notes: event.target.value }))}
                                placeholder="Notes"
                                rows="3"
                                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            />
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                disabled={createWarehouse.isPending}
                            >
                                <Save className="h-4 w-4" />
                                Save warehouse
                            </button>
                        </div>
                    </form>

                    <form onSubmit={handleMovementSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Record movement</h2>
                                <p className="text-sm text-slate-500">Choose a product and record inbound, outbound, transfer, or adjustment.</p>
                            </div>
                            <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                                <ArrowLeftRight className="h-4 w-4" />
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                            <select
                                value={movementForm.productId}
                                onChange={(event) => setMovementForm((prev) => ({ ...prev, productId: event.target.value }))}
                                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            >
                                <option value="">Select product</option>
                                {productOptions.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>

                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={movementForm.movementType}
                                    onChange={(event) => setMovementForm((prev) => ({ ...prev, movementType: event.target.value }))}
                                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                >
                                    <option value="inbound">Inbound</option>
                                    <option value="outbound">Outbound</option>
                                    <option value="adjustment">Adjustment</option>
                                    <option value="reserve">Reserve</option>
                                    <option value="release">Release</option>
                                    <option value="transfer">Transfer</option>
                                </select>
                                <input
                                    value={movementForm.skuCode}
                                    onChange={(event) => setMovementForm((prev) => ({ ...prev, skuCode: event.target.value }))}
                                    placeholder="SKU code or default"
                                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                />
                            </div>

                            {movementForm.movementType === 'transfer' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        value={movementForm.fromWarehouseId}
                                        onChange={(event) => setMovementForm((prev) => ({ ...prev, fromWarehouseId: event.target.value }))}
                                        className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                    >
                                        <option value="">From warehouse</option>
                                        {warehouses.map((warehouse) => (
                                            <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={movementForm.toWarehouseId}
                                        onChange={(event) => setMovementForm((prev) => ({ ...prev, toWarehouseId: event.target.value }))}
                                        className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                    >
                                        <option value="">To warehouse</option>
                                        {warehouses.map((warehouse) => (
                                            <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <select
                                    value={movementForm.warehouseId}
                                    onChange={(event) => setMovementForm((prev) => ({ ...prev, warehouseId: event.target.value }))}
                                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                >
                                    <option value="">Warehouse</option>
                                    {warehouses.map((warehouse) => (
                                        <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>
                                    ))}
                                </select>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="number"
                                    min="1"
                                    value={movementForm.quantity}
                                    onChange={(event) => setMovementForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                    placeholder="Quantity"
                                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                />
                                <input
                                    value={movementForm.reason}
                                    onChange={(event) => setMovementForm((prev) => ({ ...prev, reason: event.target.value }))}
                                    placeholder="Reason"
                                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                />
                            </div>

                            <textarea
                                value={movementForm.note}
                                onChange={(event) => setMovementForm((prev) => ({ ...prev, note: event.target.value }))}
                                placeholder="Optional note"
                                rows="3"
                                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            />
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                                disabled={createMovement.isPending}
                            >
                                <Save className="h-4 w-4" />
                                Save movement
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default InventoryManagement