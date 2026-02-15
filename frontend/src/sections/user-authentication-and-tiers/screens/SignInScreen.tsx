import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OAuthButton } from '../components/OAuthButton';
import { signIn } from '../api/authApi';
import { validateEmail } from '../utils/validation';
import type { AuthCredentials, AuthError } from '../types';

export function SignInScreen() {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState<AuthCredentials>({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<AuthError | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate email
        const emailValidation = validateEmail(credentials.email);
        if (!emailValidation.valid) {
            setError({
                field: 'email',
                message: emailValidation.message || 'Invalid email',
                code: 'VALIDATION_ERROR',
            });
            return;
        }

        // Validate password
        if (!credentials.password) {
            setError({
                field: 'password',
                message: 'Password is required',
                code: 'VALIDATION_ERROR',
            });
            return;
        }

        setIsLoading(true);

        try {
            await signIn(credentials);
            // Navigate to map on successful sign in
            navigate('/map');
        } catch (err) {
            setError({
                message: err instanceof Error ? err.message : 'Failed to sign in',
                code: 'AUTH_FAILED',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthSignIn = (provider: 'google' | 'apple') => {
        // Start OAuth flow by opening backend endpoint which redirects to provider
        const width = 500
        const height = 700
        const left = window.screenX + (window.innerWidth - width) / 2
        const top = window.screenY + (window.innerHeight - height) / 2
        const url = `/api/auth/oauth/${provider}`
        void window.open(url, 'oauth', `width=${width},height=${height},left=${left},top=${top}`)

        // Listen for message from popup. Accept either a token or a simple success message.
        const onMessage = async (e: MessageEvent) => {
            if (!e.data) return
            // Only handle cookie-based success
            if (e.data?.type === 'oauth_success') {
                window.removeEventListener('message', onMessage)
                // Navigate into the app; the app will fetch current user via cookie-based session
                navigate('/map')
                return
            }
        }

        window.addEventListener('message', onMessage)
    };

    const handleForgotPassword = () => {
        navigate('/auth/forgot-password');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and branding */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        ⛽ Gas Peep
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Welcome back! Sign in to continue
                    </p>
                </div>

                {/* Sign in form */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
                    {/* OAuth buttons */}
                    <div className="space-y-3 mb-6">
                        <OAuthButton
                            provider="google"
                            onClick={() => handleOAuthSignIn('google')}
                            disabled={isLoading}
                        />
                        <OAuthButton
                            provider="apple"
                            onClick={() => handleOAuthSignIn('apple')}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-300 dark:border-slate-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {error.message}
                            </p>
                        </div>
                    )}

                    {/* Email/Password form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={credentials.email}
                                onChange={(e) =>
                                    setCredentials({ ...credentials, email: e.target.value })
                                }
                                className={`input-field ${error?.field === 'email'
                                        ? 'border-red-500 focus:ring-red-500'
                                        : ''
                                    }`}
                                placeholder="you@example.com"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={credentials.password}
                                    onChange={(e) =>
                                        setCredentials({ ...credentials, password: e.target.value })
                                    }
                                    className={`input-field pr-10 ${error?.field === 'password'
                                            ? 'border-red-500 focus:ring-red-500'
                                            : ''
                                        }`}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                            />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Forgot password link */}
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                disabled={isLoading}
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Sign up link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Don't have an account?{' '}
                            <button
                                onClick={() => navigate('/auth/signup')}
                                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                disabled={isLoading}
                            >
                                Sign up
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
