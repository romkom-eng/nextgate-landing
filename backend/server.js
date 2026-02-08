// ============================================
//  NextGate Express Server
//  Enhanced with User Authentication & Stripe Subscriptions
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import mock data
const {
    mockOrders,
    mockInventory,
    mockShipments,
    generateMockFinancials,
    generateRevenueTrend
} = require('./mockData');

// Import routes
const authRoutes = require('./routes/auth');
const stripeRoutes = require('./routes/stripe');
const adminRoutes = require('./routes/admin');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== Request Logging (Essential for Debugging) ==========
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ========== Security Middleware ==========
app.use(helmet({
    contentSecurityPolicy: false
}));

// Rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts'
});

// ========== Middleware ==========
app.use(cors({
    origin: true,
    credentials: true
}));

app.use((req, res, next) => {
    if (req.originalUrl === '/api/stripe/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'nextgate-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ========== API Routes (Must be BEFORE static files) ==========
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);

// Health check and Contact Form
const nodemailer = require('nodemailer');
const dns = require('dns');

// Configure email transporter
// SECURITY: Using direct IPv4 and servername to strictly avoid ENETUNREACH IPv6 issues on Railway
const transporter = nodemailer.createTransport({
    host: '142.251.181.108', // smtp.gmail.com IPv4 address
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com' // Crucial when using IP address as host
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000
});

// Verify connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection Error (Check IPv4/Port):', error.message);
    } else {
        console.log('✅ SMTP Server is ready via IPv4 (denisoppa00@gmail.com)');
    }
});

// Health check for deployment monitoring
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/contact-form', (req, res) => {
    console.log('🚀 Contact form request received at:', new Date().toISOString());
    const { companyName, contactName, email, phone, productCategory, message } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || 'admin@nextgate.com',
        subject: `[NextGate 문의] ${companyName} - ${contactName}`,
        html: `
            <h2>새로운 입점 문의가 접수되었습니다.</h2>
            <p><strong>회사명:</strong> ${companyName}</p>
            <p><strong>담당자:</strong> ${contactName}</p>
            <p><strong>이메일:</strong> ${email}</p>
            <p><strong>연락처:</strong> ${phone}</p>
            <p><strong>카테고리:</strong> ${productCategory}</p>
            <p><strong>문의내용:</strong><br>${message}</p>
        `
    };

    // NON-BLOCKING: Start email send in background and respond immediately to user
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log('   📧 Starting background email send...');
        transporter.sendMail(mailOptions)
            .then(() => console.log('   ✅ Background email sent successfully'))
            .catch(err => {
                console.error('   ❌ Background Email Error:', err.message);
                if (err.message.includes('ENETUNREACH')) {
                    console.error('      (Network unreachable - still having IPv6/Port issues on Railway)');
                }
            });
    } else {
        console.log('   ⚠️ Email credentials missing. Response only.');
    }

    // Respond to frontend immediately to prevent "Sending..." hang
    res.json({
        success: true,
        message: 'Inquiry received! We will contact you shortly.'
    });
});

// ========== Authentication Middleware ==========
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized. Please login first.' });
}

function hasActiveSubscription(req, res, next) {
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.subscription_status === 'active' || user.subscription_status === 'trialing') {
        return next();
    }
    res.status(403).json({ error: 'Subscription required' });
}

// ========== Dashboard API Routes (Protected) ==========
app.get('/api/sales', isAuthenticated, hasActiveSubscription, (req, res) => {
    const financials = generateMockFinancials();
    const revenueTrend = generateRevenueTrend();
    res.json({
        success: true,
        data: { ...financials, revenueTrend, totalOrders: mockOrders.length }
    });
});

app.get('/api/orders', isAuthenticated, hasActiveSubscription, (req, res) => {
    const { status, limit = 10 } = req.query;
    let filteredOrders = mockOrders;
    if (status && status !== 'all') {
        filteredOrders = mockOrders.filter(o => o.OrderStatus.toLowerCase() === status.toLowerCase());
    }
    res.json({ success: true, data: { orders: filteredOrders.slice(0, parseInt(limit)), total: filteredOrders.length } });
});

app.get('/api/orders/:orderId', isAuthenticated, hasActiveSubscription, (req, res) => {
    const order = mockOrders.find(o => o.AmazonOrderId === req.params.orderId);
    order ? res.json({ success: true, data: order }) : res.status(404).json({ success: false, error: 'Order not found' });
});

app.get('/api/inventory', isAuthenticated, hasActiveSubscription, (req, res) => {
    const { status } = req.query;
    let filtered = status ? mockInventory.filter(i => i.Status.toLowerCase().includes(status.toLowerCase())) : mockInventory;
    res.json({ success: true, data: { products: filtered, total: filtered.length } });
});

app.get('/api/shipping', isAuthenticated, hasActiveSubscription, (req, res) => {
    res.json({ success: true, data: { shipments: mockShipments, total: mockShipments.length } });
});

app.get('/api/dashboard/summary', isAuthenticated, hasActiveSubscription, (req, res) => {
    const financials = generateMockFinancials();
    res.json({
        success: true,
        data: {
            revenue: financials.totalRevenue,
            profit: financials.netProfit,
            totalOrders: mockOrders.length,
            activeShipments: mockShipments.filter(s => s.Status === 'In Transit').length
        }
    });
});

// ========== Static Files (AFTER API Routes) ==========
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.use('/dashboard', express.static(path.join(__dirname, '../dashboard')));
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ========== Error & 404 Handlers ==========
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// ========== Start Server ==========
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 NextGate Backend Server running on port ${PORT}`);
        console.log(`✅ API Routes Ready, Static Files Ready`);
        console.log(`📍 Health Check: http://localhost:${PORT}/health`);
    });
}

module.exports = app;
