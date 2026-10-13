import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CampaignRosterSection } from './campaign-roster-section';

function renderRoster(canAddOwnCharacters: boolean) {
  return renderToStaticMarkup(
    <CampaignRosterSection
      campaignId="c1"
      ownerUsername="qa-rm"
      ownerCharacters={[]}
      otherCharacters={[]}
      isRealmMaster={canAddOwnCharacters}
      canAddOwnCharacters={canAddOwnCharacters}
      onAddClick={() => {}}
      onRemoveClick={() => {}}
    />,
  );
}

describe('campaign roster Realm Master empty state (86e3jrwp4)', () => {
  it('does not say no characters were added when the Realm Master has none', () => {
    const html = renderRoster(false);
    expect(html).toContain('Realm Master: qa-rm');
    expect(html).not.toContain('No characters added yet.');
  });

  it('still offers Add when the Realm Master can attach their own characters', () => {
    const html = renderRoster(true);
    expect(html).toContain('Add Your Characters');
    expect(html).not.toContain('No characters added yet.');
  });
});
