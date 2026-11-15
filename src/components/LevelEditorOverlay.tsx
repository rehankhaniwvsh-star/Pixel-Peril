import type { EditorState, EditorTool, GridCell, LaserDirection } from '../game/editor';

interface LevelEditorOverlayProps {
  editorState: EditorState;
  activeTool: EditorTool;
  laserDir: LaserDirection;
  hoverCell: GridCell | null;
  onSelectTool: (tool: EditorTool) => void;
  onCycleLaserDir: () => void;
  onClear: () => void;
  onResetStarter: () => void;
  onTestLevel: () => void;
  onCloseEditor: () => void;
}

const TOOL_ITEMS: { id: EditorTool; label: string; keyHint: string }[] = [
  { id: 'block', label: 'Block', keyHint: '1' },
  { id: 'saw', label: 'Saw', keyHint: '2' },
  { id: 'laser', label: 'Laser', keyHint: '3' },
  { id: 'spike', label: 'Spike', keyHint: '4' },
  { id: 'shard', label: 'Shard', keyHint: '5' },
  { id: 'spawn', label: 'Spawn', keyHint: '6' },
  { id: 'portal', label: 'Portal', keyHint: '7' },
  { id: 'erase', label: 'Erase', keyHint: '8' },
];

const DIR_LABELS: Record<LaserDirection, string> = {
  down: '↓ Down',
  right: '→ Right',
  up: '↑ Up',
  left: '← Left',
};

export function LevelEditorOverlay({
  editorState,
  activeTool,
  laserDir,
  hoverCell,
  onSelectTool,
  onCycleLaserDir,
  onClear,
  onResetStarter,
  onTestLevel,
  onCloseEditor,
}: LevelEditorOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-2 sm:p-3.5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Level Editor Overlay"
    >
      {/* Top Perimeter Toolbar */}
      <div
        className="pointer-events-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 px-2.5 sm:px-3 py-2 border border-[#33415c]"
        style={{ backgroundColor: 'rgba(11, 14, 21, 0.94)' }}
      >
        {/* Left: Title + Tool Palette (scrollable horizontally on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto lg:flex-wrap pb-0.5 lg:pb-0">
          <span className="font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-sky-300 mr-1.5 whitespace-nowrap shrink-0">
            Editor
          </span>

          {TOOL_ITEMS.map((item) => {
            const active = activeTool === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTool(item.id)}
                className={`min-h-[44px] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium border whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? item.id === 'erase'
                      ? 'border-red-400 bg-[#dc2626] text-white'
                      : 'border-sky-400 bg-[#0284c7] text-white'
                    : 'border-[#2b354b] bg-[#141a27] hover:bg-[#1e273a] text-slate-200'
                }`}
              >
                <span className="text-[11px] opacity-70 mr-1 font-mono-tabular">
                  {item.keyHint}
                </span>
                {item.label}
              </button>
            );
          })}

          {activeTool === 'laser' && (
            <button
              type="button"
              onClick={onCycleLaserDir}
              title="Change laser beam direction (Q)"
              className="min-h-[44px] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium border border-amber-400/70 bg-[#1e1a12] hover:bg-[#2d2515] text-amber-300 whitespace-nowrap shrink-0"
            >
              Aim: {DIR_LABELS[laserDir]}
            </button>
          )}
        </div>

        {/* Right: Clear / Starter / Exit / Test Level */}
        <div className="flex items-center justify-end gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={onResetStarter}
            className="min-h-[44px] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium border border-[#2b354b] bg-[#141a27] hover:bg-[#1e273a] text-slate-300 whitespace-nowrap shrink-0"
          >
            Template
          </button>
          <button
            type="button"
            onClick={onClear}
            className="min-h-[44px] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium border border-[#2b354b] bg-[#141a27] hover:bg-[#1e273a] text-slate-300 whitespace-nowrap shrink-0"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onCloseEditor}
            className="min-h-[44px] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium border border-[#2b354b] bg-[#141a27] hover:bg-[#1e273a] text-slate-200 whitespace-nowrap shrink-0"
          >
            Exit
          </button>
          <button
            type="button"
            data-testid="test-level-btn"
            onClick={onTestLevel}
            className="min-h-[44px] px-4 sm:px-5 py-2 text-xs sm:text-sm font-display font-bold uppercase tracking-wider bg-[#10b981] hover:bg-[#059669] text-slate-950 whitespace-nowrap shrink-0 transition-colors"
          >
            Test Level
          </button>
        </div>
      </div>

      {/* Bottom Quiet Status & Placement Hint Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 sm:px-2">
        <div className="hidden sm:block text-[11px] md:text-xs text-slate-300 font-mono-tabular hud-text-stroke">
          {activeTool === 'saw'
            ? 'Click & drag between two grid cells to set saw patrol rail (or click once for 3-tile patrol) · Right-click erases'
            : activeTool === 'laser'
              ? 'Click cell to place laser emitter · Press Q or click Aim to rotate beam · Right-click erases'
              : 'Click or drag on grid to place · Right-click erases · Press T or Test Level to play immediately'}
        </div>
        <div className="text-[11px] md:text-xs text-slate-300 font-mono-tabular hud-text-stroke ml-auto">
          Blocks {editorState.blocks.length} · Saws {editorState.saws.length} · Lasers{' '}
          {editorState.lasers.length}
          {hoverCell ? ` · (${hoverCell.col}, ${hoverCell.row})` : ''}
        </div>
      </div>
    </div>
  );
}
