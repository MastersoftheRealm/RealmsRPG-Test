import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app-check.js";
import { AUTH_DOMAIN, RECAPTCHA_SITE_KEY } from '../core/environment.js';

let app, db;

export async function initFirebase() {
  const response = await fetch('/__/firebase/init.json');
  const firebaseConfig = await response.json();
  firebaseConfig.authDomain = AUTH_DOMAIN;
  app = initializeApp(firebaseConfig);

  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });

  await new Promise(resolve => setTimeout(resolve, 500));
  db = getDatabase(app);
}

export function getDB() {
  return db;
}

export async function getWithRetry(path, attempts = 3) {
  const r = ref(db, path);
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await get(r);
    } catch (err) {
      lastErr = err;
      const msg = (err && err.message) || '';
      const isOffline = msg.includes('Client is offline') || msg.toLowerCase().includes('network');
      if (!isOffline || i === attempts - 1) throw err;
      await new Promise(res => setTimeout(res, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

export function createChip(text, container, removeCallback) {
  const chip = document.createElement('div');
  chip.className = 'chip';
  chip.innerHTML = `${text} <span class="remove">×</span>`;
  chip.querySelector('.remove').addEventListener('click', () => {
    chip.remove();
    removeCallback();
  });
  container.appendChild(chip);
}

export function applySort(filteredData, sortState, col) {
  const { dir } = sortState;
  filteredData.sort((a, b) => {
    let valA = a[col] || (typeof a[col] === 'number' ? 0 : '');
    let valB = b[col] || (typeof b[col] === 'number' ? 0 : '');
    if (typeof valA === 'string') {
      return dir * valA.localeCompare(valB);
    } else {
      return dir * (valA - valB);
    }
  });
}

export function toggleExpand(header) {
  header.parentElement.classList.toggle('expanded');
}

export function cmToFtIn(cm) {
  if (!cm) return 'N/A';
  const inches = cm / 2.54;
  const ft = Math.floor(inches / 12);
  const inc = Math.round(inches % 12);
  return `${ft}'${inc}"`;
}

export function kgToLb(kg) {
  if (!kg) return 'N/A';
  return Math.round(kg * 2.20462);
}
