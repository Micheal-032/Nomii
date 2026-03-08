/* ================================================================
   Nomii Dashboard — dashboard.js
   Full AI-powered dashboard logic for all 5 roles
   ================================================================ */

// ─── Role Config ─────────────────────────────────────────────────
const AI_TABS = ['ai-insights', 'crop-oracle', 'ecosystem', 'alerts', 'lstm',
    'weather', 'market-prices', 'supply-chain', 'api-hub'];
const ROLE_CONFIG = {
    R: {
        name: 'Retailer', icon: 'fa-store', color: '#4361ee', emoji: '🏪',
        tabs: ['overview', 'marketplace', 'orders', 'price-ai', 'earnings', ...AI_TABS]
    },
    S: {
        name: 'Supplier', icon: 'fa-boxes', color: '#7209b7', emoji: '📦',
        tabs: ['overview', 'marketplace', 'my-listings', 'orders', 'earnings', ...AI_TABS]
    },
    D: {
        name: 'Delivery Partner', icon: 'fa-truck', color: '#f72585', emoji: '🚚',
        tabs: ['overview', 'orders', 'logistics', 'earnings', ...AI_TABS]
    },
    F: {
        name: 'Farmer', icon: 'fa-tractor', color: '#2de084', emoji: '🌾',
        tabs: ['overview', 'marketplace', 'my-listings', 'orders', 'price-ai', 'earnings', ...AI_TABS]
    },
    A: {
        name: 'Artisan', icon: 'fa-paint-brush', color: '#f8961e', emoji: '🎨',
        tabs: ['overview', 'marketplace', 'my-listings', 'orders', 'earnings', ...AI_TABS]
    }
};

const TAB_META = {
    'overview': { label: 'Overview', icon: 'fa-th-large' },
    'marketplace': { label: 'Marketplace', icon: 'fa-store' },
    'my-listings': { label: 'My Listings', icon: 'fa-list' },
    'orders': { label: 'Orders', icon: 'fa-receipt' },
    'price-ai': { label: 'Price AI', icon: 'fa-brain' },
    'logistics': { label: 'Logistics', icon: 'fa-route' },
    'earnings': { label: 'Earnings', icon: 'fa-wallet' },
    // ─── AI Roadmap Tabs ───
    'ai-insights': { label: 'AI Insights', icon: 'fa-star', section: 'AI Modules' },
    'crop-oracle': { label: 'Crop Oracle', icon: 'fa-seedling' },
    'ecosystem': { label: 'Ecosystem Graph', icon: 'fa-project-diagram' },
    'alerts': { label: 'Smart Alerts', icon: 'fa-bell' },
    'lstm': { label: 'LSTM Forecast', icon: 'fa-chart-area' },
    // ─── Ecosystem Phase 2 ───
    'weather': { label: 'Weather & NDVI', icon: 'fa-cloud-sun', section: 'Ecosystem AI' },
    'market-prices': { label: 'Market Prices', icon: 'fa-chart-line' },
    'supply-chain': { label: 'Supply Chain', icon: 'fa-boxes' },
    'api-hub': { label: 'API Hub', icon: 'fa-plug' },
};

const PRODUCT_EMOJI = {
    Vegetables: '🥕', Fruits: '🍅', Grains: '🌾',
    Processed: '🏪', Pottery: '🏺', Textile: '🧵', General: '📦'
};

// ─── State ───────────────────────────────────────────────────────
let allProducts = [];
let earningsChart = null;
let demandChart = null;
let earningsDetailChart = null;
let selectedProduct = null;
let activeOrderMode = 'buyer';
const role = USER_DATA.role;
const cfg = ROLE_CONFIG[role] || ROLE_CONFIG['R'];

// ─── Init ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    applyRoleColor(cfg.color);
    buildSidebar();
    buildTopbar();
    setDefaultHarvestDate();
    loadDashboardData();
    switchTab('overview');
});

function applyRoleColor(color) {
    document.documentElement.style.setProperty('--role-color', color);
}

