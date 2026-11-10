import { NextResponse } from 'next/server';
import { logApiError } from '@/lib/api-error';

/**
 * PLACEHOLDER: human copy review — player-facing save rejection (not raw Postgres text).
 */
export const CHARACTER_SAVE_VALIDATION_ERROR =
  'This character could not be saved because it included fields the server does not accept. (PLACEHOLDER: human copy review)';

const MAX_ECHOED_FIELD_LEN = 120;

export type CharacterRelationalValidationPayload = {
  error: string;
  details: string[];
};

type DbErrorShape = { code?: string | undefined; message?: string | undefined };

function capEchoedField(field: string): string {
  const trimmed = field.trim();
  if (trimmed.length <= MAX_ECHOED_FIELD_LEN) return trimmed;
  return `${trimmed.slice(0, MAX_ECHOED_FIELD_LEN - 1)}…`;
}

function validationPayload(fieldPath: string): CharacterRelationalValidationPayload {
  const field = capEchoedField(fieldPath);
  return {
    error: CHARACTER_SAVE_VALIDATION_ERROR,
    details: [`Rejected field: ${field}.`],
  };
}

function parseFieldFromMessage(message: string): CharacterRelationalValidationPayload | null {
  const topLevel = message.match(/^Unmapped character key: (.+)$/);
  if (topLevel) return validationPayload(topLevel[1]!);

  const nestedObject = message.match(/^Unmapped character ([^.]+)\.(.+)$/);
  if (nestedObject) {
    return validationPayload(`${nestedObject[1]}.${nestedObject[2]!.trim()}`);
  }

  const arrayEntry = message.match(/^Unmapped character ([^.]+) entry key (.+)$/);
  if (arrayEntry) {
    return validationPayload(`${arrayEntry[1]}.${arrayEntry[2]!.trim()}`);
  }

  const equipmentKey = message.match(/^Unknown equipment key (.+)$/);
  if (equipmentKey) return validationPayload(`equipment.${equipmentKey[1]!.trim()}`);

  if (message === 'Non-empty inventory properties need a typed destination') {
    return validationPayload('equipment.properties');
  }

  const mixedPhysical = message.match(/^Unmapped mixedPhysical key (.+)$/);
  if (mixedPhysical) return validationPayload(`ancestry.mixedPhysical.${mixedPhysical[1]!.trim()}`);

  const tempAbility = message.match(/^Unmapped temp ability (.+)$/);
  if (tempAbility) return validationPayload(`tempModifiers.abilities.${tempAbility[1]!.trim()}`);

  const tempDefense = message.match(/^Unmapped temp defense (.+)$/);
  if (tempDefense) return validationPayload(`tempModifiers.defenses.${tempDefense[1]!.trim()}`);

  const notesOrder = message.match(/^Unmapped notes section order entry (.+)$/);
  if (notesOrder) return validationPayload(`notesSectionOrder.${notesOrder[1]!.trim()}`);

  const mustBeObject = message.match(/^Character ([^ ]+) must be an object$/);
  if (mustBeObject) return validationPayload(mustBeObject[1]!);

  const mustBeArray = message.match(/^Character ([^ ]+) must be an array$/);
  if (mustBeArray) return validationPayload(mustBeArray[1]!);

  const equipmentMustBeArray = message.match(/^Equipment ([^ ]+) must be an array$/);
  if (equipmentMustBeArray) return validationPayload(`equipment.${equipmentMustBeArray[1]!}`);

  if (message.startsWith('Malformed character inventory item at ')) {
    return validationPayload('equipment');
  }

  if (message === 'Non-duplicate equipment.inventory needs review') {
    return validationPayload('equipment.inventory');
  }

  if (message === 'Character document must be an object') return validationPayload('document');
  if (message === 'Character data must be an object') return validationPayload('document');
  if (message === 'Character patch must be an object') return validationPayload('patch');
  if (message === 'Character notesSectionOrder must be an array') {
    return validationPayload('notesSectionOrder');
  }

  return null;
}

/** Maps relational save RPC `22023` validation failures to a client-safe 400 body (B7 / PR 473 shape). */
export function parseCharacterRelationalValidationError(
  error: DbErrorShape | null | undefined,
): CharacterRelationalValidationPayload | null {
  if (!error || error.code !== '22023') return null;
  const message = error.message?.trim() ?? '';
  const parsed = message ? parseFieldFromMessage(message) : null;
  if (parsed) return parsed;
  return {
    error: CHARACTER_SAVE_VALIDATION_ERROR,
    details: ['Character data failed relational validation.'],
  };
}

export function characterRelationalValidationResponse(
  context: string,
  error: DbErrorShape | null | undefined,
): NextResponse<CharacterRelationalValidationPayload> | null {
  const payload = parseCharacterRelationalValidationError(error);
  if (!payload) return null;
  logApiError(context, error);
  return NextResponse.json(payload, { status: 400 });
}
