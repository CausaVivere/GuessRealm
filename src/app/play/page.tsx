"use client";

import { useParty } from "~/utils/PartyProvider";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import Loading from "~/components/ui/loading";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import SetVisualizer from "../_components/setVisualiser";
import { cn } from "~/lib/utils";
import { ChevronLeft } from "lucide-react";
import AnimeCharacterInfo from "../_components/characterInfo";
import type { AnimeCharacter } from "~/server/api/utils/jikan";
import Chat from "../_components/chat";
import EndScreen from "../_components/endScreen";
import DrawScreen from "../_components/drawScreen";
import EliminationScreen from "../_components/eliminationScreen";
import Players from "./_components/players";
import { twColor500To700Rgb, twColor500ToRgb } from "~/utils/general";
import { Instructions } from "./_components/instructions";

export default function PlayPage() {
  const [gameOver, setGameOver] = useState(false);
  const [showElimination, setShowElimination] = useState(false);

  const {
    roomState,
    roomId,
    connected,
    playerId,
    send,
    leaveRoom,
    endTurn,
    player,
    incorrectGuess,
    clearIncorrectGuess,
  } = useParty();
  const router = useRouter();

  const handleCloseElimination = useCallback(() => {
    setShowElimination(false);
    clearIncorrectGuess();
  }, [clearIncorrectGuess]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingSeconds = useMemo(() => {
    if (!roomState?.turnEndsAt) return null;
    return Math.max(0, Math.ceil((roomState.turnEndsAt - now) / 1000));
  }, [roomState?.turnEndsAt, now]);

  const gameTimeLeftSeconds = useMemo(() => {
    if (!roomState?.gameStartedAt) return null;
    const elapsed = now - roomState.gameStartedAt;
    return Math.max(
      0,
      Math.ceil((roomState.maxGameDurationMs - elapsed) / 1000),
    );
  }, [roomState?.gameStartedAt, roomState?.maxGameDurationMs, now]);

  const turnsLeft = useMemo(() => {
    if (!roomState) return null;
    return Math.max(0, roomState.maxTurns - roomState.turnCount);
  }, [roomState]);

  useEffect(() => {
    if (!roomId) {
      router.push("/");
    }
  }, [roomId, router]);

  useEffect(() => {
    // Set background video playback rate
    const video = document.getElementById("bgvid") as HTMLVideoElement | null;
    if (video) {
      video.playbackRate = 0.75;
    }
  }, []);

  useEffect(() => {
    if (roomState?.status === "finished" || roomState?.winnerId) {
      setGameOver(true);
    } else if (roomState?.status === "playing") {
      setGameOver(false);
    }
  }, [roomState?.status, roomState?.winnerId]);

  useEffect(() => {
    if (!incorrectGuess) return;
    if (roomState?.status === "finished") return;
    setShowElimination(true);
  }, [incorrectGuess, roomState?.status]);

  useEffect(() => {
    if (!gameOver) return;
    setShowElimination(false);
    clearIncorrectGuess();
  }, [gameOver, clearIncorrectGuess]);

  // Not in a room — redirect to home
  if (!roomId) {
    return <Loading message="Joining room..." fullScreen />;
  }

  if (!roomState) {
    return <Loading message="Reconnecting to room..." fullScreen />;
  }

  // Still in lobby — go back
  if (roomState.status === "waiting" && !gameOver) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg">Waiting for the host to start the game...</p>
        <Button variant="game-danger" onClick={() => router.push("/")}>
          Back to Lobby
        </Button>
      </div>
    );
  }

  const set = roomState.set!;

  const myTurn = roomState.turn === playerId;
  const currentPlayer = roomState.players.find((p) => p.id === roomState.turn);
  const characterToGuess = set.characters.find(
    (c) => c.id === currentPlayer?.characterToGuess,
  ) as AnimeCharacter;

  const canMakeGuess =
    myTurn &&
    remainingSeconds !== null &&
    player?.turnt.length === set.characters.length - 1;

  const guessedCharacterId =
    set.characters.find((c) => !player?.turnt.includes(c.id))?.id ?? null;

  const isDraw = roomState.status === "finished" && roomState.winnerId === null;

  const accent = twColor500ToRgb(
    currentPlayer?.color ?? player?.color ?? "gray-500",
  );
  const bgAccent = twColor500To700Rgb(
    currentPlayer?.color ?? player?.color ?? "gray-500",
  );

  // ─── Game is playing ────────────────────────────────────────
  return (
    <div
      className="short:max-h-screen flex max-h-screen min-h-screen flex-col items-center justify-start gap-6 overflow-hidden pt-[10vh]"
      style={
        {
          "--accent": accent,
          "--bgAccent": bgAccent,
        } as CSSProperties
      }
    >
      {/* {!connected && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-200 backdrop-blur-md">
          Reconnecting... you can continue once connection is restored.
        </div>
      )} */}
      <div className="flex w-full max-w-3xl items-center justify-center gap-5 px-4">
        <div className="text-3xl font-bold">
          {currentPlayer?.name ?? "—"}
          {roomState.turn === playerId ? " (you)" : ""}
        </div>
        <div className="text-3xl font-bold text-yellow-500">
          {remainingSeconds != null ? `${remainingSeconds}s` : "—"}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/85 uppercase">
          <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 tracking-wide backdrop-blur-3xl">
            Time left:{" "}
            {gameTimeLeftSeconds != null
              ? `${Math.floor(gameTimeLeftSeconds / 60)}m ${gameTimeLeftSeconds % 60}s`
              : "—"}
          </span>
          <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 tracking-wide backdrop-blur-3xl">
            Turns left: {turnsLeft ?? "—"}
          </span>
        </div>
      </div>

      <div className="flex h-full flex-row items-start justify-center">
        <div className="flex w-full gap-5">
          <div className="flex h-full w-60 flex-col items-center justify-center gap-12 2xl:w-100">
            {!myTurn ? (
              <div className="short:max-h-110 z-20 flex max-h-110 flex-col items-center justify-center 2xl:max-h-none">
                <p className="mb-5 text-xl font-semibold">
                  Character to Guess:
                </p>
                <AnimeCharacterInfo
                  className="bg-background/20 no-scrollbar short:max-h-80 h-full max-h-80 overflow-y-auto border-[rgb(var(--accent)/0.6)] backdrop-blur-xl 2xl:max-h-none"
                  character={characterToGuess!}
                />
              </div>
            ) : (
              <Instructions className="border-[rgb(var(--accent)/0.6)]2 short:h-80 z-20 h-80 w-60 2xl:h-full 2xl:w-100" />
            )}

            <div className="flex h-20 flex-col gap-8">
              <Button
                variant="game"
                onClick={(e) => {
                  e.preventDefault();
                  endTurn();
                }}
                className={cn(
                  "short:h-12 short:text-xl h-12 w-40 text-xl font-bold 2xl:h-24 2xl:w-64 2xl:text-4xl",
                  {
                    hidden: roomState?.turn !== playerId,
                  },
                )}
              >
                END TURN
              </Button>
              <Button
                variant="game-gold"
                onClick={() => {
                  if (!guessedCharacterId) return;
                  send({ type: "makeGuess", characterId: guessedCharacterId });
                }}
                className={cn(
                  "short:h-12 short:text-xl h-12 w-40 text-xl font-bold 2xl:h-24 2xl:w-64 2xl:text-4xl",
                  {
                    hidden: !canMakeGuess || !guessedCharacterId,
                  },
                )}
              >
                Make Guess
              </Button>
            </div>
          </div>

          <SetVisualizer
            set={set}
            inGame={true}
            turnChangeToken={roomState.turn ?? undefined}
            turnLabel={currentPlayer?.name ?? "Unknown"}
            className={"h-full max-w-150 rounded-3xl p-2 2xl:max-w-none"}
            myTurn={myTurn}
          />
        </div>
        <div className="short:h-120 z-20 mt-6 ml-0 flex h-120 min-h-0 w-60 flex-col items-center gap-2 2xl:-ml-18 2xl:h-192 2xl:w-120 2xl:items-stretch">
          <Players className="h-auto max-h-64 w-full shrink-0 overflow-y-auto" />
          <Chat
            className="bg-background/40 max-h-100 min-h-0 w-60 flex-1 border-[rgb(var(--accent)/0.8)] backdrop-blur-xl 2xl:max-h-none 2xl:w-100"
            accent={accent}
          />
        </div>
      </div>

      <Button
        variant="game-danger"
        onClick={() => {
          leaveRoom();
          router.push("/");
        }}
        className="fixed top-5 left-5 z-50 h-12 text-lg"
      >
        <ChevronLeft />
        Leave Game
      </Button>

      <div
        className={
          gameOver || (showElimination && !!incorrectGuess)
            ? "absolute inset-0 z-50 flex items-center justify-center"
            : "hidden"
        }
      >
        {gameOver && isDraw ? <DrawScreen /> : null}
        {gameOver && !isDraw ? <EndScreen /> : null}
        {!gameOver && showElimination && incorrectGuess ? (
          <EliminationScreen
            message={incorrectGuess.message}
            guessedChar={incorrectGuess.characterId}
            eliminatedPlayerId={incorrectGuess.playerId}
            eliminatedName={incorrectGuess.playerName}
            onClose={handleCloseElimination}
          />
        ) : null}
      </div>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="playsInline absolute inset-0 z-0 max-h-screen min-h-screen min-w-screen overflow-clip blur-xl">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            id="bgvid"
          >
            <source src="/assets/smoke2.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div
            className="absolute inset-0 z-0 min-h-screen min-w-screen mix-blend-overlay transition-colors duration-1500 ease-in-out"
            style={{ backgroundColor: "rgb(var(--bgAccent))" }}
          ></div>
        </div>
        <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#000000_1px,transparent_1px)] bg-size-[16px_16px]"></div>
      </div>
    </div>
  );
}
