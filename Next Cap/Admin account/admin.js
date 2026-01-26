// admin.js — shared admin helpers for sidebar, auth guard and upload
import { getUserByEmail } from '../FirebaseUtils/FirebaseUtils_Login.js';

async function ensureAdminOrRedirect() {
  const email = localStorage.getItem('nextcap_user_email');
  if (!email) {
    window.location.href = '../Login page/nextcap_login.html';
    return null;
  }
  try {
    const userDoc = await getUserByEmail(email);
    const t = userDoc && userDoc.data && userDoc.data.type;
    if (t !== 'admin') {
      // not admin — send to user dashboard
      window.location.href = '../Dashboard all/index1.html';
      return null;
    }
    return { email, userDoc };
  } catch (err) {
    console.error('Admin auth check failed:', err);
    window.location.href = '../Login page/nextcap_login.html';
    return null;
  }
}

function wireSidebar() {
  const map = {
    'Dashboard': 'indexAdmin.html',
    'Manage Scholarships': 'indexAdmin.html',
    'Create Scholarships': 'indexUpload.html',
    'Applications Overview': 'indexExcel.html',
    'Profile Settings': 'indexAdmin.html'
  };

  // Make matching robust and set proper hrefs so middle-click/open-in-new-tab works.
  document.querySelectorAll('.menu-item').forEach(item => {
    const raw = (item.innerText || '').replace(/\s+/g, ' ').trim();
    const target = map[raw];
    if (target) {
      // update anchor href so default browser behavior works
      try { item.setAttribute('href', target); } catch (e) { }
    }

    item.addEventListener('click', (e) => {
      // Store the clicked menu label in sessionStorage so it persists after navigation
      try {
        sessionStorage.setItem('admin_active_menu', raw);
      } catch (err) {
        // ignore
      }
      // Allow the browser to follow the anchor href
      document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Restore active state from sessionStorage on page load
  try {
    const activeMenu = sessionStorage.getItem('admin_active_menu');
    if (activeMenu) {
      document.querySelectorAll('.menu-item').forEach(item => {
        const raw = (item.innerText || '').replace(/\s+/g, ' ').trim();
        if (raw === activeMenu) {
          item.classList.add('active');
        }
      });
    }
  } catch (err) {
    // ignore
  }
}

function wireUpload(email) {
  const uploadArea = document.querySelector('.upload-area');
  if (!uploadArea) return;

  // Prefer a pre-existing #photo-input (page-specific). Create a hidden input only if none exists.
  let fileInput = document.getElementById('photo-input');
  let created = false;
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    created = true;
  }

  // Ensure clicks on the upload area open the input (works even if a <label for> is present)
  uploadArea.addEventListener('click', (e) => {
    // If user clicked the input itself, do nothing to avoid double-open
    if (e.target === fileInput) return;

    // If uploadArea is a valid label for this input, the browser handles the click automatically.
    // We check both implicit (nesting) and explicit (for attribute) association.
    if (uploadArea.tagName === 'LABEL') {
      const isNested = uploadArea.contains(fileInput);
      const isExplicit = fileInput.id && uploadArea.htmlFor === fileInput.id;
      if (isNested || isExplicit) return;
    }

    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // If using a page-provided #photo-input, let page code handle preview (background/img). Only do preview here when we created the input.
    if (created) {
      const img = document.createElement('img');
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'cover';
      uploadArea.textContent = '';
      uploadArea.appendChild(img);
      const reader = new FileReader();
      reader.onload = () => img.src = reader.result;
      reader.readAsDataURL(file);
    }

    // upload to Firebase Storage if available
    // upload to Firebase Storage if available
    /* 
    // AUTO-UPLOAD DISABLED: This should likely happen on form submission, not on file selection.
    // Also causes CORS errors on localhost if not configured.
    if (typeof firebase !== 'undefined' && firebase.storage) {
      try {
        const storageRef = firebase.storage().ref();
        const emailSafe = (email || 'unknown').replace(/[@.]/g, '_');
        const path = `admin_uploads/${emailSafe}/${Date.now()}_${file.name}`;
        const uploadTaskSnapshot = await storageRef.child(path).put(file);
        const url = await uploadTaskSnapshot.ref.getDownloadURL();
        console.log('Uploaded file URL:', url);
        // Optionally, you could save the URL to Firestore under a collection like 'ADMIN_UPLOADS' or attach to a scholarship
      } catch (err) {
        console.error('Upload failed', err);
      }
    } else {
      console.warn('Firebase storage not available; skipping upload.');
    }
    */
  });
}

export default async function initAdminPage() {
  // Wire UI behaviors first so upload/tags work even if auth check redirects later
  wireSidebar();
  wireUpload(null);

  // Then perform auth check; if admin, re-wire upload with email and set greeting
  const auth = await ensureAdminOrRedirect();
  if (auth) {
    // re-wire upload with known email (so storage paths use email)
    wireUpload(auth.email);
    const nameEl = document.querySelector('.user-name');
    if (nameEl) nameEl.textContent = 'Hello Admin';
  }
}

// Also attach for non-module consumers
window.initAdminPage = initAdminPage;
