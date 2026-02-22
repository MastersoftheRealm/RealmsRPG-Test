/**
 * My Codex Empty State
 * ====================
 * Shown when viewing "My Codex" before user-created codex content exists.
 * Codex = pieces/parts (mechanics, properties, feats, traits, etc.) that make up Library items.
 */

'use client';

import { BookMarked } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export function CodexMyCodexEmpty() {
  return (
    <EmptyState
      size="lg"
      icon={<BookMarked className="w-10 h-10 text-primary-500" />}
      title="My Codex"
      description="Your custom feats, traits, parts, properties, and other codex content will appear here when that feature is available. For now, all reference data lives in Public Codex."
    />
  );
}
