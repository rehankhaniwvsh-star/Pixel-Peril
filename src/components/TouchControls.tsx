import type { PointerEvent } from 'react';

interface TouchControlsProps {
  onMoveLeftChange: (held: boolean) => void;
  onMoveRightChange: (held: boolean) => void;
  onJumpPress: () => void;
  onJumpRelease: () => void;
  onDashPress: () => void;
}

export function TouchControls({
  onMoveLeftChange,
  onMoveRightChange,
  onJumpPress,
  onJumpRelease,
  onDashPress,
}: TouchControlsProps) {
  const prevent = (e: PointerEvent) => {
    e.preventDefault();
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 flex items-end justify-between p-3 sm:p-5 md:p-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pointer-events-none select-none touch-none"
      aria-label="On-screen game controls"
    >
      {/* Left / Right Movement Pad */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 pointer-events-auto">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Move Left"
          onPointerDown={(e) => {
            prevent(e);
            e.currentTarget.setPointerCapture?.(e.pointerId);
            onMoveLeftChange(true);
          }}
          onPointerUp={(e) => {
            prevent(e);
            onMoveLeftChange(false);
          }}
          onPointerCancel={() => onMoveLeftChange(false)}
          className="w-[72px] h-[72px] sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center border-2 border-[#3b4b6b] bg-[#0b0e15]/92 hover:bg-[#141b29] hover:border-sky-400/80 active:bg-[#38bdf8] active:text-slate-950 active:scale-95 text-slate-100 font-display font-bold text-2xl sm:text-3xl md:text-4xl transition-all"
        >
          ◀
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Move Right"
          onPointerDown={(e) => {
            prevent(e);
            e.currentTarget.setPointerCapture?.(e.pointerId);
            onMoveRightChange(true);
          }}
          onPointerUp={(e) => {
            prevent(e);
            onMoveRightChange(false);
          }}
          onPointerCancel={() => onMoveRightChange(false)}
          className="w-[72px] h-[72px] sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center border-2 border-[#3b4b6b] bg-[#0b0e15]/92 hover:bg-[#141b29] hover:border-sky-400/80 active:bg-[#38bdf8] active:text-slate-950 active:scale-95 text-slate-100 font-display font-bold text-2xl sm:text-3xl md:text-4xl transition-all"
        >
          ▶
        </button>
      </div>

      {/* Dash & Jump Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 pointer-events-auto">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Dash"
          onPointerDown={(e) => {
            prevent(e);
            onDashPress();
          }}
          className="h-[72px] min-w-[78px] px-4 sm:h-20 sm:min-w-[104px] sm:px-6 md:h-24 md:min-w-[124px] md:px-7 flex items-center justify-center border-2 border-amber-500/75 bg-[#0b0e15]/92 hover:bg-[#1c160d] hover:border-amber-400 active:bg-amber-400 active:text-slate-950 active:scale-95 text-amber-300 font-display font-bold text-sm sm:text-base md:text-lg uppercase tracking-wider transition-all"
        >
          Dash
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Jump"
          onPointerDown={(e) => {
            prevent(e);
            e.currentTarget.setPointerCapture?.(e.pointerId);
            onJumpPress();
          }}
          onPointerUp={(e) => {
            prevent(e);
            onJumpRelease();
          }}
          onPointerCancel={() => onJumpRelease()}
          className="h-[72px] min-w-[86px] px-4 sm:h-20 sm:min-w-[116px] sm:px-6 md:h-24 md:min-w-[144px] md:px-8 flex items-center justify-center border-2 border-sky-400/80 bg-[#0b0e15]/92 hover:bg-[#102033] hover:border-sky-300 active:bg-sky-400 active:text-slate-950 active:scale-95 text-sky-300 font-display font-bold text-sm sm:text-base md:text-lg uppercase tracking-wider transition-all"
        >
          Jump
        </button>
      </div>
    </div>
  );
}
