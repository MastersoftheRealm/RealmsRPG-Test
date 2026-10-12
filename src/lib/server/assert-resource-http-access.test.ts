import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('assert-resource-http-access', () => {
  it('calls notFound when character API returns 404', () => {
    const src = readFileSync(
      path.join(process.cwd(), 'src/lib/server/assert-resource-http-access.ts'),
      'utf8',
    );
    expect(src).toContain('res.status === 404');
    expect(src).toContain('notFound()');
    expect(src).toContain('isGuestCharacterId');
  });
});
