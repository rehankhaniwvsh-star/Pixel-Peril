import type { RunMode } from '../game/types';

interface TitleOverlayProps {
  mode: RunMode;
  bestTimeSeconds: number | null;
  bestDeaths: number | null;
  onSelectMode: (mode: RunMode) => void;
  onStart: () => void;
  onOpenStages: () => void;
  onOpenEditor: () => void;
}

export function TitleOverlay({
  mode,
  bestTimeSeconds,
  bestDeaths,
  onSelectMode,
  onStart,
  onOpenStages,
  onOpenEditor,
}: TitleOverlayProps) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-8 md:p-12 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none overflow-y-auto">
      {/* Upper-left calm negative space anchor */}
      <div className="w-full max-w-lg pointer-events-auto my-auto sm:my-0">
        <div
          className="w-full sm:w-auto sm:inline-block p-4 sm:p-6 border border-[#2d374e]"
          style={{ backgroundColor: 'rgba(11, 14, 21, 0.92)' }}
        >
          {/* Bespoke inline SVG Title Lockup */}
          <svg
            viewBox="0 0 460 96"
            className="w-full max-w-[420px] h-auto mb-4 sm:mb-5"
            role="img"
            aria-label="The Toughest Pixel"
          >
            {/* Pixel hazard crest */}
            <polygon points="24,10 42,28 24,46 6,28" fill="#dc2626" />
            <polygon points="24,16 36,28 24,40 12,28" fill="#ef4444" />
            <rect x="20" y="24" width="8" height="8" fill="#fef2f2" />

            {/* Decorative structural notch lines */}
            <rect x="56" y="14" width="388" height="2" fill="#334155" />
            <rect x="56" y="14" width="48" height="2" fill="#ef4444" />

            {/* Title Typography inside SVG */}
            <text
              x="56"
              y="46"
              fill="#f8fafc"
              fontFamily="'Chakra Petch', sans-serif"
              fontWeight="700"
              fontSize="30"
              letterSpacing="1.5"
            >
              THE TOUGHEST
            </text>
            <text
              x="56"
              y="82"
              fill="#38bdf8"
              fontFamily="'Chakra Petch', sans-serif"
              fontWeight="700"
              fontSize="36"
              letterSpacing="3"
            >
              PIXEL
            </text>

            {/* Pixel character emblem beside PIXEL */}
            <rect x="184" y="54" width="22" height="22" fill="#0369a1" />
            <rect x="186" y="56" width="18" height="18" fill="#38bdf8" />
            <rect x="184" y="57" width="22" height="3" fill="#f59e0b" />
            <rect x="186" y="61" width="18" height="7" fill="#0f172a" />
            <rect x="191" y="63" width="3" height="3" fill="#f8fafc" />
            <rect x="197" y="63" width="3" height="3" fill="#f8fafc" />
            <rect x="178" y="61" width="5" height="5" fill="#f59e0b" />
            <rect x="173" y="63" width="4" height="4" fill="#d97706" />

            {/* Bottom notch rule */}
            <rect x="56" y="92" width="388" height="2" fill="#252f44" />
          </svg>

          {/* Mode Selector (Segmented Control) */}
          <div className="mb-4 sm:mb-5">
            <div className="flex items-center gap-1.5 p-1.5 bg-[#131824] border border-[#263046] w-full sm:w-fit">
              <button
                type="button"
                onClick={() => onSelectMode('challenge')}
                className={`flex-1 sm:flex-initial min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap shrink-0 transition-colors ${
                  mode === 'challenge'
                    ? 'bg-[#dc2626] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Challenge · 5 Lives
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('practice')}
                className={`flex-1 sm:flex-initial min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap shrink-0 transition-colors ${
                  mode === 'practice'
                    ? 'bg-[#0284c7] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Practice · Endless
              </button>
            </div>
          </div>

          {/* Primary Actions (<= 3 menu actions total) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              data-start="true"
              onClick={onStart}
              className="col-span-2 sm:col-span-1 min-h-[54px] sm:min-h-[56px] px-6 sm:px-7 py-3.5 sm:py-4 bg-[#ef4444] hover:bg-[#dc2626] active:translate-y-px text-white font-display font-bold text-base sm:text-lg tracking-wider uppercase whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              Start Gauntlet
            </button>
            <button
              type="button"
              onClick={onOpenStages}
              className="min-h-[52px] sm:min-h-[56px] px-4 sm:px-5 py-3.5 sm:py-4 bg-[#182030] hover:bg-[#232e44] border border-[#34425e] text-slate-100 font-display font-semibold text-sm sm:text-base tracking-wider uppercase whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              Stages
            </button>
            <button
              type="button"
              onClick={onOpenEditor}
              className="min-h-[52px] sm:min-h-[56px] px-4 sm:px-5 py-3.5 sm:py-4 bg-[#122229] hover:bg-[#19303a] border border-emerald-500/50 text-emerald-300 font-display font-semibold text-sm sm:text-base tracking-wider uppercase whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              Level Editor
            </button>
          </div>

          {/* Quiet personal best line if recorded */}
          {(bestTimeSeconds !== null || bestDeaths !== null) && (
            <div className="mt-4 pt-3 border-t border-[#232c40] flex items-center gap-3 text-xs text-slate-400 font-mono-tabular">
              {bestTimeSeconds !== null && (
                <span>Best Clear: {bestTimeSeconds.toFixed(1)}s</span>
              )}
              {bestTimeSeconds !== null && bestDeaths !== null && (
                <span aria-hidden="true">·</span>
              )}
              {bestDeaths !== null && <span>Fewest Deaths: {bestDeaths}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Single flat, borderless bottom control hint line */}
      <div className="text-[11px] sm:text-xs md:text-sm text-slate-300 font-mono-tabular tracking-wide hud-text-stroke pt-3">
        <span className="hidden sm:inline">
          8 brutal chambers · WASD / Arrows Move · Space / W Jump · Shift / X Dash · R Restart · Esc Pause
        </span>
        <span className="sm:hidden">
          8 chambers · Touch controls ready · Tap Start Gauntlet
        </span>
      </div>
    </div>
  );
}
