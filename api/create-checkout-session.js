// Stripe Checkout Session 생성 API
// Path: /api/create-checkout-session.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('../utils/firebase-admin');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, email } = req.body;

    try {
        // Stripe Checkout Session 생성
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID, // Stripe에서 생성한 Price ID
                    quantity: 1,
                },
            ],
            subscription_data: {
                trial_period_days: 14, // 14일 무료 체험
                metadata: {
                    firebase_uid: userId,
                },
            },
            success_url: `${process.env.DOMAIN}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.DOMAIN}/register?canceled=true`,
            metadata: {
                firebase_uid: userId,
            },
        });

        return res.status(200).json({ sessionId: session.id });
    } catch (error) {
        console.error('Stripe session error:', error);
        return res.status(500).json({ error: 'Failed to create checkout session' });
    }
};
