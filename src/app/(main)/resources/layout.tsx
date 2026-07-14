import type { Metadata } from 'next';
import { RESOURCES_COPY } from '@/lib/constants/site-copy';

export const metadata: Metadata = {
  title: RESOURCES_COPY.pageTitle,
  description: RESOURCES_COPY.seoDescription,
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
