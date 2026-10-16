import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isStyleguideServed } from './styleguide-gate';

export const metadata: Metadata = {
  title: 'Design System Styleguide',
  robots: { index: false, follow: false },
};

export default function StyleguideLayout({ children }: { children: React.ReactNode }) {
  if (!isStyleguideServed()) notFound();
  return children;
}
