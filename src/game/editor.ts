import { TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from './levels';
import type { LaserEmitter, LevelDef, Platform, Sawblade, ShardDef, Spike } from './types';

export const GRID_COLS = WORLD_WIDTH / TILE_SIZE; // 32 (interior: 1..30)
export const GRID_ROWS = WORLD_HEIGHT / TILE_SIZE; // 18 (interior: 1..17)

export type EditorTool =
  | 'block'
  | 'saw'
  | 'laser'
  | 'spike'
  | 'shard'
  | 'spawn'
  | 'portal'
  | 'erase';

export type LaserDirection = 'down' | 'up' | 'left' | 'right';

export interface GridCell {
  col: number;
  row: number;
}

export interface EditorSaw {
  c1: number;
  r1: number;
  c2: number;
  r2: number;
}

export interface EditorLaser {
  col: number;
  row: number;
  dir: LaserDirection;
  phaseOffset: number;
}

export interface EditorState {
  blocks: string[]; // "col,row" keys
  spikes: string[]; // "col,row" keys
  saws: EditorSaw[];
  lasers: EditorLaser[];
  shards: string[]; // "col,row" keys
  spawnCell: GridCell;
  portalCell: GridCell;
}

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function parseCellKey(key: string): GridCell {
  const [c, r] = key.split(',').map(Number);
  return { col: c, row: r };
}

export function isEditableCell(col: number, row: number): boolean {
  return col >= 1 && col <= GRID_COLS - 2 && row >= 1 && row <= GRID_ROWS - 1;
}

export function screenToGridCell(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
): GridCell | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const worldX = ((clientX - rect.left) / rect.width) * WORLD_WIDTH;
  const worldY = ((clientY - rect.top) / rect.height) * WORLD_HEIGHT;
  const col = Math.floor(worldX / TILE_SIZE);
  const row = Math.floor(worldY / TILE_SIZE);
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
  return { col, row };
}

export function createStarterEditorState(): EditorState {
  const blocks: string[] = [];
  // Spawn floor (cols 1..5, rows 15..17)
  for (let c = 1; c <= 5; c++) {
    for (let r = 15; r <= 17; r++) blocks.push(cellKey(c, r));
  }
  // Mid platform (cols 11..15, row 13)
  for (let c = 11; c <= 15; c++) {
    blocks.push(cellKey(c, 13));
  }
  // Upper step (cols 19..23, row 11)
  for (let c = 19; c <= 23; c++) {
    blocks.push(cellKey(c, 11));
  }
  // Exit platform (cols 27..30, rows 12..17)
  for (let c = 27; c <= 30; c++) {
    for (let r = 12; r <= 17; r++) blocks.push(cellKey(c, r));
  }
  // Bottom pit floor under spikes
  for (let c = 6; c <= 26; c++) {
    blocks.push(cellKey(c, 17));
  }

  const spikes: string[] = [];
  for (let c = 6; c <= 26; c++) {
    spikes.push(cellKey(c, 16));
  }

  return {
    blocks,
    spikes,
    saws: [{ c1: 17, r1: 9, c2: 17, r2: 14 }],
    lasers: [{ col: 13, row: 1, dir: 'down', phaseOffset: 0 }],
    shards: [cellKey(21, 9)],
    spawnCell: { col: 2, row: 14 },
    portalCell: { col: 28, row: 10 },
  };
}

export function createBlankEditorState(): EditorState {
  const blocks: string[] = [];
  for (let c = 1; c <= 4; c++) {
    for (let r = 15; r <= 17; r++) blocks.push(cellKey(c, r));
  }
  for (let c = 27; c <= 30; c++) {
    for (let r = 15; r <= 17; r++) blocks.push(cellKey(c, r));
  }
  return {
    blocks,
    spikes: [],
    saws: [],
    lasers: [],
    shards: [],
    spawnCell: { col: 2, row: 14 },
    portalCell: { col: 28, row: 13 },
  };
}

export function cloneEditorState(state: EditorState): EditorState {
  return {
    blocks: [...state.blocks],
    spikes: [...state.spikes],
    saws: state.saws.map((s) => ({ ...s })),
    lasers: state.lasers.map((l) => ({ ...l })),
    shards: [...state.shards],
    spawnCell: { ...state.spawnCell },
    portalCell: { ...state.portalCell },
  };
}

