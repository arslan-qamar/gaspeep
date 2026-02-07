# User Authentication & Tiers — Test Specifications

Test these scenarios to ensure the User Authentication & Tiers section meets requirements.

---

## Sign Up Flow Tests

### Flow 1: Basic Email/Password Sign Up (Free Tier)
**Given:** Unauthenticated user on sign up screen  
**When:** User enters name, email, password, confirms password, and selects Free tier  
**Then:**
- [ ] Name field accepts input
- [ ] Email field validates format
- [ ] Password field accepts input
- [ ] Confirm password matches validation works
- [ ] Free tier card selectable
- [ ] Submit button enabled
- [ ] Account created successfully
- [ ] User redirected to map/onboarding

### Flow 2: Sign Up with Premium Tier
**Given:** User on sign up screen  
**When:** User selects Premium tier and completes signup  
**Then:**
- [ ] Premium tier card selectable
- [ ] Premium tier card highlighted when selected
- [ ] Account created with Premium tier
- [ ] Payment screen may appear (implementation choice)
- [ ] User has Premium features enabled

### Flow 3: OAuth Sign Up (Google)
**Given:** User on sign up screen  
**When:** User clicks "Sign up with Google"  
**Then:**
- [ ] Google OAuth dialog opens
- [ ] User logs into Google (or already logged in)
- [ ] Consent screen shown
- [ ] User redirected to tier selection (or defaults to Free)
- [ ] Account created with Google credentials
- [ ] User logged in

### Flow 4: OAuth Sign Up (Apple)
**Given:** User on sign up screen  
**When:** User clicks "Sign up with Apple"  
**Then:**
- [ ] Apple OAuth dialog opens
- [ ] User authenticates with Apple
- [ ] Consent screen shown
- [ ] User redirected to tier selection
- [ ] Account created with Apple credentials
- [ ] User logged in

### Flow 5: Sign Up Form Validation
**Given:** User entering invalid data  
**When:** User enters short password (< 8 chars)  
**Then:**
- [ ] Password strength meter shows "Weak"
- [ ] Submit button disabled or warning shown
- [ ] Error message: "Password must be at least 8 characters"

### Flow 6: Email Already Exists
**Given:** Email already registered in system  
**When:** User tries to sign up with existing email  
**Then:**
- [ ] Error message: "Email already registered"
- [ ] Link to "Sign In" instead
- [ ] Form not submitted

### Flow 7: Terms & Privacy Acceptance
**Given:** User on sign up form  
**When:** User doesn't check Terms checkbox and tries to submit  
**Then:**
- [ ] Error message: "Please accept terms and privacy policy"
- [ ] Submit blocked
- [ ] Can expand terms for reading
- [ ] Can expand privacy policy for reading

---

## Sign In Flow Tests

### Flow 1: Email/Password Sign In
**Given:** Registered user on sign in screen  
**When:** User enters email and password  
**Then:**
- [ ] Email field accepts input
- [ ] Password field accepts input (masked)
- [ ] Submit button clickable
- [ ] Authentication succeeds
- [ ] User redirected to map or profile
- [ ] JWT token stored securely

### Flow 2: OAuth Sign In (Google)
**Given:** Existing Google-authenticated user  
**When:** User clicks "Sign in with Google"  
**Then:**
- [ ] Google OAuth dialog opens
- [ ] User authenticates
- [ ] User logged in
- [ ] Redirected to map/dashboard

### Flow 3: OAuth Sign In (Apple)
**Given:** Existing Apple-authenticated user  
**When:** User clicks "Sign in with Apple"  
**Then:**
- [ ] Apple OAuth dialog opens
- [ ] User authenticates
- [ ] User logged in
- [ ] Redirected to map/dashboard

### Flow 4: Wrong Password
**Given:** Registered user with incorrect password  
**When:** User enters email and wrong password  
**Then:**
- [ ] Error message: "Invalid email or password"
- [ ] Form not submitted
- [ ] Can retry
- [ ] After 3 failed attempts: "Account temporarily locked" (optional)

### Flow 5: Non-existent Email
**Given:** Email not registered  
**When:** User tries to sign in with unknown email  
**Then:**
- [ ] Error message: "No account found with this email"
- [ ] Suggestion: "Sign up instead" link
- [ ] Form not submitted

### Flow 6: Show/Hide Password
**Given:** Password field with input  
**When:** User clicks show/hide toggle  
**Then:**
- [ ] Password text becomes visible (show)
- [ ] Password text becomes masked (hide)
- [ ] Toggle icon changes

### Flow 7: Remember Me (Optional)
**Given:** Remember me checkbox available  
**When:** User checks "Remember me" and signs in  
**Then:**
- [ ] Credentials may be stored securely (or token extended)
- [ ] User stays logged in longer
- [ ] Or defaults to unchecked (design choice)

