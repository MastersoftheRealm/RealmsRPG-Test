/**
 * Rules Page
 * ===========
 * Core rulebook embedded from Google Docs
 */

import { PageContainer, PageHeader } from '@/components/ui';

export default function RulesPage() {
  return (
    <PageContainer size="xl">
      <PageHeader 
        title="Core Rulebook Alpha"
        description="Scroll through or use Ctrl+F to find the desired rule or reference you're looking for! Enjoy playing!"
      />

      <div className="bg-surface rounded-xl shadow-lg overflow-hidden">
        <iframe 
          src="https://docs.google.com/document/d/e/2PACX-1vQabErotA2q4K7xCPtyR1rYmsJuzBNT48N_FL3FzaxWx2H1yITOq2SyxtBwVXdqtUTOIeGCMFTtljpR/pub?embedded=true"
          className="w-full border-0"
          style={{ height: 'min(900px, calc(100vh - 220px))' }}
          allowFullScreen
          title="Realms RPG Core Rulebook"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </PageContainer>
  );
}
