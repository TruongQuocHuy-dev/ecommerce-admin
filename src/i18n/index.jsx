import { createContext, useContext, useState, useEffect } from 'react'
import vi from './locales/vi.json'
import en from './locales/en.json'

const translations = { vi, en }

const I18nContext = createContext()

export const I18nProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'vi'
    })

    const changeLanguage = (lang) => {
        setLanguage(lang)
        localStorage.setItem('language', lang)
    }

    const t = (key, params = {}) => {
        const keys = key.split('.')
        let value = translations[language]

        for (const k of keys) {
            value = value?.[k]
        }

        // Handle parameterized translations
        if (typeof value === 'string' && params) {
            Object.keys(params).forEach(param => {
                value = value.replace(`{{${param}}}`, params[param])
            })
        }

        return value || key
    }

    return (
        <I18nContext.Provider value={{ t, language, changeLanguage }}>
            {children}
        </I18nContext.Provider>
    )
}

export const useTranslation = () => {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error('useTranslation must be used within I18nProvider')
    }
    return context
}
