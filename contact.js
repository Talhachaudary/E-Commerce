document.getElementById("contact-form").addEventListener("submit", function(event) {
    event.preventDefault();

    // Get form values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();
    const formMessage = document.getElementById("form-message");

    // Basic validation
    if (name === "" || email === "" || message === "") {
        formMessage.style.color = "red";
        formMessage.textContent = "Please fill in all fields.";
        return;
    }

    // Simulating form submission
    formMessage.style.color = "green";
    formMessage.textContent = "Your message has been sent successfully!";

    // Clear the form fields after submission
    document.getElementById("contact-form").reset();
});
