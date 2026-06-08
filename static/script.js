// API Base URL
const API_URL = 'http://localhost:5000/api';

// Global state
let currentUser = null;
let allItems = [];
let cart = [];
let currentView = 'billing';
let isLoginMode = true;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const formTitle = document.getElementById('formTitle');
const fullNameGroup = document.getElementById('fullNameGroup');
const submitBtn = document.getElementById('submitBtn');
const toggleText = document.getElementById('toggleText');
const toggleModeLink = document.getElementById('toggleMode');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        showApp();
    }
}

function setupEventListeners() {
    // Login/Register toggle
    toggleModeLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });

    // Login form submit
    loginForm.addEventListener('submit', handleAuthSubmit);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // View toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });

    // Cart actions
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    document.getElementById('completePaymentBtn').addEventListener('click', completePayment);

    // Item search
    document.getElementById('itemSearch').addEventListener('input', handleItemSearch);

    // Category filter
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const category = e.target.dataset.category;
            filterByCategory(category);
        });
    });

    // Dashboard actions
    document.getElementById('addItemBtn').addEventListener('click', () => openItemModal());
    document.getElementById('closeModal').addEventListener('click', closeItemModal);
    document.getElementById('cancelModal').addEventListener('click', closeItemModal);
    document.getElementById('itemForm').addEventListener('submit', handleItemSubmit);

    // Bill modal
    document.getElementById('closeBillModal').addEventListener('click', closeBillModal);
    document.getElementById('newOrderBtn').addEventListener('click', () => {
        closeBillModal();
        clearCart();
    });
    document.getElementById('printBillBtn').addEventListener('click', printBill);
}

// ==================== AUTHENTICATION ====================
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        formTitle.textContent = 'Welcome Back';
        document.querySelector('.form-subtitle').textContent = 'Sign in to continue';
        fullNameGroup.style.display = 'none';
        submitBtn.textContent = 'Sign In';
        toggleText.innerHTML = "Don't have an account? <a href='#' id='toggleMode'>Create one</a>";
    } else {
        formTitle.textContent = 'Create Account';
        document.querySelector('.form-subtitle').textContent = 'Register as a new cashier';
        fullNameGroup.style.display = 'block';
        submitBtn.textContent = 'Register';
        toggleText.innerHTML = "Already have an account? <a href='#' id='toggleMode'>Sign in</a>";
    }
    
    // Re-attach event listener
    document.getElementById('toggleMode').addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthMode();
    });
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('fullName').value;
    
    const endpoint = isLoginMode ? '/login' : '/register';
    const data = isLoginMode ? 
        { username, password } : 
        { username, password, full_name: fullName };
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = isLoginMode ? 'Signing in...' : 'Registering...';
        
        const response = await fetch(API_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (isLoginMode) {
                currentUser = result.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                showApp();
            } else {
                alert('Registration successful! Please sign in.');
                toggleAuthMode();
                loginForm.reset();
            }
        } else {
            alert(result.message || 'Authentication failed');
        }
    } catch (error) {
        console.error('Auth error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isLoginMode ? 'Sign In' : 'Register';
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        loginScreen.classList.add('active');
        appScreen.classList.remove('active');
        loginForm.reset();
    }
}

function showApp() {
    loginScreen.classList.remove('active');
    appScreen.classList.add('active');
    
    // Update user info
    document.getElementById('userName').textContent = currentUser.full_name;
    const initials = currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userInitials').textContent = initials;
    
    // Load data
    loadItems();
    loadDashboardStats();
}

// ==================== VIEW SWITCHING ====================
function switchView(view) {
    currentView = view;
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(view + 'View').classList.add('active');
    
    // Load data if needed
    if (view === 'dashboard') {
        loadDashboardStats();
        loadInventory();
    }
}

// ==================== ITEMS MANAGEMENT ====================
async function loadItems() {
    try {
        const response = await fetch(API_URL + '/items');
        allItems = await response.json();
        displayItems(allItems);
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

function displayItems(items) {
    const grid = document.getElementById('itemsGrid');
    
    if (items.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No items found</p>';
        return;
    }
    
    grid.innerHTML = items.map(item => {
        const emoji = getItemEmoji(item.category);
        const isOutOfStock = item.stock === 0;
        const isLowStock = item.stock > 0 && item.stock < 20;
        
        return `
            <div class="item-card ${isOutOfStock ? 'out-of-stock' : ''}" 
                 onclick="addToCart(${item.id})" 
                 ${isOutOfStock ? 'title="Out of stock"' : ''}>
                <div class="item-emoji">${emoji}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">₹${parseFloat(item.price).toFixed(2)}</div>
                <div class="item-stock ${isLowStock ? 'low' : ''}">
                    ${isOutOfStock ? 'Out of stock' : `Stock: ${item.stock}`}
                </div>
            </div>
        `;
    }).join('');
}

function getItemEmoji(category) {
    const emojis = {
        'Snacks': '🍿',
        'Beverages': '🥤',
        'Main Course': '🍽️',
        'General': '🛒'
    };
    return emojis[category] || '🛒';
}

function handleItemSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );
    displayItems(filtered);
}

