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