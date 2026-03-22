import React from 'react';
import { useTranslation } from '../../i18n/index.jsx';

const ProductSEO = ({ formData, setFormData }) => {
    const { t } = useTranslation();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-gray-100 pb-2">
                Search Engine Optimization (SEO)
            </h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                </label>
                <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder="Enter meta title (max 200 chars)"
                    maxLength={200}
                />
                <p className="mt-1 text-xs text-slate-400">
                    {formData.metaTitle?.length || 0}/200 characters
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Keywords
                </label>
                <input
                    type="text"
                    name="metaKeywords"
                    value={formData.metaKeywords || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder="keyword1, keyword2, keyword3"
                    maxLength={200}
                />
                <p className="mt-1 text-xs text-slate-400">
                    Separate keywords with commas. {formData.metaKeywords?.length || 0}/200 characters
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                </label>
                <textarea
                    rows={4}
                    name="metaDescription"
                    value={formData.metaDescription || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none"
                    placeholder="Enter meta description (max 300 chars)"
                    maxLength={300}
                />
                <p className="mt-1 text-xs text-slate-400">
                    {formData.metaDescription?.length || 0}/300 characters
                </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Google Preview</h4>
                <div className="space-y-1">
                    <p className="text-blue-600 text-lg hover:underline truncate cursor-pointer font-medium">
                        {formData.metaTitle || formData.name || 'Product Meta Title'}
                    </p>
                    <p className="text-green-700 text-sm truncate">
                        https://your-store.com/products/{formData.slug || 'product-slug'}
                    </p>
                    <p className="text-slate-600 text-sm line-clamp-2">
                        {formData.metaDescription || formData.description || 'This is how your product will appear in search engine results.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProductSEO;
