import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, AlertCircle, Image as ImageIcon } from 'lucide-react';
import clsx from 'clsx';

const ProductVariants = ({
    formData,
    setFormData,
    tierVariations,
    setTierVariations,
    skus,
    setSkus
}) => {

    // --- Handlers for Tiers ---

    const addTier = () => {
        if (tierVariations.length >= 2) return; // Limit to 2 tiers for simplicity for now
        setTierVariations([...tierVariations, { name: '', options: [] }]);
    };

    const removeTier = (index) => {
        const newTiers = tierVariations.filter((_, i) => i !== index);
        setTierVariations(newTiers);
    };

    const updateTierName = (index, name) => {
        const newTiers = [...tierVariations];
        newTiers[index].name = name;
        setTierVariations(newTiers);
    };

    const addOption = (tierIndex, optionValue) => {
        if (!optionValue.trim()) return;
        const newTiers = [...tierVariations];
        if (!newTiers[tierIndex].options.includes(optionValue)) {
            newTiers[tierIndex].options.push(optionValue);
            setTierVariations(newTiers);
        }
    };

    const removeOption = (tierIndex, optionIndex) => {
        const newTiers = [...tierVariations];
        newTiers[tierIndex].options = newTiers[tierIndex].options.filter((_, i) => i !== optionIndex);
        setTierVariations(newTiers);
    };

    // --- Generate SKUs ---

    useEffect(() => {
        // Skip if tierVariations is empty
        if (!tierVariations || tierVariations.length === 0) {
            if (skus.length > 0) setSkus([]);
            return;
        }

        const validTiers = tierVariations.filter(t => t.name && t.options.length > 0);
        if (validTiers.length === 0) {
            if (skus.length > 0) setSkus([]);
            return;
        }

        // Helper to generate combinations
        const generateCombinations = (tiers, currentCombo = [], currentIndices = []) => {
            if (tiers.length === 0) {
                return [{ options: currentCombo, indices: currentIndices }];
            }
            const [firstTier, ...restTiers] = tiers;
            let results = [];
            firstTier.options.forEach((opt, idx) => {
                results = results.concat(generateCombinations(restTiers, [...currentCombo, opt], [...currentIndices, idx]));
            });
            return results;
        };

        const combinations = generateCombinations(validTiers);

        // Check if current SKUs already match combinations in length and structure
        // This helps prevent overwriting backend data on first mount or when unrelated variation metadata changes
        const currentSkusMatch = skus.length === combinations.length && skus.every(s =>
            s.tierIndex && s.tierIndex.length === validTiers.length
        );

        // If it perfectly matches, we might still want to check indices, but let's be careful
        // Only re-generate if the indices don't match at all
        if (currentSkusMatch) {
            const indicesMatch = combinations.every((combo, idx) => {
                const sku = skus[idx];
                return sku.tierIndex.every((val, i) => Number(val) === Number(combo.indices[i]));
            });
            if (indicesMatch) return; // Everything looks good, don't touch skus
        }

        // Merge with existing SKUs to preserve price/stock if possible
        setSkus(prevSkus => {
            // Use current skus if prevSkus is stale/empty due to race condition
            const currentSkus = prevSkus.length > 0 ? prevSkus : skus;

            return combinations.map(combo => {
                const tierIndex = combo.indices;
                const existing = currentSkus.find(s =>
                    s.tierIndex && s.tierIndex.length === tierIndex.length &&
                    s.tierIndex.every((val, i) => Number(val) === Number(tierIndex[i]))
                );

                if (existing) {
                    return { ...existing, tierIndex };
                }

                return {
                    tierIndex,
                    skuCode: `${validTiers.map((t, i) => combo.options[i]?.toUpperCase().slice(0, 3)).join('-')}-${Date.now().toString().slice(-4)}`,
                    price: formData.price || 0,
                    stock: formData.stock || 0,
                    isActive: true
                };
            });
        });

    }, [tierVariations, formData.price, formData.stock]);

    const updateSku = (index, field, value) => {
        const newSkus = [...skus];
        newSkus[index][field] = value;
        setSkus(newSkus);
    };

    // Helper to get option names for a SKU
    const getSkuName = (sku) => {
        return sku.tierIndex.map((idx, tierIdx) => tierVariations[tierIdx]?.options[idx]).join(' / ');
    };

    const handleImageChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            const newSkus = [...skus];
            newSkus[index].imageFile = file;
            newSkus[index].preview = previewUrl;
            setSkus(newSkus);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="border-b border-gray-100 pb-2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">
                    Product Variants
                </h3>
            </div>

            {/* Tiers Management */}
            <div className="space-y-4">
                {tierVariations.map((tier, tIndex) => (
                    <div key={tIndex} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative">
                        <button
                            onClick={() => removeTier(tIndex)}
                            className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Variation Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Color, Size"
                                    value={tier.name}
                                    onChange={(e) => updateTierName(tIndex, e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    Options (Press Enter to add)
                                </label>
                                <div className="flex bg-white border border-slate-200 rounded-lg p-1.5 flex-wrap gap-2 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                                    {tier.options.map((opt, oIndex) => (
                                        <span key={oIndex} className="inline-flex items-center px-2 py-1 rounded bg-primary-50 text-primary-700 text-sm">
                                            {opt}
                                            <button
                                                onClick={() => removeOption(tIndex, oIndex)}
                                                className="ml-1 hover:text-primary-900"
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder={tier.options.length === 0 ? "Type option and press Enter..." : ""}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addOption(tIndex, e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        className="flex-1 min-w-[120px] outline-none text-sm px-1 py-0.5"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {tierVariations.length < 2 && (
                    <button
                        onClick={addTier}
                        className="flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Variation
                    </button>
                )}
            </div>

            {/* Generated SKUs Table */}
            {skus.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Variant Combinations ({skus.length})
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-slate-600">Variant</th>
                                    <th className="px-4 py-3 text-center font-medium text-slate-600">Image</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-600">Price ($)</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-600">Stock</th>
                                    <th className="px-4 py-3 text-left font-medium text-slate-600">SKU Code</th>
                                    <th className="px-4 py-3 text-center font-medium text-slate-600">Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {skus.map((sku, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-2 font-medium text-slate-800">
                                            {getSkuName(sku)}
                                        </td>
                                        <td className="px-4 py-2 flex items-center justify-center">
                                            <div className="relative w-12 h-12 border border-slate-200 rounded-md overflow-hidden bg-slate-50 flex items-center justify-center group cursor-pointer">
                                                {sku.preview || (sku.images && sku.images[0]) ? (
                                                    <img src={sku.preview || sku.images[0]} alt="SKU" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-slate-300" />
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageChange(index, e)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={sku.price}
                                                onChange={(e) => updateSku(index, 'price', e.target.value)}
                                                className="w-24 px-2 py-1.5 border border-slate-200 rounded-md focus:border-primary-500 outline-none text-right"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={sku.stock}
                                                onChange={(e) => updateSku(index, 'stock', e.target.value)}
                                                className="w-24 px-2 py-1.5 border border-slate-200 rounded-md focus:border-primary-500 outline-none text-right"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={sku.skuCode}
                                                onChange={(e) => updateSku(index, 'skuCode', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-slate-200 rounded-md focus:border-primary-500 outline-none uppercase"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={sku.isActive}
                                                onChange={(e) => updateSku(index, 'isActive', e.target.checked)}
                                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {skus.length === 0 && tierVariations.length > 0 && (
                <div className="flex items-center gap-2 p-4 bg-orange-50 text-orange-700 rounded-xl border border-orange-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">Add options above to generate variant combinations.</p>
                </div>
            )}
        </div>
    );
};

export default ProductVariants;
