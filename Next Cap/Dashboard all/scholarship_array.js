


const firebaseConfig = {
  apiKey: "AIzaSyDVlX0vRgMqDNyzPPeebJxv5AFF-ZBkqbI",
  authDomain: "nextcap-325c5.firebaseapp.com",
  projectId: "nextcap-325c5",
  storageBucket: "nextcap-325c5.firebasestorage.app",
  messagingSenderId: "40961580759",
  appId: "1:40961580759:web:29ca52a731ee5f8408da92",
  measurementId: "G-C3592LXZQC"
};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();


function createTagsHTML(tags) {
  if (!tags || !Array.isArray(tags)) return '';
  return tags.map(t => {
    const name = typeof t === 'string' ? t : t.name;
    const color = (typeof t === 'object' && t.color) ? t.color : "#1e40af";
    return `<span class="tag" style="background-color:${color}; display:inline-block; padding:4px 12px; border-radius:20px; color:white; font-size:12px; font-weight:600; margin-right:5px; margin-bottom:5px;">${name}</span>`;
  }).join('');
}


function createCardHTML(s) {
  let dateStr = "Recently";
  let timeStr = "";
  if (s.time_of_creation) {
    const d = s.time_of_creation.toDate ? s.time_of_creation.toDate() : new Date(s.time_of_creation);
    dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  }

  const imageStyle = s.image_id ? `background-image: url('${s.image_id}'); background-size: cover; background-position: center;` : '';

  return `
      <div class="post-card" data-id="${s.id}" onclick="viewScholarship('${s.id}')" style="cursor:pointer; transition: transform 0.2s;">
        <div class="post-header">
          <div class="post-avatar"></div>
          <div class="post-info">
            <h4>
              ${s.from || s.title} <!-- Display 'From' (School/Grant) here -->
              <div class="verified-badge" style="background-color:${s.verifiedBadgeColor || '#4299e1'}"></div>
            </h4>
            <div class="post-date">${dateStr}<br>${timeStr}</div>
          </div>
          <div class="post-options">⋯</div>
        </div>
  
        <div class="post-body">
          <div class="post-left">
            <div class="post-image" style="${imageStyle}"></div>
            <div class="saved-info"><div class="saved-icon"></div><span>Saved by: ${s.current_participants || 0} applicants</span></div>
          </div>
  
          <div class="post-right">
            <h3>${s.title}</h3> 
            
            <p>${s.description}</p>
            <div class="info-label">Tags</div>
            <div class="tags">${createTagsHTML(s.tags)}</div>
            ${(() => {
      const isApplied = currentUserData && currentUserData.applied_scholarships && currentUserData.applied_scholarships[s.id];
      const reqs = Array.isArray(s.requirements) ? s.requirements : [];
      const reqJson = JSON.stringify(reqs).replace(/"/g, '&quot;');

      if (isApplied) {
        return `<button class="apply-btn" disabled style="background-color:#4299e1; color:white; border:none; cursor:default; width:100%;">Applied ✓</button>`;
      } else {
        return `<button class="apply-btn" onclick="event.stopPropagation(); applyForScholarship('${s.id}', ${reqJson}, this)" style="background-color:#1e40af; color:white; border:none; width:100%;">Apply</button>`;
      }
    })()}
          </div>
        </div>
      </div>
    `;
}

let currentUserData = null;
let currentUserDocId = null;

