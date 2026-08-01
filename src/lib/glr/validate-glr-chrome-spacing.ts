/**
 * GLR list chrome + spacing validators (TASK-631, TASK-637).
 */

import {
  CODEX_BROWSE_LIST_ROW_CLASSNAME,
  CREATOR_EMBEDDED_GLR_SOURCES,
  DEFAULT_GLR_LIST_CLASSNAME,
  DEFAULT_USM_LIST_CLASSNAME,
  FORBIDDEN_GLR_GRID_ACTION_TRACK_REGEX,
  FORBIDDEN_GLR_LIST_GAP_REGEX,
  GLR_GRID_COLUMN_SOURCES,
  GLR_LIST_CLASSNAME_CALLER_SOURCES,
  GLR_LIST_SHELL_SOURCES,
  CODEX_BROWSE_SHELL_SOURCES,
  MY_LIBRARY_ENTITY_TAB_SOURCES,
  USM_LIST_SHELL_SOURCES,
} from './glr-chrome-spacing-norms';

export interface RowChromeFlags {
  edit: boolean;
  delete: boolean;
  leftSlot: boolean;
  rightSlot: boolean;
}

/** Validate a GLR list row-container class string. */
export function validateGlrListClassName(
  className: string,
  context: string
): string[] {
  const errors: string[] = [];
  if (!/\bgap-1\b/.test(className)) {
    errors.push(`${context}: GLR list row container must include gap-1 (got "${className}")`);
  }
  if (/\bspace-y-\d/.test(className)) {
    errors.push(
      `${context}: use flex flex-col gap-1 for GLR lists — not space-y-* ("${className}")`
    );
  }
  if (FORBIDDEN_GLR_LIST_GAP_REGEX.test(className)) {
    errors.push(`${context}: forbidden loose list gap ("${className}")`);
  }
  return errors;
}

function extractConstObjectBody(source: string, constName: string): string | null {
  const pattern = new RegExp(`const\\s+${constName}\\s*=\\s*\\{([\\s\\S]*?)\\}\\s*as\\s+const`, 'm');
  const match = source.match(pattern);
  if (match) return match[1];
  const plain = new RegExp(`const\\s+${constName}\\s*=\\s*\\{([\\s\\S]*?)\\}`, 'm');
  const plainMatch = source.match(plain);
  return plainMatch?.[1] ?? null;
}

function applyRowChromeBody(flags: RowChromeFlags, body: string): void {
  if (/edit:\s*true/.test(body)) flags.edit = true;
  if (/delete:\s*true/.test(body)) flags.delete = true;
  if (/leftSlot:\s*true/.test(body) || /leftSlot:\s*[a-zA-Z_$]/.test(body)) {
    flags.leftSlot = true;
  }
  if (/rightSlot:\s*true/.test(body) || /rightSlot:\s*[a-zA-Z_$]/.test(body)) {
    flags.rightSlot = true;
  }
}

/** Parse `rowChrome` flags from inline object or `*_ROW_CHROME` const. */
export function resolvedRowChromeFlags(source: string): RowChromeFlags {
  const flags: RowChromeFlags = {
    edit: false,
    delete: false,
    leftSlot: false,
    rightSlot: false,
  };

  const inlineMatch = source.match(/rowChrome=\{\{([\s\S]*?)\}\}/);
  if (inlineMatch) {
    applyRowChromeBody(flags, inlineMatch[1]);
    return flags;
  }

  for (const match of source.matchAll(/rowChrome=\{([A-Z][A-Z0-9_]*)\}/g)) {
    const body = extractConstObjectBody(source, match[1]);
    if (!body) continue;
    applyRowChromeBody(flags, body);
  }

  return flags;
}

/** Parse `rowChrome` on a single ListHeader block (embedded creator lists). */
export function resolvedRowChromeFlagsInBlock(
  section: string,
  fullSource?: string
): RowChromeFlags {
  const flags: RowChromeFlags = {
    edit: false,
    delete: false,
    leftSlot: false,
    rightSlot: false,
  };

  const inlineMatch = section.match(/rowChrome=\{\{([\s\S]*?)\}\}/);
  if (inlineMatch) {
    applyRowChromeBody(flags, inlineMatch[1]);
    return flags;
  }

  const constMatch = section.match(/rowChrome=\{([A-Z][A-Z0-9_]*)\}/);
  if (constMatch) {
    const lookup = fullSource ?? section;
    const body = extractConstObjectBody(lookup, constMatch[1]);
    if (body) applyRowChromeBody(flags, body);
  }

  return flags;
}

