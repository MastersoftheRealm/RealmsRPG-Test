import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LibraryGuestNotice } from './library-guest-notice';

describe('LibraryGuestNotice (86e3ju8jt)', () => {
  it('stacks copy and Sign in on narrow widths instead of a squeezed row', () => {
    const html = renderToStaticMarkup(<LibraryGuestNotice />);

    expect(html).toContain('data-testid="library-guest-notice"');
    expect(html).toMatch(/flex-col[^"]*sm:flex-row/);
    expect(html).not.toMatch(/justify-between[^"]*flex items-center/);
    expect(html).toContain('min-w-0');
    expect(html).toContain('shrink-0');
    expect(html).toContain('Sign in');
    expect(html).toContain('/login?returnTo=/library');
  });
});
