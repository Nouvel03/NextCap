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
    document.getElementById('sectionTitle').textContent = sectionTitles[currentPage];

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

    cards.forEach(card => {
        card.classList.remove('active', 'slide-back');
    });

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

async function submitInformation() {
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


    const interestsContainer = document.getElementById('interests-container');
    const interests = interestsContainer
        ? Array.from(interestsContainer.children).map(c => c.textContent.replace('✕', '').trim())
        : [];

    const nextButtons = document.querySelectorAll('.btn-next');
    nextButtons.forEach(b => b.disabled = true);

    const userEmail = (localStorage.getItem('nextcap_user_email') || '').trim();

    if (!userEmail) {
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



    if (typeof updateUserProfile === 'function') {
        try {
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
        try {
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

document.addEventListener('DOMContentLoaded', function () {
    updateProgress();
    const dob = document.getElementById('birthday');
    if (dob && dob.type === 'date') {
        const today = new Date().toISOString().split('T')[0];
        dob.max = today;
    }
});

function validatePage(pageNum) {
    const card = document.querySelector(`.form-card[data-page="${pageNum}"]`);
    if (!card) return true;

    const inputs = Array.from(card.querySelectorAll('input, textarea, select'))
        .filter(el => el.type !== 'hidden');

    let allValid = true;
    inputs.forEach(input => {
        if (input.id === 'interests-input') return;

        const val = (input.value || '').toString().trim();

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

    if (!allValid) {
        const firstInvalid = card.querySelector('.field-error');
        if (firstInvalid) {
            const el = firstInvalid.parentElement.querySelector('input, textarea, select');
            if (el) el.focus();
        }
    }

    return allValid;
}

document.addEventListener('input', function (e) {
    const target = e.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    const err = target.parentElement && target.parentElement.querySelector('.field-error');
    if (err && target.value.trim() !== '') {
        err.remove();
        target.style.borderColor = '';
    }
});

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