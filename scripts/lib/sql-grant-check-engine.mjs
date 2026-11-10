/**
 * SQL grant / RLS / policy static analysis for migrations.
 * @see scripts/check-sql-table-grants.mjs
 */

export const REQUIRED_PRIVILEGES = ['select', 'insert', 'update', 'delete'];
export const REQUIRED_ROLES = ['authenticated', 'service_role'];
export const CLIENT_EXPOSED_ROLES = ['anon', 'authenticated', 'public'];

const IGNORED_REL = new Set(['sql/_TEMPLATE_new_table.sql', 'sql/_template_new_table.sql']);

/** @param {string} relPath posix-style path under repo root */
export function isIgnoredSqlGrantCheckPath(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  if (IGNORED_REL.has(normalized)) return true;
  if (normalized.startsWith('sql/schema/')) return true;
  return false;
}

/**
 * @param {string} decoded
 */
export function quotedIdTokenForName(decoded) {
  return `«Q${Buffer.from(decoded, 'utf8').toString('hex')}»`;
}

/**
 * @param {string} content
 */
function preservedStringToken(content) {
  return `«S${Buffer.from(content, 'utf8').toString('hex')}»`;
}

/**
 * @param {string} token
 */
export function decodePreservedStringToken(token) {
  const match = /^«S([0-9a-f]+)»$/i.exec(token.trim());
  if (!match) return null;
  return Buffer.from(match[1], 'hex').toString('utf8');
}

/**
 * @param {string} sql
 * @param {number} start index of opening quote
 */
function readSqlStringLiteral(sql, start) {
  let i = start + 1;
  const n = sql.length;
  /** @type {string[]} */
  const chars = [];
  while (i < n) {
    const ch = sql[i];
    if (ch === "'" && sql[i + 1] === "'") {
      chars.push("'");
      i += 2;
      continue;
    }
    if (ch === "'") {
      return { value: chars.join(''), next: i + 1 };
    }
    chars.push(ch);
    i += 1;
  }
  return { value: chars.join(''), next: n };
}

/**
 * @param {string} sql
 * @param {number} start index of opening quote after optional u&
 */
function readUnicodeQuotedIdentifier(sql, start) {
  let i = start;
  if (sql.slice(i, i + 2).toLowerCase() === 'u&') i += 2;
  if (sql[i] !== '"') return null;
  i += 1;
  const n = sql.length;
  let decoded = '';
  while (i < n) {
    if (sql[i] === '"') {
      if (sql[i + 1] === '"') {
        decoded += '"';
        i += 2;
        continue;
      }
      return { decoded, next: i + 1 };
    }
    if (sql[i] === '\\' && i + 5 < n && /^[0-9a-fA-F]{4}/.test(sql.slice(i + 1, i + 5))) {
      decoded += String.fromCodePoint(parseInt(sql.slice(i + 1, i + 5), 16));
      i += 5;
      continue;
    }
    decoded += sql[i];
    i += 1;
  }
  return { decoded, next: n };
}

/**
 * @param {string} sql
 * @returns {{ code: string, topLevelDoBodies: string[] }}
 */
