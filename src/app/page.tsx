"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useParty } from "~/utils/PartyProvider";
import { useRouter } from "next/navigation";
import Loading from "~/components/ui/loading";
import { DottedGlowBackground } from "~/components/ui/dotted-glow-background";
import { BubbleBackground } from "~/components/animate-ui/components/backgrounds/bubble";
import Image from "next/image";

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
    console.log("HomePage useEffect", {
      roomId,
      connected,
      roomState,
    });
  }, [roomId, connected, roomState, router]);

  if (roomId && connected && roomState) {
    return <Loading message="Joining room..." fullScreen />;
  }

  // ─── Connecting... ──────────────────────────────────────────
  if (roomId && !connected) {
    return (
      <div className="h-full w-full flex-col">
        <Loading message={`Connecting to room ${roomId}...`} fullScreen />;
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
          className="absolute inset-0 -z-10 flex items-center justify-center rounded-xl opacity-90"
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
      <h1 className="z-10 rounded-xl px-4 py-2 text-4xl font-bold backdrop-blur-sm lg:text-7xl">
        GuessRealm.
      </h1>

      <div className="bg-background/60 m-8 flex min-h-[75vh] w-full flex-col items-center justify-start gap-6 rounded-xl p-8 pt-26 backdrop-blur-xl md:w-3xl lg:w-[65vw]">
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
          />
          <Button
            disabled={!playerName.trim() || !joinCode.trim()}
            onClick={() => joinRoom(joinCode)}
            className="h-14 w-20 px-5 text-xl"
          >
            Join
          </Button>
        </div>
        <Button
          className="h-14 w-80 px-5 text-xl"
          disabled={!playerName.trim()}
          onClick={createRoom}
        >
          Create Room
        </Button>
      </div>
    </div>
  );
}
