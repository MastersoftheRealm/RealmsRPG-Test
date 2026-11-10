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
  return `«Q${Buffer.from(decoded.toLowerCase(), 'utf8').toString('hex')}»`;
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
 * @param {string} out
 */
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
  /** @type {string | null} */
  let captureTopLevelDo = null;

  const emit = (text) => {
    out += text;
    if (captureTopLevelDo !== null) captureTopLevelDo += text;
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

    if ((c === 'e' || c === 'E') && next === "'") {
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
          dollarStack.pop();
          if (captureTopLevelDo !== null && dollarStack.length === 0) {
            topLevelDoBodies.push(captureTopLevelDo);
            captureTopLevelDo = null;
          }
        } else {
          const before = out.replace(/\s+/g, ' ').trim().toLowerCase();
          let kind = 'block';
          if (/\bdo\s*$/.test(before.slice(-16))) kind = 'do';
          else if (/\bas\s*$/.test(before.slice(-12))) kind = 'fn';
          dollarStack.push({ tag, kind });
          if (kind === 'do' && dollarStack.length === 1 && !captureTopLevelDo) {
            captureTopLevelDo = '';
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

  return { code: out, topLevelDoBodies };
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
    if (name) return { schema: 'public', name };
  }
  return null;
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
  const nameLower = tableName.toLowerCase();
  const nameAlternates = [
    escapeRegExp(quotedIdTokenForName(nameLower)),
    escapeRegExp(nameLower),
  ].join('|');
  const schemaPart =
    schemaLower === 'public'
      ? `(?:(?:public|${escapeRegExp(quotedIdTokenForName('public'))})\\s*\\.\\s*)?`
      : `(?:${escapeRegExp(quotedIdTokenForName(schemaLower))}|${escapeRegExp(schemaLower)})\\s*\\.\\s*`;
  return `${schemaPart}(?:${nameAlternates})`;
}

/**
 * @param {string} code
 * @returns {{ schema: string, name: string }[]}
 */
export function extractCreateTableTargets(code) {
  const re =
    /\bcreate\s+(?:unlogged\s+)?table(?=\s|"|«)(?!\s+as\b)\s*(?:if\s+not\s+exists\s+)?((?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*)(?:\s*\.\s*(?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*))?)/gi;
  /** @type {{ schema: string, name: string }[]} */
  const targets = [];
  let match;
  while ((match = re.exec(code))) {
    const parsed = parseQualifiedTableRef(match[1]);
    if (parsed) targets.push(parsed);
  }
  return targets;
}

/**
 * @param {string} code
 * @returns {string[]}
 */
export function findUnexpandableDynamicSqlViolations(code) {
  /** @type {string[]} */
  const violations = [];
  const patterns = [
    [/\bexecute\s+(?!format\s*\(\s*«S)«S/i, 'EXECUTE literal string'],
    [/\bexecute\s+'/i, 'EXECUTE literal string'],
    [/\bexecute\s+format\s*\([^)]*%[sL]/i, 'EXECUTE format with %s or %L'],
    [
      /\bexecute\s+format\s*\([^)]*,\s*[^,)]+,\s*[^)]+\)/i,
      'EXECUTE format with multiple substitution arguments',
    ],
    [/\bforeach\s+\w+\s+in\s+select\b/i, 'FOREACH … IN SELECT'],
    [/\bexecute\b[^;]*\|\|/i, 'EXECUTE with string concatenation'],
  ];
  for (const [re, label] of patterns) {
    if (re.test(code)) {
      violations.push(`unexpandable dynamic SQL (${label})`);
      break;
    }
  }
  return violations;
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
    const rest = lower.slice(i);
    if (rest.startsWith('if') && !/^if\s*not\s/.test(rest)) {
      ifDepth += 1;
      i += 2;
      continue;
    }
    if (rest.startsWith('end if')) {
      ifDepth = Math.max(0, ifDepth - 1);
      i += 6;
      continue;
    }
    const fe = /^foreach\s+\w+\s+in\s+array\s+array\s*\[/i.exec(body.slice(i));
    if (fe && ifDepth === 0) {
      const start = i;
      const endLoop = /\bend\s+loop\s*;/i.exec(body.slice(i));
      if (!endLoop) break;
      regions.push({ start, end: i + endLoop.index + endLoop[0].length });
      i += endLoop.index + endLoop[0].length;
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
export function expandForeachExecuteFormatSql(sanitizedCode, topLevelDoBodies = []) {
  /** @type {string[]} */
  const statements = [];
  /** @type {string[]} */
  const violations = findUnexpandableDynamicSqlViolations(sanitizedCode);

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
        if (!/%I/.test(formatSql)) continue;
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
    for (const p of REQUIRED_PRIVILEGES) privs.add(p);
    return privs;
  }
  for (const piece of lower.split(',')) {
    let part = piece.trim();
    if (!part) continue;
    const paren = part.indexOf('(');
    if (paren !== -1) part = part.slice(0, paren).trim();
    if (!part) continue;
    for (const p of REQUIRED_PRIVILEGES) {
      if (new RegExp(`\\b${p}\\b`).test(part)) privs.add(p);
    }
  }
  return privs;
}

/**
 * @param {string} toClause
 */
function parseGrantRoleSet(toClause) {
  const roles = new Set();
  const lower = toClause.replace(/\s+/g, ' ').trim().toLowerCase();
  for (const role of [...REQUIRED_ROLES, 'anon', 'public']) {
    if (new RegExp(`\\b${role}\\b`).test(lower)) roles.add(role);
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
 * @param {string} clause
 */
function policyClauseTargetsClients(clause) {
  const lower = clause.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!/\bto\s+/.test(lower)) return true;
  if (/\bto\s+public\b/.test(lower)) return true;
  return CLIENT_EXPOSED_ROLES.some((role) => new RegExp(`\\bto\\s+[^;]*\\b${role}\\b`).test(lower));
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
 * @param {string} clause
 */
function hasAuthScopePredicate(clause) {
  return (
    /\bauth\.uid\s*\(/.test(clause) ||
    /\bauth\.jwt\b/.test(clause) ||
    /\bcurrent_user\b/.test(clause) ||
    /\bauth\.role\s*\(/.test(clause) ||
    /\bprivate\.auth_is_/.test(clause) ||
    /\bexists\s*\(/.test(clause)
  );
}

/**
 * @param {string} clause lowercased policy text
 */
function policyWriteActionIsOverlyBroad(clause) {
  if (!policyClauseTargetsClients(clause)) return false;
  const forMatch = /\bfor\s+(all|insert|update|delete|select)\b/.exec(clause);
  if (!forMatch) {
    // PostgreSQL default FOR ALL when omitted on a permissive write-shaped policy
  } else if (forMatch[1] === 'select' && !/\bfor\s+(insert|update|delete|all)\b/.test(clause)) {
    return false;
  }

  let action = forMatch?.[1] ?? 'all';
  if (action === 'select') return false;

  const usingMatch = /\busing\s*\(([^)]*)\)/.exec(clause);
  const checkMatch = /\bwith\s+check\s*\(([^)]*)\)/.exec(clause);
  const usingBroad = usingMatch ? isAlwaysTrueExpression(usingMatch[1]) : false;
  const checkBroad = checkMatch ? isAlwaysTrueExpression(checkMatch[1]) : false;

  if (action === 'insert') {
    if (checkBroad || (usingBroad && !checkMatch)) return true;
    if (!checkBroad && !usingBroad && !hasAuthScopePredicate(clause)) return true;
    return false;
  }

  if (usingBroad || checkBroad) return true;
  if (!hasAuthScopePredicate(clause)) return true;
  return false;
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
    `\\bcreate\\s+policy\\s+${policyName}\\s+on\\s+${ref}(?=\\s|;|$)([^;]*)`,
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
    `\\balter\\s+table\\s+${ref}(?=\\s|;|$)\\s+enable\\s+row\\s+level\\s+security\\b`,
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

  const createRe =
    /\bcreate\s+(?:unlogged\s+)?table(?=\s|"|«)(?!\s+as\b)\s*(?:if\s+not\s+exists\s+)?((?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*)(?:\s*\.\s*(?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*))?)/gi;
  let m;
  while ((m = createRe.exec(code))) add(parseQualifiedTableRef(m[1]));

  const alterRe =
    /\balter\s+table\s+((?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*)(?:\s*\.\s*(?:«Q[0-9a-f]+»|[a-z_][a-z0-9_]*))?)/gi;
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
  const enabled = new RegExp(
    `\\balter\\s+table\\s+${ref}(?=\\s|;|$)\\s+enable\\s+row\\s+level\\s+security\\b`,
    'i',
  ).test(code);
  const disabled = new RegExp(
    `\\balter\\s+table\\s+${ref}(?=\\s|;|$)\\s+disable\\s+row\\s+level\\s+security\\b`,
    'i',
  ).test(code);
  /** @type {string[]} */
  const out = [];
  const key = `${schema}.${tableName}`;
  if (enabled && disabled) {
    out.push(`${key}: ENABLE then DISABLE ROW LEVEL SECURITY in the same file`);
  } else if (disabled) {
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
  for (const role of ['anon', 'public']) {
    const held = grants.get(role) ?? new Set();
    const writes = ['insert', 'update', 'delete'].filter((p) => held.has(p));
    if (writes.length) {
      out.push(
        `${key}: GRANT ${writes.join(', ').toUpperCase()} TO ${role} is not allowed (SELECT only for ${role})`,
      );
    }
  }
  return out;
}

/**
 * @param {string} sql
 * @returns {string[]}
 */
export function buildEffectiveSanitizedCode(sql) {
  const { code: sanitized, topLevelDoBodies } = sanitizeSql(sql);
  const { expanded, violations: expandViolations } = expandForeachExecuteFormatSql(
    sanitized,
    topLevelDoBodies,
  );
  if (expandViolations.length) return { code: sanitized, violations: expandViolations };
  const code = expanded ? `${sanitized};\n${expanded}` : sanitized;
  return { code, violations: [] };
}

/**
 * @param {string} sql raw file
 * @returns {string[]}
 */
export function findSqlFileViolations(sql) {
  const { code, violations: pre } = buildEffectiveSanitizedCode(sql);
  if (pre.length) return pre;

  /** @type {string[]} */
  const unexpandable = findUnexpandableDynamicSqlViolations(code);
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
