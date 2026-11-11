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

  it('passes headerRightContent on armament sections but not equipment', () => {
    render(
      <div>
        <WeaponsListSection items={[]} headerRightContent={<span data-testid="weapons-right" />} />
        <EquipmentListSection items={[]} />
      </div>,
    );
    expect(screen.getByTestId('weapons-right')).toBeTruthy();
    expect(screen.queryByTestId('equipment-right')).toBeNull();
  });
});