async function fetchCurrentUserProfile(email) {
  if (!email) return null;
  if (currentUserData) return currentUserData; // Return cached

  try {
    const snapshot = await db.collection('USERS').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;

    currentUserDocId = snapshot.docs[0].id; // Store Doc ID for updates
    currentUserData = snapshot.docs[0].data();
    return currentUserData;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}

async function applyForScholarship(scholarshipId, requirements, triggerBtn) {
  const email = localStorage.getItem('nextcap_user_email');
  if (!email || !currentUserDocId) {
    alert("Please log in to apply.");
    return;
  }

  let btn = triggerBtn;
  if (!btn) {
    btn = document.querySelector('.apply-action-btn');
  }

  if (btn) {
    btn.textContent = "Applying...";
    btn.disabled = true;
  }

  try {
    const reqMap = {};
    const reqList = Array.isArray(requirements) ? requirements : [];
    reqList.forEach(r => {
      const key = typeof r === 'string' ? r.replace(/\./g, '_') : 'req';
      reqMap[key] = false;
    });

    const applicationData = {
      status: 'pending',
      applied_at: new Date(),
      requirements: reqMap,
      scholarship_id: scholarshipId
    };


    await db.collection('USERS').doc(currentUserDocId).update({
      [`applied_scholarships.${scholarshipId}`]: applicationData
    });

    await db.collection('SCHOLARSHIPS').doc(scholarshipId).update({
      current_participants: firebase.firestore.FieldValue.increment(1)
    });

    if (!currentUserData.applied_scholarships) currentUserData.applied_scholarships = {};
    currentUserData.applied_scholarships[scholarshipId] = applicationData;

    alert("Application Submitted Successfully!");

    if (btn) {
      btn.textContent = "Applied ✓";
      btn.style.backgroundColor = "#4299e1";
      btn.style.color = "white";
    }

  } catch (err) {
    console.error("Application failed:", err);
    alert("Failed to apply. Please try again.");
    if (btn) {
      btn.textContent = "Apply Now";
      btn.disabled = false;
    }
  }
}

async function updateApplicationRequirements(scholarshipId) {
  const form = document.getElementById(`req-form-${scholarshipId}`);
  if (!form || !currentUserDocId) return;

  const btn = form.querySelector('button');
  const originalText = btn.textContent;
  btn.textContent = "Saving...";
  btn.disabled = true;

  try {
    const inputs = form.querySelectorAll('input[type="checkbox"]');
    const updatedReqs = {};

    inputs.forEach(input => {
      updatedReqs[input.name] = input.checked;
    });

    await db.collection('USERS').doc(currentUserDocId).update({
      [`applied_scholarships.${scholarshipId}.requirements`]: updatedReqs
    });

    if (currentUserData && currentUserData.applied_scholarships && currentUserData.applied_scholarships[scholarshipId]) {
      currentUserData.applied_scholarships[scholarshipId].requirements = updatedReqs;
    }

    btn.textContent = "Saved ✓";
    btn.style.backgroundColor = "#4299e1";

    inputs.forEach(input => {
      const label = form.querySelector(`label[for="${input.id}"]`);
      if (label) {
        label.style.textDecoration = input.checked ? 'line-through' : 'none';
        label.style.opacity = input.checked ? '0.7' : '1';
      }
    });

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.backgroundColor = "#4299e1";
      btn.disabled = false;
    }, 2000);

  } catch (err) {
    console.error("Failed to update requirements:", err);
    alert("Failed to save progress.");
    btn.textContent = originalText;
    btn.disabled = false;
  }
}


function getUserKeywordsFromCache() {
  if (!currentUserData) return [];

  const keywords = new Set();
  const addIfString = (v) => {
    if (typeof v === 'string' && v.length > 2) keywords.add(v.toLowerCase());
  };

  if (currentUserData.account_information) {
    Object.values(currentUserData.account_information).forEach(val => addIfString(val));
  }
  ['type', 'education', 'status', 'income'].forEach(field => addIfString(currentUserData[field]));

  // Add interests array
  if (currentUserData.interests && Array.isArray(currentUserData.interests)) {
    currentUserData.interests.forEach(interest => {
      // Interests might be multi-word e.g. "Computer Science" -> split them or keep as phrase? 
      // Splitting usually finds better partial matches with tags.
      if (typeof interest === 'string') {
        interest.split(/\s+/).forEach(word => addIfString(word));
      }
    });
  }

  return Array.from(keywords);
}


