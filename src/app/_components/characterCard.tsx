import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { User2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AnimeCharacter } from "~/server/api/utils/jikan";
import { useParty } from "~/utils/PartyProvider";
import { cn } from "~/lib/utils";
import { FollowerPointerCard } from "~/components/ui/following-pointer";

const HOLD_TO_GUESS_MS = 1200;

export function CharacterCard({
  char,
  onTurn,
  onGuess,
  className,
  inGame,
  index,
  ...props
}: {
  char: AnimeCharacter;
  onTurn?: () => void;
  onGuess?: () => void;
  className?: string;
  inGame?: boolean;
  index: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { playerId, roomState } = useParty();
  const nowPlaying = roomState?.players.find((p) => p.id === roomState.turn);
  const isTurnt = !inGame ? false : nowPlaying?.turnt.includes(char.id);

  const isMyTurn = roomState?.turn === playerId;
  const canInteract = !!inGame && !!isMyTurn && roomState?.status === "playing";

  const [holdProgress, setHoldProgress] = useState(0);
  const [didTriggerGuess, setDidTriggerGuess] = useState(false);
  const holdStartRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 260, damping: 24 });
  const springRotateY = useSpring(rotateY, { stiffness: 260, damping: 24 });

  const clearHoldTracking = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    holdStartRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearHoldTracking();
    };
  }, []);

  const startHold = () => {
    if (!canInteract || isTurnt) return;

    clearHoldTracking();
    setDidTriggerGuess(false);
    holdStartRef.current = performance.now();

    const updateProgress = () => {
      if (!holdStartRef.current) return;
      const elapsed = performance.now() - holdStartRef.current;
      const progress = Math.min(1, elapsed / HOLD_TO_GUESS_MS);
      setHoldProgress(progress);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(updateProgress);
      }
    };

    rafRef.current = requestAnimationFrame(updateProgress);
    holdTimeoutRef.current = setTimeout(() => {
      setDidTriggerGuess(true);
      setHoldProgress(1);
      onGuess?.();
      clearHoldTracking();
      setTimeout(() => setHoldProgress(0), 120);
    }, HOLD_TO_GUESS_MS);
  };

  const endHold = () => {
    clearHoldTracking();
    if (!didTriggerGuess) {
      setHoldProgress(0);
    }
    setTimeout(() => setDidTriggerGuess(false), 0);
  };

  const handleClick = () => {
    if (!canInteract) return;
    if (didTriggerGuess) return;
    onTurn?.();
  };

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const element = cardRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const px = x / rect.width - 0.5;
    const py = y / rect.height - 0.5;

    const maxTilt = 12;
    rotateY.set(px * maxTilt * 2);
    rotateX.set(-py * maxTilt * 2);
  };

  const progressDegrees = Math.max(0, Math.min(360, holdProgress * 360));

  return (
    <div className="h-16 w-18 perspective-distant 2xl:h-44 2xl:w-30" {...props}>
      <FollowerPointerCard
        className="z-50 h-full w-full"
        title={char.name}
        style={{
          zIndex: 900 - index,
        }}
        cursor={false}
      >
        <motion.div
          ref={cardRef}
          className={cn(
            "group relative flex h-full w-full flex-col items-center justify-center rounded-3xl bg-linear-to-b select-none hover:cursor-pointer",
            className,
          )}
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => {
            endHold();
            resetTilt();
          }}
          onPointerCancel={() => {
            endHold();
            resetTilt();
          }}
          onClick={handleClick}
          style={{
            rotateX: springRotateX,
            rotateY: springRotateY,
            transformStyle: "preserve-3d",
          }}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          {holdProgress > 0.05 ? (
            <div
              className="pointer-events-none absolute -inset-1 z-50 rounded-[1.65rem] 2xl:z-0"
              style={{
                background: `conic-gradient(from -90deg, rgba(250, 204, 21, 0.95) ${progressDegrees}deg, rgba(250, 204, 21, 0.15) ${progressDegrees}deg 360deg)`,
                boxShadow: "0 0 18px rgba(250, 204, 21, 0.45)",
              }}
            />
          ) : null}

          <motion.div
            className="relative h-full w-full"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: isTurnt ? 180 : 0 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="relative h-24 w-16 overflow-hidden rounded-2xl border border-red-200/70 bg-slate-950 shadow-[0_0_0_1px_rgba(251,113,133,0.2),0_10px_24px_rgba(2,6,23,0.45)] 2xl:h-40 2xl:w-28">
                <div className="absolute inset-0.5 rounded-xl border border-red-100/25" />
                <div className="absolute inset-1 rounded-[0.7rem] border border-white/10" />

                <Image
                  alt={char.name + " image"}
                  src={char.image!}
                  width={500}
                  height={800}
                  className="pointer-events-none h-24 w-16 rounded-2xl object-cover 2xl:h-40 2xl:w-28"
                />

                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-white/10" />
                <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
              </div>
            </div>

            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="relative h-24 w-16 overflow-hidden rounded-2xl border border-red-200/65 bg-slate-950 shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_16px_30px_rgba(2,6,23,0.55)] 2xl:h-40 2xl:w-28">
                <div className="absolute inset-0.5 rounded-xl bg-linear-to-b from-slate-800 via-slate-900 to-black" />
                <div className="absolute inset-1 rounded-[0.7rem] border border-red-300/25" />

                <div className="absolute -top-10 -left-7 h-24 w-24 rounded-full bg-cyan-300/15 blur-xl" />
                <div className="absolute -right-10 -bottom-8 h-28 w-28 rounded-full bg-red-300/20 blur-xl" />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] bg-size-[8px_8px] opacity-35" />

                <div className="absolute inset-2 rounded-lg border border-white/15">
                  {/* Center Logo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-slate-900/75">
                      <div className="absolute inset-1 rounded-full border border-red-200/40" />
                      <User2 className="relative h-8 w-8 text-red-100/90" />
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 top-4 text-center text-[9px] font-semibold tracking-[0.22em] text-red-100/90 uppercase">
                  Guessverse
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 text-center text-[8px] tracking-[0.3em] text-cyan-100/80 uppercase">
                  {char.name.split(",")[0]}
                </div>

                {/* Foil Shine effect */}
                <motion.div
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-linear-to-r from-transparent via-white/35 to-transparent mix-blend-screen"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          x: ["-15%", "230%"],
                          opacity: [0, 0.6, 0],
                        }
                  }
                  transition={
                    prefersReducedMotion
                      ? undefined
                      : {
                          duration: 2.2,
                          repeat: Number.POSITIVE_INFINITY,
                          repeatDelay: 3.2,
                          ease: "easeInOut",
                        }
                  }
                />
              </div>
            </div>
          </motion.div>

          {/* {holdProgress > 0.05 && holdProgress < 1 ? (
            <div className="pointer-events-none absolute top-1 left-1 rounded-full bg-yellow-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-black">
              {Math.ceil(((1 - holdProgress) * HOLD_TO_GUESS_MS) / 1000)}s
            </div>
          ) : null} */}
        </motion.div>
      </FollowerPointerCard>
    </div>
  );
}