function sanitizeSql(sql) {
  let out = '';
  let i = 0;
  const n = sql.length;
  /** @type {{ tag: string, kind: 'fn' | 'do' | 'block' }[]} */
  const dollarStack = [];
  /** @type {string[]} */
  const topLevelDoBodies = [];
  /** @type {string[]} */
  const functionBodies = [];
  /** @type {string | null} */
  let captureTopLevelDo = null;
  /** @type {string | null} */
  let captureFunctionBody = null;

  const emit = (text) => {
    out += text;
    if (captureTopLevelDo !== null) captureTopLevelDo += text;
    if (captureFunctionBody !== null) captureFunctionBody += text;
  };

  const blankUntil = (end) => {
    while (i < end) {
      emit(sql[i] === '\n' ? '\n' : ' ');
      i++;
    }
  };

  const inTopLevelDoBody = () => captureTopLevelDo !== null;

  while (i < n) {
    const c = sql[i];
    const next = sql[i + 1];

    if (c === '-' && next === '-') {
      const nl = sql.indexOf('\n', i);
      blankUntil(nl === -1 ? n : nl);
      continue;
    }

    if (c === '/' && next === '*') {
      let depth = 1;
      emit('  ');
      i += 2;
      while (i < n && depth > 0) {
        if (sql[i] === '/' && sql[i + 1] === '*') {
          depth += 1;
          emit('  ');
          i += 2;
          continue;
        }
        if (sql[i] === '*' && sql[i + 1] === '/') {
          depth -= 1;
          emit('  ');
          i += 2;
          continue;
        }
        emit(sql[i] === '\n' ? '\n' : ' ');
        i += 1;
      }
      continue;
    }

    if (
      (c === 'e' || c === 'E') &&
      next === "'" &&
      (i === 0 || !/[a-zA-Z0-9_]/i.test(sql[i - 1]))
    ) {
      emit(' ');
      i += 2;
      while (i < n) {
        if (sql[i] === '\\' && i + 1 < n) {
          i += 2;
          emit('  ');
          continue;
        }
        if (sql[i] === "'" && sql[i + 1] === "'") {
          i += 2;
          emit('  ');
          continue;
        }
        const ch = sql[i];
        emit(ch === '\n' ? '\n' : ' ');
        i += 1;
        if (ch === "'") break;
      }
      continue;
    }

    if (c === "'") {
      if (inTopLevelDoBody()) {
        const lit = readSqlStringLiteral(sql, i);
        emit(preservedStringToken(lit.value));
        i = lit.next;
        continue;
      }
      emit(' ');
      i += 1;
      while (i < n) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          emit('  ');
          i += 2;
          continue;
        }
        const ch = sql[i];
        emit(ch === '\n' ? '\n' : ' ');
        i += 1;
        if (ch === "'") break;
      }
      continue;
    }

    if (
      (c === 'u' || c === 'U') &&
      sql
        .slice(i, i + 3)
        .toLowerCase()
        .startsWith('u&"')
    ) {
      const id = readUnicodeQuotedIdentifier(sql, i);
      if (id) {
        emit(quotedIdTokenForName(id.decoded));
        i = id.next;
        continue;
      }
    }

    if (c === '"') {
      let decoded = '';
      i += 1;
      while (i < n) {
        if (sql[i] === '"' && sql[i + 1] === '"') {
          decoded += '"';
          i += 2;
          continue;
        }
        const ch = sql[i];
        if (ch === '"') {
          i += 1;
          break;
        }
        decoded += ch;
        i += 1;
      }
      emit(quotedIdTokenForName(decoded));
      continue;
    }

    if (c === '$') {
      const match = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if (match) {
        const tag = match[0];
        if (dollarStack.length && dollarStack[dollarStack.length - 1].tag === tag) {
          const closing = dollarStack.pop();
          if (captureTopLevelDo !== null && closing?.kind === 'do' && dollarStack.length === 0) {
            topLevelDoBodies.push(captureTopLevelDo);
            captureTopLevelDo = null;
          }
          if (captureFunctionBody !== null && closing?.kind === 'fn' && dollarStack.length === 0) {
            functionBodies.push(captureFunctionBody);
            captureFunctionBody = null;
          }
        } else {
          const before = out.replace(/\s+/g, ' ').trim().toLowerCase();
          let kind = 'block';
          if (/\bdo(\s+language\s+plpgsql)?\s*$/.test(before.slice(-28))) kind = 'do';
          else if (/\bas\s*$/.test(before.slice(-12))) kind = 'fn';
          dollarStack.push({ tag, kind });
          if (kind === 'do' && dollarStack.length === 1 && captureTopLevelDo === null) {
            captureTopLevelDo = '';
          }
          if (kind === 'fn' && dollarStack.length === 1 && captureFunctionBody === null) {
            captureFunctionBody = '';
          }
        }
        emit(' '.repeat(tag.length));
        i += tag.length;
        continue;
      }
    }

    emit(c);
    i += 1;
  }

  return { code: out, topLevelDoBodies, functionBodies };
}

/** @param {string} sql */
export function sqlCodeWithoutCommentsAndLiterals(sql) {
  return sanitizeSql(sql).code;
}

/**
 * @param {string} token
 * @returns {string | null}
 */
function decodeQuotedIdToken(token) {
  const match = /^«Q([0-9a-f]+)»$/i.exec(token.trim());
  if (!match) return null;
  return Buffer.from(match[1], 'hex').toString('utf8');
}

/**
 * @param {string} token
 * @returns {string | null}
 */
function resolveNameToken(token) {
  const trimmed = token.trim();
  const decoded = decodeQuotedIdToken(trimmed);
  if (decoded !== null) return decoded;
  if (/^[a-z_][a-z0-9_]*$/i.test(trimmed)) return trimmed.toLowerCase();
  return null;
}

/**
 * @param {string} ref
 * @returns {{ schema: string, name: string } | null}
 */
export function parseQualifiedTableRef(ref) {
  const parts = ref
    .trim()
    .split(/\s*\.\s*/)
    .filter(Boolean);
  if (parts.length === 2) {
    const schema = resolveNameToken(parts[0]);
    const name = resolveNameToken(parts[1]);
    if (schema && name) return { schema, name };
    return null;
  }
  if (parts.length === 1) {
    const name = resolveNameToken(parts[0]);
    if (name && name !== 'if') return { schema: 'public', name };
  }
  return null;
}

