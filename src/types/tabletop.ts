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
  signedUrl?: string | undefined;
  width: number;
  height: number;
  fileName?: string | undefined;
  contentType?: string | undefined;
  uploadedAt?: string | undefined;
}

export interface VttSceneSettings {
  showEnemyResources: boolean;
}

export interface VttScene {
  id: string;
  campaignId: string;
  encounterId?: string | undefined;
  name: string;
  isActive: boolean;
  map?: VttMapAsset | undefined;
  grid: VttGridConfig;
  fog: VttFogState;
  settings: VttSceneSettings;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface VttTokenMetadata {
  currentHealth?: number | undefined;
  maxHealth?: number | undefined;
  currentEnergy?: number | undefined;
  maxEnergy?: number | undefined;
  armor?: number | undefined;
  evasion?: number | undefined;
  ap?: number | undefined;
  notes?: string | undefined;
  creatureLevel?: number | undefined;
  creatureType?: string | undefined;
  creatureSize?: string | undefined;
}

export interface VttToken {
  id: string;
  sceneId: string;
  combatantId?: string | undefined;
  name: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  imageUrl?: string | undefined;
  visible: boolean;
  locked: boolean;
  combatantType: CombatantType;
  sourceType?: CombatantSource | undefined;
  sourceId?: string | undefined;
  sourceUserId?: string | undefined;
  metadata: VttTokenMetadata;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export type VttActionType = 'ping' | 'move-request';
export type VttActionStatus = 'pending' | 'accepted' | 'dismissed';

export interface VttAction {
  id: string;
  sceneId: string;
  userId: string;
  type: VttActionType;
  status: VttActionStatus;
  tokenId?: string | undefined;
  fromX?: number | undefined;
  fromY?: number | undefined;
  toX: number;
  toY: number;
  message?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
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

export type VttCreatureTokenSource = 'official' | 'user';

export interface AddVttCreatureTokensRequest {
  source: VttCreatureTokenSource;
  creatureId: string;
  quantity?: number | undefined;
  visible?: boolean | undefined;
}
