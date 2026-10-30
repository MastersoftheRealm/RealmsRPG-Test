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

const SOURCE_FILE_EXT = /\.(tsx|ts|jsx|js|mjs|cjs|css|sql|mdx|mdc|md|yaml|yml)(['"`\)]|$)/i;

const SOURCE_FILE_EXT_END = /\.(tsx|ts|jsx|js|mjs|cjs|css|sql|mdx|mdc|md|yaml|yml)$/i;

/** @param {string} arg */
export function extractStringLiterals(arg) {
  /** @type {string[]} */
  const out = [];
  const re = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m;
  while ((m = re.exec(arg))) {
    out.push(m[2]);
  }
  return out;
}

/** @param {string} literal */
export function isSourceLikePathLiteral(literal) {
  if (/\.json$/i.test(literal)) return false;
  if (/tests\//i.test(literal) || /fixtures?\//i.test(literal)) return false;
  if (SOURCE_FILE_EXT_END.test(literal)) return true;
  if (/^(src|scripts|sql|\.github)(\/|$)/i.test(literal)) return true;
  if (/^\.\.?\/\S+\.(tsx|ts|jsx|js|mjs|cjs|css|sql|mdx|mdc|md|yaml|yml)$/i.test(literal))
    return true;
  return false;
}

/** True when a quoted segment names a non-fixture source file (or require.resolve target). */
export function argHasSourcePathString(arg) {
  for (const literal of extractStringLiterals(arg)) {
    if (isSourceLikePathLiteral(literal)) return true;
  }
  return false;
}

/** @param {string} text entire test file */
export function filePathLiteralsAreOnlyJsonFixtures(text) {
  const re = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  /** @type {string[]} */
  const pathish = [];
  let m;
  while ((m = re.exec(text))) {
    const lit = m[2];
    if (!lit.includes('/') && !/\.\w{1,8}$/i.test(lit)) continue;
    pathish.push(lit);
  }
  if (pathish.length === 0) return false;
  return pathish.every((lit) => /\.json$/i.test(lit));
}

/** Call sites that may read source text (first argument is checked). */
const SOURCE_READ_CALL_RES = [
  /\breadFileSync\s*\(/g,
  /\bfs\.promises\.readFile\s*\(/g,
  /\bfs\.readFile\s*\(/g,
  /(?<![.\w])readFile\s*\(/g,
];

/**
 * @param {string} text
 * @returns {Set<string>}
 */
function discoverLocalReadWrapperNames(text) {
  /** @type {Set<string>} */
  const names = new Set();
  const fnRe =
    /function\s+(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{[\s\S]*?\breadFileSync\s*\([\s\S]*?\bjoin\s*\(/g;
  let m;
  while ((m = fnRe.exec(text))) names.add(m[1]);
  const arrowRe =
    /(?:const|let)\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*readFileSync\s*\(\s*[^)]*join\s*\(/g;
  while ((m = arrowRe.exec(text))) names.add(m[1]);
  return names;
}

/**
 * @param {string} arg
 * @param {string} fileText
 */
function variableOnlyJoinReadCountsAsSource(arg, fileText) {
  if (
    !/\.(?:join|resolve)\s*\(/i.test(arg) &&
    !/\bjoin\s*\(/i.test(arg) &&
    !/\bresolve\s*\(/i.test(arg)
  ) {
    return false;
  }
  if (argHasSourcePathString(arg)) return false;
  if (filePathLiteralsAreOnlyJsonFixtures(fileText)) return false;
  const literals = extractStringLiterals(arg);
  for (const lit of literals) {
    if (/\.json$/i.test(lit)) continue;
    if (isSourceLikePathLiteral(lit)) return false;
    if (/\.\w{1,8}$/i.test(lit) || lit.includes('/')) return false;
  }
  if (literals.some((l) => /^(src|scripts|sql|\.github)$/i.test(l))) return true;
  return literals.length === 0 || literals.every((l) => /^(src|scripts|sql|\.github)$/i.test(l));
}

function findMatchingBrace(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return text.length;
}

function isReadInsideLocalWrapper(text, readCallIndex) {
  for (const name of discoverLocalReadWrapperNames(text)) {
    const sig = `function ${name}`;
    let idx = 0;
    while ((idx = text.indexOf(sig, idx)) !== -1) {
      if (readCallIndex > idx) {
        const parenEnd = text.indexOf(')', text.indexOf('(', idx));
        const brace = text.indexOf('{', parenEnd);
        if (
          brace !== -1 &&
          readCallIndex > brace &&
          readCallIndex < findMatchingBrace(text, brace)
        ) {
          return true;
        }
      }
      idx += sig.length;
    }
    const arrowNeedle = `${name} =`;
    idx = 0;
    while ((idx = text.indexOf(arrowNeedle, idx)) !== -1) {
      const arrow = text.indexOf('=>', idx);
      if (arrow !== -1 && readCallIndex > arrow) {
        const brace = text.indexOf('{', arrow);
        if (brace === -1) {
          const semi = text.indexOf(';', arrow);
          if (readCallIndex > arrow && readCallIndex < semi) return true;
        } else if (readCallIndex > brace && readCallIndex < findMatchingBrace(text, brace)) {
          return true;
        }
      }
      idx += arrowNeedle.length;
    }
  }
  return false;
}

/**
 * Count fs read call sites that plausibly read repo source under src/, scripts/, sql/, or .github/.
 *
 * @param {string} text test file contents
 * @param {string} [testRelPath] posix path for context (e.g. src/.../foo.test.ts)
 * @returns {number}
 */
export function countSourceReadsInTestText(text, testRelPath = '') {
  /** @type {Set<string>} */
  const sites = new Set();

  for (const callRe of SOURCE_READ_CALL_RES) {
    callRe.lastIndex = 0;
    let m;
    while ((m = callRe.exec(text)) !== null) {
      const open = m.index + m[0].lastIndexOf('(');
      const close = indexOfMatchingParen(text, open);
      if (close === -1) continue;
      const inner = text.slice(open + 1, close);
      const arg = firstCallArgument(inner);
      if (isExcludedReadTarget(arg)) continue;
      if (isReadInsideLocalWrapper(text, open)) continue;
      if (
        pathArgLooksLikeSourceRead(arg, testRelPath, text) ||
        variableOnlyJoinReadCountsAsSource(arg, text)
      ) {
        sites.add(`fs:${open}`);
      }
    }
  }

  for (const name of discoverLocalReadWrapperNames(text)) {
    const callRe = new RegExp(`\\b${name}\\s*\\(`, 'g');
    let invokeCount = 0;
    let m;
    while ((m = callRe.exec(text)) !== null) {
      const lineStart = text.lastIndexOf('\n', m.index) + 1;
      const lineEnd = text.indexOf('\n', m.index);
      const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
      if (/function\s+\w+\s*\(/.test(line)) continue;
      if (/(?:const|let)\s+\w+\s*=/.test(line) && /=>/.test(line)) continue;
      invokeCount += 1;
      sites.add(`wrap:${name}:${m.index}`);
    }
    if (invokeCount === 0) {
      sites.add(`wrapdef:${name}`);
    }
  }

  return sites.size;
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
  if (/require\.resolve\s*\(/i.test(arg)) {
    return argHasSourcePathString(arg);
  }

  if (/new URL\s*\(/i.test(arg)) {
    if (/\.json/i.test(arg)) return false;
    if (/tests\//i.test(arg)) return false;
    return true;
  }

  for (const root of SOURCE_READ_ROOTS) {
    if (argIncludesRoot(arg, root)) return true;
  }

  if (/__dirname/i.test(arg) && SOURCE_FILE_EXT.test(arg)) return true;

  if (
    /\.(?:join|resolve)\s*\(/i.test(arg) ||
    /\bjoin\s*\(/i.test(arg) ||
    /\bresolve\s*\(/i.test(arg)
  ) {
    if (argHasSourcePathString(arg)) return true;
  }

  if (argHasSourcePathString(arg)) return true;

  if (/^['"`][^'"`]+['"`]$/.test(arg) && SOURCE_FILE_EXT.test(arg)) {
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

export function isExcludedReadTarget(arg) {
  if (/node_modules/i.test(arg)) return true;
  if (/package\.json/i.test(arg)) return true;
  if (/tests\//i.test(arg) || /fixtures?\//i.test(arg)) return true;
  if (/vitest\.setup/i.test(arg)) return true;
  if (/baseline[^'"`]*\.json/i.test(arg) || /-baseline\.json/i.test(arg)) return true;
  const literals = extractStringLiterals(arg);
  if (literals.length > 0 && literals.every((l) => /\.json$/i.test(l))) return true;
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
  if (root === 'src/' && /join\(__dirname,\s*['"`]\.\./.test(arg) && SOURCE_FILE_EXT.test(arg)) {
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
