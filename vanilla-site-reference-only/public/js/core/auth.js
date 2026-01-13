import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-functions.js";

// Re-export initializeFirebase from firebase-init module for backwards compatibility
export { initializeFirebase, auth, db, functions, rtdb, waitForAuth } from './firebase-init.js';

export function handleAuthStateChange(auth, db) {
  onAuthStateChanged(auth, async (user) => {
    const loginStatus = document.getElementById('loginStatus');
    if (loginStatus) {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            loginStatus.innerHTML = `<a href="/pages/my-account.html" class="login-status-text">My Account</a>`;
            console.log('User is signed in:', user);
          } else {
            loginStatus.innerHTML = '<a href="/pages/login.html" class="login-status-text">Login</a>';
            console.log('No user document found');
          }
        } catch (error) {
          loginStatus.innerHTML = '<a href="/pages/login.html" class="login-status-text">Login</a>';
          console.error('Error fetching user document:', error);
        }
      } else {
        loginStatus.innerHTML = '<a href="/pages/login.html" class="login-status-text">Login</a>';
        console.log('No user is signed in');
      }
    }
  });
}

export async function registerUser(auth, db, username, email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, 'users', user.uid), { username });
    await setDoc(doc(db, 'usernames', username), { uid: user.uid });
    return { message: 'User registered successfully' };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

export async function updateUserPassword(auth, oldPassword, newPassword) {
  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    alert('Password updated successfully');
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

export async function updateUserEmail(functions, newEmail) {
  try {
    const updateEmail = httpsCallable(functions, 'updateUserEmail');
    const result = await updateEmail({ newEmail });
    alert(result.data.message);
    // Optionally, you can use the emailVerificationLink to send a custom email verification
    console.log('Email verification link:', result.data.emailVerificationLink);
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
}
