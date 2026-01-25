/* ----- Email and Password validation ----- */

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Password validation
function validatePassword(password) {
    if(password.length<8) {
        return "Password must be at least 8 characters long";
    }

    if(!/[A-Z]/.test(password)) {
        return "Password must contain at least one upper case letter";
    }

    if(!/[a-z]/.test(password)) {
        return "Password must contain at least one lower case letter";
    }

    if(!/\d/.test(password)) {
        return "Password must contain at least one digit";
    }

    if(!/[@$#!%*?&]/.test(password)) {
        return "Password must contain at least one special character (@ $ # ! % * ? &)";
    }
    return null;
}

// Name Validation
function validateName(name) {
    if(name<5) {
        return "Full name must be at least 5 characters long";
    }
    return null;
}

/* ----- Login form Submission ----- */
const loginForm = document.getElementById("loginForm");

if(loginForm) {
    const resetBtn = loginForm.querySelector(".reset-btn");
    const loginBtn = loginForm.querySelector(".login-btn");

    // Reset Button confirmation
    if(resetBtn) {
        resetBtn.addEventListener("click", function (event) {
            event.preventDefault();

            const confirmReset = confirm("Are you sure want to clear the form?");
            if(confirmReset) {
                loginForm.reset();
            }
        });
    }

    // Form Submit Handler
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        // Empty check
        if(email==="" || password==="") {
            alert("Fill all the fields");
            return;
        }

        // Email validation
        if(!isValidEmail(email)) {
            alert("Enter valid email id");
            return;
        }

        // Password validation
        const passwordError = validatePassword(password);
        if(passwordError) {
            alert(passwordError);
            return;
        }

        // Login Button Animation
        if(loginBtn) {
            loginBtn.disabled = true;
            loginBtn.classList.add("shrink");

            setTimeout(() => {
                loginBtn.classList.remove("shrink");
                loginBtn.disabled = false;

                console.log("Login attempt:");
                console.log("Email: ", email);
                console.log("Password: [HIDDEN]");

                alert("Login page works. Backend not connected yet!");
            }, 300);
        }
    });
}

/* ----- Register form handeling */
const registerForm = document.getElementById("registerForm");

if(registerForm) {
    const resetBtn = registerForm.querySelector(".reset-btn");
    const registerBtn = registerForm.querySelector(".register-btn");

    // Reset button confirmation
    if(resetBtn) {
        resetBtn.addEventListener("click", function (event) {
            event.preventDefault();

            const confirmRest = confirm("Are you sure want to clear the form?");
            if(confirmRest) {
                registerForm.reset();
            }
        });
    }

    // Form Register Handler
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        // Empty check
        if(name==="" || email==="" || password==="" || confirmPassword==="") {
            alert("Fill all the fields");
            return;
        }

        // Name validation
        const nameError = validateName(name);
        if(nameError) {
            alert(nameError);
            return;
        }

        // Email validation
        if(!isValidEmail(email)) {
            alert("Enter valid email id");
            return;
        }

        // Password validation
        const passwordError = validatePassword(password);
        if(passwordError) {
            alert(passwordError);
            return;
        }

        // Confirm password validation
        if(password!=confirmPassword) {
            alert("Password and Confirm password must be same");
            return;
        }

        // Register button animation
        if(registerBtn) {
            registerBtn.disabled = true;
            registerBtn.classList.add("shrink");

            setTimeout(() => {
                registerBtn.classList.remove("shrink");
                registerBtn.disabled = false;

                console.log("Register attempt:");
                console.log("Full Name: ", name);
                console.log("Password: [HIDDEN]");
                console.log("Confirm Password: [HIDDEN]")

                alert("Register form works. Backend not connected!");
            }, 300);
        }
    });
}

/* ----- Show/Hide password */
const showPassword = document.getElementById("showPassword");
const passwordInput = document.getElementById("password");

if(showPassword && passwordInput) {
    showPassword.textContent = "◎";

    showPassword.addEventListener("click", function () {
        if(passwordInput.type==="password") {
            passwordInput.type = "text";
            showPassword.textContent = "◉";
        }
        else {
            passwordInput.type = "password";
            showPassword.textContent = "◎";
        }
    });
}

// Confirm password toggle
const showConfirmPassword = document.getElementById("showConfirmPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

if(showConfirmPassword && confirmPasswordInput) {
    showConfirmPassword.textContent = "◎";

    showConfirmPassword.addEventListener("click", function () {
        if(confirmPasswordInput.type==="password") {
            confirmPasswordInput.type = "text";
            showConfirmPassword.textContent = "◉";
        }
        else {
            confirmPasswordInput.type = "password";
            showConfirmPassword.textContent = "◎";
        }
    });
}