/**
 * GET /api/user/library/counts
 * Auth-only aggregated My Library tab badges (ADR-0015 / TASK-774).
 * Static `counts` wins over `[type]`.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { apiErrorResponse, logApiError } from '@/lib/api-error';
import {
  asLibraryCountsClient,
  fetchLibraryTabCounts,
  USER_LIBRARY_COUNT_TABLES,
} from '@/lib/library/fetch-library-tab-counts';

export async function GET() {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = asLibraryCountsClient(await createClient());
    const counts = await fetchLibraryTabCounts(supabase, USER_LIBRARY_COUNT_TABLES, user.uid);
    return NextResponse.json(counts);
  } catch (err) {
    logApiError('GET /api/user/library/counts', err);
    return apiErrorResponse('Failed to load library counts', 500);
  }
}
