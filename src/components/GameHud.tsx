import type { HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  showTouchControls: boolean;
  windowFocused: boolean;
  onToggleMute: () => void;
  onToggleTouchControls: () => void;
  onFocusGame: () => void;
  onOpenEditor: () => void;
  onRestartStage: () => void;
  onPause: () => void;
}

export function GameHud({
  hud,
  muted,
  showTouchControls,
  windowFocused,
  onToggleMute,
  onToggleTouchControls,
  onFocusGame,
  onOpenEditor,
  onRestartStage,
  onPause,
}: GameHudProps) {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-3 md:p-4 pt-[max(0.625rem,env(safe-area-inset-top))] pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 lg:gap-4">
        {/* Top Row on Mobile / Left+Right Stats on Desktop */}
        <div className="flex items-stretch justify-between gap-2 sm:gap-3 lg:contents">
          {/* Top-Left Perimeter Cluster: Stage + Shards */}
          <div
            className="flex items-center gap-2.5 sm:gap-5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 border border-[#2a3449] min-w-0"
            style={{ backgroundColor: 'rgba(11, 14, 21, 0.86)' }}
          >
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                {hud.isTestingCustom ? 'Custom' : 'Stage'}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-base sm:text-xl leading-none text-slate-100 font-mono-tabular whitespace-nowrap">
                  {hud.isTestingCustom ? 'EDIT' : `${hud.levelIndex + 1}/${hud.totalLevels}`}
                </span>
                <span className="hidden md:inline text-xs font-medium text-slate-300 truncate max-w-[160px]">
                  {hud.levelName}
                </span>
              </div>
            </div>

            <div className="h-6 sm:h-7 w-px bg-[#263044] shrink-0" aria-hidden="true" />

            {/* Shards Counter with world-matched SVG Diamond */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" fill="#b45309" />
                <rect x="6" y="6" width="12" height="12" fill="#f59e0b" />
                <rect x="8" y="6" width="6" height="6" fill="#fef3c7" />
              </svg>
              <div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                  Shards
                </div>
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="font-display font-bold text-base sm:text-xl leading-none text-amber-300 font-mono-tabular whitespace-nowrap">
                    {hud.shardsCollected}/{hud.shardsTotal}
                  </span>
                  <span
                    className={`hidden sm:inline text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap ${
                      hud.portalOpen ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {hud.portalOpen ? 'Open' : 'Locked'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile inline stats mirror / Desktop right-side container */}
          <div className="flex items-center gap-2 lg:gap-2.5 lg:order-2">
            <div
              className="flex items-center gap-2.5 sm:gap-4 px-2.5 py-1.5 sm:px-3.5 sm:py-2 border border-[#2a3449]"
              style={{ backgroundColor: 'rgba(11, 14, 21, 0.86)' }}
            >
              {/* Lives (Challenge) or Endless (Practice) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true">
                  <path
                    d="M4 8 L8 4 L12 7 L16 4 L20 8 L20 13 L12 21 L4 13 Z"
                    fill={hud.mode === 'challenge' ? '#ef4444' : '#38bdf8'}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                  <rect x="7" y="7" width="3" height="3" fill="#fef2f2" opacity="0.65" />
                </svg>
                <div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    {hud.mode === 'challenge' ? 'Lives' : 'Mode'}
                  </div>
                  <div
                    className={`font-display font-bold text-base sm:text-xl leading-none font-mono-tabular ${
                      hud.mode === 'challenge' && hud.lives <= 2
                        ? 'text-red-400'
                        : 'text-slate-100'
                    }`}
                  >
                    {hud.mode === 'challenge' ? hud.lives : '∞'}
                  </div>
                </div>
              </div>

              <div className="h-6 sm:h-7 w-px bg-[#263044]" aria-hidden="true" />

              {/* Deaths */}
              <div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                  Deaths
                </div>
                <div className="font-display font-bold text-base sm:text-xl leading-none text-slate-100 font-mono-tabular">
                  {hud.deaths}
                </div>
              </div>

              <div className="h-6 sm:h-7 w-px bg-[#263044]" aria-hidden="true" />

              {/* Elapsed Time */}
              <div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                  Time
                </div>
                <div className="font-display font-bold text-base sm:text-xl leading-none text-slate-100 font-mono-tabular">
                  {Math.floor(hud.elapsedSeconds)}s
                </div>
              </div>
            </div>

            {/* Desktop Utility Icon Buttons (inline on lg+) */}
            <div className="hidden lg:flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                tabIndex={-1}
                aria-label={hud.isTestingCustom ? 'Back to Level Editor (E)' : 'Open Level Editor (E)'}
                title={hud.isTestingCustom ? 'Edit Level (E)' : 'Level Editor (E)'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenEditor();
                }}
                className="h-12 px-4 flex items-center gap-1.5 border border-emerald-500/60 bg-[#0b1514] hover:bg-[#122624] text-emerald-300 font-display font-semibold text-sm uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors"
              >
                {hud.isTestingCustom ? 'Edit Level' : 'Editor'}
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label={showTouchControls ? 'Hide on-screen controls (C)' : 'Show on-screen controls (C)'}
                aria-pressed={showTouchControls}
                title={showTouchControls ? 'Hide Touch Pad (C)' : 'Show Touch Pad (C)'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleTouchControls();
                }}
                className={`w-12 h-12 flex items-center justify-center border transition-colors shrink-0 ${
                  showTouchControls
                    ? 'border-sky-400 bg-[#152438] text-sky-300'
                    : 'border-[#2a3449] bg-[#0b0e15] hover:bg-[#1a2233] text-slate-200'
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="7" width="18" height="10" rx="2" />
                  <line x1="7" y1="12" x2="11" y2="12" />
                  <line x1="9" y1="10" x2="9" y2="14" />
                  <circle cx="15.5" cy="11.5" r="0.8" fill="currentColor" />
                  <circle cx="17.5" cy="13" r="0.8" fill="currentColor" />
                </svg>
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label={muted ? 'Unmute audio (M)' : 'Mute audio (M)'}
                title={muted ? 'Unmute (M)' : 'Mute (M)'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleMute();
                }}
                className="w-12 h-12 flex items-center justify-center border border-[#2a3449] bg-[#0b0e15] hover:bg-[#1a2233] text-slate-200 transition-colors shrink-0"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="4,9 9,9 14,5 14,19 9,15 4,15" fill="currentColor" />
                  {muted ? (
                    <>
                      <line x1="17" y1="9" x2="21" y2="15" stroke="#ef4444" />
                      <line x1="21" y1="9" x2="17" y2="15" stroke="#ef4444" />
                    </>
                  ) : (
                    <path d="M17 8.5a5 5 0 0 1 0 7" stroke="#38bdf8" />
                  )}
                </svg>
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Restart Stage (R)"
                title="Restart Stage (R)"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onRestartStage();
                }}
                className="w-12 h-12 flex items-center justify-center border border-[#2a3449] bg-[#0b0e15] hover:bg-[#1a2233] text-slate-200 transition-colors shrink-0"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12a8 8 0 1 0 3-6.2" />
                  <polyline points="4,3 4,8 9,8" />
                </svg>
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Pause Game (P)"
                title="Pause (Esc / P)"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onPause();
                }}
                className="w-12 h-12 flex items-center justify-center border border-[#2a3449] bg-[#0b0e15] hover:bg-[#1a2233] text-slate-200 transition-colors shrink-0"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" />
                  <rect x="14" y="5" width="4" height="14" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Utility Row (< lg) */}
        <div className="flex lg:hidden items-center justify-between gap-2 pointer-events-auto">
          <span className="text-xs font-medium text-slate-300 truncate hud-text-stroke">
            {hud.levelName}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              tabIndex={-1}
              aria-label={hud.isTestingCustom ? 'Back to Level Editor (E)' : 'Open Level Editor (E)'}
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenEditor();
              }}
              className="h-11 px-3 flex items-center border border-emerald-500/60 bg-[#0b1514] hover:bg-[#122624] text-emerald-300 font-display font-semibold text-xs uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors"
            >
              {hud.isTestingCustom ? 'Edit' : 'Editor'}
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={showTouchControls ? 'Hide on-screen controls (C)' : 'Show on-screen controls (C)'}
              aria-pressed={showTouchControls}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleTouchControls();
              }}
              className={`w-11 h-11 flex items-center justify-center border transition-colors shrink-0 ${
                showTouchControls
                  ? 'border-sky-400 bg-[#152438] text-sky-300'
                  : 'border-[#2a3449] bg-[#0b0e15] hover:bg-[#1a2233] text-slate-200'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="7" width="18" height="10" rx="2" />
                <line x1="7" y1="12" x2="11" y2="12" />
                <line x1="9" y1="10" x2="9" y2="14" />
                <circle cx="15.5" cy="11.5" r="0.8" fill="currentColor" />
                <circle cx="17.5" cy="13" r="0.8" fill="currentColor" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Unmute audio (M)' : 'Mute audio (M)'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-11 h-11 flex items-center justify-center border border-[#2a3449] bg-[#0b0e15] hover:bg-[#1a2233] text-slate-200 transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="4,9 9,9 14,5 14,19 9,15 4,15" fill="currentColor" />
                {muted ? (
                  <>
                    <line x1="17" y1="9" x2="21" y2="15" stroke="#ef4444" />
                    <line x1="21" y1="9" x2="17" y2="15" stroke="#ef4444" />
                  </>
                ) : (
                  <path d="M17 8.5a5 5 0 0 1 0 7" stroke="#38bdf8" />
                )}
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Restart Stage (R)"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestartStage();
              }}
              className="w-11 h-11 flex items-center justify-center border border-[#2a3449] bg-[#0b0e15] hover:bg-[#1a2233] text-slate-200 transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12a8 8 0 1 0 3-6.2" />
                <polyline points="4,3 4,8 9,8" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause Game (P)"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="w-11 h-11 flex items-center justify-center border border-[#2a3449] bg-[#0b0e15] hover:bg-[#1a2233] text-slate-200 transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Focus Prompt or Quiet Control Hint */}
      <div className="flex flex-col items-center gap-2">
        {hud.phase === 'playing' && !windowFocused && (
          <button
            type="button"
            onClick={onFocusGame}
            className="pointer-events-auto px-5 py-3 border border-sky-400/70 bg-[#0b0e15]/95 text-sky-200 text-sm font-medium tracking-wide hover:bg-[#131b2b]"
          >
            Click here to enable keyboard controls (or press C for on-screen pad)
          </button>
        )}
        {hud.phase === 'playing' && !showTouchControls && (
          <div className="hidden sm:block text-[11px] md:text-xs text-slate-300/85 font-mono-tabular tracking-wide hud-text-stroke">
            A / D or ← / → Move · Space / W Jump · Shift / X Dash · C Touch Pad · R Restart · Esc Pause
          </div>
        )}
      </div>
    </div>
  );
}
