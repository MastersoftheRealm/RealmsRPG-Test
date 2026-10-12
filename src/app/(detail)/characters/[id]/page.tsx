import CharacterSheetRoute from './character-sheet-route';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default async function CharacterSheetPage({ params }: PageParams) {
  const { id } = await params;
  return <CharacterSheetRoute id={id} />;
}
