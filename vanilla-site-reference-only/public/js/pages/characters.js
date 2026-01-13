// REPLACED: Full file rewritten to mirror retrieval pattern used in library.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app-check.js";
import { AUTH_DOMAIN, RECAPTCHA_SITE_KEY } from '../core/environment.js';

const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="100%" height="100%" fill="%23053357"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="44" fill="white" font-family="Arial">?</text></svg>';

async function loadHeaderFooter() {
  const header = document.getElementById('header');
  const footer = document.getElementById('footer');
  if (header) header.innerHTML = await fetch('/partials/header.html').then(r => r.text()).catch(()=>'')
  if (footer) footer.innerHTML = await fetch('/partials/footer.html').then(r => r.text()).catch(()=>'')
}

function createAddSlot(grid) {
  const div = document.createElement('div');
  div.className = 'character-card add-new';
  div.innerHTML = `
    <div class="portrait placeholder"><span class="plus">+</span></div>
    <p class="name add-text">Add Character</p>
  `;
  div.addEventListener('click', () => {
    window.location.href = '/pages/character-creator.html';
  });
  grid.appendChild(div);
}

function createCharacterCard(docSnap) {
  const data = docSnap.data();
  const card = document.createElement('div');
  card.className = 'character-card';
  const portrait = data.portrait || FALLBACK_AVATAR;
  const name = (data.name || 'Unnamed').toUpperCase();
  card.innerHTML = `
    <div class="portrait">
      <img src="${portrait}" alt="${name}" onerror="this.src='${FALLBACK_AVATAR}'">
      <button class="delete-character-btn" title="Delete Character">×</button>
    </div>
    <p class="name">${name}</p>
  `;
  
  // Add click handler for the main card (excluding delete button)
  card.addEventListener('click', (e) => {
    // Don't navigate if clicking the delete button
    if (e.target.classList.contains('delete-character-btn')) {
      return;
    }
    window.location.href = `/pages/character-sheet.html?id=${docSnap.id}`;
  });
  
  // Add click handler for delete button
  const deleteBtn = card.querySelector('.delete-character-btn');
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation(); // Prevent card click event
    await deleteCharacter(docSnap.id, name, card);
  });
  
  return card;
}

// Function to delete a character with confirmation
async function deleteCharacter(charId, charName, cardElement) {
  const confirmMessage = `Are you sure you want to delete the character "${charName}"?\n\nThis action cannot be undone.`;
  
  if (!confirm(confirmMessage)) {
    return; // User cancelled
  }
  
  try {
    // Get current user to ensure proper path
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert('You must be logged in to delete characters.');
      return;
    }
    
    // Delete the character document from Firestore
    const db = getFirestore();
    await deleteDoc(doc(db, 'users', user.uid, 'character', charId));
    
    // Remove the card from the DOM with a nice animation
    cardElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      cardElement.remove();
      
      // Check if grid is now empty (only has add slot)
      const grid = document.getElementById('character-grid');
      const characterCards = grid.querySelectorAll('.character-card:not(.add-new)');
      
      if (characterCards.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.padding = '16px';
        emptyMsg.style.opacity = '.75';
        emptyMsg.textContent = 'You have no saved characters yet.';
        // Insert before the add slot
        const addSlot = grid.querySelector('.add-new');
        grid.insertBefore(emptyMsg, addSlot);
      }
    }, 300);
    
    console.log(`Character "${charName}" (${charId}) deleted successfully.`);
    
  } catch (error) {
    console.error('Error deleting character:', error);
    
    let errorMessage = 'Failed to delete character. Please try again.';
    if (error.code === 'permission-denied') {
      errorMessage = 'Permission denied. You can only delete your own characters.';
    } else if (error.code === 'not-found') {
      errorMessage = 'Character not found. It may have already been deleted.';
      // Still remove from DOM since it's gone from the database
      cardElement.remove();
    }
    
    alert(errorMessage);
  }
}

async function loadCharacters(db, uid) {
  const grid = document.getElementById('character-grid');
  if (!grid) return;
  grid.innerHTML = '';

  try {
    const snap = await getDocs(collection(db, 'users', uid, 'character'));
    if (snap.empty) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.padding = '16px';
      emptyMsg.style.opacity = '.75';
      emptyMsg.textContent = 'You have no saved characters yet.';
      grid.appendChild(emptyMsg);
      createAddSlot(grid);
      return;
    }
    snap.forEach(docSnap => {
      grid.appendChild(createCharacterCard(docSnap));
    });
    createAddSlot(grid);
  } catch (e) {
    console.error('Error loading characters:', e);
    const msg = document.createElement('div');
    msg.style.padding = '16px';
    msg.style.color = '#dc3545';
    msg.style.fontWeight = 'bold';
    if (e.code === 'permission-denied') {
      msg.innerHTML = `
        <p>⚠️ Permission denied loading characters.</p>
        <p style="font-size:0.9em;margin-top:8px;">Please contact the administrator to update Firebase security rules for the 'character' collection.</p>
      `;
    } else {
      msg.textContent = 'Error loading characters: ' + (e.message || 'Unknown error');
    }
    grid.appendChild(msg);
    createAddSlot(grid);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadHeaderFooter();
  let firebaseConfig;
  try {
    firebaseConfig = await fetch('/__/firebase/init.json').then(r => r.json());
  } catch {
    console.error('Failed to fetch firebase config');
    return;
  }
  firebaseConfig.authDomain = AUTH_DOMAIN;
  const app = initializeApp(firebaseConfig);

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });

  const auth = getAuth(app);
  const db = getFirestore(app);

  onAuthStateChanged(auth, user => {
    if (user) {
      console.log('User is signed in:', user.uid);
      loadCharacters(db, user.uid);
    } else {
      console.log('No user is signed in');
      const grid = document.getElementById('character-grid');
      if (!grid) return;
      grid.innerHTML = '';
      createAddSlot(grid);
    }
  });
});
