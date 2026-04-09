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
        "border-accent/60 from-background/20 via-background/20 to-muted/20 relative overflow-hidden rounded-2xl border bg-linear-to-br p-2 shadow-lg backdrop-blur-xl 2xl:p-5",
        className,
      )}
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-yellow-500/10 blur-3xl" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="border-accent/60 flex h-11 w-11 items-center justify-center rounded-xl border bg-yellow-500/10">
            <Crown className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-widest text-yellow-500">
              YOUR TURN
            </h2>
            <p className="text-muted-foreground text-xs">
              Ask smart questions, flip cards fast.
            </p>
          </div>
        </div>
        <div className="text-muted-foreground border-border/60 bg-background/60 rounded-md border px-2 py-1 text-[11px] backdrop-blur">
          Round: live
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="border-border/60 bg-background/60 rounded-xl border p-3 backdrop-blur">
          <div className="mb-1 flex items-center gap-2 text-sm font-medium">
            <MessageCircleQuestion className="h-4 w-4 text-blue-400" />
            Use chat to narrow it down
          </div>
          <p className="text-muted-foreground text-sm">
            It's your turn to guess the character! Use the chat to ask questions
            and narrow down the possibilities.
          </p>
          <p className="text-muted-foreground mt-2 text-sm font-bold">
            YES or NO questions ONLY!
          </p>
          <p className="mt-2 text-sm text-blue-400/80">
            Pro tip: ask about the character's anime, role, or traits to get
            useful hints from other players.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div className="border-border/60 bg-background/60 rounded-xl border p-3 backdrop-blur">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <MousePointerClick className="h-4 w-4 text-emerald-400" />
              Controls
            </div>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-foreground border-border/70 bg-muted/40 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium">
                  Click
                </span>
                <span>turn a character card</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-foreground border-border/70 bg-muted/40 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium">
                  Hold click
                </span>
                <span>make a guess</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-red-300">
              <Skull className="h-4 w-4" />
              Sudden death
            </div>
            <p className="text-sm text-red-200/80">
              If you guess wrong, you get eliminated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
