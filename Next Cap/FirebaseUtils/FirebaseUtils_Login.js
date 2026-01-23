// FirebaseUtils_Login.js
// Fully working Firebase utilities for NextCap registration
// Using Firestore only (no Auth), password encrypted with crypter.js

import { encrypt, decrypt } from "../crypter.js"; // your crypter file

// ================================
// FIREBASE INITIALIZATION
// ================================

const firebaseConfig = {
  apiKey: "AIzaSyDVlX0vRgMqDNyzPPeebJxv5AFF-ZBkqbI",
  authDomain: "nextcap-325c5.firebaseapp.com",
  projectId: "nextcap-325c5",
  storageBucket: "nextcap-325c5.firebasestorage.app",
  messagingSenderId: "40961580759",
  appId: "1:40961580759:web:29ca52a731ee5f8408da92",
  measurementId: "G-C3592LXZQC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Firestore reference
console.log("Firebase initialized");

// ================================
// OTP FUNCTIONS
// ================================

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPToEmail(email) {
  try {
    const otp = generateOTP();
    const expiresAt = firebase.firestore.Timestamp.fromDate(
      new Date(Date.now() + 10 * 60 * 1000) // 10 min
    );

    await db.collection("otpCodes").add({
      email,
      code: otp,
      expiresAt,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      used: false
    });

    console.log(`OTP for ${email}: ${otp}`);
    return { success: true, otp };
  } catch (err) {
    console.error("sendOTPToEmail error:", err);
    return { success: false, otp: null };
  }
}

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

    if (data.expiresAt.toDate() < new Date()) return false;

    await doc.ref.update({ used: true });
    return true;
  } catch (err) {
    console.error("verifyOTPCode error:", err);
    return false;
  }
}

// ================================
// USERS COLLECTION FUNCTIONS
// ================================

async function saveUserToFirestore(email, password) {
  try {
    const encryptedPassword = encrypt(password); // encrypt using your crypter

    const usersRef = db.collection("USERS");

    // check if user exists
    const snapshot = await usersRef.where("email", "==", email).get();
    if (!snapshot.empty) {
      console.log("User already exists:", email);
      return { success: false, message: "User already exists" };
    }

    // save new user
    await usersRef.add({
      email,
      password: encryptedPassword,
      applied_scholarships: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log("User saved:", email);
    return { success: true };
  } catch (err) {
    console.error("saveUserToFirestore error:", err);
    return { success: false, message: err.message };
  }
}

// ================================
// EXPORT / GLOBAL
// ================================

window.db = db; // if you need global db
window.generateOTP = generateOTP;
window.sendOTPToEmail = sendOTPToEmail;
window.verifyOTPCode = verifyOTPCode;
window.saveUserToFirestore = saveUserToFirestore;
