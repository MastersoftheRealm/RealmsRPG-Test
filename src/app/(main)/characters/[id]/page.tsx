import { assertCharacterSheetHttpAccess } from '@/lib/server/assert-resource-http-access';
import CharacterSheetRoute from './character-sheet-route';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default async function CharacterSheetPage({ params }: PageParams) {
  const { id } = await params;
  await assertCharacterSheetHttpAccess(id);
  return <CharacterSheetRoute id={id} />;
}
