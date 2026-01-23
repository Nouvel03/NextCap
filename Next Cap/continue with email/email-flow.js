let currentCard = 'email';
let userEmail = '';
let lastOTP = '';

// Card navigation
function showCard(cardName, direction = 'right') {
    const currentCardEl = document.getElementById(`${currentCard}-card`);
    const nextCardEl = document.getElementById(`${cardName}-card`);

    if (!currentCardEl || !nextCardEl) return;

    currentCardEl.classList.add(`slide-out-${direction}`);

    setTimeout(() => {
        currentCardEl.classList.remove('active', `slide-out-${direction}`);
        nextCardEl.classList.add('active', `slide-in-${direction === 'right' ? 'left' : 'right'}`);

        setTimeout(() => {
            nextCardEl.classList.remove(`slide-in-${direction === 'right' ? 'left' : 'right'}`);
        }, 300);

        currentCard = cardName;
    }, 150);
}

// Generate random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via EmailJS
async function sendOTPToEmail(email) {
    lastOTP = generateOTP();

    try {
        const templateParams = {
            email: email,
            passcode: lastOTP
        };

        const result = await emailjs.send(
            'service_tvuh312',   // your service ID
            'template_j6oq6km',  // your template ID
            templateParams
        );

        console.log('OTP sent via EmailJS:', lastOTP, result);
        return { success: true, otp: lastOTP };
    } catch (error) {
        console.error('EmailJS send error:', error);
        return { success: false };
    }
}