window.viewScholarship = async function (id) {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  const email = localStorage.getItem('nextcap_user_email');
  if (email && !currentUserData) {
    await fetchCurrentUserProfile(email);
  }

  mainContent.innerHTML = `
        <div class="post-card detail-view">
             <div class="large-placeholder" style="height: 400px; opacity: 0.5;"></div>
             <p style="text-align:center; margin-top:20px; color:#718096">Loading scholarship details...</p>
        </div>
    `;

  try {
    const doc = await db.collection('SCHOLARSHIPS').doc(id).get();
    if (!doc.exists) {
      mainContent.innerHTML = '<div class="post-card"><p>Scholarship not found.</p><button onclick="location.reload()" class="apply-btn" style="width:200px; margin-top:20px;">Back to List</button></div>';
      return;
    }

    const s = { id: doc.id, ...doc.data() };
    s.tags = Array.isArray(s.tags) ? s.tags : [];
    const reqArray = Array.isArray(s.requirements) ? s.requirements : [];

    const isApplied = currentUserData &&
      currentUserData.applied_scholarships &&
      currentUserData.applied_scholarships[s.id];

    let dateStr = "No Deadline";
    if (s.deadline) {
      const d = new Date(s.deadline);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } else {
        dateStr = s.deadline;
      }
    }


    const reqJson = JSON.stringify(reqArray).replace(/"/g, '&quot;');

    const applyBtnState = isApplied
      ? 'disabled style="background-color:#4299e1; color:white; cursor:default; width:100%"'
      : 'style="width:100%; background-color:#1e40af; color:white;"';
    const applyBtnText = isApplied ? 'Applied ✓' : 'Apply Now';
    const applyAction = isApplied ? '' : `onclick="applyForScholarship('${s.id}', ${reqJson})"`;

    const detailHTML = `
            <div class="post-card detail-view" style="background: transparent; box-shadow: none; padding: 0;">
                <div style="margin-bottom: 20px;">
                    <button onclick="location.reload()" style="background:none; border:none; color:#718096; cursor:pointer; display:flex; align-items:center; gap:5px; font-weight:600;">
                        ← Back to List
                    </button>
                </div>

                <!-- 1. Header Section: Image + Title/Meta -->
                <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; gap: 30px; margin-bottom: 25px; align-items: flex-start;">
                    <!-- Image -->
                    <div style="width: 280px; flex-shrink: 0;">
                        <div style="width: 100%; aspect-ratio: 4/3; background-image: url('${s.image_id}'); background-size: cover; background-position: center; border-radius: 8px;"></div>
                    </div>

                    <!-- Title & Meta -->
                    <div style="flex: 1;">
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <h2 style="font-size: 28px; font-weight: 800; color: #1a202c; margin: 0 0 10px 0; line-height: 1.2;">
                                ${s.title}
                            </h2>
                            ${isApplied ? `<span style="background:#edf2f7; color:#4a5568; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:700; text-transform:uppercase;">${currentUserData.applied_scholarships[s.id].status}</span>` : ''}
                        </div>

                        <div style="display:flex; gap: 8px; margin-bottom: 20px; flex-wrap:wrap;">
                             <span style="background-color: #edf2f7; color: #4a5568; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">${dateStr}</span>
                             <span style="background-color: #edf2f7; color: #4a5568; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">${s.current_participants || 0} Applicants</span>
                             <span style="background-color: #ebf8ff; color: #3182ce; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">${s.amount_of_participants || 0} Slots</span>
                        </div>

                        <div class="tags" style="margin-bottom: 0;">${createTagsHTML(s.tags)}</div>
                    </div>
                </div>

                <!-- 2. Content Grid: Description (Left) + Requirements (Right) -->
                <div style="display: grid; grid-template-columns: 1fr 350px; gap: 25px;">
                    
                    <!-- Left: Description -->
                    <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <h3 style="font-size: 18px; font-weight: 700; color: #2d3748; margin-bottom: 20px; border-bottom: 2px solid #edf2f7; padding-bottom: 10px;">About this Scholarship</h3>
                        <div class="description" style="font-size: 15px; line-height: 1.8; color: #4a5568;">
                            ${s.description ? s.description.replace(/\n/g, '<br>') : 'No description provided.'}
                        </div>
                    </div>

                    <!-- Right: Requirements / Actions -->
                    <div>
                         ${reqArray.length > 0 ?
        (isApplied ?
          `<div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-top: 5px solid #4299e1;">
                                    <h3 style="font-size: 16px; font-weight: 700; color: #2d3748; margin-bottom: 15px; display:flex; justify-content:space-between; align-items:center;">
                                        Requirements
                                        <span style="font-size:12px; color:#2b6cb0; background:#ebf8ff; padding:2px 8px; border-radius:4px;">Tracker Active</span>
                                    </h3>
                                    <p style="font-size:13px; color:#718096; margin-bottom:20px;">Mark items as you complete them.</p>
                                    
                                    <form id="req-form-${s.id}">
                                        ${reqArray.map((r, index) => {
            const key = typeof r === 'string' ? r.replace(/\./g, '_') : 'req';
            const isChecked = currentUserData.applied_scholarships[s.id].requirements[key] === true;
            return `
                                            <div style="margin-bottom:12px; display:flex; align-items:start;">
                                                <input type="checkbox" id="req-${index}" name="${key}" ${isChecked ? 'checked' : ''} style="width:16px; height:16px; margin-top:3px; margin-right:10px; cursor:pointer; flex-shrink:0;">
                                                <label for="req-${index}" style="font-size:14px; color:#2d3748; cursor:pointer; line-height:1.4; text-decoration:${isChecked ? 'line-through' : 'none'}; opacity:${isChecked ? 0.6 : 1}">${r}</label>
                                            </div>
                                            `;
          }).join('')}
                                        <button type="button" onclick="updateApplicationRequirements('${s.id}')" style="width:100%; margin-top:20px; padding:10px; background-color:#4299e1; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer; font-size:14px; transition: background 0.2s;">Update Progress</button>
                                    </form>
                                 </div>`
          :
          `<div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-top: 5px solid #4299e1;">
                                    <h3 style="font-size: 16px; font-weight: 700; color: #2d3748; margin-bottom: 15px;">Requirements</h3>
                                    <ul style="margin-bottom:25px; padding-left:20px; color:#4a5568; font-size:14px; line-height:1.6;">
                                        ${reqArray.map(r => `<li>${r}</li>`).join('')}
                                    </ul>
                                    <button class="apply-btn apply-action-btn" ${applyAction} ${applyBtnState}>${applyBtnText}</button>
                                </div>`
        )
        :
        `<div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <h3 style="font-size: 16px; font-weight: 700; color: #2d3748; margin-bottom: 15px;">Actions</h3>
                                <button class="apply-btn apply-action-btn" ${applyAction} ${applyBtnState}>${applyBtnText}</button>
                             </div>`
      }
                    </div>

                </div>
            </div>
        `;

    mainContent.innerHTML = detailHTML;
    window.scrollTo(0, 0);

  } catch (err) {
    console.error("Error viewing scholarship:", err);
    mainContent.innerHTML = '<p>Error loading details.</p>';
  }
};

