// ============================================
// Authentication Routes (Vercel-Compatible)
// Stateless JWT-only authentication
// ============================================

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'nextgate-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

// In-memory user database (for demo)
const users = [
    {
        id: 1,
        email: 'admin@nextgate.com',
        password_hash: '$2a$10$dZN.sCCn9ofbaFHbrCssWOK/H6.FEvg2miBd.kbbYkOOwKv0FcE.e', // Admin@123456
        name: 'NextGate Admin',
        role: 'admin',
        subscription_status: 'active',
        subscription_plan: 'enterprise'
    }
];

// Helper function to generate JWT
function generateJWT(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt:', email);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Find user
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate JWT
        const sanitizedUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            subscription_status: user.subscription_status,
            subscription_plan: user.subscription_plan
        };

        const token = generateJWT(sanitizedUser);

        return res.json({
            success: true,
            message: 'Login successful',
            user: sanitizedUser,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Logout endpoint (stateless, client removes token)
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Status check
router.get('/status', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            authenticated: false
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
            success: true,
            authenticated: true,
            user: decoded
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            authenticated: false,
            error: 'Invalid token'
        });
    }
});

module.exports = router;
