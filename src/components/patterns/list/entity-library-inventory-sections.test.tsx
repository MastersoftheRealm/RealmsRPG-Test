// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  ArmorListSection,
  EquipmentListSection,
  ShieldsListSection,
  WeaponsListSection,
} from './entity-library-inventory';

vi.mock('@/components/rolls', () => ({
  useRollsOptional: () => null,
}));

describe('entity library inventory sections', () => {
  it('renders default section titles in weapons → shields → armor → equipment order', () => {
    render(
      <div>
        <WeaponsListSection items={[]} />
        <ShieldsListSection items={[]} />
        <ArmorListSection items={[]} />
        <EquipmentListSection items={[]} />
      </div>,
    );
    const titles = screen.getAllByRole('heading', { level: 2 }).map((el) => el.textContent);
    expect(titles).toEqual(['Weapons', 'Shields', 'Armor', 'Equipment']);
  });

  it('renders headerRightContent when the section supports it (shields, not equipment)', () => {
    const { unmount } = render(
      <ShieldsListSection
        items={[]}
        headerRightContent={<span data-testid="shields-header-right">slot</span>}
      />,
    );
    expect(screen.getByTestId('shields-header-right')).toBeTruthy();
    unmount();

    render(<EquipmentListSection items={[]} />);
    expect(screen.queryByTestId('shields-header-right')).toBeNull();
  });
});
