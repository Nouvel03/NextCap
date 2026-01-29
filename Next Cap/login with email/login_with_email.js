import { decrypt } from "../utils/crypter.js";
import { checkEmailExists, updateUserPassword } from "../FirebaseUtils/FirebaseUtils_Login.js"; // Import new helpers

document.addEventListener('DOMContentLoaded', () => {
  // === GLOBALS & STATE ===
  let currentCard = 'login-card'; // Holds the ID of the current card
  let generatedOTP = null;
  let currentForgotEmail = '';

  const ANIM_DURATION = 420; // Match CSS

  // Ensure login card is visible initially
  const initialCard = document.getElementById(currentCard);
  if (initialCard) {
    initialCard.classList.add('active');
    // Force a slight delay to trigger entry animation if defined (optional)
    // For now relying on CSS default opacity transition on load
  }

  function showCard(nextCardId, direction = 'right') {
    const currentEl = document.getElementById(currentCard);
    const nextEl = document.getElementById(nextCardId);

    if (!currentEl || !nextEl) return;
    if (currentCard === nextCardId) return;

    // Prepare next card
    nextEl.classList.add('active');

    // Z-Index: Current stays on top during exit
    currentEl.style.zIndex = 10;
    nextEl.style.zIndex = 5;

    // Add animation classes
    // If direction is 'right' (moving forward): Current slides out to Left? No.
    // Usually: Forward -> Current slides Out Left, Next slides In Right.
    // CSS names: slide-out-left, slide-in-right.

    // Let's check CSS names from step 1373:
    // .slide-out-left: translates X to -110% (Goes Left). opacity 0.
    // .slide-out-right: translates X to -110% (Wait? Step 1373 keyframes check...)

    // CHECK KEYFRAMES IN STEP 1373:
    // slideOutRight: to { transform: translateX(-110%) } -> THIS MEMORIZED FROM PREVIOUS?
    // Wait. slideOutRight usually means sliding OUT TO THE RIGHT (translateX > 100%).
    // Let's check Step 1373 again carefully.

    /* 
    @keyframes slideOutRight {
        to { transform: ... translateX(-110%) ... } // Wait, -110% is LEFT.
    }
    */
    // If slideOutRight moves LEFT, the naming is confusing or I misread.
    // Let's re-read Step 1373 or 1370 logic.
    // Step 1370 (Original file):
    // @keyframes slideOutRight ... to { translateX(-110%) } -> That is Left.
    // @keyframes slideOutLeft ... to { translateX(110%) } -> That is Right.
    // That seems INVERTED naming or specific to "Slide out [action] Right [direction of flow?]"

    // Actually, usually "Slide Out Left" means element moves to the left.
    // "Slide Out Right" means element moves to the right.

    // In Step 1370/1373:
    // slideOutRight: translateX matches -110%. (Left).
    // slideOutLeft: translateX matches 110%. (Right).

    // So `slide-out-right` makes it go LEFT.
    // This is confusing. I will stick to what the CSS *does*.

    // Forward Navigation (Enter new card from Right, Old card leaves to Left):
    // Old: slide-out-right (Goes Left per CSS).
    // New: slide-in-right (From Right? Let's check).
    // slideInRight: from { translateX(-120%) } -> Starts Left?
    // Wait. slideInRight: from -120% (Left) to 0. It enters FROM Left?

    // Let's look at `slideInLeft` in Step 1373:
    // from { translateX(120%) } -> Starts Right.

    // Okay, the CSS naming is definitely: "Slide [In/Out] [FROM/TO direction inverted?]".
    // Or maybe "Slide [Motion Type] [Button Pressed Direction?]".

    // Let's simply test or use the logic from `email-flow.js` calls.
    // email-flow.js: showCard(cardName, 'right').
    // Logic: 
    // currentCardEl.classList.add(`slide-out-${direction}`);
    // nextCardEl.classList.add(`slide-in-${direction === 'right' ? 'left' : 'right'}`);

    // If direction is 'right':
    // current: slide-out-right (Goes Left).
    // next: slide-in-left (Starts Right?).
    // slideInLeft (Step 1373): from { translateX(120%) } (Right). to { 0 }.
    // So Next comes IN from Right.

    // Okay, so passing 'right' means "Simulate moving Right/Forward".
    // Current goes Left (slide-out-right). Next comes from Right (slide-in-left).

    // Confusing naming but consistent usage.
    // I will USE the code pattern from `email-flow.js`.

    if (direction === 'right') {
      currentEl.classList.add('slide-out-right'); // Logic says this goes Left
      nextEl.classList.add('slide-in-left');     // Logic says this comes from Right
    } else {
      // 'left' (Back)
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


  // === EMAIL / OTP LOGIC ===
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

  // === LOGIN ELEMENTS ===
  const loginBtn = document.getElementById('login-btn');
  const loginEmailInput = document.getElementById('login-email');
  const loginPassInput = document.getElementById('login-password');
  const loginEmailErr = document.getElementById('login-email-error');
  const loginPassErr = document.getElementById('login-password-error');
  const forgotLink = document.getElementById('forgot-password-link');

  // === FORGOT PASSWORD ELEMENTS ===
  const forgotEmailInput = document.getElementById('forgot-email');
  const forgotEmailErr = document.getElementById('forgot-email-error');
  const sendOtpBtn = document.getElementById('send-otp-btn');
  const forgotBackBtn = document.getElementById('forgot-back-btn');

  const otpInput = document.getElementById('forgot-otp-input');
  const otpErr = document.getElementById('forgot-otp-error');
  const verifyOtpBtn = document.getElementById('verify-otp-btn');
  const otpBackBtn = document.getElementById('otp-back-btn');
  const otpDisplayInfo = document.getElementById('otp-email-display');

  // === RESET PASSWORD ELEMENTS ===
  const newPassInput = document.getElementById('new-password');
  const confirmPassInput = document.getElementById('confirm-password');
  const newPassErr = document.getElementById('new-password-error');
  const confirmPassErr = document.getElementById('confirm-password-error');
  const resetPassBtn = document.getElementById('reset-pass-btn');

  // === DOM HELPERS ===
  function showError(el, msg) {
    if (el) el.textContent = msg;
    const input = el?.previousElementSibling;
    if (input) input.style.borderColor = '#e74c3c';
  }
  function clearError(el, input) {
    if (el) el.textContent = '';
    if (input) input.style.borderColor = '#ddd';
  }

  // === 1. LOGIN LOGIC ===
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
          // Success
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

  // === 2. FORGOT PASSWORD FLOW ===

  // Link Click
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showCard('forgot-password-card', 'right');
      currentForgotEmail = '';
      forgotEmailInput.value = loginEmailInput.value || '';
    });
  }

  // Back Button (Forgot Email Card)
  if (forgotBackBtn) {
    forgotBackBtn.addEventListener('click', () => {
      showCard('login-card', 'left');
    });
  }

  // Send OTP
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', async () => {
      const email = forgotEmailInput.value.trim();
      clearError(forgotEmailErr, forgotEmailInput);

      if (!email) return showError(forgotEmailErr, 'Enter email');
      if (!/\S+@\S+\.\S+/.test(email)) return showError(forgotEmailErr, 'Invalid email');

      sendOtpBtn.disabled = true;
      sendOtpBtn.textContent = 'Checking...';

      try {
        // Check existence
        const exists = await checkEmailExists(email);
        if (!exists) {
          sendOtpBtn.disabled = false;
          sendOtpBtn.textContent = 'Send Code';
          return showError(forgotEmailErr, 'No account found with this email');
        }

        // Send
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

  // Back Button (OTP Card)
  if (otpBackBtn) {
    otpBackBtn.addEventListener('click', () => {
      showCard('forgot-password-card', 'left');
    });
  }

  // Verify OTP
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

  // Reset Password
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
