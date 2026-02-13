import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BillingCycle, TierFeature, FAQItem } from '../types';

const TIER_FEATURES: TierFeature[] = [
    {
        name: 'Daily Submissions',
        description: 'Number of price updates you can submit per day',
        free: '10',
        premium: 'Unlimited',
        highlight: true,
    },
    {
        name: 'Station Information',
        description: 'Access to station details and amenities',
        free: 'Basic',
        premium: 'Detailed',
    },
    {
        name: 'Price Alerts',
        description: 'Get notified when prices change at your favorite stations',
        free: false,
        premium: true,
        highlight: true,
    },
    {
        name: 'Advanced Filters',
        description: 'Filter by amenities, brands, fuel types',
        free: false,
        premium: true,
    },
    {
        name: 'Historical Charts',
        description: 'View price trends over time',
        free: false,
        premium: 'Full history',
        highlight: true,
    },
    {
        name: 'Experience',
        description: 'Browse without interruptions',
        free: 'With ads',
        premium: 'Ad-free',
    },
    {
        name: 'Support',
        description: 'Get help when you need it',
        free: 'Community',
        premium: 'Priority',
    },
    {
        name: 'Accuracy Badge',
        description: 'Show off your reliable contributions',
        free: false,
        premium: true,
    },
    {
        name: 'New Features',
        description: 'Be first to try upcoming features',
        free: false,
        premium: 'Early access',
    },
    {
        name: 'Points Multiplier',
        description: 'Earn more points for your contributions',
        free: '1x',
        premium: '2x',
    },
];

const FAQ_ITEMS: FAQItem[] = [
    {
        question: 'Can I cancel my subscription anytime?',
        answer:
            'Yes, you can cancel anytime from your account settings. There are no long-term commitments or cancellation fees. Your Premium benefits will remain active until the end of your current billing period.',
        category: 'billing',
    },
    {
        question: 'What happens to my data if I downgrade to Free?',
        answer:
            'All your submissions and contribution history are preserved when you downgrade. You\'ll still have access to basic features, but advanced features like price alerts and historical charts will be disabled until you upgrade again.',
        category: 'account',
    },
    {
        question: 'Do you offer refunds?',
        answer:
            'Yes, we offer a 30-day money-back guarantee for Premium subscriptions. If you\'re not satisfied within the first 30 days, contact support for a full refund.',
        category: 'billing',
    },
    {
        question: 'How do I upgrade to Premium?',
        answer:
            'Tap the "Upgrade to Premium" button anywhere in the app. You\'ll be guided through a simple payment flow using Stripe, Apple Pay, or Google Pay. Your Premium benefits activate immediately after payment.',
        category: 'features',
    },
];

export function TierComparisonScreen() {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

    const monthlyPrice = 4.99;
    const annualPrice = 49.99;
    const annualSavings = (monthlyPrice * 12 - annualPrice).toFixed(2);

    const handleUpgrade = () => {
        // TODO: Implement payment flow
        alert(`Upgrade to Premium (${billingCycle}) - Payment flow coming soon!`);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
            <div className="w-full max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
                        Choose Your Plan
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Get more from your contributions
                    </p>
                </div>

                {/* Billing toggle */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all ${billingCycle === 'monthly'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('annual')}
                        className={`px-6 py-3 rounded-lg font-medium transition-all relative ${billingCycle === 'annual'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                    >
                        Annual
                        <span className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                            Save ${annualSavings}
                        </span>
                    </button>
                </div>

                {/* Pricing cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Free tier */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border-2 border-slate-200 dark:border-slate-700">
                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-full mb-4">
                                Free
                            </span>
                            <div className="mb-4">
                                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                                    $0
                                </span>
                                <span className="text-slate-600 dark:text-slate-400">/month</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400">
                                Perfect for casual users
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/auth/signup')}
                            className="w-full py-3 px-4 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Premium tier */}
                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-2xl p-8 border-2 border-blue-400 relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-slate-900 text-sm font-bold rounded-full">
                            ⭐ MOST POPULAR
                        </div>
                        <div className="mb-6">
                            <span className="inline-block px-3 py-1 bg-white/20 text-white text-sm font-semibold rounded-full mb-4">
                                Premium
                            </span>
                            <div className="mb-4">
                                <span className="text-4xl font-bold text-white">
                                    ${billingCycle === 'monthly' ? monthlyPrice : annualPrice}
                                </span>
                                <span className="text-white/80">
                                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                                </span>
                                {billingCycle === 'annual' && (
                                    <p className="text-sm text-white/80 mt-2">
                                        ~${(annualPrice / 12).toFixed(2)}/month
                                    </p>
                                )}
                            </div>
                            <p className="text-white/90">For power users and enthusiasts</p>
                        </div>
                        <button
                            onClick={handleUpgrade}
                            className="w-full py-3 px-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-white/90 transition-colors shadow-lg"
                        >
                            Upgrade to Premium
                        </button>
                    </div>
                </div>

                {/* Feature comparison table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden mb-12">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900">
                                <tr>
                                    <th className="text-left p-4 font-semibold text-slate-900 dark:text-white">
                                        Feature
                                    </th>
                                    <th className="text-center p-4 font-semibold text-slate-900 dark:text-white">
                                        Free
                                    </th>
                                    <th className="text-center p-4 font-semibold text-slate-900 dark:text-white">
                                        Premium
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {TIER_FEATURES.map((feature, index) => (
                                    <tr
                                        key={index}
                                        className={`border-t border-slate-200 dark:border-slate-700 ${feature.highlight ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                                            }`}
                                    >
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {feature.name}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {typeof feature.free === 'boolean' ? (
                                                feature.free ? (
                                                    <span className="text-green-500 text-xl">✓</span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 text-xl">
                                                        ✗
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    {feature.free}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {typeof feature.premium === 'boolean' ? (
                                                feature.premium ? (
                                                    <span className="text-green-500 text-xl">✓</span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600 text-xl">
                                                        ✗
                                                    </span>
                                                )
                                            ) : (
                                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                                    {feature.premium}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Social proof */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-12">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Trusted by thousands of drivers
                        </h2>
                        <div className="flex items-center justify-center gap-8">
                            <div>
                                <p className="text-3xl font-bold text-blue-500">12,847</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Premium members
                                </p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-blue-500">4.8/5</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Average rating
                                </p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-blue-500">3,421</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Reviews</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {FAQ_ITEMS.map((item, index) => (
                            <div
                                key={index}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                                    className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                >
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {item.question}
                                    </span>
                                    <svg
                                        className={`w-5 h-5 text-slate-400 transition-transform ${expandedFAQ === index ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>
                                {expandedFAQ === index && (
                                    <div className="p-4 pt-0 text-slate-600 dark:text-slate-400">
                                        {item.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-8 text-center">
                    <button
                        onClick={handleUpgrade}
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-lg"
                    >
                        Upgrade to Premium Now
                    </button>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                        30-day money-back guarantee • Cancel anytime
                    </p>
                </div>
            </div>
        </div>
    );
}
