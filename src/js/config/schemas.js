/* ========================================
   User Schema & Authentication Models
   ======================================== */

// User Schema Definition
export const UserSchema = {
    id: {
        type: 'string',
        required: true,
        description: 'Unique user identifier (UUID)'
    },
    email: {
        type: 'string',
        required: true,
        unique: true,
        format: 'email',
        maxLength: 255,
        description: 'User email address (used for login)'
    },
    password: {
        type: 'string',
        required: true,
        minLength: 8,
        description: 'Hashed password (never store plain text)'
    },
    name: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        description: 'User full name'
    },
    avatar: {
        type: 'string',
        required: false,
        default: null,
        description: 'URL to user avatar image'
    },
    phone: {
        type: 'string',
        required: false,
        format: 'phone',
        description: 'User phone number'
    },
    createdAt: {
        type: 'datetime',
        required: true,
        default: 'now',
        description: 'Account creation timestamp'
    },
    updatedAt: {
        type: 'datetime',
        required: true,
        default: 'now',
        description: 'Last profile update timestamp'
    },
    lastLogin: {
        type: 'datetime',
        required: false,
        description: 'Last successful login timestamp'
    },
    isActive: {
        type: 'boolean',
        required: true,
        default: true,
        description: 'Whether the account is active'
    },
    settings: {
        type: 'object',
        required: false,
        default: {},
        description: 'User preferences and settings'
    }
};

// Login Form Schema
export const LoginSchema = {
    email: {
        type: 'string',
        required: true,
        format: 'email',
        rules: {
            required: 'Email is required',
            email: 'Please enter a valid email address'
        }
    },
    password: {
        type: 'string',
        required: true,
        minLength: 1,
        rules: {
            required: 'Password is required'
        }
    },
    rememberMe: {
        type: 'boolean',
        required: false,
        default: false
    }
};

// Registration Form Schema
export const RegisterSchema = {
    name: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        rules: {
            required: 'Full name is required',
            minLength: 'Name must be at least 2 characters',
            maxLength: 'Name cannot exceed 100 characters'
        }
    },
    email: {
        type: 'string',
        required: true,
        format: 'email',
        rules: {
            required: 'Email is required',
            email: 'Please enter a valid email address',
            unique: 'This email is already registered'
        }
    },
    password: {
        type: 'string',
        required: true,
        minLength: 8,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        rules: {
            required: 'Password is required',
            minLength: 'Password must be at least 8 characters',
            pattern: 'Password must contain uppercase, lowercase, and number'
        }
    },
    confirmPassword: {
        type: 'string',
        required: true,
        matchField: 'password',
        rules: {
            required: 'Please confirm your password',
            match: 'Passwords do not match'
        }
    },
    phone: {
        type: 'string',
        required: false,
        pattern: /^[6-9]\d{9}$/,
        rules: {
            pattern: 'Please enter a valid 10-digit phone number'
        }
    },
    termsAccepted: {
        type: 'boolean',
        required: true,
        mustBeTrue: true,
        rules: {
            required: 'You must accept the terms and conditions'
        }
    }
};

// Password Reset Schema
export const PasswordResetSchema = {
    email: {
        type: 'string',
        required: true,
        format: 'email',
        rules: {
            required: 'Email is required',
            email: 'Please enter a valid email address'
        }
    }
};

// Change Password Schema
export const ChangePasswordSchema = {
    currentPassword: {
        type: 'string',
        required: true,
        rules: {
            required: 'Current password is required'
        }
    },
    newPassword: {
        type: 'string',
        required: true,
        minLength: 8,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
        rules: {
            required: 'New password is required',
            minLength: 'Password must be at least 8 characters',
            pattern: 'Password must contain uppercase, lowercase, and number',
            notSame: 'New password must be different from current password'
        }
    },
    confirmNewPassword: {
        type: 'string',
        required: true,
        matchField: 'newPassword',
        rules: {
            required: 'Please confirm your new password',
            match: 'Passwords do not match'
        }
    }
};

// Validate form data against schema
export function validateForm(data, schema) {
    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        const fieldErrors = [];

        // Required check
        if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
            fieldErrors.push(rules.rules?.required || `${field} is required`);
        }

        // Only validate further if value exists
        if (value) {
            // Min length check
            if (rules.minLength && value.length < rules.minLength) {
                fieldErrors.push(rules.rules?.minLength || `Minimum ${rules.minLength} characters required`);
            }

            // Max length check
            if (rules.maxLength && value.length > rules.maxLength) {
                fieldErrors.push(rules.rules?.maxLength || `Maximum ${rules.maxLength} characters allowed`);
            }

            // Email format check
            if (rules.format === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    fieldErrors.push(rules.rules?.email || 'Invalid email format');
                }
            }

            // Pattern check
            if (rules.pattern && !rules.pattern.test(value)) {
                fieldErrors.push(rules.rules?.pattern || 'Invalid format');
            }

            // Match field check
            if (rules.matchField && value !== data[rules.matchField]) {
                fieldErrors.push(rules.rules?.match || 'Fields do not match');
            }

            // Must be true check (for checkboxes)
            if (rules.mustBeTrue && value !== true) {
                fieldErrors.push(rules.rules?.required || `${field} must be accepted`);
            }
        }

        if (fieldErrors.length > 0) {
            errors[field] = fieldErrors;
            isValid = false;
        }
    }

    return { isValid, errors };
}

// Create user object from registration data
export function createUserFromRegistration(registrationData) {
    return {
        id: generateUUID(),
        email: registrationData.email.toLowerCase().trim(),
        password: registrationData.password, // Should be hashed on backend
        name: registrationData.name.trim(),
        phone: registrationData.phone || null,
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
        settings: {
            currency: 'INR',
            theme: 'light',
            notifications: true
        }
    };
}

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Sanitize user object for client (remove sensitive data)
export function sanitizeUser(user) {
    const { password, ...safeUser } = user;
    return safeUser;
}
