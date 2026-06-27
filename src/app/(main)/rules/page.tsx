/**
 * Rules Page
 * ===========
 * Core rulebook embedded from Google Docs
 */

import { PageContainer, PageHeader, Card } from '@/components/ui';

const RULEBOOK_EMBED_URL =
  'https://docs.google.com/document/d/e/2PACX-1vQabErotA2q4K7xCPtyR1rYmsJuzBNT48N_FL3FzaxWx2H1yITOq2SyxtBwVXdqtUTOIeGCMFTtljpR/pub?embedded=true';
const RULEBOOK_VIEW_URL =
  'https://docs.google.com/document/d/e/2PACX-1vQabErotA2q4K7xCPtyR1rYmsJuzBNT48N_FL3FzaxWx2H1yITOq2SyxtBwVXdqtUTOIeGCMFTtljpR/pub';

export default function RulesPage() {
  return (
    <PageContainer size="xl">
      <PageHeader 
        title="Core Rulebook Alpha"
        description="Scroll through or use Ctrl+F to find the desired rule or reference you're looking for! Enjoy playing!"
      />

      <p className="text-sm text-text-secondary mb-4">
        Having trouble viewing the embedded rulebook?{' '}
        <a
          href={RULEBOOK_VIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-link-fg hover:underline font-medium"
        >
          Open in new tab
        </a>
      </p>

      <Card className="shadow-lg overflow-hidden p-0 border-0">
        <iframe 
          src={RULEBOOK_EMBED_URL}
          className="w-full border-0"
          style={{ height: 'min(900px, calc(100vh - 220px))' }}
          allowFullScreen
          title="Realms RPG Core Rulebook"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </Card>
    </PageContainer>
  );
}
