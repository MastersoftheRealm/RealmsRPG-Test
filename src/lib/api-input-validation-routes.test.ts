import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  API_INPUT_VALIDATION_JSON_EXEMPT_HANDLERS,
  API_INPUT_VALIDATION_MARKERS,
  API_INPUT_VALIDATION_NO_INPUT_HANDLERS,
} from './api-input-validation-guard';

const API_ROOT = path.join(import.meta.dirname, '../app/api');
const HANDLER_HEAD = /^export\s+async\s+function\s+(GET|HEAD|OPTIONS|POST|PUT|PATCH|DELETE)\s*\(/;
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

function handlerKey(relativePath: string, method: string): string {
  return `${relativePath} (${method})`;
}

function handlerReadsQuery(chunk: string): boolean {
  return /searchParams\.get|nextUrl\.searchParams/.test(chunk);
}

function handlerReadsJsonBody(chunk: string): boolean {
  if (/formData\s*\(\)|multipart\/form-data/.test(chunk)) return false;
  return /readJsonBodyWithLimit|validateJson\s*\(|request\.json\s*\(\)/.test(chunk);
}

function handlerUsesRouteParams(chunk: string): boolean {
  return /await\s+params/.test(chunk);
}

function hasMarker(chunk: string, marker: string): boolean {
  return chunk.includes(marker);
}

function hasAnyInputMarker(chunk: string): boolean {
  return API_INPUT_VALIDATION_MARKERS.some((marker) => hasMarker(chunk, marker));
}

describe('API route input validation coverage', () => {
  it('every handler that reads query, params, or JSON validates with Zod helpers', () => {
    const missing: string[] = [];
    const jsonExempt = new Set<string>(API_INPUT_VALIDATION_JSON_EXEMPT_HANDLERS);
    const noInput = new Set<string>(API_INPUT_VALIDATION_NO_INPUT_HANDLERS);

    for (const file of listRouteFiles(API_ROOT)) {
      const relativePath = relativeApiPath(file);
      const source = readFileSync(file, 'utf8');
      const chunks = source.split(HANDLER_SPLIT).filter(Boolean);

      for (const chunk of chunks) {
        const method = chunk.match(HANDLER_HEAD)?.[1];
        if (!method) continue;

        const key = handlerKey(relativePath, method);
        if (noInput.has(key)) continue;

        const readsQuery = handlerReadsQuery(chunk);
        const readsJson = handlerReadsJsonBody(chunk);
        const usesParams = handlerUsesRouteParams(chunk);

        if (!readsQuery && !readsJson && !usesParams) continue;

        if (readsQuery && !hasMarker(chunk, 'validateQuery(')) {
          missing.push(`${key}: missing validateQuery`);
        }
        if (usesParams && !hasMarker(chunk, 'validateRouteParams(')) {
          missing.push(`${key}: missing validateRouteParams`);
        }
        if (readsJson) {
          const jsonOk =
            hasMarker(chunk, 'validateJson(') || hasMarker(chunk, 'parseValidatedJsonBody(');
          if (!jsonOk && !jsonExempt.has(key)) {
            missing.push(`${key}: missing validateJson or parseValidatedJsonBody`);
          }
        }

        if (
          (readsQuery || usesParams || readsJson) &&
          !hasAnyInputMarker(chunk) &&
          !jsonExempt.has(key)
        ) {
          missing.push(`${key}: no input validation marker`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
