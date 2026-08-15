/**
 * My Account Page
 * ===============
 * User profile and account settings page.
 * Facade (TASK-666): state/handlers in `use-my-account-page`; cards under `_components/`.
 */

'use client';

import { User as UserIcon } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import { LoadingState, Button, Alert, PageContainer, PageHeader } from '@/components/ui';
import { ImageUploadModal, RealmsImagePicker } from '@/components/shared';
import { useMyAccountPage } from './_components/use-my-account-page';
import { AccountRoleLimitsCard } from './_components/account-role-limits-card';
import { AccountProfileCard } from './_components/account-profile-card';
import { AccountTutorialsCard, AccountUsernameCard } from './_components/account-preferences-cards';
import {
  AccountEmailCard,
  AccountPasswordCard,
  AccountOauthNoticeCard,
} from './_components/account-security-cards';
import { AccountDangerZoneCard } from './_components/account-danger-zone-card';

function AccountContent() {
  const model = useMyAccountPage();

  if (model.loading) {
    return (
      <PageContainer size="xs">
        <LoadingState message="Loading account..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer size="xs" className="min-w-0 space-y-6">
      <PageHeader
        title="My Account"
        icon={<UserIcon className="h-8 w-8 text-primary-link-fg" />}
        description="Manage your profile and account settings"
        className="mb-0 min-w-0"
      />

      {model.profileLoadError && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Alert variant="danger" className="min-w-0 flex-1">
            {model.profileLoadError}. Some account details may be incomplete.
          </Alert>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void model.refetchProfile()}
            disabled={model.profileRetrying}
            aria-label="Retry loading account profile"
            className="min-h-[var(--touch-target-min,44px)] shrink-0 self-stretch sm:self-auto"
          >
            {model.profileRetrying ? 'Retrying…' : 'Retry'}
          </Button>
        </div>
      )}

      <AccountRoleLimitsCard profile={model.profile} />

      <AccountProfileCard
        profile={model.profile}
        authProviderLabel={model.authProviderLabel}
        uploadingPicture={model.uploadingPicture}
        pictureMessage={model.pictureMessage}
        onOpenPictureModal={() => model.setShowPictureModal(true)}
      />

      <AccountTutorialsCard
        tutorialsEnabled={model.tutorialsEnabled}
        onTutorialsChange={model.handleTutorialsChange}
      />

      <AccountUsernameCard
        profile={model.profile}
        isAdmin={model.isAdmin}
        newUsername={model.newUsername}
        setNewUsername={model.setNewUsername}
        usernameChanging={model.usernameChanging}
        usernameMessage={model.usernameMessage}
        onSubmit={model.handleUsernameChange}
      />

      {model.canChangeEmailPassword ? (
        <>
          <AccountEmailCard
            newEmail={model.newEmail}
            setNewEmail={model.setNewEmail}
            emailPassword={model.emailPassword}
            setEmailPassword={model.setEmailPassword}
            emailChanging={model.emailChanging}
            emailMessage={model.emailMessage}
            onSubmit={model.handleEmailChange}
          />
          <AccountPasswordCard
            currentPassword={model.currentPassword}
            setCurrentPassword={model.setCurrentPassword}
            newPassword={model.newPassword}
            setNewPassword={model.setNewPassword}
            confirmPassword={model.confirmPassword}
            setConfirmPassword={model.setConfirmPassword}
            passwordChanging={model.passwordChanging}
            passwordMessage={model.passwordMessage}
            onSubmit={model.handlePasswordChange}
            onSendResetEmail={() => void model.handleSendResetEmail()}
          />
        </>
      ) : (
        <AccountOauthNoticeCard authProviderLabel={model.authProviderLabel} />
      )}

      <AccountDangerZoneCard
        canChangeEmailPassword={model.canChangeEmailPassword}
        showDeleteConfirm={model.showDeleteConfirm}
        onShowDeleteConfirm={() => model.setShowDeleteConfirm(true)}
        deletePassword={model.deletePassword}
        setDeletePassword={model.setDeletePassword}
        deleteConfirmText={model.deleteConfirmText}
        setDeleteConfirmText={model.setDeleteConfirmText}
        deleting={model.deleting}
        deleteError={model.deleteError}
        onDelete={() => void model.handleDeleteAccount()}
        onCancel={model.cancelDeleteConfirm}
      />

      <ImageUploadModal
        isOpen={model.showPictureModal}
        onClose={() => model.setShowPictureModal(false)}
        onConfirm={model.handleProfilePictureUpload}
        onChooseFromLibrary={() => model.setShowPictureBank(true)}
        cropShape="round"
        aspect={1}
        title="Upload Profile Picture"
      />
      <RealmsImagePicker
        isOpen={model.showPictureBank}
        onClose={() => model.setShowPictureBank(false)}
        onSelect={({ image }) => {
          void model.handleBankProfilePicture(image.publicUrl);
        }}
        categories="portrait"
        allowAdminUpload={false}
        title="Choose Profile Picture"
        description="Pick species or creature art from the Realms Image Library."
      />
    </PageContainer>
  );
}

export default function MyAccountPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}
