# User Authentication & Tiers

## Section Description

This section covers the complete authentication experience and tier management for Gas Peep. Users can sign up with email or social providers, manage their accounts, and understand the benefits of upgrading to Premium. The system supports both free and premium tiers, with clear value propositions and upgrade paths.

Free tier users can submit up to 10 price updates per day and view basic station information. Premium users get unlimited submissions, advanced filters, price alerts, ad-free experience, and early access to new features.

---

## Screen Designs

### 1. SignInScreen

**Purpose:** Allow existing users to authenticate and access their account.

**Components:**
- App branding (Gas Peep logo and tagline)
- Email input field
- Password input field with show/hide toggle
- "Sign In" primary button
- "Forgot password?" link
- Social sign-in buttons (Google, Apple)
- Divider with "or continue with email"
- "Don't have an account? Sign up" link at bottom
- Error messages for invalid credentials

**States:**
- Default: Empty form ready for input
- Filled: User has entered email and password
- Loading: Sign-in request in progress (disabled button, spinner)
- Error: Invalid credentials message displayed
- Success: Brief success indicator before navigation

**Interactions:**
- Email/password validation on blur
- Show/hide password toggle
- Social sign-in redirects to provider OAuth
- Forgot password opens password reset flow
- Sign up link navigates to SignUpScreen

**Data Requirements:**
- User authentication credentials
- OAuth provider configuration
- Error messages for various failure scenarios

---

### 2. SignUpScreen

**Purpose:** Allow new users to create an account and choose their tier.

**Components:**
- App branding with value proposition
- Name input field
- Email input field with validation indicator
- Password input field with strength meter
- Password confirmation field
- Terms and privacy policy checkbox
- Tier selection cards (Free vs Premium)
- "Create Account" primary button
- Social sign-up buttons (Google, Apple)
- "Already have an account? Sign in" link

**States:**
- Default: Empty form with Free tier pre-selected
- Validating: Real-time validation feedback on inputs
- Loading: Account creation in progress
- Error: Validation errors or email already exists
- Success: Account created confirmation before onboarding

**Tier Selection Cards:**
- **Free Tier Card:**
  - "Free" badge
  - "10 submissions per day" limit
  - "Basic station info" feature
  - "Community support" feature
  - "Start Free" button (outlined)
  
- **Premium Tier Card:**
  - "Premium" badge with gradient
  - "Unlimited submissions" feature
  - "Advanced filters & alerts" feature
  - "Ad-free experience" feature
  - "Priority support" feature
  - "$4.99/month" pricing
  - "Start Premium" button (primary, highlighted)

**Interactions:**
- Real-time email availability check
- Password strength indicator (weak/medium/strong)
- Toggle between Free and Premium tier cards
- Social sign-up redirects to provider OAuth with tier selection
- Terms/privacy links open modal or external page

**Data Requirements:**
- Email validation and uniqueness check
- Password strength requirements
- Available OAuth providers
- Tier feature comparison data
- Pricing information

---

### 3. AccountScreen

**Purpose:** Display user profile information, account statistics, and tier management.

**Components:**
- User profile header (avatar, name, email, member since)
- Current tier badge with benefits summary
- Account statistics cards:
  - Total submissions count
  - Users helped count
  - Points earned
  - Accuracy rating (Premium feature)
- Activity section:
  - Recent submissions list (last 5)
  - Contribution streak indicator
- Settings sections:
  - Profile settings (name, email, avatar)
  - Notification preferences
  - Privacy settings
  - Connected accounts (OAuth providers)
- Tier management button:
  - Free users: "Upgrade to Premium" (prominent CTA)
  - Premium users: "Manage Subscription"
- Sign out button (secondary, bottom of page)

**States:**
- Free User View: Shows upgrade prompts and limited stats
- Premium User View: Shows full stats and subscription management
- Loading: Skeleton loaders for stats while fetching
- Editing: Inline editing mode for profile fields

**Statistics Display:**
- **Free User Stats:**
  - Total submissions with daily limit indicator (7/10 today)
  - Users helped count
  - Points earned (with note: "Premium: 2x points")
  - Locked accuracy rating with upgrade prompt
  
- **Premium User Stats:**
  - Total submissions with "unlimited" badge
  - Users helped count (enhanced visibility)
  - Points earned (2x multiplier active)
  - Accuracy rating with trend indicator

**Recent Activity:**
- Last 5 submissions with timestamps
- Station names and fuel types
- Status indicators (published/verifying)
- "View All Submissions" link

**Interactions:**
- Edit profile fields inline (name, email)
- Upload new avatar image
- Toggle notification preferences
- Disconnect OAuth accounts
- Upgrade to Premium opens TierComparisonScreen
- Manage subscription opens external billing portal
- Sign out with confirmation dialog

