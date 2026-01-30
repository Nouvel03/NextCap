import initAdminPage from './admin.js';
import { createScholarship } from '../FirebaseUtils/Firebase_CRUD.js';

console.log('[indexUpload] module loaded');

document.addEventListener('DOMContentLoaded', () => {

  try {
    if (typeof initAdminPage === 'function') {
      initAdminPage();
      console.log('[indexUpload] admin initialized');
    }
  } catch (err) {
    console.error('[indexUpload] admin init failed', err);
  }

  const deadlineInput = document.getElementById('deadline-input');
  if (deadlineInput) {

    const now = new Date();
    const localIso = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    deadlineInput.min = localIso;
  }

  function setupTagInput(inputId, containerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);

    if (!input || !container) return;

    Array.from(container.getElementsByClassName('tag-pill')).forEach(pill => {
      pill.onclick = () => pill.remove();
    });

    input.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ',') return;
      e.preventDefault();

      const text = input.value.trim().replace(/,/g, '');
      if (!text) return;

      const exists = [...container.children].some(
        t => t.textContent.replace('✕', '').trim().toLowerCase() === text.toLowerCase()
      );
      if (exists) {
        input.value = '';
        return;
      }

      const pill = document.createElement('span');
      pill.className = 'tag-pill close';
      pill.textContent = text;
      pill.onclick = () => pill.remove();

      container.appendChild(pill);
      input.value = '';
    });
  }

  function setupRequirementsInput(inputId, containerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);

    if (!input || !container) return;

    Array.from(container.getElementsByClassName('req-item')).forEach(item => {
      const removeBtn = item.querySelector('.remove-req');
      if (removeBtn) {
        removeBtn.onclick = () => item.remove();
      }
    });

    input.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();

      const text = input.value.trim();
      if (!text) return;

      const exists = [...container.children].some(
        t => t.innerText.replace('×', '').trim().toLowerCase() === text.toLowerCase()
      );
      if (exists) {
        input.value = '';
        return;
      }

      const item = document.createElement('div');
      item.className = 'req-item';

      const span = document.createElement('span');
      span.textContent = text;

      const removeBtn = document.createElement('span');
      removeBtn.className = 'remove-req';
      removeBtn.innerHTML = '&times;';
      removeBtn.onclick = () => item.remove();

      item.appendChild(span);
      item.appendChild(removeBtn);

      container.appendChild(item);
      input.value = '';
    });
  }

  setupTagInput('tag-input', 'tags-container');
  setupRequirementsInput('req-input', 'req-container');

  const uploadArea = document.querySelector('.upload-area');
  const fileInput = document.getElementById('photo-input');

  console.log('[indexUpload] Searching for elements:', {
    uploadArea: !!uploadArea,
    fileInput: !!fileInput
  });

  if (!uploadArea || !fileInput) {
    console.error('[indexUpload] CRITICAL: upload elements missing in DOM');
    return;
  }

  uploadArea.addEventListener('click', (e) => {
    console.log('[indexUpload] upload-area clicked at', new Date().toISOString(), 'Target:', e.target.tagName, 'Class:', e.target.className);
  });

  fileInput.addEventListener('click', () => {
    console.log('[indexUpload] file-input clicked (opening picker)');
  });

  fileInput.addEventListener('change', () => {
    console.log('[indexUpload] Change event fired on input');

    if (!fileInput.files || fileInput.files.length === 0) {
      console.warn('[indexUpload] No files property or 0 files selected');
      return;
    }

    const file = fileInput.files[0];
    console.log('[indexUpload] File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

    if (!file || !file.type.startsWith('image/')) {
      console.warn('[indexUpload] Invalid file type selected');
      alert('Please select an image');
      return;
    }

    const uploadText = uploadArea.querySelector('.upload-text');
    console.log('[indexUpload] uploadText element found:', !!uploadText);

    if (uploadText) {
      uploadText.style.display = 'none';
    }

    let img = uploadArea.querySelector('.upload-preview-img');
    console.log('[indexUpload] Existing preview image found:', !!img);

    if (!img) {
      console.log('[indexUpload] Creating new image element');
      img = document.createElement('img');
      img.className = 'upload-preview-img';

      uploadArea.appendChild(img);
    } else {
      console.log('[indexUpload] reusing existing image element');
    }

    img.alt = file.name;

    console.log('[indexUpload] Starting FileReader...');
    const reader = new FileReader();

    reader.onerror = (err) => {
      console.error('[indexUpload] FileReader error:', err);
    };

    reader.onload = () => {
      console.log('[indexUpload] FileReader loaded data. Length:', reader.result.length);
      img.src = reader.result;
      console.log('[indexUpload] Image src set.');
    };

    reader.readAsDataURL(file);
  });

  // ---- APPWRITE & POST LOGIC ----
  const client = new Appwrite.Client();

  const APPWRITE_PROJECT_ID = window.SECRETS.APPWRITE_PROJECT_ID;
  const APPWRITE_BUCKET_ID = window.SECRETS.APPWRITE_BUCKET_ID; // Updated to user provided ID

  client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(APPWRITE_PROJECT_ID); // Your Project ID

  const storage = new Appwrite.Storage(client);

  const postBtn = document.getElementById('post-btn');
  if (postBtn) {
    postBtn.addEventListener('click', async () => {
      const from = document.getElementById('school-input')?.value || '';
      const title = document.getElementById('title-input')?.value || '';

      const deadline = document.getElementById('deadline-input')?.value;
      const slots = document.getElementById('slots-input')?.value;
      const descriptionWrapper = document.getElementById('desc-input');
      const description = descriptionWrapper?.value || '';

      const tags = Array.from(document.getElementById('tags-container')?.children || [])
        .map(el => el.textContent.replace('✕', '').trim());

      const requirements = Array.from(document.getElementById('req-container')?.children || [])
        .map(el => el.querySelector('span')?.textContent || el.textContent.replace('×', '').trim());

      if (!title || !from || !deadline || !description) {
        alert('Please fill in all required fields (School/Grant, Title, Deadline, Description)');
        return;
      }

      const file = fileInput?.files?.[0];
      if (!file) {
        alert('Please select an image to upload.');
        return;
      }

      // 3. Disable button
      postBtn.disabled = true;
      postBtn.textContent = 'Posting...';

      try {

        const uniqueId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        console.log('[indexUpload] Uploading image to Appwrite with ID:', uniqueId);

        let uploadedId = null;
        try {
          const result = await storage.createFile(
            APPWRITE_BUCKET_ID,
            uniqueId,
            file
          );
          uploadedId = result.$id;
          console.log('[indexUpload] Appwrite upload success. File ID:', uploadedId);
        } catch (appwriteErr) {
          console.error('Appwrite Upload Failed:', appwriteErr);
          alert('Image upload failed. Check Console. Proceeding with mock ID.');
          uploadedId = 'mock_' + uniqueId;
        }

        let fileUrl = '';
        try {
          const urlObj = storage.getFileView(APPWRITE_BUCKET_ID, uploadedId);
          fileUrl = urlObj.href || urlObj.toString();
        } catch (e) {
          console.warn('Could not generate view URL, using specific ID instead', e);
          fileUrl = uploadedId;
        }

        const userEmail = localStorage.getItem('nextcap_user_email') || 'admin_unknown';

        const scholarshipData = {
          created_by: userEmail,
          deadline: deadline,
          image_id: fileUrl,
          title: title,
          from: from,
          description: description,
          amount_of_participants: slots,
          tags: tags,
          requirements: requirements
        };

        console.log('[indexUpload] Saving to Firestore:', scholarshipData);
        const docId = await createScholarship(scholarshipData);



      } catch (err) {
        console.error('Post failed:', err);
        alert('Failed to post scholarship. See console.');
      } finally {
        postBtn.disabled = false;
        postBtn.textContent = 'Post';
      }
    });
  }
});
