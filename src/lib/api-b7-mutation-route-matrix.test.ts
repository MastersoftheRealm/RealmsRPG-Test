/**
 * B7 route matrix — auth, validation, and fail-closed checks on audited mutation handlers.
 * Per-route mocks live in each `route.test.ts`; this file covers cross-cutting gaps.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
  requireLiveUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    standardLimiter: { check: vi.fn() },
  };
});

import { PATCH as patchCrafting } from '@/app/api/crafting/[id]/route';
import { PATCH as patchEnhancedItem } from '@/app/api/user/enhanced-items/[id]/route';
import { POST as postOfficial } from '@/app/api/official/[type]/route';
import { POST as postUserLibrary } from '@/app/api/user/library/[type]/route';
import { getSession, requireLiveUser } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { standardLimiter } from '@/lib/rate-limit';

const mockGetSession = vi.mocked(getSession);
const mockRequireLiveUser = vi.mocked(requireLiveUser);
const mockIsAdmin = vi.mocked(isAdmin);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };

describe('B7 matrix — crafting PATCH', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 429 when rate limited (fail-closed, no write)', async () => {
    mockStandardLimiterCheck.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await patchCrafting(
      new NextRequest('http://localhost/api/crafting/craft-owned', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify({ status: 'in_progress' }),
      }),
      { params: Promise.resolve({ id: 'craft-owned' }) },
    );

    expect(response.status).toBe(429);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});

describe('B7 matrix — enhanced-items PATCH', () => {
  const update = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    update.mockReset();
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
    const selectChain = {
      eq: vi.fn(function eq() {
        return selectChain;
      }),
      maybeSingle: vi.fn(async () => ({
        data: { id: 'enh-owned', user_id: OWNER.uid, data: {} },
        error: null,
      })),
    };
    mockCreateClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => selectChain),
        update,
      })),
    } as never);
  });

  it('returns 403 for a cross-origin patch without writing', async () => {
    const response = await patchEnhancedItem(
      new NextRequest('http://localhost/api/user/enhanced-items/enh-owned', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
        body: JSON.stringify({ potency: 2 }),
      }),
      { params: Promise.resolve({ id: 'enh-owned' }) },
    );
    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});

describe('B7 matrix — official POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireLiveUser.mockResolvedValue(OWNER);
    mockIsAdmin.mockResolvedValue(true);
    mockCreateServiceRoleClient.mockReturnValue({
      from: vi.fn(() => ({
        insert: vi.fn(),
      })),
    } as never);
  });

  it('returns 400 for unsupported official power fields without writing', async () => {
    const response = await postOfficial(
      new NextRequest('http://localhost/api/official/powers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify({ name: 'Bolt', injectedOfficialKey: true }),
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );
    expect(response.status).toBe(400);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});

describe('B7 matrix — user library POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await postUserLibrary(
      new NextRequest('http://localhost/api/user/library/powers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify({ name: 'Bolt' }),
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );

    expect(response.status).toBe(401);
  });
});
