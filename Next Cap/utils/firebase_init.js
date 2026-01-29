// utils/firebase_init.js
// Initializes Firebase App if not already initialized

if (typeof firebase === 'undefined') {
    console.error("Firebase SDK not loaded");
} else {
    // Check if secrets are loaded
    if (typeof window.SECRETS !== 'undefined' && window.SECRETS.FIREBASE_CONFIG) {
        if (!firebase.apps.length) {
            firebase.initializeApp(window.SECRETS.FIREBASE_CONFIG);
            console.log("Firebase App Initialized via firebase_init.js");
        }
    } else {
        console.error("SECRETS.FIREBASE_CONFIG not found. Make sure secrets.js is loaded.");
    }
}
