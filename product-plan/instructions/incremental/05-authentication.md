# Phase 5: User Authentication & Tier System

**Duration:** 2 days  
**Goal:** Implement secure user authentication with OAuth and tier-based access control

---

## Overview

This phase adds:
- User registration and login (email/password and OAuth)
- JWT token-based authentication
- Tier management (Free vs Premium)
- Protected routes and API endpoints
- Tier-based feature gating

---

## Step 1: Backend Authentication

### 1.1 Authentication Middleware

`internal/middleware/auth.go`:

```go
package middleware

import (
  "github.com/gin-gonic/gin"
  "strings"
  "yourmodule/internal/utils"
)

// AuthRequired checks for valid JWT token
func AuthRequired() gin.HandlerFunc {
  return func(c *gin.Context) {
    authHeader := c.GetHeader("Authorization")
    if authHeader == "" {
      c.JSON(401, gin.H{"error": "Missing authorization header"})
      c.Abort()
      return
    }

    parts := strings.Split(authHeader, " ")
    if len(parts) != 2 || parts[0] != "Bearer" {
      c.JSON(401, gin.H{"error": "Invalid authorization format"})
      c.Abort()
      return
    }

    userID, err := utils.ValidateToken(parts[1])
    if err != nil {
      c.JSON(401, gin.H{"error": "Invalid token"})
      c.Abort()
      return
    }

    c.Set("user_id", userID)
    c.Next()
  }
}

// PremiumRequired checks for Premium tier
func PremiumRequired(userRepo *repository.UserRepository) gin.HandlerFunc {
  return func(c *gin.Context) {
    userID := c.GetString("user_id")

    user, err := userRepo.GetUserByID(userID)
    if err != nil {
      c.JSON(401, gin.H{"error": "Unauthorized"})
      c.Abort()
      return
    }

    if user.Tier != "premium" {
      c.JSON(403, gin.H{"error": "Premium tier required"})
      c.Abort()
      return
    }

    c.Next()
  }
}
```

### 1.2 Auth Handler

`internal/handlers/auth_handler.go`:

```go
package handlers

import (
  "github.com/gin-gonic/gin"
  "yourmodule/internal/models"
  "yourmodule/internal/repository"
  "yourmodule/internal/utils"
)

type AuthHandler struct {
  userRepo *repository.UserRepository
}

func NewAuthHandler(userRepo *repository.UserRepository) *AuthHandler {
  return &AuthHandler{userRepo: userRepo}
}

// POST /api/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
  var req struct {
    Email       string `json:"email" binding:"required,email"`
    Password    string `json:"password" binding:"required,min=8"`
    DisplayName string `json:"displayName" binding:"required"`
  }

  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"error": "Invalid request"})
    return
  }

  // Check if email exists
  _, err := h.userRepo.GetUserByEmail(req.Email)
  if err == nil {
    c.JSON(400, gin.H{"error": "Email already registered"})
    return
  }

  // Hash password
  passwordHash, err := utils.HashPassword(req.Password)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to process password"})
    return
  }

  // Create user
  user, err := h.userRepo.CreateUser(
    req.Email, passwordHash, req.DisplayName, "free",
  )
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to create user"})
    return
  }

  // Generate token
  token, err := utils.GenerateToken(user.ID)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to generate token"})
    return
  }

  c.JSON(201, models.AuthResponse{
    User:  user,
    Token: token,
  })
}

// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
  var req models.LoginRequest
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"error": "Invalid request"})
    return
  }

  // Get user
  user, err := h.userRepo.GetUserByEmail(req.Email)
  if err != nil {
    c.JSON(401, gin.H{"error": "Invalid credentials"})
    return
  }

  // Get password hash
  hash, err := h.userRepo.GetPasswordHash(req.Email)
  if err != nil {
    c.JSON(401, gin.H{"error": "Invalid credentials"})
    return
  }

  // Verify password
  if !utils.VerifyPassword(hash, req.Password) {
    c.JSON(401, gin.H{"error": "Invalid credentials"})
    return
  }

  // Generate token
  token, err := utils.GenerateToken(user.ID)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to generate token"})
    return
  }

  c.JSON(200, models.AuthResponse{
    User:  user,
    Token: token,
  })
}

// GET /api/auth/me
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
  userID := c.GetString("user_id")
  user, err := h.userRepo.GetUserByID(userID)
  if err != nil {
    c.JSON(404, gin.H{"error": "User not found"})
    return
  }

  c.JSON(200, user)
}

// POST /api/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
  // In stateless JWT approach, logout is handled client-side
  // In production, you might maintain a token blacklist
  c.JSON(200, gin.H{"message": "Logged out successfully"})
}
```

