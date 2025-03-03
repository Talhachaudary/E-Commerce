// Define Product Model
class Product {
    constructor(id, name, category, price, img, stock, rating, description) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.img = img;
        this.stock = stock;
        this.rating = rating;
        this.description = description;
        this.reviews = []; // New property to store product reviews
    }
}


// Sample Product Data using the Model
const products = [
    new Product(1, "8GB DDR4 RAM", "ram", 40, "./Images/Ram4.jpeg", 10, 4.5, "High-speed DDR4 RAM for gaming and work."),
    new Product(2, "16GB DDR4 RAM", "ram", 80, "./Images/Ram3.jpeg", 8, 4.8, "Perfect for multitasking and high-performance computing."),
    new Product(3, "256GB SSD", "ssd", 60, "./Images/SSD4.jpeg", 15, 4.7, "Fast and reliable solid-state drive for quick boot times."),
    new Product(4, "512GB SSD", "ssd", 100, "./Images/SSD3.jpeg", 12, 4.9, "High-capacity SSD for storing large files securely."),
    new Product(5, "Gaming Headphones", "headphones", 50, "./Images/Headphone5.jpeg", 20, 4.6, "Immersive gaming experience with noise cancellation."),
    new Product(6, "Cooling Pad", "cooling", 25, "./Images/CoolingPad3.jpeg", 18, 4.3, "Prevents overheating and extends laptop life."),
    new Product(7, "RGB Mouse Pad", "mousepad", 20, "./Images/MousePad4.jpeg", 25, 4.2, "Glowing RGB mouse pad with anti-slip base."),
    new Product(8, "Gaming KeyBoard", "KeyBoard", 20, "./Images/keyboard3.jpeg", 30, 4.5, "Mechanical gaming keyboard with RGB lights."),
    new Product(9, "Gaming Mouse", "Mouse", 20, "./Images/gaming-mouse2.jpeg", 22, 4.7, "High-DPI gaming mouse for precision control.")
];

const productContainer = document.getElementById("product-container");

// Function to display products with more details
function displayProducts(filteredProducts) {
    productContainer.innerHTML = "";
    filteredProducts.forEach(product => {
        const div = document.createElement("div");
        div.classList.add("product");
        div.innerHTML = `
            <img src="${product.img}" alt="${product.name}">
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <p>Rating: ${product.rating} ⭐</p>
            <p>Stock: ${product.stock}</p>
            <p>Price: $${product.price}</p>
            <button onclick="addToCart(${product.id})" ${product.stock === 0 ? "disabled" : ""}>${product.stock === 0 ? "Out of Stock" : "Add to Cart"}</button>

            <!-- Reviews Section -->
            <div class="reviews">
                <h3>Customer Reviews</h3>
                <ul id="reviews-${product.id}">
                    ${product.reviews.map(review => `<li><strong>${review.name}</strong>: ${review.text} - ⭐${review.rating}</li>`).join("")}
                </ul>
                <form onsubmit="addReview(event, ${product.id})">
                    <input type="text" id="reviewer-name-${product.id}" placeholder="Your Name" required>
                    <input type="number" id="reviewer-rating-${product.id}" min="1" max="5" placeholder="Rating (1-5)" required>
                    <textarea id="review-text-${product.id}" placeholder="Write a review..." required></textarea>
                    <button type="submit">Submit Review</button>
                </form>
            </div>
        `;
        productContainer.appendChild(div);
    });
}
function addReview(event, productId) {
    event.preventDefault();

    const nameInput = document.getElementById(`reviewer-name-${productId}`);
    const ratingInput = document.getElementById(`reviewer-rating-${productId}`);
    const textInput = document.getElementById(`review-text-${productId}`);
    const reviewsList = document.getElementById(`reviews-${productId}`);

    if (!nameInput.value || !ratingInput.value || !textInput.value) {
        alert("Please fill in all fields.");
        return;
    }

    const review = {
        name: nameInput.value,
        rating: parseInt(ratingInput.value),
        text: textInput.value
    };

    const product = products.find(p => p.id === productId);
    product.reviews.push(review);

    // Append new review to the list
    const li = document.createElement("li");
    li.innerHTML = `<strong>${review.name}</strong>: ${review.text} - ⭐${review.rating}`;
    reviewsList.appendChild(li);

    // Clear input fields after submission
    nameInput.value = "";
    ratingInput.value = "";
    textInput.value = "";
}


displayProducts(products);

// Function to filter products by category
function filterProducts(category) {
    if (category === "all") {
        displayProducts(products);
    } else {
        const filtered = products.filter(product => product.category === category);
        displayProducts(filtered);
    }
}

// Cart Functionality
const cartItems = [];
const cartCount = document.getElementById("cart-count");
const cartOverlay = document.getElementById("cart-overlay");
const cartList = document.getElementById("cart-items");
const checkoutBtn = document.getElementById("checkout-btn");
const closeCartBtn = document.getElementById("close-cart");
const cartToggle = document.getElementById("cart-toggle");

// Add to Cart
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (product.stock > 0) {
        const existingItem = cartItems.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cartItems.push({ ...product, quantity: 1 });
        }
        product.stock--;
        updateCart();
        displayProducts(products);
    } else {
        alert("This product is out of stock!");
    }
}

// Update Cart UI
function updateCart() {
    cartList.innerHTML = "";
    cartItems.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${item.name} (x${item.quantity}) - $${item.price * item.quantity}
            <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
        `;
        cartList.appendChild(li);
    });
    cartCount.textContent = cartItems.length;
}

// Remove Item from Cart
function removeFromCart(id) {
    const index = cartItems.findIndex(item => item.id === id);
    if (index !== -1) {
        const product = products.find(p => p.id === id);
        product.stock += cartItems[index].quantity;
        cartItems.splice(index, 1);
    }
    updateCart();
    displayProducts(products);
}

// Toggle Cart Visibility
cartToggle.addEventListener("click", () => {
    cartOverlay.style.display = "flex";
});

// Close Cart
closeCartBtn.addEventListener("click", () => {
    cartOverlay.style.display = "none";
});

// Checkout Process
checkoutBtn.addEventListener("click", () => {
    if (cartItems.length > 0) {
        alert("Proceeding to checkout...");
        cartItems.length = 0;
        updateCart();
        cartOverlay.style.display = "none";
    } else {
        alert("Your cart is empty!");
    }
});
