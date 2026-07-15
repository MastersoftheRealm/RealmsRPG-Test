import type { Metadata } from 'next';
import { ABOUT_COPY } from '@/lib/constants/site-copy';

export const metadata: Metadata = {
  title: 'About',
  description: ABOUT_COPY.pageDescription,
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
