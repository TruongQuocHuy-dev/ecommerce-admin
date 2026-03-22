import { useState } from 'react';
import clsx from 'clsx';

const FloatingLabelInput = ({
    label,
    type = 'text',
    value,
    onChange,
    error,
    disabled = false,
    icon: Icon,
    placeholder = '',
    required = false,
    className = '',
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.length > 0;
    const isFloating = isFocused || hasValue;

    return (
        <div className={clsx('relative', className)}>
            {/* Input */}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    disabled={disabled}
                    placeholder={isFocused ? placeholder : ''}
                    required={required}
                    className={clsx(
                        'w-full px-4 py-3 bg-slate-50 border rounded-lg outline-none transition-all',
                        Icon && 'pl-11',
                        isFloating && 'pt-6 pb-2',
                        error
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                            : 'border-slate-200 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
                        disabled && 'bg-slate-100 text-slate-500 cursor-not-allowed'
                    )}
                    {...props}
                />

                {/* Floating Label */}
                <label
                    className={clsx(
                        'absolute left-4 transition-all duration-200 pointer-events-none',
                        Icon && 'left-11',
                        isFloating
                            ? 'top-2 text-xs text-slate-600'
                            : 'top-1/2 -translate-y-1/2 text-base text-slate-500',
                        error && isFloating && 'text-red-600',
                        disabled && 'text-slate-400'
                    )}
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            </div>

            {/* Error Message */}
            {error && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};

export default FloatingLabelInput;
