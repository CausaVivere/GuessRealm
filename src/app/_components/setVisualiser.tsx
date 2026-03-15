import { cn } from "~/lib/utils";
import Image from "next/image";
import type { AnimeCharacter, AnimeGameSet } from "~/server/api/utils/jikan";
import { useParty } from "~/utils/PartyProvider";
import { User2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const HOLD_TO_GUESS_MS = 3000;

export default function SetVisualizer({
  set,
  className,
  inGame,
}: {
  set: AnimeGameSet;
  className?: string;
  inGame?: boolean;
}) {
  const { turnCard, send } = useParty();
  return (
    <div className={cn("grid h-full w-fit grid-cols-6 gap-6", className)}>
      {set.characters.map((char) => (
        <CharacterCard
          key={char.id}
          char={char}
          onTurn={() => {
            if (inGame) {
              turnCard(char.id);
            }
          }}
          onGuess={() => send({ type: "makeGuess", characterId: char.id })}
          inGame={inGame}
        />
      ))}
    </div>
  );
}

export function CharacterCard({
  char,
  onTurn,
  onGuess,
  className,
  inGame,
  ...props
}: {
  char: AnimeCharacter;
  onTurn?: () => void;
  onGuess?: () => void;
  className?: string;
  inGame?: boolean;
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

  const progressDegrees = Math.max(0, Math.min(360, holdProgress * 360));

  return (
    <div
      className={cn(
        "group relative flex h-44 w-30 flex-col items-center justify-center rounded-3xl p-2 hover:cursor-pointer",
        className,
      )}
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerLeave={endHold}
      onPointerCancel={endHold}
      onClick={handleClick}
      {...props}
    >
      {holdProgress > 0.05 ? (
        <div
          className="pointer-events-none absolute -inset-1 rounded-[1.65rem]"
          style={{
            background: `conic-gradient(from -90deg, rgba(250, 204, 21, 0.95) ${progressDegrees}deg, rgba(250, 204, 21, 0.15) ${progressDegrees}deg 360deg)`,
            boxShadow: "0 0 18px rgba(250, 204, 21, 0.45)",
          }}
        />
      ) : null}

      <div className="relative flex h-full w-full items-center justify-center rounded-3xl bg-linear-to-b from-red-950/40 to-zinc-950">
        {!isTurnt ? (
          <Image
            alt={char.name + " image"}
            src={char.image!}
            width={500}
            height={800}
            className="h-40 w-28 rounded-2xl"
          />
        ) : (
          <div className="h-40 w-28 rounded-2xl">
            <User2 className="h-full w-full" color="gray" />
          </div>
        )}
      </div>
      {holdProgress > 0.05 && holdProgress < 1 ? (
        <div className="pointer-events-none absolute top-1 left-1 rounded-full bg-yellow-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-black">
          {Math.ceil(((1 - holdProgress) * HOLD_TO_GUESS_MS) / 1000)}s
        </div>
      ) : null}
    </div>
  );
}
