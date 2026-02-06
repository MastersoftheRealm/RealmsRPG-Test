/**
 * Campaign Roll Service
 * ======================
 * Firestore operations for campaign roll logs.
 * Uses subcollection campaigns/{campaignId}/rolls for real-time sync.
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch,
  getCountFromServer,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import { MAX_CAMPAIGN_ROLLS } from '@/app/(main)/campaigns/constants';
import type { CampaignRollEntry } from '@/types/campaign-roll';
import type { RollEntry } from '@/components/character-sheet/roll-context';

function requireUserId(): string {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');
  return userId;
}

function docToCampaignRoll(id: string, data: Record<string, unknown>): CampaignRollEntry {
  const ts = data.timestamp;
  return {
    id,
    characterId: data.characterId as string,
    characterName: data.characterName as string,
    userId: data.userId as string,
    type: data.type as CampaignRollEntry['type'],
    title: data.title as string,
    dice: (data.dice as CampaignRollEntry['dice']) || [],
    modifier: (data.modifier as number) ?? 0,
    total: (data.total as number) ?? 0,
    isCrit: data.isCrit as boolean | undefined,
    isCritFail: data.isCritFail as boolean | undefined,
    critMessage: data.critMessage as string | undefined,
    timestamp: ts instanceof Timestamp ? ts.toDate() : (ts as Date),
  };
}

export interface AddCampaignRollParams {
  campaignId: string;
  characterId: string;
  characterName: string;
  roll: RollEntry;
}

/**
 * Add a roll to the campaign log. Trims to MAX_CAMPAIGN_ROLLS after add.
 */
export async function addCampaignRoll({
  campaignId,
  characterId,
  characterName,
  roll,
}: AddCampaignRollParams): Promise<void> {
  const userId = requireUserId();
  const rollsRef = collection(db, 'campaigns', campaignId, 'rolls');

  const docData = {
    characterId,
    characterName,
    userId,
    type: roll.type,
    title: roll.title,
    dice: roll.dice,
    modifier: roll.modifier,
    total: roll.total,
    isCrit: roll.isCrit ?? false,
    isCritFail: roll.isCritFail ?? false,
    critMessage: roll.critMessage ?? null,
    timestamp: Timestamp.now(),
  };

  await addDoc(rollsRef, docData);

  // Trim to MAX_CAMPAIGN_ROLLS: count and delete oldest if over
  const countSnap = await getCountFromServer(rollsRef);
  const count = countSnap.data().count;
  if (count > MAX_CAMPAIGN_ROLLS) {
    const oldestQuery = query(
      rollsRef,
      orderBy('timestamp', 'asc'),
      limit(count - MAX_CAMPAIGN_ROLLS)
    );
    const oldestSnap = await getDocs(oldestQuery);
    if (!oldestSnap.empty) {
      const batch = writeBatch(db);
      oldestSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

/**
 * Subscribe to campaign rolls in real time (Firestore onSnapshot).
 */
export function subscribeToCampaignRolls(
  campaignId: string,
  callback: (rolls: CampaignRollEntry[]) => void
): () => void {
  const rollsRef = collection(db, 'campaigns', campaignId, 'rolls');
  const q = query(rollsRef, orderBy('timestamp', 'desc'), limit(MAX_CAMPAIGN_ROLLS));

  return onSnapshot(
    q,
    (snapshot) => {
      const rolls = snapshot.docs.map((d) =>
        docToCampaignRoll(d.id, d.data() as Record<string, unknown>)
      );
      callback(rolls);
    },
    (err) => {
      console.error('Campaign rolls subscription error:', err);
      callback([]);
    }
  );
}
