/**
 * GET /api/official/counts
 * Public Realms Library tab badges (ADR-0015 / TASK-774).
 * Static `counts` wins over `[type]`. `enhanced` is always 0.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiErrorResponse, logApiError } from '@/lib/api-error';
import {
  asLibraryCountsClient,
  fetchLibraryTabCounts,
  OFFICIAL_LIBRARY_COUNT_TABLES,
} from '@/lib/library/fetch-library-tab-counts';

const CACHE_CONTROL = 'private, max-age=0, must-revalidate';

export async function GET() {
  try {
    const supabase = asLibraryCountsClient(await createClient());
    const counts = await fetchLibraryTabCounts(supabase, OFFICIAL_LIBRARY_COUNT_TABLES);
    return NextResponse.json(counts, { headers: { 'Cache-Control': CACHE_CONTROL } });
  } catch (err) {
    logApiError('GET /api/official/counts', err);
    return apiErrorResponse('Failed to load library counts', 500);
  }
}
