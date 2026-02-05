// Track Page Visit API
// Path: /api/track-visit.js

const admin = require('../utils/firebase-admin');
const db = admin.firestore();

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { page, referrer, timestamp } = req.body;

    try {
        // Firestore에 방문 기록 저장
        await db.collection('pageViews').add({
            page,
            referrer: referrer || null,
            timestamp,
            userAgent: req.headers['user-agent'],
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Track visit error:', error);
        return res.status(500).json({ error: 'Failed to track visit' });
    }
};
