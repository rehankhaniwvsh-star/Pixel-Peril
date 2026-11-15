import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { GameHud } from './components/GameHud';
import { LevelEditorOverlay } from './components/LevelEditorOverlay';
import { StatusModals } from './components/StatusModals';
import { TitleOverlay } from './components/TitleOverlay';
import { TouchControls } from './components/TouchControls';
import { soundEngine } from './game/audio';
import {
  compileEditorLevel,
  createBlankEditorState,
  createStarterEditorState,
  eraseCellEntities,
  placeBlockAtCell,
  placeLaserAtCell,
  placeSawPath,
  placeShardAtCell,
  placeSpikeAtCell,
  screenToGridCell,
  setPortalCell,
  setSpawnCell,
  type EditorState,
  type EditorTool,
  type GridCell,
  type LaserDirection,
} from './game/editor';
import { LEVELS, WORLD_HEIGHT, WORLD_WIDTH } from './game/levels';
import {
  createSimulationState,
  loadLevelIntoState,
  stepSimulation,
} from './game/physics';
import { renderEditorOverlay, renderGame } from './game/renderer';
import type {
  GamePhase,
  HudSnapshot,
  InputState,
  RunMode,
  SimulationState,
} from './game/types';

const STORAGE_KEY = 'toughest_pixel_save_v1';
const EDITOR_STORAGE_KEY = 'toughest_pixel_editor_v1';

interface SavedProgress {
  bestTimeSeconds: number | null;
  bestDeaths: number | null;
  highestUnlockedStage: number;
}

function loadSavedProgress(): SavedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { bestTimeSeconds: null, bestDeaths: null, highestUnlockedStage: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    return {
      bestTimeSeconds:
        typeof parsed.bestTimeSeconds === 'number' ? parsed.bestTimeSeconds : null,
      bestDeaths: typeof parsed.bestDeaths === 'number' ? parsed.bestDeaths : null,
      highestUnlockedStage:
        typeof parsed.highestUnlockedStage === 'number'
          ? Math.max(0, Math.min(LEVELS.length - 1, parsed.highestUnlockedStage))
          : 0,
    };
  } catch {
    return { bestTimeSeconds: null, bestDeaths: null, highestUnlockedStage: 0 };
  }
}

function writeSavedProgress(data: SavedProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota / private mode failures
  }
}

function loadSavedEditorState(): EditorState {
  try {
    const raw = localStorage.getItem(EDITOR_STORAGE_KEY);
    if (!raw) return createStarterEditorState();
    const parsed = JSON.parse(raw) as Partial<EditorState>;
    if (
      Array.isArray(parsed.blocks) &&
      Array.isArray(parsed.spikes) &&
      Array.isArray(parsed.saws) &&
      Array.isArray(parsed.lasers) &&
      Array.isArray(parsed.shards) &&
      parsed.spawnCell &&
      parsed.portalCell
    ) {
      return parsed as EditorState;
    }
    return createStarterEditorState();
  } catch {
    return createStarterEditorState();
  }
}

function writeSavedEditorState(editor: EditorState): void {
  try {
    localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(editor));
  } catch {
    // Ignore storage quota failures
  }
}

function buildHudSnapshot(
  state: SimulationState,
  saved: SavedProgress
): HudSnapshot {
  const level = state.customLevel ?? LEVELS[state.levelIndex];
  const shardsCollected = state.shards.filter((s) => s.collected).length;
  return {
    phase: state.phase,
    outcome: state.outcome,
    mode: state.mode,
    levelIndex: state.levelIndex,
    totalLevels: LEVELS.length,
    levelName: level.name,
    isTestingCustom: state.customLevel !== null,
    shardsCollected,
    shardsTotal: state.shards.length,
    portalOpen: state.portalOpen,
    lives: state.lives,
    maxLives: state.maxLives,
    deaths: state.deaths,
    elapsedSeconds: Math.floor(state.totalTime),
    bestTimeSeconds: saved.bestTimeSeconds,
    bestDeaths: saved.bestDeaths,
    highestUnlockedStage: saved.highestUnlockedStage,
  };
}

