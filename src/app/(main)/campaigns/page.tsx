/**
 * Campaigns Page
 * ==============
 * Create, join, and manage campaigns. Campaigns are collections of characters
 * from multiple users, run by a Realm Master.
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  PlusCircle,
  LogIn,
  Crown,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import {
  PageContainer,
  PageHeader,
  TabNavigation,
  Button,
  Input,
  Textarea,
  EmptyState,
  LoadingState,
  Alert,
  Modal,
  useToast,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useCampaigns, useCharacters, useInvalidateCampaigns } from '@/hooks';
import {
  createCampaignAction,
  joinCampaignAction,
} from './actions';
import type { CampaignSummary } from '@/types/campaign';

type TabId = 'my-campaigns' | 'create' | 'join';

const TABS = [
  { id: 'my-campaigns' as TabId, label: 'My Campaigns', icon: <Users className="w-4 h-4" /> },
  { id: 'create' as TabId, label: 'Create Campaign', icon: <PlusCircle className="w-4 h-4" /> },
  { id: 'join' as TabId, label: 'Join Campaign', icon: <LogIn className="w-4 h-4" /> },
];

export default function CampaignsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><div className="animate-pulse text-text-muted">Loading...</div></div>}>
        <CampaignsContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function CampaignsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('my-campaigns');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'create' || tab === 'join') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const { data: campaigns = [], isLoading: campaignsLoading, error: campaignsError, refetch: refetchCampaigns } = useCampaigns();
  const { data: characters = [], isLoading: charactersLoading } = useCharacters();
  const invalidateCampaigns = useInvalidateCampaigns();

  return (
    <PageContainer size="xl">
      <PageHeader
        title="Campaigns"
        description="Create campaigns, invite players, and manage your Realm Master sessions."
      />

      <TabNavigation
        tabs={TABS.map((t) => ({
          ...t,
          count: t.id === 'my-campaigns' ? campaigns.length : undefined,
        }))}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      <div className="mt-6">
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
      </div>
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
        icon={<Users className="w-10 h-10" />}
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
          className="block rounded-xl border border-border-light bg-surface p-5 shadow-sm hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-lg text-text-primary truncate">
                {campaign.name}
              </h3>
              <p className="mt-1 text-sm text-text-secondary line-clamp-2">
                {campaign.description || 'No description'}
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
                {campaign.isOwner ? (
                  <span className="inline-flex items-center gap-1">
                    <Crown className="w-4 h-4 text-accent-500" />
                    Realm Master
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <UserPlus className="w-4 h-4" />
                    {campaign.ownerUsername || 'Realm Master'}
                  </span>
                )}
                <span>•</span>
                <span>{campaign.characterCount} character{campaign.characterCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
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
      const result = await createCampaignAction({ name: name.trim(), description: description.trim() });
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
      <div className="rounded-xl border border-success-200 bg-success-50 p-6 max-w-lg">
        <h3 className="font-bold text-lg text-success-800">Campaign created!</h3>
        <p className="mt-2 text-success-700">
          Share this invite code with players so they can join:
        </p>
        <div className="mt-4 p-4 bg-surface rounded-lg border border-success-200">
          <code className="text-2xl font-mono font-bold tracking-widest text-primary-700">
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
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Campaign Name
        </label>
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
        <label className="block text-sm font-medium text-text-secondary mb-1">
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
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}
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
  characters: Array<{ id: string; name: string; level: number; portrait?: string; archetypeName?: string; ancestryName?: string; visibility?: string }>;
  isLoading: boolean;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [inviteCode, setInviteCode] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibilityConfirmOpen, setVisibilityConfirmOpen] = useState(false);

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);

  const performJoin = async () => {
    if (!selectedCharacter) return;
    setSubmitting(true);
    setError(null);
    try {
      const archetypeType = String(selectedCharacter.archetypeName ?? '').toLowerCase().replace(/\s+/g, '-');
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
          showToast('Character visibility was set to Campaign so the Realm Master and players can view it.', 'success');
        }
        setVisibilityConfirmOpen(false);
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
    if (selectedCharacter.visibility === 'private') {
      setVisibilityConfirmOpen(true);
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
        icon={<UserPlus className="w-10 h-10" />}
        title="No characters to join with"
        description="Create a character first, then you can join a campaign with them."
        action={{
          label: 'Create Character',
          onClick: () => router.push('/characters/new?returnTo=' + encodeURIComponent('/campaigns?tab=join')),
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Invite Code
        </label>
        <Input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="Enter 8-character code"
          required
          maxLength={8}
          className="font-mono tracking-widest uppercase"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Character to Join With
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-border-light rounded-lg p-2">
          {characters.map((c) => (
            <label
              key={c.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors',
                selectedCharacterId === c.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-transparent hover:bg-surface-alt'
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
              {c.portrait ? (
                <img
                  src={c.portrait}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary-800 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {c.name.charAt(0)}
                </div>
              )}
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
        disabled={submitting || !inviteCode.trim() || !selectedCharacterId}
        isLoading={submitting}
      >
        Join Campaign
      </Button>

      {visibilityConfirmOpen && selectedCharacter && (
        <Modal
          isOpen
          onClose={() => setVisibilityConfirmOpen(false)}
          title="Character visibility will change"
        >
          <p className="text-text-secondary mb-4">
            <strong>{selectedCharacter.name}</strong> is private. Joining this campaign will set its visibility to <strong>Campaign</strong> so the Realm Master and other players can view it (read-only). You can change this later in the character&apos;s Notes tab.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setVisibilityConfirmOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={() => performJoin()} disabled={submitting} isLoading={submitting}>
              Join campaign
            </Button>
          </div>
        </Modal>
      )}
    </form>
  );
}

