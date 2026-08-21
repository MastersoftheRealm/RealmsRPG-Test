import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Prose wrapper for compiled rulebook MDX (ADR-0021). */
export function RulebookArticle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <article
      className={cn(
        'font-nunito text-base leading-relaxed text-text-secondary',
        '[&_h2]:mt-8 [&_h2]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:first:mt-0',
        '[&_h3]:mt-6 [&_h3]:scroll-mt-24 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-text-primary',
        '[&_h4]:mt-4 [&_h4]:scroll-mt-24 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-text-primary',
        '[&_p]:mb-3',
        '[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5',
        '[&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5',
        '[&_li]:text-text-secondary',
        '[&_strong]:font-semibold [&_strong]:text-text-primary',
        '[&_em]:italic',
        '[&_a]:font-medium [&_a]:text-primary-link-fg [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-90',
        '[&_th]:border [&_th]:border-border-light [&_th]:bg-surface-alt [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-text-primary',
        '[&_td]:border [&_td]:border-border-light [&_td]:px-2 [&_td]:py-1.5',
        className,
      )}
    >
      {children}
    </article>
  );
}
