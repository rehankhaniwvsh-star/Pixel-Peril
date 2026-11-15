import { LEVELS } from '../game/levels';
import type { GameOutcome, GamePhase, HudSnapshot, RunMode } from '../game/types';

interface StatusModalsProps {
  phase: GamePhase;
  outcome: GameOutcome;
  hud: HudSnapshot;
  showStagesModal: boolean;
  onResume: () => void;
  onRestartRun: (modeOverride?: RunMode) => void;
  onRestartStage: () => void;
  onOpenEditor: () => void;
  onReturnToTitle: () => void;
  onCloseStages: () => void;
  onSelectStage: (index: number) => void;
}

export function StatusModals({
  phase,
  outcome,
  hud,
  showStagesModal,
  onResume,
  onRestartRun,
  onRestartStage,
  onOpenEditor,
  onReturnToTitle,
  onCloseStages,
  onSelectStage,
}: StatusModalsProps) {
  if (showStagesModal) {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(8, 10, 15, 0.78)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stages-modal-title"
      >
        <div
          className="w-full max-w-lg max-h-[90dvh] overflow-y-auto p-4 sm:p-6 border border-[#33415c]"
          style={{ backgroundColor: 'rgba(14, 18, 28, 0.98)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="stages-modal-title"
              className="font-display font-bold text-2xl text-slate-100 uppercase tracking-wide"
            >
              Select Stage
            </h2>
            <button
              type="button"
              onClick={onCloseStages}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-300 hover:text-white border border-[#2e3a52] bg-[#161c2a]"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {LEVELS.map((lvl, idx) => {
              const locked = idx > hud.highestUnlockedStage;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  disabled={locked}
                  onClick={() => onSelectStage(idx)}
                  className={`p-3.5 text-left border transition-colors ${
                    locked
                      ? 'border-[#1f2636] bg-[#0e121b] text-slate-500 cursor-not-allowed'
                      : 'border-[#33415c] bg-[#151c2c] hover:bg-[#1e283e] text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-display font-bold text-sm uppercase tracking-wider">
                      Stage {lvl.id}
                    </span>
                    <span className="text-[11px] font-mono-tabular text-slate-400">
                      {locked ? 'Locked' : `${lvl.shards.length} Shards`}
                    </span>
                  </div>
                  <div className="text-sm font-medium truncate">{lvl.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'paused') {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(8, 10, 15, 0.72)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-modal-title"
      >
        <div
          className="w-full max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6 border border-[#33415c]"
          style={{ backgroundColor: 'rgba(14, 18, 28, 0.98)' }}
        >
          <h2
            id="pause-modal-title"
            className="font-display font-bold text-2xl text-slate-100 uppercase tracking-wide mb-1"
          >
            Paused
          </h2>
          <p className="text-sm text-slate-400 mb-5">
            Stage {hud.levelIndex + 1} · {hud.levelName}
          </p>

          <div className="grid grid-cols-3 gap-2.5 mb-6">
            <div className="p-3 border border-[#263044] bg-[#111622]">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Deaths
              </div>
              <div className="font-display font-bold text-xl text-slate-100 font-mono-tabular">
                {hud.deaths}
              </div>
            </div>
            <div className="p-3 border border-[#263044] bg-[#111622]">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Time
              </div>
              <div className="font-display font-bold text-xl text-slate-100 font-mono-tabular">
                {Math.round(hud.elapsedSeconds)}s
              </div>
            </div>
            <div className="p-3 border border-[#263044] bg-[#111622]">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                {hud.mode === 'challenge' ? 'Lives' : 'Mode'}
              </div>
              <div className="font-display font-bold text-xl text-slate-100 font-mono-tabular">
                {hud.mode === 'challenge' ? hud.lives : '∞'}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onResume}
              className="w-full min-h-[50px] py-3.5 px-5 bg-[#38bdf8] hover:bg-[#0ea5e9] text-slate-950 font-display font-bold text-base uppercase tracking-wider transition-colors"
            >
              Resume
            </button>
            <button
              type="button"
              onClick={onRestartStage}
              className="w-full min-h-[48px] py-3 px-5 bg-[#1a2233] hover:bg-[#232e44] border border-[#33415c] text-slate-100 font-display font-semibold text-base uppercase tracking-wider transition-colors"
            >
              Restart Stage
            </button>
            <button
              type="button"
              onClick={onOpenEditor}
              className="w-full min-h-[48px] py-3 px-5 bg-[#122229] hover:bg-[#19303a] border border-emerald-500/50 text-emerald-300 font-display font-semibold text-base uppercase tracking-wider transition-colors"
            >
              {hud.isTestingCustom ? 'Back to Level Editor' : 'Open Level Editor'}
            </button>
            <button
              type="button"
              onClick={onReturnToTitle}
              className="w-full min-h-[48px] py-3 px-5 bg-[#111622] hover:bg-[#1a2233] border border-[#263044] text-slate-300 font-display font-semibold text-base uppercase tracking-wider transition-colors"
            >
              Return to Title
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'gameover') {
    const isVictory = outcome === 'victory';
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(8, 10, 15, 0.78)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="outcome-modal-title"
      >
        <div
          className={`w-full max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6 border ${
            isVictory ? 'border-emerald-500/60' : 'border-red-500/60'
          }`}
          style={{ backgroundColor: 'rgba(14, 18, 28, 0.98)' }}
        >
          <h2
            id="outcome-modal-title"
            className={`font-display font-bold text-2xl sm:text-3xl uppercase tracking-wide mb-1 ${
              isVictory ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isVictory ? 'Gauntlet Cleared' : 'Game Over'}
          </h2>
          <p className="text-sm text-slate-300 mb-5">
            {isVictory
              ? hud.isTestingCustom
                ? 'Custom chamber test completed.'
                : 'All eight pixel-perfect chambers conquered.'
              : `Stopped at Stage ${hud.levelIndex + 1} · ${hud.levelName}`}
          </p>

          <div className="grid grid-cols-3 gap-2.5 mb-6">
            <div className="p-3 border border-[#263044] bg-[#111622]">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                {isVictory ? 'Clear Time' : 'Stage'}
              </div>
              <div className="font-display font-bold text-xl text-slate-100 font-mono-tabular">
                {isVictory
                  ? `${Math.round(hud.elapsedSeconds)}s`
                  : `${hud.levelIndex + 1}/${hud.totalLevels}`}
              </div>
            </div>
            <div className="p-3 border border-[#263044] bg-[#111622]">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Deaths
              </div>
              <div className="font-display font-bold text-xl text-slate-100 font-mono-tabular">
                {hud.deaths}
              </div>
            </div>
            <div className="p-3 border border-[#263044] bg-[#111622]">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">
                Best Clear
              </div>
              <div className="font-display font-bold text-xl text-slate-100 font-mono-tabular">
                {hud.bestTimeSeconds !== null
                  ? `${Math.round(hud.bestTimeSeconds)}s`
                  : '—'}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              data-start="true"
              onClick={() => onRestartRun()}
              className={`w-full min-h-[52px] py-3.5 px-5 font-display font-bold text-base uppercase tracking-wider transition-colors ${
                isVictory
                  ? 'bg-[#10b981] hover:bg-[#059669] text-slate-950'
                  : 'bg-[#ef4444] hover:bg-[#dc2626] text-white'
              }`}
            >
              {isVictory ? (hud.isTestingCustom ? 'Replay Custom Level' : 'Play Again') : 'Try Again'}
            </button>

            {hud.isTestingCustom && (
              <button
                type="button"
                onClick={onOpenEditor}
                className="w-full min-h-[48px] py-3 px-5 bg-[#122229] hover:bg-[#19303a] border border-emerald-500/50 text-emerald-300 font-display font-semibold text-base uppercase tracking-wider transition-colors"
              >
                Back to Level Editor
              </button>
            )}

            {!isVictory && hud.mode === 'challenge' && (
              <button
                type="button"
                onClick={() => onRestartRun('practice')}
                className="w-full min-h-[48px] py-3 px-5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-display font-semibold text-base uppercase tracking-wider transition-colors"
              >
                Switch to Practice Mode
              </button>
            )}

            <button
              type="button"
              onClick={onReturnToTitle}
              className="w-full min-h-[48px] py-3 px-5 bg-[#111622] hover:bg-[#1a2233] border border-[#263044] text-slate-300 font-display font-semibold text-base uppercase tracking-wider transition-colors"
            >
              Return to Title
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
