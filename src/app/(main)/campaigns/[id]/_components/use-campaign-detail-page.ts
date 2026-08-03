/**
 * Campaign detail page state + handlers (TASK-666c)
 * ==================================================
 * Co-located hook for the campaign detail facade — presentation lives in sibling sections.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui';
import { useCampaign, useCharacters, useInvalidateCampaigns, useAuth, useCampaignRolls } from '@/hooks';
import {
  addCharacterToCampaignAction,
  removeCharacterFromCampaignAction,
  deleteCampaignAction,
  updateCampaignAction,
} from '../../actions';
import { MAX_CAMPAIGN_CHARACTERS, OWNER_MAX_CHARACTERS } from '../../constants';
import type { CampaignCharacter } from '@/types/campaign';
import type { AddableCampaignCharacter } from './add-character-modal';

export function useCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const campaignId = params.id as string;
  const { user } = useAuth();

  const { data: campaign, isLoading, error } = useCampaign(campaignId);
  const { data: characters = [] } = useCharacters();
  const {
    rolls: campaignRolls = [],
    loading: campaignRollsLoading,
    isError: campaignRollsQueryError,
    error: campaignRollsQueryErr,
    refetch: refetchCampaignRolls,
  } = useCampaignRolls(campaignId);
  const invalidateCampaigns = useInvalidateCampaigns();
  const rollLogScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (campaignRolls.length > 0 && rollLogScrollRef.current) {
      rollLogScrollRef.current.scrollTop = rollLogScrollRef.current.scrollHeight;
    }
  }, [campaignRolls.length]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<CampaignCharacter | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
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

  const handleAddCharacter = async (char: AddableCampaignCharacter) => {
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
        if (result.visibilityUpdated) {
          showToast(
            'Character visibility was set to Campaign so other players in this campaign can view the sheet.',
            'success'
          );
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

  const currentUserId = user?.uid;
  const isRealmMaster = !!campaign && campaign.ownerId === currentUserId;

  const ownerCharacters = campaign?.characters?.filter((c) => c.userId === campaign.ownerId) ?? [];
  const otherCharacters = campaign?.characters?.filter((c) => c.userId !== campaign.ownerId) ?? [];
  const totalCharacters = campaign?.characters?.length ?? 0;
  const isCampaignFull = totalCharacters >= MAX_CAMPAIGN_CHARACTERS;
  const canAddOwnCharacters =
    isRealmMaster &&
    ownerCharacters.length < OWNER_MAX_CHARACTERS &&
    !isCampaignFull;
  const charactersNotInCampaign = characters.filter(
    (c) => !campaign?.characters?.some((cc) => cc.userId === currentUserId && cc.characterId === c.id)
  );

  return {
    campaignId,
    campaign,
    isLoading,
    error,
    campaignRolls,
    campaignRollsLoading,
    campaignRollsQueryError,
    campaignRollsQueryErr,
    refetchCampaignRolls,
    rollLogScrollRef,
    addModalOpen,
    setAddModalOpen,
    copied,
    removeConfirm,
    setRemoveConfirm,
    deleteConfirm,
    setDeleteConfirm,
    actionError,
    setActionError,
    actionLoading,
    editingName,
    setEditingName,
    editingDescription,
    setEditingDescription,
    nameInput,
    setNameInput,
    descriptionInput,
    setDescriptionInput,
    updateLoading,
    handleCopyCode,
    handleAddCharacter,
    handleRemoveCharacter,
    handleDeleteCampaign,
    handleSaveName,
    handleSaveDescription,
    currentUserId,
    isRealmMaster,
    ownerCharacters,
    otherCharacters,
    isCampaignFull,
    canAddOwnCharacters,
    charactersNotInCampaign,
    maxCampaignCharacters: MAX_CAMPAIGN_CHARACTERS,
  };
}

export type CampaignDetailPageModel = ReturnType<typeof useCampaignDetailPage>;
