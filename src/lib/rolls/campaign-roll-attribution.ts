/**
 * Campaign roll attribution (86e3jvv8d).
 * The Realm Master may roll from a player's sheet. The log keeps the character
 * name and says the Realm Master made that roll.
 */

export function realmMasterRolledForCharacter(
  rollUserId: string | undefined,
  characterOwnerId: string | undefined,
  campaignOwnerId: string,
): boolean {
  if (!rollUserId || !characterOwnerId || !campaignOwnerId) return false;
  return rollUserId === campaignOwnerId && characterOwnerId !== campaignOwnerId;
}

export function campaignRollCharacterLabel(roll: {
  characterName?: string | undefined;
  rolledByRealmMaster?: boolean | undefined;
}): string | undefined {
  const name = roll.characterName?.trim();
  if (!name) return undefined;
  if (roll.rolledByRealmMaster) return `Realm Master · ${name}`;
  return name;
}
