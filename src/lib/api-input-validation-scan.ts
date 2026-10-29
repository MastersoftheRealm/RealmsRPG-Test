/**
 * Static scan helpers for api-input-validation-routes.test.ts
 * (and unit tests for detector edge cases).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import {
  API_INPUT_VALIDATION_JSON_EXEMPT_HANDLERS,
  API_INPUT_VALIDATION_MARKERS,
  API_INPUT_VALIDATION_NO_INPUT_HANDLERS,
} from './api-input-validation-guard';

export const API_ROOT = path.join(import.meta.dirname, '../app/api');

const HTTP_METHODS = 'GET|HEAD|OPTIONS|POST|PUT|PATCH|DELETE';

export const HANDLER_FUNCTION_HEAD = new RegExp(
  `^export\\s+async\\s+function\\s+(${HTTP_METHODS})\\s*\\(`,
);

/** `export const GET = async (` and `export const GET = (` */
export const HANDLER_ARROW_HEAD = new RegExp(
  `^export\\s+const\\s+(${HTTP_METHODS})\\s*=\\s*(?:async\\s*)?\\(`,
);

export const HANDLER_SPLIT = new RegExp(
  `(?=export\\s+(?:async\\s+function|const)\\s+(?:${HTTP_METHODS})\\s*(?:=\\s*(?:async\\s*)?\\(|\\())`,
  'g',
);

export function listApiRouteHandlerFiles(dir: string = API_ROOT): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const name of entries) {
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...listApiRouteHandlerFiles(full));
    } else if (name === 'route.ts') {
      files.push(full);
    }
  }
  return files;
}

export function relativeApiPath(file: string): string {
  return path.relative(API_ROOT, file).replace(/\\/g, '/');
}

export function handlerKey(relativePath: string, method: string): string {
  return `${relativePath} (${method})`;
}

export function splitHandlerChunks(source: string): string[] {
  return source
    .split(HANDLER_SPLIT)
    .filter(Boolean)
    .filter((chunk) => getHandlerMethod(chunk) != null);
}

export function getHandlerMethod(chunk: string): string | undefined {
  const head = chunk.trimStart();
  return head.match(HANDLER_FUNCTION_HEAD)?.[1] ?? head.match(HANDLER_ARROW_HEAD)?.[1];
}

export function handlerReadsQuery(chunk: string): boolean {
  if (chunk.includes('validateQuery(')) return false;
  return (
    /searchParams\.(?:get|has|getAll)\b/.test(chunk) ||
    /nextUrl\.searchParams\b/.test(chunk) ||
    /Object\.fromEntries\([^)]*searchParams/.test(chunk) ||
    /new URL\([^)]*\)\.searchParams/.test(chunk)
  );
}

export function handlerReadsJsonBody(chunk: string): boolean {
  if (/formData\s*\(\)|multipart\/form-data/.test(chunk)) return false;
  if (chunk.includes('parseValidatedJsonBody(')) return false;
  if (chunk.includes('validateJson(')) return false;
  return /readJsonBodyWithLimit|request\.json\s*\(\)/.test(chunk);
}

export function handlerUsesRouteParams(chunk: string): boolean {
  if (chunk.includes('validateRouteParams(')) return false;
  return /await\s+(?:params|context\.params|ctx\.params|\w+\.params)\b/.test(chunk);
}

export function hasMarker(chunk: string, marker: string): boolean {
  return chunk.includes(marker);
}

export function hasAnyInputMarker(chunk: string): boolean {
  return API_INPUT_VALIDATION_MARKERS.some((marker) => hasMarker(chunk, marker));
}

export type InputValidationGap = string;

export function collectInputValidationGaps(
  options: {
    apiRoot?: string | undefined;
    jsonExempt?: ReadonlySet<string> | undefined;
    noInputAllowlist?: ReadonlySet<string> | undefined;
  } = {},
): InputValidationGap[] {
  const apiRoot = options.apiRoot ?? API_ROOT;
  const jsonExempt = options.jsonExempt ?? new Set(API_INPUT_VALIDATION_JSON_EXEMPT_HANDLERS);
  const noInputAllowlist =
    options.noInputAllowlist ?? new Set(API_INPUT_VALIDATION_NO_INPUT_HANDLERS);
  const missing: InputValidationGap[] = [];

  for (const file of listApiRouteHandlerFiles(apiRoot)) {
    const relativePath = path.relative(apiRoot, file).replace(/\\/g, '/');
    const source = readFileSync(file, 'utf8');
    const chunks = splitHandlerChunks(source);

    for (const chunk of chunks) {
      const method = getHandlerMethod(chunk);
      if (!method) continue;

      const key = handlerKey(relativePath, method);
      const readsQuery = handlerReadsQuery(chunk);
      const readsJson = handlerReadsJsonBody(chunk);
      const usesParams = handlerUsesRouteParams(chunk);
      const readsInput = readsQuery || readsJson || usesParams;

      if (noInputAllowlist.has(key) && readsInput) {
        missing.push(`${key}: allowlisted as no-input but reads query/params/body`);
      }

      if (!readsInput) continue;

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

      if (!hasAnyInputMarker(chunk) && !jsonExempt.has(key)) {
        missing.push(`${key}: no input validation marker`);
      }
    }
  }

  return missing;
}
