/**
 * Shared soft gradient orbs used on the landing hero and auth shell.
 */

export function LandingGradientBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl dark:bg-primary-500/15" />
      <div className="absolute bottom-0 -left-20 h-64 w-64 rounded-full bg-accent-gold/15 blur-3xl dark:bg-accent-gold/10" />
    </div>
  );
}
