import { decrypt } from "../utils/crypter.js";
import { checkEmailExists, updateUserPassword } from "../FirebaseUtils/FirebaseUtils_Login.js"; // Import new helpers

document.addEventListener('DOMContentLoaded', () => {
  let currentCard = 'login-card'; // Holds the ID of the current card
  let generatedOTP = null;
  let currentForgotEmail = '';

  const ANIM_DURATION = 420; // Match CSS

  const initialCard = document.getElementById(currentCard);
  if (initialCard) {
    initialCard.classList.add('active');
  }

  function showCard(nextCardId, direction = 'right') {
    const currentEl = document.getElementById(currentCard);
    const nextEl = document.getElementById(nextCardId);

    if (!currentEl || !nextEl) return;
    if (currentCard === nextCardId) return;

    nextEl.classList.add('active');

    currentEl.style.zIndex = 10;
    nextEl.style.zIndex = 5;



    if (direction === 'right') {
      currentEl.classList.add('slide-out-right'); // Logic says this goes Left
      nextEl.classList.add('slide-in-left');     // Logic says this comes from Right
    } else {
      currentEl.classList.add('slide-out-left');  // Logic says this goes Right
      nextEl.classList.add('slide-in-right');     // Logic says this comes from Left
    }

    setTimeout(() => {
      currentEl.classList.remove('active', 'slide-out-right', 'slide-out-left');
      nextEl.classList.remove('slide-in-left', 'slide-in-right');
      currentEl.style.zIndex = '';
      nextEl.style.zIndex = '';
      currentCard = nextCardId;
    }, ANIM_DURATION + 20);
  }


  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async function sendOTPToEmail(email) {
    generatedOTP = generateOTP();
    try {
      const templateParams = {
        email: email,
        passcode: generatedOTP
      };
      if (!window.SECRETS) throw new Error("Secrets not loaded");

      const result = await emailjs.send(
        window.SECRETS.EMAILJS_SERVICE_ID,
        window.SECRETS.EMAILJS_OTP_TEMPLATE_ID,
        templateParams
      );
      console.log('OTP sent:', generatedOTP, result);
      return true;
    } catch (error) {
      console.error('EmailJS send error:', error);
      return false;
    }
  }
  const loginBtn = document.getElementById('login-btn');
  const loginEmailInput = document.getElementById('login-email');
  const loginPassInput = document.getElementById('login-password');
  const loginEmailErr = document.getElementById('login-email-error');
  const loginPassErr = document.getElementById('login-password-error');
  const forgotLink = document.getElementById('forgot-password-link');

  const forgotEmailInput = document.getElementById('forgot-email');
  const forgotEmailErr = document.getElementById('forgot-email-error');
  const sendOtpBtn = document.getElementById('send-otp-btn');
  const forgotBackBtn = document.getElementById('forgot-back-btn');

  const otpInput = document.getElementById('forgot-otp-input');
  const otpErr = document.getElementById('forgot-otp-error');
  const verifyOtpBtn = document.getElementById('verify-otp-btn');
  const otpBackBtn = document.getElementById('otp-back-btn');
  const otpDisplayInfo = document.getElementById('otp-email-display');

  const newPassInput = document.getElementById('new-password');
  const confirmPassInput = document.getElementById('confirm-password');
  const newPassErr = document.getElementById('new-password-error');
  const confirmPassErr = document.getElementById('confirm-password-error');
  const resetPassBtn = document.getElementById('reset-pass-btn');

  function showError(el, msg) {
    if (el) el.textContent = msg;
    const input = el?.previousElementSibling;
    if (input) input.style.borderColor = '#e74c3c';
  }
  function clearError(el, input) {
    if (el) el.textContent = '';
    if (input) input.style.borderColor = '#ddd';
  }

  const passwordInput = document.getElementById("code");
  const toggleButton = document.querySelector(".toggle-password");
  const toggleIcon = toggleButton ? toggleButton.querySelector("img") : null;

  if (toggleButton && passwordInput && toggleIcon) {
    toggleButton.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";

      passwordInput.type = isPassword ? "text" : "password";
      toggleIcon.src = isPassword
        ? "images/eye-alt-svgrepo-com.svg"
        : "images/eye-slash-svgrepo-com.svg";
    });
  }

  function clearErrors() {
    loginEmailErr.textContent = '';
    loginPassErr.textContent = '';
    loginEmailInput.classList.remove('error');
    loginPassInput.classList.remove('error');
  }
}

  if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    clearError(loginEmailErr, loginEmailInput);
    clearError(loginPassErr, loginPassInput);

    const email = loginEmailInput.value.trim();
    const password = loginPassInput.value;

    if (!email) return showError(loginEmailErr, 'Email required');
    if (!password) return showError(loginPassErr, 'Password required');

    if (!window.db) return showError(loginEmailErr, 'Database not init');

    try {
      const usersRef = window.db.collection('USERS');
      const snapshot = await usersRef.where('email', '==', email).get();

      if (snapshot.empty) return showError(loginEmailErr, 'No account with that email');

      const userDoc = snapshot.docs[0];
      const data = userDoc.data();
      const encrypted = data.password;

      let decrypted;
      try { decrypted = decrypt(encrypted); }
      catch (e) { return showError(loginPassErr, 'Store password error'); }

      if (decrypted === password) {
        localStorage.setItem('nextcap_user_email', email);
        const userType = data.type;

        if (userType === 'admin') {
          window.location.href = '../Admin account/indexAdmin.html';
        } else if (data.account_information && Object.keys(data.account_information).length > 0) {
          window.location.href = '../Dashboard all/index1.html';
        } else {
          window.location.href = '../Information/information.html';
        }
      } else {
        showError(loginPassErr, 'Incorrect password');
      }
    } catch (err) {
      console.error(err);
      showError(loginEmailErr, 'Login failed');
    }
  });
}


