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
      { name: "Hot moms", color: "#38b2ac" }
    ],
    page: "index2.html",
    category: "Verified Scholarships"
  }
];

// Example usage:
console.log("Total scholarships:", scholarships.length);
console.log("\nScholarship details:");

scholarships.forEach((scholarship, index) => {
  console.log(`\n${index + 1}. ${scholarship.name}`);
  console.log(`   Category: ${scholarship.category}`);
  console.log(`   Posted: ${scholarship.date} at ${scholarship.time}`);
  console.log(`   Slots: ${scholarship.slotsAvailable}/${scholarship.totalSlots}`);
  console.log(`   Tags: ${scholarship.tags.map(t => t.name).join(", ")}`);
});

// Helper functions
const getScholarshipById = (id) => {
  return scholarships.find(s => s.id === id);
};

const getScholarshipsByCategory = (category) => {
  return scholarships.filter(s => s.category === category);
};

const getScholarshipsByTag = (tagName) => {
  return scholarships.filter(s => 
    s.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())
  );
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { scholarships, getScholarshipById, getScholarshipsByCategory, getScholarshipsByTag };
}