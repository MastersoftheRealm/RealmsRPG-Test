import Link from 'next/link';
import { getRulebookChapterHref, type RulebookChapterMeta } from '@/lib/rules/rulebook';

export function RulebookPager({
  previous,
  next,
}: {
  previous?: RulebookChapterMeta | undefined;
  next?: RulebookChapterMeta | undefined;
}) {
  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Adjacent chapters"
      className="mt-10 flex flex-col gap-3 border-t border-border-light pt-6 sm:flex-row sm:justify-between"
    >
      {previous ? (
        <Link
          href={getRulebookChapterHref(previous.slug)}
          className="touch-tier-standard inline-flex items-center font-medium text-primary-link-fg hover:underline"
        >
          ← {previous.title}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={getRulebookChapterHref(next.slug)}
          className="touch-tier-standard inline-flex items-center font-medium text-primary-link-fg hover:underline sm:justify-end"
        >
          {next.title} →
        </Link>
      ) : null}
    </nav>
  );
}
