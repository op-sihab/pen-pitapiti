import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/* ==========================================================================
   ONLINE DUEL — staged connection flow
   --------------------------------------------------------------------------
   The old flow was: create room -> opponent joins -> host presses start ->
   the match begins and *then* both players pick a board and pen. That meant
   nobody could see what the other player was choosing, and the board was
   picked blind by the host.

   This version stages the handshake so configuration happens before the
   match, and both sides see each other live:

     idle ──create──▶ hosted ──guest-join──▶ paired
                        ▲                      │
                        │                   config (both edit loadout/board)
                        │                      │
                        └───── leave ──── armed ┴──both-ready──▶ playing

   Host stays authoritative for the match: it owns the seed and the final
   board/loadout snapshot and broadcasts `match-start` once both players are
   armed. Each side broadcasts its own config as it changes (`config`), and
   `ready` toggles readiness. All state travels in broadcast payloads — there
   is no database.
   ========================================================================== */

export interface PenLoadout {
  pen: string;
  ink?: string;
  sticker?: string;
  style?: string;
  level?: number;
}

/** Everything a player chooses on the pre-match setup screen. */
export interface DuelConfig {
  name: string;
  loadout: PenLoadout;
  /** Desk id from the engine catalog: clean | old | mahogany | blackboard | neon | minimal */
  desk: string;
  /** Board choice unlocked yet? Guests stay locked until the host picks. */
  ready: boolean;
}

export interface PlayerInfo {
  name: string;
  role: "host" | "guest";
  playerIndex: 0 | 1;
  loadout: PenLoadout;
  desk?: string;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "waiting"
  | "paired"
  | "ready"
  | "playing"
  | "ended";

export type DuelPhase = "hosted" | "paired" | "configuring" | "armed" | "playing";

export const BOARD_OPTIONS = [
  { id: "clean", name: "Clean Desk" },
  { id: "old", name: "Old Wood" },
  { id: "mahogany", name: "Mahogany" },
  { id: "blackboard", name: "Blackboard" },
  { id: "neon", name: "Neon Grid" },
  { id: "minimal", name: "Minimal" },
] as const;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  let out = "PF-";
  for (let i = 0; i < 4; i++) {
    out += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return out;
}

export class MultiplayerService {
  private channel: RealtimeChannel | null = null;
  public roomCode: string | null = null;
  public myRole: "host" | "guest" = "host";
  public myPlayerIndex: 0 | 1 = 0;
  public opponentPlayerIndex: 0 | 1 = 1;
  public myInfo: PlayerInfo | null = null;
  public opponentInfo: PlayerInfo | null = null;
  public status: ConnectionStatus = "disconnected";
  public phase: DuelPhase = "hosted";
  public opponentReady = false;
  public myReady = false;

  /* ---- callbacks ------------------------------------------------------- */
  public onStatusChange?: (status: ConnectionStatus) => void;
  public onPhaseChange?: (phase: DuelPhase) => void;
  public onOpponentJoined?: (opponent: PlayerInfo) => void;
  /** Fires whenever the opponent changes board, pen, ink or name. */
  public onOpponentConfig?: (config: DuelConfig) => void;
  public onMatchStart?: (data: {
    loadouts: [PenLoadout, PenLoadout];
    names?: [string, string];
    seed: number;
    desk?: string;
    landscapeStart?: boolean;
  }) => void;
  public onRemoteAim?: (data: {
    press: { x: number; y: number };
    current: { x: number; y: number };
    aim?: any;
    player: number;
  }) => void;
  public onRemoteAimCancel?: () => void;
  public onRemoteShoot?: (data: { shot: any; player: number }) => void;
  public onRemoteStateSync?: (data: any) => void;
  public onRemoteReaction?: (emoji: string) => void;
  public onRematchRequested?: () => void;
  public onRemoteNextMatch?: (seed: number) => void;
  public onOpponentLeft?: () => void;

  private lastAimSent = 0;
  private lastConfigSent = 0;

  /* ---- state helpers --------------------------------------------------- */

