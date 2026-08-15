/**
 * Profile information + picture card (TASK-666)
 */

'use client';

import { User as UserIcon, Camera } from 'lucide-react';
import type { AccountProfile } from '@/hooks';
import { cn } from '@/lib/utils';
import { Button, Card, Spinner } from '@/components/ui';
import { ExpandableImage } from '@/components/shared';
import { formatMemberSince, type AccountMessage } from './account-helpers';

type Props = {
  profile: AccountProfile | null;
  authProviderLabel: string;
  uploadingPicture: boolean;
  pictureMessage: AccountMessage | null;
  onOpenPictureModal: () => void;
};

export function AccountProfileCard({
  profile,
  authProviderLabel,
  uploadingPicture,
  pictureMessage,
  onOpenPictureModal,
}: Props) {
  return (
    <Card className="p-6 shadow-md">
      <h2 className="mb-4 text-lg font-bold text-text-primary">Profile Information</h2>

      <div className="mb-6 flex items-center gap-4 border-b border-border-subtle pb-4">
        {profile?.photoURL ? (
          <ExpandableImage
            src={profile.photoURL}
            alt="Profile picture"
            className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-border-light bg-image-matte"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic profile photo URL */}
            <img src={profile.photoURL} alt="" className="h-full w-full object-contain" />
            {uploadingPicture && (
              <div className="absolute inset-0 flex items-center justify-center bg-text-primary/40">
                <Spinner size="sm" variant="white" />
              </div>
            )}
          </ExpandableImage>
        ) : (
          <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border-light bg-surface-alt text-text-muted">
            <UserIcon className="h-8 w-8" aria-hidden />
            {uploadingPicture && (
              <div className="absolute inset-0 flex items-center justify-center bg-text-primary/40">
                <Spinner size="sm" variant="white" />
              </div>
            )}
          </div>
        )}
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenPictureModal}
            disabled={uploadingPicture}
          >
            <Camera className="h-4 w-4" aria-hidden />
            {profile?.photoURL ? 'Change Picture' : 'Add Picture'}
          </Button>
          <p className="mt-1 text-xs text-text-muted">JPG, PNG, GIF, or WebP. Max 5MB.</p>
          {pictureMessage && (
            <p
              className={cn(
                'mt-1 text-xs',
                pictureMessage.type === 'success' ? 'text-success-fg' : 'text-danger-fg',
              )}
            >
              {pictureMessage.text}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-border-subtle py-2">
          <span className="text-text-secondary">Username</span>
          <span className="font-medium text-text-primary">{profile?.username || 'Not set'}</span>
        </div>
        <div className="flex items-center justify-between border-b border-border-subtle py-2">
          <span className="text-text-secondary">Email</span>
          <span className="font-medium text-text-primary">{profile?.email}</span>
        </div>
        <div className="flex items-center justify-between border-b border-border-subtle py-2">
          <span className="text-text-secondary">Signed in with</span>
          <span className="font-medium text-text-primary">{authProviderLabel}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-text-secondary">Member Since</span>
          <span className="font-medium text-text-primary">
            {formatMemberSince(profile?.createdAt)}
          </span>
        </div>
      </div>
    </Card>
  );
}
