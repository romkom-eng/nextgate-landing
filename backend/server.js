// ============================================
//  NextGate Express Server
//  Enhanced with User Authentication & Stripe Subscriptions
// ============================================

const express = require('express');
const fs = require('fs');
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
const { Resend } = require('resend');

// Initialize Resend (will check for API key in env)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Health check for deployment monitoring
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        emailService: resend ? 'Resend configured' : 'Resend missing'
    });
});

app.post('/contact-form', (req, res) => {
    console.log('🚀 Contact form request received at:', new Date().toISOString());
    const { companyName, contactName, email, phone, productCategory, message } = req.body;

    const emailHTML = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #1a2332; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">새로운 입점 문의가 접수되었습니다.</h2>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>회사명:</strong> ${companyName}</p>
                <p><strong>담당자:</strong> ${contactName}</p>
                <p><strong>이메일:</strong> ${email}</p>
                <p><strong>연락처:</strong> ${phone}</p>
                <p><strong>카테고리:</strong> ${productCategory}</p>
            </div>
            <div style="padding: 20px; border-top: 1px solid #eee;">
                <p><strong>문의내용:</strong></p>
                <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
                This inquiry was sent from NextGate Landing Page.
            </p>
        </div>
    `;

    // NON-BLOCKING: Send via Resend API in background
    if (resend) {
        console.log('   📧 Attempting to send email via Resend API...');
        resend.emails.send({
            from: 'NextGate CMS <onboarding@resend.dev>', // Default from Resend for unverified domains
            to: process.env.ADMIN_EMAIL || 'denisoppa00@gmail.com',
            subject: `[NextGate 문의] ${companyName} - ${contactName}`,
            html: emailHTML,
        }).then(response => {
            if (response.error) {
                console.error('   ❌ Resend API Error:', response.error.message);
            } else {
                console.log('   ✅ Email sent successfully via Resend. ID:', response.data.id);
            }
        }).catch(err => {
            console.error('   ❌ Resend Background Error:', err.message);
        });
    } else {
        console.log('   ⚠️ RESEND_API_KEY missing. Only logging the request.');
    }

    // Respond to frontend immediately
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

// ========== Blog Routes (SSR for SEO) ==========
const BLOG_DB_PATH = path.join(__dirname, 'data/blog-posts.json');

// Helper to get blog posts
function getBlogPosts() {
    if (!fs.existsSync(BLOG_DB_PATH)) return [];
    try {
        return JSON.parse(fs.readFileSync(BLOG_DB_PATH, 'utf8'));
    } catch (e) {
        console.error('Error reading blog db:', e);
        return [];
    }
}

app.get('/blog', (req, res) => {
    const posts = getBlogPosts();
    const templatePath = path.join(__dirname, '../frontend/blog-list.html');

    fs.readFile(templatePath, 'utf8', (err, template) => {
        if (err) return res.status(500).send('Error loading blog template');

        // Generate list items HTML
        const listItems = posts.map(post => `
            <article class="blog-card">
                <div class="blog-card-body">
                    <span class="blog-date">${new Date(post.publishedAt).toLocaleDateString()}</span>
                    <h3><a href="/blog/${post.slug}" class="read-more">${post.title}</a></h3>
                    <p>${post.metaDescription || post.content.substring(0, 150)}...</p>
                    <a href="/blog/${post.slug}" class="read-more">Read Article →</a>
                </div>
            </article>
        `).join('');

        const html = template.replace('{{BLOG_LIST_ITEMS}}', listItems || '<p>No posts yet. Check back soon!</p>');
        res.send(html);
    });
});

app.get('/blog/:slug', (req, res) => {
    const posts = getBlogPosts();
    const post = posts.find(p => p.slug === req.params.slug);

    if (!post) return res.status(404).send('Blog post not found');

    const templatePath = path.join(__dirname, '../frontend/blog-post.html');

    fs.readFile(templatePath, 'utf8', (err, template) => {
        if (err) return res.status(500).send('Error loading post template');

        let html = template
            .replace(/{{TITLE}}/g, post.title)
            .replace(/{{DESCRIPTION}}/g, post.metaDescription)
            .replace(/{{KEYWORDS}}/g, post.keywords)
            .replace(/{{SLUG}}/g, post.slug)
            .replace(/{{PUBLISHED_AT}}/g, post.publishedAt)
            .replace(/{{PUBLISHED_DATE}}/g, new Date(post.publishedAt).toLocaleDateString())
            .replace('{{CONTENT}}', post.content);

        res.send(html);
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
