"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useParty } from "~/utils/PartyProvider";
import { useRouter } from "next/navigation";
import Loading from "~/components/ui/loading";
import { DottedGlowBackground } from "~/components/ui/dotted-glow-background";
import { BubbleBackground } from "~/components/animate-ui/components/backgrounds/bubble";
import Image from "next/image";
import { Separator } from "~/components/ui/separator";
import { LightRays } from "~/components/ui/light-rays";

import { api } from "~/trpc/react";
import type { AnimeCharacter } from "~/server/api/utils/jikan";
import { twColor500To700Rgb, twColor500ToRgb } from "~/utils/general";
import type { RoomState } from "../../../party/types";
import { demoRoomState, rounds } from "./demo";
import AnimeCharacterInfo from "./characterInfo";
import SetVisualizer from "./setVisualiser";
import Players from "../play/_components/players";
import Chat from "./chat";
import { set } from "zod";
import { cn } from "~/lib/utils";

export default function DemoSection({ className }: { className?: string }) {
  const [demoState, setDemoState] = useState<RoomState | null>(null);
  const [round, setRound] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const scheduledActionsRef = useRef<
    Array<{
      id: ReturnType<typeof setTimeout>;
      dueAt: number;
      run: () => void;
    }>
  >([]);
  const pausedActionsRef = useRef<
    Array<{ remainingMs: number; run: () => void }>
  >([]);
  const lastPlayedRoundRef = useRef<number | null>(null);

  const clearScheduledActions = useCallback(() => {
    scheduledActionsRef.current.forEach(({ id }) => clearTimeout(id));
    scheduledActionsRef.current = [];
  }, []);

  const scheduleAction = useCallback((delayMs: number, run: () => void) => {
    const dueAt = Date.now() + Math.max(0, delayMs);

    const id = setTimeout(
      () => {
        scheduledActionsRef.current = scheduledActionsRef.current.filter(
          (action) => action.id !== id,
        );
        run();
      },
      Math.max(0, delayMs),
    );

    scheduledActionsRef.current.push({ id, dueAt, run });
  }, []);

  const pauseScheduledActions = useCallback(() => {
    const now = Date.now();
    pausedActionsRef.current = scheduledActionsRef.current.map(
      ({ dueAt, run }) => ({
        remainingMs: Math.max(0, dueAt - now),
        run,
      }),
    );

    clearScheduledActions();
  }, [clearScheduledActions]);

  const resumeScheduledActions = useCallback(() => {
    const paused = pausedActionsRef.current;
    if (paused.length === 0) return;

    paused.forEach(({ remainingMs, run }) => {
      scheduleAction(remainingMs, run);
    });

    pausedActionsRef.current = [];
  }, [scheduleAction]);

  const { data: demoSet } = api.sets.getSpecificAnimeSet.useQuery(
    {
      setId: "852ff584-9d5a-411f-87ad-d791671b4b76",
    },
    {
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  );

  useEffect(() => {
    if (demoSet) {
      clearScheduledActions();
      setDemoState(demoRoomState(demoSet));
      setRound(1);
      lastPlayedRoundRef.current = null;
    }
  }, [demoSet, clearScheduledActions]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.7,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isInView) {
      resumeScheduledActions();
      return;
    }

    pauseScheduledActions();
  }, [isInView, pauseScheduledActions, resumeScheduledActions]);

  useEffect(() => {
    return () => {
      clearScheduledActions();
      pausedActionsRef.current = [];
    };
  }, [clearScheduledActions]);

  const playRound = useCallback(
    (roundNumber: number) => {
      const roundData = rounds[roundNumber as keyof typeof rounds];
      if (!roundData) return;

      clearScheduledActions();

      const preChatDelayMs = 2500;
      const postRoundDelayMs = 1500;
      const messageDelayMs = Math.random() * 500 + 1000;
      const turnDelayMs = 500;
      const chatPhaseMs = roundData.chat.length * messageDelayMs;
      const chatStartOffsetMs = preChatDelayMs;
      const turnsStartOffsetMs = chatStartOffsetMs + chatPhaseMs;

      // Switch to the new round turn immediately; chat starts after preChatDelayMs.
      setDemoState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          turn: roundData.turn,
        };
      });

      roundData.chat.forEach((msg, i) => {
        scheduleAction(chatStartOffsetMs + i * messageDelayMs, () => {
          if (msg) {
            setDemoState((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                chat: [...prev.chat, msg],
              };
            });
          }
        });
      });

      roundData.charactersToTurn.forEach((characterTurn, i) => {
        scheduleAction(turnsStartOffsetMs + i * turnDelayMs, () => {
          if (characterTurn) {
            setDemoState((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                players: prev.players.map((p) => {
                  if (p.id === roundData.turn) {
                    return {
                      ...p,
                      turnt: [...p.turnt, characterTurn],
                    };
                  }
                  return p;
                }),
              };
            });
          }
        });
      });

      const lastTurnOffsetMs =
        roundData.charactersToTurn.length > 0
          ? turnsStartOffsetMs +
            (roundData.charactersToTurn.length - 1) * turnDelayMs
          : turnsStartOffsetMs;
      const totalRoundMs = lastTurnOffsetMs + postRoundDelayMs;
      const nextRound = roundNumber + 1;

      if (rounds[nextRound as keyof typeof rounds]) {
        scheduleAction(totalRoundMs, () => {
          setRound(nextRound);
        });
      }
    },
    [clearScheduledActions, scheduleAction],
  );

  useEffect(() => {
    if (!isInView) return;
    if (!demoState) return;
    if (lastPlayedRoundRef.current === round) return;

    playRound(round);
    lastPlayedRoundRef.current = round;
  }, [isInView, demoState, round, playRound]);

  const currentPlayer = demoState?.players.find(
    (p) => p.id === demoState?.turn,
  );

  const characterToGuess = demoState?.set?.characters.find(
    (c) => c.id === currentPlayer?.characterToGuess,
  ) as AnimeCharacter;

  const accent = twColor500ToRgb(currentPlayer?.color ?? "gray-500");
  const bgAccent = twColor500To700Rgb(currentPlayer?.color ?? "gray-500");

  if (!demoState || !demoSet) {
    return (
      <div ref={containerRef} className={cn("w-full", className)}>
        <div className="flex min-h-200 w-full min-w-430 items-center justify-center rounded-xl">
          <Loading message="Loading demo..." />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full flex-row items-center justify-center",
        className,
      )}
      style={
        {
          "--accent": accent,
          "--bgAccent": bgAccent,
        } as CSSProperties
      }
    >
      <div className="flex w-full gap-5">
        <div className="flex h-full w-60 flex-col items-center justify-center gap-12 2xl:w-100">
          <div className="z-20 flex max-h-110 flex-col items-center justify-center 2xl:max-h-none">
            <p className="mb-5 text-xl font-semibold">Character to Guess:</p>
            <AnimeCharacterInfo
              className="bg-background/20 no-scrollbar h-full max-h-80 overflow-y-auto border-[rgb(var(--accent)/0.6)] backdrop-blur-xl 2xl:max-h-none"
              character={characterToGuess!}
            />
          </div>
        </div>

        <SetVisualizer
          set={demoState.set!}
          inGame={false}
          turnChangeToken={demoState.turn ?? undefined}
          turnLabel={currentPlayer?.name ?? "Unknown"}
          className={"h-full max-w-150 rounded-3xl p-2 2xl:max-w-none"}
          myTurn={false}
          demoState={demoState}
        />
      </div>
      <div className="z-20 ml-0 flex h-120 min-h-0 w-60 flex-col items-center gap-2 2xl:-ml-18 2xl:h-192 2xl:w-120 2xl:items-stretch">
        <Players
          className="h-auto max-h-64 w-full shrink-0 overflow-y-auto"
          demoState={demoState}
        />
        <Chat
          className="bg-background/40 max-h-100 min-h-0 w-60 flex-1 border-[rgb(var(--accent)/0.8)] backdrop-blur-xl 2xl:max-h-none 2xl:w-100"
          accent={accent}
          demoState={demoState}
        />
      </div>
    </div>
  );
}
