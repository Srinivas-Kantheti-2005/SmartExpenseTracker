/* ========================================
   Authentication Controller
   Uses schemas for validation
   ======================================== */

// Import schemas (for ES modules - uncomment when using modules)
// import { LoginSchema, RegisterSchema, validateForm, createUserFromRegistration, sanitizeUser } from '../config/schemas.js';

/* ----- Validation Functions ----- */

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Password validation with detailed checks
function validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
    }
    if (!/\d/.test(password)) {
        errors.push("Password must contain at least one digit");
    }
    if (!/[@$#!%*?&]/.test(password)) {
        errors.push("Password must contain at least one special character (@$#!%*?&)");
    }

    return errors.length > 0 ? errors[0] : null;
}

// Name validation
function validateName(name) {
    if (name.length < 2) {
        return "Full name must be at least 2 characters long";
    }
    if (name.length > 100) {
        return "Full name cannot exceed 100 characters";
    }
    return null;
}

// Generate unique ID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const DB_URL = "http://localhost:3004/users";

/* ----- User Storage Functions (Now using JSON Server) ----- */

// Get all registered users (Async)
async function getUsers() {
    try {
        const response = await fetch(DB_URL);
        if (!response.ok) throw new Error('Failed to fetch users');
        return await response.json();
    } catch (e) {
        console.error('Error reading users:', e);
        showToast("Database connection error. Is the server running?", "error");
        return [];
    }
}

// Save user to storage (Async)
async function saveUser(user) {
    try {
        const response = await fetch(DB_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        if (!response.ok) throw new Error('Failed to save user');
        return await response.json();
    } catch (e) {
        console.error('Error saving user:', e);
        throw e;
    }
}

// Find user by email (Async)
// Find user by email (Async)
async function findUserByEmail(email) {
    try {
        const response = await fetch(`${DB_URL}?email=${email}`);
        if (!response.ok) throw new Error('Server error');
        const users = await response.json();
        return users.length > 0 ? users[0] : null;
    } catch (e) {
        console.error('Error finding user:', e);
        throw e; // Re-throw to handle in UI
    }
}

// Check if email exists (Async)
async function emailExists(email) {
    const user = await findUserByEmail(email);
    return user !== null;
}

// Set current logged in user
function setCurrentUser(user) {
    // Remove password before storing in session
    const safeUser = { ...user };
    delete safeUser.password;
    localStorage.setItem('user', JSON.stringify(safeUser));
    localStorage.setItem('isLoggedIn', 'true');
}

// Get current logged in user
function getCurrentUser() {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
}

// Logout user
function logoutUser() {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
}

/* ----- Show Toast Notification ----- */

function showToast(message, type = 'error') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕'}</span>
        <span class="toast-message">${message}</span>
    `;

    // Add styles if not already added
    if (!document.querySelector('#toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
            }
            .toast-error {
                background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
                color: white;
            }
            .toast-success {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
            }
            .toast-warning {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
            }
            .toast-icon {
                font-size: 18px;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => toast.remove(), 3000);
}

/* ----- Login Form Handling ----- */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const resetBtn = loginForm.querySelector(".reset-btn");
    const loginBtn = loginForm.querySelector(".login-btn");

    // Reset Button confirmation
    if (resetBtn) {
        resetBtn.addEventListener("click", function (event) {
            event.preventDefault();
            const confirmReset = confirm("Are you sure you want to clear the form?");
            if (confirmReset) {
                loginForm.reset();
            }
        });
    }

    // Form Submit Handler
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        // Validate email
        if (!email) {
            showToast("Email is required", "error");
            return;
        }

        if (!isValidEmail(email)) {
            showToast("Please enter a valid email address", "error");
            return;
        }

        // Validate password
        if (!password) {
            showToast("Password is required", "error");
            return;
        }

        try {
            // Find user
            const user = await findUserByEmail(email);

            if (!user) {
                showToast("No account found with this email", "error");
                return;
            }

            // Check password
            if (user.password !== password) {
                showToast("Incorrect password", "error");
                return;
            }

            // Login successful
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.textContent = "Logging in...";

                // Update last login timestamp
                const lastLoginTime = new Date().toISOString();
                user.lastLogin = lastLoginTime;

                // Update lastLogin in database
                try {
                    await fetch(`${DB_URL}/${user.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lastLogin: lastLoginTime })
                    });
                } catch (error) {
                    console.error('Failed to update last login:', error);
                }

                // Save to session
                setCurrentUser(user);

                showToast("Login successful! Redirecting...", "success");

                setTimeout(() => {
                    window.location.href = "../dashboard/index.html";
                }, 1000);
            }
        } catch (error) {
            showToast("Connection failed. Is the server running?", "error");
            console.error(error);
        }
    });
}

/* ----- Register Form Handling ----- */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    const resetBtn = registerForm.querySelector(".reset-btn");
    const registerBtn = registerForm.querySelector(".register-btn");

    // Reset button confirmation
    if (resetBtn) {
        resetBtn.addEventListener("click", function (event) {
            event.preventDefault();
            const confirmReset = confirm("Are you sure you want to clear the form?");
            if (confirmReset) {
                registerForm.reset();
            }
        });
    }

    // Form Register Handler
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        // Validate name
        const nameError = validateName(name);
        if (nameError) {
            showToast(nameError, "error");
            return;
        }

        // Validate email
        if (!email) {
            showToast("Email is required", "error");
            return;
        }

        if (!isValidEmail(email)) {
            showToast("Please enter a valid email address", "error");
            return;
        }

        // Confirm password match
        if (password !== confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        // Validate password
        const passwordError = validatePassword(password);
        if (passwordError) {
            showToast(passwordError, "error");
            return;
        }

        try {
            // Check if email already exists
            if (await emailExists(email)) {
                showToast("An account with this email already exists", "warning");
                return;
            }

            // Create user object following schema
            const newUser = {
                id: generateUUID(),
                email: email.toLowerCase(),
                password: password, // In production, this should be hashed
                name: name,
                phone: null,
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

            // Save user
            await saveUser(newUser);

            // Show success and redirect
            if (registerBtn) {
                registerBtn.disabled = true;
                registerBtn.textContent = "Creating account...";

                showToast("Account created successfully!", "success");

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            }

        } catch (error) {
            console.error('Registration failed:', error);
            showToast("Connection failed. Is the server running?", "error");
        }
    });
}

/* ----- Show/Hide Password Toggle ----- */

const showPassword = document.getElementById("showPassword");
const passwordInput = document.getElementById("password");

if (showPassword && passwordInput) {
    showPassword.textContent = "◎";
    showPassword.style.cursor = "pointer";

    showPassword.addEventListener("click", function () {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            showPassword.textContent = "◉";
        } else {
            passwordInput.type = "password";
            showPassword.textContent = "◎";
        }
    });
}

// Confirm password toggle
const showConfirmPassword = document.getElementById("showConfirmPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

if (showConfirmPassword && confirmPasswordInput) {
    showConfirmPassword.textContent = "◎";
    showConfirmPassword.style.cursor = "pointer";

    showConfirmPassword.addEventListener("click", function () {
        if (confirmPasswordInput.type === "password") {
            confirmPasswordInput.type = "text";
            showConfirmPassword.textContent = "◉";
        } else {
            confirmPasswordInput.type = "password";
            showConfirmPassword.textContent = "◎";
        }
    });
}

/* ----- Export for testing ----- */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidEmail,
        validatePassword,
        validateName,
        getUsers,
        findUserByEmail,
        emailExists
    };
}