**Data Requirements:**
- User profile data (name, email, avatar, join date)
- Current tier and subscription status
- Contribution statistics (lifetime and recent)
- Recent submissions history
- Notification and privacy preferences
- Connected OAuth providers

---

### 4. TierComparisonScreen

**Purpose:** Help users understand tier differences and make informed upgrade decisions.

**Components:**
- Page header: "Choose Your Plan"
- Subtitle: "Get more from your contributions"
- Tier comparison table with feature rows:
  - Daily submissions limit
  - Station information access
  - Price alerts and notifications
  - Advanced filters
  - Historical price charts
  - Ad-free experience
  - Priority support
  - Accuracy badges
  - Early feature access
  - Points multiplier
- Free and Premium column headers with pricing
- Feature checkmarks, crosses, and value indicators
- "Current Plan" badge on active tier
- CTA buttons at bottom of each column
- Monthly/annual billing toggle (Premium shows savings)
- Testimonials or social proof section
- FAQ accordion with common questions
- Money-back guarantee badge (Premium)

**States:**
- Free User View: Premium column highlighted with CTA
- Premium User View: Current plan badge, manage subscription button
- Monthly Billing: Shows $4.99/month pricing
- Annual Billing: Shows $49.99/year pricing with "2 months free" badge

**Feature Comparison Table:**

| Feature | Free | Premium |
|---------|------|---------|
| Daily Submissions | 10 | Unlimited |
| Station Info | Basic | Detailed |
| Price Alerts | None | Custom alerts |
| Advanced Filters | ❌ | ✅ |
| Historical Charts | ❌ | ✅ Full history |
| Experience | With ads | Ad-free |
| Support | Community | Priority |
| Accuracy Badge | ❌ | ✅ |
| New Features | ❌ | Early access |
| Points | 1x | 2x multiplier |

**Billing Toggle:**
- Monthly: $4.99/month (billed monthly)
- Annual: $49.99/year (save $10, ~$4.17/month)

**CTA Buttons:**
- Free users: "Upgrade to Premium" (opens payment flow)
- Premium users (monthly): "Switch to Annual" (save money prompt)
- Premium users (annual): "Manage Subscription" (external link)

**Social Proof:**
- "10,000+ Premium members" stat
- Star rating (4.8/5) with review count
- Featured testimonials from power users

**FAQ Section:**
- Can I cancel anytime? (Yes, no commitments)
- What happens to my data if I downgrade? (Submissions preserved, access limited)
- Do you offer refunds? (30-day money-back guarantee)
- How do I upgrade? (One-tap upgrade process)

**Interactions:**
- Toggle between monthly and annual billing
- Expand/collapse FAQ items
- Upgrade button opens payment flow (Stripe/Apple Pay/Google Pay)
- Feature tooltips with detailed explanations
- "Contact sales" link for custom plans or questions

**Data Requirements:**
- Current user tier and billing cycle
- Feature comparison data
- Pricing information (monthly and annual)
- Testimonials and ratings
- FAQ content

---

## User Flows

### New User Sign-Up Flow
1. User lands on SignUpScreen
2. User enters name, email, password
3. User reviews tier options (Free pre-selected)
4. User optionally selects Premium tier
5. User checks terms agreement checkbox
6. User taps "Create Account"
7. System validates inputs and creates account
8. If Premium: Payment flow initiated
9. Success confirmation displayed
10. User redirected to onboarding or home

### Existing User Sign-In Flow
1. User lands on SignInScreen
2. User enters email and password
3. User taps "Sign In"
4. System validates credentials
5. If valid: User redirected to home
6. If invalid: Error message displayed with retry option

### Social Authentication Flow
1. User taps Google or Apple sign-in button
2. System redirects to OAuth provider
3. User authenticates with provider
4. Provider returns to app with credentials
5. If new user: Quick tier selection modal shown
6. Account created/linked
7. User redirected to home

### Password Reset Flow
1. User taps "Forgot password?" on SignInScreen
2. Modal opens requesting email address
3. User enters email and submits
4. System sends reset link to email
5. Confirmation message displayed
6. User receives email with magic link
7. User taps link to set new password
8. User creates new password
9. Auto sign-in and redirect to home

### Free to Premium Upgrade Flow
1. User viewing AccountScreen sees upgrade CTA
2. User taps "Upgrade to Premium"
3. TierComparisonScreen opens with features highlighted
4. User reviews benefits and pricing
5. User selects monthly or annual billing
6. User taps "Upgrade to Premium"
7. Payment sheet opens (Stripe/Apple Pay/Google Pay)
8. User completes payment
9. Success confirmation with confetti animation
10. Account screen updates with Premium badge
11. Premium features immediately accessible

### Subscription Management Flow
1. Premium user opens AccountScreen
2. User taps "Manage Subscription"
3. External billing portal opens (Stripe customer portal)
4. User can update payment method, change plan, or cancel
5. Changes sync back to app automatically

