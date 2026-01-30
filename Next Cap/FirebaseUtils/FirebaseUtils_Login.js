// FirebaseUtils_Login.js
// Fully working Firebase utilities for NextCap registration
// Using Firestore only (no Auth), password encrypted with crypter.js

import { encrypt, decrypt } from "../utils/crypter.js"; // your crypter file

if (typeof window.SECRETS === 'undefined') {
  console.error("SECRETS not loaded! Make sure to include utils/secrets.js in your HTML.");
}

const firebaseConfig = window.SECRETS.FIREBASE_CONFIG;

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
console.log("Firebase initialized");

async function saveUserToFirestore(email, password) {
  try {
    const usersRef = db.collection("USERS");

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

    try {
      docData.password = password ? encrypt(password) : "";
    } catch (e) {
      console.warn('Password encryption failed; storing empty password field.', e);
      docData.password = "";
    }

    await usersRef.add(docData);

    console.log("User saved:", email);
    return { success: true };
  } catch (err) {
    console.error("saveUserToFirestore error:", err);
    return { success: false, message: err.message };
  }
}

async function checkEmailExists(email) {
  try {
    const usersRef = db.collection('USERS');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    return !snapshot.empty;
  } catch (err) {
    console.error('checkEmailExists error:', err);
    return true;
  }
}

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

async function updateAccountInformation(email, accountInfo) {
  try {
    const usersRef = db.collection('USERS');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    if (snapshot.empty) {
      console.warn('updateAccountInformation: no user found for', email);
      return { success: false, message: 'User not found' };
    }

    const doc = snapshot.docs[0];
    await doc.ref.update({ account_information: accountInfo });
    console.log('Account information updated for', email);
    return { success: true };
  } catch (err) {
    console.error('updateAccountInformation error:', err);
    return { success: false, message: err.message };
  }
}

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

async function updateUserPassword(email, newPassword) {
  try {
    const usersRef = db.collection('USERS');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    if (snapshot.empty) {
      return { success: false, message: 'User not found' };
    }

    const doc = snapshot.docs[0];
    const encryptedPassword = encrypt(newPassword);

    await doc.ref.update({ password: encryptedPassword });
    console.log('Password updated for', email);
    return { success: true };
  } catch (err) {
    console.error('updateUserPassword error:', err);
    return { success: false, message: err.message };
  }
}


window.db = db;
window.saveUserToFirestore = saveUserToFirestore;
window.checkEmailExists = checkEmailExists;
window.updateAccountInformation = updateAccountInformation;
window.getUserByEmail = getUserByEmail;
window.setUserType = setUserType;
window.updateUserPassword = updateUserPassword;

export { saveUserToFirestore, checkEmailExists, updateAccountInformation, getUserByEmail, setUserType, updateUserPassword };
