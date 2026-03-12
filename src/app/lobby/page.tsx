"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import Loading from "~/components/ui/loading";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import { useParty } from "~/utils/PartyProvider";

export default function Lobby() {
  const {
    roomId,
    playerName,
    roomState,
    connected,
    error,
    playerId,
    leaveRoom,
    startGame,
  } = useParty();

  const router = useRouter();

  useEffect(() => {
    if (!connected) {
      router.push("/");
    }
  }, [connected, router]);

  if (!connected) {
    return <Loading message="Connecting to room..." fullScreen />;
  }

  if (!roomState) {
    return <Loading message="Loading room..." fullScreen />;
  }

  const isHost = roomState.hostId === playerId;

  return (
    <div className="bg-background flex min-h-screen w-full flex-col items-center justify-center">
      <div className="border-accent w-4/5 flex-col items-center justify-center gap-6 rounded-4xl border px-12 pt-5 pb-24">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Room: {roomId}</h1>
          <p className="text-muted-foreground text-sm">
            Share this code with friends to let them join
          </p>
          {error && <p className="text-red-500">{error}</p>}

          <Separator className="mb-5 w-full" />
        </div>
        <div className="flex w-full items-center justify-between gap-4">
          <div className="border-accent flex w-1/5 flex-col gap-2 border-r p-4">
            <h2 className="text-lg font-semibold">
              Players ({roomState.players.filter((p) => p.connected).length}/
              {roomState.players.length})
            </h2>
            <Separator />
            {roomState.players.map((player) => (
              <div key={player.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xl font-semibold",
                    player.connected
                      ? ""
                      : "text-muted-foreground line-through",
                  )}
                >
                  {player.name}
                </span>
                {player.id === roomState.hostId && (
                  <span className="text-base text-yellow-500">★ Host</span>
                )}
                {!player.connected && (
                  <span className="text-xs text-red-400">disconnected</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-between gap-2">
          <Button variant="destructive" onClick={leaveRoom}>
            Leave Room
          </Button>
          {isHost && roomState.status === "waiting" && (
            <Button onClick={() => startGame()} className="text-xl font-bold">
              Start Game
            </Button>
          )}
        </div>

        {roomState.status === "playing" && (
          <Button onClick={() => router.push("/play")}>Go to Game</Button>
        )}
      </div>
    </div>
  );
}