export function expectedRowChromeFromRowActions(source: string): RowChromeFlags {
  return {
    edit: /\bonEdit\s*[=:{]/.test(source),
    delete: /\bonDelete\s*[=:{]/.test(source),
    leftSlot: /\bleftSlot\s*[=:{]/.test(source),
    rightSlot: /\brightSlot\s*[=:{]/.test(source),
  };
}

function validateRowChromePairing(
  relativePath: string,
  source: string,
  shellMarker: string
): string[] {
  const errors: string[] = [];
  if (!source.includes(shellMarker)) return errors;

  const expected = expectedRowChromeFromRowActions(source);
  if (!expected.edit && !expected.delete && !expected.leftSlot && !expected.rightSlot) {
    return errors;
  }

  if (!/rowChrome=/.test(source)) {
    errors.push(`${relativePath}: row actions present but shell is missing rowChrome`);
    return errors;
  }

  const actual = resolvedRowChromeFlags(source);
  if (expected.edit && !actual.edit) {
    errors.push(`${relativePath}: onEdit requires rowChrome.edit`);
  }
  if (expected.delete && !actual.delete) {
    errors.push(`${relativePath}: onDelete requires rowChrome.delete`);
  }
  if (expected.leftSlot && !actual.leftSlot) {
    errors.push(`${relativePath}: leftSlot requires rowChrome.leftSlot`);
  }
  if (expected.rightSlot && !actual.rightSlot) {
    errors.push(`${relativePath}: rightSlot requires rowChrome.rightSlot`);
  }

  return errors;
}

function splitEmbeddedListHeaderSections(source: string): string[] {
  return source.split(/(?=<ListHeader)/).filter((part) => part.includes('<ListHeader'));
}

function validateEmbeddedListHeaderBlock(
  relativePath: string,
  section: string,
  index: number,
  fullSource: string
): string[] {
  const errors: string[] = [];
  if (!section.includes('GridListRow')) return errors;

  const context = `${relativePath} ListHeader#${index + 1}`;
  // Equipment-step pattern: `rightSlotWidth` reserves remove/qty chrome instead of rowChrome.
  if (/rightSlotWidth=/.test(section)) return errors;

  const expected = expectedRowChromeFromRowActions(section);
  if (!expected.edit && !expected.delete && !expected.leftSlot && !expected.rightSlot) {
    return errors;
  }

  if (!/rowChrome=/.test(section)) {
    errors.push(`${context}: row actions present but ListHeader is missing rowChrome`);
    return errors;
  }

  const actual = resolvedRowChromeFlagsInBlock(section, fullSource);
  if (expected.edit && !actual.edit) {
    errors.push(`${context}: onEdit requires rowChrome.edit`);
  }
  if (expected.delete && !actual.delete) {
    errors.push(`${context}: onDelete requires rowChrome.delete`);
  }
  if (expected.leftSlot && !actual.leftSlot) {
    errors.push(`${context}: leftSlot requires rowChrome.leftSlot`);
  }
  if (expected.rightSlot && !actual.rightSlot) {
    errors.push(`${context}: rightSlot requires rowChrome.rightSlot`);
  }

  return errors;
}

/** GLR row containers wrapping GridListRow maps must use tight gap-1 (not space-y-3 / gap-3). */
export function validateEmbeddedGlrListRowContainers(
  relativePath: string,
  source: string
): string[] {
  const errors: string[] = [];
  const containerPattern =
    /<div className="([^"]+)"[^>]*>\s*\{[^}]*\.map\([\s\S]*?<GridListRow/g;

  for (const match of source.matchAll(containerPattern)) {
    errors.push(...validateGlrListClassName(match[1], `${relativePath} GLR row container`));
  }

  return errors;
}

/** Shell sources must keep the canonical default list class (no drift to space-y-3). */
export function validateGlrListShellSource(
  relativePath: string,
  source: string
): string[] {
  const errors: string[] = [];

  if (relativePath.endsWith('UserLibraryEntityTabShell.tsx')) {
    const defaultMatch = source.match(/listClassName\s*=\s*['"]([^'"]+)['"]/);
    if (!defaultMatch) {
      errors.push(`${relativePath}: missing listClassName default`);
    } else if (defaultMatch[1] !== DEFAULT_GLR_LIST_CLASSNAME) {
      errors.push(
        `${relativePath}: listClassName default must be "${DEFAULT_GLR_LIST_CLASSNAME}" (got "${defaultMatch[1]}")`
      );
    }
  }

  if (relativePath.endsWith('official-entity-list.tsx')) {
    const defaultMatch = source.match(/listClassName\s*=\s*['"]([^'"]+)['"]/);
    if (!defaultMatch) {
      errors.push(`${relativePath}: missing listClassName default`);
    } else if (defaultMatch[1] !== DEFAULT_GLR_LIST_CLASSNAME) {
      errors.push(
        `${relativePath}: listClassName default must be "${DEFAULT_GLR_LIST_CLASSNAME}" (got "${defaultMatch[1]}")`
      );
    }
  }

  if (relativePath.endsWith('codex-browse-list-shell.tsx')) {
    if (!source.includes(CODEX_BROWSE_LIST_ROW_CLASSNAME)) {
      errors.push(
        `${relativePath}: row container must use "${CODEX_BROWSE_LIST_ROW_CLASSNAME}"`
      );
    }
  }

  return errors;
}

/** Scan `listClassName={` overrides on GLR shell callers. */
export function validateGlrListClassNameCaller(
  relativePath: string,
  source: string
): string[] {
  const errors: string[] = [];
  if (!source.includes('listClassName')) return errors;

  for (const match of source.matchAll(/listClassName=\{?['"{]([^'"}]+)['"}]\}?/g)) {
    const value = match[1];
    if (value.includes('flex') || value.includes('space-y') || value.includes('gap-')) {
      errors.push(...validateGlrListClassName(value, `${relativePath} listClassName`));
    }
  }

  return errors;
}

/** Shared Library/Official grid templates must not retain a trailing 40px action track. */
export function validateGlrGridColumnSource(
  relativePath: string,
  source: string
): string[] {
  const errors: string[] = [];

  const patterns = [
    /(?:GRID|grid|gridColumns)\s*[=:]\s*['"]([^'"]+)['"]/g,
    /grid:\s*['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const template = match[1];
      if (FORBIDDEN_GLR_GRID_ACTION_TRACK_REGEX.test(template)) {
        errors.push(
          `${relativePath}: grid "${template}" must not include 40px action track — use ListHeader rowChrome`
        );
      }
    }
  }

  const tabGridConsts = source.matchAll(
    /const\s+[A-Z0-9_]*GRID[A-Z0-9_]*\s*=\s*['"]([^'"]+)['"]/g
  );
  for (const match of tabGridConsts) {
    if (FORBIDDEN_GLR_GRID_ACTION_TRACK_REGEX.test(match[1])) {
      errors.push(
        `${relativePath}: grid "${match[1]}" must not include 40px action track — use ListHeader rowChrome`
      );
    }
  }

  return errors;
}

/** My Library tabs with row actions must pass matching ListHeader rowChrome. */
export function validateMyLibraryEntityTabSource(
  relativePath: string,
  source: string
): string[] {
  const errors = validateRowChromePairing(
    relativePath,
    source,
    'UserLibraryEntityTabShell'
  );
  errors.push(...validateGlrListClassNameCaller(relativePath, source));
  errors.push(...validateGlrGridColumnSource(relativePath, source));
  return errors;
}

/** Codex/Admin browse lists with row rightSlot need shell rowChrome.rightSlot. */
export function validateCodexBrowseShellSource(
  relativePath: string,
  source: string
): string[] {
  return validateRowChromePairing(relativePath, source, 'CodexBrowseListShell');
}

/** UnifiedSelectionModal list shell must keep canonical gap-1 row container. */
export function validateUsmListShellSource(
  relativePath: string,
  source: string
): string[] {
  const errors: string[] = [];
  const listContainerMatch = source.match(
    /<div className="([^"]+)"[^>]*>\s*\{filteredItems\.map/
  );

  if (!listContainerMatch) {
    errors.push(`${relativePath}: missing USM list row container`);
    return errors;
  }

  const className = listContainerMatch[1];
  if (className !== DEFAULT_USM_LIST_CLASSNAME) {
    errors.push(
      `${relativePath}: USM list row container must be "${DEFAULT_USM_LIST_CLASSNAME}" (got "${className}")`
    );
  }

  errors.push(...validateGlrListClassName(className, `${relativePath} USM list container`));
  return errors;
}

