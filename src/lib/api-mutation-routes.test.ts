import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { API_MUTATION_GUARD_MARKERS } from './api-mutation-guard';

const API_ROOT = path.join(import.meta.dirname, '../app/api');
const MUTATION_HANDLER_HEAD = /^export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/;
const HANDLER_SPLIT =
  /(?=export\s+async\s+function\s+(?:GET|HEAD|OPTIONS|POST|PUT|PATCH|DELETE)\s*\()/g;

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
  it('every mutating route handler declares a mutation guard', () => {
    const unprotected: string[] = [];

    for (const file of listRouteFiles(API_ROOT)) {
      const source = readFileSync(file, 'utf8');
      const chunks = source.split(HANDLER_SPLIT).filter(Boolean);
      for (const chunk of chunks) {
        const method = chunk.match(MUTATION_HANDLER_HEAD)?.[1];
        if (!method) continue;

        const hasGuard = API_MUTATION_GUARD_MARKERS.some((marker) => chunk.includes(marker));
        if (!hasGuard) {
          unprotected.push(`${relativeApiPath(file)} (${method})`);
        }
      }
    }

    expect(unprotected).toEqual([]);
  });

  it('keeps api/codex and api/official off the proxy matcher', () => {
    const proxy = readFileSync(path.join(import.meta.dirname, '../proxy.ts'), 'utf8');
    expect(proxy).not.toContain('isHighVolumePublicApiRead');
    const matcher = proxy.slice(proxy.indexOf('matcher:'));
    expect(matcher).toContain('api/codex(?:/|$)');
    expect(matcher).toContain('api/official(?:/|$)');
  });
});