async function renderFirestoreScholarships() {
  const container = document.getElementById('verified-scholarships');
  if (!container) return;

  container.innerHTML = '<p style="padding:20px; color:#718096">Loading scholarships...</p>';

  try {
    const email = localStorage.getItem('nextcap_user_email');
    if (email) {
      await fetchCurrentUserProfile(email);
    }
    const snapshot = await db.collection('SCHOLARSHIPS').get();

    container.innerHTML = '';

    if (snapshot.empty) {
      container.innerHTML = '<div class="post-card"><div class="post-body"><p style="padding:20px; color:#718096">No scholarships found.</p></div></div>';
      return;
    }

    const docs = [];
    snapshot.forEach(doc => {
      const d = doc.data();
      if (d.active === false) return;
      docs.push(doc);
    });

    docs.sort((a, b) => {
      const d1 = a.data().time_of_creation;
      const d2 = b.data().time_of_creation;
      const t1 = d1 && d1.toMillis ? d1.toMillis() : 0;
      const t2 = d2 && d2.toMillis ? d2.toMillis() : 0;
      return t2 - t1;
    });

    docs.forEach(doc => {
      const data = doc.data();
      const scholarship = {
        id: doc.id,
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : [],
        verifiedBadgeColor: "#4299e1"
      };

      const wrapper = document.createElement('div');
      wrapper.innerHTML = createCardHTML(scholarship);
      container.appendChild(wrapper.firstElementChild);
    });

  } catch (err) {
    console.error("Error fetching scholarships:", err);
    container.innerHTML = '<p style="padding:20px; color:red">Failed to load scholarships.</p>';
  }
}



