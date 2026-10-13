import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ItemProperty } from '@/hooks';
import { ItemCreatorEditorAbilityProperties } from './item-creator-editor-ability-properties';
import type { ItemSectionCosts } from './item-creator-cost-derivation';
import {
  ADD_PROPERTY_DISABLED_REASON,
  findAddableItemProperty,
} from './item-creator-property-options';

const catalog = [
  { id: 9001, name: 'Critical Range', type: 'weapon', description: '' },
  { id: 9002, name: 'Finesse', type: 'weapon', description: '' },
] as unknown as ItemProperty[];

const zero = { totalIP: 0, totalTP: 0, totalCurrency: 0 };
const itemSectionCosts: ItemSectionCosts = {
  handedness: zero,
  range: zero,
  abilityUtilized: zero,
  damage: zero,
  damageReduction: zero,
  agilityReduction: zero,
  criticalRange: zero,
  shieldDR: zero,
  shieldDamage: zero,
  abilityReq: zero,
};

function renderProperties(selectedIds: Array<string | number>) {
  const selectedProperties = catalog
    .filter((property) => selectedIds.map(String).includes(String(property.id)))
    .map((property) => ({ property, op_1_lvl: 0 }));

  return renderToStaticMarkup(
    <ItemCreatorEditorAbilityProperties
      armamentType="Weapon"
      abilityRequirement={null}
      onAbilityRequirementChange={() => {}}
      abilityReqSummary=""
      selectedProperties={selectedProperties}
      itemProperties={catalog}
      propertiesSummary=""
      onAddProperty={() => {}}
      onRemoveProperty={() => {}}
      onUpdateProperty={() => {}}
      itemSectionCosts={itemSectionCosts}
    />,
  );
}

function buttonHtml(html: string, label: string): string {
  const buttons = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map((match) => match[0]);
  const button = buttons.find((markup) => markup.includes(label));
  expect(button, `missing button ${label}`).toBeTruthy();
  return button ?? '';
}

describe('Add Property disabled reason (86e3jww88)', () => {
  it('renders the reason when the selectable-property filter has nothing left', () => {
    expect(findAddableItemProperty(catalog, 'Weapon', [9001, '9002'])).toBeNull();

    const html = renderProperties([9001, 9002]);
    const addButton = buttonHtml(html, 'Add Property');
    expect(addButton).toContain('disabled');
    const describedBy = addButton.match(/aria-describedby="([^"]+)"/)?.[1];
    expect(describedBy).toBeTruthy();
    expect(html).toContain(`id="${describedBy}"`);
    expect(html).toContain(ADD_PROPERTY_DISABLED_REASON);
    expect(addButton).not.toContain('title=');
  });

  it('leaves Add Property enabled while the selectable filter still has a property', () => {
    expect(findAddableItemProperty(catalog, 'Weapon', [9001])?.name).toBe('Finesse');

    const html = renderProperties([9001]);
    expect(html).toContain('Add Property');
    expect(html).not.toContain(ADD_PROPERTY_DISABLED_REASON);
    expect(html).not.toContain('aria-describedby');
  });
});
