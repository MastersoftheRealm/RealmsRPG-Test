import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { RulebookChapterMeta } from '@/lib/rules/rulebook';

export function RulebookNav({
  chapters,
  currentSlug,
}: {
  chapters: readonly RulebookChapterMeta[];
  currentSlug?: string | undefined;
}) {
  const current = chapters.find((chapter) => chapter.slug === currentSlug);
  const list = (
    <ol className="space-y-1 text-sm">
      {chapters.map((chapter, index) => {
        const active = chapter.slug === currentSlug;
        return (
          <li key={chapter.slug}>
            <Link
              href={`/rules/${chapter.slug}`}
              className={cn(
                'touch-tier-standard flex items-center rounded-md px-3 py-1.5',
                active
                  ? 'bg-primary-subtle-bg font-medium text-text-primary'
                  : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span className="mr-2 text-text-muted tabular-nums">{index + 1}.</span>
              {chapter.title}
            </Link>
          </li>
        );
      })}
    </ol>
  );

  const onThisPage =
    current && current.headings.length > 0 ? (
      <div className="mt-4 border-t border-border-light pt-4">
        <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-text-muted uppercase">
          On this page
        </p>
        <ul className="space-y-1 text-sm">
          {current.headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className="touch-tier-standard flex items-center rounded-md px-3 py-1.5 text-text-secondary hover:bg-surface-alt hover:text-text-primary"
              >
                {heading.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <>
      <details className="mb-6 rounded-lg border border-border-light bg-surface md:hidden">
        <summary className="touch-tier-standard flex cursor-pointer items-center px-4 font-medium text-text-primary">
          Chapters
        </summary>
        <div className="border-t border-border-light px-1 py-2">
          {list}
          {onThisPage}
        </div>
      </details>
      <nav
        aria-label="Rulebook chapters"
        className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto md:block"
      >
        <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-text-muted uppercase">
          Chapters
        </p>
        {list}
        {onThisPage}
      </nav>
    </>
  );
}