function expandKeywordsWithSynonyms(keywords) {
  const synonyms = {
    'shs': ['senior high', 'k-12', 'high school'],
    'senior high': ['shs', 'k-12', 'high school'],
    'college': ['undergraduate', 'bachelor', 'university'],
    'undergraduate': ['college', 'bachelor', 'university'],
    'working student': ['working'],
    'working': ['working student']
  };

  const expanded = new Set(keywords);
  keywords.forEach(k => {
    const lower = k.toLowerCase().trim();
    if (synonyms[lower]) {
      synonyms[lower].forEach(syn => expanded.add(syn));
    }
  });
  return Array.from(expanded);
}


async function renderSuggestedScholarships() {

  const container = document.getElementById('suggested-scholarships');
  if (!container) return;

  container.innerHTML = '<p style="padding:20px; color:#718096">Finding matches for you ...</p>';

  const email = localStorage.getItem('nextcap_user_email');
  if (!email) {
    container.innerHTML = '<p style="padding:20px; color:#718096">Please log in to see suggestions.</p>';
    return;
  }

  try {
    await fetchCurrentUserProfile(email);
    let userKeywords = getUserKeywordsFromCache();
    userKeywords = expandKeywordsWithSynonyms(userKeywords);

    console.log("User Keywords (Expanded):", userKeywords);

    if (userKeywords.length === 0) {
      container.innerHTML = '<p style="padding:20px; color:#718096">Complete your profile to get suggestions!</p>';
      return;
    }

    const snapshot = await db.collection('SCHOLARSHIPS').orderBy('time_of_creation', 'desc').get();

    container.innerHTML = '';
    let matchCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.active === false) return;

      const sTags = [
        ...(Array.isArray(data.tags) ? data.tags : []),
        ...(Array.isArray(data.requirements) ? data.requirements : [])
      ].filter(k => typeof k === 'string').map(k => k.toLowerCase().trim());

      const isMatch = sTags.some(tag => userKeywords.includes(tag));

      if (isMatch) {
        matchCount++;
        const scholarship = {
          id: doc.id,
          ...data,
          tags: Array.isArray(data.tags) ? data.tags : [],
          verifiedBadgeColor: "#f6ad55"
        };
        const wrapper = document.createElement('div');
        wrapper.innerHTML = createCardHTML(scholarship);
        container.appendChild(wrapper.firstElementChild);
      }
    });

    if (matchCount === 0) {
      container.innerHTML = '<div class="post-card"><div class="post-body"><p style="padding:20px; color:#718096">No specific updates for you yet based on your profile tags.</p></div></div>';
    }

  } catch (err) {
    console.error("Error loading suggestions:", err);
    container.innerHTML = '<p style="padding:20px; color:red">Failed to load suggestions.</p>';
  }
}


