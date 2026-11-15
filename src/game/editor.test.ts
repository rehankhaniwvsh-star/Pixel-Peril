import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cellKey,
  compileEditorLevel,
  computeLaserRay,
  createBlankEditorState,
  createStarterEditorState,
  eraseCellEntities,
  placeBlockAtCell,
  placeLaserAtCell,
  placeSawPath,
  placeSpikeAtCell,
  screenToGridCell,
} from './editor';
import { createSimulationState, stepSimulation } from './physics';
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

test('screenToGridCell maps viewport pointer coordinates accurately to 32x18 grid', () => {
  const rect = { left: 100, top: 50, width: 960, height: 540 };
  const cell = screenToGridCell(100 + 45, 50 + 75, rect);
  assert.deepEqual(cell, { col: 1, row: 2 });

  const outside = screenToGridCell(50, 50, rect);
  assert.equal(outside, null);
});

test('placing and erasing blocks, spikes, saws, and lasers updates editor state cleanly', () => {
  let editor = createBlankEditorState();
  editor = placeBlockAtCell(editor, 10, 10);
  assert.ok(editor.blocks.includes(cellKey(10, 10)));

  // Border walls (col=0 or row=0) cannot be overwritten
  const unchanged = placeBlockAtCell(editor, 0, 10);
  assert.equal(unchanged.blocks.includes(cellKey(0, 10)), false);

  // Placing a spike on an occupied block replaces it cleanly
  editor = placeSpikeAtCell(editor, 10, 10);
  assert.equal(editor.blocks.includes(cellKey(10, 10)), false);
  assert.ok(editor.spikes.includes(cellKey(10, 10)));

  // Placing a saw path between two cells
  editor = placeSawPath(editor, 12, 8, 16, 8);
  assert.equal(editor.saws.length, 1);
  assert.deepEqual(editor.saws[0], { c1: 12, r1: 8, c2: 16, r2: 8 });

  // Erasing the saw anchor removes the saw
  editor = eraseCellEntities(editor, 12, 8);
  assert.equal(editor.saws.length, 0);
});

test('laser raycast stops cleanly against placed blocks', () => {
  let editor = createBlankEditorState();
  editor = placeBlockAtCell(editor, 10, 6);
  editor = placeLaserAtCell(editor, 10, 1, 'down');

  const ray = computeLaserRay(editor.lasers[0], new Set(editor.blocks));
  // 4 empty rows (rows 2,3,4,5) -> 4*30 + 22 = 142px stopping at top of row 6
  assert.equal(ray.dx, 0);
  assert.equal(ray.dy, 1);
  assert.equal(ray.length, 4 * 30 + 22);
});

test('compiled starter and custom editor levels run safely in physics simulation', () => {
  const editor = createStarterEditorState();
  const level = compileEditorLevel(editor);
  assert.ok(level.platforms.length > 5);
  assert.ok(level.saws.length >= 1);
  assert.ok(level.lasers.length >= 1);

  const sim = createSimulationState(0, 'practice', 'playing', level);
  for (let i = 0; i < 180; i++) {
    stepSimulation(sim, emptyInput(), 1 / 60);
  }
  assert.equal(sim.deaths, 0, 'Starter custom level spawn must be idle-safe');
  assert.equal(sim.player.onGround, true);
});
