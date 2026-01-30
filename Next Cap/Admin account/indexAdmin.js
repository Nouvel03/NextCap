import initAdminPage from './admin.js';

initAdminPage();

const db = firebase.firestore();

const client = new Appwrite.Client();
const APPWRITE_PROJECT_ID = window.SECRETS.APPWRITE_PROJECT_ID;
const APPWRITE_BUCKET_ID = window.SECRETS.APPWRITE_BUCKET_ID;

client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(APPWRITE_PROJECT_ID);

const storage = new Appwrite.Storage(client);

let currentEditingId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadManagedScholarships();
    setupModalListeners();
    setupTagInput('edit-tag-input', 'edit-tags-container');
    setupRequirementsInput('edit-req-input', 'edit-req-container');
    setupImagePreview();
});

async function loadManagedScholarships() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    let listContainer = document.getElementById('scholarship-list-container');
    if (!listContainer) {
        listContainer = document.createElement('div');
        listContainer.id = 'scholarship-list-container';
        const controls = document.querySelector('.content-controls');
        if (controls) {
            controls.insertAdjacentElement('afterend', listContainer);
        } else {
            mainContent.appendChild(listContainer);
        }

        const staticCard = document.querySelector('.scholarship-card');
        if (staticCard) staticCard.remove();
    }

    listContainer.innerHTML = '<p style="padding:20px; color:#718096;">Loading scholarships...</p>';

    try {
        const snapshot = await db.collection('SCHOLARSHIPS').orderBy('time_of_creation', 'desc').get();

        if (snapshot.empty) {
            listContainer.innerHTML = '<p style="padding:20px; color:#718096;">No scholarships found.</p>';
            return;
        }

        listContainer.innerHTML = '';

        snapshot.forEach(doc => {
            const s = doc.data();
            const id = doc.id;
            const card = createAdminCard(id, s);
            listContainer.appendChild(card);
        });

    } catch (err) {
        console.error("Error loading scholarships:", err);
        listContainer.innerHTML = '<p style="color:red; padding:20px;">Failed to load data.</p>';
    }
}

function createAdminCard(id, s) {
    const card = document.createElement('div');
    card.className = 'scholarship-card';
    card.style.marginBottom = '20px';

    let dateStr = "Recently";
    if (s.time_of_creation) {
        const d = s.time_of_creation.toDate ? s.time_of_creation.toDate() : new Date(s.time_of_creation);
        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
            '<br>' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    }

    const isActive = s.active !== false;
    const statusText = isActive ? 'Active' : 'Inactive';
    const statusClass = isActive ? 'status-pill' : 'status-pill inactive';
    const btnText = isActive ? 'Deactivate' : 'Activate';
    const btnClass = isActive ? 'btn btn-red' : 'btn btn-teal';

    const tagsHTML = (Array.isArray(s.tags) ? s.tags : [])
        .map(t => {
            const label = typeof t === 'string' ? t : t.name;
            return `<span class="tag" style="background-color:rgba(13, 24, 148, 0.1); color:#09116B; display:inline-flex; align-items:center; justify-content:center; text-align:center; min-height:24px; white-space:normal; line-height:1.2; word-break: break-word;">${label}</span>`;
        }).join('');

    card.innerHTML = `
        <div class="card-header-row">
            <div class="org-info">
                <div class="org-icon"></div>
                <div class="org-text">
                    <h3>${s.from || s.title} <span class="verified">✓</span></h3>
                    <p style="font-size: 12px; color: #718096;">${dateStr}</p>
                </div>
            </div>
            <div class="status-box">
                <p style="font-weight: 700; font-size: 14px; text-align: left;">Status</p>
                <span class="${statusClass}" style="${!isActive ? 'background-color:#e53e3e;' : ''}">${statusText}</span>
            </div>
        </div>

        <div class="card-body">
            <div class="preview-img" style="background-image: url('${s.image_id}'); background-size: cover; background-position: center;"></div>
            <div class="details">
                <h2>${s.title}</h2>
                <p>${s.description ? s.description.substring(0, 150) + '...' : ''}</p>
                <p style="font-weight: 700; margin-bottom: 5px;">Tags</p>
                <div class="tag-group" style="flex-wrap: wrap;">
                    ${tagsHTML}
                </div>
            </div>
            <div class="stats-panel">
                 <div class="stat-line"><span class="stat-label">Application Deadline</span><span class="stat-val deadline">${s.deadline || 'No Deadline'}</span></div>
                 <div class="stat-line"><span class="stat-label">Number of saves</span><span class="stat-val">${s.current_participants || 0}</span></div>
            </div>
        </div>

        <div class="card-footer">
            <button class="${btnClass} toggle-status-btn">${btnText}</button>
            <button class="btn btn-teal view-student-btn">View as student</button>
            <button class="btn btn-yellow edit-btn">Edit</button>
        </div>
    `;

    const toggleBtn = card.querySelector('.toggle-status-btn');
    toggleBtn.addEventListener('click', () => toggleScholarshipStatus(id, isActive));

    const editBtn = card.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => openEditModal(id, s));

    return card;
}

async function toggleScholarshipStatus(id, currentStatus) {
    const newStatus = !currentStatus;
    if (!confirm(`Are you sure you want to ${newStatus ? 'ACTIVATE' : 'DEACTIVATE'} this scholarship?`)) return;

    try {
        await db.collection('SCHOLARSHIPS').doc(id).update({ active: newStatus });
        loadManagedScholarships();
    } catch (err) {
        console.error("Error updating status:", err);
        alert("Failed to update status.");
    }
}

