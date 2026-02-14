import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../api/authApi';
import { validateEmail } from '../utils/validation';

type ScreenState = 'form' | 'loading' | 'success' | 'error';

export function ForgotPasswordScreen() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [screenState, setScreenState] = useState<ScreenState>('form');
    const [errorMessage, setErrorMessage] = useState('');
    const [emailError, setEmailError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');

        // Validate email format
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            setEmailError(emailValidation.message || 'Please enter a valid email address');
            return;
        }

        setScreenState('loading');

        try {
            await requestPasswordReset(email);
            setScreenState('success');
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : 'Failed to send reset email. Please try again.'
            );
            setScreenState('error');
        }
    };

    // Success state — email sent confirmation
    if (screenState === 'success') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
                        {/* Success icon */}
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
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            Check your email
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-2">
                            We've sent a password reset link to:
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white mb-6">
                            {email}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">
                            The link will expire in 1 hour. If you don't see the email, check your spam folder.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/auth/signin')}
                                className="btn-primary w-full"
                            >
                                Back to Sign In
                            </button>
                            <button
                                onClick={() => {
                                    setScreenState('form');
                                    setEmail('');
                                }}
                                className="w-full py-3 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                                Didn't receive it? Try again
                            </button>
                        </div>
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
                        Reset Password
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Enter the email address associated with your account and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
                    {/* Error banner */}
                    {screenState === 'error' && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {errorMessage}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email field */}
                        <div>
                            <label
                                htmlFor="reset-email"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Email
                            </label>
                            <input
                                id="reset-email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setEmailError('');
                                    if (screenState === 'error') setScreenState('form');
                                }}
                                className={`input-field ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="you@example.com"
                                disabled={screenState === 'loading'}
                                autoFocus
                            />
                            {emailError && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {emailError}
                                </p>
                            )}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={screenState === 'loading' || !email}
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
                                    Sending reset link...
                                </span>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>

                    {/* Back to sign in */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/auth/signin')}
                            className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