/** Creator-embedded GLR lists: rowChrome pairing, no 40px tracks, tight row gaps. */
export function validateCreatorEmbeddedGlrSource(
  relativePath: string,
  source: string
): string[] {
  const errors: string[] = [];
  errors.push(...validateGlrGridColumnSource(relativePath, source));
  errors.push(...validateEmbeddedGlrListRowContainers(relativePath, source));

  splitEmbeddedListHeaderSections(source).forEach((section, index) => {
    errors.push(...validateEmbeddedListHeaderBlock(relativePath, section, index, source));
  });

  return errors;
}

export interface GlrChromeSpacingScanResult {
  errors: string[];
}

/** Scan all registered GLR shell + tab + grid sources. */
export function scanGlrChromeSpacingSources(
  readFile: (relativePath: string) => string
): GlrChromeSpacingScanResult {
  const errors: string[] = [];

  for (const path of GLR_LIST_SHELL_SOURCES) {
    errors.push(...validateGlrListShellSource(path, readFile(path)));
  }

  for (const path of GLR_LIST_CLASSNAME_CALLER_SOURCES) {
    errors.push(...validateGlrListClassNameCaller(path, readFile(path)));
  }

  for (const path of MY_LIBRARY_ENTITY_TAB_SOURCES) {
    errors.push(...validateMyLibraryEntityTabSource(path, readFile(path)));
  }

  for (const path of GLR_GRID_COLUMN_SOURCES) {
    errors.push(...validateGlrGridColumnSource(path, readFile(path)));
  }

  for (const path of CODEX_BROWSE_SHELL_SOURCES) {
    errors.push(...validateCodexBrowseShellSource(path, readFile(path)));
  }

  for (const path of USM_LIST_SHELL_SOURCES) {
    errors.push(...validateUsmListShellSource(path, readFile(path)));
  }

  for (const path of CREATOR_EMBEDDED_GLR_SOURCES) {
    errors.push(...validateCreatorEmbeddedGlrSource(path, readFile(path)));
  }

  return { errors };
}

export function assertGlrChromeSpacingSources(
  readFile: (relativePath: string) => string
): void {
  const { errors } = scanGlrChromeSpacingSources(readFile);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}
