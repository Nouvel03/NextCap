
console.log('app.js loaded successfully!');
if (localStorage.getItem('nextcap_user_email')) {
    // User is already logged in, redirect to Dashboard
    window.location.href = encodeURI('../Dashboard all/index1.html');
}
import { saveUserToFirestore, getUserByEmail } from '../FirebaseUtils/FirebaseUtils_Login.js';


const GOOGLE_CLIENT_ID = window.SECRETS ? window.SECRETS.GOOGLE_CLIENT_ID : 'MISSING_SECRETS';

function loginWithGoogle() {
    if (typeof google === 'undefined' || !google.accounts) {
        console.error('Google Identity Services not loaded yet. Make sure the script tag is included.');
        return;
    }

    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID' || GOOGLE_CLIENT_ID === 'MISSING_SECRETS') {
        alert('Please configure your Google Client ID secrets.');
        return;
    }

    const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: handleGoogleTokenResponse
    });

    client.requestAccessToken();
}

async function handleGoogleSignIn(response) {
    console.log('Google Sign-In successful:', response);

    const credential = response.credential;

    try {
        const payload = JSON.parse(atob(credential.split('.')[1]));
        const email = payload.email;

        console.log('User email:', email);
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
    } catch (error) {
        console.error('Error decoding credential:', error);
        localStorage.setItem('nextcap_user_email', email);
    }
}

function handleGoogleTokenResponse(tokenResponse) {
    console.log('Google OAuth token received:', tokenResponse);

    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`
        }
    })
        .then(response => response.json())
        .then(async data => {
            const email = data.email;
            console.log('User email:', email);

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


    const backBtn = document.querySelector('.back-button');
    if (backBtn && !backBtn.hasAttribute('data-wired')) {
        backBtn.addEventListener('click', navigateBack);
        backBtn.setAttribute('data-wired', 'true');
    }
});