Register auth routes:

```go
authHandler := handlers.NewAuthHandler(userRepo)

api := router.Group("/api")
{
  auth := api.Group("/auth")
  {
    auth.POST("/register", authHandler.Register)
    auth.POST("/login", authHandler.Login)
    auth.GET("/me", middleware.AuthRequired(), authHandler.GetCurrentUser)
    auth.POST("/logout", middleware.AuthRequired(), authHandler.Logout)
  }
}
```

---

## Step 2: Tier Management

### 2.1 Tier Repository

`internal/repository/tier_repository.go`:

```go
package repository

import (
  "database/sql"
  "time"
)

type TierRepository struct {
  db *sql.DB
}

func NewTierRepository(db *sql.DB) *TierRepository {
  return &TierRepository{db: db}
}

type Subscription struct {
  ID           string
  UserID       string
  Tier         string
  StartDate    time.Time
  EndDate      time.Time
  StripeID     string
  Status       string
  RenewalDate  time.Time
}

func (r *TierRepository) UpgradeToPrenum(userID string) error {
  _, err := r.db.Exec(`
    UPDATE users
    SET tier = 'premium'
    WHERE id = $1
  `, userID)
  return err
}

func (r *TierRepository) DowngradeToFree(userID string) error {
  _, err := r.db.Exec(`
    UPDATE users
    SET tier = 'free'
    WHERE id = $1
  `, userID)
  return err
}

func (r *TierRepository) GetUserTier(userID string) (string, error) {
  var tier string
  err := r.db.QueryRow(`
    SELECT tier FROM users WHERE id = $1
  `, userID).Scan(&tier)
  return tier, err
}
```

### 2.2 Tier Handler

`internal/handlers/tier_handler.go`:

```go
package handlers

import (
  "github.com/gin-gonic/gin"
  "yourmodule/internal/repository"
  // "stripe" package import for payments
)

type TierHandler struct {
  tierRepo *repository.TierRepository
}

func NewTierHandler(tierRepo *repository.TierRepository) *TierHandler {
  return &TierHandler{tierRepo: tierRepo}
}

// POST /api/tiers/upgrade
func (h *TierHandler) UpgradeToPremium(c *gin.Context) {
  userID := c.GetString("user_id")

  // In production, integrate with Stripe
  // Create subscription via Stripe
  // Then update tier in DB

  err := h.tierRepo.UpgradeToPrenum(userID)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to upgrade tier"})
    return
  }

  c.JSON(200, gin.H{"message": "Upgraded to premium"})
}

// GET /api/tiers/current
func (h *TierHandler) GetCurrentTier(c *gin.Context) {
  userID := c.GetString("user_id")

  tier, err := h.tierRepo.GetUserTier(userID)
  if err != nil {
    c.JSON(500, gin.H{"error": "Failed to fetch tier"})
    return
  }

  c.JSON(200, gin.H{"tier": tier})
}
```

---

## Step 3: Frontend Auth Context

### 3.1 Auth Context

