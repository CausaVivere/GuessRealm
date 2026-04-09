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

export default function DemoSection() {
  const [demoState, setDemoState] = useState<RoomState | null>(null);
  const [round, setRound] = useState(1);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastPlayedRoundRef = useRef<number | null>(null);

  const clearScheduledActions = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

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
    return () => {
      clearScheduledActions();
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
        const id = setTimeout(
          () => {
            if (msg) {
              setDemoState((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  chat: [...prev.chat, msg],
                };
              });
            }
          },
          chatStartOffsetMs + i * messageDelayMs,
        );

        timeoutsRef.current.push(id);
      });

      roundData.charactersToTurn.forEach((characterTurn, i) => {
        const id = setTimeout(
          () => {
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
          },
          turnsStartOffsetMs + i * turnDelayMs,
        );

        timeoutsRef.current.push(id);
      });

      const lastTurnOffsetMs =
        roundData.charactersToTurn.length > 0
          ? turnsStartOffsetMs +
            (roundData.charactersToTurn.length - 1) * turnDelayMs
          : turnsStartOffsetMs;
      const totalRoundMs = lastTurnOffsetMs + postRoundDelayMs;
      const nextRound = roundNumber + 1;

      if (rounds[nextRound as keyof typeof rounds]) {
        const id = setTimeout(() => {
          setRound(nextRound);
        }, totalRoundMs);
        timeoutsRef.current.push(id);
      }
    },
    [clearScheduledActions],
  );

  useEffect(() => {
    if (!demoState) return;
    if (lastPlayedRoundRef.current === round) return;

    playRound(round);
    lastPlayedRoundRef.current = round;
  }, [demoState, round, playRound]);

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
      <div className="flex min-h-110 w-full items-center justify-center rounded-xl">
        <Loading message="Loading demo..." />
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-row items-center justify-center"
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
