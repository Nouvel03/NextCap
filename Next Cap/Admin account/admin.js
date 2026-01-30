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

}

function wireUpload(email) {
  const uploadArea = document.querySelector('.upload-area');
  if (!uploadArea) return;

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

  uploadArea.addEventListener('click', (e) => {
    if (e.target === fileInput) return;

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

  });
}

export default async function initAdminPage() {
  wireSidebar();
  wireUpload(null);

  const auth = await ensureAdminOrRedirect();
  if (auth) {
    wireUpload(auth.email);
    const nameEl = document.querySelector('.user-name');
    if (nameEl) nameEl.textContent = 'Hello Admin';
  }
}

window.initAdminPage = initAdminPage;
