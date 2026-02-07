#!/usr/bin/env node
/**
 * Inject env vars into vanilla-site-reference-only (reCAPTCHA keys)
 * Run before deploying the vanilla site: npm run inject-env-vanilla
 * Restore placeholders before committing: npm run inject-env-vanilla -- --restore
 *
 * Reads from .env: RECAPTCHA_SITE_KEY_PROD, RECAPTCHA_SITE_KEY_TEST (or NEXT_PUBLIC_RECAPTCHA_SITE_KEY)
 */

const fs = require('fs');
const path = require('path');

const RESTORE = process.argv.includes('--restore');

if (!RESTORE) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

const PROD = RESTORE ? '__RECAPTCHA_SITE_KEY_PROD__' : (process.env.RECAPTCHA_SITE_KEY_PROD || '');
const TEST = RESTORE ? '__RECAPTCHA_SITE_KEY_TEST__' : (process.env.RECAPTCHA_SITE_KEY_TEST || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '');

const VANILLA_ROOT = path.join(__dirname, '..', 'vanilla-site-reference-only');
const FILES = [
  'public/js/core/environment.js',
  'public/pages/codex.html',
  'public/js/character-sheet/firebase-config.js',
];

function inject() {
  let updated = 0;
  for (const rel of FILES) {
    const filePath = path.join(VANILLA_ROOT, rel);
    if (!fs.existsSync(filePath)) continue;
    let content = fs.readFileSync(filePath, 'utf8');
    const before = content;
    // Restore: replace any injected value with placeholder (skip if already placeholder)
    if (RESTORE) {
      let prodDone = false;
      content = content.replace(/RECAPTCHA_SITE_KEY: '([^']*)'/g, (_, val) => {
        if (val.startsWith('__RECAPTCHA_SITE_KEY_')) return `RECAPTCHA_SITE_KEY: '${val}'`;
        return prodDone
          ? "RECAPTCHA_SITE_KEY: '__RECAPTCHA_SITE_KEY_TEST__'"
          : (prodDone = true, "RECAPTCHA_SITE_KEY: '__RECAPTCHA_SITE_KEY_PROD__'");
      });
      content = content.replace(/RECAPTCHA_SITE_KEY \|\| '([^']*)'/g, (_, val) =>
        val.startsWith('__') ? `RECAPTCHA_SITE_KEY || '${val}'` : "RECAPTCHA_SITE_KEY || '__RECAPTCHA_SITE_KEY_PROD__'"
      );
    } else {
      content = content.replace(/__RECAPTCHA_SITE_KEY_PROD__/g, PROD);
      content = content.replace(/__RECAPTCHA_SITE_KEY_TEST__/g, TEST);
    }
    if (content !== before) {
      fs.writeFileSync(filePath, content);
      updated++;
    }
  }
  if (updated > 0) {
    console.log('[inject-env-vanilla]', RESTORE ? 'Restored placeholders in' : 'Injected keys into', updated, 'file(s)');
  } else if (!RESTORE && !PROD && !TEST) {
    console.warn('[inject-env-vanilla] No RECAPTCHA_SITE_KEY_PROD or RECAPTCHA_SITE_KEY_TEST in .env - placeholders unchanged');
  }
}

inject();
