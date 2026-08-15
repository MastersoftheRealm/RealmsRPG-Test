/**
 * Campaigns Page
 * ==============
 * Create, join, and manage campaigns. Campaigns are collections of characters
 * from multiple users, run by a Realm Master.
 * Guests see a soft gate; sign in to create or join campaigns.
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Users, PlusCircle, LogIn, Crown, UserPlus, ChevronRight } from 'lucide-react';
import {
  PageContainer,
  PageHeader,
  TabNavigation,
  TabContentPanel,
  useTabGroup,
  Button,
  Input,
  Textarea,
  EmptyState,
  LoadingState,
  Alert,
  useToast,
} from '@/components/ui';
import { InfoTippy } from '@/components/shared';
import { campaignsHelp } from '../../../../public/tooltip-text';
import { cn } from '@/lib/utils';
import { PortraitThumb } from '@/components/character/portrait-thumb';
import { useCampaigns, useCharacters, useInvalidateCampaigns, useAuth } from '@/hooks';
import { createCampaignAction, joinCampaignAction } from './actions';
import { isValidInviteCodeFormat } from '@/lib/campaign-invite';
import type { CampaignSummary } from '@/types/campaign';

type TabId = 'my-campaigns' | 'create' | 'join';

const TABS = [
  { id: 'my-campaigns' as TabId, label: 'My Campaigns', icon: <Users className="h-4 w-4" /> },
  { id: 'create' as TabId, label: 'Create Campaign', icon: <PlusCircle className="h-4 w-4" /> },
  { id: 'join' as TabId, label: 'Join Campaign', icon: <LogIn className="h-4 w-4" /> },
];

export default function CampaignsPage() {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    );
  }
  if (!user) {
    return (
      <PageContainer size="xl">
        <PageHeader
          title="Campaigns"
          description="Create campaigns, invite players, and manage your Realm Master sessions."
        />
        <div className="mx-auto max-w-lg rounded-xl border border-border-light bg-surface-alt p-8 text-center md:p-12">
          <Users className="mx-auto mb-4 h-14 w-14 text-text-muted" aria-hidden />
          <h2 className="mb-2 text-xl font-bold text-text-primary">
            Sign in to create or join campaigns
          </h2>
          <p className="mb-6 text-text-secondary">
            Campaigns let you run games as a Realm Master or join with your characters. Sign in to
            get started.
          </p>
          <Link href="/login?returnTo=/campaigns">
            <Button variant="primary" size="lg">
              <LogIn className="h-4 w-4" aria-hidden />
              Sign in
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingState message="Loading..." />
        </div>
      }
    >
      <CampaignsContent />
    </Suspense>
  );
}

function CampaignsContent() {
  const { tabGroupId, sharedPanelId } = useTabGroup();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('my-campaigns');

  const tabParam = searchParams.get('tab');
  const urlTab: TabId | null = tabParam === 'create' || tabParam === 'join' ? tabParam : null;
  if (urlTab && activeTab !== urlTab) {
    setActiveTab(urlTab);
  }

  const {
    data: campaigns = [],
    isLoading: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useCampaigns();
  const { data: characters = [], isLoading: charactersLoading } = useCharacters();
  const invalidateCampaigns = useInvalidateCampaigns();

  return (
    <PageContainer size="xl">
      <PageHeader
        title="Campaigns"
        description="Create campaigns, invite players, and manage your Realm Master sessions."
        actions={
          <InfoTippy content={campaignsHelp} label="Campaign workflow help" placement="left" />
        }
      />

      <div className="min-w-0">
        <TabNavigation
          tabs={TABS.map((t) => ({
            ...t,
            count: t.id === 'my-campaigns' ? campaigns.length : undefined,
          }))}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
          tabGroupId={tabGroupId}
          sharedTabPanelId={sharedPanelId}
        />
      </div>

      <TabContentPanel
        tabGroupId={tabGroupId}
        id={sharedPanelId}
        activeTab={activeTab}
        className="mt-6 min-w-0"
      >
        {activeTab === 'my-campaigns' && (
          <MyCampaignsTab
            campaigns={campaigns}
            isLoading={campaignsLoading}
            error={campaignsError}
            onRetry={refetchCampaigns}
            onSwitchToCreate={() => setActiveTab('create')}
            onSwitchToJoin={() => setActiveTab('join')}
          />
        )}
        {activeTab === 'create' && (
          <CreateCampaignTab
            onSuccess={() => {
              invalidateCampaigns();
              setActiveTab('my-campaigns');
            }}
          />
        )}
        {activeTab === 'join' && (
          <JoinCampaignTab
            characters={characters}
            isLoading={charactersLoading}
            onSuccess={() => {
              invalidateCampaigns();
              setActiveTab('my-campaigns');
              router.push('/campaigns');
            }}
          />
        )}
      </TabContentPanel>
    </PageContainer>
  );
}

function MyCampaignsTab({
  campaigns,
  isLoading,
  error,
  onRetry,
  onSwitchToCreate,
  onSwitchToJoin,
}: {
  campaigns: CampaignSummary[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onSwitchToCreate: () => void;
  onSwitchToJoin: () => void;
}) {
  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading campaigns..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" title="Error loading campaigns">
        <p className="mb-4">{error.message}</p>
        <Button variant="outline" size="sm" onClick={() => onRetry()}>
          Try again
        </Button>
      </Alert>
    );
  }

  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-10 w-10" />}
        title="No campaigns yet"
        description="Create a campaign to start your adventure as a Realm Master, or join one with an invite code."
        action={{
          label: 'Create Campaign',
          onClick: onSwitchToCreate,
        }}
        secondaryAction={{
          label: 'Join Campaign',
          onClick: onSwitchToJoin,
        }}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => (
        <Link
          key={campaign.id}
          href={`/campaigns/${campaign.id}`}
          className="block rounded-xl border border-border-light bg-surface p-5 shadow-sm transition-all hover:border-primary-outline-border hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-text-primary">{campaign.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                {campaign.description || 'No description'}
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
                {campaign.isOwner ? (
                  <span className="inline-flex items-center gap-1">
                    <Crown className="h-4 w-4 text-accent-500" />
                    Realm Master
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <UserPlus className="h-4 w-4" />
                    {campaign.ownerUsername || 'Realm Master'}
                  </span>
                )}
                <span>•</span>
                <span>
                  {campaign.characterCount} character{campaign.characterCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-text-muted" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function CreateCampaignTab({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await createCampaignAction({
        name: name.trim(),
        description: description.trim(),
      });
      if (result.success && result.inviteCode) {
        setCreatedInviteCode(result.inviteCode);
        if (result.campaignId) setCreatedCampaignId(result.campaignId);
      } else {
        setError(result.error || 'Failed to create campaign');
      }
    } catch {
      setError('Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewCampaign = () => {
    if (createdCampaignId) {
      router.push(`/campaigns/${createdCampaignId}`);
    } else {
      onSuccess();
    }
  };

  if (createdInviteCode) {
    return (
      <div className="max-w-lg rounded-xl border border-success-200 bg-success-50 p-6">
        <h2 className="text-lg font-bold text-success-fg">Campaign created!</h2>
        <p className="mt-2 text-success-fg">
          Share this invite code with players so they can join:
        </p>
        <div className="mt-4 rounded-lg border border-success-200 bg-surface p-4">
          <code className="font-mono text-2xl font-bold tracking-widest text-primary-subtle-fg">
            {createdInviteCode}
          </code>
        </div>
        <Button className="mt-4" onClick={handleViewCampaign}>
          View Campaign
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">Campaign Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. The Metal Heart"
          required
          minLength={2}
          maxLength={100}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-text-secondary">
          Description (optional)
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of your campaign..."
          rows={4}
          maxLength={500}
          className="resize-none"
        />
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Button type="submit" disabled={submitting || !name.trim()} isLoading={submitting}>
        Create Campaign
      </Button>
    </form>
  );
}

function JoinCampaignTab({
  characters,
  isLoading,
  onSuccess,
}: {
  characters: Array<{
    id: string;
    name: string;
    level: number;
    portrait?: string;
    archetypeName?: string;
    ancestryName?: string;
    visibility?: string;
  }>;
  isLoading: boolean;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [inviteCode, setInviteCode] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  const performJoin = async () => {
    if (!selectedCharacter) return;
    setSubmitting(true);
    setError(null);
    try {
      const archetypeType = String(selectedCharacter.archetypeName ?? '')
        .toLowerCase()
        .replace(/\s+/g, '-');
      const result = await joinCampaignAction({
        inviteCode: inviteCode.trim(),
        characterId: selectedCharacter.id,
        characterName: selectedCharacter.name,
        portrait: selectedCharacter.portrait,
        level: selectedCharacter.level,
        species: selectedCharacter.ancestryName,
        archetypeType: archetypeType || undefined,
      });
      if (result.success) {
        if (result.visibilityUpdated) {
          showToast(
            'Joined! Character visibility was set to Campaign so the Realm Master and players can view your sheet.',
            'success',
          );
        } else {
          showToast('Joined the campaign!', 'success');
        }
        onSuccess();
      } else {
        setError(result.error || 'Failed to join campaign');
      }
    } catch {
      setError('Failed to join campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedCharacter) {
      setError('Please select a character');
      return;
    }
    await performJoin();
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState message="Loading characters..." />
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <EmptyState
        icon={<UserPlus className="h-10 w-10" />}
        title="No characters to join with"
        description="Create a character first, then you can join a campaign with them."
        action={{
          label: 'Create Character',
          onClick: () =>
            router.push('/characters/new?returnTo=' + encodeURIComponent('/campaigns?tab=join')),
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-1">
          <label className="block text-sm font-medium text-text-secondary">Invite Code</label>
        </div>
        <Input
          value={inviteCode}
          onChange={(e) => {
            const v = e.target.value
              .toUpperCase()
              .replace(/[\s-]/g, '')
              .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, '')
              .slice(0, 8);
            setInviteCode(v);
          }}
          placeholder="Enter 8-character code"
          required
          maxLength={10}
          className="font-mono tracking-widest uppercase"
          aria-describedby="invite-code-hint"
        />
        <p id="invite-code-hint" className="mt-1 text-xs text-text-muted">
          Letters A–Z (not I or O) and numbers 2–9. Spaces or dashes are removed automatically.
        </p>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Character to Join With
        </label>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border-light p-2">
          {characters.map((c) => (
            <label
              key={c.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                selectedCharacterId === c.id
                  ? 'border-primary-outline-border bg-primary-subtle-bg'
                  : 'border-transparent hover:bg-surface-alt',
              )}
            >
              <input
                type="radio"
                name="character"
                value={c.id}
                checked={selectedCharacterId === c.id}
                onChange={() => setSelectedCharacterId(c.id)}
                className="sr-only"
              />
              <PortraitThumb portrait={c.portrait} className="h-12 w-12 flex-shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-text-primary">{c.name}</span>
                <span className="block text-sm text-text-muted">
                  Level {c.level}
                  {c.archetypeName && ` • ${c.archetypeName}`}
                  {c.ancestryName && ` • ${c.ancestryName}`}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Button
        type="submit"
        disabled={submitting || !isValidInviteCodeFormat(inviteCode) || !selectedCharacterId}
        isLoading={submitting}
      >
        Join Campaign
      </Button>
    </form>
  );
}
