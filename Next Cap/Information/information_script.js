let currentPage = 1;
const totalPages = 3;
let isAnimating = false;

const sectionTitles = {
    1: 'Personal Information',
    2: 'Education Information',
    3: 'Academic Records'
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
        yearLevel: document.getElementById('yearLevel')?.value?.trim() || '',
        gwa: document.getElementById('gwa')?.value?.trim() || '',
        financialStatus: document.getElementById('financialStatus')?.value?.trim() || '',
        estimatedSalary: document.getElementById('estimatedSalary')?.value?.trim() || ''
    };

    // disable next buttons while saving
    const nextButtons = document.querySelectorAll('.btn-next');
    nextButtons.forEach(b => b.disabled = true);

    const userEmail = (localStorage.getItem('nextcap_user_email') || '').trim();

    if (!userEmail) {
        // fallback: save locally
        try {
            localStorage.setItem('nextcap_account_info', JSON.stringify(accountInfo));
            alert('Information saved locally. Please sign in to sync your profile.');
        } catch (e) {
            console.error('Failed to save locally', e);
            alert('Failed to save information.');
        } finally {
            nextButtons.forEach(b => b.disabled = false);
        }
        return;
    }

    if (typeof updateAccountInformation === 'function') {
        try {
            const res = await updateAccountInformation(userEmail, accountInfo);
            if (res && res.success) {
                alert('Profile information saved successfully.');
                // optionally redirect or proceed
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
            alert('Profile saved locally. It will be synced when Firestore is available.');
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
updateProgress();

// Ensure date input cannot select future dates
document.addEventListener('DOMContentLoaded', function() {
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
document.addEventListener('input', function(e) {
    const target = e.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    const err = target.parentElement && target.parentElement.querySelector('.field-error');
    if (err && target.value.trim() !== '') {
        err.remove();
        target.style.borderColor = '';
    }
});

// Expose navigation for inline onclicks
window.nextPage = nextPage;
window.prevPage = prevPage;