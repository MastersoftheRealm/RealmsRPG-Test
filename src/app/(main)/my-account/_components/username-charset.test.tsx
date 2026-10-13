import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AccountUsernameCard } from './account-preferences-cards';
import { USERNAME_CHARSET_ERROR, USERNAME_PATTERN, usernameCharsetError } from './account-helpers';

describe('username charset validation (86e3jt56h)', () => {
  it('compiles under the browser v flag and flags symbols while typing', () => {
    expect(() => new RegExp(`^(?:${USERNAME_PATTERN})$`, 'v')).not.toThrow();
    expect(usernameCharsetError('qa!@#')).toBe(USERNAME_CHARSET_ERROR);
    expect(usernameCharsetError('qa_player-a')).toBeNull();
    expect(usernameCharsetError('')).toBeNull();
  });

  it('shows the inline error on the username field', () => {
    const html = renderToStaticMarkup(
      <AccountUsernameCard
        profile={null}
        isAdmin={false}
        newUsername="qa!@#"
        setNewUsername={() => {}}
        usernameChanging={false}
        usernameMessage={null}
        onSubmit={() => {}}
      />,
    );
    expect(html).toContain(USERNAME_CHARSET_ERROR);
    expect(html).toContain('aria-invalid="true"');
  });
});
