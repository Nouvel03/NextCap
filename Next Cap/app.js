// NextCap Application JavaScript
// Entry point: nextcap_login.html

console.log('app.js loaded successfully!');

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

// Google OAuth Client ID - REPLACE THIS WITH YOUR CLIENT ID
const GOOGLE_CLIENT_ID = '375271585016-dchi4bppn0lcu5mhut1lj3mh48tb1p3g.apps.googleusercontent.com';

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
function handleGoogleSignIn(response) {
    console.log('Google Sign-In successful:', response);
    
    // Decode the credential (JWT token) to get email
    const credential = response.credential;
    
    // Decode JWT to extract email (JWT has 3 parts: header.payload.signature)
    try {
        const payload = JSON.parse(atob(credential.split('.')[1]));
        const email = payload.email;
        
        console.log('User email:', email);
        alert(`Successfully signed in with ${email}!`);
        
        // TODO: Store email/session
        // TODO: Redirect to dashboard or next page
        // window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error decoding credential:', error);
        alert('Successfully signed in with Google!');
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
    .then(data => {
        const email = data.email;
        console.log('User email:', email);
        alert(`Successfully signed in as ${email}!`);
        
        // TODO: Store email/session
        // TODO: Redirect to dashboard or next page
        // window.location.href = 'dashboard.html';
    })
    .catch(error => {
        console.error('Error fetching user email:', error);
        alert('Failed to sign in with Google. Please try again.');
    });
}

// Navigation functions
function navigateToEmailPage() {
    window.location.href = '../continue with email/continue with email.html';
}

function navigateToRegister() {
    console.log('Register page navigation - to be implemented');
    alert('Register functionality coming soon');
}

function navigateBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'Login page/nextcap_login.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const googleBtn = document.querySelector('.google-btn');
    if (googleBtn && !googleBtn.hasAttribute('data-wired')) {
        googleBtn.addEventListener('click', loginWithGoogle);
        googleBtn.setAttribute('data-wired', 'true');
    }
    
    const emailBtn = document.querySelector('.login-btn:not(.google-btn):not(.register-btn)');
    if (emailBtn && emailBtn.textContent.trim().includes('email') && !emailBtn.hasAttribute('data-wired')) {
        emailBtn.addEventListener('click', navigateToEmailPage);
        emailBtn.setAttribute('data-wired', 'true');
    }
    
    const registerBtn = document.querySelector('.register-btn');
    if (registerBtn && !registerBtn.hasAttribute('data-wired')) {
        registerBtn.addEventListener('click', navigateToRegister);
        registerBtn.setAttribute('data-wired', 'true');
    }
    
    const backBtn = document.querySelector('.back-button');
    if (backBtn && !backBtn.hasAttribute('data-wired')) {
        backBtn.addEventListener('click', navigateBack);
        backBtn.setAttribute('data-wired', 'true');
    }
});
