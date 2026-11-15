import { LEVELS, WORLD_HEIGHT, WORLD_WIDTH } from './levels';
import type {
  CrumbleState,
  HazardKind,
  InputState,
  LaserEmitter,
  LevelDef,
  OrbitalSentry,
  Particle,
  PlayerState,
  Rect,
  RunMode,
  Sawblade,
  SimulationState,
} from './types';

export const PLAYER_W = 18;
export const PLAYER_H = 22;
export const MAX_PARTICLES = 180;
export const CHALLENGE_STARTING_LIVES = 5;
export const CHALLENGE_STAGE_BONUS_LIVES = 1;

export const PHYSICS = {
  gravityRise: 1450,
  gravityFall: 1780,
  maxFallSpeed: 640,
  wallSlideSpeed: 135,
  moveSpeed: 245,
  groundAccel: 2600,
  groundDecel: 3000,
  airAccel: 1750,
  airDecel: 1200,
  jumpSpeed: -515,
  wallJumpVx: 270,
  wallJumpVy: -495,
  wallJumpLock: 0.12,
  coyoteTime: 0.075,
  jumpBuffer: 0.105,
  dashSpeed: 560,
  dashDuration: 0.14,
  dashCooldown: 0.2,
  crumbleWarningTime: 0.26,
  crumbleRespawnTime: 1.85,
  respawnDelay: 0.3,
  defeatDelay: 0.45,
  impactShakeDuration: 0.34,
} as const;

export function createParticlePool(): Particle[] {
  const pool: Particle[] = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    pool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 3,
      life: 0,
      maxLife: 0.4,
      color: '#f8fafc',
      gravity: 0,
    });
  }
  return pool;
}

export function spawnParticles(
  state: SimulationState,
  x: number,
  y: number,
  count: number,
  color: string,
  speedMin: number,
  speedMax: number,
  lifeMin: number,
  lifeMax: number,
  size: number,
  gravity: number,
  spreadAngle = Math.PI * 2,
  baseAngle = 0
): void {
  for (let i = 0; i < count; i++) {
    const p = state.particles[state.particleCursor];
    state.particleCursor = (state.particleCursor + 1) % MAX_PARTICLES;
    const t1 = ((i * 73 + Math.round(state.totalTime * 1000)) % 97) / 97;
    const t2 = ((i * 37 + Math.round(x + y)) % 89) / 89;
    const angle = baseAngle + (t1 - 0.5) * spreadAngle;
    const speed = speedMin + t2 * (speedMax - speedMin);
    const maxLife = lifeMin + t1 * (lifeMax - lifeMin);
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.size = size;
    p.life = maxLife;
    p.maxLife = maxLife;
    p.color = color;
    p.gravity = gravity;
  }
}

export function createPlayer(x: number, y: number): PlayerState {
  const scarf = Array.from({ length: 5 }, (_, idx) => ({
    x: x + PLAYER_W / 2 - idx * 3,
    y: y + 7,
  }));
  return {
    x,
    y,
    w: PLAYER_W,
    h: PLAYER_H,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    onWall: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    wallJumpLockTimer: 0,
    dashTimer: 0,
    dashCooldown: 0,
    canDash: true,
    scaleX: 1,
    scaleY: 1,
    walkDistance: 0,
    dead: false,
    respawnTimer: 0,
    invulnTimer: 0.4,
    scarf,
    afterimages: [],
  };
}