// ─── Sidebar ─────────────────────────────────────────────────────
function buildSidebar() {
    // Brand
    document.getElementById('brandIcon').textContent =
        USER_DATA.roleName ? USER_DATA.roleName[0] : 'N';

    // User info
    document.getElementById('sidebarLoginId').textContent = USER_DATA.loginId;
    document.getElementById('sidebarRoleBadge').textContent = cfg.name;
    document.getElementById('userAvatar').textContent = cfg.emoji;

    // Nav
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = `<div class="nav-section-label">Navigation</div>`;
    let lastSection = null;
    cfg.tabs.forEach(tabId => {
        const m = TAB_META[tabId];
        if (!m) return;
        // Add section label whenever section changes
        if (m.section && m.section !== lastSection) {
            const sec = document.createElement('div');
            sec.className = 'nav-section-label';
            sec.style.marginTop = '10px';
            sec.textContent = m.section === 'AI Modules' ? '⚡ AI Modules' :
                m.section === 'Ecosystem AI' ? '🌐 Ecosystem AI' : m.section;
            nav.appendChild(sec);
            lastSection = m.section;
        }
        const item = document.createElement('div');
        item.className = 'nav-item';
        item.id = `nav-${tabId}`;
        item.innerHTML = `<i class="fas ${m.icon}"></i> ${m.label}`;
        if (tabId === 'orders') item.innerHTML += `<span class="nav-badge" id="ordersBadge" style="display:none">0</span>`;
        item.onclick = () => switchTab(tabId);
        nav.appendChild(item);
    });
}

function buildTopbar() {
    document.getElementById('topbarTitle').textContent = `${cfg.emoji} ${cfg.name} Dashboard`;
    document.getElementById('topbarSub').textContent =
        `Welcome back · ${USER_DATA.loginId} · ${USER_DATA.mobile}`;
}

// ─── Tab Switching ────────────────────────────────────────────────
function switchTab(tabId) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const panel = document.getElementById(`tab-${tabId}`);
    const navEl = document.getElementById(`nav-${tabId}`);
    if (panel) panel.classList.add('active');
    if (navEl) navEl.classList.add('active');

    // Lazy-load tab content
    if (tabId === 'marketplace') loadProducts();
    if (tabId === 'my-listings') loadMyListings();
    if (tabId === 'orders') loadOrders(activeOrderMode);
    if (tabId === 'logistics') loadLogistics();
    if (tabId === 'earnings') loadEarningsDetail();
    // AI modules Phase 1 (defined in ai_modules.js)
    if (tabId === 'ai-insights') loadAIInsights();
    if (tabId === 'crop-oracle') { /* triggered by button */ }
    if (tabId === 'ecosystem') loadEcosystem();
    if (tabId === 'alerts') loadSmartAlerts();
    if (tabId === 'lstm') {
        document.getElementById('lstmMode')?.addEventListener('change', e => {
            document.getElementById('lstmManualInput').style.display = e.target.value === 'manual' ? 'block' : 'none';
        });
    }
    // AI Ecosystem Phase 2 (defined in ecosystem2.js)
    if (tabId === 'weather') { try { loadWeather(); } catch (e) { console.error('loadWeather:', e); } }
    if (tabId === 'market-prices') { try { loadMarketPrices(); } catch (e) { console.error('loadMarketPrices:', e); } }
    if (tabId === 'supply-chain') { try { loadSupplyChain(); } catch (e) { console.error('loadSupplyChain:', e); } }
    if (tabId === 'api-hub') { try { loadApiHub(); } catch (e) { console.error('loadApiHub:', e); } }

    closeSidebar();
}

// ─── Load All Dashboard Data ──────────────────────────────────────
async function loadDashboardData() {
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.querySelector('i').classList.add('fa-spin');

    try {
        const [earningsRes, fraudRes, demandRes, econRes, alertsRes] = await Promise.all([
            fetch('/api/analytics/earnings').then(r => r.json()),
            fetch('/api/fraud-score').then(r => r.json()),
            fetch('/api/demand-forecast').then(r => r.json()),
            fetch('/api/analytics/unit-economics').then(r => r.json()),
            fetch('/api/inventory/alerts').then(r => r.json())
        ]);

        if (earningsRes.success) renderStats(earningsRes);
        if (fraudRes.success) renderTrustScore(fraudRes);
        if (demandRes.success) renderDemandChart(demandRes);
        if (econRes.success) renderUnitEconomics(econRes);
        if (alertsRes.success) renderInventoryAlerts(alertsRes);

    } catch (e) {
        showToast('Could not load dashboard data', 'error');
        console.error(e);
    } finally {
        if (btn) btn.querySelector('i').classList.remove('fa-spin');
    }
}

