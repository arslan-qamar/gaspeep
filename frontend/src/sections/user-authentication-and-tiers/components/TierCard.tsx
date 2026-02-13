
import type { UserTier } from '../types';

interface TierCardProps {
    tier: UserTier;
    selected: boolean;
    onSelect: () => void;
}

export function TierCard({ tier, selected, onSelect }: TierCardProps) {
    const isFree = tier === 'free';

    return (
        <button
            onClick={onSelect}
            className={`
        relative w-full p-6 rounded-xl border-2 text-left transition-all
        ${selected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg scale-105'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500'
                }
      `}
        >
            {/* Badge */}
            <div className="mb-4">
                {isFree ? (
                    <span className="inline-block px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-full">
                        Free
                    </span>
                ) : (
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-full">
                        Premium
                    </span>
                )}
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
                {isFree ? (
                    <>
                        <Feature text="10 submissions per day" />
                        <Feature text="Basic station info" />
                        <Feature text="Community support" />
                    </>
                ) : (
                    <>
                        <Feature text="Unlimited submissions" highlight />
                        <Feature text="Advanced filters & alerts" highlight />
                        <Feature text="Ad-free experience" highlight />
                        <Feature text="Priority support" highlight />
                        <Feature text="2x points multiplier" />
                    </>
                )}
            </div>

            {/* Pricing */}
            {!isFree && (
                <div className="mb-4">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        $4.99
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">/month</span>
                </div>
            )}

            {/* CTA */}
            <div
                className={`
          w-full py-2 px-4 rounded-lg font-medium text-center transition-colors
          ${isFree
                        ? 'border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                        : 'bg-blue-500 text-white'
                    }
        `}
            >
                {selected ? '✓ Selected' : isFree ? 'Start Free' : 'Start Premium'}
            </div>

            {/* Selected indicator */}
            {selected && (
                <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                </div>
            )}
        </button>
    );
}

interface FeatureProps {
    text: string;
    highlight?: boolean;
}

function Feature({ text, highlight }: FeatureProps) {
    return (
        <div className="flex items-start gap-2">
            <svg
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${highlight
                    ? 'text-blue-500'
                    : 'text-slate-400 dark:text-slate-500'
                    }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                />
            </svg>
            <span
                className={`text-sm ${highlight
                    ? 'text-slate-900 dark:text-white font-medium'
                    : 'text-slate-600 dark:text-slate-400'
                    }`}
            >
                {text}
            </span>
        </div>
    );
}
