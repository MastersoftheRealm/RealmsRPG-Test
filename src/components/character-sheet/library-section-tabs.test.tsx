import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TabContentPanel, TabNavigation, useTabGroup } from '@/components/ui/tab-navigation';
import { LIBRARY_TAB_DEFS } from './library-tab-config';

const librarySection = readFileSync(path.join(import.meta.dirname, 'library-section.tsx'), 'utf8');

const SHEET_LIBRARY_TAB_GROUP = 'character-sheet-library';

function attr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

function tags(html: string, tagName: string): string[] {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'g'))].map((match) => match[0]);
}

function SheetLibraryTabs() {
  const { tabGroupId, sharedPanelId } = useTabGroup(SHEET_LIBRARY_TAB_GROUP);
  return (
    <div>
      <TabNavigation
        tabs={LIBRARY_TAB_DEFS.map((tab) => ({ id: tab.id, label: tab.label }))}
        activeTab="feats"
        onTabChange={() => {}}
        variant="underline"
        tabGroupId={tabGroupId}
        sharedTabPanelId={sharedPanelId}
      />
      <TabContentPanel tabGroupId={tabGroupId} id={sharedPanelId} activeTab="feats">
        Feats
      </TabContentPanel>
    </div>
  );
}

describe('Character sheet library tabs point at a real panel (86e3k0cfz)', () => {
  it('wires every library tab aria-controls to the shared panel id', () => {
    const html = renderToStaticMarkup(<SheetLibraryTabs />);
    const tabButtons = tags(html, 'button').filter((tag) => attr(tag, 'role') === 'tab');
    const controls = tabButtons.map((tag) => attr(tag, 'aria-controls'));

    expect(tabButtons).toHaveLength(LIBRARY_TAB_DEFS.length);
    expect(controls).toEqual(LIBRARY_TAB_DEFS.map(() => 'character-sheet-library-panel'));
    expect(html.match(/id="character-sheet-library-panel"/g)).toHaveLength(1);

    const panel = tags(html, 'div').find(
      (tag) => attr(tag, 'id') === 'character-sheet-library-panel',
    );
    expect(attr(panel ?? '', 'role')).toBe('tabpanel');
    expect(html).not.toContain('character-sheet-library-panel-feats');
    expect(html).not.toContain('-panel-powers');
  });

  it('keeps that panel id on the sheet library section', () => {
    expect(librarySection).toContain("useTabGroup('character-sheet-library')");
    expect(librarySection).toContain('sharedTabPanelId={sharedPanelId}');
    expect(librarySection).toContain('<TabContentPanel');
    expect(librarySection).toContain('id={sharedPanelId}');
    expect(librarySection).not.toContain('associatePanels={false}');
    for (const tab of LIBRARY_TAB_DEFS) {
      expect(librarySection).toContain(`resolvedActiveTab === '${tab.id}'`);
    }
  });
});
