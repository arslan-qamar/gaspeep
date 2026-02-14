import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getUserProfile,
    getContributionStats,
    getRecentSubmissions,
    updateUserProfile,
    signOut,
} from '../api/authApi';
import type { User, ContributionStats, RecentSubmission, OAuthProvider } from '../types';

export function AccountScreen() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<ContributionStats | null>(null);
    const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        loadAccountData();
    }, []);

    const loadAccountData = async () => {
        try {
            const [userData, statsData, submissionsData] = await Promise.all([
                getUserProfile(),
                getContributionStats(),
                getRecentSubmissions(),
            ]);
            setUser(userData);
            setStats(statsData);
            setRecentSubmissions(submissionsData);
        } catch (err) {
            console.error('Failed to load account data', err);
            // If unauthorized, redirect to sign in
            navigate('/auth/signin');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = () => {
        setShowSignOutConfirm(true);
    };

    const confirmSignOut = () => {
        signOut();
        navigate('/auth/signin');
    };

    const handleUpgrade = () => {
        navigate('/auth/tier-comparison');
    };

    const handleStartEdit = () => {
        if (user) {
            setEditName(user.name);
            setEditEmail(user.email);
            setSaveError(null);
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSaveError(null);
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaveError(null);
        setIsSaving(true);

        try {
            const updated = await updateUserProfile({
                name: editName,
                email: editEmail,
            });
            setUser(updated);
            setIsEditing(false);
        } catch (err) {
            setSaveError(
                err instanceof Error ? err.message : 'Failed to update profile'
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleDisconnectProvider = (_provider: OAuthProvider) => {
        // TODO: Implement OAuth disconnect
        alert('OAuth disconnect - Coming soon!');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <svg
                        className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4"
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
                    <p className="text-slate-600 dark:text-slate-400">Loading account...</p>
                </div>
            </div>
        );
    }

    if (!user || !stats) {
        return null;
    }

    const isPremium = user.tier === 'premium';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
            <div className="w-full max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {(() => {
                                    const name = isEditing ? editName : user.name ?? '';
                                    const first = name && name.length > 0 ? name.charAt(0).toUpperCase() : '?';
                                    return first;
                                })()}
                            </div>
                            <div>
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="input-field text-lg font-bold"
                                            placeholder="Your name"
                                            disabled={isSaving}
                                        />
                                        <input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            className="input-field"
                                            placeholder="your@email.com"
                                            disabled={isSaving}
                                        />
                                        {saveError && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {saveError}
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={isSaving}
                                                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                            >
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                disabled={isSaving}
                                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                                {user.name}
                                            </h1>
                                            <button
                                                onClick={handleStartEdit}
                                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                title="Edit profile"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400">{user.email}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                            Member since {new Date(user.memberSince).toLocaleDateString()}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Tier badge */}
                        <div>
                            {isPremium ? (
                                <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-full">
                                    Premium
                                </span>
                            ) : (
                                <span className="inline-block px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-full">
                                    Free
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Upgrade CTA for free users */}
                    {!isPremium && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                        Upgrade to Premium
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Unlock unlimited submissions, price alerts, and ad-free experience
                                    </p>
                                </div>
                                <button
                                    onClick={handleUpgrade}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                                >
                                    Upgrade Now
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Submissions */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                Total Submissions
                            </span>
                            {!isPremium && stats.dailySubmissionsLimit > 0 && (
                                <span className="text-xs text-slate-500 dark:text-slate-500">
                                    {stats.dailySubmissionsUsed}/{stats.dailySubmissionsLimit} today
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                            {stats.totalSubmissions}
                        </p>
                        {isPremium && (
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded">
                                Unlimited
                            </span>
                        )}
                    </div>

                    {/* Users Helped */}
                    <div className="card">
                        <span className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                            Users Helped
                        </span>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                            {stats.usersHelped.toLocaleString()}
                        </p>
                    </div>

                    {/* Points Earned */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                Points Earned
                            </span>
                            {isPremium && (
                                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                    2x
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">
                            {stats.pointsEarned.toLocaleString()}
                        </p>
                        {!isPremium && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                                Premium: 2x points multiplier
                            </p>
                        )}
                    </div>

                    {/* Accuracy Rating */}
                    <div className="card">
                        <span className="text-sm text-slate-600 dark:text-slate-400 mb-2 block">
                            Accuracy Rating
                        </span>
                        {isPremium && stats.accuracyRating ? (
                            <>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {stats.accuracyRating}%
                                </p>
                                {stats.accuracyTrend && (
                                    <span
                                        className={`text-xs font-medium ${stats.accuracyTrend === 'up'
                                            ? 'text-green-600 dark:text-green-400'
                                            : stats.accuracyTrend === 'down'
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        {stats.accuracyTrend === 'up' && '↑ Improving'}
                                        {stats.accuracyTrend === 'down' && '↓ Declining'}
                                        {stats.accuracyTrend === 'stable' && '→ Stable'}
                                    </span>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-start">
                                <p className="text-2xl font-bold text-slate-400 dark:text-slate-600 mb-2">
                                    🔒
                                </p>
                                <button
                                    onClick={handleUpgrade}
                                    className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                >
                                    Upgrade to unlock
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Recent Submissions
                        </h2>
                        {stats.contributionStreak > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                                <span className="text-lg">🔥</span>
                                <span className="text-sm font-medium">
                                    {stats.contributionStreak} day streak
                                </span>
                            </div>
                        )}
                    </div>

                    {recentSubmissions.length > 0 ? (
                        <div className="space-y-3">
                            {recentSubmissions.map((submission) => (
                                <div
                                    key={submission.id}
                                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">
                                            {submission.stationName}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {submission.fuelType} • ${submission.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500 dark:text-slate-500">
                                            {submission.timestamp}
                                        </p>
                                        <span
                                            className={`inline-block px-2 py-1 text-xs font-medium rounded ${submission.status === 'published'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                : submission.status === 'verifying'
                                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                }`}
                                        >
                                            {submission.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-500">
                            <p>No submissions yet</p>
                            <button
                                onClick={() => navigate('/submit')}
                                className="mt-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                                Submit your first price
                            </button>
                        </div>
                    )}
                </div>

                {/* Connected Accounts */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                        Connected Accounts
                    </h2>
                    <div className="space-y-3">
                        {(['google', 'apple'] as const).map((provider) => {
                            const isConnected = user.connectedProviders?.includes(provider);
                            return (
                                <div
                                    key={provider}
                                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        {provider === 'google' ? (
                                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6 text-slate-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-1.55 4.28-3.74 4.25z" />
                                            </svg>
                                        )}
                                        <span className="font-medium text-slate-900 dark:text-white capitalize">
                                            {provider}
                                        </span>
                                    </div>
                                    {isConnected ? (
                                        <button
                                            onClick={() => handleDisconnectProvider(provider)}
                                            className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                        >
                                            Disconnect
                                        </button>
                                    ) : (
                                        <span className="text-sm text-slate-500 dark:text-slate-500">
                                            Not connected
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                        Account Actions
                    </h2>
                    <div className="space-y-3">
                        {isPremium && (
                            <button className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <span className="font-medium text-slate-900 dark:text-white">
                                    Manage Subscription
                                </span>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Update payment method or cancel subscription
                                </p>
                            </button>
                        )}
                        <button className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="font-medium text-slate-900 dark:text-white">
                                Notification Settings
                            </span>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Manage email and push notifications
                            </p>
                        </button>
                        <button className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="font-medium text-slate-900 dark:text-white">
                                Privacy Settings
                            </span>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Control your data and visibility
                            </p>
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-3 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                        >
                            <span className="font-medium text-red-600 dark:text-red-400">
                                Sign Out
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Sign-out confirmation dialog */}
            {showSignOutConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                            Sign out?
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Are you sure you want to sign out of your account?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSignOutConfirm(false)}
                                className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSignOut}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