---

## Password Reset Flow Tests

### Flow 1: Request Password Reset
**Given:** User on sign in screen  
**When:** User clicks "Forgot password?"  
**Then:**
- [ ] Password reset form appears or modal opens
- [ ] Email field visible
- [ ] Can enter registered email

### Flow 2: Reset Email Sent
**Given:** User enters email in password reset form  
**When:** User clicks "Send Reset Link"  
**Then:**
- [ ] Email validation succeeds
- [ ] Confirmation message: "Check your email for reset link"
- [ ] Reset email sent to inbox
- [ ] Link is valid for 1 hour (implementation detail)

### Flow 3: Click Reset Link
**Given:** User receives reset email  
**When:** User clicks reset link in email  
**Then:**
- [ ] Link opens password reset form in browser
- [ ] New password field visible
- [ ] Confirm password field visible
- [ ] User can enter new password

### Flow 4: Set New Password
**Given:** User on reset form with valid link  
**When:** User enters new password and confirms  
**Then:**
- [ ] Password field accepts input
- [ ] Confirm password matches validation works
- [ ] Submit button enabled
- [ ] Password updated successfully
- [ ] User can sign in with new password
- [ ] Old password no longer works

### Flow 5: Expired Reset Link
**Given:** Reset link older than 1 hour  
**When:** User clicks link or tries to reset  
**Then:**
- [ ] Error message: "Reset link expired"
- [ ] Link to request new reset link
- [ ] User can start password reset again

---

## Tier System Tests

### Tier Test 1: Free Tier Benefits
**Given:** New Free user  
**When:** User navigates to map  
**Then:**
- [ ] Can browse map with ads
- [ ] Can submit prices (text/voice/photo)
- [ ] Cannot access alerts feature
- [ ] Alerts section shows "Premium only" message
- [ ] Can see "Upgrade to Premium" button

### Tier Test 2: Premium Tier Benefits
**Given:** Premium user  
**When:** User navigates to premium features  
**Then:**
- [ ] Ad-free map browsing
- [ ] Can create price alerts
- [ ] Can view notifications
- [ ] Premium badges show on profile
- [ ] Can manage subscription

### Tier Test 3: Tier Indicator
**Given:** Any logged-in user  
**When:** User views profile  
**Then:**
- [ ] Current tier displays clearly
- [ ] Free users see upgrade prompt
- [ ] Premium users see subscription info

### Tier Test 4: Feature Gating
**Given:** Free user on alerts page  
**When:** User tries to create alert  
**Then:**
- [ ] Feature locked
- [ ] "This feature is Premium only" message
- [ ] "Upgrade to Premium" button shown
- [ ] Explains benefits of Premium

---

## Profile Management Tests

### Profile Test 1: View Profile
**Given:** Authenticated user  
**When:** User navigates to profile screen  
**Then:**
- [ ] User name displays
- [ ] User email displays
- [ ] Current tier displays
- [ ] Account creation date displays
- [ ] Edit button visible

### Profile Test 2: Edit Profile
**Given:** User viewing their profile  
**When:** User clicks edit and changes display name  
**Then:**
- [ ] Edit form opens
- [ ] Can change display name
- [ ] Can update location preferences
- [ ] Save button saves changes
- [ ] Updates appear immediately

### Profile Test 3: Account Deletion
**Given:** User in settings/profile  
**When:** User requests account deletion  
**Then:**
- [ ] Confirmation dialog appears
- [ ] Warning about data loss
- [ ] Requires password confirmation
- [ ] Account deleted after confirmation
- [ ] User logged out

### Profile Test 4: Notification Preferences
**Given:** User in settings  
**When:** User toggles notification preference  
**Then:**
- [ ] Can toggle price alerts on/off
- [ ] Can toggle broadcasts on/off
- [ ] Changes saved
- [ ] Affects future notifications

---

## Account Linking Tests

### Linking Test 1: Link OAuth to Email Account
**Given:** User signed up with email  
**When:** User in profile chooses "Link Google Account"  
**Then:**
- [ ] OAuth dialog appears
- [ ] User authenticates with Google
- [ ] Google account linked
- [ ] Can sign in with either method
- [ ] Single account used (not duplicate)

### Linking Test 2: Unlink OAuth Account
**Given:** User with linked OAuth account  
**When:** User chooses to unlink  
**Then:**
- [ ] Confirmation shown
- [ ] Account unlinked
- [ ] Can no longer sign in with that method
- [ ] Must use other auth method

---

## Session Management Tests

