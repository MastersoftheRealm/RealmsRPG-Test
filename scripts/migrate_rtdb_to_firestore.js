#!/usr/bin/env node
/**
 * Migrate RTDB Codex Data to Firestore
 * =====================================
 * Reads game reference data from Firebase Realtime Database and writes to
 * Firestore codex_* collections.
 *
 * Usage:
 *   node scripts/migrate_rtdb_to_firestore.js           # Run migration
 *   node scripts/migrate_rtdb_to_firestore.js --dry-run  # Log only, no writes
 *
 * Required: Firebase Admin credentials via one of:
 *   - GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
 *   - FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS_JSON (full JSON string)
 *   - SERVICE_ACCOUNT_EMAIL + SERVICE_ACCOUNT_PRIVATE_KEY
 *
 * Loads .env.local and .env automatically (for local dev with Option B credentials).
 *
 * Optional: FIREBASE_DATABASE_URL (default: https://realmsrpg-test-default-rtdb.firebaseio.com)
 */

const path = require('path');
const fs = require('fs');

// Load .env then .env.local so SERVICE_ACCOUNT_* vars are available (matches Next.js precedence)
function loadEnvFiles() {
  const root = path.resolve(__dirname, '..');
  for (const name of ['.env', '.env.local']) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      for (const line of content.split('\n')) {
        const m = line.match(/^([^#=]+)=(.*)$/);
        if (m) {
          const key = m[1].trim();
          let val = m[2].trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnvFiles();

const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getFirestore } = require('firebase-admin/firestore');

const DRY_RUN = process.argv.includes('--dry-run');

function toStrArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function toNumArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number);
  if (typeof val === 'number') return [val];
  if (typeof val === 'string') return val.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
  return [];
}

function prepareForFirestore(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      out[k] = prepareForFirestore(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const MIGRATIONS = [
  {
    rtdbPath: 'feats',
    firestoreCol: 'codex_feats',
    transform: (data) =>
      Object.entries(data || {}).map(([id, f]) => {
        const feat = f || {};
        return {
          id,
          name: feat.name || '',
          description: feat.description || '',
          category: feat.category || '',
          ability: feat.ability,
          ability_req: toStrArray(feat.ability_req),
          abil_req_val: toNumArray(feat.abil_req_val),
          tags: toStrArray(feat.tags),
          skill_req: toStrArray(feat.skill_req),
          skill_req_val: toNumArray(feat.skill_req_val),
          lvl_req: parseInt(feat.lvl_req) || 0,
          uses_per_rec: parseInt(feat.uses_per_rec) || 0,
          mart_abil_req: feat.mart_abil_req,
          char_feat: Boolean(feat.char_feat),
          state_feat: Boolean(feat.state_feat),
          rec_period: feat.rec_period,
          prereq_text: feat.prereq_text,
        };
      }),
  },
  {
    rtdbPath: 'skills',
    firestoreCol: 'codex_skills',
    transform: (data) =>
      Object.entries(data || {}).map(([id, s]) => {
        const skill = s || {};
        let ability = '';
        if (Array.isArray(skill.ability)) {
          ability = skill.ability.join(', ');
        } else if (typeof skill.ability === 'string') {
          ability = skill.ability;
        }
        const baseSkillRaw = skill.base_skill;
        const baseSkillId =
          typeof baseSkillRaw === 'number'
            ? baseSkillRaw
            : typeof baseSkillRaw === 'string' && baseSkillRaw !== ''
              ? parseInt(baseSkillRaw, 10)
              : undefined;
        return {
          id,
          name: skill.name || '',
          description: skill.description || '',
          ability,
          category: skill.category || '',
          base_skill_id: !isNaN(baseSkillId) ? baseSkillId : undefined,
          trained_only: skill.trained_only === true || skill.trained_only === 'true',
        };
      }),
  },
  {
    rtdbPath: 'species',
    firestoreCol: 'codex_species',
    transform: (data) =>
      Object.entries(data || {}).map(([id, s]) => {
        const species = s || {};
        let sizes = [];
        if (typeof species.sizes === 'string') {
          sizes = species.sizes.split(',').map((sz) => sz.trim());
        } else if (Array.isArray(species.sizes)) {
          sizes = species.sizes;
        }
        return {
          id,
          name: species.name || '',
          description: species.description || '',
          type: species.type || '',
          size: sizes[0] || 'Medium',
          sizes,
          speed: parseInt(species.speed) || 6,
          traits: toStrArray(species.traits),
          species_traits: toStrArray(species.species_traits),
          ancestry_traits: toStrArray(species.ancestry_traits),
          flaws: toStrArray(species.flaws),
          characteristics: toStrArray(species.characteristics),
          skills: toStrArray(species.skills),
          languages: toStrArray(species.languages),
          ability_bonuses: species.ability_bonuses,
          ave_height: species.ave_hgt_cm,
          ave_weight: species.ave_wgt_kg,
          adulthood_lifespan: species.adulthood_lifespan,
        };
      }),
  },
  {
    rtdbPath: 'traits',
    firestoreCol: 'codex_traits',
    transform: (data) =>
      Object.entries(data || {}).map(([id, t]) => {
        const trait = t || {};
        return {
          id,
          name: trait.name || '',
          description: trait.description || '',
          species: toStrArray(trait.species),
          uses_per_rec: trait.uses_per_rec,
          rec_period: trait.rec_period,
        };
      }),
  },
  {
    rtdbPath: 'parts',
    firestoreCol: 'codex_parts',
    transform: (data) =>
      Object.entries(data || {}).map(([key, p]) => {
        const part = p || {};
        const partId = part.id !== undefined ? String(part.id) : key;
        return {
          id: partId,
          name: part.name || '',
          description: part.description || '',
          category: part.category || '',
          type: (part.type || 'power').toLowerCase(),
          base_en: parseFloat(part.base_en) || 0,
          base_tp: parseFloat(part.base_tp) || 0,
          base_stam: parseFloat(part.base_stam) || 0,
          op_1_desc: part.op_1_desc,
          op_1_en: parseFloat(part.op_1_en) || 0,
          op_1_tp: parseFloat(part.op_1_tp) || 0,
          op_2_desc: part.op_2_desc,
          op_2_en: parseFloat(part.op_2_en) || 0,
          op_2_tp: parseFloat(part.op_2_tp) || 0,
          op_3_desc: part.op_3_desc,
          op_3_en: parseFloat(part.op_3_en) || 0,
          op_3_tp: parseFloat(part.op_3_tp) || 0,
          percentage: part.percentage === true || part.percentage === 'true',
          mechanic: part.mechanic === true || part.mechanic === 'true',
          duration: part.duration === true || part.duration === 'true',
        };
      }),
  },
  {
    rtdbPath: 'properties',
    firestoreCol: 'codex_properties',
    transform: (data) =>
      Object.entries(data || {}).map(([key, p]) => {
        const prop = p || {};
        const propId = prop.id !== undefined ? String(prop.id) : key;
        return {
          id: propId,
          name: prop.name || '',
          description: prop.description || '',
          type: prop.type || 'general',
          tp_cost: parseFloat(prop.tp_cost) || 0,
          gold_cost: parseFloat(prop.gold_cost) || 0,
          base_ip: parseFloat(prop.base_ip) || 0,
          base_tp: parseFloat(prop.base_tp) || 0,
          base_c: parseFloat(prop.base_c) || 0,
          op_1_desc: prop.op_1_desc,
          op_1_ip: parseFloat(prop.op_1_ip) || 0,
          op_1_tp: parseFloat(prop.op_1_tp) || 0,
          op_1_c: parseFloat(prop.op_1_c) || 0,
        };
      }),
  },
  {
    rtdbPath: 'items',
    firestoreCol: 'codex_equipment',
    transform: (data) =>
      Object.entries(data || {}).map(([key, e]) => {
        const equip = e || {};
        const equipId = equip.id !== undefined ? String(equip.id) : key;
        return {
          id: equipId,
          name: equip.name || '',
          type: equip.type || 'equipment',
          subtype: equip.subtype,
          category: equip.category,
          description: equip.description || '',
          damage: equip.damage,
          armor_value: equip.armor_value != null ? parseInt(equip.armor_value) : undefined,
          gold_cost: parseFloat(equip.gold_cost) || 0,
          currency: parseFloat(equip.currency) || parseFloat(equip.gold_cost) || 0,
          properties: toStrArray(equip.properties),
          rarity: equip.rarity,
          weight: equip.weight != null ? parseFloat(equip.weight) : undefined,
        };
      }),
  },
  {
    rtdbPath: 'archetypes',
    firestoreCol: 'codex_archetypes',
    transform: (data) =>
      Object.entries(data || {}).map(([id, a]) => ({
        id,
        ...a,
      })),
  },
  {
    rtdbPath: 'creature_feats',
    firestoreCol: 'codex_creature_feats',
    transform: (data) => {
      const raw = data || {};
      const entries = Array.isArray(raw)
        ? raw.map((item, idx) => [String(idx), item])
        : Object.entries(raw);
      return entries
        .filter(([, feat]) => feat != null)
        .map(([key, feat]) => ({
          id: String(feat.id ?? key),
          name: String(feat.name ?? ''),
          description: String(feat.description ?? ''),
          points: Number(feat.feat_points ?? feat.points ?? feat.cost ?? 0),
          tiers: feat.tiers ? Number(feat.tiers) : undefined,
          prereqs: toStrArray(feat.prereqs),
        }));
    },
  },
];

async function main() {
  if (DRY_RUN) {
    console.log('*** DRY RUN — no writes will be performed ***\n');
  }

  // Load credentials
  const jsonKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  let serviceAccount = null;
  if (jsonKey) {
    try {
      serviceAccount = JSON.parse(jsonKey);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY/GOOGLE_APPLICATION_CREDENTIALS_JSON:', e.message);
      process.exit(1);
    }
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'realmsrpg-test';
    const clientEmail = process.env.SERVICE_ACCOUNT_EMAIL;
    const privateKey = (process.env.SERVICE_ACCOUNT_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(
      /\\n/g,
      '\n'
    );
    if (clientEmail && privateKey) {
      serviceAccount = { projectId, clientEmail, privateKey };
    }
  }

  const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://realmsrpg-test-default-rtdb.firebaseio.com';

  // Use explicit credentials, GOOGLE_APPLICATION_CREDENTIALS (path to JSON), or ADC
  // For ADC: run "gcloud auth application-default login" first (secrets in Secret Manager work via deploy only)
  if (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log(
      'No explicit credentials. Using Application Default Credentials (ADC).\n' +
        'If you use Secret Manager: run "gcloud auth application-default login" first.'
    );
  }

  const app = initializeApp(
    serviceAccount ? { credential: cert(serviceAccount), databaseURL } : { databaseURL },
    'migrate-rtdb-' + Date.now()
  );

  const rtdb = getDatabase(app);
  const firestore = getFirestore(app);

  let totalWritten = 0;
  for (const m of MIGRATIONS) {
    try {
      const snapshot = await rtdb.ref(m.rtdbPath).once('value');
      const raw = snapshot.val();
      const items = m.transform(raw);

      if (items.length === 0) {
        console.log(`[${m.firestoreCol}] No data at RTDB path "${m.rtdbPath}" — skipping`);
        continue;
      }

      console.log(`[${m.firestoreCol}] ${items.length} documents from ${m.rtdbPath}`);

      if (!DRY_RUN) {
        const BATCH_SIZE = 500;
        for (let i = 0; i < items.length; i += BATCH_SIZE) {
          const chunk = items.slice(i, i + BATCH_SIZE);
          const batch = firestore.batch();
          for (const item of chunk) {
            const id = item.id || String(Math.random());
            const { id: _id, ...doc } = item;
            const docRef = firestore.collection(m.firestoreCol).doc(id);
            batch.set(docRef, prepareForFirestore(doc));
          }
          await batch.commit();
          totalWritten += chunk.length;
        }
      }
    } catch (err) {
      console.error(`[${m.firestoreCol}] Error:`, err.message);
    }
  }

  if (DRY_RUN) {
    console.log('\nDry run complete. Run without --dry-run to migrate.');
  } else {
    console.log(`\nDone. Migrated ${totalWritten} documents.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
