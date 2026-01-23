// FirebaseUtils.js
// Firebase configuration and utilities for NextCap
// Using Firebase v10 COMPAT (works with Live Server)

// ================================
// FIREBASE INITIALIZATION
// ================================

firebase.initializeApp({
  apiKey: "AIzaSyDVlX0vRgMqDNyzPPeebJxv5AFF-ZBkqbI",
  authDomain: "nextcap-325c5.firebaseapp.com",
  projectId: "nextcap-325c5",
  storageBucket: "nextcap-325c5.firebasestorage.app",
  messagingSenderId: "40961580759",
  appId: "1:40961580759:web:29ca52a731ee5f8408da92",
  measurementId: "G-C3592LXZQC"
});

const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase initialized (COMPAT)");

// ================================
// OTP FUNCTIONS
// ================================

/**
 * Generate a random 6-digit OTP
 * @returns {string}
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to any email (no user check, always sends)
 * @param {string} email
 * @returns {Promise<{ success: boolean, otp: string }>}
 */
async function sendOTPToEmail(email) {
  try {
    const otp = generateOTP();

    const expiresAt = firebase.firestore.Timestamp.fromDate(
      new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    );

    await db.collection("otpCodes").add({
      email: email,
      code: otp,
      expiresAt: expiresAt,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      used: false
    });

    // TEMP: log OTP for testing
    console.log(`OTP for ${email}: ${otp}`);

    return { success: true, otp };
  } catch (error) {
    console.error("sendOTPToEmail error:", error);
    return { success: false, otp: null };
  }
}

/**
 * Verify OTP code
 * @param {string} email
 * @param {string} otpCode
 * @returns {Promise<boolean>}
 */
async function verifyOTPCode(email, otpCode) {
  try {
    const snapshot = await db
      .collection("otpCodes")
      .where("email", "==", email)
      .where("code", "==", otpCode)
      .where("used", "==", false)
      .get();

    if (snapshot.empty) return false;

    const doc = snapshot.docs[0];
    const data = doc.data();

    if (data.expiresAt.toDate() < new Date()) {
      return false;
    }

    await doc.ref.update({ used: true });
    return true;
  } catch (error) {
    console.error("verifyOTPCode error:", error);
    return false;
  }
}

// ================================
// USER CREATION
// ================================

/**
 * Create Firebase Auth user and Firestore profile
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 */
async function createUserAccount(email, password, displayName) {
  try {
    const userCredential =
      await auth.createUserWithEmailAndPassword(email, password);

    await userCredential.user.updateProfile({
      displayName: displayName
    });

    await db.collection("users").doc(userCredential.user.uid).set({
      email: email,
      displayName: displayName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return userCredential.user;
  } catch (error) {
    console.error("createUserAccount error:", error);
    throw error;
  }
}

// ================================
// EXPOSE FUNCTIONS GLOBALLY
// ================================

window.generateOTP = generateOTP;
window.sendOTPToEmail = sendOTPToEmail;
window.verifyOTPCode = verifyOTPCode;
window.createUserAccount = createUserAccount;
