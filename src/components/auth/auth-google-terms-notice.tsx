import Link from 'next/link';

/** Shown under Google sign-in on login and register (13+ self-attestation). */
export function AuthGoogleTermsNotice() {
  return (
    <p className="text-center text-sm text-text-secondary">
      By continuing, you confirm you&apos;re at least 13 and agree to the{' '}
      <Link href="/terms" className="text-primary-link-fg hover:text-primary-fg-hover">
        Terms
      </Link>{' '}
      and{' '}
      <Link href="/privacy" className="text-primary-link-fg hover:text-primary-fg-hover">
        Privacy Policy
      </Link>
    </p>
  );
}
