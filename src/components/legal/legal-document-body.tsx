import Link from 'next/link';
import type {
  LegalBlock,
  LegalListItem,
  LegalPageCopy,
  LegalSegment,
} from '@/lib/constants/copy/legal-copy-types';

const linkClassName = 'text-primary-link-fg underline underline-offset-2 hover:opacity-90';

function segmentKey(segment: LegalSegment, index: number): string {
  if (typeof segment === 'string') return `t-${index}-${segment.slice(0, 24)}`;
  if (segment.kind === 'strong') return `strong-${index}-${segment.text.slice(0, 24)}`;
  if (segment.kind === 'link') return `link-${index}-${segment.href}`;
  return `email-${index}-${segment.address}`;
}

function LegalSegments({ segments }: { segments: readonly LegalSegment[] }) {
  return (
    <>
      {segments.map((segment, index) => {
        if (typeof segment === 'string') {
          return <span key={segmentKey(segment, index)}>{segment}</span>;
        }
        if (segment.kind === 'strong') {
          return <strong key={segmentKey(segment, index)}>{segment.text}</strong>;
        }
        if (segment.kind === 'link') {
          return (
            <Link key={segmentKey(segment, index)} href={segment.href} className={linkClassName}>
              {segment.label}
            </Link>
          );
        }
        return (
          <a
            key={segmentKey(segment, index)}
            href={`mailto:${segment.address}`}
            className={linkClassName}
          >
            {segment.address}
          </a>
        );
      })}
    </>
  );
}

function LegalBulletList({ items }: { items: readonly LegalListItem[] }) {
  return (
    <ul className="list-inside list-disc space-y-1 text-text-secondary">
      {items.map((item, index) => (
        <li key={`li-${index}`}>
          <LegalSegments segments={item} />
        </li>
      ))}
    </ul>
  );
}

function LegalNumberedList({ items }: { items: readonly (readonly LegalSegment[])[] }) {
  return (
    <ol className="list-inside list-decimal space-y-1 text-text-secondary">
      {items.map((item, index) => (
        <li key={`ol-${index}`}>
          <LegalSegments segments={item} />
        </li>
      ))}
    </ol>
  );
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="mb-3 text-text-secondary">
          <LegalSegments segments={block.segments} />
        </p>
      );
    case 'subheading':
      return <h3 className="mb-2 font-semibold text-text-primary">{block.text}</h3>;
    case 'ul':
      return (
        <div className="mb-3">
          <LegalBulletList items={block.items} />
        </div>
      );
    case 'ol':
      return (
        <div className="mb-3">
          <LegalNumberedList items={block.items} />
        </div>
      );
    default:
      return null;
  }
}

export function LegalDocumentBody({ copy }: { copy: LegalPageCopy }) {
  return (
    <div className="prose prose-gray max-w-none space-y-8">
      <p className="text-text-secondary">
        <strong>Last updated:</strong> {copy.lastUpdated}
      </p>

      <aside className="space-y-3 rounded-lg border border-border-light bg-surface-alt p-4 dark:border-border">
        <p className="font-semibold text-text-primary">The short version</p>
        <ul className="list-inside list-disc space-y-1 text-text-secondary">
          {copy.shortVersion.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </aside>

      {copy.intro.map((paragraph, index) => (
        <p key={`intro-${index}`} className="text-text-secondary">
          <LegalSegments segments={paragraph} />
        </p>
      ))}

      {copy.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="mb-4 text-xl font-semibold text-text-primary">{section.heading}</h2>
          {section.blocks.map((block, index) => (
            <LegalBlockView key={`${section.heading}-block-${index}`} block={block} />
          ))}
        </section>
      ))}
    </div>
  );
}
