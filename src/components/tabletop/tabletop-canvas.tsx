'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from 'react-konva';
import type Konva from 'konva';
import { IconButton } from '@/components/ui';
import { clampPointToMap, measureGridDistance, snapPointToGrid } from '@/lib/tabletop/grid';
import { cn } from '@/lib/utils/cn';
import type { VttPoint, VttTabletopState, VttToken } from '@/types/tabletop';

export type TabletopToolMode = 'select' | 'ping' | 'request-move';

interface TabletopCanvasProps {
  state: VttTabletopState;
  selectedTokenId?: string;
  toolMode: TabletopToolMode;
  onSelectToken: (tokenId: string | undefined) => void;
  onMoveToken: (tokenId: string, point: VttPoint) => void;
  onPing: (point: VttPoint) => void;
  onRequestMove: (token: VttToken, point: VttPoint) => void;
}

function useElementSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 960, height: 640 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      setSize({ width: Math.max(320, rect.width), height: Math.max(360, rect.height) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function useImage(src: string | undefined) {
  const [loaded, setLoaded] = useState<{ src: string; image: HTMLImageElement } | null>(null);
  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setLoaded({ src, image: img });
    img.src = src;
  }, [src]);
  if (!loaded || loaded.src !== src) return null;
  return loaded.image;
}

function buildGridLines(width: number, height: number, cellSize: number, offsetX: number, offsetY: number): number[][] {
  const lines: number[][] = [];
  const safeCell = Math.max(8, cellSize);
  for (let x = offsetX % safeCell; x <= width; x += safeCell) lines.push([x, 0, x, height]);
  for (let y = offsetY % safeCell; y <= height; y += safeCell) lines.push([0, y, width, y]);
  return lines;
}

function tokenTextColor(token: VttToken): string {
  return token.combatantType === 'enemy' ? '#fef2f2' : '#eff6ff';
}

