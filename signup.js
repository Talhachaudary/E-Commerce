document.getElementById("signup-form").addEventListener("submit", function(event) {
    event.preventDefault();

    // Get form values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();
    const signupMessage = document.getElementById("signup-message");

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

    // Simulating successful signup (Replace with backend logic)
    signupMessage.style.color = "green";
    signupMessage.textContent = "Signup successful! Redirecting...";

    // Redirect after 1.5 seconds
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1500);
});