const CREATE_TABLE_PREFIX_RE =
  /\bcreate\s+(?:unlogged\s+)?table(?=\s|"|«)(?!\s+as\b)\s*(?:if\s+not\s+exists\s*)?/gi;

const QUALIFIED_TABLE_REF_RE =
  /^((?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*)(?:\s*\.\s*(?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*))?)/i;

/**
 * @param {string} code
 * @param {(parsed: { schema: string, name: string }) => void} onRef
 */
function forEachCreateTableRef(code, onRef) {
  const re = new RegExp(CREATE_TABLE_PREFIX_RE.source, 'gi');
  let match;
  while ((match = re.exec(code))) {
    let i = match.index + match[0].length;
    while (i < code.length && /\s/.test(code[i])) i += 1;
    const refMatch = QUALIFIED_TABLE_REF_RE.exec(code.slice(i));
    if (!refMatch) continue;
    const parsed = parseQualifiedTableRef(refMatch[1]);
    if (!parsed) continue;
    onRef(parsed);
    re.lastIndex = i + refMatch[0].length;
  }
}

/**
 * @param {string} text
 * @param {number} openParenIndex index of `(`
 * @returns {string | null} inner text when balanced `)` found
 */
function readBalancedParenContent(text, openParenIndex) {
  if (text[openParenIndex] !== '(') return null;
  let depth = 0;
  for (let i = openParenIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return text.slice(openParenIndex + 1, i);
    }
  }
  return null;
}

/**
 * @param {string} clause
 * @param {'using' | 'with check'} keyword
 */
function extractPolicyPredicateExpression(clause, keyword) {
  const re = new RegExp(`\\b${keyword.replace(' ', '\\s+')}\\s*\\(`, 'i');
  const match = re.exec(clause);
  if (!match) return null;
  const openIdx = match.index + match[0].length - 1;
  return readBalancedParenContent(clause, openIdx);
}

/**
 * @param {string} expr
 * @returns {string[]}
 */
function splitTopLevelOr(expr) {
  /** @type {string[]} */
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < expr.length; i += 1) {
    if (expr[i] === '(') depth += 1;
    else if (expr[i] === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      const orMatch = /^\s+or\b/i.exec(expr.slice(i));
      if (orMatch) {
        parts.push(expr.slice(start, i).trim());
        i += orMatch[0].length - 1;
        start = i + 1;
      }
    }
  }
  parts.push(expr.slice(start).trim());
  return parts.filter(Boolean);
}

/** @param {string} name */
function escapeRegExp(name) {
  return name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} schema
 * @param {string} tableName
 */
export function tableReferencePattern(schema, tableName) {
  const schemaLower = schema.toLowerCase();
  const nameAlternates = [escapeRegExp(quotedIdTokenForName(tableName))];
  if (tableName === tableName.toLowerCase()) {
    nameAlternates.push(escapeRegExp(tableName));
  }
  const schemaPart =
    schemaLower === 'public'
      ? `(?:(?:public|${escapeRegExp(quotedIdTokenForName('public'))})\\s*\\.\\s*)?`
      : `(?:${escapeRegExp(quotedIdTokenForName(schemaLower))}|${escapeRegExp(schemaLower)})\\s*\\.\\s*`;
  return `${schemaPart}(?:${nameAlternates.join('|')})`;
}

/**
 * @param {string} code
 * @returns {{ schema: string, name: string }[]}
 */
export function extractCreateTableTargets(code) {
  /** @type {{ schema: string, name: string }[]} */
  const targets = [];
  forEachCreateTableRef(code, (parsed) => targets.push(parsed));
  return targets;
}

/**
 * @param {string} code
 * @param {string[]} functionBodies
 */
function stripPlpgsqlBodies(code, bodies) {
  let result = code;
  for (const body of bodies) {
    if (!body) continue;
    const idx = result.indexOf(body);
    if (idx !== -1) {
      result = result.slice(0, idx) + ' '.repeat(body.length) + result.slice(idx + body.length);
    }
  }
  return result;
}

/**
 * @param {string} body
 * @returns {string[]}
 */
/**
 * @param {string} body
 * @param {number} index
 */
function isInsideExpandableForeachRegion(body, index) {
  for (const { start, end } of foreachRegionsOutsideIf(body)) {
    if (index >= start && index < end) return true;
  }
  return false;
}

/**
 * @param {string} body
 * @returns {string[]}
 */
