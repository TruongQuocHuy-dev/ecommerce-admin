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
                {t('products.seo.title')}
            </h3>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('products.seo.metaTitle')}
                </label>
                <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder={t('products.seo.metaTitlePlaceholder')}
                    maxLength={200}
                />
                <p className="mt-1 text-xs text-slate-400">
                    {t('products.seo.charCount', { count: formData.metaTitle?.length || 0, total: 200 })}
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('products.seo.metaKeywords')}
                </label>
                <input
                    type="text"
                    name="metaKeywords"
                    value={formData.metaKeywords || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                    placeholder={t('products.seo.metaKeywordsPlaceholder')}
                    maxLength={200}
                />
                <p className="mt-1 text-xs text-slate-400">
                    {t('products.seo.metaKeywordsHelp', { count: formData.metaKeywords?.length || 0, total: 200 })}
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('products.seo.metaDescription')}
                </label>
                <textarea
                    rows={4}
                    name="metaDescription"
                    value={formData.metaDescription || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none"
                    placeholder={t('products.seo.metaDescriptionPlaceholder')}
                    maxLength={300}
                />
                <p className="mt-1 text-xs text-slate-400">
                    {t('products.seo.charCount', { count: formData.metaDescription?.length || 0, total: 300 })}
                </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">{t('products.seo.googlePreview')}</h4>
                <div className="space-y-1">
                    <p className="text-blue-600 text-lg hover:underline truncate cursor-pointer font-medium">
                        {formData.metaTitle || formData.name || t('products.seo.defaultMetaTitle')}
                    </p>
                    <p className="text-green-700 text-sm truncate">
                        https://your-store.com/products/{formData.slug || 'product-slug'}
                    </p>
                    <p className="text-slate-600 text-sm line-clamp-2">
                        {formData.metaDescription || formData.description || t('products.seo.defaultMetaDescription')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProductSEO;
