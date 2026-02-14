import type {
    User,
    AuthCredentials,
    SignUpData,
    EmailAvailability,
    ContributionStats,
    RecentSubmission,
    AccountSettings,
    SubscriptionInfo,
    PasswordResetConfirm,
} from '../types';

// Prefer an explicit VITE_API_URL when provided. If not provided, use
// a relative `/api` so the dev server proxy or same-origin host is used
// (avoids mixed-content when the page is loaded over HTTPS).
const rawApiUrl = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = rawApiUrl
    ? (rawApiUrl.endsWith('/api') ? rawApiUrl : rawApiUrl.replace(/\/+$/, '') + '/api')
    : '/api';

interface AuthResponse {
    token: string;
    user: User;
}

/**
 * Sign up a new user
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: data.email,
            password: data.password,
            displayName: data.name,
            tier: data.selectedTier,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sign up');
    }

    const result = await response.json();

    // Store token in localStorage (use unified key expected elsewhere)
    localStorage.setItem('auth_token', result.token);

    return result;
}

/**
 * Sign in an existing user
 */
export async function signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid credentials');
    }

    const result = await response.json();

    // Store token in localStorage (use unified key expected elsewhere)
    localStorage.setItem('auth_token', result.token);

    return result;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            throw new Error('Session expired');
        }
        throw new Error('Failed to fetch user');
    }

    return response.json();
}

/**
 * Sign out the current user
 */
export function signOut(): void {
    localStorage.removeItem('auth_token');
}

/**
 * Check if email is available
 */
export async function checkEmailAvailability(email: string): Promise<EmailAvailability> {
    // For now, simulate the check
    // In production, this would call the backend
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Simulate some taken emails
    const takenEmails = ['sarah.chen@example.com', 'test@example.com'];
    const available = !takenEmails.includes(email.toLowerCase());

    return {
        available,
        suggestion: available ? undefined : `${email.split('@')[0]}.new@${email.split('@')[1]}`,
    };
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/password-reset`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        throw new Error('Failed to send password reset email');
    }
}

/**
 * Reset password with token from email link
 */
export async function resetPassword(data: PasswordResetConfirm): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: data.token,
            password: data.newPassword,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset password');
    }
}

/**
 * Get user profile
 */
export async function getUserProfile(): Promise<User> {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }

    const data = await response.json();

    // Map backend fields to frontend `User` shape
    const user: User = {
        id: data.id,
        name: data.displayName ?? data.name ?? '',
        email: data.email,
        avatar: data.avatar ?? undefined,
        memberSince: data.createdAt ?? data.memberSince ?? new Date().toISOString(),
        tier: (data.tier as any) ?? 'free',
        subscriptionStatus: data.subscriptionStatus ?? undefined,
        billingCycle: data.billingCycle ?? undefined,
        emailVerified: data.emailVerified ?? false,
        connectedProviders: data.connectedProviders ?? [],
    };

    return user;
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<User>): Promise<User> {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Not authenticated');
    }

    // Map frontend update fields to backend expected fields
    const payload: any = {};
    if (typeof updates.name !== 'undefined') payload.displayName = updates.name;
    if (typeof updates.tier !== 'undefined') payload.tier = updates.tier;
    if (typeof updates.email !== 'undefined') payload.email = updates.email;

    const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('Failed to update profile');
    }

    // Backend returns a minimal confirmation; fetch and return the fresh user
    return getUserProfile();
}

/**
 * Get contribution stats (mock for now)
 */
export async function getContributionStats(): Promise<ContributionStats> {
    // Mock data - in production this would come from the backend
    return {
        totalSubmissions: 87,
        usersHelped: 0, 
        pointsEarned: 0,
        contributionStreak: 5,
        dailySubmissionsUsed: 7,
        dailySubmissionsLimit: 10,
    };
}

/**
 * Get recent submissions (mock for now)
 */
export async function getRecentSubmissions(): Promise<RecentSubmission[]> {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Not authenticated');
    }

    const resp = await fetch(`${API_BASE_URL}/price-submissions/my-submissions`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!resp.ok) {
        if (resp.status === 401) {
            localStorage.removeItem('auth_token');
            throw new Error('Session expired');
        }
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch submissions');
    }

    const payload = await resp.json();

    // backend may return either an array or an object with `submissions`
    const data = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.submissions) ? payload.submissions : []);

    const normalizeStatus = (raw: any): RecentSubmission['status'] => {
        const s = (raw || '').toString().toLowerCase();
        if (!s) return 'verifying';
        if (['approved', 'published', 'approved_by_moderator', 'auto_approved'].includes(s)) return 'published';
        if (['pending', 'verifying', 'pending_review', 'in_review'].includes(s)) return 'verifying';
        if (['rejected', 'denied'].includes(s)) return 'rejected';
        return 'verifying';
    };

    return (data || []).map((r: any) => ({
        id: r.id,
        stationName: r.station_name || (r.station && r.station.name) || r.stationName || r.stationId || '',
        fuelType: r.fuel_type || r.fuelTypeName || r.fuel_type_name || r.fuelTypeId || (r.fuelType && r.fuelType.display_name) || '',
        price: typeof r.price === 'number' ? r.price : Number(r.price) || 0,
        timestamp: r.submittedAt || r.createdAt || r.submitted_at || new Date().toISOString(),
        status: normalizeStatus(r.moderationStatus || r.status || r.moderation_status || r.moderationStatus),
    }));
}

/**
 * Get account settings (mock for now)
 */
export async function getAccountSettings(): Promise<AccountSettings> {
    // Mock data
    return {
        notifications: {
            priceAlerts: true,
            contributionUpdates: true,
            weeklyDigest: false,
            marketingEmails: false,
            pushNotifications: true,
        },
        privacy: {
            profileVisibility: 'public',
            showContributionStats: true,
            shareDataForResearch: true,
        },
    };
}

/**
 * Update account settings (mock for now)
 */
export async function updateAccountSettings(_settings: AccountSettings): Promise<void> {
    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 500));
}

/**
 * Get subscription info (mock for now)
 */
export async function getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
    // Mock data - return null for free users
    return null;
}
