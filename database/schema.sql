-- ============================================
-- NextGate Database Schema
-- PostgreSQL / SQLite Compatible
-- ============================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    name VARCHAR(255),
    company_name VARCHAR(255),
    
    -- Security Fields
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin', 'viewer'
    account_locked BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP,
    
    -- Password Policy
    password_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_expires_at TIMESTAMP,
    last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Subscription
    stripe_customer_id VARCHAR(255),
    subscription_status VARCHAR(50), -- 'active', 'trialing', 'canceled', 'past_due', 'unpaid'
    subscription_plan VARCHAR(50),   -- 'basic', 'pro', 'enterprise'
    subscription_id VARCHAR(255),
    subscription_current_period_end TIMESTAMP,
    trial_ends_at TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert default admin user (password: Admin@123456)
-- Note: In production, this should be changed immediately
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    password_expires_at,
    subscription_status,
    subscription_plan
) VALUES (
    'admin@nextgate.com',
    '$2a$10$XQPZhI.p8z3jtKY9YvKR9uqWVEPqm0yxJ7uM9YJxgzQQZQ9K0YyIS', -- Admin@123456
    'NextGate Admin',
    'admin',
    CURRENT_TIMESTAMP + INTERVAL '365 days',
    'active',
    'enterprise'
) ON CONFLICT (email) DO NOTHING;
