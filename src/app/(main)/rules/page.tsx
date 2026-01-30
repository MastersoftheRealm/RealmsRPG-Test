/**
 * Rules Page
 * ===========
 * Core rulebook embedded from Google Docs
 */

import { PageContainer, PageHeader } from '@/components/ui';

export default function RulesPage() {
  return (
    <PageContainer size="content">
      <PageHeader 
        title="Core Rulebook Alpha"
        description="Scroll through or use Ctrl+F to find the desired rule or reference you're looking for! Enjoy playing!"
      />

      <div className="bg-surface rounded-xl shadow-lg overflow-hidden">
        <iframe 
          src="https://docs.google.com/document/d/e/2PACX-1vR2In0Fvu9axM9bb85Ne2rSp5SEfBd3kA34a3IHtcR5fIJ4spxCVgWezaNtejtyaGGmLtG-WTTKbgbE/pub?embedded=true" 
          className="w-full border-0"
          style={{ height: '800px' }}
          allowFullScreen
          title="Realms RPG Core Rulebook"
        />
      </div>
    </PageContainer>
  );
}
