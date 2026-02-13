
import type { PasswordStrength } from '../types';

interface PasswordStrengthIndicatorProps {
    strength: PasswordStrength;
    score: number;
    feedback: string[];
}

export function PasswordStrengthIndicator({
    strength,
    score,
    feedback,
}: PasswordStrengthIndicatorProps) {
    const getStrengthColor = () => {
        switch (strength) {
            case 'weak':
                return 'bg-red-500';
            case 'medium':
                return 'bg-yellow-500';
            case 'strong':
                return 'bg-green-500';
            default:
                return 'bg-slate-300 dark:bg-slate-600';
        }
    };

    const getStrengthText = () => {
        switch (strength) {
            case 'weak':
                return 'Weak';
            case 'medium':
                return 'Medium';
            case 'strong':
                return 'Strong';
            default:
                return '';
        }
    };

    const getStrengthTextColor = () => {
        switch (strength) {
            case 'weak':
                return 'text-red-600 dark:text-red-400';
            case 'medium':
                return 'text-yellow-600 dark:text-yellow-400';
            case 'strong':
                return 'text-green-600 dark:text-green-400';
            default:
                return 'text-slate-500';
        }
    };

    const strengthPercentage = (score / 10) * 100;

    return (
        <div className="space-y-2">
            {/* Strength bar */}
            <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${strengthPercentage}%` }}
                    />
                </div>
                <span className={`text-sm font-medium ${getStrengthTextColor()}`}>
                    {getStrengthText()}
                </span>
            </div>

            {/* Feedback */}
            {feedback.length > 0 && (
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {feedback.map((item, index) => (
                        <li key={index} className="flex items-start gap-1">
                            <span className="text-slate-400 dark:text-slate-500">•</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
