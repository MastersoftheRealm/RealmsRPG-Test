// @vitest-environment happy-dom

import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Feat } from '@/hooks';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { GuidedFeatsL2Modal } from './guided-feats-l2-modal';

const l2Copy = GUIDED_CREATOR_COPY.steps.featsL2;

function feat(partial: Partial<Feat> & { id: string; name: string }): Feat {
  return { description: '', category: 'General', char_feat: false, ...partial } as Feat;
}

const sampleFeats: Feat[] = [
  feat({ id: '1', name: 'Feat One', description: 'One' }),
  feat({ id: '2', name: 'Feat Two', description: 'Two' }),
  feat({ id: '3', name: 'Feat Three', description: 'Three' }),
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
      footer,
      children,
    }: {
      isOpen: boolean;
      title?: ReactNode;
      description?: ReactNode;
      footer?: ReactNode;
      children?: ReactNode;
    }) =>
      isOpen ? (
        <div>
          <div>{title}</div>
          <div>{description}</div>
          {children}
          {footer}
        </div>
      ) : null,
  };
});

describe('GuidedFeatsL2Modal selection cap', () => {
  it('shows zero-cap copy when maxSelections is 0', () => {
    render(
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
    expect(screen.getByText(l2Copy.overLimitZero)).toBeTruthy();
  });

  it('confirms over-max picks when allowConfirmWhenOverMax, then the step caps on commit', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const maxFeats = 2;

    render(
      <GuidedFeatsL2Modal
        isOpen
        featType="archetype"
        feats={sampleFeats}
        recommendedIds={[]}
        initialSelectedIds={['1', '2', '3']}
        maxSelections={maxFeats}
        allowConfirmWhenOverMax
        requirementCharacter={{}}
        onClose={() => {}}
        onConfirm={(ids) => onConfirm(ids.slice(0, Math.max(0, maxFeats)))}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Add Selected \(3\)/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onConfirm.mock.calls[0]?.[0]).toHaveLength(2);
    expect(onConfirm.mock.calls[0]?.[0]).toContain('1');
  });
});
