"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Hourglass, TimerReset } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useParty } from "~/utils/PartyProvider";

const RETURN_SECONDS = 12;

const DRAW_REASON_LABEL: Record<"turn-limit" | "time-limit", string> = {
  "turn-limit": "Turn Limit Reached",
  "time-limit": "Time Limit Reached",
};

export default function DrawScreen({ className }: { className?: string }) {
  const { roomState } = useParty();
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const [timer, setTimer] = useState(RETURN_SECONDS);
  const hasNavigatedRef = useRef(false);

  const drawReason = roomState?.drawReason;

  const routeToLobby = useMemo(
    () => () => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;
      router.push("/lobby");
    },
    [router],
  );

  useEffect(() => {
    hasNavigatedRef.current = false;
    setTimer(RETURN_SECONDS);
  }, [drawReason]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          routeToLobby();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [routeToLobby]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm",
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.45 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/90 p-7 shadow-2xl"
      >
        <div className="pointer-events-none absolute -top-16 -left-14 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -bottom-20 h-56 w-56 rounded-full bg-red-400/20 blur-3xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-400/10 px-3 py-1 text-xs tracking-[0.2em] text-cyan-100 uppercase">
            <Hourglass className="h-3.5 w-3.5" />
            Game Drawn
          </div>
          <div className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80">
            Returning in {timer}s
          </div>
        </div>

        <h2 className="relative mt-4 text-5xl font-black text-white">No Winner</h2>
        <p className="relative mt-2 text-lg text-white/80">
          {drawReason ? DRAW_REASON_LABEL[drawReason] : "Stalemate reached."}
        </p>

        <div className="relative mt-6 rounded-xl border border-white/15 bg-white/5 p-4">
          <p className="text-sm text-white/80">
            Nobody could close out the match within the configured limits. The
            round ended automatically as a draw.
          </p>
        </div>

        <div className="relative mt-6 flex justify-end">
          <Button variant="secondary" onClick={routeToLobby}>
            <TimerReset className="mr-2 h-4 w-4" />
            Return to Lobby
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
