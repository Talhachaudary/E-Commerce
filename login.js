document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault();

    // Get form values
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const loginMessage = document.getElementById("login-message");

    // Simple validation
    if (email === "" || password === "") {
        loginMessage.style.color = "red";
        loginMessage.textContent = "Please fill in all fields.";
        return;
    }

    // Simulating authentication (Replace with backend authentication logic)
    if (email === "admin@techstore.com" && password === "admin123") {
        loginMessage.style.color = "green";
        loginMessage.textContent = "Login successful! Redirecting...";
        
        // Redirect after 1.5 seconds
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);
    } else {
        loginMessage.style.color = "red";
        loginMessage.textContent = "Invalid email or password.";
    }
});
