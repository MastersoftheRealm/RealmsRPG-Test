import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Realms RPG — a free tabletop RPG built for creative freedom, with digital character sheets, creators, and community tools.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
