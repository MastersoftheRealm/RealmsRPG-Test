/**
 * Campaign Detail Page
 * =====================
 * View campaign roster, invite code, add/remove characters.
 * Realm Masters can view player character sheets (read-only).
 * Facade (TASK-666c): state/handlers in `use-campaign-detail-page`; sections under `_components/`.
 */

'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/layout';
import { PageContainer, Button, LoadingState, Alert, Modal } from '@/components/ui';
import { DeleteConfirmModal } from '@/components/patterns';
import { useCampaignDetailPage } from './_components/use-campaign-detail-page';
import { CampaignDetailHeader } from './_components/campaign-detail-header';
import { CampaignInviteSection } from './_components/campaign-invite-section';
import { CampaignRosterSection } from './_components/campaign-roster-section';
import { CampaignRollLogSection } from './_components/campaign-roll-log-section';
import { AddCharacterModal } from './_components/add-character-modal';

export default function CampaignDetailPage() {
  return (
    <ProtectedRoute>
      <CampaignDetailContent />
    </ProtectedRoute>
  );
}

function CampaignDetailContent() {
  const model = useCampaignDetailPage();

  if (model.isLoading) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Loading campaign..." />
      </PageContainer>
    );
  }

  if (model.error || !model.campaign) {
    return (
      <PageContainer size="xl">
        <Alert variant="danger" title="Campaign not found">
          This campaign may have been deleted or you may not have access to it.
        </Alert>
        <Link href="/campaigns" className="mt-4 inline-block text-primary-link-fg hover:underline">
          ← Back to Campaigns
        </Link>
      </PageContainer>
    );
  }

  const { campaign } = model;

  return (
    <PageContainer size="xl">
      <CampaignDetailHeader
        campaign={campaign}
        isRealmMaster={model.isRealmMaster}
        editingName={model.editingName}
        editingDescription={model.editingDescription}
        nameInput={model.nameInput}
        descriptionInput={model.descriptionInput}
        updateLoading={model.updateLoading}
        onNameInputChange={model.setNameInput}
        onDescriptionInputChange={model.setDescriptionInput}
        onStartEditName={() => {
          model.setNameInput(campaign.name);
          model.setEditingName(true);
        }}
        onStartEditDescription={() => {
          model.setDescriptionInput(campaign.description ?? '');
          model.setEditingDescription(true);
        }}
        onCancelEditName={() => {
          model.setNameInput(campaign.name);
          model.setEditingName(false);
        }}
        onCancelEditDescription={() => {
          model.setDescriptionInput(campaign.description ?? '');
          model.setEditingDescription(false);
        }}
        onSaveName={() => void model.handleSaveName()}
        onSaveDescription={() => void model.handleSaveDescription()}
        onDeleteClick={() => model.setDeleteConfirm(true)}
      />

      {model.actionError && (
        <Alert variant="danger" className="mb-4" onDismiss={() => model.setActionError(null)}>
          {model.actionError}
        </Alert>
      )}

      {model.isCampaignFull && (
        <Alert variant="warning" className="mb-4">
          This campaign has reached the maximum of {model.maxCampaignCharacters} characters. Remove
          a character to add more.
        </Alert>
      )}

      {model.isRealmMaster && (
        <CampaignInviteSection
          inviteCode={campaign.inviteCode}
          isCampaignFull={model.isCampaignFull}
          copied={model.copied}
          onCopy={model.handleCopyCode}
        />
      )}

      <CampaignRosterSection
        campaignId={model.campaignId}
        ownerUsername={campaign.ownerUsername}
        ownerCharacters={model.ownerCharacters}
        otherCharacters={model.otherCharacters}
        isRealmMaster={model.isRealmMaster}
        currentUserId={model.currentUserId}
        canAddOwnCharacters={model.canAddOwnCharacters}
        onAddClick={() => model.setAddModalOpen(true)}
        onRemoveClick={(c) => model.setRemoveConfirm(c)}
      />

      <CampaignRollLogSection
        rolls={model.campaignRolls}
        loading={model.campaignRollsLoading}
        isError={model.campaignRollsQueryError}
        errorMessage={model.campaignRollsQueryErr?.message}
        scrollRef={model.rollLogScrollRef}
        onRetry={() => void model.refetchCampaignRolls()}
      />

      {model.addModalOpen && (
        <AddCharacterModal
          characters={model.charactersNotInCampaign}
          onSelect={(char) => void model.handleAddCharacter(char)}
          onClose={() => model.setAddModalOpen(false)}
          loading={model.actionLoading}
        />
      )}

      {model.removeConfirm && (
        <Modal
          isOpen={!!model.removeConfirm}
          onClose={() => model.setRemoveConfirm(null)}
          title="Remove Character"
        >
          <p className="mb-4 text-text-secondary">
            Remove {model.removeConfirm.characterName} from the campaign? They can rejoin with the
            invite code later.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => model.setRemoveConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                model.removeConfirm && void model.handleRemoveCharacter(model.removeConfirm)
              }
              disabled={model.actionLoading}
            >
              Remove
            </Button>
          </div>
        </Modal>
      )}

      {model.deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={campaign.name}
          itemType="campaign"
          deleteContext="campaigns"
          isDeleting={model.actionLoading}
          onConfirm={() => void model.handleDeleteCampaign()}
          onClose={() => model.setDeleteConfirm(false)}
        />
      )}
    </PageContainer>
  );
}