export function TabletopCanvas({
  state,
  selectedTokenId,
  toolMode,
  onSelectToken,
  onMoveToken,
  onPing,
  onRequestMove,
}: TabletopCanvasProps) {
  const { ref, size } = useElementSize();
  const stageRef = useRef<Konva.Stage>(null);
  const [scale, setScale] = useState(1);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapImage = useImage(state.scene.map?.signedUrl);
  const mapWidth = state.scene.map?.width ?? 1600;
  const mapHeight = state.scene.map?.height ?? 1000;
  const grid = state.scene.grid;
  const canMoveTokens = state.role === 'realm-master';
  const selectedToken = state.tokens.find((token) => token.id === selectedTokenId);

  const gridLines = useMemo(
    () => buildGridLines(mapWidth, mapHeight, grid.cellSize, grid.offsetX, grid.offsetY),
    [mapWidth, mapHeight, grid.cellSize, grid.offsetX, grid.offsetY]
  );

  const pendingMoves = state.actions.filter(
    (action) => action.type === 'move-request' && action.status === 'pending' && action.tokenId
  );
  const pings = state.actions
    .filter((action) => action.type === 'ping')
    .slice(0, 8);

  useEffect(() => {
    setFullscreenAvailable(Boolean(document.fullscreenEnabled && ref.current?.requestFullscreen));

    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === ref.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [ref]);

  const toggleFullscreen = async () => {
    const node = ref.current;
    if (!node || !document.fullscreenEnabled) return;

    try {
      if (document.fullscreenElement === node) {
        await document.exitFullscreen();
      } else {
        await node.requestFullscreen();
      }
    } catch {
      setIsFullscreen(document.fullscreenElement === node);
    }
  };

  const stagePoint = (): VttPoint | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pointer);
  };

  const handleStageClick = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedEmpty = event.target === event.target.getStage();
    const point = stagePoint();
    if (!point) return;
    const nextPoint = clampPointToMap(snapPointToGrid(point, grid), mapWidth, mapHeight);

    if (toolMode === 'ping') {
      onPing(nextPoint);
      return;
    }

    if (toolMode === 'request-move' && selectedToken) {
      onRequestMove(selectedToken, nextPoint);
      return;
    }

    if (clickedEmpty) onSelectToken(undefined);
  };

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;
    const oldScale = scale;
    const direction = event.evt.deltaY > 0 ? -1 : 1;
    const nextScale = Math.max(0.25, Math.min(3, oldScale * (direction > 0 ? 1.08 : 0.92)));
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    setScale(nextScale);
    stage.position({
      x: pointer.x - mousePointTo.x * nextScale,
      y: pointer.y - mousePointTo.y * nextScale,
    });
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative h-[62vh] min-h-[420px] w-full overflow-hidden rounded-lg border border-border-light bg-surface-alt',
        isFullscreen && 'h-screen min-h-screen rounded-none border-0'
      )}
    >
      {fullscreenAvailable && (
        <IconButton
          type="button"
          label={isFullscreen ? 'Exit fullscreen tabletop' : 'Enter fullscreen tabletop'}
          variant="default"
          size="lg"
          onClick={toggleFullscreen}
          className="absolute right-3 top-3 z-10 border border-border-light bg-surface/90 text-text-primary shadow-lg backdrop-blur-sm hover:bg-surface"
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" aria-hidden /> : <Maximize2 className="h-5 w-5" aria-hidden />}
        </IconButton>
      )}
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={scale}
        scaleY={scale}
        draggable
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          <Rect x={0} y={0} width={mapWidth} height={mapHeight} fill="#0f172a" />
          {mapImage ? (
            <KonvaImage image={mapImage} x={0} y={0} width={mapWidth} height={mapHeight} />
          ) : (
            <>
              <Rect x={0} y={0} width={mapWidth} height={mapHeight} fill="#1f2937" />
              <Text
                x={40}
                y={40}
                text="Upload a battle map or use the blank grid."
                fill="#f8fafc"
                fontSize={24}
                fontStyle="bold"
              />
            </>
          )}
        </Layer>

        {grid.enabled && (
          <Layer listening={false}>
            {gridLines.map((points, index) => (
              <Line
                key={`${points.join('-')}-${index}`}
                points={points}
                stroke={grid.color}
                strokeWidth={1}
                opacity={grid.opacity}
              />
            ))}
          </Layer>
        )}

        {state.scene.fog.enabled && (
          <Layer listening={false}>
            {state.scene.fog.regions.map((region) => (
              <Rect
                key={region.id}
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                fill={region.mode === 'cover' ? '#020617' : '#ffffff'}
                opacity={region.mode === 'cover' ? 0.72 : 0.16}
                dash={region.mode === 'reveal' ? [12, 8] : undefined}
                stroke={region.mode === 'reveal' ? '#f8fafc' : undefined}
              />
            ))}
          </Layer>
        )}

        <Layer listening={false}>
          {pendingMoves.map((action) => {
            const token = state.tokens.find((candidate) => candidate.id === action.tokenId);
            if (!token) return null;
            return (
              <Group key={action.id}>
                <Line
                  points={[action.fromX ?? token.x, action.fromY ?? token.y, action.toX, action.toY]}
                  stroke="#f59e0b"
                  strokeWidth={4}
                  dash={[12, 8]}
                  opacity={0.9}
                />
                <Text
                  x={(action.fromX ?? token.x) + 8}
                  y={(action.fromY ?? token.y) + 8}
                  text={`${measureGridDistance({ x: action.fromX ?? token.x, y: action.fromY ?? token.y }, { x: action.toX, y: action.toY }, grid)} sq`}
                  fill="#fbbf24"
                  fontSize={18}
                  fontStyle="bold"
                />
              </Group>
            );
          })}
          {pings.map((action) => (
            <Group key={action.id}>
              <Circle x={action.toX} y={action.toY} radius={34} stroke="#facc15" strokeWidth={5} opacity={0.9} />
              <Circle x={action.toX} y={action.toY} radius={8} fill="#facc15" opacity={0.95} />
            </Group>
          ))}
        </Layer>

        <Layer>
          {state.tokens.map((token) => {
            const selected = token.id === selectedTokenId;
            return (
              <Group
                key={token.id}
                x={token.x}
                y={token.y}
                draggable={canMoveTokens && !token.locked}
                onClick={(event) => {
                  event.cancelBubble = true;
                  onSelectToken(token.id);
                }}
                onTap={(event) => {
                  event.cancelBubble = true;
                  onSelectToken(token.id);
                }}
                onDragEnd={(event) => {
                  const next = clampPointToMap(
                    snapPointToGrid({ x: event.target.x(), y: event.target.y() }, grid),
                    mapWidth,
                    mapHeight
                  );
                  event.target.position(next);
                  onMoveToken(token.id, next);
                }}
              >
                <Circle
                  radius={token.size / 2}
                  fill={token.color}
                  stroke={selected ? '#facc15' : '#ffffff'}
                  strokeWidth={selected ? 5 : 2}
                  shadowColor="#000000"
                  shadowBlur={selected ? 12 : 5}
                  shadowOpacity={0.35}
                />
                <Text
                  text={token.label}
                  width={token.size}
                  x={-token.size / 2}
                  y={-8}
                  align="center"
                  fill={tokenTextColor(token)}
                  fontSize={16}
                  fontStyle="bold"
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
