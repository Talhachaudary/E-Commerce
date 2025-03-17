// API Configuration
const API_URL = "http://127.0.0.1:5000"; 

// Global variables
let products = [];
let categories = [];
const cartItems = [];
const productContainer = document.getElementById("products");
const cartCount = document.getElementById("cart-count");
const cartList = document.getElementById("cart-items");
const cartOverlay = document.getElementById("cart-overlay");
const cartToggle = document.getElementById("cart-toggle");
const closeCartBtn = document.getElementById("close-cart");
const checkoutBtn = document.getElementById("checkout-btn");
let currentUser = null;

// Initialize the application on page load
document.addEventListener("DOMContentLoaded", function() {
    // Check if user is logged in
    const token = localStorage.getItem("userToken");
    if (token) {
        fetchUserProfile();
    } else {
        updateLoginButton();
    }
    
    // Fetch products and categories from backend
    fetchCategories();
    fetchProducts();
    
    // Load cart from localStorage
    loadCart();
    
    // Set up event listeners
    setupEventListeners();
});

function handleApiError(response) {
    if (response.status === 401) {
        // Unauthorized - token expired
        localStorage.removeItem("userToken");
        showNotification("Your session has expired. Please login again.", "error");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
        return;
    }
    
    if (response.status === 403) {
        // Forbidden - insufficient permissions
        showNotification("You don't have permission to perform this action.", "error");
        return;
    }
    
    // Handle other status codes appropriately
    throw new Error(`API error: ${response.statusText}`);
}
// Fetch user profile from backend
async function fetchUserProfile() {
    try {
        const token = localStorage.getItem("userToken");
        if (!token) return;
        
        const response = await fetch(`${API_URL}/api/user/profile`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            updateLoginButton();
        } else {
            // Token might be expired
            localStorage.removeItem("userToken");
            updateLoginButton();
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
    }
}

// Update login/logout button based on auth state
function updateLoginButton() {
    const loginBtn = document.querySelector('.login-btn');
    if (!loginBtn) return;
    
    if (currentUser) {
        loginBtn.textContent = `Hi, ${currentUser.username}`;
        loginBtn.href = "#";
        loginBtn.onclick = function(e) {
            e.preventDefault();
            showUserMenu();
        };
    } else {
        loginBtn.textContent = "Login";
        loginBtn.href = "login.html";
        loginBtn.onclick = null;
    }
}

// Show user dropdown menu
function showUserMenu() {
    const menu = document.getElementById("user-menu");
    if (!menu) {
        const menuDiv = document.createElement("div");
        menuDiv.id = "user-menu";
        menuDiv.className = "user-menu";
        menuDiv.innerHTML = `
            <ul>
                <li><a href="profile.html">My Profile</a></li>
                <li><a href="orders.html">My Orders</a></li>
                <li><a href="#" onclick="logout(); return false;">Logout</a></li>
            </ul>
        `;
        document.querySelector('.login-btn').parentNode.appendChild(menuDiv);
    } else {
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    }
    
    // Close menu when clicking outside
    document.addEventListener("click", function closeMenu(e) {
        if (!e.target.closest('.login-btn') && !e.target.closest('#user-menu')) {
            const menu = document.getElementById("user-menu");
            if (menu) menu.style.display = "none";
            document.removeEventListener("click", closeMenu);
        }
    });
}

// Logout function
function logout() {
    // Clear all authentication data
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    // Show notification
    showNotification("You have been logged out successfully", "info");
    
    // Redirect to login page
    window.location.href = "login.html";
}

// Fetch products from backend
async function fetchProducts(category = "") {
    try {
        showLoading("products");
        
        let url = `${API_URL}/api/products`;
        if (category) {
            url += `?category=${category}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch products");
        
        const data = await response.json();
        
        // Fix: Check the structure of your API response
        if (data.products && Array.isArray(data.products)) {
            // If products are in a 'products' property (common API pattern)
            products = data.products;
        } else if (Array.isArray(data)) {
            // If the response itself is the array of products
            products = data;
        } else {
            // If we can't find an array of products
            throw new Error("Invalid product data format from API");
        }
        
        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        const container = document.getElementById("products") || productContainer;
        if (container) {
            container.innerHTML = `<div class="error">Failed to load products. Please try again later.<br>Error: ${error.message}</div>`;
        }
    }
}

// Fetch categories from backend
async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}/api/categories`);
        if (!response.ok) throw new Error("Failed to fetch categories");
        
        const data = await response.json();
        
        // Fix: Handle the API response structure
        if (data.categories && Array.isArray(data.categories)) {
            categories = data.categories;
        } else if (Array.isArray(data)) {
            categories = data;
        } else {
            throw new Error("Invalid category data format from API");
        }
        
        // Create category filters
        createCategoryFilters(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        const filterContainer = document.getElementById("category-filters");
        if (filterContainer) {
            filterContainer.innerHTML = `<div class="error">Failed to load categories.</div>`;
        }
    }
}

// Create category filter buttons
function createCategoryFilters(categories) {
    const filterContainer = document.getElementById("category-filters");
    if (!filterContainer) return;
    
    // Add "All Products" filter
    filterContainer.innerHTML = `<button class="filter-btn active" data-category="">All Products</button>`;
    
    // Add category filters
    categories.forEach(category => {
        filterContainer.innerHTML += `
            <button class="filter-btn view-details-btn" data-category="${category}">${category}</button>
        `;
    });
    
    // Add event listeners to filter buttons
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(button => {
        button.addEventListener("click", function() {
            // Set active class
            filterButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            
            // Filter products
            const category = this.getAttribute("data-category");
            fetchProducts(category);
        });
    });
}

// Show loading indicator
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
}

// Function to display products dynamically
function displayProducts(productArray) {
    if (!productContainer) return;
    
    if (productArray.length === 0) {
        productContainer.innerHTML = `<div class="no-products">No products found</div>`;
        return;
    }
    
    productContainer.innerHTML = "";
    productArray.forEach(product => {
        const div = document.createElement("div");
        div.classList.add("product");
        div.innerHTML = `
            <img src="${API_URL}/api/admin/uploads/${product.img}" alt="${product.name}" onerror="this.src='./Images/placeholder.jpg'">
            <div class="product-styling">
            <h2>${product.name}</h2>
            <p class="price">$${product.price.toFixed(2)}</p>
            <div class="stock ${product.stock < 5 ? 'low-stock' : ''}">
                ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </div>
            </div>
            <button 
                onclick="openProductModal(${product.id})" 
                class="view-btn">View Details</button>
        `;
        productContainer.appendChild(div);
    });
}

// Function to open product modal and populate details
async function openProductModal(id) {
    try {
        // Get latest product data from server
        const response = await fetch(`${API_URL}/api/products/${id}`);
        if (!response.ok) throw new Error("Could not get product details");
        
        const product = await response.json();
        
        // Populate modal elements
        document.getElementById("modal-img").src = `${API_URL}/api/admin/uploads/${product.img}`;
        document.getElementById("modal-img").alt = product.name;
        document.getElementById("modal-title").textContent = product.name;
        document.getElementById("modal-price").textContent = `$${product.price.toFixed(2)}`;
        document.getElementById("modal-description").textContent = product.description;
        document.getElementById("modal-stock").textContent = `Remaining: ${product.stock}`;
        document.getElementById("modal-category").textContent = `Category: ${product.category}`;
        
        // Update stock warning
        const stockWarning = document.getElementById("stock-warning");
        if (product.stock < 5 && product.stock > 0) {
            stockWarning.textContent = "Low Stock! Order soon.";
            stockWarning.style.display = "block";
        } else if (product.stock <= 0) {
            stockWarning.textContent = "Out of Stock";
            stockWarning.style.display = "block";
        } else {
            stockWarning.style.display = "none";
        }

        // Fetch reviews for this product
        // try {
        //     const reviewsResponse = await fetch(`${API_URL}/api/products/${id}/reviews`);
        //     const reviews = reviewsResponse.ok ? await reviewsResponse.json() : [];
            
        //     // Populate reviews list
        //     const reviewsList = document.getElementById("reviews-list");
        //     reviewsList.innerHTML = "";
            
        //     if (reviews.length === 0) {
        //         reviewsList.innerHTML = "<li class='no-reviews'>No reviews yet</li>";
        //     } else {
        //         reviews.forEach(review => {
        //             const li = document.createElement("li");
        //             li.innerHTML = `
        //                 <div class="review-header">
        //                     <span class="reviewer">${review.user_name}</span>
        //                     <span class="rating">${'⭐'.repeat(review.rating)}</span>
        //                 </div>
        //                 <div class="review-text">${review.text}</div>
        //             `;
        //             reviewsList.appendChild(li);
        //         });
        //     }
        // } catch (error) {
        //     console.error("Error fetching reviews:", error);
        //     document.getElementById("reviews-list").innerHTML = "<li class='error'>Failed to load reviews</li>";
        // }

        // Update Add to Cart button functionality
        const modalAddToCartBtn = document.getElementById("modal-add-to-cart");
        if (product.stock > 0) {
            modalAddToCartBtn.disabled = false;
            modalAddToCartBtn.textContent = "Add to Cart";
            modalAddToCartBtn.onclick = function() {
                addToCart(id);
            };
        } else {
            modalAddToCartBtn.disabled = true;
            modalAddToCartBtn.textContent = "Out of Stock";
        }

        // Show the modal
        document.getElementById("product-modal").style.display = "flex";
    } catch (error) {
        console.error("Error opening product modal:", error);
        showNotification("Failed to load product details", "error");
    }
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) {
        cartItems.length = 0; // Clear current cart
        const parsedCart = JSON.parse(savedCart);
        parsedCart.forEach(item => cartItems.push(item));
    }
    updateCart();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
}

