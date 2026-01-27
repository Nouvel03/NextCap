// NextCap Application JavaScript
// Entry point: nextcap_login.html

console.log('app.js loaded successfully!');
if (localStorage.getItem('nextcap_user_email')) {

}
// Import Firestore helper to save users (Gmail sign-ins)
import { saveUserToFirestore, getUserByEmail } from '../FirebaseUtils/FirebaseUtils_Login.js';

// ============================================
// GOOGLE OAUTH SETUP INSTRUCTIONS:
// ============================================
// 1. Go to: https://console.cloud.google.com/
// 2. Create a new project (or select existing)
// 3. Go to "APIs & Services" > "Credentials"
// 4. Click "Create Credentials" > "OAuth client ID"
// 5. Select "Web application" as application type
// 6. Add authorized JavaScript origins:
//    - http://localhost (for local testing)
//    - http://localhost:PORT (if using a server)
//    - Your production domain (e.g., https://yourdomain.com)
// 7. Copy your Client ID (looks like: 123456789-abc123.apps.googleusercontent.com)
// 8. Replace 'YOUR_GOOGLE_CLIENT_ID' below with your actual Client ID
// ============================================

// Google OAuth Client ID - Loaded from secrets.js
const GOOGLE_CLIENT_ID = window.SECRETS ? window.SECRETS.GOOGLE_CLIENT_ID : 'MISSING_SECRETS';

// Google Login Function using Google Identity Services
function loginWithGoogle() {
    // Check if Google Identity Services is loaded
    if (typeof google === 'undefined' || !google.accounts) {
        alert('Google Sign-In is loading. Please wait a moment and try again.');
        console.error('Google Identity Services not loaded yet. Make sure the script tag is included.');
        return;
    }

    // Check if Client ID is configured
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
        alert('Please configure your Google Client ID in app.js\n\nSee instructions at the top of the file or visit:\nhttps://console.cloud.google.com/apis/credentials');
        console.error('Google Client ID not configured. Please set GOOGLE_CLIENT_ID in app.js');
        return;
    }

    // Initialize Google Sign-In
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn
    });

    // Prompt the sign-in popup
    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If One Tap is not available, use the button click flow
            google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'email profile',
                callback: handleGoogleTokenResponse
            }).requestAccessToken();
        }
    });
}

// Handle Google Sign-In response
async function handleGoogleSignIn(response) {
    console.log('Google Sign-In successful:', response);

    // Decode the credential (JWT token) to get email
    const credential = response.credential;

    // Decode JWT to extract email (JWT has 3 parts: header.payload.signature)
    try {
        const payload = JSON.parse(atob(credential.split('.')[1]));
        const email = payload.email;

        console.log('User email:', email);
        // Save or ensure user exists in Firestore, then decide redirect based on account information
        try {
            const res = await saveUserToFirestore(email);
            if (res.success) console.log('Gmail user created in Firestore:', email);
            else console.log('Gmail user save skipped:', res.message || '(exists)');

            // fetch user doc and inspect account_information
            const userDoc = await getUserByEmail(email);
            try { localStorage.setItem('nextcap_user_email', email); } catch (e) { /* ignore */ }

            const userType = userDoc && userDoc.data && userDoc.data.type;
            if (userType === 'admin') {
                window.location.href = encodeURI('../Admin account/indexAdmin.html');
                return;
            }

            const accountInfo = userDoc && userDoc.data && userDoc.data.account_information;
            const hasAccountInfo = accountInfo && typeof accountInfo === 'object' && Object.keys(accountInfo).length > 0;

            if (!hasAccountInfo) {
                window.location.href = encodeURI('../Information/information.html');
            } else {
                window.location.href = encodeURI('../Dashboard all/index1.html');
            }
        } catch (e) {
            console.error('Error saving or fetching Gmail user:', e);
            // fallback: redirect to dashboard
            try { localStorage.setItem('nextcap_user_email', email); } catch (err) { }
            window.location.href = encodeURI('../Dashboard all/index1.html');
        }
    } catch (error) {
        console.error('Error decoding credential:', error);
        localStorage.setItem('nextcap_user_email', email);
    }
}

// Handle OAuth token response (alternative flow)
function handleGoogleTokenResponse(tokenResponse) {
    console.log('Google OAuth token received:', tokenResponse);

    // Fetch only email from userinfo endpoint
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`
        }
    })
        .then(response => response.json())
        .then(async data => {
            const email = data.email;
            console.log('User email:', email);
            alert(`Successfully signed in as ${email}!`);

            // Save gmail user without password then redirect depending on account info
            try {
                const res = await saveUserToFirestore(email);
                if (res.success) console.log('Gmail user created in Firestore:', email);
                else console.log('Gmail user save skipped:', res.message || '(exists)');

                const userDoc = await getUserByEmail(email);
                try { localStorage.setItem('nextcap_user_email', email); } catch (e) { /* ignore */ }
                const userType = userDoc && userDoc.data && userDoc.data.type;
                if (userType === 'admin') {
                    window.location.href = encodeURI('../Admin account/indexAdmin.html');
                    return;
                }
                const accountInfo = userDoc && userDoc.data && userDoc.data.account_information;
                const hasAccountInfo = accountInfo && typeof accountInfo === 'object' && Object.keys(accountInfo).length > 0;
                if (!hasAccountInfo) {
                    window.location.href = encodeURI('../Information/information.html');
                } else {
                    window.location.href = encodeURI('../Dashboard all/index1.html');
                }
            } catch (e) {
                console.error('Error saving or fetching Gmail user:', e);
                try { localStorage.setItem('nextcap_user_email', email); } catch (err) { }
                window.location.href = encodeURI('../Dashboard all/index1.html');
            }
        })
        .catch(error => {
            console.error('Error fetching user email:', error);
            alert('Failed to sign in with Google. Please try again.');
        });
}

// Navigation functions
function navigateToEmailPage() {
    window.location.href = encodeURI('../continue with email/continue with email.html');
}

function navigateToLoginWithEmail() {
    window.location.href = encodeURI('../login with email/login_with_email.html');
}


function navigateBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'Login page/nextcap_login.html';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const googleBtn = document.querySelector('.google-btn');
    if (googleBtn && !googleBtn.hasAttribute('data-wired')) {
        googleBtn.addEventListener('click', loginWithGoogle);
        googleBtn.setAttribute('data-wired', 'true');
    }

    // Wire specific buttons by id to avoid ambiguous selectors when multiple email buttons exist
    const signupBtn = document.getElementById('email-signup-btn');
    if (signupBtn && !signupBtn.hasAttribute('data-wired')) {
        signupBtn.addEventListener('click', navigateToEmailPage);
        signupBtn.setAttribute('data-wired', 'true');
    }

    const emailLoginBtn = document.getElementById('email-login-btn');
    if (emailLoginBtn && !emailLoginBtn.hasAttribute('data-wired')) {
        emailLoginBtn.addEventListener('click', navigateToLoginWithEmail);
        emailLoginBtn.setAttribute('data-wired', 'true');
    }

    // Register button removed; no wiring necessary

    const backBtn = document.querySelector('.back-button');
    if (backBtn && !backBtn.hasAttribute('data-wired')) {
        backBtn.addEventListener('click', navigateBack);
        backBtn.setAttribute('data-wired', 'true');
    }
});
