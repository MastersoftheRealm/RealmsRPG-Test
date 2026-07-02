/**
 * Migrate numbered primary ramp classes → theme-aware semantic tokens.
 * Run: node scripts/migrate-primary-tokens.mjs
 */
import fs from 'fs';
import path from 'path';

/** Longest-first replacements */
const REPLACEMENTS = [
  // Solid buttons / FABs
  ['bg-primary-600 text-white hover:bg-primary-700 hover:scale-110 active:scale-95', 'bg-primary-button text-white hover:bg-primary-button-hover hover:scale-110 active:scale-95'],
  ['bg-primary-600 text-white hover:bg-primary-700', 'bg-primary-button text-white hover:bg-primary-button-hover'],
  ['bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700', 'bg-primary-button text-white text-sm font-semibold hover:bg-primary-button-hover'],
  ['bg-primary-600 text-white', 'bg-primary-button text-white'],
  ['hover:bg-primary-700 hover:scale-110 active:scale-95', 'hover:bg-primary-button-hover hover:scale-110 active:scale-95'],
  ['hover:bg-primary-700', 'hover:bg-primary-button-hover'],
  ['bg-primary-700 text-white', 'bg-primary-button text-white'],
  ['isOpen && \'bg-primary-800\'', 'isOpen && \'bg-primary-button-hover\''],
  ['bg-primary-400 text-white hover:bg-primary-500', 'bg-primary-button text-white hover:bg-primary-button-hover'],

  // Subtle banners
  ['bg-primary-600/10 border border-primary-600/20', 'bg-primary-subtle-bg border border-primary-subtle-border'],
  ['bg-primary-600/10 border-primary-600/20', 'bg-primary-subtle-bg border-primary-subtle-border'],

  // Borders / rings / selection
  ['border-2 border-primary-600 bg-primary-50', 'border-2 border-primary-outline-border bg-primary-subtle-bg'],
  ['border-2 border-primary-600', 'border-2 border-primary-outline-border'],
  ['border-primary-600 bg-primary-600', 'border-primary-outline-border bg-primary-button'],
  ['border-primary-500 bg-primary-500 text-white', 'border-primary-outline-border bg-primary-button text-white'],
  ['border-primary-500 bg-primary-500', 'border-primary-outline-border bg-primary-button'],
  ['border-primary-500', 'border-primary-outline-border'],
  ['border-primary-600', 'border-primary-outline-border'],
  ['border-primary-400', 'border-primary-outline-border'],
  ['ring-2 ring-primary-500', 'ring-2 ring-primary-subtle-border'],
  ['ring-primary-500', 'ring-primary-subtle-border'],
  ['hover:border-primary-600', 'hover:border-primary-outline-border'],
  ['hover:border-primary-300', 'hover:border-primary-outline-border'],
  ['dark:hover:border-primary-600', 'dark:hover:border-primary-outline-border'],

  // Focus (form controls)
  ['focus:border-primary-500 focus:ring-2 focus:ring-primary-200', 'focus:border-primary-outline-border focus:ring-2 focus:ring-primary-subtle-border'],
  ['focus:border-primary-500 focus:ring-1 focus:ring-primary-200', 'focus:border-primary-outline-border focus:ring-1 focus:ring-primary-subtle-border'],
  ['focus:border-primary-500', 'focus:border-primary-outline-border'],
  ['focus:ring-primary-500', 'focus:ring-primary-subtle-border'],
  ['focus:ring-2 focus:ring-primary-500', 'focus:ring-2 focus:ring-primary-subtle-border'],

  // Text / links
  ['text-primary-600 hover:text-primary-800 underline', 'text-primary-link-fg hover:text-primary-fg-hover underline'],
  ['text-primary-600 hover:text-primary-700', 'text-primary-link-fg hover:text-primary-fg-hover'],
  ['text-primary-600 hover:underline', 'text-primary-link-fg hover:underline'],
  ['hover:text-primary-600 hover:underline', 'hover:text-primary-link-fg hover:underline'],
  ['hover:text-primary-600', 'hover:text-primary-fg-hover'],
  ['text-primary-500 hover:text-primary-600', 'text-primary-fg hover:text-primary-fg-hover'],
  ['text-primary-500 hover:text-primary-600 transition-colors', 'text-primary-fg hover:text-primary-fg-hover transition-colors'],
  ['text-primary-500', 'text-primary-fg'],
  ['text-primary-600', 'text-primary-link-fg'],
  ['text-primary-700', 'text-primary-subtle-fg'],
  ['text-primary-800', 'text-primary-fg-hover'],

  // Chip deprecated accent
  ['bg-accent-chip text-primary-700 border-accent-200', 'bg-accent-chip text-primary-subtle-fg border-accent-200'],

  // Turn / selected states
  ["isCurrentTurn ? 'bg-primary-600 text-white'", "isCurrentTurn ? 'bg-primary-button text-white'"],
  ["isSelected ? 'bg-primary-600 text-white'", "isSelected ? 'bg-primary-button text-white'"],
  ['? \'bg-primary-600 text-white\'', '? \'bg-primary-button text-white\''],

  // Grid list / skill row proficient dots
  ['? \'bg-primary-600 border-2 border-primary-600\'', '? \'bg-primary-button border-2 border-primary-outline-border\''],
  ['? \'bg-primary-600 border-primary-600\'', '? \'bg-primary-button border-primary-outline-border\''],
  ['text-primary-700 border-2 border-primary-600', 'text-primary-subtle-fg border-2 border-primary-outline-border'],
];

const SKIP_DIRS = new Set(['node_modules', '.next']);
const SKIP_FILES = new Set(['src/app/dev/styleguide/page.tsx']);

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if ((ent.name.endsWith('.tsx') || ent.name.endsWith('.ts')) && !SKIP_FILES.has(p.replace(/\\/g, '/'))) {
      files.push(p);
    }
  }
  return files;
}

let changed = 0;
for (const p of walk('src')) {
  let content = fs.readFileSync(p, 'utf8');
  const orig = content;
  for (const [from, to] of REPLACEMENTS) {
    content = content.split(from).join(to);
  }
  if (content !== orig) {
    fs.writeFileSync(p, content);
    changed++;
    console.log('updated:', p);
  }
}
console.log('files changed:', changed);
