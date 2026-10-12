import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy } from './content-security-policy';

function connectSrc(policy: string): string {
  const directive = policy.split('; ').find((part) => part.startsWith('connect-src '));
  if (!directive) throw new Error('connect-src missing');
  return directive;
}

describe('buildContentSecurityPolicy', () => {
  it('allows the toolbar websocket that the console was blocking', () => {
    const connect = connectSrc(buildContentSecurityPolicy('production'));
    expect(connect).toContain('wss://ws-us3.pusher.com');
    expect(connect).toContain('wss://*.supabase.co');
    expect(connect).not.toContain('ws://localhost');
    expect(connect).not.toContain('ws://127.0.0.1');
  });

  it('omits unsafe-eval outside development', () => {
    const production = buildContentSecurityPolicy('production');
    const scriptSrc = production.split('; ').find((part) => part.startsWith('script-src '));
    expect(scriptSrc).toBe(
      "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
    );
    expect(buildContentSecurityPolicy('development')).toContain(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    );
  });

  it('allows the local ws socket in development and still allows hosted realtime', () => {
    const connect = connectSrc(buildContentSecurityPolicy('development'));
    expect(connect).toContain('ws://localhost:*');
    expect(connect).toContain('ws://127.0.0.1:*');
    expect(connect).toContain('wss://*.supabase.co');
    expect(connect).toContain('wss://ws-us3.pusher.com');
  });
});
