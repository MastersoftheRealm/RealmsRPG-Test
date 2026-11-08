import { describe, expect, it } from 'vitest';
import { redactSensitiveLogText } from './lib/supabase-backup-redact.mjs';

const SYNTHETIC_URI = 'postgresql://backup_user:super_secret_pw@db.example.com:5432/postgres';

describe('supabase-backup redaction (synthetic)', () => {
  it('redacts postgres URI passwords', () => {
    expect(redactSensitiveLogText(`connecting ${SYNTHETIC_URI} now`)).toBe(
      'connecting postgresql://backup_user:<redacted>@db.example.com:5432/postgres now',
    );
  });

  it('redacts password query parameters and libpq key=value pairs', () => {
    expect(redactSensitiveLogText('?sslmode=require&password=leaked_pw')).toBe(
      '?sslmode=require&password=<redacted>',
    );
    expect(
      redactSensitiveLogText("host=db.example.com password='leaked_pw' user=backup_user"),
    ).toBe('host=db.example.com password=<redacted> user=backup_user');
  });

  it('redacts an exact echo of the supplied connection string', () => {
    const echoed = `pg_dump: error: could not connect: ${SYNTHETIC_URI}`;
    expect(redactSensitiveLogText(echoed, [SYNTHETIC_URI])).toBe(
      'pg_dump: error: could not connect: <redacted-connection>',
    );
  });
});
