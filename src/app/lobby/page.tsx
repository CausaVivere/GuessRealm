"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "~/components/ui/button";
import Loading from "~/components/ui/loading";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import { useParty } from "~/utils/PartyProvider";
import SetVisualizer from "../_components/setVisualiser";
import {
  Cog,
  Crown,
  Gavel,
  Settings,
  SquareArrowRightExit,
  Video,
} from "lucide-react";
import Chat from "../_components/chat";
import { motion, useReducedMotion } from "framer-motion";
import SelectAnimeSet from "./_components/selectAnimeSet";
import { twColor500ToRgb } from "~/utils/general";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/animate-ui/components/radix/dropdown-menu";

export default function Lobby() {
  const [changingSet, setIsChangingSet] = useState(false);
  const {
    roomId,
    playerName,
    roomState,
    connected,
    error,
    playerId,
    isHost,
    leaveRoom,
    startGame,
    send,
  } = useParty();

  const prefersReducedMotion = useReducedMotion();

  const router = useRouter();

  useEffect(() => {
    if (!roomId) {
      router.push("/");
    }
  }, [roomId, router]);

  useEffect(() => {
    if (roomState?.status === "playing") {
      router.push("/play");
    }
  }, [roomState]);

  useEffect(() => {
    setIsChangingSet(false);
  }, [roomState?.set]);

  useEffect(() => {
    // Set background video playback rate
    const video = document.getElementById("bgvid") as HTMLVideoElement | null;
    if (video) {
      video.playbackRate = 0.75;
    }
  }, []);

  if (!roomState) {
    return <Loading message="Connecting to room..." fullScreen />;
  }

  return (
    <div className="flex max-h-screen min-h-screen w-full flex-col items-center justify-center overflow-hidden">
      {/* {!connected && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-200 backdrop-blur-md">
          Reconnecting... gameplay state is preserved.
        </div>
      )} */}
      <div className="border-accent w-full flex-col items-center justify-center gap-6 rounded-4xl border px-5 pt-5 pb-12 backdrop-blur-xl 2xl:w-4/5 2xl:px-12">
        <div className="flex w-full flex-col items-center gap-0 2xl:gap-2">
          <h1 className="short:text-xl text-xl font-bold 2xl:text-3xl">
            Room: {roomId}
          </h1>
          <p className="text-muted-foreground text-sm">
            Share this code with friends to let them join
          </p>
          {error && <p className="text-red-500">{error}</p>}

          <Separator className="mb-5 w-full" />
        </div>
        <div className="min flex w-full items-start justify-between gap-4">
          <div className="border-accent flex h-120 w-2/5 flex-col gap-2 border-r p-2 2xl:h-[60vh]">
            {isHost ?? (
              <p className="text-foreground text-center text-sm font-semibold">
                Click to change set
              </p>
            )}
            {roomState?.set ? (
              <div
                className="border-muted mb-5 flex h-24 w-full flex-row gap-3 rounded-xl border px-5 py-2 hover:cursor-pointer hover:bg-zinc-700"
                onClick={(e) => {
                  e.preventDefault();
                  if (!isHost) return;
                  setIsChangingSet(!changingSet);
                }}
              >
                {roomState.set.img ? (
                  <Image
                    alt={roomState.set.name + "photo"}
                    src={roomState.set.img}
                    width={500}
                    height={500}
                    className="h-20 w-20 rounded-lg"
                  />
                ) : (
                  <Image
                    alt={"GuessRealm logo"}
                    src="/logo.png"
                    width={500}
                    height={500}
                    className="h-20 w-20 rounded-lg"
                  />
                )}
                <div className="flex h-full w-full flex-col items-start justify-center">
                  <h3 className="text-xl font-semibold">
                    {roomState.set.name}
                  </h3>
                  {roomState?.set?.id !== "randomized" && (
                    <>
                      {" "}
                      <p className="text-lg">
                        By user: {roomState.set.creatorName}
                      </p>
                      <p className="text-lg">
                        {roomState.set.plays} plays
                      </p>{" "}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-muted flex h-24 w-full flex-row items-center justify-center gap-3 rounded-xl border px-5 py-2 hover:cursor-pointer hover:bg-zinc-700">
                <div className="border-secondary flex h-20 w-26 items-center justify-center rounded-lg border">
                  <Image
                    alt={"GuessRealm logo"}
                    src="/logo.png"
                    width={500}
                    height={500}
                    className="h-20 w-20 rounded-lg"
                  />
                </div>
                <div className="flex h-full w-full items-center">
                  <h3 className="text-base font-semibold">
                    Waiting for host to choose set
                  </h3>
                </div>
              </div>
            )}

            <h2 className="mt-6 text-lg font-semibold">
              Players ({roomState.players.filter((p) => p.connected).length}/
              {roomState.players.length})
            </h2>
            <Separator />
            {roomState.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-2 text-[rgb(var(--player-rgb))]"
                style={
                  {
                    "--player-rgb": twColor500ToRgb(player.color),
                  } as CSSProperties
                }
              >
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

                {isHost && player.id !== roomState.hostId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Settings className="text-muted-foreground h-6 w-6 transition hover:scale-110 hover:cursor-pointer hover:text-white" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="bg-background/30 backdrop-blur-sm">
                      <DropdownMenuLabel
                        style={
                          {
                            "--player-rgb": twColor500ToRgb(player.color),
                          } as CSSProperties
                        }
                        className="text-lg text-[rgb(var(--player-rgb))]"
                      >
                        {player.name}
                      </DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          className="hover:cursor-pointer"
                          onClick={() =>
                            send({ type: "kick", playerId: player.id })
                          }
                        >
                          <span>
                            <SquareArrowRightExit className="mr-3 inline-block h-4 w-3" />
                            Kick
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="hover:cursor-pointer"
                          onClick={() =>
                            send({ type: "ban", playerId: player.id })
                          }
                        >
                          <span>
                            <Gavel className="mr-3 inline-block h-4 w-3" />
                            Ban
                          </span>
                        </DropdownMenuItem>
                        {/* <DropdownMenuItem>
                          <span>Mute</span>
                        </DropdownMenuItem> */}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {!player.connected && (
                  <span className="text-xs text-red-400">disconnected</span>
                )}
                <p className="ml-auto flex items-center gap-1 text-lg font-bold">
                  {player.score}
                  <Crown className="inline-block h-4 w-4 text-yellow-500" />
                </p>
              </div>
            ))}
          </div>
          <div className="flex h-full w-full flex-col items-center perspective-distant">
            {!roomState.set && !isHost ? (
              <Loading
                message="Waiting for host to select character set..."
                className="m-auto"
              />
            ) : (
              (() => {
                const showSelector = !roomState.set || changingSet;

                if (prefersReducedMotion) {
                  return showSelector ? (
                    <SelectAnimeSet
                      changingSet={changingSet}
                      setIsChangingSet={setIsChangingSet}
                    />
                  ) : (
                    <div className="flex h-full w-full justify-center gap-6">
                      {roomState.set ? (
                        <SetVisualizer className="" set={roomState.set} />
                      ) : null}
                    </div>
                  );
                }

                return (
                  <motion.div
                    className="short:h-120 relative h-120 w-full 2xl:h-200"
                    style={{ transformStyle: "preserve-3d" }}
                    animate={{ rotateY: showSelector ? 180 : 0 }}
                    transition={{ duration: 0.75, ease: "easeInOut" }}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 flex h-full w-full justify-center gap-6",
                        showSelector
                          ? "pointer-events-none"
                          : "pointer-events-auto",
                      )}
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      {roomState.set ? (
                        <SetVisualizer className="" set={roomState.set} />
                      ) : null}
                    </div>

                    <div
                      className={cn(
                        "absolute inset-0 h-full w-full",
                        showSelector
                          ? "pointer-events-auto"
                          : "pointer-events-none",
                      )}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <SelectAnimeSet
                        changingSet={changingSet}
                        setIsChangingSet={setIsChangingSet}
                      />
                    </div>
                  </motion.div>
                );
              })()
            )}
          </div>
          <Chat className="short:h-120 short:w-120 h-120 w-120 2xl:h-192 2xl:w-160" />
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          <Button
            variant="game-danger"
            className="h-12 w-36 text-xl font-semibold"
            onClick={leaveRoom}
          >
            Leave Room
          </Button>
          {isHost && roomState.status === "waiting" && (
            <Button
              variant="game-gold"
              className="short:h-16 h-20 w-96 text-3xl font-bold"
              onClick={() => startGame()}
            >
              Start Game
            </Button>
          )}
          {roomState.status === "playing" && (
            <Button
              variant="game"
              className="short:h-16 h-20 w-96 text-3xl font-bold"
              onClick={() => router.push("/play")}
            >
              Go to Game
            </Button>
          )}
        </div>
      </div>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="playsInline absolute inset-0 z-0 max-h-screen min-h-screen min-w-screen overflow-clip blur-lg">
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
          <div className="absolute inset-0 z-0 min-h-screen min-w-screen bg-emerald-700 mix-blend-overlay"></div>
        </div>
        <div className="absolute inset-0 z-0 h-full w-full bg-[radial-gradient(#000000_1px,transparent_1px)] bg-size-[16px_16px]"></div>
      </div>
    </div>
  );
}
