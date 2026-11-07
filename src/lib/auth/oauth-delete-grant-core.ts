import { createHash, createHmac, hkdfSync, randomBytes, timingSafeEqual } from 'node:crypto';

export const OAUTH_DELETE_GRANT_COOKIE = 'realms_oauth_delete_grant';
export const OAUTH_DELETE_INTENT_COOKIE = 'realms_oauth_delete_intent';
export const OAUTH_DELETE_GRANT_MAX_AGE_S = 5 * 60;
export const OAUTH_DELETE_INTENT_MAX_AGE_S = 10 * 60;

const GRANT_DERIVE_INFO = 'realms-oauth-delete-grant-v1';
const INTENT_DERIVE_INFO = 'realms-oauth-delete-intent-v1';

type SignedGrantPayload = {
  v: 1;
  uid: string;
  sid: string;
  exp: number;
};

export type SignedOAuthDeleteIntentPayload = {
  v: 2;
  uid: string;
  provider: 'google';
  nonce: string;
  iat: number;
  exp: number;
  cvh: string;
};

type AmrClaim = { method?: string; timestamp?: number };

function serviceRoleMaterial(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key || null;
}

function derivedSigningKey(info: string): Buffer | null {
  const material = serviceRoleMaterial();
  if (!material) return null;
  return Buffer.from(hkdfSync('sha256', material, '', info, 32));
}

function signPayload(payload: object, deriveInfo: string): string | null {
  const key = derivedSigningKey(deriveInfo);
  if (!key) return null;
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', key).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function decodeVerifiedSignedPayload<T extends { v: number; exp: number }>(
  token: string | undefined | null,
  deriveInfo: string,
  allowedVersions: ReadonlySet<number>,
  nowSec: number,
): T | null {
  const key = derivedSigningKey(deriveInfo);
  if (!key || !token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', key).update(body).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  let payload: T;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
  if (!allowedVersions.has(payload.v)) return null;
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) return null;
  return payload;
}

function verifySignedPayload<T extends { v: number; exp: number }>(
  token: string | undefined | null,
  deriveInfo: string,
  validate: (payload: T) => boolean,
  allowedVersions: ReadonlySet<number>,
  nowSec = Math.floor(Date.now() / 1000),
): boolean {
  const payload = decodeVerifiedSignedPayload<T>(token, deriveInfo, allowedVersions, nowSec);
  if (!payload) return false;
  return validate(payload);
}

const GRANT_VERSIONS = new Set([1]);
const INTENT_VERSIONS = new Set([2]);

export function hashPkceCodeVerifier(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function sessionIdFromAccessToken(accessToken: string): string | null {
  const segment = accessToken.split('.')[1];
  if (!segment) return null;
  try {
    const payload = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as {
      session_id?: unknown;
    };
    return typeof payload.session_id === 'string' && payload.session_id.length > 0
      ? payload.session_id
      : null;
  } catch {
    return null;
  }
}

function parseAccessTokenPayload(accessToken: string): {
  amr?: AmrClaim[];
  session_id?: string;
} | null {
  const segment = accessToken.split('.')[1];
  if (!segment) return null;
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as {
      amr?: AmrClaim[];
      session_id?: string;
    };
  } catch {
    return null;
  }
}

/** True when the access token amr lists an OAuth sign-in within [windowStart, windowEnd] (seconds). */
export function accessTokenProvesOAuthSignInInWindow(
  accessToken: string,
  windowStartSec: number,
  windowEndSec: number,
): boolean {
  const claims = parseAccessTokenPayload(accessToken);
  const amr = claims?.amr ?? [];
  return amr.some((entry) => {
    if (entry.method?.toLowerCase() !== 'oauth') return false;
    const ts = entry.timestamp;
    if (typeof ts !== 'number') return false;
    return ts >= windowStartSec && ts <= windowEndSec;
  });
}

export function isMyAccountDeleteReauthDestination(path: string): boolean {
  try {
    const url = new URL(path, 'https://realmsrpg.com');
    return url.pathname === '/my-account' && url.searchParams.get('deleteReauth') === '1';
  } catch {
    return false;
  }
}

export function mintOAuthDeleteGrant(
  uid: string,
  sessionId: string,
  nowSec = Math.floor(Date.now() / 1000),
): string | null {
  const payload: SignedGrantPayload = {
    v: 1,
    uid,
    sid: sessionId,
    exp: nowSec + OAUTH_DELETE_GRANT_MAX_AGE_S,
  };
  return signPayload(payload, GRANT_DERIVE_INFO);
}

export function verifyOAuthDeleteGrant(
  token: string | undefined | null,
  uid: string,
  sessionId: string,
  nowSec = Math.floor(Date.now() / 1000),
): boolean {
  return verifySignedPayload<SignedGrantPayload>(
    token,
    GRANT_DERIVE_INFO,
    (payload) => payload.uid === uid && payload.sid === sessionId,
    GRANT_VERSIONS,
    nowSec,
  );
}

export function createOAuthDeleteIntentNonce(): string {
  return randomBytes(16).toString('base64url');
}

export function mintOAuthDeleteIntent(
  uid: string,
  nonce: string,
  codeVerifierHash: string,
  nowSec = Math.floor(Date.now() / 1000),
): string | null {
  const payload: SignedOAuthDeleteIntentPayload = {
    v: 2,
    uid,
    provider: 'google',
    nonce,
    iat: nowSec,
    exp: nowSec + OAUTH_DELETE_INTENT_MAX_AGE_S,
    cvh: codeVerifierHash,
  };
  return signPayload(payload, INTENT_DERIVE_INFO);
}

export function verifyOAuthDeleteIntentBinding(
  token: string | undefined | null,
  codeVerifier: string | null | undefined,
  nowSec = Math.floor(Date.now() / 1000),
): SignedOAuthDeleteIntentPayload | null {
  if (!codeVerifier) return null;
  const expectedCvh = hashPkceCodeVerifier(codeVerifier);
  const payload = decodeVerifiedSignedPayload<SignedOAuthDeleteIntentPayload>(
    token,
    INTENT_DERIVE_INFO,
    INTENT_VERSIONS,
    nowSec,
  );
  if (!payload) return null;
  if (payload.provider !== 'google') return null;
  if (!payload.nonce || payload.cvh !== expectedCvh) return null;
  return payload;
}

export function verifyOAuthDeleteIntent(
  token: string | undefined | null,
  uid: string,
  codeVerifier: string | null | undefined,
  nowSec = Math.floor(Date.now() / 1000),
): boolean {
  const payload = verifyOAuthDeleteIntentBinding(token, codeVerifier, nowSec);
  return payload !== null && payload.uid === uid;
}