if (forgotLink) {
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    showCard('forgot-password-card', 'right');
    currentForgotEmail = '';
    forgotEmailInput.value = loginEmailInput.value || '';
  });
}

if (forgotBackBtn) {
  forgotBackBtn.addEventListener('click', () => {
    showCard('login-card', 'left');
  });
}

if (sendOtpBtn) {
  sendOtpBtn.addEventListener('click', async () => {
    const email = forgotEmailInput.value.trim();
    clearError(forgotEmailErr, forgotEmailInput);

    if (!email) return showError(forgotEmailErr, 'Enter email');
    if (!/\S+@\S+\.\S+/.test(email)) return showError(forgotEmailErr, 'Invalid email');

    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Checking...';

    try {
      const exists = await checkEmailExists(email);
      if (!exists) {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send Code';
        return showError(forgotEmailErr, 'No account found with this email');
      }

      sendOtpBtn.textContent = 'Sending OTP...';
      const sent = await sendOTPToEmail(email);
      if (sent) {
        currentForgotEmail = email;
        otpDisplayInfo.textContent = email;
        showCard('forgot-otp-card', 'right');
      } else {
        showError(forgotEmailErr, 'Failed to send OTP. Check console/limits.');
      }
    } catch (e) {
      console.error(e);
      showError(forgotEmailErr, 'Error occurred');
    } finally {
      sendOtpBtn.disabled = false;
      if (currentCard === 'forgot-password-card') sendOtpBtn.textContent = 'Send Code';
    }
  });
}

if (otpBackBtn) {
  otpBackBtn.addEventListener('click', () => {
    showCard('forgot-password-card', 'left');
  });
}

if (verifyOtpBtn) {
  verifyOtpBtn.addEventListener('click', () => {
    const code = otpInput.value.trim();
    clearError(otpErr, otpInput);

    if (!code) return showError(otpErr, 'Enter code');

    if (code === generatedOTP) {
      showCard('reset-password-card', 'right');
    } else {
      showError(otpErr, 'Invalid code');
    }
  });
}

if (resetPassBtn) {
  resetPassBtn.addEventListener('click', async () => {
    const p1 = newPassInput.value;
    const p2 = confirmPassInput.value;
    clearError(newPassErr, newPassInput);
    clearError(confirmPassErr, confirmPassInput);

    if (!p1) return showError(newPassErr, 'Required');
    if (p1.length < 6) return showError(newPassErr, 'Too short (min 6)');
    if (p1 !== p2) return showError(confirmPassErr, 'Passwords do not match');

    resetPassBtn.disabled = true;
    resetPassBtn.textContent = 'Updating...';

    try {
      const res = await updateUserPassword(currentForgotEmail, p1);
      if (res.success) {
        alert('Password updated successfully! Redirecting...');
        localStorage.setItem('nextcap_user_email', currentForgotEmail); // Auto-login
        window.location.href = '../Dashboard all/index1.html';
      } else {
        showError(newPassErr, res.message || 'Update failed');
      }
    } catch (e) {
      console.error(e);
      showError(newPassErr, 'Update failed');
    } finally {
      resetPassBtn.disabled = false;
      resetPassBtn.textContent = 'Update Password';
    }
  });
}
});
