// =============================================
// CORE FUNCTIONALITY - main.js
// =============================================

// DOM Elements
const sidebar = document.querySelector('.sidebar');
const sidebarLinks = document.querySelectorAll('.nav-link');
const mainContent = document.querySelector('.main-content');
const currentDateElement = document.getElementById('current-date');
const retailerNameElement = document.getElementById('retailer-name');
const profileInitials = document.getElementById('profile-initials');
const profileFullname = document.getElementById('profile-fullname');
const shopInfo = document.getElementById('shop-info');
const logoutBtn = document.querySelector('.logout-btn');

// Global Data Stores
let inventory = [];
let suppliers = [];
let orders = [];
let invoices = [];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Load retailer profile
    loadRetailerProfile();
    
    // Initialize date display
    updateDate();
    
    // Load data from localStorage or generate sample data
    loadInitialData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize the current page
    initializePage();
});

// Load retailer profile from localStorage
function loadRetailerProfile() {
    const profile = JSON.parse(localStorage.getItem('retailerProfile')) || {
        name: "Sarah Retailer",
        shopName: "SuperMart",
        shopId: "#ID-2345",
        location: "Mumbai",
        currency: "₹"
    };
    
    retailerNameElement.textContent = profile.name;
    profileFullname.textContent = profile.name;
    shopInfo.textContent = `${profile.shopName} ${profile.shopId} | ${profile.location}`;
    profileInitials.textContent = profile.name.split(' ').map(n => n[0]).join('');
}

// Update current date display
function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateElement.textContent = now.toLocaleDateString('en-US', options);
}

// Load initial data
function loadInitialData() {
    // Load inventory
    inventory = JSON.parse(localStorage.getItem('inventory')) || generateSampleInventory();
    
    // Load suppliers
    suppliers = JSON.parse(localStorage.getItem('suppliers')) || generateSampleSuppliers();
    
    // Load orders
    orders = JSON.parse(localStorage.getItem('orders')) || generateSampleOrders();
    
    // Load invoices
    invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    
    // Save initial data if it was generated
    saveAllData();
}

// Generate sample inventory data
function generateSampleInventory() {
    const sampleInventory = [];
    const categories = ["Dairy", "Bakery", "Beverages", "Snacks", "Fruits", "Vegetables", "Personal Care", "Household"];
    const brands = ["Amul", "Britannia", "Nestle", "Coca-Cola", "Pepsi", "Dabur", "HUL", "P&G", "ITC", "Parle"];
    const products = ["Milk", "Bread", "Eggs", "Butter", "Cheese", "Yogurt", "Apple", "Banana", "Orange", "Tomato", "Potato", "Onion"];
    
    for (let i = 1; i <= 150; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const purchasePrice = parseFloat((Math.random() * 500 + 10).toFixed(2));
        const sellingPrice = parseFloat((purchasePrice * (1.2 + Math.random() * 0.5)).toFixed(2));
        const quantity = Math.floor(Math.random() * 100);
        const minStock = Math.floor(Math.random() * 10) + 5;
        const salesVelocity = parseFloat((Math.random() * 10).toFixed(1));
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + Math.floor(Math.random() * 90) + 1);
        
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        
        sampleInventory.push({
            id: `PROD${i.toString().padStart(5, '0')}`,
            name: `${brands[Math.floor(Math.random() * brands.length)]} ${products[Math.floor(Math.random() * products.length)]}`,
            category: category,
            purchasePrice: purchasePrice,
            sellingPrice: sellingPrice,
            quantity: quantity,
            minStock: minStock,
            salesVelocity: salesVelocity,
            expiryDate: expiryDate.toISOString().split('T')[0],
            supplierId: supplier.id,
            supplierName: supplier.name,
            lastRestocked: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            margin: parseFloat(((sellingPrice - purchasePrice) / sellingPrice * 100).toFixed(1))
        });
    }
    
    return sampleInventory;
}

// Generate sample supplier data
function generateSampleSuppliers() {
    const sampleSuppliers = [];
    const companyNames = ["Fresh Foods Ltd.", "Bakery Delights", "Beverage World", "SnackMasters", 
                         "Green Grocers", "Personal Care Inc.", "Home Essentials", "Dairy King", 
                         "Premium Produce", "Global Snacks"];
    
    const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad"];
    
    for (let i = 1; i <= 25; i++) {
        sampleSuppliers.push({
            id: `SUP${i.toString().padStart(4, '0')}`,
            name: companyNames[Math.floor(Math.random() * companyNames.length)],
            contact: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            email: `contact@supplier${i}.com`,
            address: `${Math.floor(Math.random() * 100)} Main St, ${cities[Math.floor(Math.random() * cities.length)]}`,
            deliveryTime: Math.floor(Math.random() * 4) + 1,
            trustScore: Math.floor(Math.random() * 31) + 70, // 70-100
            productTypes: getRandomProductTypes(),
            minOrder: [10, 20, 50, 100][Math.floor(Math.random() * 4)],
            performance: {
                onTime: Math.floor(Math.random() * 10) + 90, // 90-100%
                accuracy: Math.floor(Math.random() * 10) + 90, // 90-100%
                stockAvailability: Math.floor(Math.random() * 15) + 85 // 85-100%
            }
        });
    }
    
    return sampleSuppliers;
}

