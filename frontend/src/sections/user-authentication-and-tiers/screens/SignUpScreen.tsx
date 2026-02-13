import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OAuthButton } from '../components/OAuthButton';
import { TierCard } from '../components/TierCard';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { signUp, checkEmailAvailability } from '../api/authApi';
import {
    validateEmail,
    validatePassword,
    validatePasswordConfirmation,
    validateDisplayName,
    checkPasswordStrength,
} from '../utils/validation';
import type { SignUpData, AuthError } from '../types';

export function SignUpScreen() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<SignUpData>({
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
        selectedTier: 'free',
        agreedToTerms: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<AuthError | null>(null);
    const [emailChecking, setEmailChecking] = useState(false);
    const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

    // Check password strength
    const passwordStrength = formData.password
        ? checkPasswordStrength(formData.password)
        : null;

    // Check email availability with debounce
    useEffect(() => {
        if (!formData.email || !validateEmail(formData.email).valid) {
            setEmailAvailable(null);
            return;
        }

        const timer = setTimeout(async () => {
            setEmailChecking(true);
            try {
                const result = await checkEmailAvailability(formData.email);
                setEmailAvailable(result.available);
            } catch (err) {
                console.error('Failed to check email availability', err);
            } finally {
                setEmailChecking(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate name
        const nameValidation = validateDisplayName(formData.name);
        if (!nameValidation.valid) {
            setError({
                field: 'name',
                message: nameValidation.message || 'Invalid name',
                code: 'VALIDATION_ERROR',
            });
            return;
        }

        // Validate email
        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.valid) {
            setError({
                field: 'email',
                message: emailValidation.message || 'Invalid email',
                code: 'VALIDATION_ERROR',
            });
            return;
        }

        if (!emailAvailable) {
            setError({
                field: 'email',
                message: 'An account with this email already exists',
                code: 'EMAIL_EXISTS',
            });
            return;
        }

        // Validate password
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.valid) {
            setError({
                field: 'password',
                message: passwordValidation.message || 'Invalid password',
                code: 'VALIDATION_ERROR',
            });
            return;
        }

        // Validate password confirmation
        const confirmValidation = validatePasswordConfirmation(
            formData.password,
            formData.passwordConfirmation
        );
        if (!confirmValidation.valid) {
            setError({
                field: 'passwordConfirmation',
                message: confirmValidation.message || 'Passwords do not match',
                code: 'VALIDATION_ERROR',
            });
            return;
        }

        // Check terms agreement
        if (!formData.agreedToTerms) {
            setError({
                message: 'Please accept the terms and privacy policy',
                code: 'TERMS_NOT_ACCEPTED',
            });
            return;
        }

        setIsLoading(true);

        try {
            await signUp(formData);
            // Navigate to map on successful sign up
            navigate('/');
        } catch (err) {
            setError({
                message: err instanceof Error ? err.message : 'Failed to create account',
                code: 'SIGNUP_FAILED',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthSignUp = (provider: 'google' | 'apple') => {
        // TODO: Implement OAuth flow
        console.log(`Sign up with ${provider}`);
        alert(`OAuth with ${provider} - Coming soon!`);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
            <div className="w-full max-w-2xl mx-auto">
                {/* Logo and branding */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        ⛽ Gas Peep
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Join thousands of drivers saving money on fuel
                    </p>
                </div>

                {/* Sign up form */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
                    {/* OAuth buttons */}
                    <div className="space-y-3 mb-6">
                        <OAuthButton
                            provider="google"
                            onClick={() => handleOAuthSignUp('google')}
                            disabled={isLoading}
                        />
                        <OAuthButton
                            provider="apple"
                            onClick={() => handleOAuthSignUp('apple')}
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
                        {/* Name field */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className={`input-field ${error?.field === 'name'
                                        ? 'border-red-500 focus:ring-red-500'
                                        : ''
                                    }`}
                                placeholder="John Doe"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Email field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    className={`input-field pr-10 ${error?.field === 'email'
                                            ? 'border-red-500 focus:ring-red-500'
                                            : emailAvailable === true
                                                ? 'border-green-500 focus:ring-green-500'
                                                : emailAvailable === false
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : ''
                                        }`}
                                    placeholder="you@example.com"
                                    disabled={isLoading}
                                />
                                {emailChecking && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <svg
                                            className="animate-spin h-5 w-5 text-slate-400"
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
                                    </div>
                                )}
                                {!emailChecking && emailAvailable === true && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                        ✓
                                    </div>
                                )}
                                {!emailChecking && emailAvailable === false && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                                        ✗
                                    </div>
                                )}
                            </div>
                            {emailAvailable === false && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    This email is already registered.{' '}
                                    <button
                                        type="button"
                                        onClick={() => navigate('/auth/signin')}
                                        className="underline hover:no-underline"
                                    >
                                        Sign in instead
                                    </button>
                                </p>
                            )}
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
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
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
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
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

                        {/* Password confirmation field */}
                        <div>
                            <label
                                htmlFor="passwordConfirmation"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                            >
                                Confirm Password
                            </label>
                            <input
                                id="passwordConfirmation"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.passwordConfirmation}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        passwordConfirmation: e.target.value,
                                    })
                                }
                                className={`input-field ${error?.field === 'passwordConfirmation'
                                        ? 'border-red-500 focus:ring-red-500'
                                        : ''
                                    }`}
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Tier selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Choose your plan
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <TierCard
                                    tier="free"
                                    selected={formData.selectedTier === 'free'}
                                    onSelect={() =>
                                        setFormData({ ...formData, selectedTier: 'free' })
                                    }
                                />
                                <TierCard
                                    tier="premium"
                                    selected={formData.selectedTier === 'premium'}
                                    onSelect={() =>
                                        setFormData({ ...formData, selectedTier: 'premium' })
                                    }
                                />
                            </div>
                        </div>

                        {/* Terms checkbox */}
                        <div className="flex items-start gap-2">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={formData.agreedToTerms}
                                onChange={(e) =>
                                    setFormData({ ...formData, agreedToTerms: e.target.checked })
                                }
                                className="mt-1 w-4 h-4 text-blue-500 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500"
                                disabled={isLoading}
                            />
                            <label
                                htmlFor="terms"
                                className="text-sm text-slate-600 dark:text-slate-400"
                            >
                                I agree to the{' '}
                                <a
                                    href="/terms"
                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Terms of Service
                                </a>{' '}
                                and{' '}
                                <a
                                    href="/privacy"
                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Privacy Policy
                                </a>
                            </label>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading || !formData.agreedToTerms}
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
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Sign in link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/auth/signin')}
                                className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                disabled={isLoading}
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