function auditExecuteFormatCalls(body) {
  /** @type {string[]} */
  const violations = [];
  const re = /\bexecute\s+format\s*\(\s*«S([0-9a-f]+)»([^;]*)/gi;
  let match;
  while ((match = re.exec(body))) {
    const formatSql = Buffer.from(match[1], 'hex').toString('utf8');
    const after = match[2].trim();
    if (!after.startsWith(',')) {
      violations.push('unexpandable dynamic SQL (EXECUTE format without arguments)');
      continue;
    }
    if (/%[sSL]/i.test(formatSql)) {
      violations.push('unexpandable dynamic SQL (EXECUTE format with %s or %L)');
      continue;
    }
    if (!/%I/.test(formatSql)) {
      violations.push('unexpandable dynamic SQL (EXECUTE format without %I)');
      continue;
    }
    if (!isInsideExpandableForeachRegion(body, match.index)) {
      violations.push('unexpandable dynamic SQL (EXECUTE format outside expandable FOREACH)');
    }
  }
  return violations;
}

function auditTopLevelDoBody(body) {
  /** @type {string[]} */
  const violations = [];
  const hasExecute = /\bexecute\b/i.test(body);
  if (/\bdo\s+language\s+plpgsql\b/i.test(body)) {
    violations.push('unexpandable dynamic SQL (DO LANGUAGE plpgsql)');
  }
  if (hasExecute && /\bfor\s+[a-z_][a-z0-9_]*\s+in\s+select\b/i.test(body)) {
    violations.push('unexpandable dynamic SQL (FOR … IN SELECT)');
  }
  if (
    hasExecute &&
    /\bforeach\b/i.test(body) &&
    !/\bforeach\s+[a-z_][a-z0-9_]*\s+in\s+array\s+array\b/i.test(body)
  ) {
    violations.push('unexpandable dynamic SQL (FOREACH not IN ARRAY ARRAY)');
  }
  if (hasExecute && /\bloop\b/i.test(body) && !/\bforeach\b/i.test(body)) {
    violations.push('unexpandable dynamic SQL (LOOP without expandable FOREACH)');
  }
  if (!hasExecute) return violations;
  violations.push(...auditExecuteFormatCalls(body));
  const executes = body.match(/\bexecute\b[^;]*/gi) ?? [];
  for (const ex of executes) {
    if (/execute\s+format\b/i.test(ex)) continue;
    violations.push('unexpandable dynamic SQL (EXECUTE)');
  }
  if (/\bexecute\b[^;]*\|\|/i.test(body)) {
    violations.push('unexpandable dynamic SQL (EXECUTE with concatenation)');
  }
  return violations;
}

/**
 * @param {string} code
 * @param {string[]} topLevelDoBodies
 * @param {string[]} functionBodies
 * @returns {string[]}
 */
export function findUnexpandableDynamicSqlViolations(
  code,
  topLevelDoBodies = [],
  functionBodies = [],
) {
  /** @type {string[]} */
  const violations = [];
  for (const body of topLevelDoBodies) {
    violations.push(...auditTopLevelDoBody(body));
  }
  const stripped = stripPlpgsqlBodies(code, [...functionBodies, ...topLevelDoBodies]);
  if (/\bdo\s+\$\$/i.test(stripped) || /\bdo\s+language\s+plpgsql\s+\$\$/i.test(stripped)) {
    violations.push('unexpandable dynamic SQL (DO $$ anonymous block)');
  }
  if (/\bexecute\s+[a-z_][a-z0-9_]*\s*;/i.test(stripped)) {
    violations.push('unexpandable dynamic SQL (EXECUTE variable)');
  }
  return [...new Set(violations)];
}

/**
 * @param {string} body
 * @returns {{ start: number, end: number }[]}
 */
function foreachRegionsOutsideIf(body) {
  /** @type {{ start: number, end: number }[]} */
  const regions = [];
  let ifDepth = 0;
  let i = 0;
  const lower = body.toLowerCase();
  while (i < body.length) {
    const slice = lower.slice(i);
    const endIf = /^end\s+if\b/.exec(slice);
    if (endIf) {
      ifDepth = Math.max(0, ifDepth - 1);
      i += endIf[0].length;
      continue;
    }
    const elsif = /^elsif\b/.exec(slice);
    if (elsif) {
      i += elsif[0].length;
      continue;
    }
    const ifKw = /^if\b/.exec(slice);
    if (ifKw) {
      const after = slice.slice(ifKw[0].length);
      if (/^\s+exists\b/.test(after) || /^\s+not\s+exists\b/.test(after)) {
        i += ifKw[0].length;
        continue;
      }
      ifDepth += 1;
      i += ifKw[0].length;
      continue;
    }
    const fe = /^foreach\s+[a-z_][a-z0-9_]*\s+in\s+array\s+array\s*\[/i.exec(slice);
    if (fe && ifDepth === 0) {
      const start = i;
      const endLoop = /\bend\s+loop\s*;/i.exec(slice);
      if (!endLoop) break;
      i += endLoop.index + endLoop[0].length;
      regions.push({ start, end: i });
      continue;
    }
    i += 1;
  }
  return regions;
}

/**
 * @param {string} region
 * @returns {string[]}
 */
function parseForeachArrayNames(region) {
  const arrayMatch = /FOREACH\s+\w+\s+IN\s+ARRAY\s+ARRAY\s*\[([\s\S]*?)\]\s*LOOP/i.exec(region);
  if (!arrayMatch) return [];
  /** @type {string[]} */
  const names = [];
  for (const tokenMatch of arrayMatch[1].matchAll(/«S([0-9a-f]+)»/gi)) {
    const decoded = Buffer.from(tokenMatch[1], 'hex').toString('utf8');
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(decoded)) names.push(decoded);
  }
  return names;
}

/**
 * @param {string} sanitizedCode
 * @param {string[]} [topLevelDoBodies]
 * @returns {{ expanded: string, violations: string[] }}
 */
export function expandForeachExecuteFormatSql(
  sanitizedCode,
  topLevelDoBodies = [],
  functionBodies = [],
) {
  /** @type {string[]} */
  const statements = [];
  /** @type {string[]} */
  const violations = findUnexpandableDynamicSqlViolations(
    sanitizedCode,
    topLevelDoBodies,
    functionBodies,
  );

  for (const body of topLevelDoBodies) {
    for (const { start, end } of foreachRegionsOutsideIf(body)) {
      const region = body.slice(start, end);
      const loopVarMatch = /FOREACH\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+IN/i.exec(region);
      if (!loopVarMatch) continue;
      const loopVar = loopVarMatch[1];
      const names = parseForeachArrayNames(region);
      if (!names.length) continue;

      const execRe = new RegExp(
        String.raw`EXECUTE\s+FORMAT\s*\(\s*«S([0-9a-f]+)»\s*,\s*${loopVar}\s*\)`,
        'gi',
      );
      let execMatch;
      while ((execMatch = execRe.exec(region))) {
        const formatSql = Buffer.from(execMatch[1], 'hex').toString('utf8');
        if (/%[sSL]/i.test(formatSql)) {
          violations.push('unexpandable dynamic SQL (EXECUTE format with %s or %L)');
          continue;
        }
        if (!/%I/.test(formatSql)) {
          violations.push('unexpandable dynamic SQL (EXECUTE format without %I)');
          continue;
        }
        for (const name of names) {
          statements.push(formatSql.replace(/%I/g, name));
        }
      }
    }
  }

  return {
    expanded: statements.length ? statements.join(';\n') : '',
    violations,
  };
}

/**
 * @param {string} grantOn
 */
function splitGrantTableList(grantOn) {
  /** @type {string[]} */
  const parts = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < grantOn.length; i++) {
    const ch = grantOn[i];
    if (ch === '«') {
      const close = grantOn.indexOf('»', i);
      if (close === -1) {
        current += ch;
        continue;
      }
      current += grantOn.slice(i, close + 1);
      i = close;
      continue;
    }
    if (ch === '"') {
      if (inQuote && grantOn[i + 1] === '"') {
        current += '""';
        i += 1;
        continue;
      }
      inQuote = !inQuote;
      current += ch;
      continue;
    }
    if (ch === ',' && !inQuote) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * @param {string} grantOn
 */
function parseGrantOnTables(grantOn) {
  let normalized = grantOn.replace(/\s+/g, ' ').trim();
  normalized = normalized.replace(/^table\s+/i, '');
  if (/^all\s+tables\s+in\s+schema\b/i.test(normalized)) return [];
  /** @type {{ schema: string, name: string }[]} */
  const tables = [];
  for (const piece of splitGrantTableList(normalized)) {
    const parsed = parseQualifiedTableRef(piece);
    if (parsed) tables.push(parsed);
  }
  return tables;
}

/**
 * @param {string} privilegeList
 */
function parseGrantPrivileges(privilegeList) {
  const privs = new Set();
  const lower = privilegeList.replace(/\s+/g, ' ').trim().toLowerCase();
  if (/^(all privileges|all)$/.test(lower)) {
    privs.add('truncate');
    for (const p of REQUIRED_PRIVILEGES) privs.add(p);
    return privs;
  }
  for (const piece of lower.split(',')) {
    let part = piece.trim();
    if (!part) continue;
    const paren = part.indexOf('(');
    if (paren !== -1) part = part.slice(0, paren).trim();
    if (!part) continue;
    for (const p of [...REQUIRED_PRIVILEGES, 'truncate']) {
      if (new RegExp(`\\b${p}\\b`).test(part)) privs.add(p);
    }
  }
  return privs;
}

/**
 * @param {string} clause
 */
function parseClientRolesFromClause(clause) {
  const roles = new Set();
  const lower = clause.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!/\bto\s+/.test(lower)) {
    for (const role of CLIENT_EXPOSED_ROLES) roles.add(role);
    return roles;
  }
  if (/\bto\s+public\b/.test(lower)) roles.add('public');
  for (const role of CLIENT_EXPOSED_ROLES) {
    if (new RegExp(`\\bto\\s+[^;]*\\b${role}\\b`).test(lower)) roles.add(role);
  }
  for (const tokenMatch of clause.matchAll(/«Q([0-9a-f]+)»/gi)) {
    const decoded = Buffer.from(tokenMatch[1], 'hex').toString('utf8').toLowerCase();
    if (CLIENT_EXPOSED_ROLES.includes(decoded)) roles.add(decoded);
  }
  for (const tokenMatch of clause.matchAll(/"([^"]+)"/g)) {
    const decoded = tokenMatch[1].replace(/""/g, '"').toLowerCase();
    if (CLIENT_EXPOSED_ROLES.includes(decoded)) roles.add(decoded);
  }
  return roles;
}