async function renderAppliedScholarships() {
  const container = document.getElementById('applied-scholarships-container');
  if (!container) return;

  const email = localStorage.getItem('nextcap_user_email');
  if (!email) {
    container.innerHTML = '<p>Please log in to view your applications.</p>';
    return;
  }

  try {
    await fetchCurrentUserProfile(email);
    if (!currentUserData || !currentUserData.applied_scholarships) {
      container.innerHTML = '<p>You have not applied to any scholarships yet.</p>';
      document.getElementById('active-applications-count').textContent = '0';
      return;
    }

    const appliedMap = currentUserData.applied_scholarships;
    const appliedIds = Object.keys(appliedMap);

    // Clear "Loading..." text now that we have data
    container.innerHTML = '';

    let displayedCount = 0;

    for (const id of appliedIds) {
      const appData = appliedMap[id];
      try {
        const sDoc = await db.collection('SCHOLARSHIPS').doc(id).get();
        if (!sDoc.exists) continue;

        const s = { id: sDoc.id, ...sDoc.data() };
        if (s.active === false) continue; // Skip inactive scholarships

        displayedCount++;

        s.tags = Array.isArray(s.tags) ? s.tags : [];

        // Custom Card for Applied View
        const statusColor = appData.status === 'approved' ? '#48bb78' :
          appData.status === 'rejected' ? '#f56565' : '#4299e1'; // Pending = Blue

        const reqs = appData.requirements || {};
        const totalReqs = Object.keys(reqs).length;

        const completedReqs = Object.values(reqs).filter(v => v === true).length;
        const progressPercent = totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0;

        const cardHTML = `
        <div class="post-card" onclick="viewScholarship('${s.id}')" style="cursor:pointer; border-radius:12px; border:1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: flex; flex-direction: row; padding: 0; overflow: hidden; height: 200px; transition: all 0.2s ease;">
            
            <!-- Left: Image Container with Padding -->
            <div style="width: 30%; padding: 15px; display: flex; align-items: center; justify-content: center;">
                <div class="post-image" style="width: 100%; height: 100%; border-radius: 8px; background-image: url('${s.image_id}'); background-size: cover; background-position: center; margin: 0;"></div>
            </div>

            <!-- Right: Content -->
            <div style="flex: 1; padding: 25px 25px 25px 0; display: flex; flex-direction: column; justify-content: space-between;">
                
                <!-- Top Section: Header & Status -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div style="font-size: 13px; color: #718096; font-weight: 600; margin-bottom: 4px; text-transform:uppercase; letter-spacing:0.5px;">${s.from || 'Scholarship Provider'}</div>
                        <h3 style="font-size: 20px; font-weight: 700; color: #2d3748; margin-bottom: 5px; line-height: 1.2;">${s.title}</h3>
                        <div class="post-date" style="font-size: 14px; color: #718096; font-weight: 500;">
                            Applied on: ${new Date(appData.applied_at.seconds * 1000).toLocaleDateString()}
                        </div>
                    </div>
                    
                    <span style="font-size: 12px; font-weight: 700; color: white; background-color: ${statusColor}; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; height: fit-content;">
                        ${appData.status}
                    </span>
                </div>

                <!-- Bottom Section: Progress -->
                <div>
                     <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 8px;">
                        <span style="font-size: 14px; color: #4a5568; font-weight: 600;">Requirements Progress</span>
                        <span style="font-size: 16px; color: #2d3748; font-weight: 700;">${progressPercent}%</span>
                    </div>
                    <div class="progress-bar" style="width: 100%; height: 10px; background-color: #edf2f7; border-radius: 5px; overflow: hidden;">
                        <div class="progress-fill" style="width: ${progressPercent}%; background-color: #4299e1; height: 100%; border-radius: 5px;"></div>
                    </div>
                    <div style="font-size: 13px; color: #a0aec0; margin-top: 8px; font-weight: 500;">
                        ${completedReqs} of ${totalReqs} requirements approved
                    </div>
                </div>
            </div>
        </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = cardHTML;
        container.appendChild(wrapper.firstElementChild);

      } catch (err) {
        console.error("Error loading applied scholarship:", id, err);
      }
    }

    const countSpan = document.getElementById('active-applications-count');
    if (countSpan) countSpan.textContent = displayedCount;

  } catch (err) {
    console.error("Error rendering dashboard:", err);
    container.innerHTML = '<p style="color:red">Failed to load dashboard.</p>';
  }
}


document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('verified-scholarships')) {
    renderFirestoreScholarships();
  }
  if (document.getElementById('suggested-scholarships')) {
    renderSuggestedScholarships();
  }
  if (document.getElementById('applied-scholarships-container')) {
    renderAppliedScholarships();
  }
  updateWelcomeMessage();
});

async function updateWelcomeMessage() {
  const welcomeSpan = document.getElementById('welcome-message');
  if (!welcomeSpan) return;

  const email = localStorage.getItem('nextcap_user_email');
  if (!email) {
    welcomeSpan.textContent = "Welcome, Guest";
    return;
  }

  const data = await fetchCurrentUserProfile(email);
  const firstName = (data && data.account_information && data.account_information.firstName)
    || (data && data.firstName)
    || "Scholar";

  const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  welcomeSpan.textContent = `Welcome, ${name}`;
}