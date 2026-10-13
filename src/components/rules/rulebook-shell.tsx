import type { ReactNode } from 'react';
import { RulebookNav } from '@/components/rules/rulebook-nav';

export function RulebookShell({
  currentSlug,
  children,
}: {
  currentSlug?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:items-start md:gap-8">
      <RulebookNav currentSlug={currentSlug} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