---

## Edge Cases

### Authentication Edge Cases
- **Email Already Exists:** Clear error message with sign-in link
- **Weak Password:** Real-time feedback, must meet requirements
- **Network Error During Sign-In:** Retry button with offline indicator
- **Expired Session:** Auto sign-out with reason, redirect to SignInScreen
- **OAuth Failure:** Fallback to email authentication with error explanation

### Tier Management Edge Cases
- **Payment Failure on Upgrade:** Clear error, payment method update prompt
- **Downgrade Mid-Billing Cycle:** Changes apply at end of period, data preserved
- **Premium User Hits Free Limit After Downgrade:** Soft limit warning, upgrade prompt
- **Multiple Device Sign-Ins:** Sessions synced, concurrent access allowed
- **Trial Period Expiration:** Grace period notification, seamless tier transition

### Account Edge Cases
- **Email Already Verified:** Skip verification step
- **Email Verification Required:** Banner on all pages until verified
- **Profile Update Conflicts:** Last-write-wins with timestamp
- **Avatar Upload Fails:** Fallback to initials avatar, retry option
- **Subscription Status Out of Sync:** Webhook refresh, manual refresh button

---

## Success Metrics

### Engagement Metrics
- Sign-up completion rate (target: >70%)
- Social auth adoption rate (target: >40%)
- Email verification rate (target: >85%)
- Daily active users (DAU) retention
- Sign-in success rate (target: >95%)

### Conversion Metrics
- Free to Premium conversion rate (target: >10%)
- Annual billing selection rate (target: >30% of Premium)
- Trial-to-paid conversion (if trial implemented, target: >60%)
- Upgrade CTA click-through rate
- TierComparisonScreen view-to-upgrade rate

### Retention Metrics
- Premium subscriber churn rate (target: <5% monthly)
- Free user retention (7-day, 30-day)
- Premium user retention (30-day, 90-day, 180-day)
- Downgrade rate (Premium to Free, target: <3% monthly)

### Support Metrics
- Password reset success rate (target: >90%)
- Authentication error rate (target: <5%)
- Payment failure rate (target: <2%)
- Support tickets related to auth (target: <5% of total)

### Quality Metrics
- Time to sign up completion (target: <60 seconds)
- Time to sign in (target: <5 seconds)
- OAuth redirect success rate (target: >95%)
- Account screen load time (target: <1 second)

---

## Technical Notes

### Authentication Implementation
- Use secure token-based authentication (JWT)
- Implement OAuth 2.0 for social providers
- Store passwords with bcrypt or similar (never plaintext)
- Rate limiting on sign-in attempts (prevent brute force)
- Email verification required for critical actions

### Tier Management
- Subscription handled via Stripe or similar payment processor
- Webhook integration for real-time subscription status updates
- Grace period handling for failed payments (3-day retry)
- Proration for mid-cycle plan changes
- Subscription data cached locally, synced on app launch

### Security Considerations
- HTTPS required for all authentication endpoints
- Secure session management with timeout
- Two-factor authentication (optional, future enhancement)
- Audit logging for account changes
- GDPR compliance for user data

### Performance
- Lazy load tier comparison table data
- Cache user profile locally with periodic refresh
- Optimize avatar image loading (thumbnail + full size)
- Minimize auth token refresh calls

---

## Design Considerations

### Visual Hierarchy
- Clear CTAs for primary actions (sign up, upgrade)
- Tier badges use gradient for Premium, solid for Free
- Success states use green, errors use red with clear icons
- Loading states use skeleton screens, not blank pages

### Accessibility
- All form inputs have proper labels
- Error messages announced to screen readers
- Password strength indicators have text alternatives
- Touch targets minimum 44x44px
- Sufficient color contrast for tier badges

### Mobile Responsiveness
- Forms use appropriate keyboard types (email, password)
- Social buttons stack vertically on small screens
- Tier comparison table scrolls horizontally if needed
- Bottom-fixed CTAs on long scrolling pages

### Microcopy
- Error messages are helpful, not blaming ("Email not found" vs "Invalid credentials")
- Success messages are encouraging ("Welcome back!" vs "Sign in successful")
- Tier descriptions focus on benefits, not features
- Button text is action-oriented ("Start Premium" vs "Select")

### Animation & Feedback
- Success confetti animation on upgrade completion
- Smooth transitions between sign-in and sign-up
- Loading spinners on async operations
- Haptic feedback on successful authentication (mobile)

---

## Future Enhancements

- Two-factor authentication (SMS or authenticator app)
- Social profile import (avatar, name from OAuth)
- Referral program with rewards
- Team/family plans
- Enterprise tier for fleet managers
- Passwordless authentication (magic links)
- Biometric authentication (Face ID, Touch ID)
- Custom tier perks based on contribution level
