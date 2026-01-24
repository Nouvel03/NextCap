// Scholarship data array populated from the HTML cards
const scholarships = [
  {
    id: 1,
    name: "Bulacan Scholars",
    verified: true,
    verifiedBadgeColor: "#f6ad55",
    date: "Jan 24, 2026",
    time: "12:50pm",
    title: "Bulacan Scholars are now looking for scholars",
    description: "Applicants must be residents of Bulacan and currently enrolled in an accredited school. Required documents: valid ID, proof of residency, valid government or school ID, birth certificate, latest academic records, and a certificate of enrollment. Proof of income, certificate of good moral character, proof of income, or certificate of indigency may be required, depending on eligibility.",
    savedBy: 1000,
    slotsAvailable: 98,
    totalSlots: 1000,
    tags: [
      { name: "SHS", color: "#38b2ac" },
      { name: "College", color: "#38b2ac" },
      { name: "Working Student", color: "#38b2ac" }, 
      { name: "Grade Sensitive", color: "#38b2ac" },
      { name: "Not Renewable", color: "#38b2ac" }
    ],
    page: "index1.html",
    category: "Suggested Scholarships"
  },
  {
    id: 2,
    name: "DOST Scholarship",
    verified: true,
    verifiedBadgeColor: "#4299e1",
    date: "Jan 24, 2026",
    time: "12:30pm",
    title: "DOST are now looking for scholars",
    description: "The Department of Science and Technology (DOST) is now accepting applications from qualified students pursuing science and technology-related programs. Interested applicants may review the eligibility requirements and submit their application before the deadline.",
    savedBy: 1000,
    slotsAvailable: 98,
    totalSlots: 1000,
    tags: [
      { name: "SHS", color: "#38b2ac" },
      { name: "College", color: "#38b2ac" },
      { name: "Working students", color: "#38b2ac" },
      { name: "Single Parents", color: "#38b2ac" },
    ],
    page: "index2.html",
    category: "Verified Scholarships"
  },
];

// Helper functions (filtering)
const getScholarshipById = (id) => scholarships.find(s => s.id === id);
const getScholarshipsByCategory = (category) => scholarships.filter(s => s.category === category);
const getScholarshipsByTag = (tagName) => scholarships.filter(s => s.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase()));

// Rendering helpers for the static HTML pages (index1/index2)
function createTagsHTML(tags) {
  return tags.map(t => `<span class="tag" style="background-color:${t.color}">${t.name}</span>`).join('');
}

function createCardHTML(s) {
  return `
    <div class="post-card">
      <div class="post-header">
        <div class="post-avatar"></div>
        <div class="post-info">
          <h4>
            ${s.name}
            <div class="verified-badge" style="background-color:${s.verifiedBadgeColor}"></div>
          </h4>
          <div class="post-date">${s.date}<br>${s.time}</div>
        </div>
        <div class="post-options">⋯</div>
      </div>

      <div class="post-body">
        <div class="post-left">
          <div class="post-image"></div>
          <div class="saved-info"><div class="saved-icon"></div><span>Saved by: ${s.savedBy} applicants</span></div>
          <div class="slots-info">Slots available: ${s.slotsAvailable}/${s.totalSlots}</div>
        </div>

        <div class="post-right">
          <h3>${s.title}</h3>
          <p>${s.description}</p>
          <div class="info-label">Tags</div>
          <div class="tags">${createTagsHTML(s.tags)}</div>
          <button class="apply-btn">Apply</button>
        </div>
      </div>
    </div>
  `;
}

function renderList(containerId, filterFn) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const list = scholarships.filter(filterFn);
  if (!list.length) {
    container.innerHTML = '<div class="post-card"><div class="post-body"><div class="post-right"><p style="color:#718096">No scholarships found.</p></div></div></div>';
    return;
  }
  list.forEach(s => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = createCardHTML(s);
    container.appendChild(wrapper.firstElementChild);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderList('suggested-scholarships', s => s.category === 'Suggested Scholarships' || s.page === 'index1.html');
  renderList('verified-scholarships', s => s.category === 'Verified Scholarships' || s.page === 'index2.html');
});

// Export for Node environments (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { scholarships, getScholarshipById, getScholarshipsByCategory, getScholarshipsByTag };
}