// ─── Stats Cards ─────────────────────────────────────────────────
function renderStats(data) {
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = '';

    const stats = [
        {
            icon: 'fa-rupee-sign', color: 'rgba(45,224,132,0.15)', iconColor: '#2de084',
            value: `₹${fmt(data.earned)}`, label: 'Total Earnings', trend: `${data.ordersCount} orders completed`
        },
        {
            icon: 'fa-shopping-cart', color: 'rgba(67,97,238,0.15)', iconColor: '#4361ee',
            value: data.ordersCount, label: 'Orders Fulfilled', trend: `₹${fmt(data.gross)} gross value`
        },
        {
            icon: 'fa-box-open', color: 'rgba(248,150,30,0.15)', iconColor: '#f8961e',
            value: data.listingCount, label: 'Active Listings', trend: 'Products on marketplace'
        },
        {
            icon: 'fa-shopping-bag', color: 'rgba(247,37,133,0.15)', iconColor: '#f72585',
            value: `₹${fmt(data.spent)}`, label: 'Total Spent', trend: `${data.buyCount} purchases made`
        },
    ];

    stats.forEach(s => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
      <div class="stat-icon" style="background:${s.color}">
        <i class="fas ${s.icon}" style="color:${s.iconColor}"></i>
      </div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-trend trend-up"><i class="fas fa-arrow-up"></i>${s.trend}</div>`;
        grid.appendChild(card);
    });

    // Weekly earnings chart
    renderEarningsChart(data.weeklyLabels, data.weeklyEarnings);
}

// ─── Chart: Earnings ─────────────────────────────────────────────
function renderEarningsChart(labels, data) {
    const ctx = document.getElementById('earningsChart').getContext('2d');
    if (earningsChart) earningsChart.destroy();
    earningsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Earnings ₹',
                data,
                backgroundColor: 'rgba(67,97,238,0.6)',
                borderColor: '#4361ee',
                borderWidth: 2,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b0' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b0', callback: v => `₹${v}` } }
            }
        }
    });
}

// ─── Chart: Demand Forecast ───────────────────────────────────────
function renderDemandChart(res) {
    const ctx = document.getElementById('demandChart').getContext('2d');
    if (demandChart) demandChart.destroy();
    demandChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: res.labels,
            datasets: res.datasets.map(ds => ({
                label: ds.label, data: ds.data,
                borderColor: ds.color, backgroundColor: ds.color + '22',
                borderWidth: 2, pointRadius: 3, tension: 0.4, fill: true
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    labels: { color: '#8892b0', boxWidth: 10, font: { size: 11 } }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b0' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b0' } }
            }
        }
    });
}

// ─── Trust Score ──────────────────────────────────────────────────
function renderTrustScore(data) {
    const score = data.trustScore;
    const deg = Math.round((score / 100) * 360);
    const ring = document.getElementById('trustRing');
    ring.style.setProperty('--ring-color', data.color);
    ring.style.setProperty('--ring-pct', `${deg}deg`);
    document.getElementById('trustScoreNum').textContent = score;
    document.getElementById('trustScoreNum').style.color = data.color;
    document.getElementById('trustLevel').textContent = data.level;
    document.getElementById('trustLevel').style.color = data.color;

    const sigs = data.signals;
    document.getElementById('trustSignals').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;font-size:12px">
      <div style="background:rgba(255,255,255,0.04);padding:8px 10px;border-radius:8px">
        <div style="color:#8892b0">Total Orders</div>
        <div style="font-weight:700">${sigs.totalOrders}</div>
      </div>
      <div style="background:rgba(255,255,255,0.04);padding:8px 10px;border-radius:8px">
        <div style="color:#8892b0">Cancel Rate</div>
        <div style="font-weight:700">${sigs.cancelRate}%</div>
      </div>
    </div>`;
}

// ─── Unit Economics ───────────────────────────────────────────────
function renderUnitEconomics(data) {
    const rows = [
        ['Total Orders', data.totalOrders],
        ['Total GMV', `₹${fmt(data.totalGMV)}`],
        ['Nomii Revenue', `₹${fmt(data.nomiiRevenue)}`],
        ['Avg Order Value', `₹${fmt(data.avgOrderValue)}`],
        ['Commission Rate', data.commissionRate],
        ['Daily Projection', `₹${fmt(data.dailyProjection)}`],
    ];
    document.getElementById('econTable').innerHTML = rows.map(([k, v]) => `
    <tr>
      <td style="color:#8892b0;font-size:13px;padding:8px 0">${k}</td>
      <td style="text-align:right;font-weight:700;font-size:14px;padding:8px 0">${v}</td>
    </tr>`).join('');
}

// ─── Inventory Alerts ─────────────────────────────────────────────
function renderInventoryAlerts(data) {
    const container = document.getElementById('inventoryAlertContainer');
    if (!data.count) { container.innerHTML = ''; return; }
    container.innerHTML = `
    <div class="alert-banner alert-warning" style="margin-bottom:20px">
      <i class="fas fa-exclamation-triangle" style="font-size:20px"></i>
      <div>
        <strong>Low Stock Alert!</strong><br>
        ${data.count} product(s) below 20 ${data.alerts.map(a => `<em>${a.name}</em> (${a.quantity} ${a.unit})`).join(', ')} — consider restocking.
      </div>
    </div>`;

    // Update badge
    const badge = document.getElementById('ordersBadge');
    if (badge && data.count > 0) {
        badge.textContent = data.count; badge.style.display = 'inline';
    }
}

// ─── Marketplace ──────────────────────────────────────────────────
async function loadProducts() {
    const grid = document.getElementById('productGrid');
    const search = document.getElementById('mktSearch')?.value || '';
    const category = document.getElementById('mktCategory')?.value || '';
    grid.innerHTML = `<div style="color:var(--muted);grid-column:1/-1;text-align:center;padding:40px">
    <i class="fas fa-spinner fa-spin"></i> Loading…</div>`;

    try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (category) params.set('category', category);
        const res = await fetch(`/api/products?${params}`).then(r => r.json());
        allProducts = res.products || [];
        renderProducts(allProducts);
    } catch (e) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fas fa-exclamation-circle"></i><p>Could not load products</p></div>`;
    }
}

