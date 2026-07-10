import type { CombatantSource, CombatantType } from './encounter';

export type VttRole = 'realm-master' | 'player';

export interface VttGridConfig {
  enabled: boolean;
  cellSize: number;
  offsetX: number;
  offsetY: number;
  color: string;
  opacity: number;
  snap: boolean;
}

export type VttFogMode = 'cover' | 'reveal';

export interface VttFogRegion {
  id: string;
  mode: VttFogMode;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VttFogState {
  enabled: boolean;
  regions: VttFogRegion[];
}

export interface VttMapAsset {
  storagePath: string;
  signedUrl?: string;
  width: number;
  height: number;
  fileName?: string;
  contentType?: string;
  uploadedAt?: string;
}

export interface VttSceneSettings {
  showEnemyResources: boolean;
}

export interface VttScene {
  id: string;
  campaignId: string;
  encounterId?: string;
  name: string;
  isActive: boolean;
  map?: VttMapAsset;
  grid: VttGridConfig;
  fog: VttFogState;
  settings: VttSceneSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface VttTokenMetadata {
  currentHealth?: number;
  maxHealth?: number;
  currentEnergy?: number;
  maxEnergy?: number;
  armor?: number;
  evasion?: number;
  ap?: number;
  notes?: string;
}

export interface VttToken {
  id: string;
  sceneId: string;
  combatantId?: string;
  name: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  imageUrl?: string;
  visible: boolean;
  locked: boolean;
  combatantType: CombatantType;
  sourceType?: CombatantSource;
  sourceId?: string;
  sourceUserId?: string;
  metadata: VttTokenMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export type VttActionType = 'ping' | 'move-request';
export type VttActionStatus = 'pending' | 'accepted' | 'dismissed';

export interface VttAction {
  id: string;
  sceneId: string;
  userId: string;
  type: VttActionType;
  status: VttActionStatus;
  tokenId?: string;
  fromX?: number;
  fromY?: number;
  toX: number;
  toY: number;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VttTabletopState {
  scene: VttScene;
  tokens: VttToken[];
  actions: VttAction[];
  role: VttRole;
}

export interface VttPoint {
  x: number;
  y: number;
}

