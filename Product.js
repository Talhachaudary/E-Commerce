// API Configuration
const API_URL = "http://127.0.0.1:5000";

// Define Product Model
class Product {
    constructor(id, name, category, price, img, stock, rating, description) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.img = img;
        this.stock = stock;
        this.rating = rating || 0;
        this.description = description;
        this.reviews = []; // Will be populated from backend
    }
}

// Global variables
let products = [];
let categories = [];
let cartItems = [];
let currentUser = null;
const productContainer = document.getElementById("product-container");

// Initialize the application
document.addEventListener("DOMContentLoaded", function() {
    // Check if user is logged in
    const token = localStorage.getItem("userToken");
    if (token) {
        fetchUserProfile();
    }
    
    // Fetch all products and categories
    fetchProducts();
    fetchCategories();
    
    // Load cart from localStorage
    loadCart();
    
    // Set up modal and event listeners
    setupProductModal();
    setupEventListeners();
});

// Handle API errors
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

// Fetch user profile
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
            const userData = await response.json();
            currentUser = userData;
            updateUIForLoggedInUser();
        } else {
            // Token might be expired
            localStorage.removeItem("userToken");
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn && currentUser) {
        loginBtn.textContent = `Hi, ${currentUser.username}`;
        loginBtn.href = "#";
        loginBtn.onclick = function(e) {
            e.preventDefault();
            showUserMenu();
        };
        
        // Update review form if it exists
        setupReviewForm();
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
    localStorage.removeItem("userToken");
    currentUser = null;
    window.location.reload();
}

// Shows loading indicator in the specified container
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading products...</p>
            </div>
        `;
    }
}

// Fetch all products from API
async function fetchProducts(category = "", sortBy = "default") {
    try {
        showLoading("product-container");
        
        let url = `${API_URL}/api/products`;
        let params = [];
        
        if (category) {
            params.push(`category=${encodeURIComponent(category)}`);
        }
        
        if (sortBy !== "default") {
            params.push(`sort=${sortBy}`);
        }
        
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }
        
        const data = await response.json();
        
        // Handle different API response structures
        if (data.products && Array.isArray(data.products)) {
            products = data.products;
        } else if (Array.isArray(data)) {
            products = data;
        } else {
            throw new Error("Invalid product data format");
        }
        
        displayProducts(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        const container = document.getElementById("product-container");
        if (container) {
            container.innerHTML = `<div class="error">Failed to load products. Please try again later.</div>`;
        }
        
        // Show notification
        showNotification("Error loading products. Please try again.", "error");
    }
}

// Fetch product categories
async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}/api/categories`);
        if (!response.ok) {
            throw new Error("Failed to fetch categories");
        }
        
        const data = await response.json();
        
        // Handle different API response structures
        if (data.categories && Array.isArray(data.categories)) {
            categories = data.categories;
        } else if (Array.isArray(data)) {
            categories = data;
        } else {
            throw new Error("Invalid category data format");
        }
        
        // Create category filters
        createCategoryFilters(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        const container = document.getElementById("category-filters");
        if (container) {
            container.innerHTML = `<div class="error">Failed to load categories.</div>`;
        }
    }
}

// Create category filter buttons
function createCategoryFilters(categories) {
    const container = document.getElementById("category-filters");
    if (!container) return;
    
    // Clear loading message
    container.innerHTML = '';
    
    // Add "All Products" filter
    const allBtn = document.createElement("button");
    allBtn.className = "filter-btn active";
    allBtn.setAttribute("data-category", "");
    allBtn.textContent = "All Products";
    container.appendChild(allBtn);
    
    // Add category buttons
    categories.forEach(category => {
        const btn = document.createElement("button");
        btn.className = "filter-btn view-details-btn";
        btn.setAttribute("data-category", category);
        btn.textContent = category;
        container.appendChild(btn);
    });
    
    // Add event listeners to filter buttons
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(button => {
        button.addEventListener("click", function() {
            // Update active class
            filterButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            
            // Filter products
            const category = this.getAttribute("data-category");
            fetchProducts(category);
        });
    });
}

