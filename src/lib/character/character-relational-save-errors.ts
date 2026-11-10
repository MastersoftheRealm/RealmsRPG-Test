export type CharacterUnmappedFieldPayload = {
  field: string;
  message: string;
};

type DbErrorShape = { code?: string | undefined; message?: string | undefined };

function messageNamesRejectedField(message: string): CharacterUnmappedFieldPayload | null {
  const topLevel = message.match(/^Unmapped character key: (.+)$/);
  if (topLevel) {
    const field = topLevel[1]!.trim();
    return { field, message: `Character save rejected unknown field: ${field}.` };
  }

  const nested = message.match(/^Unmapped character ([^.]+)\.(.+)$/);
  if (nested) {
    const field = `${nested[1]}.${nested[2]!.trim()}`;
    return { field, message: `Character save rejected unknown field: ${field}.` };
  }

  const entry = message.match(/^Unmapped character ([^.]+) entry key (.+)$/);
  if (entry) {
    const field = `${entry[1]}.${entry[2]!.trim()}`;
    return { field, message: `Character save rejected unknown field: ${field}.` };
  }

  const equipment = message.match(/^Unknown equipment key (.+)$/);
  if (equipment) {
    const field = `equipment.${equipment[1]!.trim()}`;
    return { field, message: `Character save rejected unknown field: ${field}.` };
  }

  return null;
}

/** Maps relational save RPC rejections for unmapped document keys into a client-safe 422 body. */
export function parseCharacterUnmappedFieldDbError(
  error: DbErrorShape | null | undefined,
): CharacterUnmappedFieldPayload | null {
  const message = error?.message?.trim();
  if (!message) return null;
  return messageNamesRejectedField(message);
}
