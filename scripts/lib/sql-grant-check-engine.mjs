/**
 * SQL grant / RLS / policy static analysis for migrations.
 * @see scripts/check-sql-table-grants.mjs
 */
import { normalizeSqlStatement } from './sql-grant-check-baseline.mjs';

/**
 * @typedef {{ reason: string, statement: string }} SqlGrantCheckViolation
 */

/**
 * @param {string | SqlGrantCheckViolation} item
 * @returns {SqlGrantCheckViolation}
 */
function asSqlGrantViolation(item) {
  if (typeof item === 'string') return { reason: item, statement: '' };
  return {
    reason: item.reason,
    statement: item.statement ? normalizeSqlStatement(item.statement) : '',
  };
}

/**
 * @param {(string | SqlGrantCheckViolation)[]} list
 * @returns {SqlGrantCheckViolation[]}
 */
function finalizeSqlGrantViolations(list) {
  const seen = new Set();
  /** @type {SqlGrantCheckViolation[]} */
  const out = [];
  for (const raw of list) {
    const v = asSqlGrantViolation(raw);
    const key = `${v.reason}\0${v.statement}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

export const REQUIRED_PRIVILEGES = ['select', 'insert', 'update', 'delete'];
export const AUTHENTICATED_REQUIRED_PRIVILEGES = ['select'];
export const SERVICE_ROLE_REQUIRED_PRIVILEGES = ['select', 'insert', 'update', 'delete'];
export const REQUIRED_ROLES = ['authenticated', 'service_role'];
export const CLIENT_EXPOSED_ROLES = ['anon', 'authenticated', 'public'];

/** Explicit private helpers allowed in client write policy predicates (full names). */
export const ALLOWED_PRIVATE_AUTH_HELPERS = new Set([
  'private.auth_is_vtt_campaign_owner',
  'private.auth_is_vtt_campaign_participant',
]);

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

/**
 * @param {string} expr
 * @returns {string[]}
 */
function splitTopLevelAnd(expr) {
  /** @type {string[]} */
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < expr.length; i += 1) {
    if (expr[i] === '(') depth += 1;
    else if (expr[i] === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0) {
      const andMatch = /^\s+and\b/i.exec(expr.slice(i));
      if (andMatch) {
        parts.push(expr.slice(start, i).trim());
        i += andMatch[0].length - 1;
        start = i + 1;
      }
    }
  }
  parts.push(expr.slice(start).trim());
  return parts.filter(Boolean);
}

/** @param {string} expr */
function normalizePredicateExpr(expr) {
  let e = expr.replace(/\s+/g, ' ').trim();
  while (e.startsWith('(') && e.endsWith(')')) {
    const inner = readBalancedParenContent(e, 0);
    if (inner === null || inner.length !== e.length - 2) break;
    e = inner.trim();
  }
  return e;
}

/** @param {string} rhs */
function rhsIsAuthUid(rhs) {
  const r = normalizePredicateExpr(rhs);
  if (/^'(?:''|[^'])*'\s*::/i.test(r)) return false;
  if (/^auth\.uid\s*\(\s*\)$/i.test(r)) return true;
  if (/^\(\s*select\s+auth\.uid\s*\(\s*\)\s*\)$/i.test(r)) return true;
  if (/^\(\s*select\s+auth\.uid\s*\(\s*\)\s*\)\s*::[a-z0-9_]+\s*$/i.test(r)) return true;
  if (/^\(\s*\(\s*select\s+auth\.uid\s*\(\s*\)\s*\)\s*::[a-z0-9_]+\s*\)$/i.test(r)) return true;
  return false;
}

/** @param {string} conjunct */
function isBenignAndConjunct(conjunct) {
  const e = normalizePredicateExpr(conjunct).toLowerCase().replace(/\s+/g, '');
  return e === 'true' || e === '1=1' || e === '(true)' || e === '(1=1)';
}

/** @param {string} expr */
function isAllowedUidColumnEquality(expr) {
  const e = normalizePredicateExpr(expr);
  if (/auth\.uid\s*\(\s*\)\s*=\s*auth\.uid/i.test(e.replace(/\s+/g, ''))) return false;
  if (/^'(?:''|[^'])*'\s*::/i.test(e)) return false;
  const eq = /^([a-z_][a-z0-9_.]*)\s*=\s*(.+)$/i.exec(e);
  if (eq && !/::/.test(eq[1]) && !/^auth\.uid/i.test(eq[1])) return rhsIsAuthUid(eq[2]);
  const eqRev = /^(.+)\s*=\s*([a-z_][a-z0-9_.]*)$/i.exec(e);
  if (eqRev && !/::/.test(eqRev[2]) && !/^auth\.uid/i.test(eqRev[2])) return rhsIsAuthUid(eqRev[1]);
  return false;
}

/** @param {string} expr */
function isAllowedPrivateHelperCall(expr) {
  const e = normalizePredicateExpr(expr);
  const match = /^(private\.auth_is_[a-z0-9_]+)\s*\([^)]*\)\s*$/i.exec(e);
  if (!match) return false;
  return ALLOWED_PRIVATE_AUTH_HELPERS.has(match[1].toLowerCase());
}

/** @param {string} conjunct */
function isBenignColumnJoinConjunct(conjunct) {
  const e = normalizePredicateExpr(conjunct);
  return /^[a-z_][a-z0-9_.]*\s*=\s*[a-z_][a-z0-9_.]*$/i.test(e);
}

/** @param {string} whereExpr */
function isAllowlistedWhereExpression(whereExpr) {
  const e = normalizePredicateExpr(whereExpr);
  if (/\bor\b/i.test(e)) {
    return splitTopLevelOr(e).every((part) => isAllowlistedWhereExpression(part));
  }
  const conjuncts = splitTopLevelAnd(e);
  if (!conjuncts.length) return false;
  const hasAnchor = conjuncts.some(
    (c) => isAllowedUidColumnEquality(c) || isAllowedPrivateHelperCall(c),
  );
  if (!hasAnchor) return false;
  return conjuncts.every(
    (c) =>
      isAllowedUidColumnEquality(c) ||
      isAllowedPrivateHelperCall(c) ||
      isBenignColumnJoinConjunct(c),
  );
}

/** @param {string} expr */
function isAllowedExistsSubquery(expr) {
  const e = normalizePredicateExpr(expr);
  if (!/^exists\s*\(\s*select\b/i.test(e)) return false;
  const open = e.toLowerCase().indexOf('(');
  const inner = readBalancedParenContent(e, open);
  if (!inner) return false;
  const whereMatch = /\bwhere\b/i.exec(inner);
  if (!whereMatch) return false;
  const whereExpr = inner.slice(whereMatch.index + whereMatch[0].length).trim();
  return isAllowlistedWhereExpression(whereExpr);
}

/**
 * Allowlisted client write predicate (fail closed).
 * @param {string} expr
 */
export function isAllowlistedWritePolicyPredicate(expr) {
  if (!expr?.trim()) return false;
  const e = normalizePredicateExpr(expr);
  if (/\bor\b/i.test(e)) {
    return splitTopLevelOr(e).every((part) => isAllowlistedWritePolicyPredicate(part));
  }
  if (isAllowedUidColumnEquality(e) || isAllowedPrivateHelperCall(e)) return true;
  if (isAllowedExistsSubquery(e)) return true;
  const conjuncts = splitTopLevelAnd(e);
  if (conjuncts.length <= 1) return false;
  const hasAnchor = conjuncts.some(
    (c) =>
      isAllowedUidColumnEquality(c) || isAllowedPrivateHelperCall(c) || isAllowedExistsSubquery(c),
  );
  if (!hasAnchor) return false;
  return conjuncts.every(
    (c) =>
      isAllowedUidColumnEquality(c) ||
      isAllowedPrivateHelperCall(c) ||
      isAllowedExistsSubquery(c) ||
      isBenignAndConjunct(c),
  );
}

/**
 * @param {string} body
 */
function mergeExpandedAfterForeachDoBodies(sanitized, bodies, expandedSql) {
  if (!expandedSql) return sanitized;
  let code = sanitized;
  let searchFrom = 0;
  for (const body of bodies) {
    if (!/\bforeach\b/i.test(body) || !/\bexecute\s+format\b/i.test(body)) continue;
    const idx = code.indexOf(body, searchFrom);
    if (idx === -1) continue;
    const insertAt = idx + body.length;
    code = `${code.slice(0, insertAt)};\n${expandedSql}${code.slice(insertAt)}`;
    searchFrom = insertAt + expandedSql.length + 2;
  }
  return code;
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
/**
 * @param {string} formatSql
 */
function isAllowedForeachFormatLiteral(formatSql) {
  if (/%(?!I)[a-z%]/i.test(formatSql)) return false;
  return /%I/.test(formatSql);
}

/**
 * @param {string} body
 */
function isAllowedForeachDoBlock(body) {
  if (!/\bforeach\s+[a-z_][a-z0-9_]*\s+in\s+array\s+array\b/i.test(body)) return false;
  if (/\bfor\s+[a-z_][a-z0-9_]*\s+in\s+select\b/i.test(body)) return false;
  const execMatches = [
    ...body.matchAll(
      /\bexecute\s+format\s*\(\s*[\s\r\n]*«S([0-9a-f]+)»\s*,\s*([a-z_][a-z0-9_]*)\s*\)/gis,
    ),
  ];
  for (const match of execMatches) {
    const formatSql = Buffer.from(match[1], 'hex').toString('utf8');
    if (!isAllowedForeachFormatLiteral(formatSql)) return false;
  }
  const anyExec = /\bexecute\b/i.test(body);
  if (!anyExec) return !/\bloop\b/i.test(body);
  const rawExecCount = (body.match(/\bexecute\b/gi) ?? []).length;
  if (rawExecCount !== execMatches.length) return false;
  return execMatches.length > 0;
}

function auditTopLevelDoBody(body) {
  /** @type {string[]} */
  const violations = [];
  if (!/\bexecute\b/i.test(body)) return violations;
  if (isAllowedForeachDoBlock(body)) return violations;
  if (/\bexecute\b/i.test(body)) {
    violations.push('unexpandable dynamic SQL (EXECUTE not in allowed FOREACH format form)');
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
  if (/\bdo\s+language\s+plpgsql\b/i.test(code)) {
    violations.push('unexpandable dynamic SQL (DO LANGUAGE plpgsql)');
  }
  for (const body of topLevelDoBodies) {
    violations.push(...auditTopLevelDoBody(body));
  }
  const stripped = stripPlpgsqlBodies(code, [...functionBodies, ...topLevelDoBodies]);
  const withoutGrantExecute = stripped.replace(/\bgrant\b[^;\n]*\bexecute\b[^;\n]*/gi, ' ');
  if (/\bexecute\s+(?:format\s*\(|'|«S|[a-z_][a-z0-9_$]*\s*;)/i.test(withoutGrantExecute)) {
    violations.push('unexpandable dynamic SQL (EXECUTE outside allowed DO FOREACH)');
  }
  return [...new Set(violations)];
}

/**
 * @param {string} sql
 * @returns {string[]}
 */
function extractRawDollarBodyAfterKeyword(sql, keywordIndex) {
  const slice = sql.slice(keywordIndex);
  const tagMatch = /^\s*(\$[A-Za-z0-9_]*\$)/.exec(slice);
  if (!tagMatch) return null;
  const tag = tagMatch[1];
  const bodyStart = keywordIndex + tagMatch[0].length;
  const closeIdx = sql.indexOf(tag, bodyStart);
  if (closeIdx === -1) return null;
  return { body: sql.slice(bodyStart, closeIdx), end: closeIdx + tag.length };
}

/**
 * @param {string} sql
 * @returns {string[]}
 */
function extractRawFunctionBodies(sql) {
  /** @type {string[]} */
  const bodies = [];
  const re = /\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/gi;
  let match;
  while ((match = re.exec(sql))) {
    const asIdx = sql.indexOf('AS', match.index);
    if (asIdx === -1) continue;
    const extracted = extractRawDollarBodyAfterKeyword(sql, asIdx + 2);
    if (!extracted) continue;
    bodies.push(extracted.body);
    re.lastIndex = extracted.end;
  }
  return bodies;
}

/**
 * @param {string} sql
 * @returns {string[]}
 */
function extractRawTopLevelDoBodies(sql) {
  /** @type {string[]} */
  const bodies = [];
  const re = /\bDO\b/gi;
  let match;
  while ((match = re.exec(sql))) {
    const extracted = extractRawDollarBodyAfterKeyword(sql, match.index + match[0].length);
    if (!extracted) continue;
    bodies.push(extracted.body);
    re.lastIndex = extracted.end;
  }
  return bodies;
}

/**
 * @param {string} rawBody
 * @param {string} varName
 * @returns {string[]}
 */
function parseDeclareTextArrayNames(rawBody, varName) {
  const re = new RegExp(
    String.raw`\b${varName}\s+text\s*\[\]\s*:=\s*ARRAY\s*\[([\s\S]*?)\]\s*;`,
    'i',
  );
  const match = re.exec(rawBody);
  if (!match) return [];
  /** @type {string[]} */
  const names = [];
  for (const sm of match[1].matchAll(/'((?:''|[^'])*)'/g)) {
    const decoded = sm[1].replace(/''/g, "'");
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(decoded)) names.push(decoded);
  }
  return names;
}

/**
 * @param {string} rawBody
 * @param {string} sanitizedRegion
 * @returns {string[]}
 */
function resolveForeachIterationNames(rawBody, sanitizedRegion) {
  const inline = parseForeachArrayNames(sanitizedRegion);
  if (inline.length) return inline;
  const foreachMatch =
    /FOREACH\s+[a-zA-Z_][a-zA-Z0-9_]*\s+IN\s+ARRAY\s+([a-zA-Z_][a-zA-Z0-9_]*)/i.exec(
      sanitizedRegion,
    );
  if (!foreachMatch) return [];
  return parseDeclareTextArrayNames(rawBody, foreachMatch[1]);
}

/**
 * @param {string} body
 * @param {string} rawBody
 * @returns {{ statements: string[], executeExpandSpans: string[] }}
 */
function expandPlainLiteralExecutes(body, rawBody) {
  /** @type {string[]} */
  const statements = [];
  /** @type {string[]} */
  const executeExpandSpans = [];
  const sanRe = /\bEXECUTE\s+«S([0-9a-f]+)»\s*;/gi;
  let sanMatch;
  while ((sanMatch = sanRe.exec(body))) {
    const literalSql = Buffer.from(sanMatch[1], 'hex').toString('utf8').trim();
    if (/[%]/.test(literalSql) && /\bformat\s*\(/i.test(literalSql)) continue;
    statements.push(literalSql);
    executeExpandSpans.push(sanMatch[0]);
  }
  const rawRe = /\bEXECUTE\s+((?:'(?:''|[^'])*'|\$[a-zA-Z0-9_]*\$[\s\S]*?\$[a-zA-Z0-9_]*\$))\s*;/gi;
  let rawMatch;
  while ((rawMatch = rawRe.exec(rawBody))) {
    const frag = rawMatch[1].trim();
    if (/^\s*format\s*\(/i.test(frag) || /^\s*[a-z_][a-z0-9_]*\s*$/i.test(frag)) continue;
    let literal = '';
    if (frag.startsWith("'")) {
      literal = frag.slice(1, -1).replace(/''/g, "'").trim();
    } else {
      const delim = frag.match(/^\$([a-zA-Z0-9_]*)\$/);
      if (!delim) continue;
      const close = `$${delim[1]}$`;
      const end = frag.lastIndexOf(close);
      if (end <= delim[0].length) continue;
      literal = frag.slice(delim[0].length, end).trim();
    }
    if (!literal || /\bformat\s*\(/i.test(literal)) continue;
    statements.push(literal);
  }
  return { statements, executeExpandSpans };
}

/**
 * @param {string} body
 * @param {string} rawBody
 * @returns {{ statements: string[], executeExpandSpans: string[] }}
 */
function expandForeachExecuteFormatInBody(body, rawBody, { parseFormatFromRaw = false } = {}) {
  /** @type {string[]} */
  const statements = [];
  /** @type {string[]} */
  const executeExpandSpans = [];
  /** @type {string[]} */
  const rawRemovedSpans = [];
  const parseBody = parseFormatFromRaw ? rawBody : body;
  const nameSourceBody = rawBody || body;
  for (const { start, end } of foreachRegionsOutsideIf(parseBody)) {
    const region = parseBody.slice(start, end);
    const loopVarMatch = /FOREACH\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+IN/i.exec(region);
    if (!loopVarMatch) continue;
    const loopVar = loopVarMatch[1];
    const names = resolveForeachIterationNames(nameSourceBody, region);
    if (!names.length) continue;

    if (parseFormatFromRaw) {
      const execRe = new RegExp(
        String.raw`EXECUTE\s+format\s*\(\s*(\$[a-zA-Z0-9_]*\$)([\s\S]*)\1(?:\s*,\s*${loopVar})+\s*\)\s*INTO[\s\S]*?;`,
        'gi',
      );
      let execMatch;
      while ((execMatch = execRe.exec(region))) {
        const formatSql = execMatch[2];
        if (/%[sSL]/i.test(formatSql)) continue;
        if (!/%I/.test(formatSql)) continue;
        rawRemovedSpans.push(execMatch[0]);
        for (const name of names) {
          statements.push(formatSql.replace(/%I/g, name));
        }
      }
      continue;
    }

    const execRe = new RegExp(
      String.raw`EXECUTE\s+format\s*\(\s*[\s\r\n]*«S([0-9a-f]+)»(?:\s*,\s*${loopVar})+\s*\)`,
      'gis',
    );
    let execMatch;
    while ((execMatch = execRe.exec(region))) {
      const formatSql = Buffer.from(execMatch[1], 'hex').toString('utf8');
      if (/%[sSL]/i.test(formatSql)) continue;
      if (!/%I/.test(formatSql)) continue;
      executeExpandSpans.push(execMatch[0]);
      for (const name of names) {
        statements.push(formatSql.replace(/%I/g, name));
      }
    }
  }
  return { statements, executeExpandSpans, rawRemovedSpans };
}

/**
 * @param {string[]} functionBodies
 * @param {string[]} rawFunctionBodies
 * @param {string[][]} rawRemovedSpansByFunction
 * @returns {string[]}
 */
/**
 * @param {string} remainder
 * @returns {string[]}
 */
function extractUnexpandedExecuteStatements(remainder) {
  /** @type {string[]} */
  const statements = [];
  const re = /\bexecute\b[\s\S]*?;/gi;
  let match;
  while ((match = re.exec(remainder))) {
    const stmt = match[0].trim();
    if (/^execute\s+function\b/i.test(stmt)) continue;
    statements.push(stmt);
  }
  return statements;
}

function findUnexpandedExecuteInFunctionBodies(
  functionBodies,
  rawFunctionBodies,
  rawRemovedSpansByFunction,
) {
  /** @type {SqlGrantCheckViolation[]} */
  const violations = [];
  for (let i = 0; i < functionBodies.length; i++) {
    const raw = rawFunctionBodies[i] ?? '';
    let remainder = raw;
    for (const span of rawRemovedSpansByFunction[i] ?? []) {
      remainder = remainder.replace(span, '');
    }
    remainder = remainder.replace(/\bEXECUTE\s+FUNCTION\b/gi, '');
    for (const stmt of extractUnexpandedExecuteStatements(remainder)) {
      violations.push({
        reason: 'unexpandable dynamic SQL (EXECUTE in function body)',
        statement: normalizeSqlStatement(stmt),
      });
    }
  }
  return finalizeSqlGrantViolations(violations);
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
    const fe = /^foreach\s+[a-z_][a-z0-9_]*\s+in\s+array\s+(?:array\s*\[|[a-z_][a-z0-9_]*)\b/i.exec(
      slice,
    );
    if (fe) {
      const start = i;
      const endLoop = /\bend\s+loop\s*;/i.exec(slice);
      if (!endLoop) break;
      i += endLoop.index + endLoop[0].length;
      regions.push({ start, end: i });
      continue;
    }
    const ifKw = /(?:^|[\s;(])if\b/i.exec(slice);
    if (ifKw) {
      if (ifKw.index > 0) {
        i += 1;
        continue;
      }
      const after = slice.slice(ifKw.index + ifKw[0].length);
      if (/^\s+not\s+exists\b/i.test(after) || /^\s+exists\b/i.test(after)) {
        i += ifKw.index + ifKw[0].length;
        continue;
      }
      ifDepth += 1;
      i += ifKw.index + ifKw[0].length;
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
  { rawSql = '', rawDoBodies = [], rawFunctionBodies = [] } = {},
) {
  /** @type {string[]} */
  const statements = [];
  /** @type {string[]} */
  const violations = [];
  /** @type {string[]} */
  const executeExpandSpans = [];
  /** @type {string[][]} */
  const rawRemovedSpansByFunction = functionBodies.map(() => []);

  const absorb = (result, fnIndex = -1) => {
    statements.push(...result.statements);
    executeExpandSpans.push(...result.executeExpandSpans);
    if (fnIndex >= 0) {
      rawRemovedSpansByFunction[fnIndex].push(...(result.rawRemovedSpans ?? []));
    }
  };

  for (let i = 0; i < topLevelDoBodies.length; i++) {
    const body = topLevelDoBodies[i];
    const rawBody = rawDoBodies[i] ?? rawSql;
    absorb(expandForeachExecuteFormatInBody(body, rawBody));
    absorb(expandPlainLiteralExecutes(body, rawBody));
  }

  for (let i = 0; i < functionBodies.length; i++) {
    const body = functionBodies[i];
    const rawBody = rawFunctionBodies[i] ?? '';
    absorb(expandForeachExecuteFormatInBody(body, rawBody, { parseFormatFromRaw: true }), i);
    absorb(expandPlainLiteralExecutes(body, rawBody), i);
  }

  return {
    expanded: statements.length ? statements.join(';\n') : '',
    violations,
    executeExpandSpans,
    rawRemovedSpansByFunction,
    rawFunctionBodies,
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
 * @param {string} clause lowercased policy text
 */
function policyWriteActionIsOverlyBroad(clause) {
  const clientRoles = parseClientRolesFromClause(clause);
  if (!clientRoles.size) return false;
  const isAlter = /\balter\s+policy\b/.test(clause);
  const forMatch = /\bfor\s+(all|insert|update|delete|select)\b/.exec(clause);
  if (forMatch?.[1] === 'select' && !/\bfor\s+(insert|update|delete|all)\b/.test(clause)) {
    return false;
  }

  let action = forMatch?.[1] ?? 'all';
  if (action === 'select') return false;

  const usingExpr = extractPolicyPredicateExpression(clause, 'using');
  const checkExpr = extractPolicyPredicateExpression(clause, 'with check');

  if (isAlter && !usingExpr && !checkExpr) return false;

  if (action === 'insert') {
    if (!checkExpr) return true;
    return !isAllowlistedWritePolicyPredicate(checkExpr);
  }

  const usingOk = usingExpr ? isAllowlistedWritePolicyPredicate(usingExpr) : false;
  const checkOk = checkExpr ? isAllowlistedWritePolicyPredicate(checkExpr) : false;
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
function collectReferencedTables(code) {
  /** @type {Map<string, { schema: string, name: string }>} */
  const tables = new Map();
  const add = (parsed) => {
    if (!parsed) return;
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
  /** @type {{ idx: number, kind: 'enable' | 'disable' }[]} */
  const events = [];
  for (const m of code.matchAll(enableRe)) {
    events.push({ idx: m.index ?? 0, kind: 'enable' });
  }
  for (const m of code.matchAll(disableRe)) {
    events.push({ idx: m.index ?? 0, kind: 'disable' });
  }
  events.sort((a, b) => a.idx - b.idx);
  let lastKind = null;
  for (const ev of events) lastKind = ev.kind;
  /** @type {string[]} */
  const out = [];
  const key = `${schema}.${tableName}`;
  if (lastKind === 'disable') {
    out.push(`${key}: DISABLE ROW LEVEL SECURITY in the same file`);
  }
  return out;
}

/**
 * @param {string} code
 * @param {string} schema
 * @param {string} tableName
 */
/**
 * Fail closed: client-exposed roles may only receive SELECT (not TRUNCATE/ALL/writes).
 * @param {string} code
 */
/** @param {string} privilegeList */
function isAllPrivilegesGrant(privilegeList) {
  return /^(all privileges|all)$/i.test(privilegeList.replace(/\s+/g, ' ').trim());
}

/**
 * @param {Set<string>} privs
 * @param {string} privilegeListRaw
 */
function isAllowedClientRoleTableGrant(privs, privilegeListRaw) {
  if (isAllPrivilegesGrant(privilegeListRaw)) return false;
  if (privs.has('truncate')) return false;
  return [...privs].every((p) => p === 'select');
}

function findClientRoleGrantViolations(code) {
  const re = /\bgrant\s+([^;]+?)\s+on\s+([^;]+?)\s+to\s+([^;]+)/gi;
  /** @type {{ privilegeListRaw: string, privs: Set<string>, onClause: string, roles: Set<string>, grantText: string }[]} */
  const statements = [];
  let match;
  while ((match = re.exec(code))) {
    statements.push({
      privilegeListRaw: match[1],
      privs: parseGrantPrivileges(match[1]),
      onClause: match[2].trim(),
      roles: parseGrantRoleSet(match[3]),
      grantText: match[0],
    });
  }

  /** @type {SqlGrantCheckViolation[]} */
  const out = [];

  for (const { privilegeListRaw, privs, onClause, roles, grantText } of statements) {
    const target =
      parseGrantOnTables(onClause)
        .map((t) => `${t.schema}.${t.name}`)
        .join(', ') || onClause;
    const schemaWide = /^all\s+tables\s+in\s+schema\b/i.test(onClause);
    const nonSelect = [...privs].filter((p) => p !== 'select');
    const grantStatement = normalizeSqlStatement(grantText.replace(/;+\s*$/, ''));
    const grantRoles = [...roles];
    const clientRolesHere = grantRoles.filter((r) => CLIENT_EXPOSED_ROLES.includes(r));

    if (schemaWide) {
      for (const role of clientRolesHere) {
        if (nonSelect.length || isAllPrivilegesGrant(privilegeListRaw)) {
          out.push({
            reason: `GRANT on ALL TABLES IN SCHEMA to ${role} must be SELECT only (found ${[...privs].join(', ') || 'ALL'})`,
            statement: grantStatement,
          });
        }
      }
      continue;
    }

    if (!isAllowedClientRoleTableGrant(privs, privilegeListRaw)) {
      const label = isAllPrivilegesGrant(privilegeListRaw)
        ? 'ALL'
        : nonSelect.join(', ').toUpperCase() || privilegeListRaw.toUpperCase();
      for (const role of clientRolesHere) {
        out.push({
          reason: `${target}: GRANT ${label} TO ${role} is not allowed (SELECT only for ${role})`,
          statement: grantStatement,
        });
      }
    }
  }

  return finalizeSqlGrantViolations(out);
}

export function buildEffectiveSanitizedCode(sql) {
  const rawDoBodies = extractRawTopLevelDoBodies(sql);
  const rawFunctionBodies = extractRawFunctionBodies(sql);
  const { code: sanitized, topLevelDoBodies, functionBodies } = sanitizeSql(sql);
  const {
    expanded,
    violations: expandViolations,
    executeExpandSpans,
    rawRemovedSpansByFunction,
  } = expandForeachExecuteFormatSql(sanitized, topLevelDoBodies, functionBodies, {
    rawSql: sql,
    rawDoBodies,
    rawFunctionBodies,
  });
  if (expandViolations.length) {
    return {
      code: sanitized,
      violations: expandViolations,
      functionBodies,
      topLevelDoBodies,
      executeExpandSpans,
      rawRemovedSpansByFunction,
      rawFunctionBodies,
    };
  }
  let code = sanitized;
  if (expanded) {
    const reSanitized = sqlCodeWithoutCommentsAndLiterals(expanded);
    code = mergeExpandedAfterForeachDoBodies(sanitized, topLevelDoBodies, reSanitized);
    code = `${code}\n${reSanitized}`;
  }
  return {
    code,
    violations: [],
    functionBodies,
    topLevelDoBodies,
    expandedStatements: expanded,
    executeExpandSpans,
    rawRemovedSpansByFunction,
    rawFunctionBodies,
  };
}

/**
 * @param {string} sql raw file
 * @returns {string[]}
 */
/**
 * @param {string} sql
 * @param {{ relPath?: string }} [options]
 */
export function findSqlFileViolations(sql, options = {}) {
  void options;
  const {
    code,
    violations: pre,
    functionBodies = [],
    topLevelDoBodies = [],
    rawRemovedSpansByFunction = [],
    rawFunctionBodies = [],
  } = buildEffectiveSanitizedCode(sql);
  if (pre.length) return finalizeSqlGrantViolations(pre);

  const executeBodyViolations = findUnexpandedExecuteInFunctionBodies(
    functionBodies,
    rawFunctionBodies,
    rawRemovedSpansByFunction,
  );
  if (executeBodyViolations.length) return executeBodyViolations;

  const targets = extractCreateTableTargets(code);
  const auditDynamicSql =
    targets.length > 0 || topLevelDoBodies.some((body) => /\bexecute\b/i.test(body));
  if (auditDynamicSql) {
    const unexpandable = findUnexpandableDynamicSqlViolations(
      code,
      topLevelDoBodies,
      functionBodies,
    );
    if (unexpandable.length) return finalizeSqlGrantViolations(unexpandable);
  }

  /** @type {(string | SqlGrantCheckViolation)[]} */
  const violations = [];
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
      const required =
        role === 'authenticated'
          ? AUTHENTICATED_REQUIRED_PRIVILEGES
          : SERVICE_ROLE_REQUIRED_PRIVILEGES;
      const missing = required.filter((p) => !held.has(p));
      if (missing.length) {
        violations.push(
          `${key}: GRANT missing ${missing.join(', ').toUpperCase()} TO ${role} in the same file`,
        );
      }
    }
  }

  violations.push(...findClientRoleGrantViolations(code));

  for (const { schema, name } of collectReferencedTables(code)) {
    const key = `${schema}.${name}`;
    if (seen.has(key)) continue;
    violations.push(...findRlsStateViolations(code, schema, name));
    violations.push(...findBroadWritePolicyViolations(code, schema, name));
  }

  return finalizeSqlGrantViolations(violations);
}

export function findCreateTableSetupViolations(sql) {
  return findSqlFileViolations(sql).map((v) => v.reason);
}

export function sqlDefinesCreateTableWithoutGrant(sql) {
  return findSqlFileViolations(sql).length > 0;
}
