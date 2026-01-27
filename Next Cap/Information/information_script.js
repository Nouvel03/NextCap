let currentPage = 1;
const totalPages = 4;
let isAnimating = false;

const sectionTitles = {
    1: 'Personal Information',
    2: 'Education Information',
    3: 'Academic Records',
    4: 'Interests & Skills'
};

function updateProgress() {
    // Update section title
    document.getElementById('sectionTitle').textContent = sectionTitles[currentPage];

    // Update steps
    const steps = document.querySelectorAll('.step');
    const lines = document.querySelectorAll('.progress-line');

    steps.forEach((step, index) => {
        const stepNum = index + 1;
        if (stepNum < currentPage) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNum === currentPage) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });

    lines.forEach((line, index) => {
        if (index < currentPage - 1) {
            line.classList.add('completed');
        } else {
            line.classList.remove('completed');
        }
    });
}

function showPage(pageNum, direction = 'forward') {
    if (isAnimating) return;
    isAnimating = true;

    const cards = document.querySelectorAll('.form-card');

    // Remove active from all cards
    cards.forEach(card => {
        card.classList.remove('active', 'slide-back');
    });

    // Add appropriate animation class and show new page
    setTimeout(() => {
        const targetCard = document.querySelector(`.form-card[data-page="${pageNum}"]`);
        if (direction === 'back') {
            targetCard.classList.add('slide-back');
        }
        targetCard.classList.add('active');

        setTimeout(() => {
            isAnimating = false;
        }, 300);
    }, 50);

    updateProgress();
}

function nextPage() {
    if (isAnimating) return;

    // validate current page before moving forward
    const valid = validatePage(currentPage);
    if (!valid) return;

    if (currentPage < totalPages) {
        currentPage++;
        showPage(currentPage, 'forward');
    } else if (currentPage === totalPages) {
        // final page - submit information
        submitInformation();
    }
}

// Gather all form values and update the user's account_information in Firestore
async function submitInformation() {
    // collect fields
    const accountInfo = {
        firstName: document.getElementById('firstName')?.value?.trim() || '',
        middleName: document.getElementById('middleName')?.value?.trim() || '',
        lastName: document.getElementById('lastName')?.value?.trim() || '',
        birthday: document.getElementById('birthday')?.value?.trim() || '',
        gender: document.getElementById('gender')?.value?.trim() || '',
        nationality: document.getElementById('nationality')?.value?.trim() || '',
        address: document.getElementById('address')?.value?.trim() || '',
        contact: document.getElementById('contact')?.value?.trim() || '',
        school: document.getElementById('school')?.value?.trim() || '',
        schoolAddress: document.getElementById('schoolAddress')?.value?.trim() || '',
        educationLevel: document.getElementById('educationLevel')?.value?.trim() || '',
        course: document.getElementById('course')?.value?.trim() || '',
        gwa: document.getElementById('gwa')?.value?.trim() || '',
        financialStatus: document.getElementById('financialStatus')?.value?.trim() || '',
        estimatedSalary: document.getElementById('estimatedSalary')?.value?.trim() || ''
    };

    // Collect interests array
    const interestsContainer = document.getElementById('interests-container');
    const interests = interestsContainer
        ? Array.from(interestsContainer.children).map(c => c.textContent.replace('✕', '').trim())
        : [];

    // We want to save interests at the root level (according to request), 
    // but the helper `updateAccountInformation` saves to `account_information` map.
    // We will need to update the helper or do it manually. 
    // For now, let's assume we update the helper to accept 'rootUpdates' or similar.
    // Or we pass it in accountInfo and handle it there? 
    // Let's pass it separately to a new/modified function.
    // Logic below updated to use a new generic update if available or pass extra param.

    // disable next buttons while saving
    const nextButtons = document.querySelectorAll('.btn-next');
    nextButtons.forEach(b => b.disabled = true);

    const userEmail = (localStorage.getItem('nextcap_user_email') || '').trim();

    if (!userEmail) {
        // fallback: save locally
        try {
            localStorage.setItem('nextcap_account_info', JSON.stringify(accountInfo));
        } catch (e) {
            console.error('Failed to save locally', e);
            alert('Failed to save information.');
        } finally {
            nextButtons.forEach(b => b.disabled = false);
        }
        return;
    }

    // Check if we have the generic update function (we will add this to FirebaseUtils)
    // If not, we fall back to updateAccountInformation but we might miss 'interests' at root.
    // Ideally we update FirebaseUtils_Login.js to have `updateUserDoc(email, data)`.
    // Let's assume we will rename/upgrade `updateAccountInformation` to `updateUserProfile`.

    if (typeof updateUserProfile === 'function') {
        try {
            // We want 'interests' at root, and others in 'account_information'.
            // Construct the payload expected by the new helper
            const payload = {
                account_information: accountInfo,
                interests: interests
            };

            const res = await updateUserProfile(userEmail, payload);
            if (res && res.success) {
                try { localStorage.setItem('nextcap_user_email', userEmail); } catch (e) { /* ignore */ }
                window.location.href = encodeURI('../Dashboard all/index1.html');
            } else {
                console.error('updateUserProfile failed', res && res.message);
                alert('Failed to save profile. Please try again later.');
            }
        } catch (err) {
            console.error('submitInformation error', err);
            alert('An error occurred while saving your profile.');
        } finally {
            nextButtons.forEach(b => b.disabled = false);
        }
    } else if (typeof updateAccountInformation === 'function') {
        // Fallback for old helper (won't save interests at root correctly unless helper modified)
        try {
            // Try passing interests inside accountInfo as fallback
            accountInfo.interests = interests;
            const res = await updateAccountInformation(userEmail, accountInfo);
            if (res && res.success) {
                try { localStorage.setItem('nextcap_user_email', userEmail); } catch (e) { /* ignore */ }
                window.location.href = encodeURI('../Dashboard all/index1.html');
            } else {
                console.error('updateAccountInformation failed', res && res.message);
                alert('Failed to save profile. Please try again later.');
            }
        } catch (err) {
            console.error('submitInformation error', err);
            alert('An error occurred while saving your profile.');
        } finally {
            nextButtons.forEach(b => b.disabled = false);
        }
    } else {
        // If the firebase helper isn't available, store locally and warn user
        try {
            localStorage.setItem('nextcap_account_info', JSON.stringify(accountInfo));
        } catch (e) {
            console.error('Failed to save locally', e);
            alert('Failed to save information.');
        } finally {
            nextButtons.forEach(b => b.disabled = false);
        }
    }
}