function snapshotsEqual(a: HudSnapshot, b: HudSnapshot): boolean {
  return (
    a.phase === b.phase &&
    a.outcome === b.outcome &&
    a.mode === b.mode &&
    a.levelIndex === b.levelIndex &&
    a.isTestingCustom === b.isTestingCustom &&
    a.shardsCollected === b.shardsCollected &&
    a.portalOpen === b.portalOpen &&
    a.lives === b.lives &&
    a.deaths === b.deaths &&
    a.elapsedSeconds === b.elapsedSeconds &&
    a.bestTimeSeconds === b.bestTimeSeconds &&
    a.bestDeaths === b.bestDeaths &&
    a.highestUnlockedStage === b.highestUnlockedStage
  );
}

type MoveAction = 'left' | 'right' | 'up' | 'down' | 'jump' | 'dash';

function resolveKeyActions(e: KeyboardEvent): MoveAction[] {
  const actions: MoveAction[] = [];
  const k = e.key.toLowerCase();
  if (e.code === 'ArrowLeft' || e.code === 'KeyA' || k === 'arrowleft' || k === 'a') {
    actions.push('left');
  }
  if (e.code === 'ArrowRight' || e.code === 'KeyD' || k === 'arrowright' || k === 'd') {
    actions.push('right');
  }
  if (e.code === 'ArrowUp' || e.code === 'KeyW' || k === 'arrowup' || k === 'w') {
    actions.push('up');
    actions.push('jump');
  }
  if (e.code === 'ArrowDown' || e.code === 'KeyS' || k === 'arrowdown' || k === 's') {
    actions.push('down');
  }
  if (e.code === 'Space' || e.code === 'KeyZ' || k === ' ' || k === 'z') {
    actions.push('jump');
  }
  if (
    e.code === 'ShiftLeft' ||
    e.code === 'ShiftRight' ||
    e.code === 'KeyX' ||
    e.code === 'KeyJ' ||
    e.code === 'KeyK' ||
    k === 'shift' ||
    k === 'x' ||
    k === 'j' ||
    k === 'k'
  ) {
    actions.push('dash');
  }
  return actions;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeKeyCodesRef = useRef<Map<string, MoveAction[]>>(new Map());
  const actionCountsRef = useRef<Record<MoveAction, number>>({
    left: 0,
    right: 0,
    up: 0,
    down: 0,
    jump: 0,
    dash: 0,
  });
  const touchHeldRef = useRef<{ left: boolean; right: boolean; jump: boolean }>({
    left: false,
    right: false,
    jump: false,
  });
  const jumpJustPressedRef = useRef(false);
  const jumpJustReleasedRef = useRef(false);
  const dashJustPressedRef = useRef(false);

  const savedRef = useRef<SavedProgress>(loadSavedProgress());
  const initialAutostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const simRef = useRef<SimulationState>(
    createSimulationState(0, 'challenge', initialAutostart ? 'playing' : 'title')
  );

  const [hud, setHud] = useState<HudSnapshot>(() =>
    buildHudSnapshot(simRef.current, savedRef.current)
  );
  const lastHudRef = useRef<HudSnapshot>(hud);
  const [muted, setMuted] = useState(false);
  const [showStagesModal, setShowStagesModal] = useState(false);
  const showStagesRef = useRef(false);
  const [showTouchControls, setShowTouchControls] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
  );
  const [windowFocused, setWindowFocused] = useState(() =>
    typeof document !== 'undefined' ? document.hasFocus() : true
  );

  // Level Editor state
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = useRef(false);
  const [editorState, setEditorState] = useState<EditorState>(() => loadSavedEditorState());
  const editorStateRef = useRef<EditorState>(editorState);
  const [activeTool, setActiveTool] = useState<EditorTool>('block');
  const activeToolRef = useRef<EditorTool>('block');
  const [laserDir, setLaserDir] = useState<LaserDirection>('down');
  const laserDirRef = useRef<LaserDirection>('down');
  const [hoverCell, setHoverCell] = useState<GridCell | null>(null);
  const hoverCellRef = useRef<GridCell | null>(null);
  const sawDragStartRef = useRef<GridCell | null>(null);
  const paintModeRef = useRef<'place' | 'erase' | null>(null);
  const lastPaintedCellRef = useRef<string | null>(null);

  useEffect(() => {
    showStagesRef.current = showStagesModal;
  }, [showStagesModal]);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  useEffect(() => {
    laserDirRef.current = laserDir;
  }, [laserDir]);

  const syncPhaseAttr = useCallback((phase: GamePhase) => {
    document.body.dataset.state = isEditingRef.current ? 'editor' : phase;
  }, []);

  const syncHudNow = useCallback(() => {
    const next = buildHudSnapshot(simRef.current, savedRef.current);
    lastHudRef.current = next;
    setHud(next);
    syncPhaseAttr(next.phase);
  }, [syncPhaseAttr]);

  const clearInputs = useCallback(() => {
    activeKeyCodesRef.current.clear();
    actionCountsRef.current = { left: 0, right: 0, up: 0, down: 0, jump: 0, dash: 0 };
    touchHeldRef.current = { left: false, right: false, jump: false };
    jumpJustPressedRef.current = false;
    jumpJustReleasedRef.current = false;
    dashJustPressedRef.current = false;
  }, []);

  const focusGame = useCallback(() => {
    window.focus();
    canvasRef.current?.focus();
    setWindowFocused(true);
  }, []);

  const updateEditorState = useCallback((next: EditorState) => {
    editorStateRef.current = next;
    setEditorState(next);
    writeSavedEditorState(next);
    if (isEditingRef.current) {
      const compiled = compileEditorLevel(next);
      simRef.current = createSimulationState(0, 'practice', 'title', compiled);
    }
  }, []);

  const openEditor = useCallback(() => {
    isEditingRef.current = true;
    setIsEditing(true);
    setShowStagesModal(false);
    clearInputs();
    const compiled = compileEditorLevel(editorStateRef.current);
    simRef.current = createSimulationState(0, 'practice', 'title', compiled);
    syncHudNow();
  }, [clearInputs, syncHudNow]);

  const closeEditor = useCallback(() => {
    isEditingRef.current = false;
    setIsEditing(false);
    sawDragStartRef.current = null;
    paintModeRef.current = null;
    simRef.current = createSimulationState(0, simRef.current.mode, 'title', null);
    syncHudNow();
  }, [syncHudNow]);

  const testCustomLevel = useCallback(() => {
    isEditingRef.current = false;
    setIsEditing(false);
    sawDragStartRef.current = null;
    paintModeRef.current = null;
    const compiled = compileEditorLevel(editorStateRef.current);
    simRef.current = createSimulationState(0, 'practice', 'playing', compiled);
    clearInputs();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    canvasRef.current?.focus();
    syncHudNow();
  }, [clearInputs, syncHudNow]);

  const cycleLaserDir = useCallback(() => {
    const order: LaserDirection[] = ['down', 'right', 'up', 'left'];
    setLaserDir((prev) => order[(order.indexOf(prev) + 1) % order.length]);
  }, []);

  const startGame = useCallback(
    (levelIndex = 0, modeOverride?: RunMode) => {
      isEditingRef.current = false;
      setIsEditing(false);
      const custom = simRef.current.customLevel;
      const mode = modeOverride ?? simRef.current.mode;
      const fresh = createSimulationState(levelIndex, mode, 'playing', custom);
      simRef.current = fresh;
      clearInputs();
      setShowStagesModal(false);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      canvasRef.current?.focus();
      syncHudNow();
    },
    [clearInputs, syncHudNow]
  );

  const startCampaignGame = useCallback(
    (levelIndex = 0, modeOverride?: RunMode) => {
      isEditingRef.current = false;
      setIsEditing(false);
      const mode = modeOverride ?? simRef.current.mode;
      const fresh = createSimulationState(levelIndex, mode, 'playing', null);
      simRef.current = fresh;
      clearInputs();
      setShowStagesModal(false);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      canvasRef.current?.focus();
      syncHudNow();
    },
    [clearInputs, syncHudNow]
  );

  const handleSelectMode = useCallback(
    (mode: RunMode) => {
      simRef.current.mode = mode;
      simRef.current.maxLives = mode === 'challenge' ? 5 : 999;
      simRef.current.lives = simRef.current.maxLives;
      syncHudNow();
    },
    [syncHudNow]
  );

  const handlePause = useCallback(() => {
    if (simRef.current.phase === 'playing') {
      simRef.current.phase = 'paused';
      clearInputs();
      syncHudNow();
    }
  }, [clearInputs, syncHudNow]);

  const handleResume = useCallback(() => {
    if (simRef.current.phase === 'paused') {
      simRef.current.phase = 'playing';
      clearInputs();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      canvasRef.current?.focus();
      syncHudNow();
    }
  }, [clearInputs, syncHudNow]);

  const handleRestartStage = useCallback(() => {
    const s = simRef.current;
    loadLevelIntoState(s, s.levelIndex);
    s.phase = 'playing';
    s.outcome = 'none';
    clearInputs();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    canvasRef.current?.focus();
    syncHudNow();
  }, [clearInputs, syncHudNow]);

  const handleReturnToTitle = useCallback(() => {
    isEditingRef.current = false;
    setIsEditing(false);
    const mode = simRef.current.mode;
    simRef.current = createSimulationState(0, mode, 'title', null);
    clearInputs();
    setShowStagesModal(false);
    syncHudNow();
  }, [clearInputs, syncHudNow]);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setMuted(nextMuted);
  }, []);

  // Sync initial body data-state
  useEffect(() => {
    syncPhaseAttr(simRef.current.phase);
  }, [syncPhaseAttr]);

  // Unified Keyboard Input & Focus-Loss Hygiene
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      setWindowFocused(true);
      const phase = simRef.current.phase;
      const lowerKey = e.key.toLowerCase();

      if (e.code === 'KeyM' || lowerKey === 'm') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (isEditingRef.current) {
        const toolKeys: Record<string, EditorTool> = {
          '1': 'block',
          '2': 'saw',
          '3': 'laser',
          '4': 'spike',
          '5': 'shard',
          '6': 'spawn',
          '7': 'portal',
          '8': 'erase',
        };
        if (toolKeys[e.key]) {
          e.preventDefault();
          setActiveTool(toolKeys[e.key]);
          return;
        }
        if (e.code === 'KeyQ' || lowerKey === 'q') {
          e.preventDefault();
          cycleLaserDir();
          return;
        }
        if (e.code === 'KeyT' || lowerKey === 't' || e.code === 'Enter') {
          e.preventDefault();
          testCustomLevel();
          return;
        }
        if (e.code === 'Escape') {
          e.preventDefault();
          closeEditor();
          return;
        }
        return;
      }

      if ((e.code === 'KeyE' || lowerKey === 'e') && (phase === 'playing' || phase === 'paused')) {
        e.preventDefault();
        openEditor();
        return;
      }

      if ((e.code === 'KeyC' || lowerKey === 'c') && (phase === 'playing' || phase === 'paused')) {
        e.preventDefault();
        setShowTouchControls((prev) => !prev);
        return;
      }

      if (phase === 'title') {
        if (!showStagesRef.current && (e.code === 'Enter' || e.code === 'Space' || e.key === ' ')) {
          e.preventDefault();
          startCampaignGame(0);
        } else if (showStagesRef.current && e.code === 'Escape') {
          e.preventDefault();
          setShowStagesModal(false);
        }
        return;
      }

      if (phase === 'gameover') {
        if (e.code === 'Enter' || e.code === 'Space' || e.key === ' ') {
          e.preventDefault();
          startGame(0);
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP' || lowerKey === 'p') {
        e.preventDefault();
        if (phase === 'playing') {
          handlePause();
        } else if (phase === 'paused') {
          handleResume();
        }
        return;
      }

      if ((e.code === 'KeyR' || lowerKey === 'r') && (phase === 'playing' || phase === 'paused')) {
        e.preventDefault();
        handleRestartStage();
        return;
      }

      if (phase !== 'playing') return;

      const actions = resolveKeyActions(e);
      if (actions.length === 0) return;

      e.preventDefault();

      const keyId = e.code || e.key;
      if (!activeKeyCodesRef.current.has(keyId)) {
        activeKeyCodesRef.current.set(keyId, actions);
        for (const action of actions) {
          if (action === 'jump' && actionCountsRef.current.jump === 0) {
            jumpJustPressedRef.current = true;
          }
          if (action === 'dash' && actionCountsRef.current.dash === 0) {
            dashJustPressedRef.current = true;
          }
          actionCountsRef.current[action] += 1;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const keyId = e.code || e.key;
      const actions = activeKeyCodesRef.current.get(keyId);
      if (!actions) return;
      activeKeyCodesRef.current.delete(keyId);

      const wasJumpHeld = actionCountsRef.current.jump > 0 || touchHeldRef.current.jump;
      for (const action of actions) {
        actionCountsRef.current[action] = Math.max(0, actionCountsRef.current[action] - 1);
      }
      const stillJumpHeld = actionCountsRef.current.jump > 0 || touchHeldRef.current.jump;

      if (wasJumpHeld && !stillJumpHeld) {
        jumpJustReleasedRef.current = true;
      }
    };

    const onBlur = () => {
      clearInputs();
      setWindowFocused(false);
    };

    const onFocus = () => {
      setWindowFocused(true);
    };

    const onFirstTouch = () => {
      setShowTouchControls(true);
    };

    const onVisibility = () => {
      if (document.hidden) {
        clearInputs();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('touchstart', onFirstTouch, { passive: true, once: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('touchstart', onFirstTouch);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [
    clearInputs,
    closeEditor,
    cycleLaserDir,
    handlePause,
    handleRestartStage,
    handleResume,
    handleToggleMute,
    openEditor,
    startCampaignGame,
    startGame,
    testCustomLevel,
  ]);

  // Isolated 60fps Simulation & Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      const counts = actionCountsRef.current;
      const touch = touchHeldRef.current;
      const input: InputState = {
        left: counts.left > 0 || touch.left,
        right: counts.right > 0 || touch.right,
        up: counts.up > 0,
        down: counts.down > 0,
        jumpHeld: counts.jump > 0 || touch.jump,
        jumpJustPressed: jumpJustPressedRef.current,
        jumpJustReleased: jumpJustReleasedRef.current,
        dashJustPressed: dashJustPressedRef.current,
      };
      jumpJustPressedRef.current = false;
      jumpJustReleasedRef.current = false;
      dashJustPressedRef.current = false;

      const state = simRef.current;
      stepSimulation(state, input, rawDt);

      // Process discrete simulation sound & save events
      for (const ev of state.events) {
        switch (ev.type) {
          case 'jump':
            soundEngine.playJump();
            break;
          case 'land':
            soundEngine.playLand();
            break;
          case 'dash':
            soundEngine.playDash();
            break;
          case 'shard':
            soundEngine.playShard();
            break;
          case 'portal_open':
            soundEngine.playPortalOpen();
            break;
          case 'checkpoint':
            soundEngine.playCheckpoint();
            break;
          case 'crumble':
            soundEngine.playCrumble();
            break;
          case 'laser_fire':
            soundEngine.playLaserFire();
            break;
          case 'death':
            soundEngine.playDeath();
            break;
          case 'stage_clear': {
            soundEngine.playStageClear();
            if (!state.customLevel && state.levelIndex > savedRef.current.highestUnlockedStage) {
              savedRef.current = {
                ...savedRef.current,
                highestUnlockedStage: state.levelIndex,
              };
              writeSavedProgress(savedRef.current);
            }
            break;
          }
          case 'victory': {
            soundEngine.playVictory();
            if (!state.customLevel) {
              const prev = savedRef.current;
              const nextBestTime =
                prev.bestTimeSeconds === null
                  ? state.totalTime
                  : Math.min(prev.bestTimeSeconds, state.totalTime);
              const nextBestDeaths =
                prev.bestDeaths === null
                  ? state.deaths
                  : Math.min(prev.bestDeaths, state.deaths);
              savedRef.current = {
                bestTimeSeconds: nextBestTime,
                bestDeaths: nextBestDeaths,
                highestUnlockedStage: LEVELS.length - 1,
              };
              writeSavedProgress(savedRef.current);
            }
            break;
          }
          case 'defeat':
            soundEngine.playDefeat();
            break;
        }
      }

      // Render frame (always render in editor mode for responsive hover/drag preview)
      if (
        isEditingRef.current ||
        state.phase === 'playing' ||
        state.phase === 'title' ||
        state.events.length > 0
      ) {
        renderGame(ctx, state);
        if (isEditingRef.current) {
          renderEditorOverlay(
            ctx,
            activeToolRef.current,
            laserDirRef.current,
            hoverCellRef.current,
            sawDragStartRef.current
          );
        }
      }

      // Throttle React HUD updates strictly to discrete state/integer changes
      const candidate = buildHudSnapshot(state, savedRef.current);
      if (!snapshotsEqual(candidate, lastHudRef.current)) {
        lastHudRef.current = candidate;
        document.body.dataset.state = isEditingRef.current ? 'editor' : candidate.phase;
        setHud(candidate);
        renderGame(ctx, state);
        if (isEditingRef.current) {
          renderEditorOverlay(
            ctx,
            activeToolRef.current,
            laserDirRef.current,
            hoverCellRef.current,
            sawDragStartRef.current
          );
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const applyToolAtCell = useCallback(
    (col: number, row: number, mode: 'place' | 'erase') => {
      const curr = editorStateRef.current;
      let next = curr;
      if (mode === 'erase' || activeToolRef.current === 'erase') {
        next = eraseCellEntities(curr, col, row);
      } else {
        switch (activeToolRef.current) {
          case 'block':
            next = placeBlockAtCell(curr, col, row);
            break;
          case 'spike':
            next = placeSpikeAtCell(curr, col, row);
            break;
          case 'laser':
            next = placeLaserAtCell(curr, col, row, laserDirRef.current);
            break;
          case 'shard':
            next = placeShardAtCell(curr, col, row);
            break;
          case 'spawn':
            next = setSpawnCell(curr, col, row);
            break;
          case 'portal':
            next = setPortalCell(curr, col, row);
            break;
        }
      }
      if (next !== curr) {
        updateEditorState(next);
      }
    },
    [updateEditorState]
  );

  const handleCanvasPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!isEditingRef.current) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cell = screenToGridCell(e.clientX, e.clientY, canvas.getBoundingClientRect());
      if (!cell) return;

      hoverCellRef.current = cell;
      setHoverCell(cell);

      const isRightClick = e.button === 2;
      if (isRightClick || activeToolRef.current === 'erase') {
        paintModeRef.current = 'erase';
        lastPaintedCellRef.current = `${cell.col},${cell.row}`;
        applyToolAtCell(cell.col, cell.row, 'erase');
        return;
      }

      if (activeToolRef.current === 'saw') {
        sawDragStartRef.current = cell;
        paintModeRef.current = null;
        return;
      }

      paintModeRef.current = 'place';
      lastPaintedCellRef.current = `${cell.col},${cell.row}`;
      applyToolAtCell(cell.col, cell.row, 'place');
    },
    [applyToolAtCell]
  );

  const handleCanvasPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!isEditingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cell = screenToGridCell(e.clientX, e.clientY, canvas.getBoundingClientRect());
      hoverCellRef.current = cell;
      setHoverCell(cell);

      if (!cell || !paintModeRef.current) return;
      const key = `${cell.col},${cell.row}`;
      if (key === lastPaintedCellRef.current) return;
      lastPaintedCellRef.current = key;
      applyToolAtCell(cell.col, cell.row, paintModeRef.current);
    },
    [applyToolAtCell]
  );

  const handleCanvasPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!isEditingRef.current) return;
      const canvas = canvasRef.current;
      if (activeToolRef.current === 'saw' && sawDragStartRef.current && canvas) {
        const endCell =
          screenToGridCell(e.clientX, e.clientY, canvas.getBoundingClientRect()) ??
          sawDragStartRef.current;
        const next = placeSawPath(
          editorStateRef.current,
          sawDragStartRef.current.col,
          sawDragStartRef.current.row,
          endCell.col,
          endCell.row
        );
        updateEditorState(next);
      }
      sawDragStartRef.current = null;
      paintModeRef.current = null;
      lastPaintedCellRef.current = null;
    },
    [updateEditorState]
  );

  return (
    <main
      className="relative w-screen h-[100dvh] bg-[#07090e] flex items-center justify-center overflow-hidden"
      onPointerDown={() => {
        if (simRef.current.phase === 'playing') {
          focusGame();
        }
      }}
    >
      {/* Aspect-preserved full-viewport pixel-art playfield */}
      <canvas
        ref={canvasRef}
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        tabIndex={0}
        data-testid="game-canvas"
        aria-label="The Toughest Pixel game canvas"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={() => {
          hoverCellRef.current = null;
          setHoverCell(null);
          paintModeRef.current = null;
          sawDragStartRef.current = null;
        }}
        onContextMenu={(e) => {
          if (isEditingRef.current) {
            e.preventDefault();
          }
        }}
        style={{
          width: 'min(100vw, calc(100dvh * 16 / 9))',
          height: 'min(100dvh, calc(100vw * 9 / 16))',
          cursor: isEditing ? 'crosshair' : 'default',
        }}
        className={`pixel-canvas block outline-none shadow-2xl border border-[#1d2536] ${
          isEditing ? 'touch-none' : ''
        }`}
      />

      {/* Title Screen */}
      {!isEditing && hud.phase === 'title' && (
        <TitleOverlay
          mode={hud.mode}
          bestTimeSeconds={hud.bestTimeSeconds}
          bestDeaths={hud.bestDeaths}
          onSelectMode={handleSelectMode}
          onStart={() => startCampaignGame(0)}
          onOpenStages={() => setShowStagesModal(true)}
          onOpenEditor={openEditor}
        />
      )}

      {/* Level Editor Overlay */}
      {isEditing && (
        <LevelEditorOverlay
          editorState={editorState}
          activeTool={activeTool}
          laserDir={laserDir}
          hoverCell={hoverCell}
          onSelectTool={setActiveTool}
          onCycleLaserDir={cycleLaserDir}
          onClear={() => updateEditorState(createBlankEditorState())}
          onResetStarter={() => updateEditorState(createStarterEditorState())}
          onTestLevel={testCustomLevel}
          onCloseEditor={closeEditor}
        />
      )}

      {/* Active Playing HUD */}
      {!isEditing && (hud.phase === 'playing' || hud.phase === 'paused') && (
        <GameHud
          hud={hud}
          muted={muted}
          showTouchControls={showTouchControls}
          windowFocused={windowFocused}
          onToggleMute={handleToggleMute}
          onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
          onFocusGame={focusGame}
          onOpenEditor={openEditor}
          onRestartStage={handleRestartStage}
          onPause={handlePause}
        />
      )}

      {/* On-Screen Touch / Pointer Controls */}
      {!isEditing && hud.phase === 'playing' && showTouchControls && (
        <TouchControls
          onMoveLeftChange={(held) => {
            touchHeldRef.current.left = held;
          }}
          onMoveRightChange={(held) => {
            touchHeldRef.current.right = held;
          }}
          onJumpPress={() => {
            if (!touchHeldRef.current.jump) {
              jumpJustPressedRef.current = true;
            }
            touchHeldRef.current.jump = true;
          }}
          onJumpRelease={() => {
            if (touchHeldRef.current.jump) {
              jumpJustReleasedRef.current = true;
            }
            touchHeldRef.current.jump = false;
          }}
          onDashPress={() => {
            dashJustPressedRef.current = true;
          }}
        />
      )}

      {/* Pause / Stages / Victory / Game Over Modals */}
      {!isEditing && (
        <StatusModals
          phase={hud.phase}
          outcome={hud.outcome}
          hud={hud}
          showStagesModal={showStagesModal}
          onResume={handleResume}
          onRestartRun={(modeOverride) => startGame(0, modeOverride)}
          onRestartStage={handleRestartStage}
          onOpenEditor={openEditor}
          onReturnToTitle={handleReturnToTitle}
          onCloseStages={() => setShowStagesModal(false)}
          onSelectStage={(idx) => startCampaignGame(idx)}
        />
      )}
    </main>
  );
}
