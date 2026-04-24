import { useMemo, useState } from 'react'
import { Building2, Plus, Save, Tag, Trash2, Truck } from 'lucide-react'
import {
    useBrands,
    useCreateBrand,
    useDeleteBrand,
} from '../api/hooks/useBrands'
import {
    useSuppliers,
    useCreateSupplier,
    useDeleteSupplier,
} from '../api/hooks/useSuppliers'

const ProductPartners = () => {
    const { data: brands = [] } = useBrands()
    const { data: suppliers = [] } = useSuppliers()

    const createBrand = useCreateBrand()
    const deleteBrand = useDeleteBrand()
    const createSupplier = useCreateSupplier()
    const deleteSupplier = useDeleteSupplier()

    const [brandForm, setBrandForm] = useState({ name: '', country: '', website: '' })
    const [supplierForm, setSupplierForm] = useState({ name: '', contactName: '', email: '', phone: '' })

    const stats = useMemo(() => ({
        brands: brands.length,
        suppliers: suppliers.length,
    }), [brands, suppliers])

    const handleCreateBrand = (event) => {
        event.preventDefault()
        createBrand.mutate(brandForm, {
            onSuccess: () => setBrandForm({ name: '', country: '', website: '' }),
        })
    }

    const handleCreateSupplier = (event) => {
        event.preventDefault()
        createSupplier.mutate(supplierForm, {
            onSuccess: () => setSupplierForm({ name: '', contactName: '', email: '', phone: '' }),
        })
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.20),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.12),transparent_28%)]" />
                <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur">
                            Product Partners
                        </p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Nhãn hiệu & Nhà cung cấp</h1>
                        <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">Quản lý danh mục nhãn hiệu và nhà cung cấp để gắn trực tiếp vào từng sản phẩm.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm text-white">
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                            <p className="text-xs uppercase tracking-wide text-slate-300">Brands</p>
                            <p className="mt-1 text-2xl font-bold">{stats.brands}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                            <p className="text-xs uppercase tracking-wide text-slate-300">Suppliers</p>
                            <p className="mt-1 text-2xl font-bold">{stats.suppliers}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="space-y-4">
                    <form onSubmit={handleCreateBrand} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Thêm nhãn hiệu</h2>
                            <Tag className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className="mt-4 grid gap-3">
                            <input
                                value={brandForm.name}
                                onChange={(event) => setBrandForm((prev) => ({ ...prev, name: event.target.value }))}
                                placeholder="Brand name"
                                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                required
                            />
                            <input
                                value={brandForm.country}
                                onChange={(event) => setBrandForm((prev) => ({ ...prev, country: event.target.value }))}
                                placeholder="Country"
                                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            />
                            <input
                                value={brandForm.website}
                                onChange={(event) => setBrandForm((prev) => ({ ...prev, website: event.target.value }))}
                                placeholder="Website"
                                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            />
                            <button
                                type="submit"
                                disabled={createBrand.isPending}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                <Save className="h-4 w-4" />
                                Lưu nhãn hiệu
                            </button>
                        </div>
                    </form>

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Danh sách nhãn hiệu</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {brands.length === 0 ? (
                                <p className="px-5 py-6 text-sm text-slate-500">Chưa có nhãn hiệu nào.</p>
                            ) : brands.map((brand) => (
                                <div key={brand._id || brand.id} className="flex items-center justify-between px-5 py-4">
                                    <div>
                                        <p className="font-semibold text-slate-900">{brand.name}</p>
                                        <p className="text-sm text-slate-500">{brand.country || 'N/A'}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm('Xóa nhãn hiệu này?')) {
                                                deleteBrand.mutate(brand._id || brand.id)
                                            }
                                        }}
                                        className="rounded-xl p-2 text-rose-600 transition hover:bg-rose-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <form onSubmit={handleCreateSupplier} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Thêm nhà cung cấp</h2>
                            <Truck className="h-5 w-5 text-slate-500" />
                        </div>
                        <div className="mt-4 grid gap-3">
                            <input
                                value={supplierForm.name}
                                onChange={(event) => setSupplierForm((prev) => ({ ...prev, name: event.target.value }))}
                                placeholder="Supplier name"
                                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                required
                            />
                            <input
                                value={supplierForm.contactName}
                                onChange={(event) => setSupplierForm((prev) => ({ ...prev, contactName: event.target.value }))}
                                placeholder="Contact name"
                                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    value={supplierForm.email}
                                    onChange={(event) => setSupplierForm((prev) => ({ ...prev, email: event.target.value }))}
                                    placeholder="Email"
                                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                />
                                <input
                                    value={supplierForm.phone}
                                    onChange={(event) => setSupplierForm((prev) => ({ ...prev, phone: event.target.value }))}
                                    placeholder="Phone"
                                    className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500 focus:bg-white"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={createSupplier.isPending}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
                            >
                                <Save className="h-4 w-4" />
                                Lưu nhà cung cấp
                            </button>
                        </div>
                    </form>

                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Danh sách nhà cung cấp</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {suppliers.length === 0 ? (
                                <p className="px-5 py-6 text-sm text-slate-500">Chưa có nhà cung cấp nào.</p>
                            ) : suppliers.map((supplier) => (
                                <div key={supplier._id || supplier.id} className="flex items-center justify-between px-5 py-4">
                                    <div>
                                        <p className="font-semibold text-slate-900">{supplier.name}</p>
                                        <p className="text-sm text-slate-500">{supplier.email || supplier.phone || 'N/A'}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm('Xóa nhà cung cấp này?')) {
                                                deleteSupplier.mutate(supplier._id || supplier.id)
                                            }
                                        }}
                                        className="rounded-xl p-2 text-rose-600 transition hover:bg-rose-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductPartners
