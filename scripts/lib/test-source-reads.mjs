/**
 * Detect tests that read production source text via fs reads (C3 ratchet).
 */

const TEST_FILE_RE = /\.(test|spec|pw)\.(ts|tsx|js|jsx|mjs|cjs)$/;

const TEST_SOURCE_READ_RATCHET_IGNORED = new Set([
  'scripts/check-test-source-read-ratchet.test.mjs',
  'scripts/check-task-id-ratchet.test.mjs',
]);

/** Path roots that count as "source" when read from tests. */
export const SOURCE_READ_ROOTS = ['src/', 'scripts/', 'sql/', '.github/'];

const SOURCE_EXTENSIONS = /\.(tsx|ts|jsx|js|mjs|cjs|css|sql|mdx|yml|yaml)(['"`\)]|$)/i;

/** Call sites that may read source text (first argument is checked). */
const SOURCE_READ_CALL_RES = [
  /\breadFileSync\s*\(/g,
  /\bfs\.promises\.readFile\s*\(/g,
  /\bfs\.readFile\s*\(/g,
  /(?<![.\w])readFile\s*\(/g,
  /\brequire\.resolve\s*\(/g,
];

/**
 * Count fs read call sites that plausibly read repo source under src/, scripts/, sql/, or .github/.
 *
 * @param {string} text test file contents
 * @param {string} [testRelPath] posix path for context (e.g. src/.../foo.test.ts)
 * @returns {number}
 */
export function countSourceReadsInTestText(text, testRelPath = '') {
  /** @type {Set<number>} */
  const openParenIndexes = new Set();
  for (const callRe of SOURCE_READ_CALL_RES) {
    callRe.lastIndex = 0;
    let m;
    while ((m = callRe.exec(text)) !== null) {
      const open = m.index + m[0].lastIndexOf('(');
      const close = indexOfMatchingParen(text, open);
      if (close === -1) continue;
      const inner = text.slice(open + 1, close);
      const arg = firstCallArgument(inner);
      if (!isExcludedReadTarget(arg) && pathArgLooksLikeSourceRead(arg, testRelPath, text)) {
        openParenIndexes.add(open);
      }
    }
  }
  return openParenIndexes.size;
}

/** @param {string} text @param {number} openIdx index of `(` */
function indexOfMatchingParen(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** First comma at paren depth 0 (respects nested calls). */
function firstCallArgument(argsSlice) {
  let depth = 0;
  for (let i = 0; i < argsSlice.length; i++) {
    const ch = argsSlice[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === ',' && depth === 0) {
      return argsSlice.slice(0, i).trim();
    }
  }
  return argsSlice.trim();
}

/**
 * @param {string} arg first argument expression (trimmed)
 * @param {string} testRelPath
 * @param {string} fileText
 */
export function pathArgLooksLikeSourceRead(arg, testRelPath, fileText) {
  if (/new URL\s*\(/i.test(arg)) {
    if (/\.json/i.test(arg)) return false;
    if (/tests\//i.test(arg)) return false;
    return true;
  }

  for (const root of SOURCE_READ_ROOTS) {
    if (argIncludesRoot(arg, root)) return true;
  }

  if (/__dirname/i.test(arg) && SOURCE_EXTENSIONS.test(arg)) return true;

  if (/import\.meta\.(dirname|url)/i.test(arg)) return true;
  if (/process\.cwd\(\)/i.test(arg)) return true;

  if (/^['"`][^'"`]*\/src\//i.test(arg) || /^['"`]\.\.\/.*\.(tsx|ts|jsx|js|css)/i.test(arg)) {
    return true;
  }

  if (/^['"`][^'"`]+['"`]$/.test(arg) && SOURCE_EXTENSIONS.test(arg)) {
    return !/\.json['"`]$/.test(arg);
  }

  if (/^[a-zA-Z_$][\w$]*$/.test(arg)) {
    const decl = new RegExp(
      `(?:const|let)\\s+${arg}\\s*=\\s*[^;]*import\\.meta\\.dirname[^;]*\\.(tsx|ts|jsx|js|css)`,
      'm',
    );
    if (decl.test(fileText)) return true;
    if (testRelPath.replace(/\\/g, '/').startsWith('src/')) return true;
  }

  return false;
}

function isExcludedReadTarget(arg) {
  if (/node_modules/i.test(arg)) return true;
  if (/package\.json/i.test(arg)) return true;
  if (/tests\//i.test(arg) || /fixtures?\//i.test(arg)) return true;
  if (/vitest\.setup/i.test(arg)) return true;
  if (/baseline[^'"`]*\.json/i.test(arg) || /-baseline\.json/i.test(arg)) return true;
  return false;
}

function argIncludesRoot(arg, root) {
  const patterns = [
    `'${root}`,
    `"${root}`,
    `\`${root}`,
    `'./${root}`,
    `"./${root}`,
    `\`./${root}`,
    `join(process.cwd(), '${root}`,
    `join(process.cwd(), "${root}`,
    `join(process.cwd(), \`${root}`,
    `path.join(process.cwd(), '${root}`,
    `path.join(process.cwd(), "${root}`,
    `path.join(process.cwd(), \`${root}`,
    `join(__dirname, '${root}`,
    `join(__dirname, "${root}`,
    `join(__dirname, \`${root}`,
    `path.join(__dirname, '`,
    `path.join(__dirname, "`,
    `path.resolve(__dirname, '`,
    `path.resolve(__dirname, "`,
  ];
  if (patterns.some((p) => arg.includes(p))) return true;
  if (root === 'src/' && /join\(__dirname,\s*['"`]\.\./.test(arg) && SOURCE_EXTENSIONS.test(arg)) {
    return true;
  }
  return false;
}

/**
 * @param {string} relPath
 */
export function isRatchetTestFile(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (TEST_SOURCE_READ_RATCHET_IGNORED.has(normalized)) return false;
  if (!TEST_FILE_RE.test(normalized) && !normalized.endsWith('.test.mjs')) return false;
  if (normalized.startsWith('scripts/') && normalized.endsWith('.test.mjs')) return true;
  return normalized.startsWith('src/') || normalized.startsWith('tests/');
}

/**
 * @param {Record<string, number>} measured relPath -> read count
 * @param {Record<string, number>} baseline
 */
export function diffTestSourceReadRatchet(measured, baseline) {
  /** @type {string[]} */
  const errors = [];

  for (const [relPath, count] of Object.entries(measured)) {
    const base = baseline[relPath];
    if (base === undefined) {
      if (count > 0) {
        errors.push(
          `${relPath}: new test file with ${count} source file read(s). Assert behavior instead of pinning source text.`,
        );
      }
      continue;
    }
    if (count > base) {
      errors.push(
        `${relPath}: ${count} source read call site(s) > baseline ${base}. Do not add new source-text assertions; test runtime behavior instead, then run npm run tasks:test-source-read-ratchet:update after intentional cleanup.`,
      );
    }
  }

  return errors;
}

export function formatTestSourceReadRatchetFailure(errors) {
  return [
    'Test source-read ratchet failed — reads of src/, scripts/, sql/, or .github/ must not increase (C3 / ClickUp 1dfe8wf2ga7).',
    'Replace source-text tests with behavior assertions. When a file drops reads in a cleanup PR, run: npm run tasks:test-source-read-ratchet:update',
    '',
    ...errors.map((e) => `  • ${e}`),
  ].join('\n');
}