export function createSimulationState(
  levelIndex = 0,
  mode: RunMode = 'challenge',
  phase: SimulationState['phase'] = 'title',
  customLevel: LevelDef | null = null
): SimulationState {
  const safeIndex = Math.max(0, Math.min(LEVELS.length - 1, levelIndex));
  const level = customLevel ?? LEVELS[safeIndex];
  const maxLives = mode === 'challenge' ? CHALLENGE_STARTING_LIVES : 999;

  return {
    phase,
    outcome: 'none',
    mode,
    levelIndex: safeIndex,
    customLevel,
    levelTime: 0,
    totalTime: 0,
    deaths: 0,
    stageDeaths: 0,
    lives: maxLives,
    maxLives,
    hitstopTimer: 0,
    trauma: 0,
    flashTimer: 0,
    lastDeathCause: null,
    impactShakeTimer: 0,
    shakeClock: 0,
    activeSpawn: { x: level.spawn.x, y: level.spawn.y },
    portalOpen: level.shards.length === 0,
    player: createPlayer(level.spawn.x, level.spawn.y),
    crumbles: level.crumbles.map((c) => ({
      ...c,
      status: 'solid',
      timer: 0,
    })),
    shards: level.shards.map((s) => ({ ...s, collected: false })),
    checkpoints: level.checkpoints.map((cp) => ({ ...cp, activated: false })),
    particles: createParticlePool(),
    particleCursor: 0,
    prevLaserActive: level.lasers.map(() => false),
    events: [],
  };
}

export function loadLevelIntoState(state: SimulationState, levelIndex: number): void {
  const safeIndex = Math.max(0, Math.min(LEVELS.length - 1, levelIndex));
  const level = state.customLevel ?? LEVELS[safeIndex];
  state.levelIndex = safeIndex;
  state.levelTime = 0;
  state.stageDeaths = 0;
  state.activeSpawn = { x: level.spawn.x, y: level.spawn.y };
  state.portalOpen = level.shards.length === 0;
  state.player = createPlayer(level.spawn.x, level.spawn.y);
  state.crumbles = level.crumbles.map((c) => ({
    ...c,
    status: 'solid',
    timer: 0,
  }));
  state.shards = level.shards.map((s) => ({ ...s, collected: false }));
  state.checkpoints = level.checkpoints.map((cp) => ({ ...cp, activated: false }));
  state.prevLaserActive = level.lasers.map(() => false);
  state.hitstopTimer = 0;
  state.trauma = 0;
  state.flashTimer = 0;
  state.lastDeathCause = null;
  state.impactShakeTimer = 0;
}

export function getSawPosition(saw: Sawblade, time: number): { x: number; y: number } {
  const dx = saw.x2 - saw.x1;
  const dy = saw.y2 - saw.y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.001) return { x: saw.x1, y: saw.y1 };
  const period = (dist * 2) / saw.speed;
  const phase = ((time / period + (saw.phaseOffset ?? 0)) % 1 + 1) % 1;
  const pingPong = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  // Smooth ease-in-out slightly at turnaround endpoints for crisp readable timing
  const eased = 0.5 - 0.5 * Math.cos(pingPong * Math.PI);
  return {
    x: saw.x1 + dx * eased,
    y: saw.y1 + dy * eased,
  };
}

export function getOrbitalPosition(orb: OrbitalSentry, time: number): { x: number; y: number } {
  const angle = time * orb.angularSpeed + (orb.phaseOffset ?? 0);
  return {
    x: orb.cx + Math.cos(angle) * orb.orbitRadius,
    y: orb.cy + Math.sin(angle) * orb.orbitRadius,
  };
}