// Display products in UI
function displayProducts(productArray) {
    const container = document.getElementById("product-container");
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Check if no products
    if (productArray.length === 0) {
        const noProductsMsg = document.getElementById('no-products-message');
        if (noProductsMsg) {
            noProductsMsg.style.display = 'flex';
        } else {
            container.innerHTML = '<div class="no-products">No products found</div>';
        }
        return;
    }
    
    // Hide no products message
    const noProductsMsg = document.getElementById('no-products-message');
    if (noProductsMsg) {
        noProductsMsg.style.display = 'none';
    }
    
    // Create product cards
    productArray.forEach(product => {
        const productCard = document.createElement("div");
        productCard.className = "product";
        productCard.innerHTML = `
            <img src="${API_URL}/api/admin/uploads/${product.img}" alt="${product.name}" onerror="this.src='./Images/placeholder.jpg'">
            <h2>${product.name}</h2>
            <p class="price">$${product.price.toFixed(2)}</p>
            <div class="stock ${product.stock < 5 ? 'low-stock' : ''}">
                ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </div>
            <button class="view-details-btn">View Details</button>
        `;
        
        // Add click event for view details button
        const viewDetailsBtn = productCard.querySelector(".view-details-btn");
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener("click", () => {
                openProductModal(product.id);
            });
        }
        
        container.appendChild(productCard);
    });
}

// Set up product modal functionality
function setupProductModal() {
    // Get modal elements
    const modal = document.getElementById('product-modal');
    const closeModal = document.getElementById('close-modal');
    
    if (!modal) return;
    
    // Close modal when clicking X button
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Add event listener for "Add to Cart" button in modal
    const addToCartBtn = document.getElementById('modal-add-to-cart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const productId = Number(modal.getAttribute('data-product-id'));
            addToCart(productId);
        });
    }
}

// Open product modal with details
async function openProductModal(productId) {
    try {
        const modal = document.getElementById('product-modal');
        if (!modal) return;
        
        // Fetch latest product details
        const response = await fetch(`${API_URL}/api/products/${productId}`);
        if (!response.ok) {
            throw new Error("Failed to get product details");
        }
        
        const product = await response.json();
        
        // Set modal product ID
        modal.setAttribute('data-product-id', product.id);
        
        // Populate modal with product info
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-price').textContent = `$${product.price.toFixed(2)}`;
        document.getElementById('modal-category').textContent = `Category: ${product.category}`;
        document.getElementById('modal-stock').textContent = `Available: ${product.stock} in stock`;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-img').src = `${API_URL}/api/admin/uploads/${product.img}`;
        document.getElementById('modal-img').onerror = function() { this.src = './Images/placeholder.jpg'; };
        
        // Show stock warning if low stock
        const stockWarning = document.getElementById('stock-warning');
        if (stockWarning) {
            if (product.stock < 5 && product.stock > 0) {
                stockWarning.textContent = `Only ${product.stock} left in stock - order soon`;
                stockWarning.style.display = 'block';
            } else if (product.stock <= 0) {
                stockWarning.textContent = "Out of Stock";
                stockWarning.style.display = 'block';
            } else {
                stockWarning.style.display = 'none';
            }
        }
        
        // Update Add to Cart button
        const addToCartBtn = document.getElementById('modal-add-to-cart');
        if (addToCartBtn) {
            if (product.stock <= 0) {
                addToCartBtn.disabled = true;
                addToCartBtn.textContent = "Out of Stock";
            } else {
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = "Add to Cart";
            }
        }
        
        // Load product reviews
        // loadProductReviews(product.id);
        
        // Setup review form if user is logged in
        // setupReviewForm(product.id);
        
        // Display modal
        modal.style.display = 'flex';
    } catch (error) {
        console.error("Error opening product modal:", error);
        showNotification("Failed to load product details", "error");
    }
}

// Load product reviews
// async function loadProductReviews(productId) {
//     try {
//         const reviewsList = document.getElementById('reviews-list');
//         if (!reviewsList) return;
        
//         // Show loading
//         reviewsList.innerHTML = '<li class="loading">Loading reviews...</li>';
        
//         // Fetch reviews
//         const response = await fetch(`${API_URL}/api/products/${productId}/reviews`);
        
//         if (!response.ok) {
//             throw new Error("Failed to fetch reviews");
//         }
        
//         const reviews = await response.json();
        
//         // Display reviews
//         if (reviews.length === 0) {
//             reviewsList.innerHTML = '<li class="no-reviews">No reviews yet for this product.</li>';
//         } else {
//             reviewsList.innerHTML = '';
//             reviews.forEach(review => {
//                 const li = document.createElement('li');
//                 li.className = 'review';
//                 li.innerHTML = `
//                     <div class="review-header">
//                         <div class="reviewer">${review.user_name || 'Anonymous'}</div>
//                         <div class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
//                     </div>
//                     <div class="review-text">${review.text}</div>
//                     <div class="review-date">${new Date(review.created_at).toLocaleDateString()}</div>
//                 `;
//                 reviewsList.appendChild(li);
//             });
//         }
//     } catch (error) {
//         console.error("Error loading reviews:", error);
//         const reviewsList = document.getElementById('reviews-list');
//         if (reviewsList) {
//             reviewsList.innerHTML = '<li class="error">Error loading reviews. Please try again.</li>';
//         }
//     }
// }