function filterProducts() {
    const search = (document.getElementById('mktSearch')?.value || '').toLowerCase();
    const category = document.getElementById('mktCategory')?.value || '';
    const filtered = allProducts.filter(p =>
        (!search || p.name.toLowerCase().includes(search)) &&
        (!category || p.category === category)
    );
    renderProducts(filtered);
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!products.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fas fa-search"></i><p>No products found</p></div>`;
        return;
    }
    grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="openOrderModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
      <div class="product-icon">${PRODUCT_EMOJI[p.category] || '📦'}</div>
      <div class="product-name">${esc(p.name)}</div>
      <div class="product-meta">${esc(p.category)} · ${esc(p.location || '—')}</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end">
        <div>
          <div class="product-price">₹${p.price}/${p.unit}</div>
          <div class="product-qty">${p.quantity} ${p.unit} available</div>
        </div>
        <button class="btn btn-success btn-sm" style="margin:0" onclick="event.stopPropagation();openOrderModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
          Buy
        </button>
      </div>
    </div>`).join('');
}

// ─── My Listings ──────────────────────────────────────────────────
async function loadMyListings() {
    const wrap = document.getElementById('myListingsTable');
    wrap.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div>`;
    try {
        const res = await fetch('/api/products/my').then(r => r.json());
        const rows = res.products || [];
        if (!rows.length) {
            wrap.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>No listings yet. Click "Add New Listing".</p></div>`;
            return;
        }
        wrap.innerHTML = `<table>
      <thead><tr>
        <th>Product</th><th>Category</th><th>Qty</th>
        <th>Price (₹)</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>${rows.map(p => `
        <tr>
          <td><strong>${esc(p.name)}</strong></td>
          <td>${esc(p.category)}</td>
          <td>${p.quantity} ${p.unit}</td>
          <td>₹${p.price}</td>
          <td><span class="badge badge-${p.status}">${p.status}</span></td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"
                    style="margin:0" ${p.status === 'deleted' ? 'disabled' : ''}>
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>`).join('')}
      </tbody></table>`;
    } catch { wrap.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation"></i><p>Load failed</p></div>`; }
}

async function deleteProduct(pid) {
    if (!confirm('Remove this listing?')) return;
    try {
        const res = await fetch(`/api/products/delete/${pid}`, { method: 'POST' }).then(r => r.json());
        if (res.success) { showToast('Listing removed'); loadMyListings(); }
        else showToast(res.message, 'error');
    } catch { showToast('Error removing listing', 'error'); }
}

// ─── Add Listing Modal ────────────────────────────────────────────
function openAddListingModal() {
    openModal('addListingModal');
    // Pre-fill location from user data
    const loc = USER_DATA.village || USER_DATA.location || USER_DATA.region || '';
    document.getElementById('lstLocation').value = loc;
}

