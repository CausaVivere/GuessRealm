import type * as Party from "partykit/server";
import type { ClientMessage, ServerMessage, Player, RoomState } from "./types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? "";

// Maps connectionId → stable playerId for disconnect handling
type ConnectionMap = Map<string, string>;

// ─── Server ──────────────────────────────────────────────────────
export default class GameRoom implements Party.Server {
  state: RoomState = {
    players: [],
    hostId: null,
    status: "waiting",
    set: null,
  };

  // Track which connection belongs to which player
  connections: ConnectionMap = new Map();

  constructor(readonly room: Party.Room) {}

  // -- A player connects via WebSocket --
  onConnect(conn: Party.Connection) {
    // Don't assign host here — wait for the "join" message
    // which carries the stable playerId
    this.send(conn, { type: "room-state", state: this.state });
  }

  // -- A player sends a message --
  onMessage(raw: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
    } catch {
      return;
    }

    switch (msg.type) {
      case "join":
        this.handleJoin(sender, msg.playerId, msg.playerName);
        break;
      case "start-game":
        this.handleStartGame(sender);
        break;
      case "selected-set":
        this.handleSelectSet(sender, msg.setId);
        break;
      case "guess":
        // TODO: handle guess logic
        break;
    }
  }

  // -- A player disconnects --
  onClose(conn: Party.Connection) {
    const playerId = this.connections.get(conn.id);
    if (!playerId) return;

    this.connections.delete(conn.id);

    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    // Mark as disconnected instead of removing — allows reconnection
    player.connected = false;
    player.connectionId = "";

    this.broadcast({ type: "room-state", state: this.state });
  }

  // ─── Handlers ────────────────────────────────────────────────
  private handleJoin(conn: Party.Connection, playerId: string, name: string) {
    // Track this connection → player mapping
    this.connections.set(conn.id, playerId);

    // First player becomes host
    if (!this.state.hostId) {
      this.state.hostId = playerId;
    }
    // Check if this player already exists (reconnection)
    const existing = this.state.players.find((p) => p.id === playerId);

    if (existing) {
      // Reconnection — update their connection ID and mark as connected
      existing.connectionId = conn.id;
      existing.connected = true;
      existing.name = name; // allow name updates

      this.broadcast({ type: "room-state", state: this.state });
      return;
    }

    // New player — only allowed during waiting
    if (this.state.status !== "waiting") {
      this.send(conn, { type: "error", message: "Game already in progress" });
      return;
    }

    const player: Player = {
      id: playerId,
      connectionId: conn.id,
      name,
      score: 0,
      connected: true,
    };
    this.state.players.push(player);

    // Broadcast full state so all clients get hostId + players in sync
    this.broadcast({ type: "room-state", state: this.state });
  }

  private handleStartGame(conn: Party.Connection) {
    const playerId = this.connections.get(conn.id);

    // Only the host can start
    if (playerId !== this.state.hostId) {
      this.send(conn, {
        type: "error",
        message: "Only the host can start the game",
      });
      return;
    }

    const connectedCount = this.state.players.filter((p) => p.connected).length;
    if (connectedCount < 2) {
      this.send(conn, {
        type: "error",
        message: "Need at least 2 connected players to start",
      });
      return;
    }

    this.state.status = "playing";
    this.broadcast({ type: "room-state", state: this.state });
  }

  private async handleSelectSet(conn: Party.Connection, setId: string) {
    const playerId = this.connections.get(conn.id);
    if (!playerId) return;

    // Only the host can select the set
    if (playerId !== this.state.hostId) {
      this.send(conn, {
        type: "error",
        message: "Only the host can select the character set",
      });
      return;
    }

    try {
      const res = await fetch(
        `${APP_URL}/api/internal/set/${encodeURIComponent(setId)}`,
        { headers: { "x-internal-secret": INTERNAL_SECRET } },
      );

      if (!res.ok) {
        this.send(conn, { type: "error", message: "Character set not found" });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const set = await res.json();
      this.state.set = set;
      this.broadcast({ type: "room-state", state: this.state });
    } catch {
      this.send(conn, {
        type: "error",
        message: "Failed to load character set",
      });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────
  private send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg));
  }
}

GameRoom satisfies Party.Worker;
