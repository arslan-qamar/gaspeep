# User Authentication & Tiers — Component Structure

## Components to Implement

### 1. SignInScreen.tsx
User login interface with email/password and OAuth options.

**Props:**
```typescript
interface SignInScreenProps {
  onSignInSuccess: () => void;
  isLoading?: boolean;
}
```

**Features:**
- Email input with validation
- Password input with show/hide toggle
- Sign In button
- OAuth buttons (Google, Apple)
- "Forgot Password" link
- "Don't have account?" link to SignUp
- Error message display
- Remember me checkbox (optional)

### 2. SignUpScreen.tsx
Account creation with tier selection.

**Props:**
```typescript
interface SignUpScreenProps {
  onSignUpSuccess: () => void;
  isLoading?: boolean;
}
```

**Features:**
- Name input field
- Email input with validation
- Password input with strength meter
- Confirm password field
- Terms/Privacy checkbox
- Tier selection cards (Free vs Premium)
- OAuth sign-up options
- "Already have account?" link to SignIn
- Real-time validation feedback

### 3. TierSelectionCard.tsx
Premium vs Free tier selection during signup.

**Props:**
```typescript
interface TierSelectionCardProps {
  tier: 'free' | 'premium';
  isSelected: boolean;
  onSelect: (tier: 'free' | 'premium') => void;
  price?: string;
}
```

**Features:**
- Tier name and badge
- Feature list display
- Price for premium
- Selection indicator
- Hover state highlighting

### 4. ProfileScreen.tsx
User profile management and settings.

**Props:**
```typescript
interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onUpdateProfile: (updates: Partial<User>) => void;
}
```

**Features:**
- Display user info (name, email, tier)
- Edit profile fields
- Tier indicator with upgrade option
- Account settings
- Notification preferences
- Submission history
- Logout button

### 5. TierUpgradeModal.tsx
Premium promotion modal.

**Props:**
```typescript
interface TierUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  currentTier: 'free' | 'premium';
}
```

**Features:**
- Feature comparison table
- Upgrade benefits highlight
- Pricing information
- Call-to-action button
- Close button

---

## Data Flow

```
AuthContainer
├── Unauthenticated:
│   ├── SignInScreen
│   └── SignUpScreen (with TierSelectionCard)
│
└── Authenticated:
    ├── ProfileScreen
    └── TierUpgradeModal (conditional)
```

---

## Integration Checklist

- [ ] Email validation works correctly
- [ ] Password strength meter displays accurately
- [ ] OAuth integration with Google/Apple
- [ ] Sign up creates user with selected tier
- [ ] Sign in authenticates correctly
- [ ] JWT token stored securely
- [ ] Profile displays current user data
- [ ] Profile updates reflect immediately
- [ ] Tier upgrade initiates payment flow
- [ ] Error messages are helpful
- [ ] Loading states shown during auth
- [ ] Form validation prevents submission of invalid data
- [ ] Responsive on mobile < 768px
- [ ] Responsive on tablet/desktop ≥ 768px
- [ ] Dark mode fully functional
- [ ] Password reset email sends

---

## Styling (Tailwind CSS v4)

```css
/* Auth container */
.auth-container {
  @apply min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900;
  @apply p-4;
}

/* Form card */
.auth-form-card {
  @apply w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6;
}

/* Input fields */
.auth-input {
  @apply w-full px-3 py-2 mt-1 border border-slate-300 dark:border-slate-600 rounded-lg;
  @apply bg-white dark:bg-slate-700 text-slate-900 dark:text-white;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

/* Tier selection cards */
.tier-card {
  @apply p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer;
  @apply hover:border-blue-500 transition-colors;
}

.tier-card.selected {
  @apply border-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

/* OAuth buttons */
.oauth-button {
  @apply w-full py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-lg;
  @apply hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors;
}

/* Password strength meter */
.strength-meter {
  @apply h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1;
}
```

---

## See Also
- Specification: [spec.md](spec.md)
- Types: [types.ts](types.ts)
- Sample Data: [sample-data.json](sample-data.json)
- Tests: [tests.md](tests.md)
