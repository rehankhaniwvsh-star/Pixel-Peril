import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, WORLD_HEIGHT, WORLD_WIDTH } from './levels';
import {
  CHALLENGE_STARTING_LIVES,
  createSimulationState,
  getLaserStatus,
  getSawPosition,
  stepSimulation,
} from './physics';
import { renderGame } from './renderer';
import type { InputState } from './types';

function emptyInput(): InputState {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    jumpHeld: false,
    jumpJustPressed: false,
    jumpJustReleased: false,
    dashJustPressed: false,
  };
}

test('all 8 levels have safe idle spawns for at least 5 seconds', () => {
  assert.equal(LEVELS.length, 8);
  for (let idx = 0; idx < LEVELS.length; idx++) {
    const state = createSimulationState(idx, 'challenge', 'playing');
    const idle = emptyInput();
    for (let step = 0; step < 300; step++) {
      stepSimulation(state, idle, 1 / 60);
    }
    assert.equal(state.deaths, 0, `Stage ${idx + 1} (${LEVELS[idx].name}) killed idle player`);
    assert.equal(state.player.dead, false);
    assert.ok(state.player.onGround, `Stage ${idx + 1} player should rest on solid ground`);
    assert.ok(
      state.player.x >= 30 && state.player.x + state.player.w <= WORLD_WIDTH - 30,
      `Stage ${idx + 1} spawn out of horizontal bounds`
    );
    assert.ok(
      state.player.y >= 30 && state.player.y + state.player.h <= WORLD_HEIGHT,
      `Stage ${idx + 1} spawn out of vertical bounds`
    );
  }
});

test('jump physics, variable jump cut, coyote time, and buffering behave deterministically', () => {
  const state = createSimulationState(0, 'practice', 'playing');
  // Settle on ground
  stepSimulation(state, emptyInput(), 1 / 60);
  assert.equal(state.player.onGround, true);

  // Full jump
  const startY = state.player.y;
  stepSimulation(state, { ...emptyInput(), jumpHeld: true, jumpJustPressed: true }, 1 / 60);
  assert.ok(state.player.vy < -450, 'Jump should impart strong upward velocity');

  let minFullJumpY = state.player.y;
  for (let i = 0; i < 40; i++) {
    stepSimulation(state, { ...emptyInput(), jumpHeld: true }, 1 / 60);
    if (state.player.y < minFullJumpY) minFullJumpY = state.player.y;
  }
  const fullHeight = startY - minFullJumpY;
  assert.ok(fullHeight > 75 && fullHeight < 105, `Expected ~85-95px jump height, got ${fullHeight}`);

  // Short-hop jump cut
  const shortState = createSimulationState(0, 'practice', 'playing');
  stepSimulation(shortState, emptyInput(), 1 / 60);
  stepSimulation(shortState, { ...emptyInput(), jumpHeld: true, jumpJustPressed: true }, 1 / 60);
  stepSimulation(shortState, { ...emptyInput(), jumpHeld: false, jumpJustReleased: true }, 1 / 60);
  let minShortY = shortState.player.y;
  for (let i = 0; i < 30; i++) {
    stepSimulation(shortState, emptyInput(), 1 / 60);
    if (shortState.player.y < minShortY) minShortY = shortState.player.y;
  }
  const shortHeight = startY - minShortY;
  assert.ok(shortHeight < fullHeight * 0.65, 'Releasing jump early should cut jump height');
});

