/**
 * Shared helpers for count baselines stored as JSON.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {string} root repo root
 * @param {string[]} roots directories to walk (relative)
 * @param {(relPath: string) => boolean} includeFile
 */
export function listRepoFiles(root, roots, includeFile) {
  /** @type {string[]} */
  const out = [];

  /** @param {string} dirAbs */
  function walk(dirAbs) {
    if (!fs.existsSync(dirAbs)) return;
    for (const name of fs.readdirSync(dirAbs)) {
      const abs = path.join(dirAbs, name);
      const st = fs.statSync(abs);
      if (st.isDirectory()) {
        if (name === 'node_modules' || name === '.next') continue;
        walk(abs);
        continue;
      }
      const rel = path.relative(root, abs).replace(/\\/g, '/');
      if (includeFile(rel)) out.push(rel);
    }
  }

  for (const r of roots) walk(path.join(root, r));
  out.sort();
  return out;
}

/**
 * @template T
 * @param {string} filePath
 * @param {() => T} read
 */
export function loadJson(filePath, read) {
  if (!fs.existsSync(filePath)) return read();
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * @param {string} filePath
 * @param {unknown} data
 */
export function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

/**
 * Strip zero counts so baselines stay readable.
 * @param {Record<string, Record<string, number>>} map
 */
export function pruneZeroCounts(map) {
  /** @type {Record<string, Record<string, number>>} */
  const out = {};
  for (const [file, counts] of Object.entries(map)) {
    /** @type {Record<string, number>} */
    const pruned = {};
    for (const [k, v] of Object.entries(counts)) {
      if (v > 0) pruned[k] = v;
    }
    if (Object.keys(pruned).length) out[file] = pruned;
  }
  return out;
}

/**
 * @param {Record<string, number>} map
 */
export function pruneZeroFlat(map) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const [k, v] of Object.entries(map)) {
    if (v > 0) out[k] = v;
  }
  return out;
}