export function getLaserStatus(
  laser: LaserEmitter,
  time: number
): { state: 'cooldown' | 'charging' | 'active'; progress: number } {
  const total = laser.chargeTime + laser.activeTime + laser.cooldownTime;
  const t = ((time + (laser.phaseOffset ?? 0)) % total + total) % total;
  if (t < laser.chargeTime) {
    return { state: 'charging', progress: t / laser.chargeTime };
  }
  if (t < laser.chargeTime + laser.activeTime) {
    return {
      state: 'active',
      progress: (t - laser.chargeTime) / laser.activeTime,
    };
  }
  return {
    state: 'cooldown',
    progress: (t - laser.chargeTime - laser.activeTime) / laser.cooldownTime,
  };
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function circleIntersectsRect(cx: number, cy: number, r: number, rect: Rect): boolean {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

function getSolidRects(level: LevelDef, crumbles: CrumbleState[]): Rect[] {
  const solids: Rect[] = [...level.platforms];
  for (const c of crumbles) {
    if (c.status !== 'broken') {
      solids.push(c);
    }
  }
  return solids;
}

function updateParticles(state: SimulationState, dt: number): void {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = state.particles[i];
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

function updateScarf(player: PlayerState, dt: number): void {
  const anchorX = player.x + player.w / 2 - player.facing * 4;
  const anchorY = player.y + 8;
  player.scarf[0].x = anchorX;
  player.scarf[0].y = anchorY;
  const followRate = Math.min(1, dt * 24);
  for (let i = 1; i < player.scarf.length; i++) {
    const prev = player.scarf[i - 1];
    const curr = player.scarf[i];
    const targetX = prev.x - player.facing * 3.5;
    const targetY = prev.y + 1.1;
    curr.x += (targetX - curr.x) * followRate;
    curr.y += (targetY - curr.y) * followRate;
  }

  for (let i = player.afterimages.length - 1; i >= 0; i--) {
    player.afterimages[i].alpha -= dt * 4.5;
    if (player.afterimages[i].alpha <= 0) {
      player.afterimages.splice(i, 1);
    }
  }
}

function killPlayer(state: SimulationState, cause: HazardKind): void {
  const p = state.player;
  if (p.dead || state.phase !== 'playing') return;
  p.dead = true;
  p.vx = 0;
  p.vy = 0;
  state.deaths += 1;
  state.stageDeaths += 1;
  state.lastDeathCause = cause;

  if (state.mode === 'challenge') {
    state.lives = Math.max(0, state.lives - 1);
    p.respawnTimer = state.lives <= 0 ? PHYSICS.defeatDelay : PHYSICS.respawnDelay;
  } else {
    p.respawnTimer = PHYSICS.respawnDelay;
  }

  const isSharpImpact = cause === 'saw' || cause === 'spike';
  state.hitstopTimer = isSharpImpact ? 0.08 : 0.06;
  state.trauma = isSharpImpact ? 1.0 : 0.72;
  state.impactShakeTimer = isSharpImpact ? PHYSICS.impactShakeDuration : 0;
  state.flashTimer = isSharpImpact ? 0.13 : 0.09;

  spawnParticles(
    state,
    p.x + p.w / 2,
    p.y + p.h / 2,
    isSharpImpact ? 34 : 24,
    '#ef4444',
    100,
    isSharpImpact ? 380 : 310,
    0.25,
    0.58,
    4,
    580
  );
  spawnParticles(
    state,
    p.x + p.w / 2,
    p.y + p.h / 2,
    isSharpImpact ? 16 : 10,
    isSharpImpact ? '#fef2f2' : '#38bdf8',
    80,
    290,
    0.18,
    0.45,
    3,
    460
  );
  state.events.push({ type: 'death', x: p.x + p.w / 2, y: p.y + p.h / 2, cause });
}

function respawnPlayer(state: SimulationState): void {
  const fresh = createPlayer(state.activeSpawn.x, state.activeSpawn.y);
  state.player = fresh;
  for (const c of state.crumbles) {
    c.status = 'solid';
    c.timer = 0;
  }
  spawnParticles(
    state,
    fresh.x + fresh.w / 2,
    fresh.y + fresh.h / 2,
    10,
    '#38bdf8',
    40,
    130,
    0.18,
    0.35,
    3,
    -60
  );
}

export function getHazardCollisionCause(
  playerRect: Rect,
  level: LevelDef,
  time: number
): HazardKind | null {
  // Out of bounds pit fall
  if (playerRect.y > WORLD_HEIGHT + 12) return 'pit';

  // Spikes (razor-tight 2px inset for unforgiving pixel precision)
  for (const s of level.spikes) {
    const spikeBox: Rect =
      s.dir === 'up' || s.dir === 'down'
        ? { x: s.x + 2, y: s.y + 2, w: Math.max(4, s.w - 4), h: Math.max(4, s.h - 2) }
        : { x: s.x + 2, y: s.y + 2, w: Math.max(4, s.w - 2), h: Math.max(4, s.h - 4) };
    if (rectsOverlap(playerRect, spikeBox)) return 'spike';
  }

  // Sawblades
  for (const saw of level.saws) {
    const pos = getSawPosition(saw, time);
    if (circleIntersectsRect(pos.x, pos.y, saw.radius * 0.88, playerRect)) {
      return 'saw';
    }
  }

  // Orbital sentries
  for (const orb of level.orbitals) {
    const pos = getOrbitalPosition(orb, time);
    if (circleIntersectsRect(pos.x, pos.y, orb.orbRadius * 0.9, playerRect)) {
      return 'orbital';
    }
  }

  // Active lasers
  for (const laser of level.lasers) {
    const status = getLaserStatus(laser, time);
    if (status.state !== 'active') continue;
    const beamThick = 8;
    const endX = laser.x + laser.dx * laser.length;
    const endY = laser.y + laser.dy * laser.length;
    const minX = Math.min(laser.x, endX) - (laser.dy !== 0 ? beamThick / 2 : 0);
    const minY = Math.min(laser.y, endY) - (laser.dx !== 0 ? beamThick / 2 : 0);
    const w = Math.abs(endX - laser.x) || beamThick;
    const h = Math.abs(endY - laser.y) || beamThick;
    if (rectsOverlap(playerRect, { x: minX, y: minY, w, h })) {
      return 'laser';
    }
  }

  return null;
}

export function checkHazardCollisions(
  playerRect: Rect,
  level: LevelDef,
  time: number
): boolean {
  return getHazardCollisionCause(playerRect, level, time) !== null;
}

export function stepSimulation(
  state: SimulationState,
  input: InputState,
  rawDt: number
): void {
  state.events.length = 0;
  const dt = Math.min(rawDt, 0.05);
  if (dt <= 0) return;

  // Ambient title mode: advance world clocks & scarf smoothly while keeping player safe
  if (state.phase === 'title') {
    state.totalTime += dt;
    state.levelTime += dt;
    updateParticles(state, dt);
    updateScarf(state.player, dt);
    return;
  }

  if (state.phase !== 'playing') {
    return;
  }

  // Decay visual feedback & advance shake clock in real dt even during hitstop freeze
  state.shakeClock += dt;
  state.trauma = Math.max(0, state.trauma - dt * 2.2);
  state.impactShakeTimer = Math.max(0, state.impactShakeTimer - dt);
  state.flashTimer = Math.max(0, state.flashTimer - dt);
  updateParticles(state, dt);

  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    return;
  }

  state.totalTime += dt;
  state.levelTime += dt;

  const level = state.customLevel ?? LEVELS[state.levelIndex];
  const p = state.player;

  // Check laser activation sound events
  for (let i = 0; i < level.lasers.length; i++) {
    const active = getLaserStatus(level.lasers[i], state.levelTime).state === 'active';
    if (active && !state.prevLaserActive[i]) {
      state.events.push({ type: 'laser_fire', x: level.lasers[i].x, y: level.lasers[i].y });
    }
    state.prevLaserActive[i] = active;
  }

  // Handle death respawn countdown
  if (p.dead) {
    p.respawnTimer -= dt;
    if (p.respawnTimer <= 0) {
      if (state.mode === 'challenge' && state.lives <= 0) {
        state.phase = 'gameover';
        state.outcome = 'defeat';
        state.events.push({ type: 'defeat' });
      } else {
        respawnPlayer(state);
      }
    }
    return;
  }

  if (p.invulnTimer > 0) {
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
  }

  // Update crumbling platforms
  for (const c of state.crumbles) {
    if (c.status === 'shaking') {
      c.timer -= dt;
      if (c.timer <= 0) {
        c.status = 'broken';
        c.timer = PHYSICS.crumbleRespawnTime;
        spawnParticles(
          state,
          c.x + c.w / 2,
          c.y + c.h / 2,
          10,
          '#94a3b8',
          40,
          140,
          0.2,
          0.4,
          4,
          450
        );
        state.events.push({ type: 'crumble', x: c.x + c.w / 2, y: c.y });
      }
    } else if (c.status === 'broken') {
      c.timer -= dt;
      if (c.timer <= 0) {
        // Ensure player isn't trapped inside respawning block
        if (!rectsOverlap(p, c)) {
          c.status = 'solid';
          c.timer = 0;
        } else {
          c.timer = 0.1;
        }
      }
    }
  }

  // Timers & buffered inputs
  if (p.coyoteTimer > 0) p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
  if (p.jumpBufferTimer > 0) p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
  if (p.wallJumpLockTimer > 0) p.wallJumpLockTimer = Math.max(0, p.wallJumpLockTimer - dt);
  if (p.dashCooldown > 0) p.dashCooldown = Math.max(0, p.dashCooldown - dt);

  if (input.jumpJustPressed) {
    p.jumpBufferTimer = PHYSICS.jumpBuffer;
  }

  const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (moveDir !== 0 && p.wallJumpLockTimer <= 0 && p.dashTimer <= 0) {
    p.facing = moveDir as 1 | -1;
  }

  // Dash initiation
  if (input.dashJustPressed && p.canDash && p.dashCooldown <= 0 && p.dashTimer <= 0) {
    let dx = moveDir;
    let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    if (dx === 0 && dy === 0) {
      dx = p.facing;
    }
    const len = Math.hypot(dx, dy) || 1;
    p.vx = (dx / len) * PHYSICS.dashSpeed;
    p.vy = (dy / len) * PHYSICS.dashSpeed;
    p.dashTimer = PHYSICS.dashDuration;
    p.dashCooldown = PHYSICS.dashCooldown;
    p.canDash = false;
    p.scaleX = Math.abs(dx) > Math.abs(dy) ? 1.32 : 0.76;
    p.scaleY = Math.abs(dx) > Math.abs(dy) ? 0.74 : 1.28;
    state.trauma = Math.max(state.trauma, 0.2);
    spawnParticles(
      state,
      p.x + p.w / 2,
      p.y + p.h / 2,
      10,
      '#38bdf8',
      50,
      180,
      0.15,
      0.3,
      3,
      0
    );
    state.events.push({ type: 'dash', x: p.x + p.w / 2, y: p.y + p.h / 2 });
  }

  // Active dash vs standard physics
  if (p.dashTimer > 0) {
    p.dashTimer = Math.max(0, p.dashTimer - dt);
    if (Math.floor(state.levelTime * 60) % 2 === 0) {
      p.afterimages.push({ x: p.x, y: p.y, facing: p.facing, alpha: 0.65 });
    }
    if (p.dashTimer <= 0) {
      p.vx *= 0.55;
      p.vy *= 0.55;
    }
  } else {
    // Horizontal acceleration
    if (p.wallJumpLockTimer <= 0) {
      const targetVx = moveDir * PHYSICS.moveSpeed;
      const accel = p.onGround
        ? moveDir !== 0
          ? PHYSICS.groundAccel
          : PHYSICS.groundDecel
        : moveDir !== 0
          ? PHYSICS.airAccel
          : PHYSICS.airDecel;
      if (p.vx < targetVx) {
        p.vx = Math.min(targetVx, p.vx + accel * dt);
      } else if (p.vx > targetVx) {
        p.vx = Math.max(targetVx, p.vx - accel * dt);
      }
    }

    // Variable jump cut
    if (input.jumpJustReleased && p.vy < 0) {
      p.vy *= 0.45;
    }

    // Jump / Wall Jump execution
    if (p.jumpBufferTimer > 0) {
      if (p.coyoteTimer > 0) {
        p.vy = PHYSICS.jumpSpeed;
        p.onGround = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        p.scaleX = 0.78;
        p.scaleY = 1.24;
        spawnParticles(state, p.x + p.w / 2, p.y + p.h, 5, '#94a3b8', 30, 95, 0.14, 0.26, 2.5, 120, Math.PI, -Math.PI / 2);
        state.events.push({ type: 'jump', x: p.x + p.w / 2, y: p.y + p.h });
      } else if (p.onWall !== 0) {
        p.vx = -p.onWall * PHYSICS.wallJumpVx;
        p.vy = PHYSICS.wallJumpVy;
        p.facing = (-p.onWall) as 1 | -1;
        p.wallJumpLockTimer = PHYSICS.wallJumpLock;
        p.jumpBufferTimer = 0;
        p.canDash = true;
        p.scaleX = 0.8;
        p.scaleY = 1.22;
        spawnParticles(
          state,
          p.onWall === 1 ? p.x + p.w : p.x,
          p.y + p.h / 2,
          6,
          '#cbd5e1',
          40,
          120,
          0.14,
          0.26,
          2.5,
          140
        );
        state.events.push({ type: 'jump', x: p.x + p.w / 2, y: p.y + p.h / 2 });
      }
    }

    // Gravity + Wall Slide
    const grav = p.vy < 0 ? PHYSICS.gravityRise : PHYSICS.gravityFall;
    p.vy = Math.min(PHYSICS.maxFallSpeed, p.vy + grav * dt);
    if (!p.onGround && p.onWall !== 0 && p.vy > PHYSICS.wallSlideSpeed && moveDir === p.onWall) {
      p.vy = PHYSICS.wallSlideSpeed;
    }
  }

  // Sub-stepped AABB resolution to prevent tunneling
  const solids = getSolidRects(level, state.crumbles);
  const totalMove = Math.max(Math.abs(p.vx * dt), Math.abs(p.vy * dt));
  const steps = Math.max(1, Math.ceil(totalMove / 5));
  const stepDt = dt / steps;
  const wasOnGround = p.onGround;
  let landed = false;

  for (let s = 0; s < steps; s++) {
    // Move X
    p.x += p.vx * stepDt;
    if (p.x < 30) {
      p.x = 30;
      p.vx = 0;
    } else if (p.x + p.w > WORLD_WIDTH - 30) {
      p.x = WORLD_WIDTH - 30 - p.w;
      p.vx = 0;
    }
    for (const solid of solids) {
      if (rectsOverlap(p, solid)) {
        if (p.vx > 0) {
          p.x = solid.x - p.w;
          p.vx = 0;
        } else if (p.vx < 0) {
          p.x = solid.x + solid.w;
          p.vx = 0;
        }
      }
    }

    // Move Y
    p.y += p.vy * stepDt;
    for (const solid of solids) {
      if (rectsOverlap(p, solid)) {
        if (p.vy > 0) {
          p.y = solid.y - p.h;
          if (!wasOnGround && p.vy > 140) {
            landed = true;
          }
          p.vy = 0;
        } else if (p.vy < 0) {
          p.y = solid.y + solid.h;
          p.vy = 0;
        }
      }
    }
  }

  // Ground & Wall probes
  const footProbe: Rect = { x: p.x + 1, y: p.y + p.h, w: p.w - 2, h: 2 };
  p.onGround = false;
  for (const solid of solids) {
    if (rectsOverlap(footProbe, solid)) {
      p.onGround = true;
      break;
    }
  }

  // Trigger crumble tiles when stood on
  if (p.onGround) {
    p.coyoteTimer = PHYSICS.coyoteTime;
    p.canDash = true;
    for (const c of state.crumbles) {
      if (c.status === 'solid' && rectsOverlap(footProbe, c)) {
        c.status = 'shaking';
        c.timer = PHYSICS.crumbleWarningTime;
      }
    }
  }

  if (landed && p.onGround) {
    p.scaleX = 1.24;
    p.scaleY = 0.78;
    spawnParticles(state, p.x + p.w / 2, p.y + p.h, 4, '#64748b', 25, 80, 0.12, 0.22, 2.5, 160);
    state.events.push({ type: 'land', x: p.x + p.w / 2, y: p.y + p.h });
  }

  // Wall probe (1.5px left & right)
  p.onWall = 0;
  const rightProbe: Rect = { x: p.x + p.w, y: p.y + 3, w: 2, h: p.h - 6 };
  const leftProbe: Rect = { x: p.x - 2, y: p.y + 3, w: 2, h: p.h - 6 };
  for (const solid of solids) {
    if (rectsOverlap(rightProbe, solid)) {
      p.onWall = 1;
      break;
    }
    if (rectsOverlap(leftProbe, solid)) {
      p.onWall = -1;
      break;
    }
  }

  // Distance-synced walk cycle + squash/stretch recovery
  if (p.onGround) {
    p.walkDistance += Math.abs(p.vx) * dt;
  }
  const damp = Math.min(1, dt * 16);
  p.scaleX += (1 - p.scaleX) * damp;
  p.scaleY += (1 - p.scaleY) * damp;
  updateScarf(p, dt);

  // Collect Shards
  for (const shard of state.shards) {
    if (shard.collected) continue;
    if (circleIntersectsRect(shard.x, shard.y, 13, p)) {
      shard.collected = true;
      p.canDash = true; // Mid-air shard grants fresh dash!
      state.hitstopTimer = 0.03;
      spawnParticles(state, shard.x, shard.y, 14, '#fbbf24', 55, 190, 0.2, 0.45, 3.5, 120);
      state.events.push({ type: 'shard', x: shard.x, y: shard.y });
      if (state.shards.every((s) => s.collected) && !state.portalOpen) {
        state.portalOpen = true;
        state.events.push({ type: 'portal_open', x: level.portal.x, y: level.portal.y });
      }
    }
  }

  // Activate Checkpoints
  for (const cp of state.checkpoints) {
    if (cp.activated) continue;
    const cpRect: Rect = { x: cp.x - 10, y: cp.y - 4, w: 20, h: 44 };
    if (rectsOverlap(p, cpRect)) {
      cp.activated = true;
      state.activeSpawn = { x: cp.x - PLAYER_W / 2, y: cp.y + 18 };
      spawnParticles(state, cp.x, cp.y + 10, 12, '#10b981', 40, 140, 0.2, 0.4, 3, -80);
      state.events.push({ type: 'checkpoint', x: cp.x, y: cp.y });
    }
  }

  // Check Hazards
  const hazardCause = getHazardCollisionCause(p, level, state.levelTime);
  if (hazardCause !== null) {
    killPlayer(state, hazardCause);
    return;
  }

  // Check Exit Portal
  if (state.portalOpen) {
    const portalRect: Rect = {
      x: level.portal.x - 14,
      y: level.portal.y - 20,
      w: 28,
      h: 44,
    };
    if (rectsOverlap(p, portalRect)) {
      spawnParticles(
        state,
        level.portal.x,
        level.portal.y,
        24,
        '#10b981',
        60,
        240,
        0.25,
        0.55,
        3.5,
        -60
      );
      if (state.customLevel || state.levelIndex >= LEVELS.length - 1) {
        state.phase = 'gameover';
        state.outcome = 'victory';
        state.events.push({ type: 'victory', x: level.portal.x, y: level.portal.y });
      } else {
        if (state.mode === 'challenge') {
          state.lives = Math.min(10, state.lives + CHALLENGE_STAGE_BONUS_LIVES);
        }
        state.events.push({ type: 'stage_clear', x: level.portal.x, y: level.portal.y });
        loadLevelIntoState(state, state.levelIndex + 1);
      }
    }
  }
}
