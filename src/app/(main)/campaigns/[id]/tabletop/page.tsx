'use client';

import { use, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, Crosshair, Eye, EyeOff, Map, MousePointer2, RefreshCw, Ruler, Upload } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import { RollLog, RollProvider } from '@/components/character-sheet';
import { TabletopCanvas, type TabletopToolMode } from '@/components/tabletop/tabletop-canvas';
import { Alert, Button, Card, CardContent, EmptyState, Input, LoadingState, PageContainer, PageHeader, useToast } from '@/components/ui';
import { useActiveCampaignTabletop, useAuth, useTabletopMutations, useTabletopRealtime, useTabletopScene } from '@/hooks';
import type { VttFogRegion, VttTabletopState, VttToken } from '@/types/tabletop';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function CampaignTabletopPage({ params }: PageParams) {
  return (
    <ProtectedRoute>
      <CampaignTabletopContent params={params} />
    </ProtectedRoute>
  );
}

function CampaignTabletopContent({ params }: PageParams) {
  const { id: campaignId } = use(params);
  const searchParams = useSearchParams();
  const sceneId = searchParams.get('scene') ?? undefined;
  const activeQuery = useActiveCampaignTabletop(sceneId ? undefined : campaignId);
  const sceneQuery = useTabletopScene(sceneId);
  const state = (sceneId ? sceneQuery.data : activeQuery.data) ?? null;
  const loading = sceneId ? sceneQuery.isLoading : activeQuery.isLoading;
  const error = sceneId ? sceneQuery.error : activeQuery.error;

  useTabletopRealtime(state?.scene.id, campaignId);

  if (loading) {
    return (
      <PageContainer size="full">
        <LoadingState message="Loading tabletop..." size="lg" />
      </PageContainer>
    );
  }

  if (!state) {
    return (
      <PageContainer size="xl">
        <Link href={`/campaigns/${campaignId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary-fg-hover">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back to Campaign
        </Link>
        <EmptyState
          title="No active tabletop"
          description={error ? 'Open a campaign-linked combat encounter and choose Open Tabletop.' : 'Open a campaign-linked combat encounter and choose Open Tabletop.'}
        />
      </PageContainer>
    );
  }

  return (
    <RollProvider>
      <TabletopExperience campaignId={campaignId} state={state} />
      <RollLog viewOnlyCampaignId={campaignId} />
    </RollProvider>
  );
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image dimensions'));
    };
    image.src = url;
  });
}

function TabletopExperience({ campaignId, state }: { campaignId: string; state: VttTabletopState }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | undefined>(undefined);
  const [toolMode, setToolMode] = useState<TabletopToolMode>('select');
  const mutations = useTabletopMutations(state.scene.id);
  const isRealmMaster = state.role === 'realm-master';
  const selectedToken = state.tokens.find((token) => token.id === selectedTokenId);
  const pendingMoves = state.actions.filter((action) => action.type === 'move-request' && action.status === 'pending');

  const visibleCounts = useMemo(
    () => ({
      allies: state.tokens.filter((token) => token.combatantType !== 'enemy').length,
      enemies: state.tokens.filter((token) => token.combatantType === 'enemy').length,
    }),
    [state.tokens]
  );

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dimensions = await readImageDimensions(file);
      await mutations.uploadMap.mutateAsync({ file, ...dimensions });
      showToast('Battle map uploaded.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to upload battle map.', 'error');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const updateGrid = (updates: Partial<typeof state.scene.grid>) => {
    mutations.updateScene.mutate({ grid: { ...state.scene.grid, ...updates } });
  };

  const addFogBox = (mode: VttFogRegion['mode']) => {
    const width = state.scene.map?.width ?? 1600;
    const height = state.scene.map?.height ?? 1000;
    const next: VttFogRegion = {
      id: crypto.randomUUID(),
      mode,
      x: Math.max(0, width / 2 - 160),
      y: Math.max(0, height / 2 - 110),
      width: 320,
      height: 220,
    };
    mutations.updateScene.mutate({
      fog: {
        enabled: true,
        regions: [...state.scene.fog.regions, next],
      },
    });
  };

  const requestTokenMove = (token: VttToken, point: { x: number; y: number }) => {
    mutations.createAction.mutate({
      type: 'move-request',
      tokenId: token.id,
      fromX: token.x,
      fromY: token.y,
      toX: point.x,
      toY: point.y,
      message: `${token.name} move request`,
    });
    showToast('Move request sent to the Realm Master.', 'success');
    setToolMode('select');
  };

  return (
    <PageContainer size="full">
      <div className="mb-5">
        <Link href={`/campaigns/${campaignId}`} className="mb-3 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary-fg-hover">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back to Campaign
        </Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <PageHeader
            title={state.scene.name}
            description={`${isRealmMaster ? 'Realm Master controls' : 'Player view'} · ${visibleCounts.allies} allies · ${visibleCounts.enemies} enemies`}
            className="mb-0"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={toolMode === 'select' ? 'primary' : 'secondary'}
              onClick={() => setToolMode('select')}
            >
              <MousePointer2 className="h-4 w-4" aria-hidden />
              Select
            </Button>
            <Button
              type="button"
              variant={toolMode === 'ping' ? 'primary' : 'secondary'}
              onClick={() => setToolMode('ping')}
            >
              <Crosshair className="h-4 w-4" aria-hidden />
              Ping
            </Button>
            {!isRealmMaster && (
              <Button
                type="button"
                variant={toolMode === 'request-move' ? 'primary' : 'secondary'}
                onClick={() => setToolMode('request-move')}
                disabled={!selectedToken}
              >
                <Ruler className="h-4 w-4" aria-hidden />
                Request Move
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <TabletopCanvas
          state={state}
          selectedTokenId={selectedTokenId}
          toolMode={toolMode}
          onSelectToken={setSelectedTokenId}
          onMoveToken={(tokenId, point) => mutations.updateToken.mutate({ id: tokenId, updates: point })}
          onPing={(point) => mutations.createAction.mutate({ type: 'ping', toX: point.x, toY: point.y })}
          onRequestMove={requestTokenMove}
        />

        <aside className="space-y-4">
          {isRealmMaster && (
            <Card>
              <CardContent className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Scene Tools</h2>
                  <p className="text-sm text-text-secondary">Upload maps, sync combatants, and tune the grid.</p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleUpload(event.target.files?.[0])}
                  aria-label="Upload battle map"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} isLoading={mutations.uploadMap.isPending}>
                    <Upload className="h-4 w-4" aria-hidden />
                    Map
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => mutations.syncCombatants.mutate()} isLoading={mutations.syncCombatants.isPending}>
                    <RefreshCw className="h-4 w-4" aria-hidden />
                    Sync
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Cell size"
                    type="number"
                    min={8}
                    max={400}
                    value={state.scene.grid.cellSize}
                    onChange={(event) => updateGrid({ cellSize: Number(event.target.value) || 70 })}
                  />
                  <Input
                    label="Opacity"
                    type="number"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={state.scene.grid.opacity}
                    onChange={(event) => updateGrid({ opacity: Number(event.target.value) || 0.45 })}
                  />
                  <Input
                    label="Offset X"
                    type="number"
                    value={state.scene.grid.offsetX}
                    onChange={(event) => updateGrid({ offsetX: Number(event.target.value) || 0 })}
                  />
                  <Input
                    label="Offset Y"
                    type="number"
                    value={state.scene.grid.offsetY}
                    onChange={(event) => updateGrid({ offsetY: Number(event.target.value) || 0 })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="secondary" onClick={() => addFogBox('cover')}>
                    <EyeOff className="h-4 w-4" aria-hidden />
                    Cover
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => addFogBox('reveal')}>
                    <Eye className="h-4 w-4" aria-hidden />
                    Reveal
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => mutations.updateScene.mutate({ fog: { enabled: false, regions: [] } })}
                    className="col-span-2"
                  >
                    Clear Fog
                  </Button>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                  <input
                    type="checkbox"
                    checked={state.scene.settings.showEnemyResources}
                    onChange={(event) => mutations.updateScene.mutate({ settings: { showEnemyResources: event.target.checked } })}
                    className="h-4 w-4 rounded border-border-light"
                  />
                  Show enemy HP/EN/AP to players
                </label>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-text-primary">Tokens</h2>
                <span className="text-sm text-text-secondary">{state.tokens.length}</span>
              </div>
              <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                {state.tokens.map((token) => (
                  <button
                    type="button"
                    key={token.id}
                    onClick={() => setSelectedTokenId(token.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      selectedTokenId === token.id
                        ? 'border-primary-outline-border bg-primary-subtle-bg'
                        : 'border-border-light bg-surface hover:bg-surface-alt'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-medium text-text-primary">{token.name}</span>
                      <span className="text-xs capitalize text-text-secondary">{token.combatantType}</span>
                    </span>
                    <span className="mt-1 block text-xs text-text-secondary">
                      {token.metadata.currentHealth != null ? `HP ${token.metadata.currentHealth}/${token.metadata.maxHealth ?? '?'}` : 'Resources hidden'}
                    </span>
                  </button>
                ))}
              </div>
              {selectedToken && isRealmMaster && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => mutations.updateToken.mutate({ id: selectedToken.id, updates: { visible: !selectedToken.visible } })}
                  >
                    {selectedToken.visible ? 'Hide' : 'Show'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => mutations.updateToken.mutate({ id: selectedToken.id, updates: { locked: !selectedToken.locked } })}
                  >
                    {selectedToken.locked ? 'Unlock' : 'Lock'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <h2 className="text-lg font-semibold text-text-primary">Move Requests</h2>
              {pendingMoves.length === 0 ? (
                <p className="text-sm text-text-secondary">No pending movement.</p>
              ) : (
                pendingMoves.map((action) => {
                  const token = state.tokens.find((candidate) => candidate.id === action.tokenId);
                  return (
                    <div key={action.id} className="rounded-lg border border-border-light bg-surface-alt p-3">
                      <p className="text-sm font-medium text-text-primary">{token?.name ?? 'Token'} wants to move.</p>
                      <p className="text-xs text-text-secondary">
                        To {Math.round(action.toX)}, {Math.round(action.toY)}
                      </p>
                      {isRealmMaster ? (
                        <div className="mt-2 flex gap-2">
                          <Button type="button" size="sm" onClick={() => mutations.resolveAction.mutate({ actionId: action.id, status: 'accepted' })}>
                            Accept
                          </Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => mutations.resolveAction.mutate({ actionId: action.id, status: 'dismissed' })}>
                            Dismiss
                          </Button>
                        </div>
                      ) : action.userId === user?.uid ? (
                        <p className="mt-2 text-xs text-warning-fg">Waiting on the Realm Master.</p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {!isRealmMaster && toolMode === 'request-move' && !selectedToken && (
            <Alert variant="info" title="Select a token first">
              Choose a visible token, then click a destination on the map to request movement.
            </Alert>
          )}

          <Card>
            <CardContent className="space-y-2 text-sm text-text-secondary">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                <Map className="h-4 w-4" aria-hidden />
                Map
              </h2>
              <p>{state.scene.map?.fileName ?? 'Blank grid'}</p>
              <p>Scroll to zoom. Drag the map to pan.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </PageContainer>
  );
}

