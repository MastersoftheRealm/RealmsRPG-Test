import { describe, expect, it } from 'vitest';
import { forgotPasswordSchema, loginSchema, registerSchema } from './schemas';

describe('auth email schemas', () => {
  it('trims and lowercases pasted emails', () => {
    const email = '  User.Name+tag@Gmail.com ';
    expect(loginSchema.safeParse({ email, password: 'secret1' }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email }).success).toBe(true);
    const reg = registerSchema.safeParse({
      email,
      password: 'secret1',
      confirmPassword: 'secret1',
      acceptTerms: true,
    });
    expect(reg.success).toBe(true);
    if (reg.success) {
      expect(reg.data.email).toBe('user.name+tag@gmail.com');
    }
  });

  it('rejects obviously invalid addresses', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });
});