`src/contexts/AuthContext.tsx`:

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  displayName: string;
  tier: 'free' | 'premium';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  upgradeToPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error('Login failed');

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!response.ok) throw new Error('Registration failed');

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  };

  const upgradeToPremium = async () => {
    const response = await fetch('/api/tiers/upgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Upgrade failed');

    // Update user tier
    if (user) {
      setUser({ ...user, tier: 'premium' });
      localStorage.setItem('user', JSON.stringify({ ...user, tier: 'premium' }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        upgradeToPremium,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 3.2 Login Screen

`src/sections/user-authentication-and-tiers/pages/LoginPage.tsx`:

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/map');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-lime-500 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="font-bold text-white text-xl">GP</span>
          </div>
          <h1 className="text-3xl font-bold">Gas Peep</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Community fuel prices, real time
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-lime-500 hover:bg-lime-600 disabled:bg-slate-300 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-950 text-slate-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* OAuth */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 font-medium transition-colors"
          >
            Google
          </button>
          <button
            type="button"
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 font-medium transition-colors"
          >
            Apple
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-slate-600 dark:text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/auth/register')}
            className="text-lime-600 dark:text-lime-400 font-semibold hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
```

### 3.3 Register Screen

`src/sections/user-authentication-and-tiers/pages/RegisterPage.tsx`:

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export const RegisterPage: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, displayName);
      navigate('/map');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-lime-500 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="font-bold text-white text-xl">GP</span>
          </div>
          <h1 className="text-3xl font-bold">Gas Peep</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Join the fuel price community
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-lime-500 hover:bg-lime-600 disabled:bg-slate-300 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/auth/login')}
            className="text-lime-600 dark:text-lime-400 font-semibold hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
```

### 3.4 Tier Selection Screen

`src/sections/user-authentication-and-tiers/pages/TierSelectionPage.tsx`:

```tsx
import React from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Get started with Gas Peep',
    features: [
      'Browse fuel prices',
      'Submit prices (text, voice, photo)',
      'View station details',
      'Community feed',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 4.99,
    description: 'Unlock advanced features',
    features: [
      'All Free features',
      'Custom price alerts',
      'No ads',
      'Priority notifications',
      'Advanced filters',
      'Analytics dashboard',
    ],
  },
];

export const TierSelectionPage: React.FC = () => {
  const { upgradeToPremium } = useAuth();

  const handleUpgrade = async () => {
    try {
      await upgradeToPremium();
      alert('Upgraded to Premium!');
    } catch (error) {
      alert('Upgrade failed');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Choose Your Plan</h1>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-12">
          Pick the plan that fits your needs
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`p-6 rounded-lg border-2 transition-all ${
                tier.id === 'premium'
                  ? 'border-lime-500 bg-lime-50 dark:bg-lime-950'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {tier.id === 'premium' && (
                <div className="inline-block px-3 py-1 bg-lime-500 text-white text-xs font-bold rounded-full mb-2">
                  POPULAR
                </div>
              )}

              <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                {tier.description}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-bold">${tier.price}</span>
                {tier.price > 0 && <span className="text-slate-600 dark:text-slate-400">/month</span>}
              </div>

              <button
                onClick={tier.id === 'premium' ? handleUpgrade : undefined}
                className={`w-full py-2 rounded-lg font-semibold transition-colors mb-6 ${
                  tier.id === 'premium'
                    ? 'bg-lime-500 hover:bg-lime-600 text-white'
                    : 'border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tier.id === 'premium' ? 'Upgrade Now' : 'Current Plan'}
              </button>

              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check size={20} className="text-lime-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TierSelectionPage;
```

---

## Checklist for Phase 5

- [ ] JWT token generation and validation working
- [ ] Auth middleware protecting API routes
- [ ] Register endpoint creating users
- [ ] Login endpoint authenticating users
- [ ] Password hashing working securely
- [ ] Auth context created and working
- [ ] Login page with email/password
- [ ] Register page with validation
- [ ] Token stored in localStorage
- [ ] OAuth buttons UI (Google/Apple - implementation in phase 8)
- [ ] Tier selection page
- [ ] Upgrade endpoint working
- [ ] Protected routes gated by auth
- [ ] Premium routes gated by tier
- [ ] Error handling and validation
- [ ] Dark mode working

---

## Testing Auth

```bash
npm run dev

# Try registering a new account
# http://localhost3000/auth/register

# Try logging in
# http://localhost3000/auth/login

# After login, token should be in localStorage
# Should be redirected to /map
```

---

## Next Phase

→ Continue to **Phase 6: Alerts & Notifications** to add the premium alerts system.

Authentication is now secure and tier management is in place.
