import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FOOTER_COPY } from '@/lib/constants/site-copy';
import { accountAvatarInitial } from '@/components/layout/header';

const confirmModal = readFileSync(
  new URL('../components/patterns/chrome/confirm-action-modal.tsx', import.meta.url),
  'utf8',
);
const notFound = readFileSync(new URL('./not-found.tsx', import.meta.url), 'utf8');

describe('website bugs batch 13 (86e3jym90 / 86e3jyh5d / 86e3jx7xy)', () => {
  it('keeps library delete/duplicate confirms as centered dialogs with backdrop at 375 (86e3jym90)', () => {
    expect(confirmModal).not.toContain('fullScreenOnMobile');
    expect(confirmModal).toContain('size="sm"');
  });

  it('lists Creature Creator and Species Creator in the footer Create column (86e3jyh5d)', () => {
    const labels = FOOTER_COPY.groups.create.links.map((l) => l.label);
    expect(labels).toContain('Creature Creator');
    expect(labels).toContain('Species Creator');
    expect(FOOTER_COPY.groups.create.links.some((l) => l.href === '/creature-creator')).toBe(true);
    expect(FOOTER_COPY.groups.create.links.some((l) => l.href === '/species-creator')).toBe(true);
  });

  it('uses readable decorative 404 copy and auth fallbacks for the header avatar (86e3jx7xy)', () => {
    expect(notFound).toContain('text-text-muted');
    expect(notFound).not.toContain('text-surface');
    const authUser = { id: 'u1', uid: 'u1', email: 'player@example.com' };
    expect(accountAvatarInitial(null, authUser)).toBe('P');
    expect(
      accountAvatarInitial({ username: 'Ada' }, { id: 'u2', uid: 'u2', email: 'x@y.com' }),
    ).toBe('A');
    expect(accountAvatarInitial(null, null)).toBe('?');
  });
});
