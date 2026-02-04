// Firebase Configuration for NextGate
// This file initializes Firebase and exports db, auth instances

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBVdLKvsw1Ck11N9mdrCEKPNfak7vDQJDA",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "nextgate-kor.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "nextgate-kor",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "nextgate-kor.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1084897812116",
    appId: process.env.FIREBASE_APP_ID || "1:1084897812116:web:ad3748638ec67602235e81",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-3GF7MRE4E5"
};

// Initialize Firebase
let app;
let db;
let auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

module.exports = { db, auth, app };
