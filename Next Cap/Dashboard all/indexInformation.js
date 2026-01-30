// indexInformation.js - Logic for viewing and updating user information

// Firebase Config
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


const fieldsMap = {
    // Personal
    'firstName': 'account_information.firstName',
    'middleName': 'account_information.middleName',
    'lastName': 'account_information.lastName',
    'birthday': 'account_information.birthday',
    'gender': 'account_information.gender',
    'nationality': 'account_information.nationality',
    'address': 'account_information.address',
    'contact': 'account_information.contact',

    'school': 'account_information.school',
    'schoolAddress': 'account_information.schoolAddress',
    'educationLevel': 'account_information.educationLevel',
    'yearLevel': 'account_information.yearLevel',
    'course': 'account_information.course',

    'gwa': 'account_information.gwa',
    'financialStatus': 'account_information.financialStatus',
    'estimatedSalary': 'account_information.estimatedSalary'
};

document.addEventListener('DOMContentLoaded', async () => {
    const email = localStorage.getItem('nextcap_user_email');
    if (!email) {
        alert("Please log in to view your information.");
        // window.location.href = '../Login page/index.html'; // Optional redirect
        return;
    }

    try {
        const snapshot = await db.collection('USERS').where('email', '==', email).limit(1).get();
        if (snapshot.empty) {
            console.error("User not found.");
            return;
        }

        const doc = snapshot.docs[0];
        const userData = doc.data();
        const userId = doc.id;

        console.log("User Data Loaded:", userData);

        const welcomeSpan = document.getElementById('welcome-message');
        if (welcomeSpan) {
            const fName = (userData.account_information && userData.account_information.firstName) || userData.firstName || "Scholar";
            welcomeSpan.textContent = `Welcome, ${fName.charAt(0).toUpperCase() + fName.slice(1)}`;
        }

        for (const [inputId, firestorePath] of Object.entries(fieldsMap)) {
            const input = document.getElementById(inputId);
            if (!input) continue;

            const parts = firestorePath.split('.');
            let value = userData;
            for (const part of parts) {
                if (value && value[part] !== undefined) {
                    value = value[part];
                } else {
                    value = ""; // Not found
                    break;
                }
            }

            if (inputId === 'birthday' && value && typeof value === 'object' && value.seconds) {
                // If it's a Firestore timestamp
                const date = new Date(value.seconds * 1000);
                value = date.toISOString().split('T')[0];
            }

            input.value = value;
            input.value = value;
        }

        const interestsContainer = document.getElementById('interests-container');
        if (interestsContainer) {

            let interests = (userData.account_information && userData.account_information.interests) || userData.interests || [];
            if (Array.isArray(interests)) {
                interests.forEach(i => addInterestPill(i, interestsContainer));
            }
        }

        const updateBtn = document.getElementById('update-btn');
        updateBtn.addEventListener('click', () => updateInformation(userId));

        const interestInput = document.getElementById('interests-input');
        if (interestInput && interestsContainer) {
            interestInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (interestInput.value.trim()) {
                        addInterestPill(interestInput.value.trim(), interestsContainer);
                        interestInput.value = '';
                    }
                }
            });
        }

    } catch (err) {
        console.error("Error loading user info:", err);
    }
});

function addInterestPill(text, container) {
    const exists = Array.from(container.children).some(c => c.textContent.replace('✕', '').trim().toLowerCase() === text.toLowerCase());
    if (exists) return;

    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.textContent = text;
    pill.onclick = function () { this.remove(); };
    container.appendChild(pill);
}

async function updateInformation(userId) {
    const updateBtn = document.getElementById('update-btn');
    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating...';

    try {
        const updates = {};

        for (const [inputId, firestorePath] of Object.entries(fieldsMap)) {
            const input = document.getElementById(inputId);
            if (!input) continue;

            let value = input.value;
            if (inputId === 'birthday' && value) {

            }

            updates[firestorePath] = value;
        }

        const interestsContainer = document.getElementById('interests-container');
        const interests = interestsContainer
            ? Array.from(interestsContainer.children).map(c => c.textContent.replace('✕', '').trim())
            : [];

        updates['account_information.interests'] = interests;
        console.log("Saving updates:", updates);

        await db.collection('USERS').doc(userId).update(updates);

        updateBtn.textContent = 'Updated Successfully ✓';
        updateBtn.style.backgroundColor = '#48bb78'; // Green success

        setTimeout(() => {
            updateBtn.textContent = 'Update Information';
            updateBtn.disabled = false;
            updateBtn.style.backgroundColor = '#1e40af'; // Back to blue
        }, 2000);

    } catch (err) {
        console.error("Update failed:", err);
        alert("Failed to update information.");
        updateBtn.textContent = 'Update Information';
        updateBtn.disabled = false;
    }
}
