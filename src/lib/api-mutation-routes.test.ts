import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { API_MUTATION_GUARD_MARKERS } from './api-mutation-guard';

const API_ROOT = path.join(import.meta.dirname, '../app/api');
const MUTATION_EXPORT = /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/g;

function listRouteFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const name of entries) {
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...listRouteFiles(full));
    } else if (name === 'route.ts') {
      files.push(full);
    }
  }
  return files;
}

function relativeApiPath(file: string): string {
  return path.relative(API_ROOT, file).replace(/\\/g, '/');
}

describe('API mutation routes CSRF coverage', () => {
  it('every mutating route module declares a mutation guard', () => {
    const unprotected: string[] = [];

    for (const file of listRouteFiles(API_ROOT)) {
      const source = readFileSync(file, 'utf8');
      MUTATION_EXPORT.lastIndex = 0;
      if (!MUTATION_EXPORT.test(source)) continue;

      const hasGuard = API_MUTATION_GUARD_MARKERS.some((marker) => source.includes(marker));
      if (!hasGuard) {
        unprotected.push(relativeApiPath(file));
      }
    }

    expect(unprotected).toEqual([]);
  });
});
