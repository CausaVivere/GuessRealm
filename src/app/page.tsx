"use client";

import { useState, useEffect, type CSSProperties } from "react";
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
import AnimeCharacterInfo from "./_components/characterInfo";
import SetVisualizer from "./_components/setVisualiser";
import Players from "./play/_components/players";
import Chat from "./_components/chat";
import { api } from "~/trpc/react";
import { demoRoomState } from "./_components/demo";
import type { AnimeCharacter } from "~/server/api/utils/jikan";
import type { RoomState } from "../../party/types";
import { twColor500To700Rgb, twColor500ToRgb } from "~/utils/general";
import DemoSection from "./_components/demoSection";
import { SpinningText } from "~/components/ui/spinning-text";

export default function HomePage() {
  const {
    roomId,
    playerName,
    setPlayerName,
    roomState,
    connected,
    error,
    playerId,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
  } = useParty();
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();

  // ─── Already in a room — redirect to lobby ──────────────────
  useEffect(() => {
    if (roomId && connected && roomState) {
      void router.push("/lobby");
    }
  }, [roomId, connected, roomState, router]);

  if (roomId && connected && roomState) {
    return <Loading message="Joining room..." fullScreen />;
  }

  // ─── Connecting... ──────────────────────────────────────────
  if (roomId && !connected && !roomState) {
    return (
      <div className="h-full w-full flex-col">
        <Loading message={`Connecting to room ${roomId}...`} fullScreen />
        <Button
          variant="outline"
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
          onClick={leaveRoom}
        >
          Leave Room
        </Button>
      </div>
    );
  }

  // ─── Not in a room — show create/join ────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="fixed inset-0 select-none">
        <BubbleBackground
          interactive={true}
          className="absolute inset-0 -z-10 flex items-center justify-center opacity-90"
          colors={{
            first: "196,120,255",
            second: "168,85,247",
            third: "139,92,246",
            fourth: "124,58,237",
            fifth: "99,102,241",
            sixth: "56,189,248",
          }}
        />
        <Image
          src="/assets/1.svg"
          alt="Background"
          fill
          sizes="100vw"
          className="pointer-events-none -z-10 object-cover object-center mix-blend-overlay"
        />
      </div>
      <h1 className="z-10 my-36 rounded-xl px-4 py-2 text-4xl font-bold backdrop-blur-sm lg:text-7xl">
        GuessRealm.
      </h1>

      <div className="bg-background/40 mb-42 flex min-h-[75vh] w-full flex-col items-center justify-start rounded-xl pb-26 backdrop-blur-sm md:w-fit">
        <div className="bg-background relative flex w-full flex-col items-center justify-center gap-6 rounded-xl p-8">
          <LightRays className="opacity-50" />
          <Input
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="h-14 w-80 px-5 text-xl md:text-2xl"
            maxLength={20}
          />

          <div className="flex w-80 gap-2">
            <Input
              placeholder="Room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
              className="h-14 w-60 px-5 text-xl md:text-2xl"
              maxLength={14}
            />
            <Button
              disabled={!playerName.trim() || !joinCode.trim()}
              onClick={() => joinRoom(joinCode)}
              className="h-14 w-20 px-5 text-xl"
            >
              Join
            </Button>
          </div>
          <div className="flex w-30 items-center justify-center gap-4 select-none">
            <Separator className="bg-white/50" />
            <span className="text-muted-foreground shrink-0 text-lg italic">
              or
            </span>
            <Separator className="bg-white/50" />
          </div>
          <Button
            className="h-14 w-80 px-5 text-xl"
            disabled={!playerName.trim()}
            onClick={createRoom}
          >
            Create Room
          </Button>
        </div>
        <div className="relative inline-flex w-full flex-col self-center">
          <Image
            src="/assets/2.jpg"
            alt="Background"
            fill
            className="pointer-events-none h-fit overflow-hidden object-cover object-center mix-blend-overlay select-none"
          />
          <div className="relative inline-grid w-full grid-cols-2 items-center justify-center gap-0">
            <div className="pointer-events-none select-none">
              <Image
                src="/assets/nyan.png"
                alt="nyan"
                width={500}
                height={500}
                className="h-60 w-full object-cover object-center mix-blend-overlay"
              />
            </div>
            <div className="bg-background/50 flex h-60 flex-col gap-1 p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold">GuessRealm?</h2>
              <p className="max-w-3xl text-base leading-7 lg:text-lg xl:text-xl">
                GuessRealm is a multiplayer guessing game where you compete
                against friends to try and guess your assigned character from
                anime and manga series. Create or join a room, select a
                character set, and get ready for a fun and challenging
                experience.
              </p>
            </div>
          </div>
          <div className="relative mt-0 inline-grid w-full grid-cols-2 items-center justify-center">
            <div className="bg-background/50 flex h-60 flex-col gap-1 px-8 pt-4 backdrop-blur-sm 2xl:pt-8">
              <h2 className="text-2xl font-semibold">How to Play?</h2>
              <p className="max-w-3xl text-base leading-7 lg:text-lg xl:text-xl">
                Each player gets assigned a unique character to guess.
              </p>
              <p className="max-w-3xl text-base leading-7 lg:text-lg xl:text-xl">
                Players take turns asking yes/no questions to narrow down the
                possibilities. Only one question can be asked per turn, so
                choose wisely!
              </p>
              <p className="max-w-3xl text-base leading-7 lg:text-lg xl:text-xl">
                The first player to guess their character correctly wins the
                round. Guess wrong and you get eliminated!
              </p>
            </div>
            <div className="pointer-events-none select-none">
              <Image
                src="/assets/tomie.png"
                alt="tomie"
                width={500}
                height={500}
                className="h-60 w-full object-cover object-center mix-blend-overlay"
              />
            </div>
          </div>
        </div>
        <DemoSection className="mx-8 mt-20" />

        {/* Powered by section */}
        <div className="mt-36 flex flex-col items-center justify-center gap-6">
          <span className="mb-16 text-4xl">Powered by </span>
          <div className="flex gap-10">
            <a
              href="https://jikan.moe/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition hover:scale-110"
            >
              <Image
                src="/jikan.svg"
                alt="jikan"
                width={500}
                height={500}
                className="pointer-events-none h-20 object-contain select-none"
              />
            </a>
            <a
              href="https://myanimelist.net"
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-block underline transition hover:scale-110"
            >
              <Image
                src="/mal.png"
                alt="myanimelist"
                width={500}
                height={500}
                className="pointer-events-none h-20 object-contain select-none"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-cyan-400/80 mix-blend-screen"
                style={{
                  WebkitMaskImage: "url('/mal.png')",
                  maskImage: "url('/mal.png')",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
            </a>
          </div>
        </div>
      </div>
      {/* footer */}
      <div className="relative z-20 flex min-h-72 w-full items-center justify-between gap-4 bg-black p-8 text-center text-xl text-white">
        <LightRays />
        <div className="pointer-events-none w-62 select-none">
          <Image
            src="/logo.png"
            alt="GuessRealm Logo"
            width={500}
            height={200}
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-center text-4xl">
            Check out the project on github:
          </span>
          <a
            href="https://github.com/CausaVivere/Guessverse"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition hover:scale-110"
          >
            <Image
              src="/github.svg"
              alt="github"
              width={500}
              height={500}
              className="pointer-events-none h-20 object-contain select-none"
            />
          </a>
        </div>

        <SpinningText className="w-62">
          Made by • Causa Vivere • for you •
        </SpinningText>
      </div>
    </div>
  );
}
