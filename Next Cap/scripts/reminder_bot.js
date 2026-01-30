const admin = require('firebase-admin');
const axios = require('axios');
const fs = require('fs');
const path = require('path');


const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'nextcap-325c5-firebase-adminsdk-fbsvc-5d41b98725.json');

const SECRETS = require('../utils/secrets.js');

// 2. EmailJS Config (Loaded from secrets.js)
const EMAILJS_SERVICE_ID = SECRETS.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = SECRETS.EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = SECRETS.EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = SECRETS.EMAILJS_PRIVATE_KEY;

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m"
};

async function main() {
    console.log(`${colors.cyan}--- NextCap Reminder Bot Started ---${colors.reset}`);

    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error(`${colors.red}[ERROR] Service Account Key not found at ${SERVICE_ACCOUNT_PATH}${colors.reset}`);
        console.log("Please download it from Firebase Console -> Project Settings -> Service Accounts.");
        process.exit(1);
    }

    const serviceAccount = require(SERVICE_ACCOUNT_PATH);

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    const db = admin.firestore();

    try {
        console.log("Checking active scholarships...");
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        const scholarshipsSnap = await db.collection('SCHOLARSHIPS')
            .where('active', '==', true)
            .get();

        const expiringScholarships = {}; // ID -> Title

        scholarshipsSnap.forEach(doc => {
            const data = doc.data();
            if (!data.deadline) return;

            const deadlineDate = new Date(data.deadline);
            if (deadlineDate > now && deadlineDate <= threeDaysFromNow) {
                expiringScholarships[doc.id] = {
                    title: data.title,
                    deadline: deadlineDate.toDateString()
                };
                console.log(`${colors.yellow}Found expiring: ${data.title} (Due: ${data.deadline})${colors.reset}`);
            }
        });

        const expiringIds = Object.keys(expiringScholarships);
        if (expiringIds.length === 0) {
            console.log("No scholarships are due within 3 days.");
            process.exit(0);
        }

        const usersSnap = await db.collection('USERS').get();
        console.log(`Checking users' progress... (Total users found: ${usersSnap.size})`);
        let emailsSent = 0;

        for (const doc of usersSnap.docs) {
            const userData = doc.data();
            const email = userData.email;
            const applications = userData.applied_scholarships || {};


            for (const [sId, appData] of Object.entries(applications)) {

                if (expiringScholarships[sId]) {
                    console.log(`  > Match found for user ${email} on "${expiringScholarships[sId].title}"`);
                    console.log(`    Status: ${appData.status}`);

                    const isIncomplete = appData.status !== 'Completed' && appData.status !== 'Rejected' && appData.status !== 'Approved';

                    if (isIncomplete) {
                        console.log(`    -> IS INCOMPLETE. Sending email...`);

                        await sendEmailReminder(email, userData.firstName || 'Student', expiringScholarships[sId]);
                        emailsSent++;
                    } else {
                        console.log(`    -> Skipped (Status is considered complete/final)`);
                    }
                }
            }
        }

        console.log(`${colors.green}Done. Sent ${emailsSent} reminders.${colors.reset}`);

    } catch (error) {
        console.error(`${colors.red}Fatal Error:${colors.reset}`, error);
    }
}

async function sendEmailReminder(userEmail, userName, scholarshipInfo) {
    const data = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
            to_email: userEmail,
            email: userEmail,
            to_name: userName,
            scholarship_name: scholarshipInfo.title,
            date_time_due: scholarshipInfo.deadline
        }
    };

    try {
        await axios.post('https://api.emailjs.com/api/v1.0/email/send', data);
        console.log(`${colors.green}  ✓ Email sent to ${userEmail}${colors.reset}`);
    } catch (err) {
        console.error(`${colors.red}  X Failed to send email to ${userEmail}:${colors.reset}`, err.response ? err.response.data : err.message);
    }
}

main();
