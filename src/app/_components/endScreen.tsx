"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, Crown, Swords } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { twColor500ToRgb } from "~/utils/general";
import { useParty } from "~/utils/PartyProvider";

type EndPhase = "guess" | "winner";

const RETURN_SECONDS = 16;
const GUESS_PHASE_MS = 3200;

export default function EndScreen({
  className,
}: {
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const [timer, setTimer] = useState(RETURN_SECONDS);
  const [phase, setPhase] = useState<EndPhase>("guess");
  const { roomState, lastPlayerStandingWinner } = useParty();
  const prefersReducedMotion = useReducedMotion();
  const hasNavigatedRef = useRef(false);

  const winner = roomState?.players.find((p) => p.id === roomState.winnerId);
  const winnerGuess = roomState?.set?.characters.find(
    (c) => c.id === winner?.characterToGuess,
  );
  const survivalGuess = roomState?.set?.characters.find(
    (c) => c.id === lastPlayerStandingWinner?.guessedCharacterId,
  );

  const winnerName = winner?.name ?? "A player";
  const wonBySurvival =
    !!lastPlayerStandingWinner &&
    lastPlayerStandingWinner.winner === winnerName;
  const revealPlayerName = wonBySurvival
    ? (lastPlayerStandingWinner?.loser ?? "A player")
    : winnerName;
  const revealGuess = wonBySurvival ? survivalGuess : winnerGuess;
  const guessedName = revealGuess?.name ?? "Unknown character";
  const guessedImage = revealGuess?.image;
  const winnerRgb = twColor500ToRgb(winner?.color);

  const router = useRouter();

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
    setPhase("guess");
    setTimer(RETURN_SECONDS);

    if (prefersReducedMotion) {
      setPhase("winner");
      return;
    }

    const toWinner = setTimeout(() => setPhase("winner"), GUESS_PHASE_MS);

    return () => {
      clearTimeout(toWinner);
    };
  }, [prefersReducedMotion, roomState?.winnerId, winner?.characterToGuess]);

  useEffect(() => {
    if (phase !== "winner") return;

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
  }, [phase, routeToLobby]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/65 p-4 backdrop-blur-sm",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500/15 blur-3xl" />
        <div className="absolute right-12 bottom-10 h-36 w-36 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-black/50 p-6 shadow-2xl"
        style={{ "--winner-rgb": winnerRgb } as CSSProperties}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-yellow-300">
            <Swords className="h-4 w-4" />
            <span className="text-xs tracking-[0.2em] uppercase">
              Final Reveal
            </span>
          </div>
          {phase === "winner" ? (
            <div className="rounded-full border border-[rgb(var(--winner-rgb)/0.45)] bg-[rgb(var(--winner-rgb)/0.15)] px-3 py-1 text-xs text-white/85">
              Returning in {timer}s
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div className="relative overflow-hidden rounded-xl border border-white/15 bg-white/5">
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
                    {revealPlayerName} guessed
                    <span className="block text-[rgb(var(--winner-rgb)/0.95)]">
                      {guessedName}
                    </span>
                  </h2>
                  <p className="mt-3 text-base text-white/75">
                    {wonBySurvival
                      ? "The guess is in. Checking outcome..."
                      : "The final call is in. Verifying result..."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {phase === "winner" ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.65 }}
                className="absolute inset-0 flex flex-col justify-center"
              >
                {/* Victory burst */}
                <div className="pointer-events-none absolute inset-0 -z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.4, 0], scale: [0.7, 1.15, 1.45] }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 1.6,
                      ease: "easeOut",
                    }}
                    className="absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(var(--winner-rgb)/0.6)]"
                  />
                  <motion.div
                    animate={{
                      opacity: [0.45, 0.12, 0.45],
                      scale: [0.9, 1.2, 0.9],
                    }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--winner-rgb)/0.12)] blur-2xl"
                  />
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.6] }}
                      transition={{
                        duration: prefersReducedMotion ? 0 : 1.2,
                        delay: prefersReducedMotion ? 0 : 0.2 + i * 0.08,
                      }}
                      className="absolute top-1/2 left-1/2 h-2 w-2 rounded-full bg-[rgb(var(--winner-rgb)/0.95)]"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-110px)`,
                      }}
                    />
                  ))}
                </div>

                <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[rgb(var(--winner-rgb)/0.45)] bg-[rgb(var(--winner-rgb)/0.15)] px-3 py-1 text-xs font-semibold tracking-wide text-[rgb(var(--winner-rgb)/0.95)] uppercase">
                  <Crown className="h-3.5 w-3.5" />
                  {wonBySurvival ? "Incorrect" : "Correct"}
                </div>
                <h2 className="text-5xl leading-tight font-black text-white">
                  {winnerName}
                  <span className="block text-[rgb(var(--winner-rgb)/0.95)]">
                    {wonBySurvival
                      ? "wins as last one standing"
                      : "wins the round"}
                  </span>
                </h2>
                <p className="mt-3 text-base text-white/80">
                  {wonBySurvival
                    ? `Incorrect guess. ${winnerName} takes the round.`
                    : "Flawless finish. Returning to lobby soon."}
                </p>
              </motion.div>
            ) : null}
          </div>
        </div>
        {phase === "winner" ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
            className="mt-5 flex flex-col items-center gap-3 border-t border-white/10 pt-4 text-white/85"
          >
            <p className="text-center text-sm">
              Returning to lobby in{" "}
              <span className="font-semibold">{timer}s</span>
            </p>
            <Button
              variant="secondary"
              onClick={routeToLobby}
              className="bg-blue-500 text-blue-100"
            >
              <ChevronLeft />
              Return to lobby
            </Button>
          </motion.div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