// // Setup review form for logged in users
// function setupReviewForm(productId) {
//     const reviewFormContainer = document.getElementById('review-form-container');
//     if (!reviewFormContainer) return;
    
//     if (currentUser) {
//         reviewFormContainer.innerHTML = `
//             <h4>Write a Review</h4>
//             <form id="review-form">
//                 <div class="rating-select">
//                     <label>Your Rating:</label>
//                     <div class="stars">
//                         <input type="radio" id="star5" name="rating" value="5" required />
//                         <label for="star5">★</label>
//                         <input type="radio" id="star4" name="rating" value="4" />
//                         <label for="star4">★</label>
//                         <input type="radio" id="star3" name="rating" value="3" />
//                         <label for="star3">★</label>
//                         <input type="radio" id="star2" name="rating" value="2" />
//                         <label for="star2">★</label>
//                         <input type="radio" id="star1" name="rating" value="1" />
//                         <label for="star1">★</label>
//                     </div>
//                 </div>
//                 <textarea id="review-text" placeholder="Share your thoughts about this product..." required></textarea>
//                 <button type="submit">Submit Review</button>
//             </form>
//         `;
        
//         // Add submit handler for review form
//         const reviewForm = document.getElementById('review-form');
//         if (reviewForm) {
//             reviewForm.addEventListener('submit', async (e) => {
//                 e.preventDefault();
                
//                 // Get form values
//                 const rating = document.querySelector('input[name="rating"]:checked')?.value;
//                 if (!rating) {
//                     showNotification("Please select a rating", "error");
//                     return;
//                 }
                
//                 const text = document.getElementById('review-text').value.trim();
//                 if (!text) {
//                     showNotification("Please enter your review", "error");
//                     return;
//                 }
                
//                 try {
//                     const token = localStorage.getItem('userToken');
//                     if (!token) {
//                         showNotification("Please log in to submit a review", "error");
//                         return;
//                     }
                    
//                     // Submit review
//                     const response = await fetch(`${API_URL}/api/products/${productId}/reviews`, {
//                         method: 'POST',
//                         headers: {
//                             'Content-Type': 'application/json',
//                             'Authorization': `Bearer ${token}`
//                         },
//                         body: JSON.stringify({ rating, text })
//                     });
                    
//                     if (!response.ok) {
//                         const error = await response.json();
//                         throw new Error(error.message || "Failed to submit review");
//                     }
                    
//                     // Reset form
//                     reviewForm.reset();
                    
//                     // Show success message
//                     showNotification("Review submitted successfully!", "success");
                    
//                     // Reload reviews
//                     loadProductReviews(productId);
                    
//                 } catch (error) {
//                     console.error("Error submitting review:", error);
//                     showNotification(error.message || "Failed to submit review", "error");
//                 }
//             });
//         }
//     } else {
//         reviewFormContainer.innerHTML = `
//             <div class="login-prompt">
//                 <p>Please <a href="login.html">login</a> to leave a review.</p>
//             </div>
//         `;
//     }
// }

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
        updateCartCounter();
    }
}

// Add to cart
function addToCart(productId) {
    // Find product by ID
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Check if product is in stock
    if (product.stock <= 0) {
        showNotification("Sorry, this item is out of stock", "error");
        return;
    }
    
    // Check if already in cart
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
        // Check if adding one more would exceed stock
        if (existingItem.quantity >= product.stock) {
            showNotification("Cannot add more - stock limit reached", "error");
            return;
        }
        existingItem.quantity++;
    } else {
        // Add new item to cart
        cartItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            img: product.img,
            quantity: 1
        });
    }
    
    // Update localStorage and UI
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCounter();
    
    // Show success notification
    showNotification(`${product.name} added to your cart!`, "success");
    
    // Update cart display if it's open
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay && cartOverlay.style.display === 'flex') {
        updateCartDisplay();
    }
}

