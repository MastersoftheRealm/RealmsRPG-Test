/**
 * User Library API
 * ================
 * List and create user library items. Powers, techniques, items, creatures, and
 * species use columnar tables (Supabase).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { ensureUserProfile } from '@/lib/ensure-user-profile';
import { parseRoleQuotaExceededDbError } from '@/lib/role-quota-messages';
import { asDbJson } from '@/lib/supabase/database';
import {
  validateJson,
  libraryItemCreateSchema,
  libraryListQuerySchema,
  userLibraryTypeParamSchema,
  validateQuery,
  validateRouteParams,
} from '@/lib/api-validation';
import { standardLimiter, buildRateLimitKey, resolveClientIp } from '@/lib/rate-limit';
import {
  COLUMNAR_LIBRARY_TYPES,
  rowToItem,
  bodyToColumnar,
  toDbRow,
  rowToItemSpecies,
  bodyToColumnarSpecies,
  toDbRowSpecies,
  type ColumnarLibraryType,
} from '@/lib/library-columnar';
import { enrichRowsWithBankImageUrls } from '@/lib/entity-image-enrich-server';
import { validateUserLibraryWriteBody } from '@/lib/library-mutation-validation';
import { USER_LIBRARY_COLUMNAR_TABLES } from '@/lib/library-columnar-keys';

const isColumnar = (t: string): t is ColumnarLibraryType =>
  COLUMNAR_LIBRARY_TYPES.includes(t as ColumnarLibraryType);

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paramResult = await validateRouteParams(params, userLibraryTypeParamSchema);
    if (!paramResult.success) return paramResult.error;
    const { type } = paramResult.data;

    const supabase = await createClient();

    // PERF-01: lightweight server-side name lookup for save-dedupe. Returns only
    // `{ id, name }` for matching rows instead of downloading the whole library.
    const queryResult = validateQuery(request, libraryListQuerySchema);
    if (!queryResult.success) return queryResult.error;
    const nameFilter = queryResult.data.name?.trim();
    if (nameFilter) {
      const target = nameFilter.toLowerCase();
      if (isColumnar(type)) {
        // ilike narrows server-side (escape LIKE metacharacters); strict match in JS.
        const pattern = nameFilter.replace(/[%_\\]/g, (c) => `\\${c}`);
        const { data: rows, error: dbError } = await supabase
          .from(USER_LIBRARY_COLUMNAR_TABLES[type])
          .select('id, name')
          .eq('user_id', user.uid)
          .ilike('name', pattern);
        if (dbError) throw dbError;
        const matches = ((rows ?? []) as Array<Record<string, unknown>>)
          .map((r) => ({ id: String(r.id), name: String(r.name ?? '') }))
          .filter((r) => r.name.trim().toLowerCase() === target);
        return NextResponse.json(matches);
      }
      // Columnar user_species stores the name in `name`. The legacy `data` column
      // was dropped; selecting it returns Postgres 42703 and blocks save.
      const { data: rows, error: dbError } = await supabase
        .from('user_species')
        .select('id, name')
        .eq('user_id', user.uid);
      if (dbError) throw dbError;
      const matches = ((rows ?? []) as Array<Record<string, unknown>>)
        .map((r) => ({ id: String(r.id), name: String(r.name ?? '') }))
        .filter((r) => r.name.trim().toLowerCase() === target);
      return NextResponse.json(matches);
    }

    if (isColumnar(type)) {
      const { data: rows, error: dbError } = await supabase
        .from(USER_LIBRARY_COLUMNAR_TABLES[type])
        .select('*')
        .eq('user_id', user.uid);
      if (dbError) throw dbError;
      const list = (rows ?? []) as Record<string, unknown>[];
      await enrichRowsWithBankImageUrls(supabase, list);
      const items = list.map((r) => rowToItem(type, r, 'user'));
      items.sort((a, b) => {
        const na = String((a as Record<string, unknown>).name ?? '');
        const nb = String((b as Record<string, unknown>).name ?? '');
        return na.localeCompare(nb);
      });
      return NextResponse.json(items);
    }

    const { data: rows, error: dbError } = await supabase
      .from('user_species')
      .select('*')
      .eq('user_id', user.uid);
    if (dbError) throw dbError;
    const list = (rows ?? []) as Record<string, unknown>[];
    await enrichRowsWithBankImageUrls(supabase, list);
    const items = list.map((r) => rowToItemSpecies(r));
    items.sort((a, b) => {
      const na = String((a as Record<string, unknown>).name ?? '');
      const nb = String((b as Record<string, unknown>).name ?? '');
      return na.localeCompare(nb);
    });
    return NextResponse.json(items);
  } catch (err) {
    console.error('[API Error] GET /api/user/library/[type]:', err);
    return NextResponse.json({ error: 'Failed to load library items' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await standardLimiter.check(
      buildRateLimitKey('lib-post', { userId: user.uid, ip: resolveClientIp(request.headers) }),
    );
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const paramResult = await validateRouteParams(params, userLibraryTypeParamSchema);
    if (!paramResult.success) return paramResult.error;
    const { type } = paramResult.data;

    const validation = await validateJson(request, libraryItemCreateSchema);
    if (!validation.success) return validation.error;
    const body = validation.data as Record<string, unknown>;
    const writeValidation = validateUserLibraryWriteBody(type, body);
    if (writeValidation) return writeValidation;
    const duplicateOf = body.duplicateOf as string | undefined;

    const supabase = await createClient();
    await ensureUserProfile(supabase, user.uid);

    if (isColumnar(type)) {
      const now = new Date();

      if (duplicateOf) {
        const table = USER_LIBRARY_COLUMNAR_TABLES[type];
        const { data: existing, error: existingErr } = await supabase
          .from(table)
          .select('*')
          .eq('id', duplicateOf)
          .eq('user_id', user.uid)
          .maybeSingle();
        if (existingErr) throw existingErr;
        if (!existing) {
          return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }
        const item = rowToItem(type, existing as Record<string, unknown>, 'user');
        const baseName = String((item.name as string) || 'Item').trim();
        const copyData = { ...item, name: `${baseName} (Copy)` };
        delete (copyData as Record<string, unknown>).id;
        delete (copyData as Record<string, unknown>).docId;
        delete (copyData as Record<string, unknown>)._source;
        const { scalars, payload } = bodyToColumnar(type, { ...copyData, updatedAt: now });
        const newId = crypto.randomUUID();
        const row = toDbRow({
          id: newId,
          userId: user.uid,
          ...scalars,
          payload,
          createdAt: now,
          updatedAt: now,
        });
        const { data: inserted, error: insertErr } = await supabase.rpc(
          'insert_user_library_row_with_quota',
          {
            p_library_kind: type,
            p_row: asDbJson(row),
          },
        );
        if (insertErr) {
          const quota = parseRoleQuotaExceededDbError(insertErr);
          if (quota) return NextResponse.json(quota, { status: 403 });
          throw insertErr;
        }
        const insertedId =
          inserted &&
          typeof inserted === 'object' &&
          !Array.isArray(inserted) &&
          typeof (inserted as { id?: unknown }).id === 'string'
            ? (inserted as { id: string }).id
            : newId;
        return NextResponse.json({ id: insertedId });
      }

      const { scalars, payload } = bodyToColumnar(type, { ...body, updatedAt: now });
      const newId = crypto.randomUUID();
      const row = toDbRow({
        id: newId,
        userId: user.uid,
        ...scalars,
        payload,
        createdAt: now,
        updatedAt: now,
      });
      const { data: inserted, error: insertErr } = await supabase.rpc(
        'insert_user_library_row_with_quota',
        {
          p_library_kind: type,
          p_row: asDbJson(row),
        },
      );
      if (insertErr) {
        const quota = parseRoleQuotaExceededDbError(insertErr);
        if (quota) return NextResponse.json(quota, { status: 403 });
        throw insertErr;
      }
      const insertedId =
        inserted &&
        typeof inserted === 'object' &&
        !Array.isArray(inserted) &&
        typeof (inserted as { id?: unknown }).id === 'string'
          ? (inserted as { id: string }).id
          : newId;
      return NextResponse.json({ id: insertedId });
    }

    const now = new Date().toISOString();
    if (duplicateOf) {
      const { data: existing, error: existingErr } = await supabase
        .from('user_species')
        .select('*')
        .eq('id', duplicateOf)
        .eq('user_id', user.uid)
        .maybeSingle();
      if (existingErr) throw existingErr;
      if (!existing) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      const existingRow = existing as Record<string, unknown>;
      const copyItem = rowToItemSpecies(existingRow);
      const baseName = String((copyItem.name as string) || 'Item').trim();
      const copyData = { ...copyItem, name: `${baseName} (Copy)` };
      delete (copyData as Record<string, unknown>).id;
      delete (copyData as Record<string, unknown>).docId;
      delete (copyData as Record<string, unknown>)._source;
      const { scalars, payload } = bodyToColumnarSpecies({ ...copyData, updatedAt: now });
      const newId = crypto.randomUUID();
      const row = toDbRowSpecies({
        id: newId,
        user_id: user.uid,
        ...scalars,
        payload,
        created_at: now,
        updated_at: now,
      });
      const { data: inserted, error: insertErr } = await supabase.rpc(
        'insert_user_library_row_with_quota',
        {
          p_library_kind: 'species',
          p_row: asDbJson(row),
        },
      );
      if (insertErr) throw insertErr;
      const insertedId =
        inserted &&
        typeof inserted === 'object' &&
        !Array.isArray(inserted) &&
        typeof (inserted as { id?: unknown }).id === 'string'
          ? (inserted as { id: string }).id
          : newId;
      return NextResponse.json({ id: insertedId });
    }

    const { scalars, payload } = bodyToColumnarSpecies({ ...body, updatedAt: now });
    const newId = crypto.randomUUID();
    const row = toDbRowSpecies({
      id: newId,
      user_id: user.uid,
      ...scalars,
      payload,
      created_at: now,
      updated_at: now,
    });
    const { data: inserted, error: insertErr } = await supabase.rpc(
      'insert_user_library_row_with_quota',
      {
        p_library_kind: 'species',
        p_row: asDbJson(row),
      },
    );
    if (insertErr) throw insertErr;
    const insertedId =
      inserted &&
      typeof inserted === 'object' &&
      !Array.isArray(inserted) &&
      typeof (inserted as { id?: unknown }).id === 'string'
        ? (inserted as { id: string }).id
        : newId;
    return NextResponse.json({ id: insertedId });
  } catch (err) {
    console.error('[API Error] POST /api/user/library/[type]:', err);
    return NextResponse.json({ error: 'Failed to create library item' }, { status: 500 });
  }
}