  public setStatus(s: ConnectionStatus) {
    if (this.status === s) return;
    this.status = s;
    this.onStatusChange?.(s);
  }

  public setPhase(p: DuelPhase) {
    if (this.phase === p) return;
    this.phase = p;
    this.onPhaseChange?.(p);
  }

  public get isHost() {
    return this.myRole === "host";
  }

  /** True once an opponent is present and both can configure. */
  public get isPaired() {
    return this.opponentInfo !== null && this.roomCode !== null;
  }

  /* ---- room lifecycle -------------------------------------------------- */

  /**
   * Host: entering the online screen creates the room immediately, so there
   * is no separate "Create" button to press.
   */
  public async createRoom(config: DuelConfig): Promise<string> {
    this.leaveRoom({ silent: true });
    const code = randomCode();
    this.roomCode = code;
    this.myRole = "host";
    this.myPlayerIndex = 0;
    this.opponentPlayerIndex = 1;
    this.myInfo = {
      name: config.name || "Player 1",
      role: "host",
      playerIndex: 0,
      loadout: config.loadout,
      desk: config.desk,
    };
    this.opponentInfo = null;
    this.myReady = false;
    this.opponentReady = false;

    this.setStatus("connecting");
    await this.initChannel(code);
    this.setPhase("hosted");
    this.setStatus("waiting");
    return code;
  }

  public async joinRoom(code: string, config: DuelConfig): Promise<boolean> {
    this.leaveRoom({ silent: true });
    const cleanCode = code.trim().toUpperCase();
    this.roomCode = cleanCode;
    this.myRole = "guest";
    this.myPlayerIndex = 1;
    this.opponentPlayerIndex = 0;
    this.myInfo = {
      name: config.name || "Player 2",
      role: "guest",
      playerIndex: 1,
      loadout: config.loadout,
      desk: config.desk,
    };
    this.opponentInfo = null;
    this.myReady = false;
    this.opponentReady = false;

    this.setStatus("connecting");
    await this.initChannel(cleanCode);

    await this.send("guest-join", {
      name: this.myInfo.name,
      loadout: this.myInfo.loadout,
      desk: this.myInfo.desk,
      ready: false,
    });

    return true;
  }

  /**
   * Broadcast my current setup. Called on every board/pen/ink/name change so
   * the opponent preview updates live, before anyone presses start.
   */
  public updateConfig(config: Partial<DuelConfig>, immediate = false) {
    if (!this.myInfo) return;
    if (config.name !== undefined) this.myInfo.name = config.name;
    if (config.loadout) this.myInfo.loadout = { ...this.myInfo.loadout, ...config.loadout };
    if (config.desk !== undefined) this.myInfo.desk = config.desk;

    // Throttle: dragging a board list fires many changes per second.
    const now = performance.now();
    if (!immediate && now - this.lastConfigSent < 60) return;
    this.lastConfigSent = now;

    const payload: DuelConfig = {
      name: this.myInfo.name,
      loadout: this.myInfo.loadout,
      desk: this.myInfo.desk ?? "clean",
      ready: this.myReady,
    };
    this.send("config", payload);
  }

  /** Toggle readiness. When both sides are armed, the host starts. */
  public setReady(ready: boolean) {
    this.myReady = ready;
    this.updateConfig({}, true);
    this.send("ready", { ready, player: this.myPlayerIndex });
    this.maybeStart();
  }

  private maybeStart() {
    if (!this.isHost) return;
    if (!this.myReady || !this.opponentReady) return;
    if (!this.myInfo || !this.opponentInfo) return;
    // Host's desk choice wins for the match; guests are shown it live.
    const desk = this.myInfo.desk || this.opponentInfo.desk || "clean";
    this.startOnlineMatch(desk);
  }

