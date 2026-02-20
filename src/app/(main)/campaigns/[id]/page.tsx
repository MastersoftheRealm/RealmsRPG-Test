/**
 * Campaign Detail Page
 * =====================
 * View campaign roster, invite code, add/remove characters.
 * Realm Masters can view player character sheets (read-only).
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Crown,
  Copy,
  Check,
  UserPlus,
  Trash2,
  ChevronLeft,
  ExternalLink,
  Dices,
  Pencil,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import {
  PageContainer,
  PageHeader,
  Button,
  EmptyState,
  LoadingState,
  Alert,
  Modal,
  IconButton,
  useToast,
} from '@/components/ui';
import { DeleteConfirmModal } from '@/components/shared';
import { RollEntryCard } from '@/components/character-sheet';
import { useCampaign, useCharacters, useInvalidateCampaigns, useAuth, useCampaignRolls } from '@/hooks';
import { addCharacterToCampaignAction, removeCharacterFromCampaignAction, deleteCampaignAction, updateCampaignAction } from '../actions';
import { MAX_CAMPAIGN_CHARACTERS, OWNER_MAX_CHARACTERS } from '../constants';
import type { Campaign, CampaignCharacter } from '@/types/campaign';

const FALLBACK_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23053357"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="white" font-family="Arial">?</text></svg>';

export default function CampaignDetailPage() {
  return (
    <ProtectedRoute>
      <CampaignDetailContent />
    </ProtectedRoute>
  );
}

function CampaignDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const campaignId = params.id as string;
  const { user } = useAuth();

  const { data: campaign, isLoading, error } = useCampaign(campaignId);
  const { data: characters = [] } = useCharacters();
  const { rolls: campaignRolls = [] } = useCampaignRolls(campaignId);
  const invalidateCampaigns = useInvalidateCampaigns();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<CampaignCharacter | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [pendingAddCharacter, setPendingAddCharacter] = useState<{
    id: string;
    name: string;
    level: number;
    portrait?: string;
    archetypeName?: string;
    ancestryName?: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const handleCopyCode = () => {
    if (campaign?.inviteCode) {
      navigator.clipboard.writeText(campaign.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddCharacter = async (char: { id: string; name: string; level: number; portrait?: string; archetypeName?: string; ancestryName?: string }) => {
    setActionError(null);
    setActionLoading(true);
    try {
      const archetypeType = char.archetypeName?.toLowerCase().replace(/\s+/g, '-');
      const result = await addCharacterToCampaignAction({
        campaignId,
        characterId: char.id,
        characterName: char.name,
        portrait: char.portrait,
        level: char.level,
        species: char.ancestryName,
        archetypeType: archetypeType || undefined,
      });
      if (result.success) {
        invalidateCampaigns();
        setAddModalOpen(false);
        setPendingAddCharacter(null);
        if (result.visibilityUpdated) {
          showToast('Character visibility was set to Campaign so the Realm Master and players can view it.', 'success');
        }
      } else {
        setActionError(result.error || 'Failed to add character');
      }
    } catch {
      setActionError('Failed to add character');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectCharacterToAdd = (char: { id: string; name: string; level: number; portrait?: string; archetypeName?: string; ancestryName?: string; visibility?: string }) => {
    if (char.visibility === 'private') {
      setAddModalOpen(false);
      setPendingAddCharacter(char);
    } else {
      handleAddCharacter(char);
    }
  };

  const handleRemoveCharacter = async (c: CampaignCharacter) => {
    setActionError(null);
    setActionLoading(true);
    try {
      const result = await removeCharacterFromCampaignAction({
        campaignId,
        userId: c.userId,
        characterId: c.characterId,
      });
      if (result.success) {
        invalidateCampaigns();
        setRemoveConfirm(null);
      } else {
        setActionError(result.error || 'Failed to remove character');
      }
    } catch {
      setActionError('Failed to remove character');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const result = await deleteCampaignAction(campaignId);
      if (result.success) {
        router.push('/campaigns');
      } else {
        setActionError(result.error || 'Failed to delete campaign');
      }
    } catch {
      setActionError('Failed to delete campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!campaign || nameInput.trim() === campaign.name) {
      setEditingName(false);
      return;
    }
    setActionError(null);
    setUpdateLoading(true);
    try {
      const result = await updateCampaignAction(campaignId, { name: nameInput.trim() });
      if (result.success) {
        invalidateCampaigns();
        setEditingName(false);
      } else {
        setActionError(result.error || 'Failed to update name');
      }
    } catch {
      setActionError('Failed to update name');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!campaign) {
      setEditingDescription(false);
      return;
    }
    const newDesc = descriptionInput.trim();
    const currentDesc = campaign.description ?? '';
    if (newDesc === currentDesc) {
      setEditingDescription(false);
      return;
    }
    setActionError(null);
    setUpdateLoading(true);
    try {
      const result = await updateCampaignAction(campaignId, { description: newDesc || undefined });
      if (result.success) {
        invalidateCampaigns();
        setEditingDescription(false);
      } else {
        setActionError(result.error || 'Failed to update description');
      }
    } catch {
      setActionError('Failed to update description');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Loading campaign..." />
      </PageContainer>
    );
  }

  if (error || !campaign) {
    return (
      <PageContainer size="xl">
        <Alert variant="danger" title="Campaign not found">
          This campaign may have been deleted or you may not have access to it.
        </Alert>
        <Link href="/campaigns" className="mt-4 inline-block text-primary-600 hover:underline">
          ← Back to Campaigns
        </Link>
      </PageContainer>
    );
  }

  const currentUserId = user?.uid;
  const isRealmMaster = campaign.ownerId === currentUserId;

  const ownerCharacters = campaign.characters?.filter((c) => c.userId === campaign.ownerId) ?? [];
  const otherCharacters = campaign.characters?.filter((c) => c.userId !== campaign.ownerId) ?? [];
  const totalCharacters = campaign.characters?.length ?? 0;
  const isCampaignFull = totalCharacters >= MAX_CAMPAIGN_CHARACTERS;
  const canAddOwnCharacters =
    isRealmMaster &&
    ownerCharacters.length < OWNER_MAX_CHARACTERS &&
    !isCampaignFull;
  const charactersNotInCampaign = characters.filter(
    (c) => !campaign.characters?.some((cc) => cc.userId === currentUserId && cc.characterId === c.id)
  );

  return (
    <PageContainer size="xl">
      <div className="mb-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-600 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            {isRealmMaster && editingName ? (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') {
                    setNameInput(campaign.name);
                    setEditingName(false);
                  }
                }}
                className="text-2xl md:text-3xl font-bold text-text-primary px-2 py-1 border-2 border-primary-400 rounded-lg focus:ring-2 focus:ring-primary-500 w-full max-w-md"
                autoFocus
                disabled={updateLoading}
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary flex items-center gap-2">
                {campaign.name}
                {isRealmMaster && (
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(campaign.name);
                      setEditingName(true);
                    }}
                    className="text-primary-500 hover:text-primary-600 transition-colors hover:scale-110"
                    title="Edit campaign name"
                    disabled={updateLoading}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </h1>
            )}
            {isRealmMaster && editingDescription ? (
              <div className="mt-2">
                <textarea
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  onBlur={handleSaveDescription}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setDescriptionInput(campaign.description ?? '');
                      setEditingDescription(false);
                    }
                  }}
                  className="mt-2 w-full max-w-xl px-2 py-1 text-text-primary border-2 border-primary-400 rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[80px] bg-surface"
                  placeholder="Brief description of your campaign..."
                  autoFocus
                  disabled={updateLoading}
                />
              </div>
            ) : (
              (campaign.description || isRealmMaster) && (
                <p className="mt-2 text-text-secondary flex items-center gap-2">
                  {campaign.description || (isRealmMaster ? 'No description — click pencil to add one' : '')}
                  {isRealmMaster && !editingName && (
                    <button
                      type="button"
                      onClick={() => {
                        setDescriptionInput(campaign.description ?? '');
                        setEditingDescription(true);
                      }}
                      className="text-primary-500 hover:text-primary-600 transition-colors hover:scale-110"
                      title="Edit description"
                      disabled={updateLoading}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </p>
              )
            )}
          </div>
          {isRealmMaster && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
                Delete Campaign
              </Button>
            </div>
          )}
        </div>
      </div>

      {actionError && (
        <Alert variant="danger" className="mb-4" onDismiss={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* Campaign full notice */}
      {isCampaignFull && (
        <Alert variant="warning" className="mb-4">
          This campaign has reached the maximum of {MAX_CAMPAIGN_CHARACTERS} characters. Remove a character to add more.
        </Alert>
      )}

      {/* Invite Code */}
      <div className="rounded-xl border border-border-light bg-surface p-6 mb-6">
        <h3 className="font-semibold text-text-primary mb-2">Invite Code</h3>
        <p className="text-sm text-text-secondary mb-3">
          Share this code with players so they can join your campaign.
          {isCampaignFull && ' (Campaign is full — no new players can join until someone leaves.)'}
        </p>
        <div className="flex items-center gap-3">
          <code className="px-4 py-2 bg-surface-alt rounded-lg font-mono text-xl font-bold tracking-widest text-primary-700">
            {campaign.inviteCode}
          </code>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyCode}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Realm Master */}
      <div className="rounded-xl border border-border-light bg-surface p-6 mb-6">
        <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Crown className="w-5 h-5 text-accent-500" />
          Realm Master: {campaign.ownerUsername || 'Unknown'}
        </h3>
        {ownerCharacters.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {ownerCharacters.map((c) => (
              <CharacterChip
                key={`${c.userId}-${c.characterId}`}
                character={c}
                isOwner={true}
                canRemove={isRealmMaster}
                onRemove={() => setRemoveConfirm(c)}
                onViewSheet={isRealmMaster ? undefined : undefined}
              />
            ))}
            {canAddOwnCharacters && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="flex flex-col items-center justify-center w-20 h-24 rounded-lg border-2 border-dashed border-border-light hover:border-primary-400 hover:bg-primary-50 transition-colors text-text-muted"
              >
                <UserPlus className="w-6 h-6" />
                <span className="text-xs mt-1">Add</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {canAddOwnCharacters ? (
              <Button variant="outline" onClick={() => setAddModalOpen(true)}>
                <UserPlus className="w-4 h-4" />
                Add Your Characters
              </Button>
            ) : (
              <p className="text-text-muted text-sm">No characters added yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Other Players */}
      {otherCharacters.length > 0 && (
        <div className="rounded-xl border border-border-light bg-surface p-6 mb-6">
          <h3 className="font-semibold text-text-primary mb-3">Players</h3>
          <div className="flex flex-wrap gap-4">
            {otherCharacters.map((c) => (
              <CharacterChip
                key={`${c.userId}-${c.characterId}`}
                character={c}
                isOwner={false}
                canRemove={isRealmMaster || c.userId === currentUserId}
                onRemove={() => setRemoveConfirm(c)}
                onViewSheet={isRealmMaster ? `/campaigns/${campaignId}/view/${c.userId}/${c.characterId}` : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Campaign Roll Log — same layout/styling as character sheet RollLog */}
      <div className="rounded-xl border border-border-light bg-surface p-6 mb-6">
        <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Dices className="w-5 h-5 text-accent-500" />
          Campaign Roll Log
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Rolls from all characters in this campaign. Updates in real time.
        </p>
        <div className="max-h-[400px] overflow-y-auto p-2 bg-surface-alt rounded-lg">
          {campaignRolls.length === 0 ? (
            <p className="text-center text-text-muted italic py-10">
              No campaign rolls yet. Rolls from character sheets will appear here.
            </p>
          ) : (
            campaignRolls.map((roll) => (
              <RollEntryCard
                key={roll.id}
                roll={roll}
                characterName={'characterName' in roll ? roll.characterName : undefined}
              />
            ))
          )}
        </div>
      </div>

      {/* Add Character Modal */}
      {addModalOpen && (
        <AddCharacterModal
          characters={charactersNotInCampaign}
          onSelect={handleSelectCharacterToAdd}
          onClose={() => setAddModalOpen(false)}
          loading={actionLoading}
        />
      )}

      {/* Add character visibility confirmation (private → campaign) */}
      {pendingAddCharacter && (
        <Modal
          isOpen
          onClose={() => setPendingAddCharacter(null)}
          title="Character visibility will change"
        >
          <p className="text-text-secondary mb-4">
            <strong>{pendingAddCharacter.name}</strong> is private. Adding to this campaign will set its visibility to <strong>Campaign</strong> so the Realm Master and other players can view it (read-only). You can change this later in the character&apos;s Notes tab.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setPendingAddCharacter(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAddCharacter(pendingAddCharacter)}
              disabled={actionLoading}
              isLoading={actionLoading}
            >
              Add to campaign
            </Button>
          </div>
        </Modal>
      )}

      {/* Remove Confirm */}
      {removeConfirm && (
        <Modal
          isOpen={!!removeConfirm}
          onClose={() => setRemoveConfirm(null)}
          title="Remove Character"
        >
          <p className="text-text-secondary mb-4">
            Remove {removeConfirm.characterName} from the campaign? They can rejoin with the invite code later.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setRemoveConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => removeConfirm && handleRemoveCharacter(removeConfirm)}
              disabled={actionLoading}
            >
              Remove
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={campaign.name}
          itemType="campaign"
          deleteContext="campaigns"
          isDeleting={actionLoading}
          onConfirm={handleDeleteCampaign}
          onClose={() => setDeleteConfirm(false)}
        />
      )}
    </PageContainer>
  );
}

function CharacterChip({
  character,
  isOwner,
  canRemove,
  onRemove,
  onViewSheet,
}: {
  character: CampaignCharacter;
  isOwner: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onViewSheet?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border-light bg-surface-alt min-w-[200px]">
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-primary-800">
        <Image
          src={character.portrait || FALLBACK_AVATAR}
          alt={character.characterName}
          width={56}
          height={56}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text-primary truncate">{character.characterName}</p>
        <p className="text-sm text-text-muted">
          Lvl {character.level}
          {character.species && ` • ${character.species}`}
          {character.archetype && ` • ${character.archetype}`}
        </p>
        {!isOwner && character.ownerUsername && (
          <p className="text-xs text-text-muted">@{character.ownerUsername}</p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onViewSheet && (
          <Link href={onViewSheet} target="_blank" rel="noopener noreferrer">
            <IconButton label="View sheet" size="sm">
              <ExternalLink className="w-4 h-4" />
            </IconButton>
          </Link>
        )}
        {canRemove && (
          <IconButton
            label="Remove"
            variant="danger"
            size="sm"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        )}
      </div>
    </div>
  );
}

function AddCharacterModal({
  characters,
  onSelect,
  onClose,
  loading,
}: {
  characters: Array<{ id: string; name: string; level: number; portrait?: string; archetypeName?: string; ancestryName?: string; visibility?: string }>;
  onSelect: (char: { id: string; name: string; level: number; portrait?: string; archetypeName?: string; ancestryName?: string; visibility?: string }) => void;
  onClose: () => void;
  loading: boolean;
}) {
  if (characters.length === 0) {
    return (
      <Modal isOpen onClose={onClose} title="Add Character">
        <p className="text-text-secondary">You have no more characters to add.</p>
        <Button className="mt-4" onClick={onClose}>
          Close
        </Button>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="Add Character to Campaign">
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {characters.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            disabled={loading}
            className="flex items-center gap-3 w-full p-3 rounded-lg border border-border-light hover:bg-surface-alt text-left transition-colors disabled:opacity-50"
          >
            {c.portrait ? (
              <img src={c.portrait} alt="" className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary-800 flex items-center justify-center text-white text-sm font-bold">
                {c.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-text-muted">
                Level {c.level}
                {c.archetypeName && ` • ${c.archetypeName}`}
                {c.ancestryName && ` • ${c.ancestryName}`}
              </p>
            </div>
          </button>
        ))}
      </div>
      <Button variant="ghost" className="mt-4" onClick={onClose}>
        Cancel
      </Button>
    </Modal>
  );
}
