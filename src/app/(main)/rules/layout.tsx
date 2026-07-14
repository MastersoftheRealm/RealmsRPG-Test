import type { Metadata } from 'next';
import { RULES_COPY } from '@/lib/constants/site-copy';

export const metadata: Metadata = {
  title: RULES_COPY.pageTitle,
  description: RULES_COPY.seoDescription,
};

export default function RulesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
