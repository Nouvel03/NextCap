// FirebaseUtils_Login.js
// Fully working Firebase utilities for NextCap registration
// Using Firestore only (no Auth), password encrypted with crypter.js

import { encrypt, decrypt } from "../utils/crypter.js"; // your crypter file

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
      applied_scholarships: {},
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      account_information:{},
    });

    console.log("User saved:", email);
    return { success: true };
  } catch (err) {
    console.error("saveUserToFirestore error:", err);
    return { success: false, message: err.message };
  }
}

// Check if an email already exists in USERS collection
async function checkEmailExists(email) {
  try {
    const usersRef = db.collection('USERS');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    return !snapshot.empty;
  } catch (err) {
    console.error('checkEmailExists error:', err);
    // In doubt, return true to avoid accidentally allowing duplicate accounts
    return true;
  }
}

// Update the account_information map for a user identified by email
async function updateAccountInformation(email, accountInfo) {
  try {
    const usersRef = db.collection('USERS');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    if (snapshot.empty) {
      console.warn('updateAccountInformation: no user found for', email);
      return { success: false, message: 'User not found' };
    }

    // update the first matching document
    const doc = snapshot.docs[0];
    await doc.ref.update({ account_information: accountInfo });
    console.log('Account information updated for', email);
    return { success: true };
  } catch (err) {
    console.error('updateAccountInformation error:', err);
    return { success: false, message: err.message };
  }
}

// ================================
// EXPORT / GLOBAL
// ================================

window.db = db; // if you need global db
window.saveUserToFirestore = saveUserToFirestore;
window.checkEmailExists = checkEmailExists;
window.updateAccountInformation = updateAccountInformation;
