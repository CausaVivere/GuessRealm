import type { AnimeGameSet } from "~/server/api/utils/jikan";
import { playerColors, type RoomState } from "../../../party/types";

export const demoRoomState = (set: AnimeGameSet): RoomState => ({
  turn: "player-1",
  banned: [],
  status: "playing",
  set,
  turnDurationMs: 120000,
  turnEndsAt: Date.now() + 120000,
  timeRemainingMs: 120000,
  gameStartedAt: Date.now(),
  hostId: "player-1",
  maxGameDurationMs: 3600000,
  maxTurns: 20,
  turnCount: 0,
  winnerId: null,
  drawReason: null,
  players: [
    {
      id: "player-1",
      name: "Alice",
      color: playerColors[0]!,
      connected: true,
      eliminated: false,
      connectionId: "",
      score: 0,
      characterToGuess: 178998,
      turnt: [],
    },
    {
      id: "player-2",
      name: "Kaiser",
      color: playerColors[1]!,
      connected: true,
      eliminated: false,
      connectionId: "",
      score: 0,
      characterToGuess: 164477,
      turnt: [],
    },
    {
      id: "player-3",
      name: "",
      color: playerColors[2]!,
      connected: true,
      eliminated: false,
      connectionId: "",
      score: 0,
      characterToGuess: null,
      turnt: [],
    },
    {
      id: "player-4",
      name: "Dazai",
      color: playerColors[3]!,
      connected: true,
      eliminated: false,
      connectionId: "",
      score: 0,
      characterToGuess: null,
      turnt: [],
    },
  ],
  chat: [],
});

export const demoChatRound1 = [
  {
    id: "msg-1",
    senderId: "player-1",
    content: "Aight guys, is my character from Tokyo Jujutsu High?",
    timestamp: Date.now() - 60000,
  },
  {
    id: "msg-2",
    senderId: "player-3",
    content: "nope!",
    timestamp: Date.now() - 45000,
  },
  {
    id: "msg-3",
    senderId: "player-4",
    content: "idk tbh, maybe??",
    timestamp: Date.now() - 30000,
  },
  {
    id: "msg-4",
    senderId: "player-2",
    content: "nope, not from there :)",
    timestamp: Date.now() - 15000,
  },
  {
    id: "msg-5",
    senderId: "player-1",
    content: "damn it :(",
    timestamp: Date.now() - 10000,
  },
];

export const demoChatRound2 = [
  {
    id: "msg-6",
    senderId: "player-2",
    content: "here we go, does my character have a domain expansion??",
    timestamp: Date.now() - 9000,
  },
  {
    id: "msg-7",
    senderId: "player-1",
    content: "they do not have one :P",
    timestamp: Date.now() - 8000,
  },
  {
    id: "msg-8",
    senderId: "player-4",
    content: "does not look like it, but not 100% sure",
    timestamp: Date.now() - 7000,
  },
  {
    id: "msg-9",
    senderId: "player-3",
    content: "no, but big brain question tho",
    timestamp: Date.now() - 6000,
  },
  {
    id: "msg-10",
    senderId: "player-2",
    content: "next time, it'll work",
    timestamp: Date.now() - 5000,
  },
];

export const rounds = {
  1: {
    chat: [...demoChatRound1],
    turn: "player-1",
    charactersToTurn: [
      164471, 163847, 164472, 164470, 168067, 164482, 203839, 201644,
    ],
  },
  2: {
    chat: [...demoChatRound2],
    turn: "player-2",
    charactersToTurn: [
      164470, 164471, 163847, 164481, 168067, 175198, 40748, 203810, 203839,
    ],
  },
};
