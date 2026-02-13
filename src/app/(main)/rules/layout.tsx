import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rules',
  description: 'Learn the core rules, combat mechanics, and character progression for RealmsRPG.',
};

export default function RulesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