// Update cart counter in nav
function updateCartCounter() {
    const cartCount = document.getElementById('cart-count');
    if (!cartCount) return;
    
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Setup other event listeners
function setupEventListeners() {
    // Cart toggle
    const cartToggle = document.getElementById('cart-toggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const cartOverlay = document.getElementById('cart-overlay');
            if (cartOverlay) {
                cartOverlay.style.display = 'flex';
                updateCartDisplay();
            }
        });
    }
    
    // Close cart button
    const closeCartBtn = document.getElementById('close-cart');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            const cartOverlay = document.getElementById('cart-overlay');
            if (cartOverlay) {
                cartOverlay.style.display = 'none';
            }
        });
    }
    
    // Checkout button - THIS WAS MISSING
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            processCheckout();
        });
    }
    
    // Search form
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (!searchInput) return;
            
            const searchTerm = searchInput.value.trim().toLowerCase();
            
            if (searchTerm === '') {
                // If search is empty, show all products
                displayProducts(products);
                return;
            }
            
            // Filter products by search term
            const filteredProducts = products.filter(product => 
                product.name.toLowerCase().includes(searchTerm) || 
                product.description.toLowerCase().includes(searchTerm)
            );
            
            displayProducts(filteredProducts);
        });
    }
}

// Update cart display
function updateCartDisplay() {
    const cartItemsList = document.getElementById('cart-items');
    const cartTotal = document.querySelector('.cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (!cartItemsList) return;
    
    // Get cart from localStorage to ensure it's fresh
    const cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<li class="empty-cart">Your cart is empty</li>';
        if (cartTotal) cartTotal.innerHTML = 'Total: <span>$0.00</span>';
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }
    
    // Calculate total
    let total = 0;
    cartItemsList.innerHTML = '';
    
    // Add each item to cart
    cart.forEach(item => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        
        li.innerHTML = `
            <img src="${API_URL}/api/admin/uploads/${item.img}" alt="${item.name}" onerror="this.src='./Images/placeholder.jpg'">
            <div class="item-details">
                <h4>${item.name}</h4>
                <div class="price-qty">
                    <span>$${item.price.toFixed(2)} × ${item.quantity}</span>
                    <div class="qty-controls">
                        <button class="remove-item-btn" data-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="add-item-btn" data-id="${item.id}">+</button>
                    </div>
                </div>
            </div>
            <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
        `;
        
        cartItemsList.appendChild(li);
        total += item.price * item.quantity;
    });
    
    // Add event listeners for cart buttons
    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            removeFromCart(id);
        });
    });
    
    document.querySelectorAll('.add-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            addToCart(id);
        });
    });
    
    // Update total
    if (cartTotal) cartTotal.innerHTML = `Total: <span>$${total.toFixed(2)}</span>`;
    if (checkoutBtn) checkoutBtn.disabled = false;
}

// Remove from cart
function removeFromCart(productId) {
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (!existingItem) return;
    
    if (existingItem.quantity > 1) {
        // Reduce quantity by 1
        existingItem.quantity--;
    } else {
        // Remove item from cart
        const index = cartItems.findIndex(item => item.id === productId);
        cartItems.splice(index, 1);
    }
    
    // Update localStorage and UI
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCounter();
    updateCartDisplay();
    
    // Show notification
    showNotification("Item removed from cart", "info");
}

// Show notification
function showNotification(message, type = "info") {
    const notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        // Create notification container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    
    const container = document.getElementById('notification-container') || document.body;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    container.appendChild(notification);
    
    // Show notification (with animation)
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300); // Wait for fade out animation
    }, 3000);
}

// Process checkout - SIMPLIFIED VERSION
function processCheckout() {
    // Check if user is logged in
    const token = localStorage.getItem('userToken');
    if (!token) {
        showNotification("Please log in to complete checkout", "error");
        
        // Redirect to login page with return URL
        setTimeout(() => {
            window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
        }, 1500);
        return;
    }
    
    // Show processing notification
    showNotification("Processing your order...", "info");
    
    // Get cart items
    const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    if (items.length === 0) {
        showNotification("Your cart is empty", "error");
        return;
    }
    
    // Prepare order data
    const orderData = {
        items: items.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        })),
        shipping_address: {
            address: "Default Address", 
            city: "Default City",
            state: "Default State",
            zip: "00000"
        },
        payment_method: "credit_card" 
    };
    
    // Submit order to backend
    fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || "Checkout failed");
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Order created successfully:", data);
        
        // Clear cart
        localStorage.removeItem('cartItems');
        cartItems = [];
        updateCartCounter();
        
        // Close cart overlay
        const cartOverlay = document.getElementById('cart-overlay');
        if (cartOverlay) {
            cartOverlay.style.display = 'none';
        }
        
        // Show confirmation modal instead of redirecting
        const orderId = data.id || data.order_id;
        showOrderConfirmationModal(orderId);
    })
    .catch(error => {
        console.error("Checkout error:", error);
        showNotification(error.message || "There was an error processing your order", "error");
    });
}

// Add this function to display a modal
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