export function eraseCellEntities(state: EditorState, col: number, row: number): EditorState {
  const key = cellKey(col, row);
  const next = cloneEditorState(state);
  next.blocks = next.blocks.filter((b) => b !== key);
  next.spikes = next.spikes.filter((s) => s !== key);
  next.shards = next.shards.filter((s) => s !== key);
  next.lasers = next.lasers.filter((l) => !(l.col === col && l.row === row));
  next.saws = next.saws.filter(
    (s) => !(s.c1 === col && s.r1 === row) && !(s.c2 === col && s.r2 === row)
  );
  return next;
}

export function placeBlockAtCell(state: EditorState, col: number, row: number): EditorState {
  if (!isEditableCell(col, row)) return state;
  if (
    (col === state.spawnCell.col && row === state.spawnCell.row) ||
    (col === state.portalCell.col && row === state.portalCell.row)
  ) {
    return state;
  }
  const key = cellKey(col, row);
  const next = eraseCellEntities(state, col, row);
  if (!next.blocks.includes(key)) {
    next.blocks.push(key);
  }
  return next;
}

export function placeSpikeAtCell(state: EditorState, col: number, row: number): EditorState {
  if (!isEditableCell(col, row)) return state;
  if (
    (col === state.spawnCell.col && row === state.spawnCell.row) ||
    (col === state.portalCell.col && row === state.portalCell.row)
  ) {
    return state;
  }
  const key = cellKey(col, row);
  const next = eraseCellEntities(state, col, row);
  if (!next.spikes.includes(key)) {
    next.spikes.push(key);
  }
  return next;
}

export function placeShardAtCell(state: EditorState, col: number, row: number): EditorState {
  if (!isEditableCell(col, row)) return state;
  const key = cellKey(col, row);
  const next = eraseCellEntities(state, col, row);
  if (!next.shards.includes(key)) {
    next.shards.push(key);
  }
  return next;
}

export function placeSawPath(
  state: EditorState,
  c1: number,
  r1: number,
  c2: number,
  r2: number
): EditorState {
  if (!isEditableCell(c1, r1) || !isEditableCell(c2, r2)) return state;
  const next = cloneEditorState(state);
  // If user clicked a single cell without dragging, create a clean 3-tile patrol when space permits
  let endC = c2;
  let endR = r2;
  if (c1 === c2 && r1 === r2) {
    if (isEditableCell(c1 + 2, r1) && !next.blocks.includes(cellKey(c1 + 1, r1))) {
      endC = c1 + 2;
    } else if (isEditableCell(c1, r1 + 2)) {
      endR = r1 + 2;
    }
  }
  // Remove any existing saw starting on the same anchor cell
  next.saws = next.saws.filter((s) => !(s.c1 === c1 && s.r1 === r1));
  next.saws.push({ c1, r1, c2: endC, r2: endR });
  return next;
}

export function placeLaserAtCell(
  state: EditorState,
  col: number,
  row: number,
  dir: LaserDirection
): EditorState {
  if (!isEditableCell(col, row)) return state;
  const next = eraseCellEntities(state, col, row);
  const phaseOffset = (next.lasers.length * 0.55) % 2.1;
  next.lasers.push({ col, row, dir, phaseOffset });
  return next;
}

export function setSpawnCell(state: EditorState, col: number, row: number): EditorState {
  if (!isEditableCell(col, row)) return state;
  const next = eraseCellEntities(state, col, row);
  next.spawnCell = { col, row };
  return next;
}

export function setPortalCell(state: EditorState, col: number, row: number): EditorState {
  if (!isEditableCell(col, row)) return state;
  const next = eraseCellEntities(state, col, row);
  next.portalCell = { col, row };
  return next;
}

