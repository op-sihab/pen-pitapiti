"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { OnlineLobby } from "./OnlineLobby";
import OnlineHUD from "./OnlineHUD";
import { multiplayer, type PenLoadout } from "@/lib/multiplayer";
// Importing the bridge registers the global typings for `window.__penFight`.
import { loadEngine } from "@/lib/engine-bridge";

export default function PenFightGame() {
  const mounted = useRef(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [initialRoom, setInitialRoom] = useState<string | undefined>(undefined);
  const [isOnlineMatch, setIsOnlineMatch] = useState(false);
  const [onlineRoomCode, setOnlineRoomCode] = useState("");
  const [myPlayerIndex, setMyPlayerIndex] = useState<0 | 1>(0);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [myName, setMyName] = useState("Player");
  const [opponentName, setOpponentName] = useState("Opponent");

  // Load game engine script
  useEffect(() => {
    if (mounted.current || typeof window === "undefined") return;
    mounted.current = true;

    // Register global trigger to open online lobby modal from game menu
    window.__openOnlineLobby = () => {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("room")) {
          url.searchParams.delete("room");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        }
      } catch {}
      setInitialRoom(undefined);
      setIsLobbyOpen(true);
    };

    // Auto-open lobby if ?room= parameter exists in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get("room");
    if (roomParam) {
      setInitialRoom(roomParam.toUpperCase());
      setIsLobbyOpen(true);
    }

    void loadEngine().catch((err) => {
      console.error("[pen-fight]", err);
    });
  }, []);

  // Sync "picking" body class and hide main-menu when online lobby is open
  useEffect(() => {
    const menuEl = document.querySelector("#main-menu");
    if (isLobbyOpen && !isOnlineMatch) {
      document.body.classList.add("picking");
      if (menuEl) menuEl.setAttribute("hidden", "");
    } else if (!isOnlineMatch) {
      document.body.classList.remove("picking");
      if (menuEl) menuEl.removeAttribute("hidden");
    }
  }, [isLobbyOpen, isOnlineMatch]);

  // Monitor active player in match for online turn indicator
  useEffect(() => {
    if (!isOnlineMatch) {
      document.body.classList.remove("is-online-match");
      return;
    }
    document.body.classList.add("is-online-match");

    const interval = setInterval(() => {
      if (window.__penFight?.match) {
        const active = window.__penFight.match.active;
        setIsMyTurn(active === myPlayerIndex);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      document.body.classList.remove("is-online-match");
    };
  }, [isOnlineMatch, myPlayerIndex]);

  const handleLeaveOnlineMatch = useCallback(() => {
    multiplayer.leaveRoom();
    setIsOnlineMatch(false);
    setOnlineRoomCode("");
    window.__penFightOnline = undefined;

    // Return to main menu cleanly via engine exit
    if (window.__penFight?.leaveMatch) {
      window.__penFight.leaveMatch();
    } else if (window.__penFight?.menu) {
      window.__penFight.menu.home();
    }
  }, []);

  const handleMatchStart = useCallback(
    (
      loadouts: [PenLoadout, PenLoadout],
      names: [string, string],
      desk: string,
      seed: number
    ) => {
      // The service already assigned our player slot: host is 0, guest is 1.
      // Never derive it from the payload — both clients receive the same one.
      const myIndex: 0 | 1 = multiplayer.myPlayerIndex;
      const landscapeStart = false;

      setIsOnlineMatch(true);
      setOnlineRoomCode(multiplayer.roomCode || "ONLINE");
      setMyPlayerIndex(myIndex);
      setIsMyTurn(myIndex === 0);

      const resolvedNames: [string, string] = names;

      const myName = myIndex === 0 ? resolvedNames[0] : resolvedNames[1];
      const oppName = myIndex === 0 ? resolvedNames[1] : resolvedNames[0];
      setMyName(myName);
      setOpponentName(oppName);

      // Configure online hook for engine
      window.__penFightOnline = {
        isOnline: true,
        myPlayerIndex: myIndex,
        myName: myName,
        opponentName: oppName,
        sendAim: (press, current, aim) => multiplayer.sendAim(press, current, aim),
        sendAimCancel: () => multiplayer.sendAimCancel(),
        sendShoot: (shot) => multiplayer.sendShoot(shot),
        sendStateSync: (state) => multiplayer.sendStateSync(state),
        sendNextMatch: (seed) => multiplayer.sendNextMatch(seed),
      };

      // Connect remote network events to local game instance
      multiplayer.onRemoteAim = (data) => {
        window.__penFight?.onRemoteAim(data);
      };
      multiplayer.onRemoteAimCancel = () => {
        window.__penFight?.onRemoteAimCancel();
      };
      multiplayer.onRemoteShoot = (data) => {
        window.__penFight?.onRemoteShoot(data);
      };
      multiplayer.onRemoteStateSync = (data) => {
        window.__penFight?.onRemoteStateSync(data);
      };
      multiplayer.onRemoteNextMatch = (seed) => {
        window.__penFight?.onRemoteNextMatch?.(seed);
      };
      multiplayer.onOpponentLeft = () => {
        alert("Opponent has left the room.");
        handleLeaveOnlineMatch();
      };

      // Launch the desk match in game engine with player names
      if (window.__penFight?.startOnlineGame) {
        window.__penFight.startOnlineGame(loadouts, myIndex, desk, seed, landscapeStart, resolvedNames);
      }
    },
    [handleLeaveOnlineMatch]
  );

  return (
    <>
      {/* Online HUD Bar (Active when in online match) */}
      {isOnlineMatch && (
        <>
          <style>{`
            body.is-online-match .game-bar,
            body.is-online-match .turn-pill,
            body.is-online-match #turn-pill,
            body.is-online-match #turn-hint,
            body.is-online-match #pause-button,
            body.is-online-match .pause-key,
            body.is-online-match #status,
            body.is-online-match .hot-seat {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
              position: absolute !important;
              top: -9999px !important;
              left: -9999px !important;
              height: 0 !important;
              width: 0 !important;
              overflow: hidden !important;
            }
          `}</style>
          <OnlineHUD
            roomCode={onlineRoomCode}
            isMyTurn={isMyTurn}
            myPlayerIndex={myPlayerIndex}
            myName={myName}
            opponentName={opponentName}
            onLeave={handleLeaveOnlineMatch}
          />
        </>
      )}

      {isLobbyOpen && !isOnlineMatch && (
        <OnlineLobby
          initialRoom={initialRoom}
          onMatchStart={(l, n, d, s) => {
            handleMatchStart(l, n, d, s);
          }}
          onLeaveRoom={() => {
            setInitialRoom(undefined);
            try {
              const url = new URL(window.location.href);
              if (url.searchParams.has("room")) {
                url.searchParams.delete("room");
                window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
              }
            } catch {}
          }}
          onCancel={() => {
            setIsLobbyOpen(false);
            setInitialRoom(undefined);
            try {
              const url = new URL(window.location.href);
              if (url.searchParams.has("room")) {
                url.searchParams.delete("room");
                window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
              }
            } catch {}
            document.body.classList.remove("picking");
            const menuEl = document.querySelector("#main-menu");
            if (menuEl) menuEl.removeAttribute("hidden");
            if (window.__penFight?.menu) {
              const m = window.__penFight.menu as any;
              if (typeof m.show === "function") {
                m.show();
              } else if (typeof m.refresh === "function") {
                m.refresh();
              }
            }
          }}
        />
      )}

      <main>
        <header className="masthead">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true"></span>
            <div>
              <span data-i18n="brand.name"></span>
              <span className="edition" data-i18n="brand.edition"></span>
            </div>
          </div>
          <div className="header-actions">
            <span className="mode"></span>
            <button
              id="settings-toggle"
              className="gear-pill"
              type="button"
              aria-haspopup="dialog"
              aria-expanded="false"
              aria-controls="settings-panel"
              data-i18n-label="settings.open"
            >
              <span data-icon="settings" aria-hidden="true"></span>
            </button>
          </div>
        </header>

        <section className="intro" data-i18n-label="intro.label">
          <div>
            <p className="eyebrow" data-i18n="intro.eyebrow"></p>
            <h1 data-i18n="intro.title"></h1>
          </div>
          <p className="intro-note" data-i18n="intro.note"></p>
        </section>

        <section id="main-menu"></section>

        {/* Native picker host MUST stay mounted at all times so engine references never detach */}
        <section id="pen-picker" hidden data-i18n-label="pick.roster"></section>

        <section className="play-area" data-i18n-label="game.label" hidden>
          <div className="game-bar">
            <span id="turn-pill" className="turn-pill" data-player="0">
              <span data-icon="pen" aria-hidden="true"></span>
              <span className="turn-copy">
                <span id="turn-label"></span>
              </span>
            </span>
            <p id="turn-hint" className="turn-hint" aria-hidden="true"></p>
            <span id="status" role="status" aria-live="polite"></span>
            <span className="hot-seat" data-i18n="hud.hotSeat"></span>
            <button
              id="pause-button"
              className="pause-key"
              type="button"
              aria-haspopup="dialog"
              data-i18n-label="pause.open"
            >
              <span data-icon="pause" aria-hidden="true"></span>
            </button>
          </div>
          <div id="arena">
            <p id="loading" data-i18n="game.loading">Setting the desk...</p>
          </div>
          <p id="handoff" className="handoff" aria-hidden="true"></p>
          <p id="desk-banner" className="desk-banner" aria-hidden="true"></p>
          <div id="result" className="result" hidden></div>
          <div className="game-bottom" role="group" data-i18n-label="board.label"></div>
        </section>

        <footer>
          <p>
            <b data-step="1"></b> <span data-i18n="controls.hold"></span>{" "}
            <b data-step="2"></b> <span data-i18n="controls.aim"></span>{" "}
            <b data-step="3"></b> <span data-i18n="controls.release"></span>
          </p>
          <p data-i18n="controls.tip"></p>
        </footer>
      </main>

      <div
        id="desk-loader"
        className="desk-loader"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        aria-labelledby="desk-loader-text"
        hidden
      >
        <div className="loader-card">
          <span className="loader-mark" aria-hidden="true"></span>
          <span className="loader-pen" aria-hidden="true"></span>
          <p id="desk-loader-text" data-i18n="loader.text"></p>
        </div>
      </div>
    </>
  );
}
