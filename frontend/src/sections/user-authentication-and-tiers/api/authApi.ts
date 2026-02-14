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

    return response.json();
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<User>): Promise<User> {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        throw new Error('Failed to update profile');
    }

    return response.json();
}

/**
 * Get contribution stats (mock for now)
 */
export async function getContributionStats(): Promise<ContributionStats> {
    // Mock data - in production this would come from the backend
    return {
        totalSubmissions: 87,
        usersHelped: 1243,
        pointsEarned: 4350,
        contributionStreak: 5,
        dailySubmissionsUsed: 7,
        dailySubmissionsLimit: 10,
    };
}

/**
 * Get recent submissions (mock for now)
 */
export async function getRecentSubmissions(): Promise<RecentSubmission[]> {
    // Mock data - in production this would come from the backend
    return [
        {
            id: 'sub_001',
            stationName: 'Shell Downtown',
            fuelType: 'E10',
            price: 3.85,
            timestamp: '2 hours ago',
            status: 'published',
        },
        {
            id: 'sub_002',
            stationName: 'Chevron Mission Bay',
            fuelType: 'Diesel',
            price: 4.39,
            timestamp: '5 hours ago',
            status: 'published',
        },
        {
            id: 'sub_003',
            stationName: '76 Station',
            fuelType: 'U95',
            price: 4.15,
            timestamp: 'Yesterday',
            status: 'verifying',
        },
    ];
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