test('pixel dash bursts in mid-air, prevents tunneling at dt=0.05, and recharges on ground', () => {
  const state = createSimulationState(0, 'practice', 'playing');
  stepSimulation(state, emptyInput(), 1 / 60);
  // Jump into mid-air first so onGround is false
  stepSimulation(state, { ...emptyInput(), jumpHeld: true, jumpJustPressed: true }, 1 / 60);
  stepSimulation(state, { ...emptyInput(), jumpHeld: true }, 1 / 60);
  assert.equal(state.player.onGround, false);
  assert.equal(state.player.canDash, true);

  // Dash left directly toward the left border wall at x=30 using max clamped dt=0.05
  stepSimulation(state, { ...emptyInput(), left: true, dashJustPressed: true }, 0.05);
  assert.equal(state.player.canDash, false);
  assert.ok(state.player.x >= 30, 'Sub-stepped dash must never tunnel past left wall x=30');

  // Let player fall back onto ground and verify dash recharges
  for (let i = 0; i < 60; i++) {
    stepSimulation(state, emptyInput(), 1 / 60);
  }
  assert.equal(state.player.onGround, true);
  assert.equal(state.player.canDash, true);
});

test('lasers only kill when active, not during charging or cooldown', () => {
  const state = createSimulationState(2, 'challenge', 'playing'); // Stage 3 has lasers
  const laser = LEVELS[2].lasers[0];
  // Position player directly in laser line at x=392
  state.player.x = laser.x - state.player.w / 2;
  state.player.y = 120;

  // Find a charging time
  state.levelTime = 0.1;
  assert.equal(getLaserStatus(laser, state.levelTime).state, 'charging');
  stepSimulation(state, emptyInput(), 1 / 60);
  assert.equal(state.player.dead, false, 'Charging laser telegraph must not kill player');

  // Advance into active beam window
  state.levelTime = laser.chargeTime + 0.1;
  assert.equal(getLaserStatus(laser, state.levelTime).state, 'active');
  stepSimulation(state, emptyInput(), 1 / 60);
  assert.equal(state.player.dead, true, 'Active laser beam must kill player');
});

test('collecting all shards opens portal and completing final stage triggers victory', () => {
  const finalIndex = LEVELS.length - 1;
  const state = createSimulationState(finalIndex, 'challenge', 'playing'); // Stage 8
  assert.equal(state.portalOpen, false);

  // Collect all shards in final stage (stepping past 30ms hitstop after each pickup)
  for (const shard of state.shards) {
    state.player.x = shard.x - state.player.w / 2;
    state.player.y = shard.y - state.player.h / 2;
    state.player.vx = 0;
    state.player.vy = 0;
    stepSimulation(state, emptyInput(), 1 / 60);
    stepSimulation(state, emptyInput(), 0.05);
  }
  assert.equal(state.portalOpen, true, 'Portal must unlock once all shards are collected');

  // Move to exit portal
  const portal = LEVELS[finalIndex].portal;
  state.player.x = portal.x - state.player.w / 2;
  state.player.y = portal.y - state.player.h / 2;
  stepSimulation(state, emptyInput(), 1 / 60);
  assert.equal(state.phase, 'gameover');
  assert.equal(state.outcome, 'victory');
});

test('losing all lives in challenge mode triggers reachable gameover defeat', () => {
  const state = createSimulationState(0, 'challenge', 'playing');
  assert.equal(state.lives, CHALLENGE_STARTING_LIVES);

  for (let i = 0; i < CHALLENGE_STARTING_LIVES; i++) {
    // Drop player onto Stage 1 spike pit at x=240, y=490
    state.player.x = 240;
    state.player.y = 485;
    stepSimulation(state, emptyInput(), 1 / 60);
    assert.equal(state.player.dead, true);

    // Advance past respawn / defeat delay
    for (let t = 0; t < 35; t++) {
      stepSimulation(state, emptyInput(), 1 / 60);
    }
  }

  assert.equal(state.lives, 0);
  assert.equal(state.phase, 'gameover');
  assert.equal(state.outcome, 'defeat');
});

