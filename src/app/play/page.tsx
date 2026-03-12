"use client";

import { useParty } from "~/utils/PartyProvider";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import Loading from "~/components/ui/loading";
import { useEffect } from "react";

export default function PlayPage() {
  const { roomState, roomId, connected, playerId, send, leaveRoom } =
    useParty();
  const router = useRouter();

  useEffect(() => {
    if (!roomId) {
      router.push("/");
    }
  }, [roomId, router]);

  // Not in a room — redirect to home
  if (!roomId) {
    return <Loading message="Joining room..." fullScreen />;
  }

  if (!connected || !roomState) {
    return <Loading message="Reconnecting to room..." fullScreen />;
  }

  // Still in lobby — go back
  if (roomState.status === "waiting") {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg">Waiting for the host to start the game...</p>
        <Button variant="secondary" onClick={() => router.push("/")}>
          Back to Lobby
        </Button>
      </div>
    );
  }

  // ─── Game is playing ────────────────────────────────────────
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">Game in progress</h1>
      <p className="text-muted-foreground">Room: {roomId}</p>

      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Scoreboard</h2>
        {roomState.players
          .sort((a, b) => b.score - a.score)
          .map((player) => (
            <div key={player.id} className="flex items-center gap-2">
              <span className={player.connected ? "" : "text-muted-foreground"}>
                {player.name}
              </span>
              <span className="font-mono text-sm">{player.score}</span>
              {player.id === playerId && (
                <span className="text-xs text-blue-400">(you)</span>
              )}
            </div>
          ))}
      </div>

      {/* TODO: game grid, guessing UI, etc. */}

      <Button
        variant="secondary"
        onClick={() => {
          leaveRoom();
          router.push("/");
        }}
      >
        Leave Game
      </Button>
    </div>
  );
}