// Verify OTP (simple in-memory check)
async function verifyOTPCode(email, otpCode) {
    return otpCode === lastOTP;
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize EmailJS

    // Email card elements
    const emailInput = document.getElementById('email-input');
    const emailContinueBtn = document.getElementById('email-continue-btn');
    const emailError = document.getElementById('email-error');

    // OTP card elements
    const otpInput = document.getElementById('otp-input');
    const otpContinueBtn = document.getElementById('otp-continue-btn');
    const otpError = document.getElementById('otp-error');
    const otpEmailDisplay = document.getElementById('otp-email-display');
    const resendLink = document.getElementById('resend-link');

    // Password card elements
    const passwordInput = document.getElementById('password-input');
    const confirmPasswordInput = document.getElementById('confirm-password-input');
    const passwordContinueBtn = document.getElementById('password-continue-btn');
    const passwordError = document.getElementById('password-error');
    const confirmPasswordError = document.getElementById('confirm-password-error');

    // ================================
    // EMAIL CARD HANDLER
    // ================================
    emailContinueBtn.addEventListener('click', async function() {
        const email = emailInput.value.trim();

        emailError.textContent = '';
        emailInput.style.borderColor = '#ddd';

        if (!email) {
            emailError.textContent = 'Please enter your email';
            emailInput.style.borderColor = '#e74c3c';
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailError.textContent = 'Please enter a valid email address';
            emailInput.style.borderColor = '#e74c3c';
            return;
        }

        emailContinueBtn.disabled = true;
        emailContinueBtn.textContent = 'Sending OTP...';

        try {
            userEmail = email;
            const { success } = await sendOTPToEmail(email);

            if (success) {
                otpEmailDisplay.textContent = email;
                showCard('otp', 'right');
            } else {
                emailError.textContent = 'Failed to send OTP. Please try again.';
                emailInput.style.borderColor = '#e74c3c';
            }
        } catch (error) {
            console.error('Email OTP error:', error);
            emailError.textContent = 'An error occurred. Please try again.';
            emailInput.style.borderColor = '#e74c3c';
        } finally {
            emailContinueBtn.disabled = false;
            emailContinueBtn.textContent = 'Continue';
        }
    });

    emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') emailContinueBtn.click();
    });

    // ================================
    // OTP CARD HANDLER
    // ================================
    otpContinueBtn.addEventListener('click', async function() {
        const otpCode = otpInput.value.trim();

        otpError.textContent = '';
        otpInput.style.borderColor = '#ddd';

        if (!otpCode) {
            otpError.textContent = 'Please enter the verification code';
            otpInput.style.borderColor = '#e74c3c';
            return;
        }

        if (otpCode.length !== 6) {
            otpError.textContent = 'Please enter a valid 6-digit code';
            otpInput.style.borderColor = '#e74c3c';
            return;
        }

        otpContinueBtn.disabled = true;
        otpContinueBtn.textContent = 'Verifying...';

        try {
            const isValid = await verifyOTPCode(userEmail, otpCode);

            if (isValid) {
                showCard('password', 'right');
            } else {
                otpError.textContent = 'Invalid or expired code. Please try again.';
                otpInput.style.borderColor = '#e74c3c';
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            otpError.textContent = 'An error occurred. Please try again.';
            otpInput.style.borderColor = '#e74c3c';
        } finally {
            otpContinueBtn.disabled = false;
            otpContinueBtn.textContent = 'Continue';
        }
    });

    resendLink.addEventListener('click', async function(e) {
        e.preventDefault();

        try {
            const { success } = await sendOTPToEmail(userEmail);

            if (success) {
                otpError.style.color = '#27ae60';
                otpError.textContent = 'Code resent! Check your email.';
                setTimeout(() => otpError.textContent = '', 3000);
            } else {
                otpError.textContent = 'Failed to resend code. Please try again.';
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            otpError.textContent = 'Failed to resend code. Please try again.';
        }
    });

    otpInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') otpContinueBtn.click();
    });

    passwordContinueBtn.addEventListener('click', async function() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
    
        passwordError.textContent = '';
        confirmPasswordError.textContent = '';
        passwordInput.style.borderColor = '#ddd';
        confirmPasswordInput.style.borderColor = '#ddd';
    
        let hasError = false;
    
        if (!password) {
            passwordError.textContent = 'Please enter a password';
            passwordInput.style.borderColor = '#e74c3c';
            hasError = true;
        } else if (password.length < 6) {
            passwordError.textContent = 'Password must be at least 6 characters';
            passwordInput.style.borderColor = '#e74c3c';
            hasError = true;
        }
    
        if (!confirmPassword) {
            confirmPasswordError.textContent = 'Please confirm your password';
            confirmPasswordInput.style.borderColor = '#e74c3c';
            hasError = true;
        } else if (password !== confirmPassword) {
            confirmPasswordError.textContent = 'Passwords do not match';
            confirmPasswordInput.style.borderColor = '#e74c3c';
            hasError = true;
        }
    
        if (hasError) return;
    
        passwordContinueBtn.disabled = true;
        passwordContinueBtn.textContent = 'Creating Account...';
    
        try {
            // Save user info in Firestore USERS collection (no Auth)
            const { success, message } = await saveUserToFirestore(userEmail, password);
        
            if (success) {
                alert('Account created successfully!');
                // Optionally, redirect to login/dashboard
                // window.location.href = '../Login page/nextcap_login.html';
            } else {
                passwordError.textContent = message || 'Failed to create account. Please try again.';
            }
        } catch (error) {
            console.error('Create account error:', error);
            passwordError.textContent = 'Failed to create account. Please try again.';
        } finally {
            passwordContinueBtn.disabled = false;
            passwordContinueBtn.textContent = 'Create Account';
        }
    });

    // ================================
    // BACK BUTTONS
    // ================================
    document.getElementById('otp-back-btn').addEventListener('click', function() {
        showCard('email', 'left');
        otpInput.value = '';
        otpError.textContent = '';
    });

    document.getElementById('password-back-btn').addEventListener('click', function() {
        showCard('otp', 'left');
        passwordInput.value = '';
        confirmPasswordInput.value = '';
        passwordError.textContent = '';
        confirmPasswordError.textContent = '';
    });

    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') confirmPasswordInput.focus();
    });

    confirmPasswordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') passwordContinueBtn.click();
    });
});