  public startOnlineMatch(deskName = "clean") {
    if (this.myRole !== "host" || !this.myInfo || !this.opponentInfo) return;

    const payload = {
      loadouts: [this.myInfo.loadout, this.opponentInfo.loadout] as [PenLoadout, PenLoadout],
      names: [this.myInfo.name || "Player 1", this.opponentInfo.name || "Player 2"] as [
        string,
        string,
      ],
      seed: Math.floor(Math.random() * 1000000),
      desk: deskName,
      landscapeStart: false,
    };

    this.send("match-start", payload);
    this.setPhase("playing");
    this.setStatus("playing");
    this.onMatchStart?.(payload);
  }

  /* ---- channel --------------------------------------------------------- */

  private send(event: string, payload: any) {
    return this.channel?.send({ type: "broadcast", event, payload });
  }

  private async initChannel(roomCode: string): Promise<void> {
    const channelName = `penfight:${roomCode}`;
    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: `${this.myRole}-${this.myPlayerIndex}` },
      },
    });

    /* Guest announces itself; host replies with its own config. */
    this.channel.on("broadcast", { event: "guest-join" }, ({ payload }) => {
      if (this.myRole !== "host") return;
      this.opponentInfo = {
        name: payload?.name || "Player 2",
        role: "guest",
        playerIndex: 1,
        loadout: payload?.loadout ?? { pen: "gel", ink: "blue" },
        desk: payload?.desk,
      };
      this.onOpponentJoined?.(this.opponentInfo);
      this.onOpponentConfig?.({
        name: this.opponentInfo.name,
        loadout: this.opponentInfo.loadout,
        desk: this.opponentInfo.desk ?? "clean",
        ready: false,
      });
      this.setPhase("paired");
      this.setStatus("ready");

      this.send("host-ack", {
        name: this.myInfo?.name,
        loadout: this.myInfo?.loadout,
        desk: this.myInfo?.desk,
        playerIndex: 0,
      });
      // Our config may have moved on since the room was created; users can
      // edit the board/pen while alone in the room, and broadcast is not
      // replayed — so re-announce the current state once the peer is here.
      this.updateConfig({}, true);
    });

    this.channel.on("broadcast", { event: "host-ack" }, ({ payload }) => {
      if (this.myRole !== "guest") return;
      this.opponentInfo = {
        name: payload?.name || "Player 1",
        role: "host",
        playerIndex: 0,
        loadout: payload?.loadout ?? { pen: "ballpoint", ink: "blue" },
        desk: payload?.desk,
      };
      this.onOpponentJoined?.(this.opponentInfo);
      this.onOpponentConfig?.({
        name: this.opponentInfo.name,
        loadout: this.opponentInfo.loadout,
        desk: this.opponentInfo.desk ?? "clean",
        ready: false,
      });
      this.setPhase("paired");
      this.setStatus("ready");
      // Same reasoning as the host: announce whatever the guest has picked by
      // the time host-ack lands, in case it changed after guest-join was sent.
      this.updateConfig({}, true);
    });

    /* Live setup changes from the opponent. */
    this.channel.on("broadcast", { event: "config" }, ({ payload }) => {
      if (!payload) return;
      if (this.opponentInfo) {
        this.opponentInfo = {
          ...this.opponentInfo,
          name: payload.name ?? this.opponentInfo.name,
          loadout: payload.loadout ?? this.opponentInfo.loadout,
          desk: payload.desk ?? this.opponentInfo.desk,
        };
      } else {
        this.opponentInfo = {
          name: payload.name || (this.isHost ? "Player 2" : "Player 1"),
          role: this.isHost ? "guest" : "host",
          playerIndex: this.opponentPlayerIndex,
          loadout: payload.loadout ?? { pen: "gel" },
          desk: payload.desk,
        };
        this.onOpponentJoined?.(this.opponentInfo);
      }
      this.opponentReady = Boolean(payload.ready);
      this.onOpponentConfig?.({
        name: payload.name ?? "",
        loadout: payload.loadout ?? { pen: "gel" },
        desk: payload.desk ?? "clean",
        ready: Boolean(payload.ready),
      });
      if (this.phase === "hosted") {
        this.setPhase("paired");
        this.setStatus("ready");
      }
      this.maybeStart();
    });

    this.channel.on("broadcast", { event: "ready" }, ({ payload }) => {
      this.opponentReady = Boolean(payload?.ready);
      this.onOpponentConfig?.({
        name: this.opponentInfo?.name ?? "",
        loadout: this.opponentInfo?.loadout ?? { pen: "gel" },
        desk: this.opponentInfo?.desk ?? "clean",
        ready: this.opponentReady,
      });
      this.maybeStart();
    });

    this.channel.on("broadcast", { event: "match-start" }, ({ payload }) => {
      this.setPhase("playing");
      this.setStatus("playing");
      this.onMatchStart?.(payload);
    });

    this.channel.on("broadcast", { event: "aim" }, ({ payload }) => {
      this.onRemoteAim?.(payload);
    });

    this.channel.on("broadcast", { event: "aim-cancel" }, () => {
      this.onRemoteAimCancel?.();
    });

    this.channel.on("broadcast", { event: "shoot" }, ({ payload }) => {
      this.onRemoteShoot?.(payload);
    });

    this.channel.on("broadcast", { event: "state-sync" }, ({ payload }) => {
      this.onRemoteStateSync?.(payload);
    });

    this.channel.on("broadcast", { event: "reaction" }, ({ payload }) => {
      this.onRemoteReaction?.(payload.emoji);
    });

    this.channel.on("broadcast", { event: "rematch-request" }, () => {
      this.onRematchRequested?.();
    });

    this.channel.on("broadcast", { event: "match-next" }, ({ payload }) => {
      this.onRemoteNextMatch?.(payload.seed);
    });

    this.channel.on("broadcast", { event: "leave" }, ({ payload }) => {
      if (payload?.player === this.myPlayerIndex) return;
      this.opponentInfo = null;
      this.opponentReady = false;
      this.setPhase("hosted");
      this.setStatus("waiting");
      this.onOpponentLeft?.();
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => resolve(), 5000);
      this.channel?.subscribe((state) => {
        if (state === "SUBSCRIBED") {
          clearTimeout(timeout);
          resolve();
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          clearTimeout(timeout);
          reject(new Error(`Failed to connect to room channel: ${state}`));
        }
      });
    });
  }

  /* ---- in-match transport --------------------------------------------- */

  public sendAim(press: { x: number; y: number }, current: { x: number; y: number }, aim?: any) {
    const now = performance.now();
    if (now - this.lastAimSent < 35) return; // ~30 fps for smooth preview
    this.lastAimSent = now;
    this.send("aim", { press, current, aim, player: this.myPlayerIndex });
  }

  public sendAimCancel() {
    this.send("aim-cancel", { player: this.myPlayerIndex });
  }

  public sendShoot(shot: any) {
    this.send("shoot", { shot, player: this.myPlayerIndex });
  }

  public sendStateSync(state: any) {
    this.send("state-sync", state);
  }

  public sendReaction(emoji: string) {
    this.send("reaction", { emoji, player: this.myPlayerIndex });
  }

  public sendRematch() {
    this.send("rematch-request", { player: this.myPlayerIndex });
  }

  public sendNextMatch(seed?: number) {
    const nextSeed = typeof seed === "number" ? seed : Math.floor(Math.random() * 1000000);
    this.send("match-next", { seed: nextSeed, player: this.myPlayerIndex });
    return nextSeed;
  }

  /* ---- teardown -------------------------------------------------------- */

  public leaveRoom(opts: { silent?: boolean } = {}) {
    if (this.channel) {
      if (!opts.silent) {
        try {
          this.channel.send({
            type: "broadcast",
            event: "leave",
            payload: { player: this.myPlayerIndex },
          });
        } catch {}
      }
      try {
        supabase.removeChannel(this.channel);
      } catch {}
      this.channel = null;
    }
    this.roomCode = null;
    this.myInfo = null;
    this.opponentInfo = null;
    this.myReady = false;
    this.opponentReady = false;
    this.phase = "hosted";
    if (!opts.silent) this.setStatus("disconnected");
  }
}

export const multiplayer = new MultiplayerService();
