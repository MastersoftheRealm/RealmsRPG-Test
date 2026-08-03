/**
 * Campaign detail header — name/description edit + delete (TASK-666c)
 */

'use client';

import Link from 'next/link';
import { ChevronLeft, Pencil } from 'lucide-react';
import { Button, PageHeader } from '@/components/ui';
import type { Campaign } from '@/types/campaign';

export function CampaignDetailHeader({
  campaign,
  isRealmMaster,
  editingName,
  editingDescription,
  nameInput,
  descriptionInput,
  updateLoading,
  onNameInputChange,
  onDescriptionInputChange,
  onStartEditName,
  onStartEditDescription,
  onCancelEditName,
  onCancelEditDescription,
  onSaveName,
  onSaveDescription,
  onDeleteClick,
}: {
  campaign: Campaign;
  isRealmMaster: boolean;
  editingName: boolean;
  editingDescription: boolean;
  nameInput: string;
  descriptionInput: string;
  updateLoading: boolean;
  onNameInputChange: (value: string) => void;
  onDescriptionInputChange: (value: string) => void;
  onStartEditName: () => void;
  onStartEditDescription: () => void;
  onCancelEditName: () => void;
  onCancelEditDescription: () => void;
  onSaveName: () => void;
  onSaveDescription: () => void;
  onDeleteClick: () => void;
}) {
  return (
    <>
      <div className="mb-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-fg-hover mb-4"
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
                onChange={(e) => onNameInputChange(e.target.value)}
                onBlur={onSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveName();
                  if (e.key === 'Escape') onCancelEditName();
                }}
                className="text-2xl md:text-3xl font-bold text-text-primary px-2 py-1 border-2 border-primary-outline-border rounded-lg focus:ring-2 focus:ring-primary-outline-border w-full max-w-md"
                autoFocus
                disabled={updateLoading}
              />
            ) : (
              <PageHeader
                title={campaign.name}
                size="sm"
                className="mb-0"
                actions={
                  isRealmMaster ? (
                    <button
                      type="button"
                      onClick={onStartEditName}
                      className="text-primary-fg hover:text-primary-fg-hover transition-colors hover:scale-110 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                      title="Edit campaign name"
                      aria-label="Edit campaign name"
                      disabled={updateLoading}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  ) : undefined
                }
              />
            )}
            {isRealmMaster && editingDescription ? (
              <div className="mt-2">
                <textarea
                  aria-label="Campaign description"
                  value={descriptionInput}
                  onChange={(e) => onDescriptionInputChange(e.target.value)}
                  onBlur={onSaveDescription}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') onCancelEditDescription();
                  }}
                  className="mt-2 w-full max-w-xl px-2 py-1 text-text-primary border-2 border-primary-outline-border rounded-lg focus:ring-2 focus:ring-primary-outline-border min-h-[80px] bg-surface"
                  placeholder="Brief description of your campaign..."
                  autoFocus
                  disabled={updateLoading}
                />
              </div>
            ) : (
              (campaign.description || isRealmMaster) && (
                <p className="mt-2 text-text-secondary flex items-center gap-2">
                  {campaign.description || (isRealmMaster ? 'No description. Click the pencil to add one.' : '')}
                  {isRealmMaster && !editingName && (
                    <button
                      type="button"
                      onClick={onStartEditDescription}
                      className="text-primary-fg hover:text-primary-fg-hover transition-colors hover:scale-110"
                      title="Edit description"
                      aria-label="Edit description"
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
              <Button variant="danger" size="sm" onClick={onDeleteClick}>
                Delete Campaign
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
