import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campaigns',
  description: 'Create, join, and manage your tabletop RPG campaigns with shared characters and real-time dice rolls.',
};

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