export function computeLaserRay(
  laser: EditorLaser,
  blockSet: Set<string>
): { x: number; y: number; dx: number; dy: number; length: number } {
  const cx = laser.col * TILE_SIZE + TILE_SIZE / 2;
  const cy = laser.row * TILE_SIZE + TILE_SIZE / 2;
  let dx = 0;
  let dy = 0;
  let stepC = 0;
  let stepR = 0;
  let startX = cx;
  let startY = cy;

  if (laser.dir === 'down') {
    dy = 1;
    stepR = 1;
    startY = laser.row * TILE_SIZE + 8;
  } else if (laser.dir === 'up') {
    dy = -1;
    stepR = -1;
    startY = laser.row * TILE_SIZE + TILE_SIZE - 8;
  } else if (laser.dir === 'right') {
    dx = 1;
    stepC = 1;
    startX = laser.col * TILE_SIZE + 8;
  } else {
    dx = -1;
    stepC = -1;
    startX = laser.col * TILE_SIZE + TILE_SIZE - 8;
  }

  let curC = laser.col + stepC;
  let curR = laser.row + stepR;
  let steps = 0;
  while (curC >= 1 && curC <= GRID_COLS - 2 && curR >= 1 && curR <= GRID_ROWS - 1) {
    if (blockSet.has(cellKey(curC, curR))) {
      break;
    }
    steps += 1;
    curC += stepC;
    curR += stepR;
  }

  // Distance from emitter nozzle to edge of first hit solid or outer wall
  const edgeDist =
    steps * TILE_SIZE + (TILE_SIZE - 8);
  return {
    x: startX,
    y: startY,
    dx,
    dy,
    length: Math.max(TILE_SIZE, edgeDist),
  };
}

export function compileEditorLevel(editor: EditorState): LevelDef {
  const borderWalls: Platform[] = [
    { x: 0, y: 0, w: WORLD_WIDTH, h: TILE_SIZE, kind: 'wall' },
    { x: 0, y: 0, w: TILE_SIZE, h: WORLD_HEIGHT, kind: 'wall' },
    { x: WORLD_WIDTH - TILE_SIZE, y: 0, w: TILE_SIZE, h: WORLD_HEIGHT, kind: 'wall' },
  ];

  const blockSet = new Set(editor.blocks);
  const blockPlatforms: Platform[] = editor.blocks.map((key) => {
    const { col, row } = parseCellKey(key);
    return {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
      w: TILE_SIZE,
      h: TILE_SIZE,
    };
  });

  const spikes: Spike[] = editor.spikes.map((key) => {
    const { col, row } = parseCellKey(key);
    return {
      x: col * TILE_SIZE,
      y: row * TILE_SIZE + 14,
      w: TILE_SIZE,
      h: 16,
      dir: 'up',
    };
  });

  const saws: Sawblade[] = editor.saws.map((s, idx) => ({
    x1: s.c1 * TILE_SIZE + TILE_SIZE / 2,
    y1: s.r1 * TILE_SIZE + TILE_SIZE / 2,
    x2: s.c2 * TILE_SIZE + TILE_SIZE / 2,
    y2: s.r2 * TILE_SIZE + TILE_SIZE / 2,
    radius: 15,
    speed: 135,
    phaseOffset: (idx * 0.35) % 1,
  }));

  const lasers: LaserEmitter[] = editor.lasers.map((l) => {
    const ray = computeLaserRay(l, blockSet);
    return {
      x: ray.x,
      y: ray.y,
      dx: ray.dx,
      dy: ray.dy,
      length: ray.length,
      chargeTime: 0.55,
      activeTime: 0.52,
      cooldownTime: 1.0,
      phaseOffset: l.phaseOffset,
    };
  });

  const shards: ShardDef[] = editor.shards.map((key) => {
    const { col, row } = parseCellKey(key);
    return {
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: row * TILE_SIZE + TILE_SIZE / 2,
    };
  });

  return {
    id: 99,
    name: 'Custom Chamber',
    subtitle: 'User-built precision gauntlet.',
    spawn: {
      x: editor.spawnCell.col * TILE_SIZE + 6,
      y: editor.spawnCell.row * TILE_SIZE + 8,
    },
    portal: {
      x: editor.portalCell.col * TILE_SIZE + TILE_SIZE / 2,
      y: editor.portalCell.row * TILE_SIZE + 7,
    },
    platforms: [...borderWalls, ...blockPlatforms],
    spikes,
    saws,
    lasers,
    orbitals: [],
    crumbles: [],
    shards,
    checkpoints: [],
  };
}