async function submitListing() {
    const btn = document.getElementById('submitListingBtn');
    const name = document.getElementById('lstName').value.trim();
    const category = document.getElementById('lstCategory').value;
    const qty = parseFloat(document.getElementById('lstQty').value);
    const unit = document.getElementById('lstUnit').value;
    const price = parseFloat(document.getElementById('lstPrice').value);
    const market = parseFloat(document.getElementById('lstMarket').value) || price;
    const harvest = document.getElementById('lstHarvest').value;
    const location = document.getElementById('lstLocation').value.trim();
    const desc = document.getElementById('lstDesc').value.trim();

    if (!name || !qty || !price) { showToast('Name, quantity & price required', 'error'); return; }

    btn.disabled = true;
    try {
        const res = await fetch('/api/products/add', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name, category, quantity: qty, unit, price, marketPrice: market,
                harvestDate: harvest, location, description: desc
            })
        }).then(r => r.json());
        if (res.success) {
            showToast(res.message);
            closeModal('addListingModal');
            loadMyListings();
            loadDashboardData();
        } else { showToast(res.message, 'error'); }
    } catch { showToast('Error adding listing', 'error'); }
    finally { btn.disabled = false; }
}

// ─── Orders ───────────────────────────────────────────────────────
async function loadOrders(mode) {
    activeOrderMode = mode || 'buyer';
    const wrap = document.getElementById('ordersTable');
    // Toggle button styles
    document.getElementById('ordBuyBtn')?.classList[mode === 'buyer' ? 'add' : 'remove']('btn-primary');
    document.getElementById('ordBuyBtn')?.classList[mode === 'buyer' ? 'remove' : 'add']('btn-outline');
    document.getElementById('ordSellBtn')?.classList[mode === 'seller' ? 'add' : 'remove']('btn-primary');
    document.getElementById('ordSellBtn')?.classList[mode === 'seller' ? 'remove' : 'add']('btn-outline');

    wrap.innerHTML = `<div class="empty-state"><i class="fas fa-spinner fa-spin"></i></div>`;
    try {
        const res = await fetch(`/api/orders/my?mode=${activeOrderMode}`).then(r => r.json());
        const rows = res.orders || [];
        if (!rows.length) {
            wrap.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i><p>No orders yet</p></div>`;
            return;
        }
        wrap.innerHTML = `<table>
      <thead><tr>
        <th>Product</th><th>Qty</th><th>Value (₹)</th>
        <th>Escrow</th><th>Status</th><th>Date</th><th>Action</th>
      </tr></thead>
      <tbody>${rows.map(o => `
        <tr>
          <td><strong>${esc(o.product_name)}</strong></td>
          <td>${o.quantity} ${o.unit}</td>
          <td>₹${fmt(o.total_value)}</td>
          <td><span class="badge badge-${o.escrow_status}">${o.escrow_status}</span></td>
          <td><span class="badge badge-${o.status}">${o.status}</span></td>
          <td style="color:var(--muted);font-size:12px">${o.placed_at?.slice(0, 10) || '—'}</td>
          <td>
            ${activeOrderMode === 'buyer' && o.escrow_status === 'held' ? `
              <button class="btn btn-success btn-sm" style="margin:0"
                      onclick="openConfirmModal(${o.id})">
                <i class="fas fa-check"></i> Confirm
              </button>` : '—'}
          </td>
        </tr>`).join('')}
      </tbody></table>`;
    } catch { wrap.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation"></i><p>Load failed</p></div>`; }
}

// ─── Order Modal ──────────────────────────────────────────────────
function openOrderModal(product) {
    if (typeof product === 'string') product = JSON.parse(product);
    selectedProduct = product;
    document.getElementById('orderModalProduct').innerHTML = `
    <div style="font-weight:700;font-size:15px;margin-bottom:6px">
      ${PRODUCT_EMOJI[product.category] || '📦'} ${esc(product.name)}
    </div>
    <div style="color:var(--muted);font-size:13px">
      ₹${product.price} / ${product.unit} · ${product.quantity} ${product.unit} available
    </div>`;
    document.getElementById('orderQty').value = 1;
    document.getElementById('orderQty').max = product.quantity;
    updateOrderTotal();
    document.getElementById('orderQty').oninput = updateOrderTotal;
    openModal('orderModal');
}

function updateOrderTotal() {
    const qty = parseFloat(document.getElementById('orderQty').value) || 0;
    const total = qty * (selectedProduct?.price || 0);
    const margin = (total * 0.06).toFixed(2);
    document.getElementById('orderTotal').innerHTML =
        `<strong>Total: ₹${total.toFixed(2)}</strong> &nbsp;·&nbsp;
     Nomii fee (6%): ₹${margin} &nbsp;·&nbsp;
     <span style="color:var(--warning)">🔐 Held in escrow until delivery confirmed</span>`;
}

async function submitOrder() {
    const btn = document.getElementById('placeOrderBtn');
    const qty = parseFloat(document.getElementById('orderQty').value);
    if (!selectedProduct || qty <= 0) { showToast('Enter a valid quantity', 'error'); return; }

    btn.disabled = true;
    try {
        const res = await fetch('/api/orders/place', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: selectedProduct.id, quantity: qty })
        }).then(r => r.json());

        if (res.success) {
            closeModal('orderModal');
            showToast(`Order placed! OTP: ${res.otp} (save this)`, 'success');
            loadProducts();
            loadDashboardData();
        } else { showToast(res.message, 'error'); }
    } catch { showToast('Order failed. Please try again.', 'error'); }
    finally { btn.disabled = false; }
}

