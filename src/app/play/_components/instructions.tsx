import {
  Crown,
  MessageCircleQuestion,
  MousePointerClick,
  Skull,
} from "lucide-react";
import { cn } from "~/lib/utils";

export function Instructions({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-accent/60 from-background/20 via-background/20 to-muted/20 relative overflow-x-hidden overflow-y-auto rounded-xl border bg-linear-to-br p-2 shadow-lg backdrop-blur-xl sm:rounded-2xl sm:p-2.5 lg:p-3 2xl:p-5",
        className,
      )}
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-yellow-500/10 blur-3xl sm:-top-20 sm:-right-20 sm:h-48 sm:w-48 lg:-top-24 lg:-right-24 lg:h-56 lg:w-56" />

      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div>
            <h2 className="text-[10px] font-semibold tracking-[0.18em] text-yellow-500 sm:text-xs lg:text-sm">
              YOUR TURN
            </h2>
            <p className="text-muted-foreground text-[10px] sm:text-xs lg:text-sm">
              Ask smart questions, flip cards fast.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
        <div className="border-border/60 bg-background/60 rounded-lg border p-2.5 backdrop-blur sm:rounded-xl sm:p-3 lg:p-4">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium sm:text-sm">
            <MessageCircleQuestion className="h-3.5 w-3.5 text-blue-400 sm:h-4 sm:w-4" />
            Use chat to narrow it down
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            It's your turn to guess the character! Use the chat to ask questions
            and narrow down the possibilities.
          </p>
          <p className="text-muted-foreground mt-1.5 text-xs font-bold sm:mt-2 sm:text-sm">
            YES or NO questions ONLY!
          </p>
          <p className="mt-1.5 text-xs text-blue-400/80 sm:mt-2 sm:text-sm">
            Pro tip: ask about the character's anime, role, or traits to get
            useful hints from other players.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
          <div className="border-border/60 bg-background/60 rounded-lg border p-2.5 backdrop-blur sm:rounded-xl sm:p-3 lg:p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium sm:text-sm">
              <MousePointerClick className="h-3.5 w-3.5 text-emerald-400 sm:h-4 sm:w-4" />
              Controls
            </div>
            <ul className="text-muted-foreground space-y-1 text-xs sm:text-sm">
              <li className="flex items-center gap-2">
                <span className="text-foreground border-border/70 bg-muted/40 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-[11px]">
                  Click
                </span>
                <span>turn a character card</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-foreground border-border/70 bg-muted/40 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-[11px]">
                  Hold click
                </span>
                <span>make a guess</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-2.5 sm:rounded-xl sm:p-3 lg:p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-red-300 sm:text-sm">
              <Skull className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Sudden death
            </div>
            <p className="text-xs text-red-200/80 sm:text-sm">
              If you guess wrong, you get eliminated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
