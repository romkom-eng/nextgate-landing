// ============================================
//  NextGate Dashboard - JavaScript
//  Real-time Data Fetching & Chart Rendering
// ============================================

// Auto-detect environment: use localhost:3000 for local development, /api for production
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';
let revenueChart = null;
let costsChart = null;

// ========== Utility Functions ==========
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US');
    document.getElementById('lastUpdated').textContent = `Updated at ${timeString}`;
}

// ========== API Calls ==========
async function fetchData(endpoint) {
    try {
        const token = localStorage.getItem('jwt_token');
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            credentials: 'include', // Include cookies for session
            headers: headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/frontend/login.html';
                return null;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}

// ========== Dashboard Data Loading ==========
async function loadDashboardData() {
    showLoading();

    try {
        // Fetch all data in parallel
        const [salesData, ordersData, inventoryData, shippingData] = await Promise.all([
            fetchData('/sales'),
            fetchData('/orders?limit=50'),
            fetchData('/inventory'),
            fetchData('/shipping')
        ]);

        if (salesData) updateKPIs(salesData.data);
        if (salesData) renderCharts(salesData.data);
        if (ordersData) renderOrdersTable(ordersData.data.orders);
        if (inventoryData) renderInventoryTable(inventoryData.data.products);
        if (shippingData) renderShippingCards(shippingData.data.shipments);

        updateLastUpdated();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    } finally {
        hideLoading();
    }
}

// ========== Update KPI Cards ==========
function updateKPIs(data) {
    document.getElementById('totalRevenue').textContent = formatCurrency(data.totalRevenue);
    document.getElementById('netProfit').textContent = formatCurrency(data.netProfit);
    document.getElementById('profitMargin').textContent = `${data.profitMargin}%`;
    document.getElementById('totalOrders').textContent = data.totalOrders;
    document.getElementById('avgOrderValue').textContent = formatCurrency(data.averageOrderValue);

    // Low stock items from inventory (will be updated later)
    fetchData('/inventory').then(invData => {
        if (invData) {
            document.getElementById('lowStockItems').textContent = invData.data.lowStockCount + invData.data.outOfStockCount;
        }
    });
}

// ========== Render Charts ==========
function renderCharts(data) {
    renderRevenueChart(data.revenueTrend);
    renderCostsChart({
        amazonFees: parseFloat(data.amazonFees),
        shippingCosts: parseFloat(data.shippingCosts),
        marketingCosts: parseFloat(data.marketingCosts)
    });
}

function renderRevenueChart(trendData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const context = ctx.getContext('2d');

    // Destroy existing chart if it exists
    if (revenueChart) {
        revenueChart.destroy();
    }

    const labels = trendData.map(d => {
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const revenues = trendData.map(d => d.revenue);

    revenueChart = new Chart(context, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '일일 매출',
                data: revenues,
                borderColor: '#ff6b35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#ff6b35',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1a2332',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ff6b35',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function (value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function renderCostsChart(costs) {
    const ctx = document.getElementById('costsChart');
    if (!ctx) return;

    const context = ctx.getContext('2d');

    if (costsChart) {
        costsChart.destroy();
    }

    costsChart = new Chart(context, {
        type: 'doughnut',
        data: {
            labels: ['Amazon 수수료', '배송비', '마케팅'],
            datasets: [{
                data: [costs.amazonFees, costs.shippingCosts, costs.marketingCosts],
                backgroundColor: [
                    '#1a2332',
                    '#3d4857',
                    '#ff6b35'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1a2332',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#ff6b35',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ========== Render Orders Table ==========
function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTable');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">주문이 없습니다</td></tr>';
        return;
    }

    // Show first 5 for overview
    const displayOrders = orders.slice(0, 5);

    tbody.innerHTML = displayOrders.map(order => {
        const statusClass = order.OrderStatus.toLowerCase().replace(' ', '-');
        return `
            <tr>
                <td><code>${order.AmazonOrderId.substring(0, 17)}...</code></td>
                <td>${order.ProductName || 'N/A'}</td>
                <td><strong>${formatCurrency(order.OrderTotal.Amount)}</strong></td>
                <td><span class="status-badge badge-${statusClass}">${order.OrderStatus}</span></td>
                <td>${formatDate(order.PurchaseDate)}</td>
            </tr>
        `;
    }).join('');
}

// ========== Render Inventory Table ==========
function renderInventoryTable(products) {
    const tbody = document.getElementById('inventoryTable');
    if (!tbody) return;

    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">재고가 없습니다</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => {
        const statusClass = product.Status.toLowerCase().replace(' ', '-');
        return `
            <tr>
                <td><code>${product.SKU}</code></td>
                <td>${product.ProductName}</td>
                <td><strong>${product.FulfillableQuantity}</strong> units</td>
                <td><span class="status-badge badge-${statusClass}">${product.Status}</span></td>
            </tr>
        `;
    }).join('');
}

// ========== Render Shipping Cards ==========
function renderShippingCards(shipments) {
    const container = document.getElementById('shippingCards');
    if (!container) return;

    if (!shipments || shipments.length === 0) {
        container.innerHTML = '<p class="text-center">배송 중인 상품이 없습니다</p>';
        return;
    }

    container.innerHTML = shipments.map(shipment => {
        const statusColor = shipment.Status === 'Delivered' ? '#10b981' :
            shipment.Status === 'In Transit' ? '#3b82f6' : '#f59e0b';

        const statusClass = shipment.Status.toLowerCase().replace(' ', '-');

        return `
            <div class="shipping-card">
                <div class="tracking-number">${shipment.TrackingNumber}</div>
                <div class="location">
                    <svg width="16" height="16" fill="none" stroke="${statusColor}" viewBox="0 0 24 24" style="display: inline; vertical-align: middle; margin-right: 4px;">
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    ${shipment.CurrentLocation}
                </div>
                <div style="margin-top: 8px;">
                    <span class="status-badge badge-${statusClass}">${shipment.Status}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ========== Logout Function ==========
async function logout() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            window.location.href = '/frontend/login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ========== Auto Refresh ==========
function startAutoRefresh() {
    // Refresh data every 30 seconds
    setInterval(() => {
        loadDashboardData();
    }, 30000);
}

// ========== Navigation Handler ==========
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const shippingSection = document.querySelector('.shipping-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const href = item.getAttribute('href');

            // Allow external links (not starting with #) to work normally
            if (!href.startsWith('#')) {
                return;
            }

            e.preventDefault();
            const targetSection = href.substring(1); // Remove #

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Scroll to appropriate section
            let targetElement = null;

            if (targetSection === 'overview') {
                targetElement = document.querySelector('.kpi-grid');
            } else if (targetSection === 'orders') {
                // Find the orders table card (first table-card)
                const tableCards = document.querySelectorAll('.table-card');
                targetElement = tableCards[0]; // Orders is first
            } else if (targetSection === 'inventory') {
                // Find the inventory table card (second table-card)
                const tableCards = document.querySelectorAll('.table-card');
                targetElement = tableCards[1]; // Inventory is second
            } else if (targetSection === 'shipping') {
                targetElement = shippingSection;
            }

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }

            // Update URL hash
            window.location.hash = targetSection;
        });
    });
}

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', function () {
    // Setup navigation
    setupNavigation();

    // Check authentication
    fetchData('/auth/status').then(data => {
        if (!data || !data.authenticated) {
            window.location.href = '/frontend/login.html';
            return;
        }

        // Show Admin Panel link if user is admin
        if (data.user && data.user.role === 'admin') {
            const adminLink = document.getElementById('adminLink');
            if (adminLink) adminLink.style.display = 'flex';
        }

        // Load dashboard data
        loadDashboardData();

        // Start auto refresh
        startAutoRefresh();
    });

    // Logout button
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});
