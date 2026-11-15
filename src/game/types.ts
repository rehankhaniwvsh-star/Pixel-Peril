export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export type GameOutcome = 'none' | 'victory' | 'defeat';

export type RunMode = 'challenge' | 'practice';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform extends Rect {
  kind?: 'solid' | 'wall';
}

export type SpikeDir = 'up' | 'down' | 'left' | 'right';

export interface Spike {
  x: number;
  y: number;
  w: number;
  h: number;
  dir: SpikeDir;
}

export interface Sawblade {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  radius: number;
  speed: number;
  phaseOffset?: number;
}

export interface LaserEmitter {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  chargeTime: number;
  activeTime: number;
  cooldownTime: number;
  phaseOffset?: number;
}

export interface OrbitalSentry {
  cx: number;
  cy: number;
  orbitRadius: number;
  orbRadius: number;
  angularSpeed: number;
  phaseOffset?: number;
}

export interface CrumbleTileDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ShardDef {
  x: number;
  y: number;
}

export interface CheckpointDef {
  x: number;
  y: number;
}

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  spawn: { x: number; y: number };
  portal: { x: number; y: number };
  platforms: Platform[];
  spikes: Spike[];
  saws: Sawblade[];
  lasers: LaserEmitter[];
  orbitals: OrbitalSentry[];
  crumbles: CrumbleTileDef[];
  shards: ShardDef[];
  checkpoints: CheckpointDef[];
}

export interface CrumbleState extends CrumbleTileDef {
  status: 'solid' | 'shaking' | 'broken';
  timer: number;
}

export interface ShardState extends ShardDef {
  collected: boolean;
}

export interface CheckpointState extends CheckpointDef {
  activated: boolean;
}

export interface ScarfNode {
  x: number;
  y: number;
}

export interface Afterimage {
  x: number;
  y: number;
  facing: 1 | -1;
  alpha: number;
}

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
  onWall: -1 | 0 | 1;
  coyoteTimer: number;
  jumpBufferTimer: number;
  wallJumpLockTimer: number;
  dashTimer: number;
  dashCooldown: number;
  canDash: boolean;
  scaleX: number;
  scaleY: number;
  walkDistance: number;
  dead: boolean;
  respawnTimer: number;
  invulnTimer: number;
  scarf: ScarfNode[];
  afterimages: Afterimage[];
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
}

export type HazardKind = 'spike' | 'saw' | 'orbital' | 'laser' | 'pit';

export interface SimulationEvent {
  type:
    | 'jump'
    | 'land'
    | 'dash'
    | 'shard'
    | 'portal_open'
    | 'checkpoint'
    | 'death'
    | 'crumble'
    | 'laser_fire'
    | 'stage_clear'
    | 'victory'
    | 'defeat';
  x?: number;
  y?: number;
  cause?: HazardKind;
}

export interface SimulationState {
  phase: GamePhase;
  outcome: GameOutcome;
  mode: RunMode;
  levelIndex: number;
  customLevel: LevelDef | null;
  levelTime: number;
  totalTime: number;
  deaths: number;
  stageDeaths: number;
  lives: number;
  maxLives: number;
  hitstopTimer: number;
  trauma: number;
  flashTimer: number;
  lastDeathCause: HazardKind | null;
  impactShakeTimer: number;
  shakeClock: number;
  activeSpawn: { x: number; y: number };
  portalOpen: boolean;
  player: PlayerState;
  crumbles: CrumbleState[];
  shards: ShardState[];
  checkpoints: CheckpointState[];
  particles: Particle[];
  particleCursor: number;
  prevLaserActive: boolean[];
  events: SimulationEvent[];
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  jumpJustReleased: boolean;
  dashJustPressed: boolean;
}

export interface HudSnapshot {
  phase: GamePhase;
  outcome: GameOutcome;
  mode: RunMode;
  levelIndex: number;
  totalLevels: number;
  levelName: string;
  isTestingCustom: boolean;
  shardsCollected: number;
  shardsTotal: number;
  portalOpen: boolean;
  lives: number;
  maxLives: number;
  deaths: number;
  elapsedSeconds: number;
  bestTimeSeconds: number | null;
  bestDeaths: number | null;
  highestUnlockedStage: number;
}
