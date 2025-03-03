const products = [
    { 
        id: 1, 
        name: "Gaming Mouse", 
        price: 25, 
        img: "./Images/gaming-mouse.png",
        description: "High precision gaming mouse with customizable DPI and RGB lighting.",
        reviews: ["Awesome mouse!", "Great for gaming!", "Smooth and accurate."],
        stock: 15
    },
    { 
        id: 2, 
        name: "Mechanical Keyboard", 
        price: 50, 
        img: "./Images/keyboard1.jpeg",
        description: "Durable mechanical keyboard with tactile feedback and customizable keys.",
        reviews: ["Love the clicky keys!", "Perfect for typing and gaming."],
        stock: 10
    },
    { 
        id: 3, 
        name: "Graphics Card", 
        price: 250, 
        img: "./Images/GraphicCard1.jpeg",
        description: "High-performance graphics card for smooth gaming and rendering.",
        reviews: ["Handles 4K gaming easily.", "A bit noisy, but powerful."],
        stock: 5
    },
    { 
        id: 4, 
        name: "16GB RAM", 
        price: 80, 
        img: "./Images/Ram1.jpeg",
        description: "High speed 16GB DDR4 RAM to boost your system performance.",
        reviews: ["Great value for money!", "Boosted my system speed significantly."],
        stock: 20
    },
    { 
        id: 5, 
        name: "500GB SSD", 
        price: 100, 
        img: "./Images/SSD1.jpeg",
        description: "Fast and reliable 500GB SSD for quick boot times and rapid data access.",
        reviews: ["Super fast!", "Excellent reliability."],
        stock: 8
    },
    { 
        id: 6, 
        name: "Noise-Canceling Headphones", 
        price: 120, 
        img: "./Images/Headphone.jpeg",
        description: "Comfortable noise-canceling headphones perfect for music and gaming.",
        reviews: ["Amazing sound quality.", "Noise cancellation is top-notch."],
        stock: 12
    },
    { 
        id: 7, 
        name: "Cooling Pad", 
        price: 30, 
        img: "./Images/Coolinpad1.jpeg",
        description: "Keep your laptop cool with this efficient cooling pad.",
        reviews: ["Very effective cooling!", "A must-have for heavy laptop users."],
        stock: 25
    },
    { 
        id: 8, 
        name: "Mouse Pad", 
        price: 10, 
        img: "./Images/MousePad1.jpeg",
        description: "Smooth mouse pad with non-slip backing and enhanced precision.",
        reviews: ["Perfect for gaming.", "Quality material and design."],
        stock: 30
    }
];

const productContainer = document.getElementById("products");
const cartItems = [];
const cartCount = document.getElementById("cart-count");
const cartList = document.getElementById("cart-items");
const cartOverlay = document.getElementById("cart-overlay");
const cartToggle = document.getElementById("cart-toggle");
const closeCartBtn = document.getElementById("close-cart");
const checkoutBtn = document.getElementById("checkout-btn");

// Function to display products dynamically
function displayProducts(productArray) {
    productContainer.innerHTML = "";
    productArray.forEach(product => {
        const div = document.createElement("div");
        div.classList.add("product");
        div.innerHTML = `
            <img src="${product.img}" alt="${product.name}">
            <h2>${product.name}</h2>
            <p>$${product.price}</p>
            <button onclick="openProductModal(${product.id})">View Details</button>
        `;
        productContainer.appendChild(div);
    });
}

// Initially display all products
displayProducts(products);

// Function to open product modal and populate details
function openProductModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    // Populate modal elements
    document.getElementById("modal-img").src = product.img;
    document.getElementById("modal-img").alt = product.name;
    document.getElementById("modal-title").textContent = product.name;
    document.getElementById("modal-description").textContent = product.description;
    document.getElementById("modal-stock").textContent = `Remaining Count: ${product.stock}`;

    // Populate reviews list
    const reviewsList = document.getElementById("reviews-list");
    reviewsList.innerHTML = "";
    product.reviews.forEach(review => {
        const li = document.createElement("li");
        li.textContent = review;
        reviewsList.appendChild(li);
    });

    // Update Add to Cart button functionality
    const modalAddToCartBtn = document.getElementById("modal-add-to-cart");
    modalAddToCartBtn.onclick = function() {
        addToCart(id);
    };

    // Show the modal
    document.getElementById("product-modal").style.display = "flex";
}

// Event listener to close the modal
document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("product-modal").style.display = "none";
});

// Optionally, close modal if clicking outside modal-content
window.addEventListener("click", (e) => {
    const modal = document.getElementById("product-modal");
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

// Add to Cart

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product || product.stock <= 0) {
        alert("This item is out of stock!");
        return;
    }

    const cartItem = cartItems.find(item => item.id === id);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cartItems.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    }

    product.stock -= 1; // Reduce stock
    updateCart();
    openProductModal(id); // Update modal stock display
}

function removeFromCart(id) {
    const cartItem = cartItems.find(item => item.id === id);
    const product = products.find(p => p.id === id);

    if (cartItem) {
        cartItem.quantity -= 1;
        product.stock += 1; // Increase stock back

        if (cartItem.quantity === 0) {
            cartItems.splice(cartItems.indexOf(cartItem), 1); // Remove item if quantity reaches zero
        }
    }

    updateCart();
    //openProductModal(id); // Update modal stock display
}

function updateCart() {
    cartList.innerHTML = "";
    cartItems.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `${item.name} - $${item.price} x ${item.quantity} 
            <button onclick="removeFromCart(${item.id})">Remove</button>`;
        cartList.appendChild(li);
    });

    cartCount.textContent = cartItems.length;
}

// Checkout Process
checkoutBtn.addEventListener("click", () => {
    if (cartItems.length > 0) {
        alert("Proceeding to checkout...");
        cartItems.length = 0; // Clear the cart
        updateCart();
        cartOverlay.style.display = "none";
    } else {
        alert("Your cart is empty!");
    }
});


// Toggle Cart Visibility
cartToggle.addEventListener("click", () => {
    cartOverlay.style.display = "flex";
});

// Close Cart
closeCartBtn.addEventListener("click", () => {
    cartOverlay.style.display = "none";
});

// Checkout
checkoutBtn.addEventListener("click", () => {
    if (cartItems.length > 0) {
        alert("Proceeding to checkout...");
        cartItems.length = 0; // Clear the cart
        updateCart();
        cartOverlay.style.display = "none";
    } else {
        alert("Your cart is empty!");
    }
});