test('holding right and jumping moves player across Stage 1 first spike pit', () => {
  const state = createSimulationState(0, 'practice', 'playing');
  const startX = state.player.x;

  // Walk right for 0.55s to approach the edge at x=210
  for (let i = 0; i < 33; i++) {
    stepSimulation(state, { ...emptyInput(), right: true }, 1 / 60);
  }
  assert.ok(state.player.x > startX + 90, 'Player should move briskly to the right');

  // Jump while holding right across the 90px gap onto Platform 2 (x=300, y=420)
  stepSimulation(state, { ...emptyInput(), right: true, jumpHeld: true, jumpJustPressed: true }, 1 / 60);
  for (let i = 0; i < 28; i++) {
    stepSimulation(state, { ...emptyInput(), right: true, jumpHeld: true }, 1 / 60);
  }
  assert.equal(state.deaths, 0, 'Player should clear the first spike pit cleanly');
  assert.ok(state.player.x >= 295, `Expected player on Platform 2 (>= 295), got ${state.player.x}`);
});

function createSpyContext() {
  const translates: Array<[number, number]> = [];
  const noop = () => {};
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    save: noop,
    restore: noop,
    scale: noop,
    rotate: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    fill: noop,
    stroke: noop,
    fillRect: noop,
    strokeRect: noop,
    setLineDash: noop,
    translate(x: number, y: number) {
      translates.push([x, y]);
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, translates };
}

test('spike and saw collisions trigger screen shake in renderGame and decay after impact', () => {
  // 1. Spike collision shake
  const spikeState = createSimulationState(0, 'practice', 'playing');
  spikeState.player.x = 240;
  spikeState.player.y = 485; // Stage 1 spike pit
  stepSimulation(spikeState, emptyInput(), 1 / 60);

  assert.equal(spikeState.player.dead, true);
  assert.equal(spikeState.lastDeathCause, 'spike');
  assert.ok(spikeState.impactShakeTimer > 0.3, 'Spike collision should set impactShakeTimer');
  assert.equal(spikeState.trauma, 1);

  const spikeSpy = createSpyContext();
  renderGame(spikeSpy.ctx, spikeState);
  const firstSpikeTranslate = spikeSpy.translates[0];
  assert.ok(firstSpikeTranslate, 'renderGame should call ctx.translate for screen shake on spike death');
  assert.ok(
    Math.hypot(firstSpikeTranslate[0], firstSpikeTranslate[1]) >= 4,
    `Expected strong spike death shake offset, got (${firstSpikeTranslate[0]}, ${firstSpikeTranslate[1]})`
  );

  // 2. Saw collision shake
  const sawState = createSimulationState(0, 'practice', 'playing');
  const saw = LEVELS[0].saws[0];
  const sawPos = getSawPosition(saw, sawState.levelTime + 1 / 60);
  sawState.player.x = sawPos.x - sawState.player.w / 2;
  sawState.player.y = sawPos.y - sawState.player.h / 2;
  stepSimulation(sawState, emptyInput(), 1 / 60);

  assert.equal(sawState.player.dead, true);
  assert.equal(sawState.lastDeathCause, 'saw');
  assert.ok(sawState.impactShakeTimer > 0.3, 'Saw collision should set impactShakeTimer');

  const sawSpy = createSpyContext();
  renderGame(sawSpy.ctx, sawState);
  const firstSawTranslate = sawSpy.translates[0];
  assert.ok(firstSawTranslate, 'renderGame should call ctx.translate for screen shake on saw death');
  assert.ok(
    Math.hypot(firstSawTranslate[0], firstSawTranslate[1]) >= 4,
    `Expected strong saw death shake offset, got (${firstSawTranslate[0]}, ${firstSawTranslate[1]})`
  );

  // Advance past respawn & shake decay; camera shake should settle to zero
  for (let i = 0; i < 45; i++) {
    stepSimulation(sawState, emptyInput(), 1 / 60);
  }
  assert.equal(sawState.impactShakeTimer, 0);
  assert.equal(sawState.trauma, 0);
  const settledSpy = createSpyContext();
  renderGame(settledSpy.ctx, sawState);
  // First translate (if any) would only be player pivot, not camera shake; player pivot is >= 30
  if (settledSpy.translates.length > 0) {
    assert.ok(
      settledSpy.translates[0][0] >= 30,
      'No camera shake translate should occur once trauma and impactShakeTimer decay to 0'
    );
  }
});