// Get random product types for suppliers
function getRandomProductTypes() {
    const types = ["Dairy", "Bakery", "Beverages", "Snacks", "Fruits", "Vegetables", "Personal Care", "Household"];
    const selected = [];
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 types
    
    while (selected.length < count) {
        const type = types[Math.floor(Math.random() * types.length)];
        if (!selected.includes(type)) {
            selected.push(type);
        }
    }
    
    return selected.join(", ");
}

// Generate sample orders
function generateSampleOrders() {
    const sampleOrders = [];
    const statuses = ["Pending", "Delivered", "Cancelled", "Processing"];
    
    for (let i = 1; i <= 50; i++) {
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        const itemsCount = Math.floor(Math.random() * 5) + 1;
        const totalAmount = parseFloat((Math.random() * 5000 + 500).toFixed(2));
        
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 60));
        
        sampleOrders.push({
            id: `ORD${i.toString().padStart(5, '0')}`,
            date: orderDate.toISOString().split('T')[0],
            supplierId: supplier.id,
            supplierName: supplier.name,
            itemsCount: itemsCount,
            totalAmount: totalAmount,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            deliveryTime: supplier.deliveryTime + Math.floor(Math.random() * 2)
        });
    }
    
    return sampleOrders;
}

// Save all data to localStorage
function saveAllData() {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.setItem('invoices', JSON.stringify(invoices));
}

// Set up event listeners
function setupEventListeners() {
    // Sidebar navigation
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Load the appropriate page
            const page = link.getAttribute('data-section') || 'dashboard';
            loadPage(page);
        });
    });
    
    // Logout button
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('retailerProfile');
            window.location.href = 'login.html';
        }
    });
    
    // Add item button (exists on multiple pages)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'add-item-btn' || e.target.closest('#add-item-btn')) {
            document.getElementById('add-item-modal').classList.add('active');
        }
    });
    
    // Modal close buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close') || 
            e.target.classList.contains('btn-outline')) {
            document.querySelectorAll('.form-modal').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

// Initialize the current page
function initializePage() {
    const path = window.location.pathname.split('/').pop();
    let page = 'dashboard';
    
    if (path === 'inventory.html') page = 'inventory';
    else if (path === 'orders.html') page = 'smart-orders';
    else if (path === 'suppliers.html') page = 'suppliers';
    else if (path === 'profits.html') page = 'reports';
    else if (path === 'invoices.html') page = 'invoice';
    else if (path === 'settings.html') page = 'settings';
    
    loadPage(page);
}

// Load page content
function loadPage(page) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the requested section
    const sectionId = `${page}-section`;
    const section = document.getElementById(sectionId);
    
    if (section) {
        section.style.display = 'block';
        
        // Initialize page-specific content
        switch(page) {
            case 'dashboard':
                initDashboard();
                break;
            case 'inventory':
                initInventory();
                break;
            case 'smart-orders':
                initSmartOrders();
                break;
            case 'suppliers':
                initSuppliers();
                break;
            case 'reports':
                initReports();
                break;
            case 'invoice':
                initInvoice();
                break;
            case 'settings':
                initSettings();
                break;
        }
    } else {
        // Default to dashboard if section not found
        document.getElementById('dashboard-section').style.display = 'block';
        initDashboard();
    }
}

// Initialize Dashboard page
function initDashboard() {
    // Update stats cards
    updateDashboardCards();
    
    // Populate inventory table
    populateInventoryTable(inventory.slice(0, 15));
    
    // Generate AI alerts
    generateAIBusinessAlerts();
    
    // Generate business tips
    generateAIBusinessTips();
    
    // Initialize charts
    initDashboardCharts();
}

// Initialize Inventory page
function initInventory() {
    populateInventoryTable(inventory);
    generateAIStockAlerts();
    setupInventoryEventListeners();
}

// Initialize Smart Orders page
function initSmartOrders() {
    generateReorderSuggestions();
    populateOrderHistory();
    setupSmartOrderEventListeners();
}

// Initialize Suppliers page
function initSuppliers() {
    populateSuppliersTable();
    generateSupplierAnalytics();
    setupSupplierEventListeners();
}

// Initialize Reports page
function initReports() {
    updateProfitCards();
    generateMarginAnalysis();
    initReportCharts();
}

// Initialize Invoice page
function initInvoice() {
    populateInvoiceOrderSelect();
    populateRecentInvoices();
    setupInvoiceEventListeners();
}

// Initialize Settings page
function initSettings() {
    loadSettings();
    setupSettingsEventListeners();
}

