#!/usr/bin/env node
/**
 * Live HTTP smoke for Realms Image Library API (TASK-492).
 * Run with dev server up: npm run dev (default http://localhost:3000)
 *
 * Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
 * SUPABASE_SERVICE_ROLE_KEY. Admin POST also needs E2E_TEST_EMAIL + E2E_TEST_PASSWORD
 * (temporarily promotes user to admin for the smoke, then restores role).
 */

const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const dotenv = require('dotenv');
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const root = join(__dirname, '..');

dotenv.config({ path: join(root, '.env') });
dotenv.config({ path: join(root, '.env.local') });

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_TEST_EMAIL?.trim();
const password = process.env.E2E_TEST_PASSWORD;

let passed = 0;
let failed = 0;
let skipped = 0;

function ok(label) {
  console.log(`  PASS  ${label}`);
  passed += 1;
}

function fail(label, detail) {
  console.error(`  FAIL  ${label}${detail ? `: ${detail}` : ''}`);
  failed += 1;
}

function skip(label, reason) {
  console.log(`  SKIP  ${label} (${reason})`);
  skipped += 1;
}

async function assertJson(res, label) {
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    fail(label, `non-JSON ${res.status}: ${text.slice(0, 200)}`);
    return null;
  }
  if (!res.ok) {
    fail(label, `${res.status} ${JSON.stringify(body)}`);
    return null;
  }
  ok(`${label} (${res.status})`);
  return body;
}

async function publicGet(path, label) {
  const res = await fetch(`${BASE}${path}`);
  return assertJson(res, label);
}

async function publicGetExpectStatus(path, status, label) {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  if (res.status !== status) {
    fail(label, `expected ${status}, got ${res.status}: ${text.slice(0, 200)}`);
    return null;
  }
  ok(`${label} (${status})`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function loginAndGetRequestContext() {
  if (!email || !password) return null;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'load', timeout: 60_000 });
  await page.getByLabel('Email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
  return { browser, request: context.request };
}

async function main() {
  console.log(`\nRealms Image Library API smoke — ${BASE}\n`);

  const list = await publicGet('/api/images', 'GET /api/images');
  if (list && !Array.isArray(list.images)) {
    fail('GET /api/images shape', 'missing images array');
  }

  await publicGet('/api/images?category=weapon', 'GET /api/images?category=weapon');
  await publicGetExpectStatus('/api/images?category=empowered', 400, 'GET invalid category → 400');

  const unauth = await fetch(`${BASE}/api/images`, { method: 'POST', body: new FormData() });
  if (unauth.status === 401) {
    ok('POST /api/images without auth → 401');
  } else {
    fail('POST /api/images without auth', `expected 401, got ${unauth.status}`);
  }

  if (!supabaseUrl || !serviceKey || !anonKey) {
    skip('Admin POST round-trip', 'Supabase env not configured');
  } else if (!email || !password) {
    skip('Admin POST round-trip', 'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set');
  } else {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: signInData, error: signInErr } = await createClient(supabaseUrl, anonKey).auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr || !signInData.user) {
      skip('Admin POST round-trip', `login failed: ${signInErr?.message ?? 'no user'}`);
    } else {
      const userId = signInData.user.id;
      const { data: profile } = await admin.from('user_profiles').select('role').eq('id', userId).maybeSingle();
      const priorRole = profile?.role ?? 'new_player';
      let promoted = false;

      if (priorRole !== 'admin') {
        const { error: roleErr } = await admin.from('user_profiles').update({ role: 'admin' }).eq('id', userId);
        if (roleErr) {
          skip('Admin POST round-trip', `could not promote test user: ${roleErr.message}`);
        } else {
          promoted = true;
        }
      }

      if (priorRole === 'admin' || promoted) {
        let browser;
        let createdId;
        try {
          const session = await loginAndGetRequestContext();
          if (!session) {
            fail('Admin login via browser', 'no context');
          } else {
            browser = session.browser;
            const pngPath = join(root, 'public', 'images', 'placeholder-portrait.png');
            const buf = readFileSync(pngPath);

            const createRes = await session.request.post(`${BASE}/api/images`, {
              multipart: {
                file: {
                  name: 'smoke-test.png',
                  mimeType: 'image/png',
                  buffer: buf,
                },
                name: `Smoke test ${Date.now()}`,
                categories: JSON.stringify(['equipment']),
              },
            });

            const createText = await createRes.text();
            let created;
            try {
              created = JSON.parse(createText);
            } catch {
              created = null;
            }

            if (createRes.status() !== 201 || !created?.id) {
              fail('POST /api/images (admin)', `${createRes.status()} ${createText.slice(0, 300)}`);
            } else {
              createdId = created.id;
              ok(`POST /api/images (admin) → 201 id=${createdId.slice(0, 8)}…`);

              const getOne = await session.request.get(`${BASE}/api/images/${createdId}`);
              if (getOne.status() === 200) ok('GET /api/images/[id]');
              else fail('GET /api/images/[id]', String(getOne.status()));

              const usage = await session.request.get(`${BASE}/api/images/${createdId}/usage`);
              if (usage.status() === 200) ok('GET /api/images/[id]/usage');
              else fail('GET /api/images/[id]/usage', String(usage.status()));

              const del = await session.request.delete(`${BASE}/api/images/${createdId}`);
              if (del.status() === 200) ok('DELETE /api/images/[id]');
              else fail('DELETE /api/images/[id]', `${del.status()} ${await del.text()}`);
              createdId = undefined;
            }
            await browser.close();
          }
        } finally {
          if (createdId) {
            await admin.from('realms_images').delete().eq('id', createdId);
          }
          if (promoted) {
            await admin.from('user_profiles').update({ role: priorRole }).eq('id', userId);
          }
        }
      }
    }
  }

  console.log(`\nSummary: ${passed} passed, ${failed} failed, ${skipped} skipped\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
