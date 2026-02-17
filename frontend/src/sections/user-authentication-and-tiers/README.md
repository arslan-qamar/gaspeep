# User Authentication & Tiers - Section 5

This section implements the complete authentication experience and tier management for Gas Peep.

## 📁 Structure

```
user-authentication-and-tiers/
├── screens/
│   ├── SignInScreen.tsx          # Email/password + OAuth sign-in
│   ├── SignUpScreen.tsx          # Registration with tier selection
│   ├── AccountScreen.tsx         # User profile and tier management
│   └── TierComparisonScreen.tsx  # Feature comparison and upgrade flow
├── components/
│   ├── PasswordStrengthIndicator.tsx  # Password strength visual feedback
│   ├── TierCard.tsx                   # Tier selection card component
│   └── OAuthButton.tsx                # OAuth provider buttons
├── api/
│   └── authApi.ts                # Authentication API service layer
├── utils/
│   └── validation.ts             # Form validation utilities
├── types.ts                      # TypeScript type definitions
├── index.ts                      # Public exports
└── README.md                     # This file
```

## 🎯 Features Implemented

### Authentication
- ✅ Email/password sign up and sign in
- ✅ OAuth integration (Google, Apple) - UI ready, backend pending
- ✅ Password strength validation with visual feedback
- ✅ Email availability checking
- ✅ Password reset flow (UI ready)
- ✅ Session management with JWT tokens
- ✅ Form validation with helpful error messages

### Tier System
- ✅ Free tier (10 submissions/day, basic features)
- ✅ Premium tier (unlimited submissions, advanced features)
- ✅ Tier selection during sign up
- ✅ Upgrade flow with billing cycle toggle (monthly/annual)
- ✅ Feature comparison table
- ✅ Tier-specific UI elements and badges

### User Profile
- ✅ Account information display
- ✅ Contribution statistics (submissions, users helped, points)
- ✅ Recent submissions history
- ✅ Tier badge and status
- ✅ Upgrade prompts for free users
- ✅ Premium-only features (accuracy rating)
- ✅ Sign out functionality

## 🚀 Usage

### Adding Routes

Add these routes to your React Router configuration:

```tsx
import {
  SignInScreen,
  SignUpScreen,
  AccountScreen,
  TierComparisonScreen,
} from './sections/user-authentication-and-tiers';

// In your router:
<Route path="/auth/signin" element={<SignInScreen />} />
<Route path="/auth/signup" element={<SignUpScreen />} />
<Route path="/account" element={<AccountScreen />} />
<Route path="/auth/tier-comparison" element={<TierComparisonScreen />} />
```

### Using Components

```tsx
import { TierCard, PasswordStrengthIndicator } from './sections/user-authentication-and-tiers';

// Tier selection
<TierCard
  tier="premium"
  selected={selectedTier === 'premium'}
  onSelect={() => setSelectedTier('premium')}
/>

// Password strength
<PasswordStrengthIndicator
  strength={passwordStrength.strength}
  score={passwordStrength.score}
  feedback={passwordStrength.feedback}
/>
```

### Using API Functions

```tsx
import { signIn, signUp, getCurrentUser } from './sections/user-authentication-and-tiers';

// Sign in
const { token, user } = await signIn({ email, password });

// Sign up
const { token, user } = await signUp({
  name,
  email,
  password,
  passwordConfirmation,
  selectedTier: 'free',
  agreedToTerms: true,
});

// Get current user
const user = await getCurrentUser();
```

## 🎨 Design Features

### Visual Excellence
- Gradient backgrounds for Premium tier
- Smooth transitions and hover effects
- Loading states with spinners
- Success/error states with appropriate colors
- Dark mode support throughout
- Responsive design (mobile, tablet, desktop)

### User Experience
- Real-time password strength feedback
- Email availability checking with debounce
- Clear error messages
- Loading indicators
- Disabled states during async operations
- Keyboard navigation support

## 🔌 Backend Integration

### Required API Endpoints

The frontend expects these endpoints:

```
POST   /api/auth/signup              # Create new user
POST   /api/auth/signin              # Authenticate user
GET    /api/auth/me                  # Get current user
POST   /api/auth/password-reset      # Request password reset
GET    /api/users/profile            # Get user profile
PUT    /api/users/profile            # Update user profile
```

### Expected Response Formats

**Sign Up/Sign In Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "displayName": "User Name",
    "tier": "free",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**User Profile Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "displayName": "User Name",
  "tier": "free",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## 🔐 Security Considerations

- Passwords are never stored in plain text (backend handles hashing)
- JWT tokens stored in localStorage (consider httpOnly cookies for production)
- Form validation on both client and server
- Rate limiting on authentication endpoints (backend)
- HTTPS required for all authentication requests
- OAuth flows follow provider best practices

## 📝 Environment Variables

Add to your `.env` file:

```
VITE_API_URL=https://api.gaspeep.com
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Sign up with email/password (Free tier)
- [ ] Sign up with email/password (Premium tier)
- [ ] Sign in with valid credentials
- [ ] Sign in with invalid credentials
- [ ] Password strength indicator updates correctly
- [ ] Email availability check works
- [ ] Password confirmation validation
- [ ] Terms checkbox required
- [ ] Tier selection works
- [ ] Account screen displays user data
- [ ] Statistics display correctly
- [ ] Recent submissions show
- [ ] Upgrade CTA visible for free users
- [ ] Tier comparison screen loads
- [ ] Billing cycle toggle works
- [ ] FAQ accordion expands/collapses
- [ ] Sign out works
- [ ] Dark mode works on all screens
- [ ] Mobile responsive design works

## 🚧 TODO / Future Enhancements

- [ ] Implement OAuth backend integration
- [ ] Add password reset email flow
- [ ] Implement payment processing (Stripe)
- [ ] Add email verification flow
- [ ] Add two-factor authentication
- [ ] Add profile picture upload
- [ ] Add notification preferences management
- [ ] Add privacy settings management
- [ ] Add account deletion flow
- [ ] Add session management across tabs
- [ ] Add "Remember me" functionality
- [ ] Add social profile import from OAuth

## 📚 Related Sections

- **Section 2:** Shell (Navigation) - Integrates user menu
- **Section 4:** Price Submission - Requires authentication
- **Section 6:** Alerts & Notifications - Premium feature
- **Section 7:** Station Owner Dashboard - Requires verification

## 🎓 Key Learnings

1. **Password Validation:** Real-time feedback improves UX significantly
2. **Email Checking:** Debouncing prevents excessive API calls
3. **Tier System:** Clear visual differentiation between tiers drives upgrades
4. **Error Handling:** Specific, actionable error messages reduce support tickets
5. **Loading States:** Skeleton screens and spinners improve perceived performance

## 📞 Support

For questions or issues with this section, refer to:
- Product spec: `product-plan/sections/user-authentication-and-tiers/spec.md`
- Test scenarios: `product-plan/sections/user-authentication-and-tiers/tests.md`
- Type definitions: `types.ts`
