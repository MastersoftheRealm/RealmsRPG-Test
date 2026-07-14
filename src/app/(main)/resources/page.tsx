/**
 * Resources Page
 * ===============
 * Downloadable PDFs and references — edit prose in resources-copy.ts.
 */

import { Download, FileText, BookOpen, Users } from 'lucide-react';
import Link from 'next/link';
import { PageContainer, PageHeader, Button, Card } from '@/components/ui';
import { RESOURCES_COPY } from '@/lib/constants/site-copy';

const COMING_SOON_ICONS = [BookOpen, FileText, Users] as const;

export default function ResourcesPage() {
  return (
    <PageContainer size="prose">
      <PageHeader title={RESOURCES_COPY.pageTitle} description={RESOURCES_COPY.pageDescription} />

      <div className="space-y-8">
        <Card className="shadow-md p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-warning-light rounded-lg">
              <FileText className="w-8 h-8 text-warning-fg" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary mb-2">
                {RESOURCES_COPY.characterSheet.title}
              </h2>
              <p className="text-text-secondary mb-4">{RESOURCES_COPY.characterSheet.body}</p>
              <Button asChild variant="primary">
                <Link href={RESOURCES_COPY.characterSheet.href} download>
                  <Download className="w-5 h-5" />
                  {RESOURCES_COPY.characterSheet.downloadLabel}
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        <Card className="bg-surface-alt p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            {RESOURCES_COPY.comingSoon.heading}
          </h2>
          <ul className="space-y-3">
            {RESOURCES_COPY.comingSoon.items.map((label, i) => {
              const Icon = COMING_SOON_ICONS[i] ?? FileText;
              return (
                <li key={label} className="flex items-center gap-3 text-text-secondary">
                  <Icon className="w-5 h-5 text-text-muted" />
                  {label}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </PageContainer>
  );
}