function filterByCategory(category) {
    if (category === 'all') {
        displayItems(allItems);
    } else {
        const filtered = allItems.filter(item => item.category === category);
        displayItems(filtered);
    }
}

// ==================== CART MANAGEMENT ====================
function addToCart(itemId) {
    const item = allItems.find(i => i.id === itemId);
    
    if (!item || item.stock === 0) {
        return;
    }
    
    const existingItem = cart.find(i => i.id === itemId);
    
    if (existingItem) {
        if (existingItem.quantity < item.stock) {
            existingItem.quantity++;
            existingItem.subtotal = existingItem.quantity * existingItem.price;
        } else {
            alert('Cannot add more. Stock limit reached.');
            return;
        }
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            quantity: 1,
            subtotal: parseFloat(item.price),
            maxStock: item.stock
        });
    }
    
    updateCartDisplay();
}

function updateCartQuantity(itemId, change) {
    const item = cart.find(i => i.id === itemId);
    
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(itemId);
    } else if (item.quantity > item.maxStock) {
        item.quantity = item.maxStock;
        alert('Cannot exceed available stock');
    } else {
        item.subtotal = item.quantity * item.price;
        updateCartDisplay();
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(i => i.id !== itemId);
    updateCartDisplay();
}

function clearCart() {
    if (cart.length > 0 && confirm('Clear all items from cart?')) {
        cart = [];
        updateCartDisplay();
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const subtotal = document.getElementById('subtotal');
    const total = document.getElementById('total');
    const completeBtn = document.getElementById('completePaymentBtn');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div class="empty-icon">🛒</div>
                <p>No items added yet</p>
                <small>Select items from the left to add to cart</small>
            </div>
        `;
        subtotal.textContent = '₹0.00';
        total.textContent = '₹0.00';
        completeBtn.disabled = true;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price.toFixed(2)} each</div>
                </div>
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                </div>
                <div style="font-weight: 600; min-width: 80px; text-align: right;">₹${item.subtotal.toFixed(2)}</div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Remove item">×</button>
            </div>
        `).join('');
        
        const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        subtotal.textContent = `₹${cartTotal.toFixed(2)}`;
        total.textContent = `₹${cartTotal.toFixed(2)}`;
        completeBtn.disabled = false;
    }
}

