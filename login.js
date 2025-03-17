// API Configuration
const API_URL = "http://127.0.0.1:5000"; // Change this to your actual backend URL

document.addEventListener("DOMContentLoaded", function() {
    // Check if user is already logged in
    const userToken = localStorage.getItem("userToken");
    const adminToken = localStorage.getItem("adminToken");
    
    if (userToken) {
        // Redirect based on role
       
            // window.location.href = "index.html";
        
    }

    // Get form elements
    const loginForm = document.getElementById("login-form");
    const loginMessage = document.getElementById("login-message");
    const loginBtn = document.getElementById("login-btn");
    const userTypeSelector = document.getElementById("user-type");
    
    if (loginForm) {
        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            
            // Get form values
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const userType = userTypeSelector ? userTypeSelector.value : "user"; // Default to user if selector doesn't exist
            
            // Simple validation
            if (email === "" || password === "") {
                showMessage("Please fill in all fields.", "error");
                return;
            }
            
            // Show loading state
            loginBtn.disabled = true;
            loginBtn.innerHTML = "Logging in...";
            showMessage("Authenticating...", "info");
            
            try {
                let endpoint, credentials;
                
                if (userType === "admin") {
                    // Admin login
                    endpoint = `${API_URL}/api/admin/login`;
                    credentials = { username: email, password: password };
                } else {
                    // User login
                    endpoint = `${API_URL}/api/user/login`;
                    credentials = { email: email, password: password };
                }
                
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(credentials)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Successful login
                    showMessage("Login successful! Redirecting...", "success");
                    
                    // Store token based on user type
                    if (userType === "admin") {
                        localStorage.setItem("adminToken", data.access_token);
                        localStorage.setItem("adminUsername", data.data.username);
                        
                        // Redirect to admin dashboard after 1.5 seconds
                        setTimeout(() => {
                            window.location.href = "admin/dashboard.html";
                        }, 1500);
                    } else {
                        onLoginSuccess(data.access_token, data);
                    }
                } else {
                    // Login failed
                    showMessage(data.error || "Authentication failed", "error");
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = "Login";
                }
            } catch (error) {
                console.error("Login error:", error);
                showMessage("Connection error. Please try again later.", "error");
                loginBtn.disabled = false;
                loginBtn.innerHTML = "Login";
            }
        });
    }
    
    // Registration form handling
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            
            const username = document.getElementById("register-username").value.trim();
            const email = document.getElementById("register-email").value.trim();
            const password = document.getElementById("register-password").value.trim();
            const confirmPassword = document.getElementById("confirm-password").value.trim();
            const registerBtn = document.getElementById("register-btn");
            const registerMessage = document.getElementById("register-message");
            
            // Validation
            if (!username || !email || !password || !confirmPassword) {
                showRegisterMessage("Please fill in all fields", "error");
                return;
            }
            
            if (password !== confirmPassword) {
                showRegisterMessage("Passwords do not match", "error");
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showRegisterMessage("Please enter a valid email address", "error");
                return;
            }
            
            // Password strength validation
            if (password.length < 6) {
                showRegisterMessage("Password must be at least 6 characters", "error");
                return;
            }
            
            // Show loading state
            registerBtn.disabled = true;
            registerBtn.innerHTML = "Creating Account...";
            showRegisterMessage("Creating your account...", "info");
            
            try {
                const response = await fetch(`${API_URL}/api/user/register`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Registration successful
                    showRegisterMessage("Registration successful! You can now log in.", "success");
                    
                    // Clear form fields
                    registerForm.reset();
                    
                    // Switch to login tab after 2 seconds
                    setTimeout(() => {
                        // If you have tabs, activate the login tab
                        const loginTab = document.querySelector('a[href="#login"]');
                        if (loginTab) loginTab.click();
                    }, 2000);
                } else {
                    // Registration failed
                    showRegisterMessage(data.error || "Registration failed", "error");
                }
            } catch (error) {
                console.error("Registration error:", error);
                showRegisterMessage("Connection error. Please try again later.", "error");
            } finally {
                registerBtn.disabled = false;
                registerBtn.innerHTML = "Register";
            }
        });
    }
    
    // Helper functions
    function showMessage(message, type) {
        if (loginMessage) {
            loginMessage.textContent = message;
            
            // Set color based on message type
            if (type === "error") {
                loginMessage.style.color = "red";
            } else if (type === "success") {
                loginMessage.style.color = "green";
            } else {
                loginMessage.style.color = "blue";
            }
        }
    }
    
    function showRegisterMessage(message, type) {
        const registerMessage = document.getElementById("register-message");
        if (registerMessage) {
            registerMessage.textContent = message;
            
            // Set color based on message type
            if (type === "error") {
                registerMessage.style.color = "red";
            } else if (type === "success") {
                registerMessage.style.color = "green";
            } else {
                registerMessage.style.color = "blue";
            }
        }
    }
    
    // Toggle password visibility
    const togglePasswordBtns = document.querySelectorAll(".toggle-password");
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
});

// Logout function
function logout() {
    // Clear all authentication data
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsername");
    
    // Redirect to login page
    window.location.href = "login.html";
}

// Add this to your login success handler
function onLoginSuccess(token, userData) {
    // Save auth data
    localStorage.setItem('userToken', token);
    localStorage.setItem('userName', userData.username);
    localStorage.setItem('userEmail', userData.email);
    
    // Check if there's a redirect URL in the query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');
    
    // Show success notification
    showNotification("Login successful!", "success");
    
    // Redirect back to the original page or to home
    setTimeout(() => {
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = "index.html";
        }
    }, 1000);
}

function showNotification(message, type = "info") {
    // Create notification element if it doesn't exist
    let notification = document.querySelector(".notification");
    if (!notification) {
        notification = document.createElement("div");
        notification.className = "notification";
        document.body.appendChild(notification);
    }
    
    // Set message and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    notification.classList.add("show");
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

// Add this to ensure notifications have proper styling
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            transform: translateY(-100px);
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
        }
        
        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .notification.success {
            background-color: #4CAF50;
        }
        
        .notification.error {
            background-color: #f44336;
        }
        
        .notification.info {
            background-color: #2196F3;
        }
    </style>
`);
