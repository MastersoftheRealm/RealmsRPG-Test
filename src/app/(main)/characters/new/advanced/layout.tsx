import type { Metadata } from 'next';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const { documentTitle, documentDescription } = GUIDED_CREATOR_COPY.legacyWizard;

export const metadata: Metadata = {
  title: documentTitle,
  description: documentDescription,
};

export default function LegacyCharacterCreatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
