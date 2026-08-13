#!/usr/bin/env node
/**
 * Download all objects from Supabase Storage buckets to backups/storage-<timestamp>/
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local or .env
 * Run: npm run storage:backup
 *
 * Default buckets: every bucket the project uses — portraits, profile-pictures, codex-art
 * (official Realms Image Library art) and vtt-maps. Override with STORAGE_BACKUP_BUCKETS.
 * A bucket that fails does not abort the others, but the run exits non-zero and prints
 * FAILURE so a partial storage backup can never read as success.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const root = path.join(__dirname, '..');
for (const name of ['.env.local', '.env']) {
  require('dotenv').config({ path: path.join(root, name) });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local or .env');
  process.exit(1);
}

const DEFAULT_BUCKETS = ['portraits', 'profile-pictures', 'codex-art', 'vtt-maps'];
const buckets = process.env.STORAGE_BACKUP_BUCKETS
  ? process.env.STORAGE_BACKUP_BUCKETS.split(',').map((b) => b.trim()).filter(Boolean)
  : DEFAULT_BUCKETS;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const timestamp = new Date()
  .toISOString()
  .replace(/[-:]/g, '')
  .replace('T', '-')
  .slice(0, 15);
const outDir = path.join(root, 'backups', `storage-${timestamp}`);

async function listAllFiles(bucket, prefix = '') {
  const files = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit, offset });
    if (error) {
      throw new Error(`List failed for ${bucket}/${prefix || '(root)'}: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    for (const item of data) {
      const itemPath = `${prefix}${item.name}`;
      if (!item.metadata) {
        const nested = await listAllFiles(bucket, `${itemPath}/`);
        files.push(...nested);
      } else {
        files.push({
          bucket,
          path: itemPath,
          size: item.metadata?.size ?? null,
          mimetype: item.metadata?.mimetype ?? null,
        });
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return files;
}

async function downloadFile(bucket, filePath) {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);
  if (error) {
    throw new Error(`Download failed for ${bucket}/${filePath}: ${error.message}`);
  }
  return Buffer.from(await data.arrayBuffer());
}

async function backupBucket(bucket, manifest) {
  const files = await listAllFiles(bucket);
  console.log(`  Found ${files.length} file(s)`);
  manifest.buckets[bucket] = { fileCount: files.length, bytes: 0, files: [] };

  for (const file of files) {
    const localPath = path.join(outDir, bucket, file.path);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    const buf = await downloadFile(bucket, file.path);
    fs.writeFileSync(localPath, buf);
    manifest.buckets[bucket].bytes += buf.length;
    manifest.buckets[bucket].files.push(file);
  }
  console.log(`  Saved ${files.length} file(s) (${manifest.buckets[bucket].bytes} bytes)`);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`Output: ${outDir}`);

  const manifest = { createdAt: new Date().toISOString(), buckets: {}, failures: {} };

  for (const bucket of buckets) {
    console.log(`\nBucket: ${bucket}`);
    try {
      await backupBucket(bucket, manifest);
    } catch (err) {
      const message = err.message || String(err);
      manifest.failures[bucket] = message;
      console.error(`  FAILED: ${message}`);
    }
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const failed = Object.keys(manifest.failures);
  const totalFiles = Object.values(manifest.buckets).reduce((sum, b) => sum + b.fileCount, 0);
  console.log('');
  if (failed.length > 0) {
    console.error(
      `FAILURE: ${failed.length} of ${buckets.length} bucket(s) did not back up (${failed.join(', ')}). ` +
        `Partial output at ${outDir}`,
    );
    process.exit(1);
  }
  console.log(
    `SUCCESS: ${totalFiles} object(s) from ${buckets.length} bucket(s) backed up to ${outDir}`,
  );
}

main().catch((err) => {
  console.error(`FAILURE: ${err.message || err}`);
  process.exit(1);
});
