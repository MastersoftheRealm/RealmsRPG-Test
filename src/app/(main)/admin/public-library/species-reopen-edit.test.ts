import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { speciesCreatorEditHref } from '../../species-creator/species-creator-bootstrap';

const dir = dirname(fileURLToPath(import.meta.url));

describe('species reopen from library and My Codex', () => {
  it('adds an Official Library Species tab and an Edit href', () => {
    const page = readFileSync(join(dir, 'page.tsx'), 'utf8');
    const tab = readFileSync(join(dir, 'AdminPublicSpeciesTab.tsx'), 'utf8');
    const codex = readFileSync(join(dir, '../../codex/CodexSpeciesTab.tsx'), 'utf8');

    expect(page).toContain("id: 'species'");
    expect(page).toContain("label: 'Species'");
    expect(page).toContain("id: 'creatures'");
    expect(page).toContain('TabNavigation');
    expect(page).toContain("activeTab === 'species' && <AdminPublicSpeciesTab />");
    expect(tab).toContain('OfficialEntityList');
    expect(tab).toContain("useOfficialLibrary('species'");
    expect(tab).toContain('speciesCreatorEditHref');
    expect(codex).toContain('speciesCreatorEditHref');
    expect(codex).toContain('rowChrome={MY_CODEX_SPECIES_ROW_CHROME}');
    expect(codex).toContain('edit: true');
    expect(codex).toContain('isMy');

    expect(speciesCreatorEditHref('user-species-1')).toBe('/species-creator?edit=user-species-1');
    expect(speciesCreatorEditHref('a/b c')).toBe('/species-creator?edit=a%2Fb%20c');
  });
});
