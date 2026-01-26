
// Firebase_CRUD.js
// Handles Firestore operations for Scholarships

// Get Firestore instance (assumes firebase is globally available from compat scripts)
const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

/**
 * Creates a new scholarship entry in the SCHOLARSHIPS collection.
 * @param {Object} data - The scholarship data matching the template.
 * @returns {Promise<string>} - The ID of the created document.
 */
export async function createScholarship(data) {
    if (!db) {
        throw new Error("Firebase Firestore is not initialized.");
    }

    try {
        const scholarshipsRef = db.collection("SCHOLARSHIPS");

        // Ensure all required fields are present (as per template)
        const payload = {
            created_by: data.created_by || "unknown",
            time_of_creation: firebase.firestore.FieldValue.serverTimestamp(),
            deadline: data.deadline,
            image_id: data.image_id,
            title: data.title,
            from: data.from || "", // School/Grant
            description: data.description,
            amount_of_participants: Number(data.amount_of_participants) || 0,
            current_participants: 0,
            // Optional extras if valuable
            tags: data.tags || [],
            requirements: data.requirements || [],
            search_keywords: generateSearchKeywords(data.title)
        };

        const docRef = await scholarshipsRef.add(payload);
        console.log("Scholarship created with ID:", docRef.id);
        return docRef.id;

    } catch (error) {
        console.error("Error creating scholarship:", error);
        throw error;
    }
}

/**
 * Helper to generate simple search keywords from title
 */
function generateSearchKeywords(title) {
    if (!title) return [];
    return title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
}
