import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { GuidedFeatsL2Modal } from './guided-feats-l2-modal';

const l2Copy = GUIDED_CREATOR_COPY.steps.featsL2;

const sampleFeats = [
  { id: '1', name: 'Feat One', description: 'One' },
  { id: '2', name: 'Feat Two', description: 'Two' },
  { id: '3', name: 'Feat Three', description: 'Three' },
];

vi.mock('@/hooks', () => ({
  useCodexSkills: () => ({ data: [] }),
  usePathListFilter: () => ({
    selectedPathIds: [],
    setSelectedPathIds: vi.fn(),
    pathIndex: { options: [] },
    pathFilterActive: false,
  }),
}));

vi.mock('@/components/ui', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/components/ui')>();
  return {
    ...mod,
    Modal: ({
      isOpen,
      title,
      description,
      children,
    }: {
      isOpen: boolean;
      title?: ReactNode;
      description?: ReactNode;
      children?: ReactNode;
    }) =>
      isOpen ? (
        <div>
          <div>{title}</div>
          <div>{description}</div>
          {children}
        </div>
      ) : null,
  };
});

describe('GuidedFeatsL2Modal selection cap', () => {
  it('shows zero-cap copy when maxSelections is 0', () => {
    const html = renderToStaticMarkup(
      <GuidedFeatsL2Modal
        isOpen
        featType="archetype"
        feats={sampleFeats}
        recommendedIds={[]}
        initialSelectedIds={['1']}
        maxSelections={0}
        requirementCharacter={{}}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(html).toContain(l2Copy.overLimitZero);
  });

  it('suppresses over-max blocking copy when allowConfirmWhenOverMax is set', () => {
    const html = renderToStaticMarkup(
      <GuidedFeatsL2Modal
        isOpen
        featType="archetype"
        feats={sampleFeats}
        recommendedIds={[]}
        initialSelectedIds={['1', '2', '3']}
        maxSelections={2}
        allowConfirmWhenOverMax
        requirementCharacter={{}}
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(html).not.toContain('Deselect some to continue');
    expect(html).not.toContain(l2Copy.overLimit(2));
  });
});
