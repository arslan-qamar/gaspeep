import type { PasswordStrengthResult, ValidationResult, PasswordRequirement } from '../types';

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        return { valid: false, message: 'Email is required' };
    }

    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Please enter a valid email address' };
    }

    return { valid: true };
}

/**
 * Checks password strength and returns detailed feedback
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
        score += 2;
    } else {
        feedback.push('Add more characters (minimum 8)');
    }

    if (password.length >= 12) {
        score += 1;
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
        score += 2;
    } else {
        feedback.push('Include uppercase letters');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
        score += 2;
    } else {
        feedback.push('Include lowercase letters');
    }

    // Number check
    if (/[0-9]/.test(password)) {
        score += 2;
    } else {
        feedback.push('Include numbers');
    }

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
        feedback.push('Great! Special characters make it stronger');
    } else {
        feedback.push('Consider adding special characters');
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (score <= 4) {
        strength = 'weak';
    } else if (score <= 7) {
        strength = 'medium';
    } else {
        strength = 'strong';
        feedback.length = 0;
        feedback.push('Great password!');
    }

    return { strength, score, feedback };
}

/**
 * Gets password requirements with met status
 */
export function getPasswordRequirements(password: string): PasswordRequirement[] {
    return [
        {
            label: 'At least 8 characters',
            met: password.length >= 8,
            description: 'Minimum length requirement',
        },
        {
            label: 'One uppercase letter',
            met: /[A-Z]/.test(password),
            description: 'Contains A-Z',
        },
        {
            label: 'One lowercase letter',
            met: /[a-z]/.test(password),
            description: 'Contains a-z',
        },
        {
            label: 'One number',
            met: /[0-9]/.test(password),
            description: 'Contains 0-9',
        },
    ];
}

/**
 * Validates password meets minimum requirements
 */
export function validatePassword(password: string): ValidationResult {
    if (!password) {
        return { valid: false, message: 'Password is required' };
    }

    const requirements = getPasswordRequirements(password);
    const allMet = requirements.every((req) => req.met);

    if (!allMet) {
        return {
            valid: false,
            message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
        };
    }

    return { valid: true };
}

/**
 * Validates password confirmation matches
 */
export function validatePasswordConfirmation(
    password: string,
    confirmation: string
): ValidationResult {
    if (!confirmation) {
        return { valid: false, message: 'Please confirm your password' };
    }

    if (password !== confirmation) {
        return { valid: false, message: 'Passwords do not match' };
    }

    return { valid: true };
}

/**
 * Validates display name
 */
export function validateDisplayName(name: string): ValidationResult {
    if (!name || name.trim().length === 0) {
        return { valid: false, message: 'Name is required' };
    }

    if (name.trim().length < 2) {
        return { valid: false, message: 'Name must be at least 2 characters' };
    }

    if (name.trim().length > 50) {
        return { valid: false, message: 'Name must be less than 50 characters' };
    }

    return { valid: true };
}
