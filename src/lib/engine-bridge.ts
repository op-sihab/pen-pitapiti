/* --------------------------------------------------------------------------
   Engine bridge — the typed contract with the Pen Fight runtime.

   The game engine ships as a prebuilt ES module at
   `/games/pen-fight/js/game.js`. It cannot be recompiled here (its source,
   localisation bundle and content-hashed assets are not part of this repo),
   so React and the engine meet at exactly one seam: the `window.__penFight`
   global the module publishes once it boots.

   Everything in the app should go through this file rather than reaching for
   `window.__penFight` directly, so the untyped boundary is declared once and
   the rest of the codebase stays type-safe.

   Lifecycle:
     1. <PenFightGame> appends the module <script>.
     2. The engine boots, paints the desk canvas and publishes the global.
     3. `waitForEngine()` resolves; React may now drive the match.

   The global is published asynchronously and the module is imported once per
   document, so every consumer awaits the same promise — booting is idempotent
   and safe to call from multiple components.
   -------------------------------------------------------------------------- */

export interface Vec2 {
  x: number;
  y: number;
}

export interface EngineLoadout {
  pen: string;
  ink?: string;
}

/** Names the engine uses for its desk skins. */
export type DeskName = "clean" | "old" | "mahogany" | "blackboard" | "neon" | "minimal";

export interface EngineApi {
  /** Live match controller; `active` is 0-based player index or -1. */
  match?: { active?: number; [key: string]: unknown };
  view?: unknown;
  input?: unknown;
  series?: unknown;
  menu?: {
    open?: () => void;
    close?: () => void;
    /** Fallback used when `leaveMatch` is unavailable. */
    home?: () => void;
    [key: string]: unknown;
  };
  picker?: unknown;

  /** Renders authentic vector SVG of the pen loadout directly from engine */
  renderHeroSVG?: (
    loadout: { pen: string; ink?: string; sticker?: string; level?: number },
    style?: string
  ) => string;

  /** Adjusts SVG scale, width, height and rotation to fit hero card seamlessly */
  fitHero?: (heroEl: HTMLElement | null) => void;

  /** Native length and thickness specs for a given pen */
  getPenDimensions?: (penId: string) => { length: number; thickness: number };

  /** Start a networked match. `landscapeStart` flips the camera for player 2. */
  startOnlineGame: (
    loadouts: [EngineLoadout, EngineLoadout],
    myIndex: 0 | 1,
    deskName: string,
    seed: number,
    landscapeStart: boolean,
    playerNames?: [string, string]
  ) => void;

  leaveMatch: () => void;
  triggerNextMatch: () => void;
  syncStateAfterTurn: () => void;
  stepFrame?: () => void;

  onRemoteNextMatch?: (seed?: number) => void;
  /** Single payload object, matching `multiplayer.onRemoteAim`. */
  onRemoteAim?: (data: { press: Vec2; current: Vec2; aim?: unknown; player: number }) => void;
  onRemoteAimCancel?: () => void;
  onRemoteShoot?: (shot: unknown) => void;
  onRemoteStateSync?: (state: unknown) => void;
}

declare global {
  interface Window {
    /** Registered by <PenFightGame> so the engine menu can open the lobby. */
    __openOnlineLobby?: () => void;
    __penFight?: EngineApi;
    __penFightOnline?: {
      isOnline: boolean;
      myPlayerIndex: 0 | 1;
      myName?: string;
      opponentName?: string;
      sendAim: (press: Vec2, current: Vec2, aim?: unknown) => void;
      sendAimCancel: () => void;
      sendShoot: (shot: unknown) => void;
      sendStateSync: (state: unknown) => void;
      sendNextMatch?: (seed?: number) => void;
    };
  }
}

const ENGINE_SRC = "/games/pen-fight/js/game.js";
const SCRIPT_ID = "pen-fight-core-engine";

let bootPromise: Promise<EngineApi> | null = null;

/** Poll until the engine publishes its global, or reject on timeout. */
function pollForEngine(timeoutMs = 20000): Promise<EngineApi> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const tick = () => {
      const api = window.__penFight;
      if (api) {
        resolve(api);
        return;
      }
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("Pen Fight engine did not finish booting."));
        return;
      }
      setTimeout(tick, 60);
    };
    tick();
  });
}

/**
 * Inject the engine module and resolve once it is ready.
 * Repeated calls share one promise, so this is safe from any number of effects.
 */
export function loadEngine(): Promise<EngineApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadEngine() must run in the browser."));
  }
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.type = "module";
      script.crossOrigin = "anonymous";
      script.src = ENGINE_SRC;
      document.body.appendChild(script);
    }
    return pollForEngine();
  })();

  return bootPromise;
}

/** The engine if it has already booted, otherwise `undefined`. */
export function getEngine(): EngineApi | undefined {
  return typeof window === "undefined" ? undefined : window.__penFight;
}

/** Tear down the boot state (tests / hot reload). Not used in production. */
export function resetEngineBridge() {
  bootPromise = null;
}
