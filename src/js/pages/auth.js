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

const API_BASE = window.API_BASE_URL || 'http://localhost:5001/api';

/* ----- User Storage Functions (Now using JSON Server) ----- */

// NOTE: User management now handled through backend API
// No need to get all users - authentication is server-side

// Register user via API
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Registration failed');
        }
        return await response.json();
    } catch (e) {
        console.error('Error registering user:', e);
        throw e;
    }
}

// Login user via API
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Login failed');
        }
        return await response.json();
    } catch (e) {
        console.error('Error logging in:', e);
        throw e;
    }
}

// Set current logged in user and token
function setCurrentUser(user, token) {
    // Remove password before storing in session
    const safeUser = { ...user };
    delete safeUser.password;

    const userString = JSON.stringify(safeUser);
    localStorage.setItem('user', userString);
    sessionStorage.setItem('user', userString); // Backup for session
    localStorage.setItem('token', token); // Store JWT token
    localStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('isLoggedIn', 'true');
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
    localStorage.removeItem('token');
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
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.textContent = "Logging in...";
            }

            // Call backend API
            const response = await loginUser(email, password);

            if (response.success && response.data) {
                // Save user and token to session
                setCurrentUser(response.data.user, response.data.token);

                // Verify storage
                const savedUser = localStorage.getItem('user');
                if (!savedUser) {
                    alert("Critical Error: Failed to save login session. Please check browser settings.");
                    console.error("LocalStorage write failed.");
                    if (loginBtn) {
                        loginBtn.disabled = false;
                        loginBtn.textContent = "Login";
                    }
                    return;
                }

                showToast("Login successful! Redirecting...", "success");

                setTimeout(() => {
                    console.log("Redirecting to dashboard...");
                    window.location.replace("../dashboard/index.html");
                }, 1000);
            }
        } catch (error) {
            showToast(error.message || "Connection failed. Is the server running?", "error");
            console.error(error);
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = "Login";
            }
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
            if (registerBtn) {
                registerBtn.disabled = true;
                registerBtn.textContent = "Creating account...";
            }

            // Create user object
            const userData = {
                name: name,
                email: email.toLowerCase(),
                password: password  // Backend will hash it
            };

            // Call backend API
            const response = await registerUser(userData);

            if (response.success && response.data) {
                showToast("Account created successfully!", "success");

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            }

        } catch (error) {
            console.error('Registration failed:', error);
            showToast(error.message || "Connection failed. Is the server running?", "error");
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.textContent = "Register";
            }
        }
    });
}

/* ----- Default Data Seeding ----- */
// NOTE: Default categories are now seeded in the database
// No need for frontend seeding - backend handles it

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
        loginUser,
        registerUser
    };
}