// Stripe Webhook Handler
// Path: /api/stripe-webhook.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('../utils/firebase-admin');

const db = admin.firestore();

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        const firebaseUid = event.data.object.metadata?.firebase_uid;

        switch (event.type) {
            case 'checkout.session.completed':
                // 결제 성공 - Firestore 업데이트
                const session = event.data.object;

                if (firebaseUid) {
                    await db.collection('users').doc(firebaseUid).update({
                        stripeCustomerId: session.customer,
                        stripeSubscriptionId: session.subscription,
                        hasPaymentMethod: true,
                        subscriptionStatus: 'trial',
                        updatedAt: new Date().toISOString()
                    });
                }
                break;

            case 'customer.subscription.updated':
                // 구독 상태 변경
                const subscription = event.data.object;

                if (firebaseUid) {
                    let status = 'active';
                    if (subscription.status === 'trialing') status = 'trial';
                    if (subscription.status === 'canceled') status = 'canceled';
                    if (subscription.status === 'past_due') status = 'past_due';

                    await db.collection('users').doc(firebaseUid).update({
                        subscriptionStatus: status,
                        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
                break;

            case 'customer.subscription.deleted':
                // 구독 취소
                const deletedSub = event.data.object;

                if (firebaseUid) {
                    await db.collection('users').doc(firebaseUid).update({
                        subscriptionStatus: 'canceled',
                        updatedAt: new Date().toISOString()
                    });
                }
                break;

            case 'invoice.payment_succeeded':
                // 결제 성공
                const invoice = event.data.object;
                console.log(`Payment succeeded for subscription: ${invoice.subscription}`);
                break;

            case 'invoice.payment_failed':
                // 결제 실패
                const failedInvoice = event.data.object;
                console.log(`Payment failed for subscription: ${failedInvoice.subscription}`);

                if (firebaseUid) {
                    await db.collection('users').doc(firebaseUid).update({
                        subscriptionStatus: 'past_due',
                        updatedAt: new Date().toISOString()
                    });
                }
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return res.status(500).json({ error: 'Webhook handler failed' });
    }
};
