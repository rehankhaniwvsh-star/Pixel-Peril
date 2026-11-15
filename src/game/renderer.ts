import {
  GRID_COLS,
  GRID_ROWS,
  isEditableCell,
  type EditorTool,
  type GridCell,
  type LaserDirection,
} from './editor';
import { LEVELS, TILE_SIZE, WORLD_HEIGHT, WORLD_WIDTH } from './levels';
import { getLaserStatus, getOrbitalPosition, getSawPosition, MAX_PARTICLES, PHYSICS } from './physics';
import type { SimulationState } from './types';

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: SimulationState
): void {
  const level = state.customLevel ?? LEVELS[state.levelIndex];
  const t = state.levelTime;
  const globalT = state.totalTime;
  const shakeT = state.shakeClock;

  // Clear full chamber backdrop before camera shake translation so edges never show gaps
  ctx.fillStyle = '#0b0e15';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  ctx.save();

  // Screen shake effect: high-impact jolt when colliding with a saw or spike + general trauma decay
  const isSawOrSpikeDeath =
    state.impactShakeTimer > 0 &&
    (state.lastDeathCause === 'saw' || state.lastDeathCause === 'spike');
  let shakeAmplitude = state.trauma * state.trauma * 9;
  if (isSawOrSpikeDeath) {
    const impactRatio = Math.min(1, state.impactShakeTimer / PHYSICS.impactShakeDuration);
    const impactMag = state.lastDeathCause === 'saw' ? 16 : 14;
    shakeAmplitude = Math.max(shakeAmplitude, impactRatio * impactRatio * impactMag);
  }

  if (shakeAmplitude > 0.25) {
    const freqX = state.lastDeathCause === 'saw' ? 108.5 : 88.3;
    const freqY = state.lastDeathCause === 'saw' ? 131.2 : 114.7;
    const sx = Math.sin(shakeT * freqX + 0.7) * shakeAmplitude;
    const sy = Math.cos(shakeT * freqY + 1.1) * shakeAmplitude;
    ctx.translate(Math.round(sx), Math.round(sy));
  }

  // 1. Deep Industrial Chamber Background
  ctx.fillStyle = '#0b0e15';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // Distant recessed structural pillars (subtle architectural depth)
  ctx.fillStyle = '#0f131d';
  for (let px = 90; px < WORLD_WIDTH - 60; px += 180) {
    ctx.fillRect(px, 30, 36, WORLD_HEIGHT - 30);
    ctx.fillStyle = '#131826';
    ctx.fillRect(px + 6, 30, 2, WORLD_HEIGHT - 30);
    ctx.fillRect(px + 28, 30, 2, WORLD_HEIGHT - 30);
    ctx.fillStyle = '#0f131d';
  }

  // Subtle architectural grid (30px cells)
  ctx.strokeStyle = '#151b28';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 30; x < WORLD_WIDTH; x += 30) {
    ctx.moveTo(x + 0.5, 30);
    ctx.lineTo(x + 0.5, WORLD_HEIGHT);
  }
  for (let y = 30; y < WORLD_HEIGHT; y += 30) {
    ctx.moveTo(30, y + 0.5);
    ctx.lineTo(WORLD_WIDTH - 30, y + 0.5);
  }
  ctx.stroke();

  // Subtle ambient background dust motes (deterministic, zero allocation)
  ctx.fillStyle = 'rgba(148, 163, 184, 0.16)';
  for (let i = 0; i < 20; i++) {
    const mx = ((i * 137 + globalT * (8 + (i % 4) * 3)) % (WORLD_WIDTH - 60)) + 30;
    const my = ((i * 89 + Math.sin(globalT * 0.7 + i) * 18) % (WORLD_HEIGHT - 60)) + 30;
    ctx.fillRect(Math.round(mx), Math.round(my), 2, 2);
  }

  // Title-screen subtle parallax camera drift indicator (keep world sharp & centered)
  // 2. Sawblade Rail Tracks (behind platforms/saws)
  for (const saw of level.saws) {
    ctx.save();
    ctx.strokeStyle = '#252d3f';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(saw.x1, saw.y1);
    ctx.lineTo(saw.x2, saw.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Endpoint anchor bolts
    ctx.fillStyle = '#38435a';
    ctx.fillRect(saw.x1 - 3, saw.y1 - 3, 6, 6);
    ctx.fillRect(saw.x2 - 3, saw.y2 - 3, 6, 6);
    ctx.restore();
  }

  // 3. Orbital Sentry Rings
  for (const orb of level.orbitals) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.16)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(orb.cx, orb.cy, orb.orbitRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Center anchor node
    ctx.fillStyle = '#1e2536';
    ctx.fillRect(orb.cx - 4, orb.cy - 4, 8, 8);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(orb.cx - 2, orb.cy - 2, 4, 4);
  }

  // 4. Solid Platforms & Pixel Masonry
  for (const plat of level.platforms) {
    ctx.fillStyle = '#1b2232';
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

    // Top structural highlight strip
    ctx.fillStyle = '#33415c';
    ctx.fillRect(plat.x, plat.y, plat.w, 4);
    ctx.fillStyle = '#475569';
    ctx.fillRect(plat.x, plat.y, plat.w, 1);

    // Bottom/side dark trim
    ctx.fillStyle = '#111622';
    ctx.fillRect(plat.x, plat.y + plat.h - 2, plat.w, 2);

    // Pixel tile rivets / brick seams every 30px
    ctx.fillStyle = '#263044';
    for (let tx = plat.x + 6; tx < plat.x + plat.w - 6; tx += 30) {
      ctx.fillRect(tx, plat.y + 8, 3, 3);
      if (plat.h > 36) {
        ctx.fillRect(tx + 12, plat.y + 20, 3, 3);
      }
    }
    ctx.strokeStyle = '#283247';
    ctx.lineWidth = 1;
    ctx.strokeRect(plat.x + 0.5, plat.y + 0.5, plat.w - 1, plat.h - 1);
  }

  // 5. Crumbling Pixel Bridges
  for (const c of state.crumbles) {
    if (c.status === 'broken') {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
      ctx.setLineDash([]);
      continue;
    }

    const shakeX =
      c.status === 'shaking' ? Math.sin(globalT * 68) * 2.5 : 0;
    const drawX = Math.round(c.x + shakeX);

    ctx.fillStyle = c.status === 'shaking' ? '#475569' : '#2c364c';
    ctx.fillRect(drawX, c.y, c.w, c.h);
    ctx.fillStyle = c.status === 'shaking' ? '#f59e0b' : '#64748b';
    ctx.fillRect(drawX, c.y, c.w, 3);

    // Warning crack lines when shaking
    if (c.status === 'shaking') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(drawX + 14, c.y + 3, 2, 10);
      ctx.fillRect(drawX + 16, c.y + 11, 6, 2);
      ctx.fillRect(drawX + c.w - 20, c.y + 5, 2, 12);
    }
  }

  // 6. Checkpoints
  for (const cp of state.checkpoints) {
    // Flagpole
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cp.x - 2, cp.y, 4, 40);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cp.x - 4, cp.y + 36, 8, 4);
    // Pennant
    const wave = cp.activated ? Math.sin(globalT * 8) * 2 : 0;
    ctx.fillStyle = cp.activated ? '#10b981' : '#334155';
    ctx.fillRect(cp.x + 2, cp.y + 2 + wave * 0.3, 14, 10);
    if (cp.activated) {
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(cp.x + 4, cp.y + 4 + wave * 0.3, 6, 3);
    }
  }

  // 7. Exit Portal
  {
    const px = level.portal.x;
    const py = level.portal.y;
    const pw = 32;
    const ph = 46;
    const left = px - pw / 2;
    const top = py - ph / 2;

    // Stone portal arch frame
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(left - 4, top - 4, pw + 8, ph + 8);
    ctx.fillStyle = state.portalOpen ? '#10b981' : '#475569';
    ctx.fillRect(left - 2, top - 2, pw + 4, 3);

    if (state.portalOpen) {
      // Swirling emerald pixel vortex
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(left, top, pw, ph);
      const pulse = Math.sin(globalT * 6) * 3;
      ctx.fillStyle = '#10b981';
      ctx.fillRect(left + 4, top + 4, pw - 8, ph - 8);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(
        left + 9 + Math.round(Math.sin(globalT * 8) * 2),
        top + 10 + Math.round(pulse * 0.5),
        pw - 18,
        ph - 20
      );
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(px - 3, py - 6, 6, 12);
    } else {
      // Locked iron gate bars
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(left, top, pw, ph);
      ctx.fillStyle = '#334155';
      for (let bx = left + 5; bx < left + pw - 2; bx += 7) {
        ctx.fillRect(bx, top + 2, 3, ph - 4);
      }
      // Amber lock glyph in center
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - 5, py - 3, 10, 8);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 3, py - 8, 6, 5);
    }
  }

  // 8. Golden Data Shards
  for (let i = 0; i < state.shards.length; i++) {
    const s = state.shards[i];
    if (s.collected) continue;
    const bob = Math.sin(globalT * 4.5 + i * 1.4) * 3;
    const sy = Math.round(s.y + bob);
    const sx = Math.round(s.x);

    // Pixel diamond silhouette
    ctx.fillStyle = '#b45309';
    ctx.fillRect(sx - 7, sy - 7, 14, 14);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(sx - 6, sy - 6, 12, 12);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(sx - 4, sy - 4, 8, 8);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(sx - 2, sy - 4, 4, 4);
  }

  // 9. Razor Spikes
  for (const s of level.spikes) {
    const toothSize = 10;
    if (s.dir === 'up') {
      const count = Math.floor(s.w / toothSize);
      for (let i = 0; i < count; i++) {
        const tx = s.x + i * toothSize;
        const by = s.y + s.h;
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.moveTo(tx, by);
        ctx.lineTo(tx + toothSize / 2, s.y);
        ctx.lineTo(tx + toothSize, by);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(tx + 2, by);
        ctx.lineTo(tx + toothSize / 2, s.y + 2);
        ctx.lineTo(tx + toothSize - 2, by);
        ctx.closePath();
        ctx.fill();

        // Sharp tip highlight
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(tx + toothSize / 2 - 1, s.y + 1, 2, 3);
      }
    } else if (s.dir === 'down') {
      const count = Math.floor(s.w / toothSize);
      for (let i = 0; i < count; i++) {
        const tx = s.x + i * toothSize;
        const ty = s.y;
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + toothSize / 2, s.y + s.h);
        ctx.lineTo(tx + toothSize, ty);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(tx + 2, ty);
        ctx.lineTo(tx + toothSize / 2, s.y + s.h - 2);
        ctx.lineTo(tx + toothSize - 2, ty);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // 10. Telegraphed Plasma Lasers
  for (const laser of level.lasers) {
    const status = getLaserStatus(laser, t);
    const endX = laser.x + laser.dx * laser.length;
    const endY = laser.y + laser.dy * laser.length;

    // Emitter housing
    ctx.fillStyle = '#334155';
    ctx.fillRect(laser.x - 7, laser.y - 7, 14, 14);
    ctx.fillStyle =
      status.state === 'active'
        ? '#ef4444'
        : status.state === 'charging'
          ? '#f59e0b'
          : '#475569';
    ctx.fillRect(laser.x - 3, laser.y - 3, 6, 6);

    if (status.state === 'charging') {
      // Flickering sightline telegraph
      const blink = Math.floor(status.progress * 12) % 2 === 0;
      ctx.strokeStyle = blink ? 'rgba(251, 191, 36, 0.78)' : 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (status.state === 'active') {
      // Outer crimson glow beam + razor-white inner core
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.strokeStyle = '#fef2f2';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(laser.x, laser.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  // 11. Spinning Pixel Sawblades
  for (const saw of level.saws) {
    const pos = getSawPosition(saw, t);
    ctx.save();
    ctx.translate(Math.round(pos.x), Math.round(pos.y));
    ctx.rotate(globalT * 9);

    const r = saw.radius;
    // Teeth
    ctx.fillStyle = '#cbd5e1';
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / teeth);
      ctx.fillRect(-3, -r, 6, r * 2);
      ctx.restore();
    }
    // Inner disc
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    // Crimson hazard ring
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    // Hub pixel
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, -2, 4, 4);
    ctx.restore();
  }

  // 12. Orbital Sentries
  for (const orb of level.orbitals) {
    const pos = getOrbitalPosition(orb, t);
    const ox = Math.round(pos.x);
    const oy = Math.round(pos.y);
    const r = orb.orbRadius;

    // Subtle tether line
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(orb.cx, orb.cy);
    ctx.lineTo(ox, oy);
    ctx.stroke();

    // Pixel orb silhouette
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(ox - r, oy - r, r * 2, r * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(ox - r + 2, oy - r + 2, r * 2 - 4, r * 2 - 4);
    ctx.fillStyle = '#fecaca';
    ctx.fillRect(ox - 3, oy - 4, 4, 4);
  }

  // 13. Player Character (Pixel Hero + Scarf + Afterimages)
  const p = state.player;
  if (!p.dead) {
    // Dash afterimages
    for (const ghost of p.afterimages) {
      ctx.fillStyle = `rgba(56, 189, 248, ${ghost.alpha * 0.45})`;
      ctx.fillRect(Math.round(ghost.x), Math.round(ghost.y), p.w, p.h);
    }

    // Trailing pixel scarf (Amber when dash ready, Slate when dash spent)
    const scarfColor = p.canDash ? '#f59e0b' : '#64748b';
    const scarfHighlight = p.canDash ? '#fde68a' : '#94a3b8';
    for (let i = p.scarf.length - 1; i >= 0; i--) {
      const node = p.scarf[i];
      const sz = Math.max(3, 6 - i);
      ctx.fillStyle = i === 0 ? scarfHighlight : scarfColor;
      ctx.fillRect(Math.round(node.x - sz / 2), Math.round(node.y - sz / 2), sz, sz);
    }

    // Squash & stretch transform anchored at bottom-center
    ctx.save();
    const pivotX = Math.round(p.x + p.w / 2);
    const pivotY = Math.round(p.y + p.h);
    ctx.translate(pivotX, pivotY);
    ctx.scale(p.scaleX, p.scaleY);

    const hw = p.w / 2;
    const h = p.h;
    const isMoving = Math.abs(p.vx) > 25 && p.onGround;
    const stride = isMoving ? Math.sin(p.walkDistance * 0.35) * 2.5 : 0;

    // Legs (animated pixel boots)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-hw + 2, -5 + Math.round(stride), 5, 5);
    ctx.fillRect(hw - 7, -5 - Math.round(stride), 5, 5);

    // Body / Armor torso
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(-hw, -h, p.w, h - 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-hw + 1, -h + 1, p.w - 2, h - 6);

    // Visor band
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-hw + 1, -h + 4, p.w - 2, 7);

    // Eyes shifted toward facing direction (subtle blink on idle)
    const blink = state.phase === 'title' && Math.floor(globalT * 2.5) % 9 === 0;
    const eyeOffsetX = p.facing * 2;
    ctx.fillStyle = '#f8fafc';
    if (!blink) {
      ctx.fillRect(-4 + eyeOffsetX, -h + 6, 3, 3);
      ctx.fillRect(2 + eyeOffsetX, -h + 6, 3, 3);
    } else {
      ctx.fillRect(-4 + eyeOffsetX, -h + 8, 3, 1);
      ctx.fillRect(2 + eyeOffsetX, -h + 8, 3, 1);
    }

    // Headband accent pixel
    ctx.fillStyle = scarfColor;
    ctx.fillRect(-hw, -h + 2, p.w, 2);

    ctx.restore();
  }

  // 14. Pooled Particles
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const pt = state.particles[i];
    if (!pt.active) continue;
    const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pt.color;
    const half = pt.size / 2;
    ctx.fillRect(Math.round(pt.x - half), Math.round(pt.y - half), pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  // 14.5 Saw/Spike Impact Death Shockwave Ring
  if (p.dead && isSawOrSpikeDeath) {
    const progress = 1 - Math.min(1, state.impactShakeTimer / PHYSICS.impactShakeDuration);
    const ringRadius = 10 + progress * 34;
    const cx = Math.round(p.x + p.w / 2);
    const cy = Math.round(p.y + p.h / 2);
    ctx.strokeStyle = `rgba(254, 226, 226, ${Math.max(0, 0.85 * (1 - progress))})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 15. Death Screen Flash Overlay
  if (state.flashTimer > 0) {
    ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(0.36, state.flashTimer * 3.2)})`;
    ctx.fillRect(-20, -20, WORLD_WIDTH + 40, WORLD_HEIGHT + 40);
  }

  ctx.restore();
}

export function renderEditorOverlay(
  ctx: CanvasRenderingContext2D,
  tool: EditorTool,
  laserDir: LaserDirection,
  hoverCell: GridCell | null,
  sawDragStart: GridCell | null
): void {
  ctx.save();

  // Crisp blueprint grid lines across editable interior
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = 1; c < GRID_COLS; c++) {
    const x = c * TILE_SIZE + 0.5;
    ctx.moveTo(x, TILE_SIZE);
    ctx.lineTo(x, WORLD_HEIGHT);
  }
  for (let r = 1; r < GRID_ROWS; r++) {
    const y = r * TILE_SIZE + 0.5;
    ctx.moveTo(TILE_SIZE, y);
    ctx.lineTo(WORLD_WIDTH - TILE_SIZE, y);
  }
  ctx.stroke();

  // Saw patrol drag line preview
  if (tool === 'saw' && sawDragStart && hoverCell) {
    const x1 = sawDragStart.col * TILE_SIZE + TILE_SIZE / 2;
    const y1 = sawDragStart.row * TILE_SIZE + TILE_SIZE / 2;
    const x2 = hoverCell.col * TILE_SIZE + TILE_SIZE / 2;
    const y2 = hoverCell.row * TILE_SIZE + TILE_SIZE / 2;
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.beginPath();
    ctx.arc(x1, y1, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hovered cell ghost preview
  if (hoverCell && isEditableCell(hoverCell.col, hoverCell.row)) {
    const x = hoverCell.col * TILE_SIZE;
    const y = hoverCell.row * TILE_SIZE;
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2;

    if (tool === 'erase') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#ef4444';
    } else if (tool === 'block') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#38bdf8';
    } else if (tool === 'saw') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f87171';
    } else if (tool === 'laser') {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.fillRect(cx - 7, cy - 7, 14, 14);
      const dirVec =
        laserDir === 'down'
          ? [0, 1]
          : laserDir === 'up'
            ? [0, -1]
            : laserDir === 'right'
              ? [1, 0]
              : [-1, 0];
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + dirVec[0] * 120, cy + dirVec[1] * 120);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#fbbf24';
    } else if (tool === 'spike') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.fillRect(x + 2, y + 14, TILE_SIZE - 4, 16);
      ctx.strokeStyle = '#ef4444';
    } else if (tool === 'shard') {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.fillRect(cx - 6, cy - 6, 12, 12);
      ctx.strokeStyle = '#fbbf24';
    } else if (tool === 'spawn') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fillRect(x + 6, y + 8, 18, 22);
      ctx.strokeStyle = '#38bdf8';
    } else if (tool === 'portal') {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.fillRect(cx - 14, y + 2, 28, 26);
      ctx.strokeStyle = '#10b981';
    } else {
      ctx.strokeStyle = '#38bdf8';
    }

    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  }

  ctx.restore();
}