// Update dashboard stats cards
function updateDashboardCards() {
    // Total Revenue (simulated)
    const revenue = inventory.reduce((sum, item) => sum + (item.sellingPrice * item.salesVelocity * 30), 0);
    document.getElementById('total-revenue').textContent = `₹${revenue.toFixed(2)}`;
    
    // Total Products
    document.getElementById('total-products').textContent = inventory.length;
    
    // Pending Orders
    const pendingOrders = orders.filter(order => order.status === 'Pending').length;
    document.getElementById('pending-orders').textContent = pendingOrders;
    
    // Stock Alerts
    const lowStockItems = inventory.filter(item => item.quantity < item.minStock).length;
    document.getElementById('stock-alerts').textContent = lowStockItems;
}

// Populate inventory table
function populateInventoryTable(items) {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    items.forEach(item => {
        const margin = calculateMargin(item.purchasePrice, item.sellingPrice);
        const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
        const stockHealth = getStockHealth(item.quantity, item.minStock);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>
                <span class="stock-health ${stockHealth}"></span>
                ${item.quantity} ${item.quantity < item.minStock ? '<span class="badge badge-danger">LOW</span>' : ''}
            </td>
            <td>₹${item.purchasePrice.toFixed(2)}</td>
            <td>₹${item.sellingPrice.toFixed(2)}</td>
            <td><span class="${margin < 15 ? 'badge badge-warning' : 'badge badge-success'}">${margin}%</span></td>
            <td>
                ${item.expiryDate}
                ${daysUntilExpiry <= 7 ? `<span class="badge ${daysUntilExpiry < 0 ? 'badge-danger' : 'badge-warning'}">${daysUntilExpiry < 0 ? 'EXPIRED' : `${daysUntilExpiry}d`}</span>` : ''}
            </td>
            <td>${item.supplierName}</td>
            <td>
                <button class="action-btn edit-item" data-id="${item.id}" title="Edit">✏️</button>
                <button class="action-btn delete-item" data-id="${item.id}" title="Delete">🗑️</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Calculate margin percentage
function calculateMargin(purchasePrice, sellingPrice) {
    return ((sellingPrice - purchasePrice) / sellingPrice * 100).toFixed(1);
}

// Get days until expiry
function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get stock health indicator
function getStockHealth(quantity, minStock) {
    if (quantity < minStock * 0.3) return 'red';
    if (quantity < minStock) return 'yellow';
    return 'green';
}

// Generate AI business alerts
function generateAIBusinessAlerts() {
    const alertsContainer = document.getElementById('ai-alerts-container');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    
    // Get AI alerts
    const aiAlerts = generateBusinessAlerts();
    
    aiAlerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${alert.type}`;
        alertDiv.innerHTML = `
            <div class="alert-icon">${alert.icon}</div>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
            </div>
        `;
        alertsContainer.appendChild(alertDiv);
    });
}

// Generate AI business tips
function generateAIBusinessTips() {
    const tipsContainer = document.getElementById('business-tips-container');
    if (!tipsContainer) return;
    
    tipsContainer.innerHTML = '';
    
    // Get AI tips
    const aiTips = generateBusinessTips();
    
    aiTips.forEach(tip => {
        const tipDiv = document.createElement('div');
        tipDiv.className = `alert alert-${tip.type}`;
        tipDiv.innerHTML = `
            <div class="alert-icon">💡</div>
            <div class="alert-content">
                <h4>${tip.title}</h4>
                <p>${tip.message}</p>
            </div>
        `;
        tipsContainer.appendChild(tipDiv);
    });
}

// Initialize dashboard charts
function initDashboardCharts() {
    // Sales Chart
    const salesCtx = document.getElementById('salesChartCanvas').getContext('2d');
    const salesChart = new Chart(salesCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Monthly Sales (₹)',
                data: [185000, 192000, 210000, 205000, 230000, 245000, 240000, 250000, 235000, 240000, 260000, 280000],
                backgroundColor: 'rgba(67, 97, 238, 0.7)',
                borderColor: 'rgba(67, 97, 238, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
    
    // Profit Distribution Chart
    const profitCtx = document.getElementById('profitChartCanvas').getContext('2d');
    const profitChart = new Chart(profitCtx, {
        type: 'pie',
        data: {
            labels: ['Dairy', 'Bakery', 'Beverages', 'Snacks', 'Fruits', 'Vegetables', 'Personal Care', 'Household'],
            datasets: [{
                label: 'Profit by Category (₹)',
                data: [18500, 12400, 15600, 21000, 9800, 11500, 14200, 16800],
                backgroundColor: [
                    'rgba(67, 97, 238, 0.7)',
                    'rgba(114, 9, 183, 0.7)',
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(255, 152, 0, 0.7)',
                    'rgba(33, 150, 243, 0.7)',
                    'rgba(244, 67, 54, 0.7)',
                    'rgba(156, 39, 176, 0.7)',
                    'rgba(0, 150, 136, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Show toast notification
function showToast(title, message, isSuccess = true) {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    toast.className = `toast ${isSuccess ? 'toast-success' : 'toast-error'}`;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// =============================================
// Additional page-specific functions would go here
// =============================================