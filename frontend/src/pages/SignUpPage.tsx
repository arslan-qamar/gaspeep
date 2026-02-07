import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '../services/authService'
import { Eye, EyeOff, Check, Zap, Shield, TrendingUp, Clock } from 'lucide-react'

const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    displayName: z.string().min(2, 'Display name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and privacy policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignUpFormData = z.infer<typeof signUpSchema>

type TierType = 'free' | 'premium'

export const SignUpPage = () => {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedTier, setSelectedTier] = useState<TierType>('free')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const password = watch('password', '')

  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; label: string; color: string } => {
    if (pwd.length === 0) return { strength: 'weak', label: '', color: 'bg-slate-200' }
    if (pwd.length < 8) return { strength: 'weak', label: 'Weak', color: 'bg-red-500' }
    
    let score = 0
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[^a-zA-Z0-9]/.test(pwd)) score++
    
    if (score <= 1) return { strength: 'weak', label: 'Weak', color: 'bg-red-500' }
    if (score <= 2) return { strength: 'medium', label: 'Medium', color: 'bg-yellow-500' }
    return { strength: 'strong', label: 'Strong', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setServerError(null)
      const { token } = await authService.signup(data.email, data.password, data.displayName)
      localStorage.setItem('auth_token', token)
      
      // TODO: Handle premium tier signup with payment flow
      if (selectedTier === 'premium') {
        console.log('Premium tier selected - payment flow coming soon')
      }
      
      // Navigate to home page after successful signup
      navigate('/')
    } catch (error: any) {
      const message = error?.response?.data?.error || error.message || 'Failed to create account'
      setServerError(message)
    }
  }

  const handleSocialSignUp = (provider: 'google' | 'apple') => {
    // TODO: Implement OAuth flow
    console.log(`Sign up with ${provider}`)
    setServerError('Social sign-up coming soon!')
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-1-9h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Gas Peep</h1>
          <p className="mt-2 text-slate-600">Join thousands finding better fuel prices</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left Column - Sign Up Form */}
          <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-900">Create your account</h2>
              <p className="mt-1 text-sm text-slate-600">Start saving on fuel today</p>
            </div>

            {/* Social Sign-Up Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSocialSignUp('google')}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>

              <button
                type="button"
                onClick={() => handleSocialSignUp('apple')}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Sign up with Apple
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">or continue with email</span>
              </div>
            </div>

            {/* Sign Up Form */}
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {serverError && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{serverError}</p>
                </div>
              )}

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name
                </label>
                <input
                  {...register('displayName')}
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  className={`block w-full px-3 py-2.5 border ${
                    errors.displayName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
                  placeholder="John Doe"
                />
                {errors.displayName && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.displayName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`block w-full px-3 py-2.5 border ${
                    errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`block w-full px-3 py-2.5 pr-10 border ${
                      errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color} transition-all`}
                          style={{ width: passwordStrength.strength === 'weak' ? '33%' : passwordStrength.strength === 'medium' ? '66%' : '100%' }}
                        />
                      </div>
                      {passwordStrength.label && (
                        <span className={`text-xs font-medium ${
                          passwordStrength.strength === 'weak' ? 'text-red-600' : 
                          passwordStrength.strength === 'medium' ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`block w-full px-3 py-2.5 pr-10 border ${
                      errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start">
                <input
                  {...register('acceptTerms')}
                  id="acceptTerms"
                  type="checkbox"
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-slate-700">
                  I agree to the{' '}
                  <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white shadow-sm ${
                  isSubmitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                } transition-colors`}
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/signin" className="font-semibold text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>

          {/* Right Column - Tier Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 text-center">Choose your plan</h3>
            
            {/* Free Tier Card */}
            <div 
              onClick={() => setSelectedTier('free')}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all ${
                selectedTier === 'free' ? 'ring-2 ring-blue-600' : 'hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-bold text-slate-900">Free</h4>
                    <span className="px-2 py-0.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-full">
                      Basic
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-1">$0<span className="text-base font-normal text-slate-600">/month</span></p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTier === 'free' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}>
                  {selectedTier === 'free' && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Clock className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span><strong>10 submissions per day</strong></span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Basic station information</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Community support</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setSelectedTier('free')}
                className={`w-full py-2 px-4 border-2 rounded-lg text-sm font-semibold transition-colors ${
                  selectedTier === 'free'
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                {selectedTier === 'free' ? 'Selected' : 'Select Free'}
              </button>
            </div>

            {/* Premium Tier Card */}
            <div 
              onClick={() => setSelectedTier('premium')}
              className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 cursor-pointer transition-all relative overflow-hidden ${
                selectedTier === 'premium' ? 'ring-2 ring-blue-600' : 'hover:shadow-lg'
              }`}
            >
              <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full">
                PREMIUM
              </div>
              
              <div className="flex items-center justify-between mb-4 pr-20">
                <div>
                  <h4 className="text-xl font-bold text-slate-900">Premium</h4>
                  <p className="text-2xl font-bold text-slate-900 mt-1">$4.99<span className="text-base font-normal text-slate-600">/month</span></p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTier === 'premium' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}>
                  {selectedTier === 'premium' && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm text-slate-900">
                  <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Unlimited submissions</strong></span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-900">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Advanced filters & alerts</strong></span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-900">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Ad-free experience</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-900">
                  <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-900">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>2x points multiplier</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setSelectedTier('premium')}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold shadow-sm transition-colors ${
                  selectedTier === 'premium'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-300'
                }`}
              >
                {selectedTier === 'premium' ? 'Selected - Premium' : 'Select Premium'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
