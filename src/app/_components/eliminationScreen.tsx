"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ChevronLeft, Eye, Swords } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { twColor500ToRgb } from "~/utils/general";
import { useParty } from "~/utils/PartyProvider";

type EliminationPhase = "guess" | "result";

const GUESS_PHASE_MS = 3200;
const SPECTATOR_DISMISS_MS = 2400;

export default function EliminationScreen({
  className,
  message,
  guessedChar,
  eliminatedPlayerId,
  eliminatedName,
  onClose,
}: {
  className?: string;
  message: string;
  guessedChar?: number;
  eliminatedPlayerId?: string;
  eliminatedName?: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<EliminationPhase>("guess");
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const { playerId, roomState } = useParty();
  const char =
    roomState?.set?.characters.find((c) => c.id === guessedChar) ?? null;
  const eliminatedPlayer = roomState?.players.find(
    (p) => p.id === eliminatedPlayerId,
  );
  const isEliminatedViewer =
    !!eliminatedPlayerId && playerId === eliminatedPlayerId;

  const accent = twColor500ToRgb(eliminatedPlayer?.color);
  const guessedName = char?.name ?? "Unknown character";
  const guessedImage = char?.image;
  const revealName = eliminatedName ?? eliminatedPlayer?.name ?? "A player";

  useEffect(() => {
    setPhase("guess");

    if (prefersReducedMotion) {
      setPhase("result");
      return;
    }

    const toResult = setTimeout(() => setPhase("result"), GUESS_PHASE_MS);
    return () => clearTimeout(toResult);
  }, [prefersReducedMotion, message, guessedChar, eliminatedPlayerId]);

  useEffect(() => {
    if (phase !== "result") return;
    if (isEliminatedViewer) return;

    const id = setTimeout(() => onClose(), SPECTATOR_DISMISS_MS);
    return () => clearTimeout(id);
  }, [phase, isEliminatedViewer, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm",
        className,
      )}
      style={{ "--elim-rgb": accent } as CSSProperties}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[rgb(var(--elim-rgb)/0.35)] bg-black/50 p-6 shadow-2xl"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--elim-rgb)/0.12)] blur-3xl" />
          <div className="absolute right-12 bottom-10 h-36 w-36 rounded-full bg-red-500/15 blur-3xl" />
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[rgb(var(--elim-rgb)/0.95)]">
            <Swords className="h-4 w-4" />
            <span className="text-xs tracking-[0.2em] uppercase">
              Final Reveal
            </span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="relative overflow-hidden rounded-xl border border-[rgb(var(--elim-rgb)/0.35)] bg-white/5">
            {guessedImage ? (
              <Image
                src={guessedImage}
                alt={guessedName}
                width={640}
                height={640}
                className="h-56 w-full object-cover md:h-full"
              />
            ) : (
              <div className="flex h-56 w-full items-center justify-center text-sm text-white/70 md:h-full">
                Character image unavailable
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3 text-sm font-medium text-white">
              {guessedName}
            </div>
          </div>

          <div className="relative min-h-56">
            <AnimatePresence mode="wait">
              {phase === "guess" && (
                <motion.div
                  key="guess"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.45 }}
                  className="absolute inset-0 flex flex-col justify-center"
                >
                  <p className="text-sm tracking-wider text-white/70 uppercase">
                    Decisive Guess
                  </p>
                  <h2 className="mt-2 text-4xl leading-tight font-bold text-white">
                    {revealName} guessed
                    <span className="block text-[rgb(var(--elim-rgb)/0.95)]">
                      {guessedName}
                    </span>
                  </h2>
                  <p className="mt-3 text-base text-white/75">
                    The final call is in. Verifying result...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {phase === "result" ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.65 }}
                className="absolute inset-0 flex flex-col justify-center"
              >
                <div className="pointer-events-none absolute inset-0 -z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.4, 0], scale: [0.7, 1.12, 1.42] }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 1.6,
                      ease: "easeOut",
                    }}
                    className="absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(var(--elim-rgb)/0.6)]"
                  />
                  <motion.div
                    animate={{
                      opacity: [0.45, 0.1, 0.45],
                      scale: [0.92, 1.22, 0.92],
                    }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--elim-rgb)/0.12)] blur-2xl"
                  />
                </div>

                <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[rgb(var(--elim-rgb)/0.45)] bg-[rgb(var(--elim-rgb)/0.15)] px-3 py-1 text-xs font-semibold tracking-wide text-[rgb(var(--elim-rgb)/0.95)] uppercase">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Wrong Guess
                </div>
                <h2 className="text-5xl leading-tight font-black text-white">
                  Eliminated
                  <span className="block text-[rgb(var(--elim-rgb)/0.95)]">
                    {revealName} is out
                  </span>
                </h2>
                <p className="mt-3 text-base text-white/80">{message}</p>
              </motion.div>
            ) : null}
          </div>
        </div>

        {phase === "result" && isEliminatedViewer ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
            className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4 text-white/85"
          >
            <Button
              variant="secondary"
              onClick={onClose}
              className="border-[rgb(var(--elim-rgb)/0.45)] bg-[rgb(var(--elim-rgb)/0.2)] text-white"
            >
              <Eye />
              Continue spectating
            </Button>
            <Button variant="secondary" onClick={() => router.push("/lobby")}>
              <ChevronLeft />
              Return to lobby
            </Button>
          </motion.div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
