import initAdminPage from './admin.js';

// Initialize the shared admin logic (sidebar, strict auth check)
initAdminPage();

// Main Logic for Manage Scholarships
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth check to pass? initAdminPage does it async.
    // We can just start loading data; if auth fails, page redirects anyway.
    loadManagedScholarships();
});

const db = firebase.firestore();

async function loadManagedScholarships() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // Use existing controls if present, or keep them.
    // We want to replace the static .scholarship-card with our dynamic list.
    // Let's create a container for the list if it doesn't exist.
    let listContainer = document.getElementById('scholarship-list-container');
    if (!listContainer) {
        listContainer = document.createElement('div');
        listContainer.id = 'scholarship-list-container';
        // Insert after controls
        const controls = document.querySelector('.content-controls');
        if (controls) {
            controls.insertAdjacentElement('afterend', listContainer);
        } else {
            mainContent.appendChild(listContainer);
        }

        // Remove the static example card if it exists
        const staticCard = document.querySelector('.scholarship-card');
        if (staticCard) staticCard.remove();
    }

    listContainer.innerHTML = '<p style="padding:20px; color:#718096;">Loading scholarships...</p>';

    try {
        const snapshot = await db.collection('SCHOLARSHIPS').orderBy('time_of_creation', 'desc').get();

        if (snapshot.empty) {
            listContainer.innerHTML = '<p style="padding:20px; color:#718096;">No scholarships found. Create one?</p>';
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
    card.style.marginBottom = '20px'; // spacing

    // Calculate dates
    let dateStr = "Recently";
    if (s.time_of_creation) {
        const d = s.time_of_creation.toDate ? s.time_of_creation.toDate() : new Date(s.time_of_creation);
        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
            '<br>' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    }

    // Active Status Logic
    const isActive = s.active !== false; // Default true if undefined
    const statusText = isActive ? 'Active' : 'Inactive';
    const statusClass = isActive ? 'status-pill' : 'status-pill inactive'; // We might need css for .inactive
    const btnText = isActive ? 'Deactivate' : 'Activate';
    const btnClass = isActive ? 'btn btn-red' : 'btn btn-teal'; // Reuse teal for activate or green

    // Tags
    const tagsHTML = (Array.isArray(s.tags) ? s.tags : [])
        .map(t => {
            const label = typeof t === 'string' ? t : t.name;
            // coloring logic (simple hash or default)
            // Added display:inline-flex, flex-wrap, text-align:center logic
            return `<span class="tag" style="background-color:#1e40af; color:white; display:inline-flex; align-items:center; justify-content:center; text-align:center; min-height:24px; white-space:normal; line-height:1.2; word-break: break-word;">${label}</span>`;
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

    // Attach Listeners
    const toggleBtn = card.querySelector('.toggle-status-btn');
    toggleBtn.addEventListener('click', () => toggleScholarshipStatus(id, isActive));

    return card;
}

async function toggleScholarshipStatus(id, currentStatus) {
    const newStatus = !currentStatus;
    if (!confirm(`Are you sure you want to ${newStatus ? 'ACTIVATE' : 'DEACTIVATE'} this scholarship?`)) return;

    try {
        await db.collection('SCHOLARSHIPS').doc(id).update({ active: newStatus });
        // Reload to reflect changes
        loadManagedScholarships();
    } catch (err) {
        console.error("Error updating status:", err);
        alert("Failed to update status.");
    }
}
