// API Configuration
const API_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", function() {
    const signupForm = document.getElementById("signup-form");
    
    if (signupForm) {
        signupForm.addEventListener("submit", function(event) {
            event.preventDefault();

            // Get form values
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const confirmPassword = document.getElementById("confirm-password").value.trim();
            const signupMessage = document.getElementById("signup-message");
            const signupBtn = document.querySelector("#signup-form button[type='submit']");
            
            // Clear previous messages
            signupMessage.textContent = "";

            // Simple validation
            if (name === "" || email === "" || password === "" || confirmPassword === "") {
                signupMessage.style.color = "red";
                signupMessage.textContent = "Please fill in all fields.";
                return;
            }

            if (password.length < 6) {
                signupMessage.style.color = "red";
                signupMessage.textContent = "Password must be at least 6 characters long.";
                return;
            }

            if (password !== confirmPassword) {
                signupMessage.style.color = "red";
                signupMessage.textContent = "Passwords do not match.";
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                signupMessage.style.color = "red";
                signupMessage.textContent = "Please enter a valid email address.";
                return;
            }

            // Show loading state
            signupBtn.disabled = true;
            signupBtn.textContent = "Creating Account...";
            signupMessage.style.color = "blue";
            signupMessage.textContent = "Processing your request...";

            // Send registration request to backend
            fetch(`${API_URL}/api/user/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: name,
                    email: email,
                    password: password
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || "Registration failed");
                    });
                }
                return response.json();
            })
            .then(data => {
                // Successful signup
                signupMessage.style.color = "green";
                signupMessage.textContent = "Signup successful! Redirecting to login page...";

                // Reset form
                signupForm.reset();

                // Redirect after 1.5 seconds
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            })
            .catch(error => {
                // Error handling
                signupMessage.style.color = "red";
                
                if (error.message.includes("email already exists")) {
                    signupMessage.textContent = "This email is already registered. Please log in instead.";
                } else if (error.message.includes("username already exists")) {
                    signupMessage.textContent = "This username is already taken. Please choose another one.";
                } else {
                    signupMessage.textContent = error.message || "An error occurred during registration. Please try again.";
                }
                
                console.error("Registration error:", error);
            })
            .finally(() => {
                // Reset button state
                signupBtn.disabled = false;
                signupBtn.textContent = "Sign Up";
            });
        });
    }
    
    // Password visibility toggle functionality
    const togglePasswordBtns = document.querySelectorAll(".toggle-password");
    if (togglePasswordBtns) {
        togglePasswordBtns.forEach(btn => {
            btn.addEventListener("click", function() {
                const passwordField = document.querySelector(this.getAttribute("data-target"));
                if (passwordField) {
                    if (passwordField.type === "password") {
                        passwordField.type = "text";
                        this.innerHTML = "👁️"; // Hide icon
                    } else {
                        passwordField.type = "password";
                        this.innerHTML = "👁️‍🗨️"; // Show icon
                    }
                }
            });
        });
    }
    
    // Check password strength
    const passwordInput = document.getElementById("password");
    const strengthIndicator = document.getElementById("password-strength");
    
    if (passwordInput && strengthIndicator) {
        passwordInput.addEventListener("input", function() {
            const password = this.value;
            let strength = 0;
            let feedbackMessage = "";
            
            // Length check
            if (password.length >= 8) {
                strength += 1;
            }
            
            // Contains number
            if (/\d/.test(password)) {
                strength += 1;
            }
            
            // Contains uppercase
            if (/[A-Z]/.test(password)) {
                strength += 1;
            }
            
            // Contains special character
            if (/[^A-Za-z0-9]/.test(password)) {
                strength += 1;
            }
            
            // Update strength indicator
            switch (strength) {
                case 0:
                    strengthIndicator.className = "password-strength";
                    strengthIndicator.textContent = "";
                    break;
                case 1:
                    strengthIndicator.className = "password-strength weak";
                    strengthIndicator.textContent = "Weak";
                    break;
                case 2:
                    strengthIndicator.className = "password-strength medium";
                    strengthIndicator.textContent = "Medium";
                    break;
                case 3:
                    strengthIndicator.className = "password-strength strong";
                    strengthIndicator.textContent = "Strong";
                    break;
                case 4:
                    strengthIndicator.className = "password-strength very-strong";
                    strengthIndicator.textContent = "Very Strong";
                    break;
            }
        });
    }
});