/**
 * @param {string} toClause
 */
function parseGrantRoleSet(toClause) {
  /** @type {Set<string>} */
  const roles = new Set();
  const clause = toClause.replace(/\s+/g, ' ').trim();
  const grantRoles = [...REQUIRED_ROLES, ...CLIENT_EXPOSED_ROLES];
  const lower = clause.toLowerCase();
  for (const role of grantRoles) {
    if (new RegExp(`(?:^|[,\\s])${role}(?:[,\\s]|$)`).test(lower)) roles.add(role);
  }
  for (const tokenMatch of clause.matchAll(/«Q([0-9a-f]+)»/gi)) {
    const decoded = Buffer.from(tokenMatch[1], 'hex').toString('utf8').toLowerCase();
    if (grantRoles.includes(decoded)) roles.add(decoded);
  }
  for (const tokenMatch of clause.matchAll(/"([^"]+)"/g)) {
    const decoded = tokenMatch[1].replace(/""/g, '"').toLowerCase();
    if (grantRoles.includes(decoded)) roles.add(decoded);
  }
  return roles;
}

/**
 * @param {string} code
 * @param {string} schema
 * @param {string} tableName
 */
function grantsByRoleForTable(code, schema, tableName) {
  /** @type {Map<string, Set<string>>} */
  const byRole = new Map([...REQUIRED_ROLES, 'anon', 'public'].map((r) => [r, new Set()]));
  const re = /\bgrant\s+([^;]+?)\s+on\s+([^;]+?)\s+to\s+([^;]+)/gi;
  let match;
  while ((match = re.exec(code))) {
    const onTables = parseGrantOnTables(match[2]);
    if (!onTables.some((t) => t.schema === schema && t.name === tableName)) continue;
    const privs = parseGrantPrivileges(match[1]);
    const roles = parseGrantRoleSet(match[3]);
    for (const role of roles) {
      const bucket = byRole.get(role);
      if (!bucket) continue;
      for (const p of privs) bucket.add(p);
    }
  }
  return byRole;
}