// ─── Confirm Delivery Modal ───────────────────────────────────────
function openConfirmModal(orderId) {
    document.getElementById('confirmOrderId').value = orderId;
    document.getElementById('deliveryOtp').value = '';
    openModal('confirmModal');
}

async function submitConfirm() {
    const orderId = document.getElementById('confirmOrderId').value;
    const otp = document.getElementById('deliveryOtp').value.trim();
    if (!otp || otp.length !== 6) { showToast('Enter the 6-digit OTP', 'error'); return; }
    try {
        const res = await fetch('/api/orders/confirm', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, otp })
        }).then(r => r.json());
        if (res.success) {
            closeModal('confirmModal');
            showToast(`✅ ${res.message}`);
            loadOrders(activeOrderMode);
            loadDashboardData();
        } else { showToast(res.message, 'error'); }
    } catch { showToast('Confirmation failed', 'error'); }
}

// ─── AI Price Predictor ───────────────────────────────────────────
async function calculatePrice() {
    const btn = document.getElementById('calcPriceBtn');
    btn.classList.add('loading');
    btn.disabled = true;
    try {
        const body = {
            marketPrice: parseFloat(document.getElementById('prMarket').value) || 20,
            daysSinceHarvest: parseInt(document.getElementById('prDays').value) || 0,
            maxShelfLife: parseInt(document.getElementById('prShelf').value) || 7,
            demandIndex: parseFloat(document.getElementById('prDemand').value) || 1.0,
            festivalImpact: parseFloat(document.getElementById('prFestival').value) || 0,
            transportCost: parseFloat(document.getElementById('prTransport').value) || 2
        };
        const res = await fetch('/api/products/price-suggest', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(r => r.json());

        if (res.success) {
            const b = res.priceBreakdown;
            document.getElementById('prSuggested').textContent = `₹${b.suggestedPrice}`;
            document.getElementById('prBand').textContent =
                `Recommended range: ₹${b.priceLow} – ₹${b.priceHigh}`;
            document.getElementById('prBreakdown').innerHTML = [
                ['Market Price', `₹${b.marketPrice}`],
                ['Freshness Score', b.freshnessScore],
                ['Demand Multiplier', b.demandMultiplier],
                ['Seasonal Factor', b.seasonalFactor],
                ['Transport Deduct', `-₹${b.transportAdj}`],
            ].map(([k, v]) => `
        <div class="pbr">
          <span class="pbr-key">${k}</span>
          <span class="pbr-val">${v}</span>
        </div>`).join('');
            document.getElementById('priceResult').classList.add('show');
        } else { showToast(res.message || 'Calculation failed', 'error'); }
    } catch { showToast('Network error', 'error'); }
    finally { btn.classList.remove('loading'); btn.disabled = false; }
}

// ─── Logistics ────────────────────────────────────────────────────
async function loadLogistics() {
    const grid = document.getElementById('clusterGrid');
    const summary = document.getElementById('routeSummary');
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-spinner fa-spin"></i></div>`;
    try {
        const res = await fetch('/api/logistics/route').then(r => r.json());
        if (!res.success) { grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation"></i><p>Load failed</p></div>`; return; }

        const routeOrder = res.optimalRoute;
        grid.innerHTML = res.clusters.map((c, i) => `
      <div class="cluster-card">
        <div class="cluster-name">
          <span style="background:var(--role-color);color:#fff;border-radius:50%;
                       width:22px;height:22px;display:inline-flex;align-items:center;
                       justify-content:center;font-size:11px;font-weight:700;margin-right:6px">
            ${routeOrder.indexOf(c.id) + 1}
          </span>
          ${esc(c.name)}
        </div>
        <div class="cluster-stat"><i class="fas fa-map-marker-alt"></i> ${c.stops} stops</div>
        <div class="cluster-stat"><i class="fas fa-road"></i> ${c.distance_km} km</div>
      </div>`).join('');

        summary.innerHTML = `
      <div class="alert-banner alert-success">
        <i class="fas fa-check-circle"></i>
        <div>
          <strong>Optimal Route Generated</strong><br>
          Total: ${res.totalDistanceKm} km &nbsp;|&nbsp;
          Fuel: ₹${res.estimatedFuelCost} &nbsp;|&nbsp;
          Spoilage Penalty: ₹${res.spoilagePenalty} &nbsp;|&nbsp;
          <strong>Total Cost: ₹${res.totalCost}</strong>
        </div>
      </div>`;
    } catch { grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation"></i><p>Load failed</p></div>`; }
}

// ─── Earnings Detail ──────────────────────────────────────────────
async function loadEarningsDetail() {
    const grid = document.getElementById('earningsStats');
    grid.innerHTML = '';
    try {
        const res = await fetch('/api/analytics/earnings').then(r => r.json());
        if (!res.success) return;

        const stats = [
            {
                icon: 'fa-wallet', color: 'rgba(45,224,132,0.15)', iconColor: '#2de084',
                value: `₹${fmt(res.earned)}`, label: 'Net Earnings'
            },
            {
                icon: 'fa-chart-pie', color: 'rgba(67,97,238,0.15)', iconColor: '#4361ee',
                value: `₹${fmt(res.gross)}`, label: 'Gross Sales'
            },
            {
                icon: 'fa-shopping-bag', color: 'rgba(248,150,30,0.15)', iconColor: '#f8961e',
                value: res.ordersCount, label: 'Orders Completed'
            },
        ];
        stats.forEach(s => {
            const c = document.createElement('div');
            c.className = 'stat-card';
            c.innerHTML = `
        <div class="stat-icon" style="background:${s.color}">
          <i class="fas ${s.icon}" style="color:${s.iconColor}"></i>
        </div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>`;
            grid.appendChild(c);
        });

        // Detailed chart
        const ctx = document.getElementById('earningsDetailChart')?.getContext('2d');
        if (ctx) {
            if (earningsDetailChart) earningsDetailChart.destroy();
            earningsDetailChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: res.weeklyLabels,
                    datasets: [{
                        label: 'Daily Earnings ₹',
                        data: res.weeklyEarnings,
                        backgroundColor: res.weeklyEarnings.map((_, i) =>
                            `hsl(${220 + i * 15}, 80%, 60%)`),
                        borderRadius: 8,
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8892b0' } },
                        y: {
                            grid: { color: 'rgba(255,255,255,0.05)' }, ticks: {
                                color: '#8892b0',
                                callback: v => `₹${v}`
                            }
                        }
                    }
                }
            });
        }
    } catch (e) { console.error(e); }
}

// ─── Modal Helpers ────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// Close modal on overlay click
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
    }
});

// ─── Toast ────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : type === 'warn' ? 'warn' : ''}`;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warn: 'fa-exclamation-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i> ${esc(msg)}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ─── Sidebar Mobile ───────────────────────────────────────────────
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
}

// ─── Logout & Download ────────────────────────────────────────────
async function doLogout() {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/';
}

function downloadExcelCard() {
    const roleMap = { R: 'retailers', S: 'suppliers', D: 'delivery', F: 'farmers', A: 'artisans' };
    window.location.href = `/download/${roleMap[role]}/${USER_DATA.loginId}.xlsx`;
}

// ─── Helpers ──────────────────────────────────────────────────────
function fmt(n) {
    const num = parseFloat(n) || 0;
    if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(2);
}

function esc(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setDefaultHarvestDate() {
    const el = document.getElementById('lstHarvest');
    if (el) el.value = new Date().toISOString().split('T')[0];
}