function prevPage() {
    if (currentPage > 1 && !isAnimating) {
        currentPage--;
        showPage(currentPage, 'back');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    updateProgress();

    // Ensure date input cannot select future dates
    const dob = document.getElementById('birthday');
    if (dob && dob.type === 'date') {
        const today = new Date().toISOString().split('T')[0];
        dob.max = today;
    }
});

// Validate all inputs in the given page. Returns true if all filled.
function validatePage(pageNum) {
    const card = document.querySelector(`.form-card[data-page="${pageNum}"]`);
    if (!card) return true;

    const inputs = Array.from(card.querySelectorAll('input, textarea, select'))
        .filter(el => el.type !== 'hidden');

    let allValid = true;
    inputs.forEach(input => {
        // Skip validation for interests input as it is used to add tags
        if (input.id === 'interests-input') return;

        const val = (input.value || '').toString().trim();

        // clear previous error
        const existingErr = input.parentElement.querySelector('.field-error');
        if (existingErr) existingErr.remove();
        input.style.borderColor = '';

        if (val === '') {
            allValid = false;
            input.style.borderColor = '#e74c3c';
            const err = document.createElement('div');
            err.className = 'field-error';
            err.textContent = 'Required';
            err.style.color = '#e74c3c';
            err.style.fontSize = '12px';
            err.style.marginTop = '6px';
            input.parentElement.appendChild(err);
        }
    });

    // focus first invalid
    if (!allValid) {
        const firstInvalid = card.querySelector('.field-error');
        if (firstInvalid) {
            const el = firstInvalid.parentElement.querySelector('input, textarea, select');
            if (el) el.focus();
        }
    }

    return allValid;
}

// Clear field error on input
document.addEventListener('input', function (e) {
    const target = e.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    const err = target.parentElement && target.parentElement.querySelector('.field-error');
    if (err && target.value.trim() !== '') {
        err.remove();
        target.style.borderColor = '';
    }
});

// Expose navigation for inline onclicks
// Setup Interests Logic
// Setup Interests Logic (Event Delegation)
document.addEventListener('keydown', (e) => {
    if (e.target && e.target.id === 'interests-input' && e.key === 'Enter') {
        e.preventDefault();
        const input = e.target;
        const container = document.getElementById('interests-container');
        const val = input.value.trim();

        if (val && val.length > 0 && container) {
            addInterestPill(val, container);
            input.value = '';
        }
    }
});

function addInterestPill(text, container) {
    // Check duplicates
    const exists = Array.from(container.children).some(c => c.textContent.replace('✕', '').trim().toLowerCase() === text.toLowerCase());
    if (exists) return;

    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.textContent = text; // text content + pseudo element for x
    pill.onclick = function () { this.remove(); };
    container.appendChild(pill);
}

window.nextPage = nextPage;
window.prevPage = prevPage;