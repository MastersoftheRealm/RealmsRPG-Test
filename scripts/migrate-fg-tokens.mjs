import fs from 'fs';
import path from 'path';

const REPLACEMENTS = [
  ['text-success-700 dark:text-success-400', 'text-success-fg'],
  ['text-success-700 dark:text-success-300', 'text-success-fg'],
  ['text-success-800 dark:text-success-300', 'text-success-fg'],
  ['text-danger-700 dark:text-danger-400', 'text-danger-fg'],
  ['text-danger-600 dark:text-danger-400', 'text-danger-fg'],
  ['text-danger-700 dark:text-danger-300', 'text-danger-fg'],
  ['text-warning-700 dark:text-warning-400', 'text-warning-fg'],
  ['text-warning-700 dark:text-warning-300', 'text-warning-fg'],
  ['text-warning-800 dark:text-warning-300', 'text-warning-fg'],
  ['text-info-700 dark:text-info-400', 'text-info-fg'],
  ['text-info-600 dark:text-info-400', 'text-info-fg'],
  ['text-info-700 dark:text-info-300', 'text-info-fg'],
  ['text-info-800 dark:text-info-300', 'text-info-fg'],
  ['text-info-800 dark:text-info-200', 'text-info-fg'],
  ['text-power-dark dark:text-power-300', 'text-power-fg'],
  ['text-power-text dark:text-power-300', 'text-power-fg'],
  ['text-martial-dark dark:text-martial-300', 'text-martial-fg'],
  [
    'text-danger dark:text-danger-400 hover:text-danger-600 dark:hover:text-danger-300 hover:bg-transparent',
    'text-danger-fg hover:opacity-80 hover:bg-transparent',
  ],
  [
    'text-danger dark:text-danger-400 hover:text-danger-600 dark:hover:text-danger-300 font-bold flex-shrink-0 min-w-[var(--touch-target-min,44px)] min-h-[var(--touch-target-min,44px)]',
    'text-danger-fg hover:opacity-80 font-bold flex-shrink-0 min-w-[var(--touch-target-min,44px)] min-h-[var(--touch-target-min,44px)]',
  ],
  ['hover:text-danger-600 dark:hover:text-danger-400', 'hover:text-danger-fg'],
  ['hover:text-danger-500 dark:hover:text-danger-400', 'hover:text-danger-fg'],
  ['text-warning-700 hover:text-warning-700 dark:text-warning-400', 'text-warning-fg hover:opacity-80'],
  ['text-tp-text dark:text-warning-300', 'text-tp-text'],
  ['text-tp-text dark:text-warning-400', 'text-tp-text'],
  [
    'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    'bg-success-100 text-success-fg dark:bg-success-900/30',
  ],
  [
    'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400',
    'bg-danger-100 text-danger-fg dark:bg-danger-900/30',
  ],
  [
    'bg-success-50 dark:bg-success-900/30 border-success-300 dark:border-success-600/50 text-success-700 dark:text-success-300',
    'bg-success-50 dark:bg-success-900/30 border-success-300 dark:border-success-600/50 text-success-fg',
  ],
  [
    'bg-danger-50 dark:bg-danger-900/30 border-danger-200 dark:border-danger-600/50 text-danger-700 dark:text-danger-300',
    'bg-danger-50 dark:bg-danger-900/30 border-danger-200 dark:border-danger-600/50 text-danger-fg',
  ],
  [
    'bg-danger-light text-danger-700 hover:bg-danger-200/80 dark:bg-danger-900/30 dark:text-danger-300 dark:hover:bg-danger-800/40',
    'bg-danger-light text-danger-fg hover:bg-danger-200/80 dark:bg-danger-900/30 dark:hover:bg-danger-800/40',
  ],
  [
    'bg-success-light text-success-700 hover:bg-success-200/80 dark:bg-success-900/30 dark:text-success-300 dark:hover:bg-success-800/40',
    'bg-success-light text-success-fg hover:bg-success-200/80 dark:bg-success-900/30 dark:hover:bg-success-800/40',
  ],
  ['hover:text-success-700 dark:hover:text-success-400', 'hover:text-success-fg'],
  ['color="bg-danger-light text-danger-700 dark:text-danger-400"', 'color="bg-danger-light text-danger-fg"'],
  ['color="bg-power-light text-power-text dark:text-power-300"', 'color="bg-power-light text-power-fg"'],
  ['color="bg-info-light text-info-700 dark:text-info-300"', 'color="bg-info-light text-info-fg"'],
  [
    'text-info-600 dark:text-info-400 hover:text-info-800 dark:hover:text-info-300',
    'text-info-fg hover:opacity-80',
  ],
  [
    "canAfford ? 'text-tp-text dark:text-warning-400 font-bold' : 'text-danger-600 dark:text-danger-400 font-bold'",
    "canAfford ? 'text-tp-text font-bold' : 'text-danger-fg font-bold'",
  ],
  [
    'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-600/50 text-success-700 dark:text-success-400',
    'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-600/50 text-success-fg',
  ],
  [
    'bg-info-100 dark:bg-info-900/40 text-info-800 dark:text-info-200 border-info-200 dark:border-info-700/50',
    'bg-info-100 dark:bg-info-900/40 text-info-fg border-info-200 dark:border-info-700/50',
  ],
  [
    'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-700/50',
    'bg-success-100 dark:bg-success-900/40 text-success-fg border border-success-200 dark:border-success-700/50',
  ],
  [
    'bg-danger-100 dark:bg-danger-900/40 text-danger-700 dark:text-danger-300 border border-danger-200 dark:border-danger-700/50',
    'bg-danger-100 dark:bg-danger-900/40 text-danger-fg border border-danger-200 dark:border-danger-700/50',
  ],
  [
    'className="px-3 py-1.5 rounded-lg text-sm font-medium bg-power-light/50 dark:bg-power-900/30 text-power-dark dark:text-power-300 border border-power/30"',
    'className="px-3 py-1.5 rounded-lg text-sm font-medium bg-power-light/50 dark:bg-power-900/30 text-power-fg border border-power/30"',
  ],
  [
    'className="px-3 py-1.5 rounded-lg text-sm font-medium bg-martial-light/50 dark:bg-martial-900/30 text-martial-dark dark:text-martial-300 border border-martial/30"',
    'className="px-3 py-1.5 rounded-lg text-sm font-medium bg-martial-light/50 dark:bg-martial-900/30 text-martial-fg border border-martial/30"',
  ],
  [
    "tooltipPrefMessage.type === 'success' ? 'text-success-700 dark:text-success-400' : 'text-danger-700 dark:text-danger-400'",
    "tooltipPrefMessage.type === 'success' ? 'text-success-fg' : 'text-danger-fg'",
  ],
  [
    'bg-tp-light dark:bg-warning-900/30 border-tp-border text-tp-text dark:text-warning-300',
    'bg-tp-light dark:bg-warning-900/30 border-tp-border text-tp-text',
  ],
];

const roots = ['src/app', 'src/components/character-creator'];
let changed = 0;

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.tsx')) {
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
  }
}

for (const r of roots) walk(r);
console.log('files changed:', changed);
