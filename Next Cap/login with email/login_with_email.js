import { decrypt } from "../utils/crypter.js";

document.addEventListener('DOMContentLoaded', () => {
  // back button handler: use history.back() or fallback to main login page
  const backBtn = document.querySelector('.back-button');
  if (backBtn && !backBtn.hasAttribute('data-wired')) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '../Login page/nextcap_login.html';
      }
    });
    backBtn.setAttribute('data-wired', 'true');
  }
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const loginBtn = document.getElementById('login-btn');
  const emailErr = document.getElementById('login-email-error');
  const passErr = document.getElementById('login-password-error');

  function showError(el, msg) {
    el.textContent = msg;
    const prev = el.previousElementSibling;
    if (prev) prev.classList.add('error');
  }
  function clearErrors() {
    emailErr.textContent = '';
    passErr.textContent = '';
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');
  }

  loginBtn.addEventListener('click', async () => {
    clearErrors();
    const email = (emailInput.value || '').trim();
    const password = passwordInput.value || '';

    if (!email) { showError(emailErr, 'Email required'); emailInput.focus(); return; }
    if (!password) { showError(passErr, 'Password required'); passwordInput.focus(); return; }

    if (!window.db) {
      showError(emailErr, 'Database not initialized');
      return;
    }

    try {
      const usersRef = window.db.collection('USERS');
      const snapshot = await usersRef.where('email', '==', email).get();

      if (snapshot.empty) {
        showError(emailErr, 'No account with that email');
        return;
      }

      const userDoc = snapshot.docs[0];
      const data = userDoc.data();
      const encrypted = data.password;

      let decrypted;
      try {
        decrypted = decrypt(encrypted);
      } catch (e) {
        showError(passErr, 'Unable to decrypt password');
        return;
      }

      if (decrypted === password) {
        // Check if account_information is present and non-empty
        const accountInfo = data.account_information;
        const hasAccountInfo = accountInfo && typeof accountInfo === 'object' && Object.keys(accountInfo).length > 0;

        // persist logged-in email for other pages
        try { localStorage.setItem('nextcap_user_email', email); } catch (e) { /* ignore */ }

        if (!hasAccountInfo) {
          // redirect user to complete profile
          window.location.href = '../Information/information.html';
        } else {
          alert('Your account profile is already completed.');
        } 
      } else {
        showError(passErr, 'Incorrect password');
      }
    } catch (err) {
      showError(emailErr, 'Login failed');
      console.error(err);
    }
  });
});