// ---- Modal Logic ----

function setupModalListeners() {
    const modal = document.getElementById('edit-modal');
    const closeBtn = modal.querySelector('.close-modal-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const updateBtn = document.getElementById('update-btn');

    const closeModal = () => {
        modal.style.display = 'none';
        currentEditingId = null;
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    window.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    updateBtn.onclick = updateScholarship;
}

function openEditModal(id, data) {
    currentEditingId = id;
    const modal = document.getElementById('edit-modal');

    document.getElementById('edit-school-input').value = data.from || '';
    document.getElementById('edit-title-input').value = data.title || '';
    document.getElementById('edit-desc-input').value = data.description || '';
    document.getElementById('edit-slots-input').value = data.amount_of_participants || '';

    if (data.deadline) {
        document.getElementById('edit-deadline-input').value = data.deadline;
    }

    // Populate Tags
    const tagsContainer = document.getElementById('edit-tags-container');
    tagsContainer.innerHTML = '';
    const tags = Array.isArray(data.tags) ? data.tags : [];
    tags.forEach(t => {
        const text = typeof t === 'string' ? t : t.name;
        addTagPill(text, tagsContainer);
    });

    const reqContainer = document.getElementById('edit-req-container');
    reqContainer.innerHTML = '';
    const reqs = Array.isArray(data.requirements) ? data.requirements : [];
    reqs.forEach(r => {
        addReqItem(r, reqContainer);
    });

    // Image Preview
    const imgPreview = document.getElementById('edit-preview-img');
    const uploadText = modal.querySelector('.upload-text');
    if (data.image_id) {
        imgPreview.src = data.image_id;
        imgPreview.style.display = 'block';
        if (uploadText) uploadText.style.display = 'none';
    } else {
        imgPreview.style.display = 'none';
        imgPreview.src = '';
        if (uploadText) uploadText.style.display = 'block';
    }

    // Clear File Input
    document.getElementById('edit-photo-input').value = '';

    modal.style.display = 'flex';
}

async function updateScholarship() {
    if (!currentEditingId) return;

    const btn = document.getElementById('update-btn');
    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
        const title = document.getElementById('edit-title-input').value;
        const from = document.getElementById('edit-school-input').value;
        const description = document.getElementById('edit-desc-input').value;
        const slots = document.getElementById('edit-slots-input').value;
        const deadline = document.getElementById('edit-deadline-input').value;

        const tags = Array.from(document.getElementById('edit-tags-container').children)
            .map(el => el.textContent.replace('✕', '').trim());

        const requirements = Array.from(document.getElementById('edit-req-container').children)
            .map(el => el.querySelector('span')?.textContent || el.textContent.replace('×', '').trim());

        const fileInput = document.getElementById('edit-photo-input');
        let fileUrl = null;

        if (fileInput.files.length > 0) {
            // New file selected, upload it
            const file = fileInput.files[0];
            const uniqueId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

            try {
                const result = await storage.createFile(APPWRITE_BUCKET_ID, uniqueId, file);
                const uploadedId = result.$id;

                try {
                    const urlObj = storage.getFileView(APPWRITE_BUCKET_ID, uploadedId);
                    fileUrl = urlObj.href || urlObj.toString();
                } catch (e) {
                    fileUrl = uploadedId;
                }
            } catch (err) {
                console.error("Appwrite upload failed:", err);
                alert("Image upload failed, but continuing with update...");
            }
        }

        const updateData = {
            title, from, description, amount_of_participants: slots, deadline, tags, requirements
        };

        if (fileUrl) {
            updateData.image_id = fileUrl;
        }

        await db.collection('SCHOLARSHIPS').doc(currentEditingId).update(updateData);

        document.getElementById('edit-modal').style.display = 'none';
        loadManagedScholarships();

    } catch (err) {
        console.error("Update failed:", err);
        alert("Failed to update scholarship.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Update';
    }
}

// ---- Helpers (Tags/Reqs) ----

function setupTagInput(inputId, containerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);
    if (!input || !container) return;

    input.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ',') return;
        e.preventDefault();
        const text = input.value.trim().replace(/,/g, '');
        if (!text) return;

        addTagPill(text, container);
        input.value = '';
    });
}

function addTagPill(text, container) {
    // Check dupe
    const exists = [...container.children].some(
        t => t.textContent.replace('✕', '').trim().toLowerCase() === text.toLowerCase()
    );
    if (exists) return;

    const pill = document.createElement('span');
    pill.className = 'tag-pill close';
    pill.textContent = text;
    pill.onclick = () => pill.remove();
    container.appendChild(pill);
}

function setupRequirementsInput(inputId, containerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);
    if (!input || !container) return;

    input.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        addReqItem(text, container);
        input.value = '';
    });
}

function addReqItem(text, container) {
    const exists = [...container.children].some(
        t => t.innerText.replace('×', '').trim().toLowerCase() === text.toLowerCase()
    );
    if (exists) return;

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
}

function setupImagePreview() {
    const fileInput = document.getElementById('edit-photo-input');
    const uploadArea = document.querySelector('#edit-modal .upload-area');
    const uploadText = uploadArea.querySelector('.upload-text');
    const img = document.getElementById('edit-preview-img');

    if (!fileInput) return;

    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
                img.style.display = 'block';
                if (uploadText) uploadText.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });
}
