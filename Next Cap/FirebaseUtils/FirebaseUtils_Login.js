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
    const usersRef = db.collection("USERS");

    // check if user exists
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();
    if (!snapshot.empty) {
      console.log("User already exists:", email);
      return { success: false, message: "User already exists" };
    }

    const docData = {
      email,
      applied_scholarships: {},
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      account_information: {},
      type: "user"
    };

    // only include password when provided (email/password signup)
    // Always include a password field. If provided, encrypt it; otherwise set to empty string.
    try {
      docData.password = password ? encrypt(password) : "";
    } catch (e) {
      console.warn('Password encryption failed; storing empty password field.', e);
      docData.password = "";
    }

    // save new user
    await usersRef.add(docData);

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

// Retrieve the first user document matching the email (returns data and id)
async function getUserByEmail(email) {
  try {
    const usersRef = db.collection('USERS');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, data: doc.data() };
  } catch (err) {
    console.error('getUserByEmail error:', err);
    return null;
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

// Set or update the `type` field for a user identified by email.
// If the user doesn't exist, create a minimal user document with the given type.
async function setUserType(email, type) {
  try {
    const usersRef = db.collection('USERS');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({ type });
      console.log('User type updated for', email, type);
      return { success: true };
    } else {
      const docData = {
        email,
        type,
        applied_scholarships: {},
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        account_information: {},
        password: ""
      };
      await usersRef.add(docData);
      console.log('User created with type for', email, type);
      return { success: true, created: true };
    }
  } catch (err) {
    console.error('setUserType error:', err);
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
window.getUserByEmail = getUserByEmail;
window.setUserType = setUserType;

// Named export so other modules can import the helper directly
export { saveUserToFirestore, checkEmailExists, updateAccountInformation, getUserByEmail, setUserType };