### Session Test 1: JWT Token Expiration
**Given:** User with expired JWT token  
**When:** User makes API request  
**Then:**
- [ ] Request fails with 401 Unauthorized
- [ ] Refresh token used to get new token (if applicable)
- [ ] User stays logged in if refresh succeeds
- [ ] User redirected to login if refresh fails

### Session Test 2: Logout
**Given:** Authenticated user  
**When:** User clicks "Logout"  
**Then:**
- [ ] Session terminated
- [ ] JWT token cleared
- [ ] User redirected to login screen
- [ ] Cannot access protected routes

### Session Test 3: Session Across Tabs
**Given:** User logged in in one browser tab  
**When:** User opens another tab of the app  
**Then:**
- [ ] User already logged in (shared session)
- [ ] Both tabs share authentication state
- [ ] Logout in one tab affects both (eventually)

---

## Error State Tests

### Error 1: Network Error During Sign Up
**Given:** User submitting sign up form  
**When:** Network request fails  
**Then:**
- [ ] Error message displayed
- [ ] "Retry" button available
- [ ] Form data preserved
- [ ] User doesn't lose entered data

### Error 2: Server Error
**Given:** Sign up or sign in request  
**When:** Server returns 500 error  
**Then:**
- [ ] User-friendly error message shown
- [ ] "Please try again later" message
- [ ] Retry button available
- [ ] Not technical error details

### Error 3: Rate Limiting
**Given:** User making many login attempts  
**When:** Rate limit exceeded  
**Then:**
- [ ] Error message: "Too many attempts. Try again in 15 minutes"
- [ ] Login button disabled temporarily

---

## Responsive Design Tests

### Mobile (< 768px)
**When:** Viewing auth screens on phone  
**Then:**
- [ ] Form takes full width with padding
- [ ] Input fields large enough for touch
- [ ] Buttons large enough for touch
- [ ] Tier cards stack vertically
- [ ] OAuth buttons full width

### Tablet (768px - 1024px)
**When:** Viewing auth screens on tablet  
**Then:**
- [ ] Form centers or uses reasonable width
- [ ] Touch targets adequate
- [ ] Tier cards displayed side-by-side (optional)

### Desktop (> 1024px)
**When:** Viewing auth screens on desktop  
**Then:**
- [ ] Form max-width applied (e.g., 500px)
- [ ] Form centered
- [ ] Tier cards displayed horizontally
- [ ] Mouse interactions work

---

## Dark Mode Tests

### Dark Mode 1: Form Appearance
**When:** Dark mode enabled  
**Then:**
- [ ] Form background dark
- [ ] Input fields dark background
- [ ] Text light and readable
- [ ] Labels visible
- [ ] Placeholders visible

### Dark Mode 2: Tier Cards
**When:** Dark mode during tier selection  
**Then:**
- [ ] Cards dark background
- [ ] Text readable
- [ ] Selected card clearly indicated

---

## Accessibility Tests

### Accessibility 1: Keyboard Navigation
**When:** Using keyboard only  
**Then:**
- [ ] Tab key navigates through form fields
- [ ] Enter submits form
- [ ] Escape closes modals
- [ ] All buttons reachable

### Accessibility 2: Screen Reader
**When:** Using screen reader  
**Then:**
- [ ] Form labels announced
- [ ] Input purposes clear
- [ ] Error messages announced
- [ ] Button purposes clear
- [ ] Tier card descriptions announced

### Accessibility 3: Color Contrast
**When:** Viewing forms  
**Then:**
- [ ] All text readable (min 4.5:1 contrast)
- [ ] Input fields readable
- [ ] Error text readable
- [ ] Selected tier indicated not just by color

---

## Integration Tests

### Integration 1: Auth State Persistence
**Given:** User logs in  
**When:** User closes browser and reopens app  
**Then:**
- [ ] User still logged in (if token valid)
- [ ] Session persists across browser restart

### Integration 2: Tier Updates
**Given:** Free user upgrades to Premium  
**When:** Upgrade completes  
**Then:**
- [ ] Tier updated in backend
- [ ] UI reflects new tier immediately
- [ ] Premium features unlocked
- [ ] Ads removed from map

### Integration 3: User Creation
**Given:** User signs up successfully  
**When:** Checking backend database  
**Then:**
- [ ] User record created
- [ ] Email stored correctly
- [ ] Tier set correctly
- [ ] Password hashed (not stored plaintext)

---

## Success Criteria

✅ Sign up with email and OAuth working  
✅ Sign in with email and OAuth working  
✅ Password reset functional  
✅ Tier system enforces access control  
✅ Profile management working  
✅ Session management secure  
✅ Form validation prevents invalid data  
✅ Error messages helpful and actionable  
✅ UI responsive across all screen sizes  
✅ Dark mode fully functional  
✅ Accessibility standards met (WCAG 2.1 AA)  
