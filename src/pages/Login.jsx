import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import useAuthStore from '../store/useAuthStore';
import api from '../api/client';
import toast from 'react-hot-toast';
import { Store, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n/index.jsx';
import FloatingLabelInput from '../components/ui/FloatingLabelInput';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const email = watch('email') || '';
    const password = watch('password') || '';

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', data);
            const { user, tokens } = response.data.data;

            // Map backend role to frontend permissions
            const role = user.role === 'admin' ? 'super_admin' : user.role;
            const userWithMappedRole = { ...user, role };

            login(userWithMappedRole, tokens.accessToken, []);
            toast.success(t('toast.loginSuccess'));
            navigate('/');
        } catch (error) {
            console.error(error);
            toast.error(t('toast.loginError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl mb-4 shadow-lg">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('login.title')}</h1>
                    <p className="text-slate-600 mt-2">{t('login.subtitle')}</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email with FloatingLabel */}
                        <div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                                <input
                                    type="email"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address',
                                        },
                                    })}
                                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border rounded-lg outline-none transition-all ${errors.email
                                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                            : 'border-slate-200 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20'
                                        }`}
                                    placeholder={email ? '' : t('login.emailPlaceholder')}
                                />
                                <label
                                    className={`absolute left-11 transition-all duration-200 pointer-events-none ${email
                                            ? 'top-2 text-xs text-slate-600'
                                            : 'top-1/2 -translate-y-1/2 text-base text-slate-500'
                                        } ${errors.email && email && 'text-red-600'}`}
                                >
                                    {t('login.email')} <span className="text-red-500">*</span>
                                </label>
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password with FloatingLabel */}
                        <div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters',
                                        },
                                    })}
                                    className={`w-full pl-11 pr-12 py-3 bg-slate-50 border rounded-lg outline-none transition-all ${errors.password
                                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                            : 'border-slate-200 focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20'
                                        }`}
                                    placeholder={password ? '' : '••••••••'}
                                />
                                <label
                                    className={`absolute left-11 transition-all duration-200 pointer-events-none ${password
                                            ? 'top-2 text-xs text-slate-600'
                                            : 'top-1/2 -translate-y-1/2 text-base text-slate-500'
                                        } ${errors.password && password && 'text-red-600'}`}
                                >
                                    {t('login.password')} <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    {t('login.loggingIn')}
                                </>
                            ) : (
                                t('login.loginButton')
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 mt-6 text-sm">
                    © 2024 E-Commerce Admin. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;
