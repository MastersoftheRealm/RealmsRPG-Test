import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FormInput } from './form-input';
import { PasswordInput } from './password-input';

describe('auth field errors a11y (86e3k0f66)', () => {
  it('FormInput links aria-invalid and aria-describedby to role=alert error', () => {
    const html = renderToStaticMarkup(
      <FormInput name="email" label="Email" error="Please enter a valid email address" />,
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="email-error"');
    expect(html).toContain('id="email-error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Please enter a valid email address');
  });

  it('PasswordInput links aria-invalid and aria-describedby to role=alert error', () => {
    const html = renderToStaticMarkup(
      <PasswordInput
        name="password"
        label="Password"
        error="Password must be at least 6 characters"
      />,
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="password-error"');
    expect(html).toContain('id="password-error"');
    expect(html).toContain('role="alert"');
  });
});
