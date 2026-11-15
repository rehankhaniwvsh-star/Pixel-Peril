import type { LevelDef, Platform } from './types';

export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;
export const TILE_SIZE = 30;

const BORDER_WALLS: Platform[] = [
  { x: 0, y: 0, w: 960, h: 30, kind: 'wall' },
  { x: 0, y: 0, w: 30, h: 540, kind: 'wall' },
  { x: 930, y: 0, w: 30, h: 540, kind: 'wall' },
];

export const LEVELS: LevelDef[] = [
  // STAGE 1: Calibration Chamber
  {
    id: 1,
    name: 'Calibration Chamber',
    subtitle: 'Unforgiving timing, crumbling perches, and plasma sweeps.',
    spawn: { x: 75, y: 428 },
    portal: { x: 855, y: 344 },
    platforms: [
      ...BORDER_WALLS,
      // Spawn platform
      { x: 30, y: 450, w: 180, h: 90 },
      // Pit 1 base
      { x: 210, y: 510, w: 90, h: 30 },
      // Platform 2
      { x: 300, y: 420, w: 180, h: 120 },
      // Pit 2 base
      { x: 480, y: 510, w: 90, h: 30 },
      // Platform 3
      { x: 570, y: 360, w: 150, h: 180 },
      // Shard ledge
      { x: 420, y: 240, w: 120, h: 28 },
      // Pit 3 base
      { x: 720, y: 510, w: 90, h: 30 },
      // Exit platform
      { x: 810, y: 390, w: 120, h: 150 },
    ],
    spikes: [
      { x: 210, y: 494, w: 90, h: 16, dir: 'up' },
      { x: 480, y: 494, w: 90, h: 16, dir: 'up' },
      { x: 720, y: 494, w: 90, h: 16, dir: 'up' },
    ],
    saws: [
      { x1: 765, y1: 270, x2: 765, y2: 465, radius: 16, speed: 175, phaseOffset: 0 },
    ],
    lasers: [
      { x: 765, y: 30, dx: 0, dy: 1, length: 464, chargeTime: 0.5, activeTime: 0.5, cooldownTime: 0.9, phaseOffset: 0.2 },
    ],
    orbitals: [
      { cx: 390, cy: 368, orbitRadius: 46, orbRadius: 10, angularSpeed: 3.15, phaseOffset: Math.PI },
      { cx: 525, cy: 355, orbitRadius: 36, orbRadius: 9, angularSpeed: -3.2, phaseOffset: 1.5 },
    ],
    crumbles: [
      { x: 600, y: 295, w: 60, h: 22 },
    ],
    shards: [{ x: 480, y: 204 }],
    checkpoints: [],
  },

  // STAGE 2: Clockwork Razor
  {
    id: 2,
    name: 'Clockwork Razor',
    subtitle: 'High-speed rail saws, crumble steps, and sweeping beams.',
    spawn: { x: 65, y: 428 },
    portal: { x: 865, y: 194 },
    platforms: [
      ...BORDER_WALLS,
      // Spawn floor
      { x: 30, y: 450, w: 120, h: 90 },
      // Long lower spike trench
      { x: 150, y: 510, w: 420, h: 30 },
      // Two narrow stepping pedestals (middle replaced by crumble)
      { x: 210, y: 420, w: 60, h: 28 },
      { x: 450, y: 420, w: 60, h: 28 },
      // Checkpoint platform
      { x: 570, y: 390, w: 120, h: 150 },
      // Right spike floor
      { x: 690, y: 510, w: 240, h: 30 },
      // Ascent steps
      { x: 750, y: 320, w: 90, h: 28 },
      { x: 600, y: 250, w: 90, h: 28 },
      // Upper Shard 1 platform
      { x: 410, y: 190, w: 130, h: 28 },
      // Exit ledge
      { x: 810, y: 240, w: 120, h: 28 },
    ],
    spikes: [
      { x: 150, y: 494, w: 420, h: 16, dir: 'up' },
      { x: 690, y: 494, w: 240, h: 16, dir: 'up' },
    ],
    saws: [
      { x1: 295, y1: 285, x2: 295, y2: 470, radius: 16, speed: 195, phaseOffset: 0 },
      { x1: 420, y1: 285, x2: 420, y2: 470, radius: 16, speed: 195, phaseOffset: 0.5 },
      { x1: 420, y1: 190, x2: 530, y2: 190, radius: 15, speed: 165, phaseOffset: 0.2 },
      { x1: 725, y1: 175, x2: 725, y2: 345, radius: 15, speed: 185, phaseOffset: 0.5 },
    ],
    lasers: [
      { x: 30, y: 148, dx: 1, dy: 0, length: 375, chargeTime: 0.48, activeTime: 0.45, cooldownTime: 0.9, phaseOffset: 0.1 },
    ],
    orbitals: [
      { cx: 645, cy: 205, orbitRadius: 42, orbRadius: 10, angularSpeed: 3.3, phaseOffset: 0 },
    ],
    crumbles: [
      { x: 330, y: 390, w: 60, h: 22 },
    ],
    shards: [
      { x: 475, y: 152 },
      { x: 795, y: 282 },
    ],
    checkpoints: [{ x: 620, y: 350 }],
  },

  // STAGE 3: Laser Grid Cadence
  {
    id: 3,
    name: 'Laser Grid Cadence',
    subtitle: 'Rapid-fire plasma crossfire across collapsing bridges.',
    spawn: { x: 65, y: 428 },
    portal: { x: 865, y: 134 },
    platforms: [
      ...BORDER_WALLS,
      // Spawn
      { x: 30, y: 450, w: 120, h: 90 },
      // Full bottom spike bed
      { x: 150, y: 510, w: 780, h: 30 },
      // Solid mid island
      { x: 420, y: 390, w: 60, h: 120 },
      // Checkpoint island
      { x: 570, y: 360, w: 90, h: 150 },
      // Upper left shard ledge
      { x: 180, y: 225, w: 90, h: 28 },
      // Upper mid solid anchor
      { x: 435, y: 180, w: 90, h: 28 },
      // Pre-exit platform
      { x: 685, y: 180, w: 75, h: 28 },
      // Exit platform
      { x: 810, y: 180, w: 120, h: 28 },
    ],
    spikes: [
      { x: 150, y: 494, w: 780, h: 16, dir: 'up' },
    ],
    saws: [
      { x1: 785, y1: 105, x2: 785, y2: 250, radius: 14, speed: 200, phaseOffset: 0 },
      { x1: 285, y1: 180, x2: 415, y2: 180, radius: 14, speed: 165, phaseOffset: 0.35 },
    ],
    lasers: [
      // Vertical laser between crumble 2 and mid island
      { x: 392, y: 30, dx: 0, dy: 1, length: 464, chargeTime: 0.44, activeTime: 0.52, cooldownTime: 0.72, phaseOffset: 0 },
      // Vertical laser after mid island
      { x: 545, y: 30, dx: 0, dy: 1, length: 464, chargeTime: 0.44, activeTime: 0.52, cooldownTime: 0.72, phaseOffset: 0.84 },
      // Horizontal sweep above upper exit lane
      { x: 930, y: 148, dx: -1, dy: 0, length: 245, chargeTime: 0.46, activeTime: 0.48, cooldownTime: 0.85, phaseOffset: 0.35 },
    ],
    orbitals: [
      { cx: 615, cy: 295, orbitRadius: 44, orbRadius: 9, angularSpeed: 3.2, phaseOffset: 0 },
    ],
    crumbles: [
      { x: 195, y: 430, w: 60, h: 22 },
      { x: 300, y: 405, w: 60, h: 22 },
      { x: 450, y: 290, w: 60, h: 22 },
      { x: 325, y: 265, w: 60, h: 22 },
      { x: 575, y: 180, w: 60, h: 22 },
    ],
    shards: [
      { x: 355, y: 228 },
      { x: 225, y: 188 },
    ],
    checkpoints: [{ x: 608, y: 320 }],
  },

  // STAGE 4: The Orbital Gauntlet
  {
    id: 4,
    name: 'The Orbital Gauntlet',
    subtitle: 'Blistering counter-rotating orbs and twin plasma shafts.',
    spawn: { x: 65, y: 428 },
    portal: { x: 75, y: 104 },
    platforms: [
      ...BORDER_WALLS,
      // Lower long gauntlet floor
      { x: 30, y: 450, w: 900, h: 90 },
      // Corridor ceiling separating lower & upper decks
      { x: 150, y: 300, w: 540, h: 30, kind: 'wall' },
      // Wall-jump inner wall (90px shaft between x=840 and x=930)
      { x: 810, y: 150, w: 30, h: 215, kind: 'wall' },
      // Upper right landing
      { x: 690, y: 150, w: 120, h: 28 },
      // Upper left shard platform
      { x: 285, y: 150, w: 90, h: 28 },
      // Upper spike bed under crumble return
      { x: 180, y: 270, w: 510, h: 30 },
      // Exit ledge (top left)
      { x: 30, y: 150, w: 150, h: 28 },
    ],
    spikes: [
      { x: 180, y: 254, w: 510, h: 16, dir: 'up' },
      // Ceiling spikes in lower corridor
      { x: 240, y: 330, w: 60, h: 14, dir: 'down' },
      { x: 460, y: 330, w: 60, h: 14, dir: 'down' },
    ],
    saws: [
      { x1: 870, y1: 220, x2: 870, y2: 345, radius: 14, speed: 165, phaseOffset: 0 },
      { x1: 660, y1: 350, x2: 660, y2: 445, radius: 13, speed: 155, phaseOffset: 0.4 },
    ],
    lasers: [
      { x: 225, y: 30, dx: 0, dy: 1, length: 224, chargeTime: 0.42, activeTime: 0.5, cooldownTime: 0.72, phaseOffset: 0.2 },
      { x: 410, y: 30, dx: 0, dy: 1, length: 224, chargeTime: 0.42, activeTime: 0.5, cooldownTime: 0.72, phaseOffset: 0.92 },
    ],
    orbitals: [
      { cx: 255, cy: 392, orbitRadius: 42, orbRadius: 10, angularSpeed: 3.8, phaseOffset: 0 },
      { cx: 365, cy: 392, orbitRadius: 42, orbRadius: 10, angularSpeed: -3.8, phaseOffset: 1.57 },
      { cx: 475, cy: 392, orbitRadius: 42, orbRadius: 10, angularSpeed: 3.8, phaseOffset: 3.14 },
      { cx: 585, cy: 392, orbitRadius: 42, orbRadius: 10, angularSpeed: -3.8, phaseOffset: 4.71 },
      { cx: 330, cy: 112, orbitRadius: 38, orbRadius: 9, angularSpeed: -3.4, phaseOffset: 0.5 },
    ],
    crumbles: [
      { x: 565, y: 150, w: 60, h: 22 },
      { x: 440, y: 150, w: 60, h: 22 },
    ],
    shards: [
      { x: 365, y: 418 },
      { x: 585, y: 418 },
      { x: 330, y: 114 },
    ],
    checkpoints: [{ x: 750, y: 410 }],
  },

  // STAGE 5: Crimson Ascent
  {
    id: 5,
    name: 'Crimson Ascent',
    subtitle: 'Saw-lined wall chutes, crumble leaps, and rapid laser drops.',
    spawn: { x: 65, y: 458 },
    portal: { x: 870, y: 404 },
    platforms: [
      ...BORDER_WALLS,
      // Spawn floor
      { x: 30, y: 480, w: 150, h: 60 },
      // Bottom hazard bed
      { x: 180, y: 510, w: 570, h: 30 },
      // First step right
      { x: 240, y: 420, w: 90, h: 28 },
      // Wall-jump chute left & right walls (90px chute x=420..510)
      { x: 390, y: 210, w: 30, h: 210, kind: 'wall' },
      { x: 510, y: 180, w: 30, h: 270, kind: 'wall' },
      // Checkpoint top platform
      { x: 510, y: 180, w: 150, h: 28 },
      // Post-dash landing
      { x: 825, y: 180, w: 105, h: 28 },
      // Drop-down mid baffle
      { x: 720, y: 315, w: 90, h: 24 },
      // Exit platform bottom-right
      { x: 750, y: 450, w: 180, h: 90 },
    ],
    spikes: [
      { x: 180, y: 494, w: 570, h: 16, dir: 'up' },
      { x: 540, y: 208, w: 90, h: 14, dir: 'down' },
      { x: 720, y: 299, w: 30, h: 16, dir: 'up' },
    ],
    saws: [
      { x1: 210, y1: 345, x2: 210, y2: 475, radius: 15, speed: 205, phaseOffset: 0 },
      { x1: 465, y1: 220, x2: 465, y2: 395, radius: 13, speed: 175, phaseOffset: 0.7 },
    ],
    lasers: [
      // Right drop lasers
      { x: 930, y: 255, dx: -1, dy: 0, length: 180, chargeTime: 0.38, activeTime: 0.48, cooldownTime: 0.68, phaseOffset: 0 },
      { x: 930, y: 375, dx: -1, dy: 0, length: 180, chargeTime: 0.38, activeTime: 0.48, cooldownTime: 0.68, phaseOffset: 0.77 },
      // Upper chasm sweep
      { x: 540, y: 118, dx: 1, dy: 0, length: 285, chargeTime: 0.42, activeTime: 0.44, cooldownTime: 0.85, phaseOffset: 0.4 },
    ],
    orbitals: [
      { cx: 810, cy: 405, orbitRadius: 42, orbRadius: 10, angularSpeed: 3.9, phaseOffset: 0 },
    ],
    crumbles: [
      { x: 705, y: 180, w: 60, h: 22 },
    ],
    shards: [
      { x: 465, y: 295 },
      { x: 735, y: 140 },
      { x: 780, y: 278 },
    ],
    checkpoints: [{ x: 590, y: 140 }],
  },

  // STAGE 6: Omega Core
  {
    id: 6,
    name: 'Omega Core',
    subtitle: 'High-velocity saw gauntlets and tight plasma gates.',
    spawn: { x: 65, y: 428 },
    portal: { x: 68, y: 104 },
    platforms: [
      ...BORDER_WALLS,
      // Spawn
      { x: 30, y: 450, w: 120, h: 90 },
      // Bottom full spike bed
      { x: 150, y: 510, w: 780, h: 30 },
      // Checkpoint island
      { x: 495, y: 390, w: 120, h: 120 },
      // Right step before wall jump
      { x: 700, y: 330, w: 90, h: 28 },
      // Upper right wall-jump baffle (shaft x=840..930)
      { x: 810, y: 150, w: 30, h: 165, kind: 'wall' },
      // Upper right landing
      { x: 690, y: 150, w: 120, h: 28 },
      // Upper mid solid anchor
      { x: 540, y: 150, w: 90, h: 28 },
      // Upper shard platform
      { x: 165, y: 150, w: 75, h: 28 },
      // Upper hazard bed (prevents skipping below)
      { x: 180, y: 265, w: 480, h: 28 },
      // Exit platform (top left)
      { x: 30, y: 150, w: 90, h: 28 },
    ],
    spikes: [
      { x: 150, y: 494, w: 780, h: 16, dir: 'up' },
      { x: 180, y: 249, w: 480, h: 16, dir: 'up' },
    ],
    saws: [
      { x1: 550, y1: 150, x2: 620, y2: 150, radius: 14, speed: 195, phaseOffset: 0 },
      { x1: 142, y1: 85, x2: 142, y2: 230, radius: 14, speed: 230, phaseOffset: 0.4 },
      { x1: 295, y1: 355, x2: 295, y2: 475, radius: 14, speed: 170, phaseOffset: 0.3 },
    ],
    lasers: [
      { x: 305, y: 293, dx: 0, dy: 1, length: 201, chargeTime: 0.38, activeTime: 0.48, cooldownTime: 0.68, phaseOffset: 0 },
      { x: 365, y: 30, dx: 0, dy: 1, length: 219, chargeTime: 0.38, activeTime: 0.48, cooldownTime: 0.68, phaseOffset: 0.77 },
      { x: 660, y: 30, dx: 0, dy: 1, length: 220, chargeTime: 0.42, activeTime: 0.45, cooldownTime: 0.75, phaseOffset: 0.45 },
    ],
    orbitals: [
      { cx: 730, cy: 270, orbitRadius: 42, orbRadius: 10, angularSpeed: 4.1, phaseOffset: 0 },
      { cx: 435, cy: 365, orbitRadius: 36, orbRadius: 9, angularSpeed: -3.9, phaseOffset: 1.2 },
    ],
    crumbles: [
      { x: 205, y: 435, w: 60, h: 22 },
      { x: 350, y: 405, w: 60, h: 22 },
      { x: 405, y: 150, w: 60, h: 22 },
      { x: 270, y: 150, w: 60, h: 22 },
    ],
    shards: [
      { x: 435, y: 335 },
      { x: 750, y: 114 },
      { x: 202, y: 114 },
    ],
    checkpoints: [{ x: 555, y: 350 }],
  },

  // STAGE 7: Abyssal Pendulum
  {
    id: 7,
    name: 'Abyssal Pendulum',
    subtitle: 'Chain crumbling hops across razor pendulums and laser chimneys.',
    spawn: { x: 65, y: 428 },
    portal: { x: 75, y: 104 },
    platforms: [
      ...BORDER_WALLS,
      // Spawn floor
      { x: 30, y: 450, w: 120, h: 90 },
      // Full lower spike pit
      { x: 150, y: 510, w: 780, h: 30 },
      // Checkpoint island
      { x: 555, y: 390, w: 75, h: 120 },
      // Wall-jump inner wall (95px shaft between x=835 and x=930)
      { x: 805, y: 165, w: 30, h: 195, kind: 'wall' },
      // Upper right landing
      { x: 690, y: 150, w: 115, h: 28 },
      // Upper spike bed separating lower & upper lanes
      { x: 210, y: 270, w: 450, h: 28 },
      // Exit platform (top left)
      { x: 30, y: 150, w: 150, h: 28 },
    ],
    spikes: [
      { x: 150, y: 494, w: 780, h: 16, dir: 'up' },
      { x: 210, y: 254, w: 450, h: 16, dir: 'up' },
    ],
    saws: [
      { x1: 280, y1: 310, x2: 280, y2: 470, radius: 15, speed: 205, phaseOffset: 0 },
      { x1: 400, y1: 310, x2: 400, y2: 470, radius: 15, speed: 205, phaseOffset: 0.5 },
      { x1: 882, y1: 195, x2: 882, y2: 345, radius: 13, speed: 175, phaseOffset: 0.2 },
    ],
    lasers: [
      { x: 525, y: 30, dx: 0, dy: 1, length: 464, chargeTime: 0.4, activeTime: 0.46, cooldownTime: 0.7, phaseOffset: 0 },
      { x: 505, y: 30, dx: 0, dy: 1, length: 224, chargeTime: 0.38, activeTime: 0.45, cooldownTime: 0.68, phaseOffset: 0.3 },
      { x: 375, y: 30, dx: 0, dy: 1, length: 224, chargeTime: 0.38, activeTime: 0.45, cooldownTime: 0.68, phaseOffset: 1.0 },
    ],
    orbitals: [
      { cx: 430, cy: 118, orbitRadius: 38, orbRadius: 9, angularSpeed: -3.8, phaseOffset: 0.6 },
    ],
    crumbles: [
      { x: 195, y: 425, w: 60, h: 22 },
      { x: 315, y: 390, w: 60, h: 22 },
      { x: 435, y: 425, w: 60, h: 22 },
      { x: 560, y: 150, w: 60, h: 22 },
      { x: 430, y: 150, w: 60, h: 22 },
      { x: 300, y: 150, w: 60, h: 22 },
    ],
    shards: [
      { x: 700, y: 315 },
      { x: 460, y: 114 },
      { x: 205, y: 114 },
    ],
    checkpoints: [{ x: 592, y: 350 }],
  },

  // STAGE 8: Absolute Zero
  {
    id: 8,
    name: 'Absolute Zero',
    subtitle: 'Final protocol: mid-air shard dash chains and zero margin for error.',
    spawn: { x: 65, y: 458 },
    portal: { x: 70, y: 104 },
    platforms: [
      ...BORDER_WALLS,
      // Narrow spawn floor
      { x: 30, y: 480, w: 105, h: 60 },
      // Full lower spike bed
      { x: 135, y: 510, w: 795, h: 30 },
      // Checkpoint island
      { x: 510, y: 390, w: 90, h: 120 },
      // Narrow right step
      { x: 675, y: 340, w: 60, h: 24 },
      // Wall-jump inner wall (95px shaft between x=835 and x=930)
      { x: 805, y: 150, w: 30, h: 210, kind: 'wall' },
      // Upper right landing
      { x: 690, y: 150, w: 115, h: 28 },
      // Upper mid solid anchor
      { x: 390, y: 150, w: 60, h: 28 },
      // Upper spike bed
      { x: 165, y: 270, w: 495, h: 28 },
      // Exit ledge (top left)
      { x: 30, y: 150, w: 105, h: 28 },
    ],
    spikes: [
      { x: 135, y: 494, w: 795, h: 16, dir: 'up' },
      { x: 165, y: 254, w: 495, h: 16, dir: 'up' },
    ],
    saws: [
      { x1: 200, y1: 350, x2: 430, y2: 350, radius: 14, speed: 210, phaseOffset: 0 },
      { x1: 882, y1: 185, x2: 882, y2: 260, radius: 13, speed: 175, phaseOffset: 0 },
      { x1: 882, y1: 285, x2: 882, y2: 365, radius: 13, speed: 175, phaseOffset: 0.5 },
      { x1: 155, y1: 95, x2: 155, y2: 225, radius: 14, speed: 235, phaseOffset: 0.25 },
    ],
    lasers: [
      { x: 270, y: 298, dx: 0, dy: 1, length: 196, chargeTime: 0.36, activeTime: 0.46, cooldownTime: 0.66, phaseOffset: 0 },
      { x: 475, y: 298, dx: 0, dy: 1, length: 196, chargeTime: 0.36, activeTime: 0.46, cooldownTime: 0.66, phaseOffset: 0.72 },
      { x: 465, y: 30, dx: 0, dy: 1, length: 224, chargeTime: 0.36, activeTime: 0.46, cooldownTime: 0.66, phaseOffset: 0.25 },
      { x: 300, y: 30, dx: 0, dy: 1, length: 224, chargeTime: 0.36, activeTime: 0.46, cooldownTime: 0.66, phaseOffset: 0.95 },
    ],
    orbitals: [
      { cx: 705, cy: 295, orbitRadius: 42, orbRadius: 10, angularSpeed: 4.0, phaseOffset: 0 },
      { cx: 420, cy: 115, orbitRadius: 36, orbRadius: 9, angularSpeed: -4.2, phaseOffset: 1.0 },
    ],
    crumbles: [
      { x: 185, y: 440, w: 60, h: 22 },
      { x: 390, y: 420, w: 60, h: 22 },
      { x: 525, y: 150, w: 60, h: 22 },
      { x: 225, y: 150, w: 60, h: 22 },
    ],
    shards: [
      { x: 305, y: 395 },
      { x: 615, y: 115 },
      { x: 315, y: 115 },
    ],
    checkpoints: [{ x: 555, y: 350 }],
  },
];
