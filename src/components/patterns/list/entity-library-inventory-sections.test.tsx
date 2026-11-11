// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ArmorListSection,
  EquipmentListSection,
  ShieldsListSection,
  WeaponsListSection,
} from './entity-library-inventory';

vi.mock('@/components/rolls', () => ({
  useRollsOptional: () => null,
}));

afterEach(() => {
  cleanup();
});

describe('entity library inventory sections', () => {
  it('renders default section titles in weapons → shields → armor → equipment order', () => {
    const { container } = render(
      <div data-testid="inventory-stack">
        <WeaponsListSection items={[]} />
        <ShieldsListSection items={[]} />
        <ArmorListSection items={[]} />
        <EquipmentListSection items={[]} />
      </div>,
    );
    const titles = Array.from(container.querySelectorAll('h2')).map((el) => el.textContent);
    expect(titles).toEqual(['Weapons', 'Shields', 'Armor', 'Equipment']);
  });

  it('renders headerRightContent on shields when provided', () => {
    const { container } = render(
      <ShieldsListSection
        items={[]}
        headerRightContent={<span data-testid="shields-header-right">slot</span>}
      />,
    );
    expect(container.querySelector('[data-testid="shields-header-right"]')).toBeTruthy();
  });

  it('does not render shields-only headerRightContent on equipment', () => {
    const { container } = render(<EquipmentListSection items={[]} />);
    expect(container.querySelector('[data-testid="shields-header-right"]')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Equipment' })).toBeTruthy();
  });
});