/**
 * @param {string} expr
 */
function isAlwaysTrueExpression(expr) {
  const e = expr.replace(/\s+/g, ' ').trim().toLowerCase();
  return (
    e === 'true' ||
    e === "'t'" ||
    e === '1=1' ||
    e === 'not false' ||
    e === '(true)' ||
    e === '(1=1)'
  );
}

/**
 * @param {string} expr
 */
function isOrDisjunctionWithConstantTrue(expr) {
  const parts = splitTopLevelOr(expr.replace(/\s+/g, ' ').trim());
  return parts.some((part) => isAlwaysTrueExpression(part) || /^true$/i.test(part.trim()));
}

function isTrivialClientWriteExpression(expr) {
  const e = expr.replace(/\s+/g, ' ').trim();
  const lower = e.toLowerCase();
  if (isAlwaysTrueExpression(e)) return true;
  if (isOrDisjunctionWithConstantTrue(e)) return true;
  if (/\btrue\b/.test(lower) && /\bor\b/.test(lower)) return true;
  if (/\bauth\.uid\s*\(\s*\)\s+is\s+not\s+null/i.test(e)) return true;
  if (/\bauth\.role\s*\(/i.test(e)) return true;
  if (/^\(?\s*exists\s*\(\s*select\s+1\s*\)\s*\)?$/i.test(e)) return true;
  return false;
}

/**
 * @param {string} expr
 */
function isStrictAuthScopeExpression(expr) {
  const e = expr.replace(/\s+/g, ' ').trim();
  if (!e || isTrivialClientWriteExpression(e)) return false;
  if (/\bprivate\.auth_is_[a-z0-9_]+\s*\(/i.test(e)) return true;
  if (/\bexists\s*\(\s*select\s+1\s+from\b/i.test(e)) return true;
  if (
    /[a-z_][a-z0-9_]*\s*=\s*(\(\s*select\s+)?auth\.uid\s*\(/i.test(e) &&
    !/\bauth\.role\s*\(/i.test(e)
  ) {
    return true;
  }
  if (/\bor\b/i.test(e)) {
    if (isOrDisjunctionWithConstantTrue(e)) return false;
    const parts = splitTopLevelOr(e);
    return parts.length > 0 && parts.every((part) => isStrictAuthScopeExpression(part));
  }
  return false;
}

/**
 * @param {string} clause lowercased policy text
 */
function policyWriteActionIsOverlyBroad(clause) {
  const clientRoles = parseClientRolesFromClause(clause);
  if (!clientRoles.size) return false;
  const forMatch = /\bfor\s+(all|insert|update|delete|select)\b/.exec(clause);
  if (forMatch?.[1] === 'select' && !/\bfor\s+(insert|update|delete|all)\b/.test(clause)) {
    return false;
  }

  let action = forMatch?.[1] ?? 'all';
  if (action === 'select') return false;

  const usingExpr = extractPolicyPredicateExpression(clause, 'using');
  const checkExpr = extractPolicyPredicateExpression(clause, 'with check');

  if (action === 'insert') {
    if (!checkExpr) return true;
    return !isStrictAuthScopeExpression(checkExpr);
  }

  const usingOk = usingExpr ? isStrictAuthScopeExpression(usingExpr) : false;
  const checkOk = checkExpr ? isStrictAuthScopeExpression(checkExpr) : false;
  if (action === 'all' || action === 'update' || action === 'delete') {
    if (usingExpr && !usingOk) return true;
    if (checkExpr && !checkOk) return true;
    if (!usingExpr && !checkExpr) return true;
    return false;
  }
  return true;
}

/**
 * @param {string} code
 * @param {string} schema
 * @param {string} tableName
 */
function findBroadWritePolicyViolations(code, schema, tableName) {
  const ref = tableReferencePattern(schema, tableName);
  const policyName = `(?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*)`;
  const re = new RegExp(
    `\\b(?:create|alter)\\s+policy\\s+${policyName}\\s+on\\s+${ref}(?=\\s|;|$)([^;]*)`,
    'gi',
  );
  /** @type {string[]} */
  const violations = [];
  let match;
  while ((match = re.exec(code))) {
    const clause = (match[0] + match[1]).replace(/\s+/g, ' ').trim().toLowerCase();
    if (policyWriteActionIsOverlyBroad(clause)) {
      violations.push(
        `${schema}.${tableName}: overly broad write policy for anon/authenticated (PostgREST direct-write risk)`,
      );
      return violations;
    }
  }
  return violations;
}

function hasEnableRls(code, schema, tableName) {
  const ref = tableReferencePattern(schema, tableName);
  return new RegExp(
    `\\balter\\s+table\\s+(?:only\\s+)?(?:if\\s+exists\\s+)?${ref}(?=\\s|;|$)\\s+enable\\s+row\\s+level\\s+security\\b`,
    'i',
  ).test(code);
}

function hasCreatePolicy(code, schema, tableName) {
  const ref = tableReferencePattern(schema, tableName);
  const policyName = `(?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*)`;
  return new RegExp(`\\bcreate\\s+policy\\s+${policyName}\\s+on\\s+${ref}(?=\\s|;|$)`, 'i').test(
    code,
  );
}

/**
 * @param {string} code
 */
function collectReferencedPublicTables(code) {
  /** @type {Map<string, { schema: string, name: string }>} */
  const tables = new Map();
  const add = (parsed) => {
    if (!parsed || parsed.schema !== 'public') return;
    tables.set(`${parsed.schema}.${parsed.name}`, parsed);
  };

  forEachCreateTableRef(code, (parsed) => add(parsed));
  let m;

  const alterRe =
    /\balter\s+table\s+(?:only\s+)?(?:if\s+exists\s+)?((?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*)(?:\s*\.\s*(?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*))?)/gi;
  while ((m = alterRe.exec(code))) add(parseQualifiedTableRef(m[1]));

  const policyRe =
    /\bcreate\s+policy\s+(?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*)\s+on\s+((?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*)(?:\s*\.\s*(?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*))?)/gi;
  while ((m = policyRe.exec(code))) add(parseQualifiedTableRef(m[1]));

  const grantRe = /\bgrant\s+[^;]+\s+on\s+([^;]+?)\s+to\s+/gi;
  while ((m = grantRe.exec(code))) {
    for (const t of parseGrantOnTables(m[1])) add(t);
  }

  return [...tables.values()];
}

/**
 * @param {string} code
 * @param {string} schema
 * @param {string} tableName
 */
function findRlsStateViolations(code, schema, tableName) {
  const ref = tableReferencePattern(schema, tableName);
  const enableRe = new RegExp(
    `\\balter\\s+table\\s+(?:only\\s+)?(?:if\\s+exists\\s+)?${ref}(?=\\s|;|$)\\s+enable\\s+row\\s+level\\s+security\\b`,
    'gi',
  );
  const disableRe = new RegExp(
    `\\balter\\s+table\\s+(?:only\\s+)?(?:if\\s+exists\\s+)?${ref}(?=\\s|;|$)\\s+disable\\s+row\\s+level\\s+security\\b`,
    'gi',
  );
  let lastEnable = -1;
  let lastDisable = -1;
  for (const m of code.matchAll(enableRe)) lastEnable = Math.max(lastEnable, m.index ?? 0);
  for (const m of code.matchAll(disableRe)) lastDisable = Math.max(lastDisable, m.index ?? 0);
  /** @type {string[]} */
  const out = [];
  const key = `${schema}.${tableName}`;
  if (lastDisable >= 0 && lastDisable > lastEnable) {
    out.push(`${key}: DISABLE ROW LEVEL SECURITY in the same file`);
  }
  return out;
}

/**
 * @param {string} code
 * @param {string} schema
 * @param {string} tableName
 */
function findClientWriteGrantViolations(code, schema, tableName) {
  const grants = grantsByRoleForTable(code, schema, tableName);
  const key = `${schema}.${tableName}`;
  /** @type {string[]} */
  const out = [];
  for (const role of CLIENT_EXPOSED_ROLES) {
    const held = grants.get(role) ?? new Set();
    if (role === 'authenticated' || role === 'public') {
      if (held.has('truncate')) {
        out.push(`${key}: GRANT TRUNCATE TO ${role} is not allowed (TRUNCATE bypasses RLS)`);
      }
    }
    if (role === 'anon' || role === 'public') {
      const writes = ['insert', 'update', 'delete', 'truncate'].filter((p) => held.has(p));
      if (writes.length) {
        out.push(
          `${key}: GRANT ${writes.join(', ').toUpperCase()} TO ${role} is not allowed (SELECT only for ${role})`,
        );
      }
    }
  }
  return out;
}

/**
 * @param {string} sql
 * @returns {string[]}
 */
/**
 * @param {string} code
 */
function findSchemaWideGrantViolations(code) {
  const re = /\bgrant\s+([^;]+?)\s+on\s+all\s+tables\s+in\s+schema\s+([^;\s]+)\s+to\s+([^;]+)/gi;
  /** @type {string[]} */
  const out = [];
  let match;
  while ((match = re.exec(code))) {
    const privs = parseGrantPrivileges(match[1]);
    const roles = parseGrantRoleSet(match[3]);
    const writes = ['insert', 'update', 'delete', 'truncate'].filter((p) => privs.has(p));
    for (const role of roles) {
      if (role === 'anon' || role === 'public') {
        if (writes.length || privs.has('all')) {
          out.push(
            `schema ${match[2].trim()}: GRANT on ALL TABLES IN SCHEMA to ${role} must not include writes (found ${writes.join(', ') || 'ALL'})`,
          );
        }
      }
    }
  }
  return out;
}

export function buildEffectiveSanitizedCode(sql) {
  const { code: sanitized, topLevelDoBodies, functionBodies } = sanitizeSql(sql);
  const { expanded, violations: expandViolations } = expandForeachExecuteFormatSql(
    sanitized,
    topLevelDoBodies,
    functionBodies,
  );
  if (expandViolations.length) {
    return { code: sanitized, violations: expandViolations, functionBodies, topLevelDoBodies };
  }
  let code = sanitized;
  if (expanded) {
    const reSanitized = sqlCodeWithoutCommentsAndLiterals(expanded);
    code = `${sanitized};\n${reSanitized}`;
  }
  return { code, violations: [], functionBodies, topLevelDoBodies };
}

/**
 * @param {string} sql raw file
 * @returns {string[]}
 */
export function findSqlFileViolations(sql) {
  const {
    code,
    violations: pre,
    functionBodies = [],
    topLevelDoBodies = [],
  } = buildEffectiveSanitizedCode(sql);
  if (pre.length) return pre;

  /** @type {string[]} */
  const unexpandable = findUnexpandableDynamicSqlViolations(code, topLevelDoBodies, functionBodies);
  if (unexpandable.length) return unexpandable;

  /** @type {string[]} */
  const violations = [];
  const targets = extractCreateTableTargets(code);
  const seen = new Set();

  for (const { schema, name } of targets) {
    const key = `${schema}.${name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (schema === 'public') {
      violations.push(...findRlsStateViolations(code, schema, name));
      if (!hasEnableRls(code, schema, name)) {
        violations.push(`${key}: missing ENABLE ROW LEVEL SECURITY in the same file`);
      }
      if (!hasCreatePolicy(code, schema, name)) {
        violations.push(`${key}: missing CREATE POLICY in the same file`);
      }
      violations.push(...findBroadWritePolicyViolations(code, schema, name));
    }

    for (const role of REQUIRED_ROLES) {
      const grants = grantsByRoleForTable(code, schema, name);
      const held = grants.get(role) ?? new Set();
      const missing = REQUIRED_PRIVILEGES.filter((p) => !held.has(p));
      if (missing.length) {
        violations.push(
          `${key}: GRANT missing ${missing.join(', ').toUpperCase()} TO ${role} in the same file`,
        );
      }
    }
  }

  violations.push(...findSchemaWideGrantViolations(code));

  for (const { schema, name } of collectReferencedPublicTables(code)) {
    if (seen.has(`${schema}.${name}`)) continue;
    violations.push(...findRlsStateViolations(code, schema, name));
    violations.push(...findClientWriteGrantViolations(code, schema, name));
    if (!targets.some((t) => t.schema === schema && t.name === name)) {
      violations.push(...findBroadWritePolicyViolations(code, schema, name));
    }
  }

  return [...new Set(violations)];
}

export function findCreateTableSetupViolations(sql) {
  return findSqlFileViolations(sql);
}

export function sqlDefinesCreateTableWithoutGrant(sql) {
  return findSqlFileViolations(sql).length > 0;
}
