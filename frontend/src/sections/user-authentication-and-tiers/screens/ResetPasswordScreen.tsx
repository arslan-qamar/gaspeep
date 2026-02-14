import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { resetPassword } from '../api/authApi';
import {
    validatePassword,
    validatePasswordConfirmation,
    checkPasswordStrength,
} from '../utils/validation';

type ScreenState = 'form' | 'loading' | 'success' | 'error' | 'expired';

export function ResetPasswordScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [screenState, setScreenState] = useState<ScreenState>(token ? 'form' : 'expired');
    const [fieldError, setFieldError] = useState<{ field?: string; message: string } | null>(null);

    const passwordStrength = newPassword ? checkPasswordStrength(newPassword) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldError(null);

        if (!token) {
            setScreenState('expired');
            return;
        }

        // Validate password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            setFieldError({
                field: 'password',
                message: passwordValidation.message || 'Password does not meet requirements',
            });
            return;
        }

        // Validate confirmation
        const confirmValidation = validatePasswordConfirmation(newPassword, confirmPassword);
        if (!confirmValidation.valid) {
            setFieldError({
                field: 'confirmPassword',
                message: confirmValidation.message || 'Passwords do not match',
            });
            return;
        }

        setScreenState('loading');

        try {
            await resetPassword({
                token,
                newPassword,
                confirmPassword,
            });
            setScreenState('success');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to reset password';
            // Check if the error indicates an expired token
            if (message.toLowerCase().includes('expired') || message.toLowerCase().includes('invalid token')) {
                setScreenState('expired');
            } else {
                setFieldError({ message });
                setScreenState('error');
            }
        }
    };

    // Expired/invalid token state
    if (screenState === 'expired') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="w-8 h-8 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            Reset link expired
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            This password reset link has expired or is invalid. Please request a new one.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/auth/forgot-password')}
                                className="btn-primary w-full"
                            >
                                Request New Reset Link
                            </button>
                            <button
                                onClick={() => navigate('/auth/signin')}
                                className="w-full py-3 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (screenState === 'success') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="w-8 h-8 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            Password updated
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            Your password has been successfully reset. You can now sign in with your new password.
                        </p>

                        <button
                            onClick={() => navigate('/auth/signin')}
                            className="btn-primary w-full"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Set New Password
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Create a strong password for your account.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
                    {/* Error banner */}
                    {screenState === 'error' && fieldError && !fieldError.field && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {fieldError.message}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* New password field */}
                        <div>
                            <label
                                htmlFor="new-password"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    id="new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setFieldError(null);
                                        if (screenState === 'error') setScreenState('form');
                                    }}
                                    className={`input-field pr-10 ${
                                        fieldError?.field === 'password'
                                            ? 'border-red-500 focus:ring-red-500'
                                            : ''
                                    }`}
                                    placeholder="Enter new password"
                                    disabled={screenState === 'loading'}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    disabled={screenState === 'loading'}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {fieldError?.field === 'password' && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {fieldError.message}
                                </p>
                            )}
                            {passwordStrength && (
                                <div className="mt-2">
                                    <PasswordStrengthIndicator
                                        strength={passwordStrength.strength}
                                        score={passwordStrength.score}
                                        feedback={passwordStrength.feedback}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Confirm password field */}
                        <div>
                            <label
                                htmlFor="confirm-password"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Confirm New Password
                            </label>
                            <input
                                id="confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setFieldError(null);
                                    if (screenState === 'error') setScreenState('form');
                                }}
                                className={`input-field ${
                                    fieldError?.field === 'confirmPassword'
                                        ? 'border-red-500 focus:ring-red-500'
                                        : ''
                                }`}
                                placeholder="Confirm new password"
                                disabled={screenState === 'loading'}
                            />
                            {fieldError?.field === 'confirmPassword' && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {fieldError.message}
                                </p>
                            )}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={screenState === 'loading' || !newPassword || !confirmPassword}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {screenState === 'loading' ? (
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
                                    Resetting password...
                                </span>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