// ==================== PAYMENT ====================
async function completePayment() {
    if (cart.length === 0) return;
    
    if (!confirm('Complete this payment?')) return;
    
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    
    const transactionData = {
        cashier_id: currentUser.id,
        items: cart,
        total_amount: total
    };
    
    try {
        const response = await fetch(API_URL + '/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showBillReceipt(result.transaction, result.token_number, cart);
            cart = [];
            updateCartDisplay();
            loadItems(); // Reload items to update stock
        } else {
            alert('Transaction failed: ' + result.message);
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('An error occurred during payment.');
    }
}

function showBillReceipt(transaction, tokenNumber, items) {
    const modal = document.getElementById('billModal');
    const receipt = document.getElementById('billReceipt');
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN');
    const timeStr = now.toLocaleTimeString('en-IN');
    
    receipt.innerHTML = `
        <div class="receipt-header">
            <h2>🍽️ Canteen Receipt</h2>
            <p>Thank you for your order!</p>
        </div>
        
        <div class="receipt-info">
            <div><strong>Token:</strong> ${tokenNumber}</div>
            <div><strong>Date:</strong> ${dateStr}</div>
            <div><strong>Time:</strong> ${timeStr}</div>
            <div><strong>Cashier:</strong> ${currentUser.full_name}</div>
        </div>
        
        <div class="receipt-items">
            <div style="display: flex; justify-content: space-between; font-weight: 600; border-bottom: 2px solid var(--text-primary); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
            </div>
            ${items.map(item => `
                <div class="receipt-item">
                    <div style="flex: 1;">${item.name}</div>
                    <div style="width: 40px; text-align: center;">${item.quantity}</div>
                    <div style="width: 70px; text-align: right;">₹${item.price.toFixed(2)}</div>
                    <div style="width: 80px; text-align: right;">₹${item.subtotal.toFixed(2)}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="receipt-total">
            <span>TOTAL</span>
            <span>₹${parseFloat(transaction.total_amount).toFixed(2)}</span>
        </div>
        
        <div class="receipt-footer">
            <p>Payment Status: COMPLETED</p>
            <p>Please collect your order at counter</p>
            <p style="margin-top: 1rem;">━━━━━━━━━━━━━━━━━━━━━━━</p>
            <p>Have a great day! 😊</p>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeBillModal() {
    document.getElementById('billModal').classList.remove('active');
}

function printBill() {
    window.print();
}

// ==================== DASHBOARD ====================
async function loadDashboardStats() {
    try {
        const response = await fetch(API_URL + '/dashboard/stats');
        const stats = await response.json();
        
        document.getElementById('todaySales').textContent = `₹${stats.total_sales.toFixed(2)}`;
        document.getElementById('totalTransactions').textContent = stats.total_transactions;
        document.getElementById('lowStock').textContent = stats.low_stock_count;
        document.getElementById('totalItems').textContent = stats.total_items;
        
        displayTopItems(stats.top_items);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function displayTopItems(items) {
    const grid = document.getElementById('topItemsGrid');
    
    if (items.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No sales data for today</p>';
        return;
    }
    
    grid.innerHTML = items.map(item => `
        <div class="top-item">
            <div class="top-item-info">
                <h4>${item.item_name}</h4>
                <p>${item.total_quantity} units sold</p>
            </div>
            <div class="top-item-stats">
                <div class="top-item-revenue">₹${parseFloat(item.total_revenue).toFixed(2)}</div>
                <div class="top-item-quantity">Revenue</div>
            </div>
        </div>
    `).join('');
}

async function loadInventory() {
    try {
        const response = await fetch(API_URL + '/items');
        const items = await response.json();
        displayInventory(items);
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

function displayInventory(items) {
    const tbody = document.getElementById('inventoryTableBody');
    
    tbody.innerHTML = items.map(item => {
        const stockStatus = item.stock === 0 ? 'out-of-stock' : 
                           item.stock < 20 ? 'low-stock' : 'in-stock';
        const stockLabel = item.stock === 0 ? 'Out of Stock' : 
                          item.stock < 20 ? 'Low Stock' : 'In Stock';
        
        return `
            <tr>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>₹${parseFloat(item.price).toFixed(2)}</td>
                <td>${item.stock}</td>
                <td><span class="stock-badge ${stockStatus}">${stockLabel}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn edit" onclick="editItem(${item.id})" title="Edit">✏️</button>
                        <button class="icon-btn delete" onclick="deleteItem(${item.id})" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== ITEM MODAL ====================
function openItemModal(itemId = null) {
    const modal = document.getElementById('itemModal');
    const form = document.getElementById('itemForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    
    if (itemId) {
        const item = allItems.find(i => i.id === itemId);
        if (item) {
            title.textContent = 'Edit Item';
            document.getElementById('itemId').value = item.id;
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemPrice').value = item.price;
            document.getElementById('itemStock').value = item.stock;
            document.getElementById('itemCategory').value = item.category;
        }
    } else {
        title.textContent = 'Add New Item';
    }
    
    modal.classList.add('active');
}

function closeItemModal() {
    document.getElementById('itemModal').classList.remove('active');
}

async function handleItemSubmit(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('itemId').value;
    const name = document.getElementById('itemName').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const stock = parseInt(document.getElementById('itemStock').value);
    const category = document.getElementById('itemCategory').value;
    
    const data = { name, price, stock, category };
    
    try {
        const url = itemId ? `${API_URL}/items/${itemId}` : `${API_URL}/items`;
        const method = itemId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeItemModal();
            loadItems();
            loadInventory();
            loadDashboardStats();
        } else {
            alert('Failed to save item');
        }
    } catch (error) {
        console.error('Error saving item:', error);
        alert('An error occurred while saving the item');
    }
}

function editItem(itemId) {
    openItemModal(itemId);
}

async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await fetch(`${API_URL}/items/${itemId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadItems();
            loadInventory();
            loadDashboardStats();
        } else {
            alert('Failed to delete item');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('An error occurred while deleting the item');
    }
}
