import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  getRulebookChapterHref,
  getRulebookNavTree,
  type RulebookChapterMeta,
  type RulebookNavNode,
} from '@/lib/rules/rulebook';
import { loadRulebookSearchChunks } from '@/lib/rules/rulebook-search-load';
import { RulebookSearch } from '@/components/rules/rulebook-search';

function ChapterLink({
  chapter,
  currentSlug,
  number,
  nested = false,
}: {
  chapter: RulebookChapterMeta;
  currentSlug?: string | undefined;
  number?: number | undefined;
  nested?: boolean | undefined;
}) {
  const active = chapter.slug === currentSlug;
  return (
    <Link
      href={getRulebookChapterHref(chapter.slug)}
      className={cn(
        'touch-tier-standard flex min-w-0 items-center rounded-md py-1.5',
        nested ? 'px-3 pl-7' : 'px-3',
        active
          ? 'bg-primary-subtle-bg font-medium text-text-primary'
          : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary',
      )}
      aria-current={active ? 'page' : undefined}
    >
      {number != null ? (
        <span className="mr-2 shrink-0 text-text-muted tabular-nums">{number}.</span>
      ) : null}
      <span className="min-w-0 text-pretty">{chapter.title}</span>
    </Link>
  );
}

function ChapterTree({
  nodes,
  currentSlug,
}: {
  nodes: readonly RulebookNavNode[];
  currentSlug?: string | undefined;
}) {
  return (
    <ol className="space-y-1 text-sm">
      {nodes.map((node) => {
        return (
          <li key={node.slug}>
            <ChapterLink chapter={node} currentSlug={currentSlug} number={node.chapterNumber} />
            {node.children.length > 0 ? (
              <ol className="mt-0.5 space-y-0.5">
                {node.children.map((child) => (
                  <li key={child.slug}>
                    <ChapterLink chapter={child} currentSlug={currentSlug} nested />
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function OnThisPage({ headings }: { headings: readonly { id: string; title: string }[] }) {
  if (headings.length === 0) return null;
  return (
    <div className="mt-4 border-t border-border-light pt-4">
      <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-text-muted uppercase">
        On this page
      </p>
      <ul className="space-y-1 text-sm">
        {headings.map((heading) => (
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
  );
}

export function RulebookNav({ currentSlug }: { currentSlug?: string | undefined }) {
  const tree = getRulebookNavTree();
  const chapters = tree.flatMap((node) => [node, ...node.children]);
  const current = chapters.find((chapter) => chapter.slug === currentSlug);
  const searchChunks = loadRulebookSearchChunks();
  const headings = current?.headings ?? [];

  return (
    <nav
      aria-label="Rulebook chapters"
      className="mb-6 md:sticky md:top-24 md:mb-0 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto"
    >
      <p className="mb-2 hidden px-3 text-xs font-semibold tracking-wide text-text-muted uppercase md:block">
        Chapters
      </p>
      <RulebookSearch chunks={searchChunks} />
      <details className="rounded-lg border border-border-light bg-surface md:hidden">
        <summary className="touch-tier-standard flex cursor-pointer items-center px-4 font-medium text-text-primary">
          Chapters
        </summary>
        <div className="border-t border-border-light px-1 py-2">
          <ChapterTree nodes={tree} currentSlug={currentSlug} />
          <OnThisPage headings={headings} />
        </div>
      </details>
      <div className="hidden md:block">
        <ChapterTree nodes={tree} currentSlug={currentSlug} />
        <OnThisPage headings={headings} />
      </div>
    </nav>
  );
}
