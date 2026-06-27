#!/usr/bin/env node
/**
 * Provision deterministic E2E baseline data (TASK-385 / DEV-003).
 *
 * Creates (or updates) a low-privilege test user plus fixed character + campaign IDs
 * from tests/visual/e2e-seed-manifest.json so Playwright screenshots stay stable.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, E2E_TEST_EMAIL, E2E_TEST_PASSWORD
 * Run: npm run e2e:provision
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'tests', 'visual', 'e2e-seed-manifest.json'), 'utf8'),
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.E2E_TEST_EMAIL?.trim();
const password = process.env.E2E_TEST_PASSWORD;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!email || !password) {
  console.error('Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD before running e2e:provision');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_ABILITIES = {
  strength: 0,
  vitality: 0,
  agility: 0,
  acuity: 0,
  intelligence: 0,
  charisma: 0,
};

async function findUserIdByEmail(targetEmail) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function ensureUserId() {
  let userId = await findUserIdByEmail(email);
  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`Updated password for existing user ${email}`);
    return userId;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`Created user ${email} (${userId})`);
  return userId;
}

async function ensureProfile(userId) {
  const now = new Date().toISOString();
  const row = {
    id: userId,
    email,
    username: manifest.profileUsername,
    username_display: manifest.profileUsernameDisplay,
    display_name: manifest.profileUsernameDisplay,
    show_tooltips: true,
    role: 'new_player',
    created_at: manifest.profileCreatedAt,
    updated_at: now,
  };

  const { error: upsertErr } = await admin.from('user_profiles').upsert(row, { onConflict: 'id' });
  if (upsertErr) throw upsertErr;

  const { error: usernameErr } = await admin.from('usernames').upsert(
    { username: manifest.profileUsername, user_id: userId },
    { onConflict: 'username' },
  );
  if (usernameErr) throw usernameErr;
}

async function ensureCharacter(userId) {
  const createdAt = manifest.profileCreatedAt;
  const data = {
    id: manifest.characterId,
    name: manifest.characterName,
    userId,
    level: 1,
    visibility: 'private',
    abilities: { ...DEFAULT_ABILITIES },
    currentHealth: 10,
    currentEnergy: 4,
    healthPoints: 0,
    energyPoints: 0,
    speedBase: 6,
    evasionBase: 10,
    createdAt,
    updatedAt: createdAt,
  };

  const row = {
    id: manifest.characterId,
    user_id: userId,
    data,
    name: manifest.characterName,
    level: 1,
    archetype_name: null,
    ancestry_name: null,
    status: null,
    visibility: 'private',
    created_at: createdAt,
    updated_at: createdAt,
  };

  const { error } = await admin.from('characters').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

async function ensureCampaign(userId) {
  const createdAt = manifest.profileCreatedAt;
  const rosterEntry = {
    userId,
    characterId: manifest.characterId,
    characterName: manifest.characterName,
    level: 1,
    ownerUsername: manifest.profileUsername,
  };

  const row = {
    id: manifest.campaignId,
    owner_id: userId,
    owner_username: manifest.profileUsernameDisplay,
    name: manifest.campaignName,
    description: manifest.campaignDescription,
    invite_code: manifest.inviteCode,
    characters: [rosterEntry],
    created_at: createdAt,
    updated_at: createdAt,
  };

  const { error } = await admin.from('campaigns').upsert(row, { onConflict: 'id' });
  if (error) throw error;

  const { error: memberErr } = await admin.from('campaign_members').upsert(
    { campaign_id: manifest.campaignId, user_id: userId },
    { onConflict: 'campaign_id,user_id' },
  );
  if (memberErr && !memberErr.message.includes('duplicate')) {
    // Table may not exist in all envs; roster memberIds still gates access.
    console.warn('campaign_members upsert skipped:', memberErr.message);
  }
}

async function main() {
  const userId = await ensureUserId();
  await ensureProfile(userId);
  await ensureCharacter(userId);
  await ensureCampaign(userId);

  console.log('\nE2E baseline seed complete.');
  console.log(`  E2E_TEST_EMAIL=${email}`);
  console.log(`  E2E_TEST_CHARACTER_ID=${manifest.characterId}`);
  console.log(`  E2E_TEST_CAMPAIGN_ID=${manifest.campaignId}`);
  console.log('\nAdd the above to .env.local and GitHub Actions secrets (DEV-003).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