// Add to Cart Function
function addToCart(id) {
    // Find product by ID
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Check if in stock
    if (product.stock <= 0) {
        showNotification("This item is out of stock!", "error");
        return;
    }

    // Check if already in cart
    const cartItem = cartItems.find(item => item.id === id);
    if (cartItem) {
        // Check if we can add more
        if (cartItem.quantity >= product.stock) {
            showNotification("Cannot add more - stock limit reached", "error");
            return;
        }
        cartItem.quantity += 1;
    } else {
        cartItems.push({
            id: product.id, 
            name: product.name, 
            price: product.price, 
            img: product.img,
            quantity: 1
        });
    }

    // Update cart display
    updateCart();
    saveCart();
    
    // Show success message
    showNotification(`${product.name} added to cart!`, "success");
}

// Remove from Cart
function removeFromCart(id) {
    const index = cartItems.findIndex(item => item.id === id);
    if (index > -1) {
        // Remove one from quantity or remove entirely if quantity is 1
        if (cartItems[index].quantity > 1) {
            cartItems[index].quantity -= 1;
        } else {
            cartItems.splice(index, 1);
        }
        
        updateCart();
        saveCart();
    }
}

// Update Cart UI
function updateCart() {
    // Update cart counter
    if (cartCount) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Update cart list
    if (!cartList) return;
    
    cartList.innerHTML = "";
    let total = 0;
    
    if (cartItems.length === 0) {
        cartList.innerHTML = "<li class='empty-cart'>Your cart is empty</li>";
        if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
        cartItems.forEach(item => {
            const li = document.createElement("li");
            li.className = "cart-item";
            
            li.innerHTML = `
                <img src="${API_URL}/api/admin/uploads/${item.img}" alt="${item.name}" class="cart-item-img" onerror="this.src='./Images/placeholder.jpg'">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="price-quantity">
                        <span>$${item.price.toFixed(2)} × ${item.quantity}</span>
                    </div>
                    <div class="cart-item-controls">
                        <button onclick="removeFromCart(${item.id})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="addToCart(${item.id})">+</button>
                    </div>
                </div>
                <span class="item-total">$${(item.price * item.quantity).toFixed(2)}</span>
            `;
            
            cartList.appendChild(li);
            total += item.price * item.quantity;
        });
        
        if (checkoutBtn) checkoutBtn.disabled = false;
    }
    
    // Update total
    const cartTotal = document.getElementById("cart-total");
    if (cartTotal) {
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Close modal button
    const closeModal = document.getElementById("close-modal");
    if (closeModal) {
        closeModal.addEventListener("click", () => {
            document.getElementById("product-modal").style.display = "none";
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
        const modal = document.getElementById("product-modal");
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
    
    // Toggle cart visibility
    if (cartToggle) {
        cartToggle.addEventListener("click", (e) => {
            e.preventDefault();
            if (cartOverlay) cartOverlay.style.display = "flex";
        });
    }
    
    // Close cart
    if (closeCartBtn) {
        closeCartBtn.addEventListener("click", () => {
            if (cartOverlay) cartOverlay.style.display = "none";
        });
    }
    
    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            checkout();
        });
    }
    
    // Search functionality
    const searchForm = document.getElementById("search-form");
    if (searchForm) {
        searchForm.addEventListener("submit", function(e) {
            e.preventDefault();
            const searchTerm = document.getElementById("search-input").value.trim().toLowerCase();
            
            if (searchTerm) {
                const filteredProducts = products.filter(product => 
                    product.name.toLowerCase().includes(searchTerm) || 
                    product.description.toLowerCase().includes(searchTerm)
                );
                displayProducts(filteredProducts);
            } else {
                displayProducts(products);
            }
        });
    }
}

// Checkout Process
async function checkout() {
    // Check if cart is empty
    if (cartItems.length === 0) {
        showNotification("Your cart is empty", "error");
        return;
    }
    
    // Check if user is logged in
    if (!localStorage.getItem("userToken")) {
        showNotification("Please log in to checkout", "error");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }
    
    try {
        const token = localStorage.getItem("userToken");
        
        // Create order object
        const orderItems = cartItems.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
        }));
        
        const orderTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Send order to backend
        const response = await fetch(`${API_URL}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                items: orderItems,
                total: orderTotal
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to place order");
        }
        
        const result = await response.json();
        
        // Clear cart
        cartItems.length = 0;
        saveCart();
        updateCart();
        
        // Close cart overlay
        if (cartOverlay) cartOverlay.style.display = "none";
        
        // Show success message
        showNotification("Order placed successfully!", "success");
        console.log("line 603:: ", result);
        // CHANGED: Show order confirmation modal instead of redirecting
        const orderId = result.order_id || result.id;
        showOrderConfirmationModal(orderId);
        
    } catch (error) {
        console.error("Checkout error:", error);
        showNotification(error.message || "Failed to place order", "error");
    }
}

// Show notification
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

// NEW FUNCTION: Add Order Confirmation Modal
function showOrderConfirmationModal(orderId) {
    // Create modal backdrop
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';
    
    // Set modal content with success message and buttons
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="success-icon">
                <svg viewBox="0 0 52 52">
                    <circle cx="26" cy="26" r="25" fill="none" />
                    <path d="M14.1 27.2l7.1 7.2 16.7-16.8" fill="none" />
                </svg>
            </div>
            <h2>Order Successful!</h2>
            <p class="order-number">Order #${orderId}</p>
            <p>Your order has been placed successfully.</p>
            <p>A confirmation email will be sent shortly.</p>
            <div class="buttons">
                <button class="continue-btn">Continue Shopping</button>
            </div>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(modalBackdrop);
    document.body.appendChild(modal);
    
    // Add CSS for animation
    document.head.insertAdjacentHTML('beforeend', `
        <style>
            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.6);
                z-index: 999;
                animation: fadeIn 0.3s ease-out;
            }
            
            .confirmation-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 450px;
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 5px 30px rgba(0,0,0,0.15);
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            }
            
            .modal-content {
                padding: 30px;
                text-align: center;
            }
            
            .close-modal {
                position: absolute;
                top: 15px;
                right: 20px;
                font-size: 28px;
                font-weight: bold;
                color: #aaa;
                cursor: pointer;
            }
            
            .close-modal:hover {
                color: #555;
            }
            
            .success-icon {
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                border-radius: 50%;
                border: 3px solid #4CAF50;
                position: relative;
            }
            
            .success-icon svg {
                width: 100%;
                height: 100%;
            }
            
            .success-icon svg circle {
                stroke: #4CAF50;
                stroke-width: 2;
                stroke-dasharray: 166;
                stroke-dashoffset: 166;
                animation: strokeAnimation 1s forwards;
            }
            
            .success-icon svg path {
                stroke: #4CAF50;
                stroke-width: 4;
                stroke-linecap: round;
                stroke-dasharray: 50;
                stroke-dashoffset: 50;
                animation: strokeAnimation 0.6s 0.4s forwards;
            }
            
            .confirmation-modal h2 {
                color: #333;
                margin: 10px 0;
                font-size: 24px;
            }
            
            .order-number {
                font-weight: bold;
                font-size: 18px;
                color: #4CAF50;
                margin-bottom: 15px;
            }
            
            .confirmation-modal p {
                color: #666;
                margin: 10px 0;
                font-size: 16px;
            }
            
            .buttons {
                display: flex;
                justify-content: center;
                margin-top: 25px;
                gap: 15px;
            }
            
            .buttons button {
                padding: 12px 20px;
                border: none;
                border-radius: 5px;
                font-size: 15px;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .continue-btn {
                background-color: #f1f1f1;
                color: #333;
            }
            
            
            .continue-btn:hover {
                background-color: #e1e1e1;
            }
            
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideIn {
                from { transform: translate(-50%, -60%); opacity: 0; }
                to { transform: translate(-50%, -50%); opacity: 1; }
            }
            
            @keyframes strokeAnimation {
                100% { stroke-dashoffset: 0; }
            }
        </style>
    `);
    
    // Remove modal when clicking close button
    modal.querySelector('.close-modal').addEventListener('click', () => {
        removeModal();
    });
    
    // Remove modal when clicking outside
    modalBackdrop.addEventListener('click', () => {
        removeModal();
    });
    
    // Continue shopping button
    modal.querySelector('.continue-btn').addEventListener('click', () => {
        removeModal();
        window.location.href = 'index.html';
    });
    
    // Function to remove modal elements
    function removeModal() {
        modal.style.animation = 'slideOut 0.2s ease-out';
        modalBackdrop.style.animation = 'fadeOut 0.2s ease-out';
        
        // Add CSS for exit animation
        document.head.insertAdjacentHTML('beforeend', `
            <style>
                @keyframes slideOut {
                    to { transform: translate(-50%, -60%); opacity: 0; }
                }
                
                @keyframes fadeOut {
                    to { opacity: 0; }
                }
            </style>
        `);
        
        // Remove elements after animation completes
        setTimeout(() => {
            modal.remove();
            modalBackdrop.remove();
        }, 200);
    }
}
