'use client';

import { useState, type ClipboardEvent } from 'react';
import { Input, Textarea } from '@/components/ui';
import {
  CREATOR_DESCRIPTION_COUNTER_FROM,
  CREATOR_DESCRIPTION_MAX_LENGTH,
  CREATOR_DESCRIPTION_TRUNCATED_MESSAGE,
  CREATOR_NAME_MAX_LENGTH,
  CREATOR_NAME_TRUNCATED_MESSAGE,
  clampCreatorText,
  formatCreatorTextCounter,
  insertCreatorText,
} from '@/lib/creator/creator-text-limits';

function applyLimitedPaste(
  event: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  current: string,
  max: number,
  onValue: (value: string, truncated: boolean) => void,
) {
  const pasted = event.clipboardData.getData('text');
  if (!pasted) return;
  const field = event.currentTarget;
  const next = insertCreatorText(
    current,
    pasted,
    field.selectionStart ?? current.length,
    field.selectionEnd ?? current.length,
    max,
  );
  if (!next.truncated) return;
  event.preventDefault();
  onValue(next.value, true);
}

export function CreatorNameField({
  id,
  value,
  onChange,
  placeholder,
  label,
  'aria-label': ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  'aria-label'?: string;
}) {
  const [truncated, setTruncated] = useState(false);
  const counter = formatCreatorTextCounter(value.length, CREATOR_NAME_MAX_LENGTH);
  return (
    <Input
      id={id}
      type="text"
      label={label}
      aria-label={ariaLabel}
      value={value}
      maxLength={CREATOR_NAME_MAX_LENGTH}
      placeholder={placeholder}
      onChange={(event) => {
        const next = clampCreatorText(event.target.value, CREATOR_NAME_MAX_LENGTH);
        if (next.truncated) setTruncated(true);
        onChange(next.value);
      }}
      onPaste={(event) =>
        applyLimitedPaste(event, value, CREATOR_NAME_MAX_LENGTH, (next) => {
          setTruncated(true);
          onChange(next);
        })
      }
      helperText={truncated ? `${CREATOR_NAME_TRUNCATED_MESSAGE} ${counter}` : counter}
    />
  );
}

export function CreatorDescriptionField({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  label,
  'aria-label': ariaLabel,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  className?: string;
  label?: string;
  'aria-label'?: string;
}) {
  const [truncated, setTruncated] = useState(false);
  const showCounter = truncated || value.length >= CREATOR_DESCRIPTION_COUNTER_FROM;
  const counter = formatCreatorTextCounter(value.length, CREATOR_DESCRIPTION_MAX_LENGTH);
  return (
    <Textarea
      id={id}
      label={label}
      aria-label={ariaLabel}
      value={value}
      maxLength={CREATOR_DESCRIPTION_MAX_LENGTH}
      placeholder={placeholder}
      rows={rows}
      className={className}
      onChange={(event) => {
        const next = clampCreatorText(event.target.value, CREATOR_DESCRIPTION_MAX_LENGTH);
        if (next.truncated) setTruncated(true);
        onChange(next.value);
      }}
      onPaste={(event) =>
        applyLimitedPaste(event, value, CREATOR_DESCRIPTION_MAX_LENGTH, (next) => {
          setTruncated(true);
          onChange(next);
        })
      }
      helperText={
        showCounter
          ? truncated
            ? `${CREATOR_DESCRIPTION_TRUNCATED_MESSAGE} ${counter}`
            : counter
          : undefined
      }
    />
  );
}
