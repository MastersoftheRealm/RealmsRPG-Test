/**
 * Browse Realms Library (read-only)
 * ==================================
 * Public page: view official Realms Library content without logging in.
 * No "Add to my library" — login and go to Library to add items.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wand2, Swords, Shield, Users } from 'lucide-react';
import { useAuth } from '@/hooks';
import { PageContainer, PageHeader, TabNavigation, Button } from '@/components/ui';
import { LibraryPublicContent, type LibraryPublicTabId } from '@/app/(main)/library/LibraryPublicContent';

const TABS: { id: LibraryPublicTabId; label: string; icon: React.ReactNode }[] = [
  { id: 'powers', label: 'Powers', icon: <Wand2 className="w-4 h-4" /> },
  { id: 'techniques', label: 'Techniques', icon: <Swords className="w-4 h-4" /> },
  { id: 'items', label: 'Armaments', icon: <Shield className="w-4 h-4" /> },
  { id: 'creatures', label: 'Creatures', icon: <Users className="w-4 h-4" /> },
];

export default function BrowsePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LibraryPublicTabId>('powers');

  return (
    <PageContainer size="xl">
      <PageHeader
        title="Browse Realms Library"
        description="Official Realms content: powers, techniques, armaments, and creatures. Log in to add items to your library and use them in the character creator."
        actions={
          !user ? (
            <Button asChild variant="primary">
              <Link href="/login?redirect=/library">Log in to add to My Library</Link>
            </Button>
          ) : (
            <Button asChild variant="primary">
              <Link href="/library">Open My Library</Link>
            </Button>
          )
        }
      />

      <div className="min-w-0 mb-6">
        <TabNavigation
          tabs={TABS.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as LibraryPublicTabId)}
          variant="underline"
        />
      </div>

      <LibraryPublicContent
        activeTab={activeTab}
        onLoginRequired={() => {}}
        readOnly={true}
      />
    </PageContainer>
  );
}
