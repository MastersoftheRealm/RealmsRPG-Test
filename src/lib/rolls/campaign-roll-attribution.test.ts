import { describe, expect, it } from 'vitest';
import {
  campaignRollCharacterLabel,
  realmMasterRolledForCharacter,
} from './campaign-roll-attribution';

describe('realmMasterRolledForCharacter', () => {
  it('is true when the Realm Master rolls a player character', () => {
    expect(realmMasterRolledForCharacter('rm', 'player', 'rm')).toBe(true);
  });

  it('is false when the player rolls their own character', () => {
    expect(realmMasterRolledForCharacter('player', 'player', 'rm')).toBe(false);
  });

  it('is false when the Realm Master rolls their own character', () => {
    expect(realmMasterRolledForCharacter('rm', 'rm', 'rm')).toBe(false);
  });
});

describe('campaignRollCharacterLabel', () => {
  it('names the Realm Master and the character when the RM rolled', () => {
    expect(
      campaignRollCharacterLabel({
        characterName: 'S3 Human Orc Beast Tamer QA A',
        rolledByRealmMaster: true,
      }),
    ).toBe('Realm Master · S3 Human Orc Beast Tamer QA A');
  });

  it('keeps the character name when the player rolled', () => {
    expect(
      campaignRollCharacterLabel({
        characterName: 'Member Hero',
        rolledByRealmMaster: false,
      }),
    ).toBe('Member Hero');
  });
});
