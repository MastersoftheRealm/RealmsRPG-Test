/**
 * Campaign Service
 * =================
 * Client-side Firebase operations for campaign data.
 * Campaigns the user owns or is a member of are fetched via Firestore.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/client';
import type { Campaign, CampaignSummary } from '@/types/campaign';

function requireUserId(): string {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}

function docToCampaign(id: string, data: Record<string, unknown>): Campaign {
  return {
    id,
    name: (data.name as string) || 'Unnamed Campaign',
    description: data.description as string | undefined,
    ownerId: data.ownerId as string,
    ownerUsername: data.ownerUsername as string | undefined,
    inviteCode: data.inviteCode as string,
    characters: (data.characters as Campaign['characters']) || [],
    memberIds: (data.memberIds as string[]) || [],
    createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? data.createdAt,
    updatedAt: (data.updatedAt as Timestamp)?.toDate?.() ?? data.updatedAt,
  };
}

/**
 * Get campaigns the current user owns or is a member of (full Campaign with characters).
 */
export async function getMyCampaignsFull(): Promise<Campaign[]> {
  const userId = requireUserId();
  const campaignsRef = collection(db, 'campaigns');
  const q = query(
    campaignsRef,
    where('memberIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToCampaign(d.id, d.data() as Record<string, unknown>));
}

/**
 * Get campaigns the current user owns or is a member of.
 */
export async function getMyCampaigns(): Promise<CampaignSummary[]> {
  const userId = requireUserId();
  const campaignsRef = collection(db, 'campaigns');
  const q = query(
    campaignsRef,
    where('memberIds', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);

  const fullCampaigns = await getMyCampaignsFull();
  return fullCampaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      ownerId: campaign.ownerId,
      ownerUsername: campaign.ownerUsername,
      characterCount: campaign.characters?.length ?? 0,
      isOwner: campaign.ownerId === userId,
      updatedAt: campaign.updatedAt,
    }));
}

/**
 * Get a single campaign by ID.
 */
export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const userId = requireUserId();
  const docRef = doc(db, 'campaigns', campaignId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  const campaign = docToCampaign(snapshot.id, snapshot.data() as Record<string, unknown>);

  // Security: only return if user is owner or member
  if (campaign.ownerId !== userId && !campaign.memberIds?.includes(userId)) {
    return null;
  }

  return campaign;
}

/**
 * Look up a campaign by invite code (for join flow).
 * Returns minimal data - full validation happens in joinCampaignAction.
 */
export async function getCampaignByInviteCode(inviteCode: string): Promise<{ id: string; name: string } | null> {
  const campaignsRef = collection(db, 'campaigns');
  const q = query(campaignsRef, where('inviteCode', '==', inviteCode.trim().toUpperCase()), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  return { id: doc.id, name: (data.name as string) || 'Campaign' };
}
