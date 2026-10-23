"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DESKS,
  getDesk,
  getPen,
  INKS,
  PENS,
  type DeskId,
  type PenId,
} from "@/lib/game-catalog";
import { multiplayer, type DuelConfig, type PenLoadout } from "@/lib/multiplayer";
import { PenArt } from "./ui/PenArt";
import { loadEngine } from "@/lib/engine-bridge";

const PEN_DIMENSIONS: Record<string, { length: number; thickness: number }> = {
  ballpoint: { length: 15, thickness: 1.7 },
  gel: { length: 14.5, thickness: 2.0 },
  click: { length: 14, thickness: 2.0 },
  four: { length: 14.4, thickness: 2.5 },
  fountain: { length: 14.4, thickness: 2.1 },
  marker: { length: 13.7, thickness: 2.4 },
  highlighter: { length: 10.5, thickness: 3.6 },
  metal: { length: 14, thickness: 2.1 },
  laser: { length: 14.2, thickness: 1.9 },
  naruto: { length: 14.8, thickness: 2.2 },
};

const RC = { extraLength: 0.8, height: 4.5 };
function calcHeroFit(e: number, t: number, n: number, r: number) {
  if (!(e >= 8 && t >= 8) || !(n > 0) || !(r > 0)) return null;
  const i = Math.min(36, Math.max(12, (Math.atan2(t, e) * 180) / Math.PI));
  const a = (i * Math.PI) / 180;
  const o = Math.cos(a);
  const s = Math.sin(a);
  const c = n + RC.extraLength;
  const l = Math.min((0.88 * c) / (n * o + r * s) * e, (0.88 * c) / (n * s + r * o) * t);
  if (!(l > 0) || !Number.isFinite(l)) return null;
  const u = (v: number) => Math.round(v * 100) / 100;
  return { width: u(l), height: u(l * RC.height / c), angle: u(i) };
}

function applyHeroFit(heroEl: HTMLElement | null, penId: string) {
  if (!heroEl) return;
  const dims = PEN_DIMENSIONS[penId] || PEN_DIMENSIONS.ballpoint;
  heroEl.style.setProperty("--pen-l", String(dims.length));
  heroEl.style.setProperty("--pen-t", String(dims.thickness));

  const svg = heroEl.querySelector("svg, img.pick-pen-img") as HTMLElement | null;
  if (!svg) return;

  const w = heroEl.clientWidth && heroEl.clientWidth >= 8 ? heroEl.clientWidth : 280;
  const h = heroEl.clientHeight && heroEl.clientHeight >= 8 ? heroEl.clientHeight : 260;
  const fit = calcHeroFit(w, h, dims.length, dims.thickness);
  if (fit) {
    svg.style.width = `${fit.width}px`;
    svg.style.height = `${fit.height}px`;
    svg.style.transform = `rotate(${-fit.angle}deg)`;
  }
}

function injectHeroFit(rawSvg: string, heroEl: HTMLElement | null, penId: string): string {
  if (!rawSvg) return rawSvg;
  const dims = PEN_DIMENSIONS[penId] || PEN_DIMENSIONS.ballpoint;
  const w = heroEl?.clientWidth && heroEl.clientWidth >= 8 ? heroEl.clientWidth : 280;
  const h = heroEl?.clientHeight && heroEl.clientHeight >= 8 ? heroEl.clientHeight : 260;
  const fit = calcHeroFit(w, h, dims.length, dims.thickness);
  if (!fit) return rawSvg;
  const styleStr = `width:${fit.width}px;height:${fit.height}px;transform:rotate(-${fit.angle}deg);transform-origin:center center;`;
  if (rawSvg.includes('style="')) {
    return rawSvg.replace(/style="([^"]*)"/, (_, existing) => `style="${styleStr}${existing}"`);
  }
  return rawSvg.replace("<svg ", `<svg style="${styleStr}" `);
}

/* ==========================================================================
   ONLINE DUEL LOBBY & PICKER
   Matches Image 2 (vs Computer / 2 Player) 100%:
     - Topbar with Back button, "Pick your pen", and Mode chip ("Online Duel")
     - 2-Column .pick-body:
       - Left: .pick-card with level badge, dots, stage, hero pen, arrows, name,
               role, style toggle (Classic/Real), 10 ink swatches with gold ring
       - Right: .pick-side with Name chip, Room Setup/Status (Create / Join buttons),
               Desk Selector, Fight/Ready button
   ========================================================================== */

const LS_NAME = "penfight.name.v2";
const LS_LOADOUT = "penfight.loadout.v2";
const LS_DESK = "penfight.desk.v2";

function readLocal(): { name: string; penId: PenId; ink: string; style: "real" | "cartoon"; desk: DeskId } {
  if (typeof window === "undefined") {
    return { name: "Player", penId: "ballpoint", ink: "blue", style: "real", desk: "old" };
  }
  try {
    const name = localStorage.getItem(LS_NAME) || "Player";
    const rawLoadout = JSON.parse(localStorage.getItem(LS_LOADOUT) || "null") || {};
    const penId: PenId = (rawLoadout.pen as PenId) || "ballpoint";
    const ink: string = rawLoadout.ink || "blue";
    const style: "real" | "cartoon" = rawLoadout.style === "cartoon" ? "cartoon" : "real";
    
    // Check engine settings first, fallback to saved desk or default 'old' (Old Wood)
    let desk: DeskId = "old";
    const rawSettings = JSON.parse(localStorage.getItem("penfight.settings") || "null") || {};
    if (rawSettings.desk && DESKS.some((d) => d.id === rawSettings.desk)) {
      desk = rawSettings.desk as DeskId;
    } else {
      const savedDesk = localStorage.getItem(LS_DESK) as DeskId;
      if (savedDesk && DESKS.some((d) => d.id === savedDesk)) {
        desk = savedDesk;
      }
    }
    return { name, penId, ink, style, desk };
  } catch {
    return { name: "Player", penId: "ballpoint", ink: "blue", style: "real", desk: "old" };
  }
}

export function OnlineLobby({
  initialRoom,
  onMatchStart,
  onLeaveRoom,
  onCancel,
}: {
  initialRoom?: string;
  onMatchStart: (
    loadouts: [PenLoadout, PenLoadout],
    names: [string, string],
    desk: string,
    seed: number
  ) => void;
  onLeaveRoom?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const local = useRef(readLocal());

  const [phase, setPhase] = useState<"idle" | "connecting" | "live" | "error">(
    initialRoom ? "connecting" : "idle"
  );
  const [roomAction, setRoomAction] = useState<"create" | "join">(initialRoom ? "join" : "create");
  const [roomCode, setRoomCode] = useState<string | null>(initialRoom || null);
  const [joinCode, setJoinCode] = useState(initialRoom || "");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Player selections
  const [penIndex, setPenIndex] = useState(() => {
    const idx = PENS.findIndex((p) => p.id === local.current.penId);
    return idx >= 0 ? idx : 0; // default 'ballpoint'
  });
  const [selectedInk, setSelectedInk] = useState(local.current.ink);
  const [selectedStyle, setSelectedStyle] = useState<"real" | "cartoon">(local.current.style);
  const [selectedDesk, setSelectedDesk] = useState<DeskId>(local.current.desk);
  const [playerName, setPlayerName] = useState(local.current.name);
  const [isEditingName, setIsEditingName] = useState(false);

  // Ready & Opponent states
  const [myReady, setMyReady] = useState(false);
  const [opponent, setOpponent] = useState<DuelConfig | null>(null);
  const [opponentReady, setOpponentReady] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);

  // Dynamic engine SVG cache initialized synchronously with authentic engine SVG
  const [heroSvg, setHeroSvg] = useState<string>(() => {
    if (typeof window !== "undefined" && window.__penFight?.renderHeroSVG) {
      try {
        const raw = window.__penFight.renderHeroSVG(
          { pen: local.current.penId, ink: local.current.ink, sticker: "none", level: 1 },
          local.current.style
        );
        if (raw) return injectHeroFit(raw, null, local.current.penId);
      } catch {}
    }
    return "";
  });

  const currentPen = PENS[penIndex];
  const currentDesk = getDesk(selectedDesk);

  const selectPen = (newIndex: number) => {
    setPenIndex(newIndex);
    const pen = PENS[newIndex];
    if (typeof window !== "undefined" && window.__penFight?.renderHeroSVG) {
      try {
        const rawSvg = window.__penFight.renderHeroSVG(
          { pen: pen.id, ink: selectedInk, sticker: "none", level: 1 },
          selectedStyle
        );
        if (rawSvg) {
          const fitted = injectHeroFit(rawSvg, heroRef.current, pen.id);
          setHeroSvg(fitted);
        }
      } catch (e) {
        console.warn("[OnlineLobby] selectPen error", e);
      }
    }
  };

  const prevPen = () => {
    selectPen((penIndex - 1 + PENS.length) % PENS.length);
  };

  const nextPen = () => {
    selectPen((penIndex + 1) % PENS.length);
  };

  const handleInkSelect = (inkId: string) => {
    setSelectedInk(inkId);
    if (typeof window !== "undefined" && window.__penFight?.renderHeroSVG) {
      try {
        const rawSvg = window.__penFight.renderHeroSVG(
          { pen: currentPen.id, ink: inkId, sticker: "none", level: 1 },
          selectedStyle
        );
        if (rawSvg) {
          const fitted = injectHeroFit(rawSvg, heroRef.current, currentPen.id);
          setHeroSvg(fitted);
        }
      } catch (e) {
        console.warn("[OnlineLobby] handleInkSelect error", e);
      }
    }
  };

  const handleCustomColor = (colorHex: string) => {
    setSelectedInk(colorHex);
    if (typeof window !== "undefined" && window.__penFight?.renderHeroSVG) {
      try {
        const rawSvg = window.__penFight.renderHeroSVG(
          { pen: currentPen.id, ink: colorHex, sticker: "none", level: 1 },
          selectedStyle
        );
        if (rawSvg) {
          const fitted = injectHeroFit(rawSvg, heroRef.current, currentPen.id);
          setHeroSvg(fitted);
        }
      } catch (e) {
        console.warn("[OnlineLobby] handleCustomColor error", e);
      }
    }
  };

  const handleStyleSelect = (style: "real" | "cartoon") => {
    setSelectedStyle(style);
    if (typeof window !== "undefined" && window.__penFight?.renderHeroSVG) {
      try {
        const rawSvg = window.__penFight.renderHeroSVG(
          { pen: currentPen.id, ink: selectedInk, sticker: "none", level: 1 },
          style
        );
        if (rawSvg) {
          const fitted = injectHeroFit(rawSvg, heroRef.current, currentPen.id);
          setHeroSvg(fitted);
        }
      } catch (e) {
        console.warn("[OnlineLobby] handleStyleSelect error", e);
      }
    }
  };

  // Immediate SVG render from game engine whenever pen, ink, or style changes
  useEffect(() => {
    let active = true;

    const tryRender = () => {
      if (typeof window !== "undefined" && window.__penFight?.renderHeroSVG) {
        try {
          const svg = window.__penFight.renderHeroSVG(
            { pen: currentPen.id, ink: selectedInk, sticker: "none", level: 1 },
            selectedStyle
          );
          if (svg && active) {
            const fitted = injectHeroFit(svg, heroRef.current, currentPen.id);
            setHeroSvg(fitted);
            return true;
          }
        } catch (e) {
          console.warn("[OnlineLobby] renderHeroSVG error", e);
        }
      }
      return false;
    };

    if (!tryRender()) {
      loadEngine()
        .then(() => {
          if (active) tryRender();
        })
        .catch(() => {});
      const timer = setTimeout(tryRender, 120);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }

    return () => {
      active = false;
    };
  }, [currentPen.id, selectedInk, selectedStyle]);

  // Synchronously fit SVG inside hero stage
  useEffect(() => {
    if (heroRef.current) {
      applyHeroFit(heroRef.current, currentPen.id);
    }
  }, [heroSvg, currentPen.id]);

  // ResizeObserver to keep pen fitting perfectly across viewport resizes
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      applyHeroFit(el, currentPen.id);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [currentPen.id]);

  /* ---- Service callbacks ---------------------------------------------- */
  const startRef = useRef(onMatchStart);
  useEffect(() => {
    startRef.current = onMatchStart;
  }, [onMatchStart]);

  useEffect(() => {
    multiplayer.onOpponentConfig = (cfg) => {
      setOpponent(cfg);
      setOpponentReady(Boolean(cfg.ready));
    };
    multiplayer.onOpponentJoined = (info) => {
      setOpponent({
        name: info.name,
        loadout: info.loadout,
        desk: info.desk || "clean",
        ready: false,
      });
      setOpponentReady(false);
    };
    multiplayer.onOpponentLeft = () => {
      setOpponent(null);
      setOpponentReady(false);
      setMyReady(false);
    };
    multiplayer.onMatchStart = (data) => {
      startRef.current(
        data.loadouts,
        (data.names ?? ["Player 1", "Player 2"]) as [string, string],
        data.desk ?? "clean",
        data.seed
      );
    };

    return () => {
      multiplayer.onOpponentConfig = undefined;
      multiplayer.onOpponentJoined = undefined;
      multiplayer.onOpponentLeft = undefined;
      multiplayer.onMatchStart = undefined;
    };
  }, []);

  /* ---- Host action ---------------------------------------------------- */
  const handleHost = useCallback(async () => {
    setPhase("connecting");
    setError(null);
    try {
      const safeName = playerName.trim() || "Host";
      const code = await multiplayer.createRoom({
        name: safeName,
        loadout: {
          pen: currentPen.id,
          ink: selectedInk,
          style: selectedStyle,
        },
        desk: selectedDesk,
        ready: false,
      });
      setRoomCode(code);
      setPhase("live");

      const url = new URL(window.location.href);
      url.searchParams.set("room", code);
      window.history.replaceState({}, "", url);
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Could not create the room.");
    }
  }, [currentPen.id, playerName, selectedDesk, selectedInk, selectedStyle]);

  /* ---- Join action ---------------------------------------------------- */
  const handleJoin = useCallback(
    async (codeToJoin: string) => {
      if (!codeToJoin.trim()) return;
      setPhase("connecting");
      setError(null);
      try {
        const cleanCode = codeToJoin.trim().toUpperCase();
        const safeName = playerName.trim() || "Guest";
        const ok = await multiplayer.joinRoom(cleanCode, {
          name: safeName,
          loadout: {
            pen: currentPen.id,
            ink: selectedInk,
            style: selectedStyle,
          },
          desk: selectedDesk,
          ready: false,
        });
        if (!ok) throw new Error("Could not join room.");
        setRoomCode(cleanCode);
        setPhase("live");
      } catch (e) {
        setPhase("error");
        setError(e instanceof Error ? e.message : "Could not join that room.");
      }
    },
    [currentPen.id, playerName, selectedDesk, selectedInk, selectedStyle]
  );

  useEffect(() => {
    if (initialRoom && phase === "connecting") {
      void handleJoin(initialRoom);
    }
  }, [initialRoom, handleJoin, phase]);

  /* ---- Push live setup updates to opponent ---------------------------- */
  useEffect(() => {
    if (phase !== "live") return;
    const safeName = playerName.trim() || (multiplayer.isHost ? "Host" : "Guest");

    try {
      localStorage.setItem(LS_NAME, safeName);
      localStorage.setItem(LS_DESK, selectedDesk);
      localStorage.setItem(
        LS_LOADOUT,
        JSON.stringify({ pen: currentPen.id, ink: selectedInk, style: selectedStyle })
      );
    } catch {}

    multiplayer.updateConfig(
      {
        name: safeName,
        desk: selectedDesk,
        loadout: {
          pen: currentPen.id,
          ink: selectedInk,
          style: selectedStyle,
        },
      },
      true
    );
  }, [phase, currentPen.id, selectedInk, selectedStyle, selectedDesk, playerName]);

  const handleToggleReady = () => {
    const next = !myReady;
    setMyReady(next);
    multiplayer.setReady(next);
  };

  const cleanRoomUrl = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("room")) {
          url.searchParams.delete("room");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        }
      }
    } catch {}
  }, []);

  const handleLeaveRoom = useCallback(() => {
    multiplayer.leaveRoom();
    cleanRoomUrl();
    setPhase("idle");
    setRoomCode(null);
    setJoinCode("");
    setRoomAction("create");
    setOpponent(null);
    setMyReady(false);
    setOpponentReady(false);
    setError(null);
    onLeaveRoom?.();
  }, [cleanRoomUrl, onLeaveRoom]);

  const handleBackToMenu = useCallback(() => {
    multiplayer.leaveRoom();
    cleanRoomUrl();
    setPhase("idle");
    setRoomCode(null);
    setJoinCode("");
    setRoomAction("create");
    setOpponent(null);
    setMyReady(false);
    setOpponentReady(false);
    setError(null);
    onLeaveRoom?.();
    if (onCancel) {
      onCancel();
    } else {
      router.replace("/games/pen-fight/");
    }
  }, [cleanRoomUrl, onCancel, onLeaveRoom, router]);

  const copyLink = async () => {
    if (!roomCode) return;
    const url = `${window.location.origin}/games/pen-fight/?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed — copy code manually.");
    }
  };

  const oppPen = opponent?.loadout?.pen ? getPen(opponent.loadout.pen) : null;
  const oppDesk = opponent?.desk ? getDesk(opponent.desk) : null;

  const isDark = typeof document !== "undefined" && (
    document.documentElement.dataset.theme === "dark" ||
    document.documentElement.dataset.theme === "midnight" ||
    document.documentElement.dataset.theme === "cyber" ||
    document.documentElement.dataset.theme === "forest" ||
    (document.documentElement.dataset.theme !== "light" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const activeDeskArt = isDark && currentDesk.darkArt ? currentDesk.darkArt : currentDesk.art;

  return (
    <section
      id="online-lobby"
      className="online-lobby-picker"
      style={{
        display: "flex",
        ["--menu-desk" as string]: `url("${activeDeskArt}")`,
      }}
      aria-label="Online Duel match setup"
    >
      {/* Topbar matching Image 2 */}
      <div className="topbar">
        <button
          id="pick-menu-back"
          className="top-key"
          type="button"
          aria-label="Back"
          onClick={handleBackToMenu}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 id="pick-title">Pick your pen</h1>
        <span className="mode-chip" data-mode="online">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>Online Duel</span>
        </span>
      </div>

      {/* 2-Column pick-body matching Image 2 */}
      <div className="pick-body">
        {/* Left Column: Pen Card */}
        <article className="pick-card" data-style={selectedStyle} aria-roledescription="carousel" aria-label="Pen roster">
          <div className="card-top">
            <span className="level-badge">Lvl 1</span>
            <span className="pick-dots" aria-hidden="true">
              {PENS.map((p, i) => (
                <i
                  key={p.id}
                  className={i === penIndex ? "on" : ""}
                  onClick={() => selectPen(i)}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </span>
            <span className="info-space" />
          </div>

          <div className="pick-stage">
            <button
              type="button"
              id="pick-prev"
              className="pick-arrow prev"
              aria-label="Previous pen"
              onClick={prevPen}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Authentic hero stage with direct SVG matching native */}
            <div
              ref={heroRef}
              className="pick-hero"
              aria-hidden="true"
              data-pen={currentPen.id}
              style={{
                "--pen-l": (PEN_DIMENSIONS[currentPen.id] || PEN_DIMENSIONS.ballpoint).length,
                "--pen-t": (PEN_DIMENSIONS[currentPen.id] || PEN_DIMENSIONS.ballpoint).thickness,
              } as any}
              dangerouslySetInnerHTML={{ __html: heroSvg }}
            />

            <button
              type="button"
              id="pick-next"
              className="pick-arrow next"
              aria-label="Next pen"
              onClick={nextPen}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="pick-name-line" aria-live="polite">
            <h2>{currentPen.name}</h2>
            <span className="sr-only">
              Pen {penIndex + 1} of {PENS.length}
            </span>
          </div>
          <p className="pick-role">{currentPen.tagline}</p>

          {/* Style toggle matching native */}
          <div className="pick-seg" role="radiogroup" aria-label="Style">
            <button
              type="button"
              role="radio"
              data-style="cartoon"
              aria-checked={selectedStyle === "cartoon"}
              tabIndex={selectedStyle === "cartoon" ? 0 : -1}
              onClick={() => handleStyleSelect("cartoon")}
            >
              Classic
            </button>
            <button
              type="button"
              role="radio"
              data-style="real"
              aria-checked={selectedStyle === "real"}
              tabIndex={selectedStyle === "real" ? 0 : -1}
              onClick={() => handleStyleSelect("real")}
            >
              Real
            </button>
          </div>

          {/* 11 Ink Swatches + Custom Color Picker matching native */}
          <div className="pick-ink-row" role="radiogroup" aria-label="Ink color">
            {INKS.map((ink) => {
              const checked = selectedInk === ink.id;
              return (
                <button
                  type="button"
                  key={ink.id}
                  data-cosmetic="ink"
                  data-value={ink.id}
                  role="radio"
                  aria-checked={checked}
                  className={`pick-quick-ink ${checked ? "checked" : ""}`}
                  title={ink.name}
                  onClick={() => handleInkSelect(ink.id)}
                >
                  <span
                    className="ink-swatch"
                    data-ink={ink.id}
                    style={{ background: ink.color }}
                  />
                </button>
              );
            })}
            <label
              className={`custom-color-pick ${selectedInk.startsWith("#") ? "checked" : ""}`}
              title="Custom Hex Color"
              style={selectedInk.startsWith("#") ? { borderStyle: "solid", borderColor: selectedInk, boxShadow: "0 0 0 2px var(--card), 0 0 0 4.5px var(--yellow)" } : undefined}
            >
              <span className="custom-color-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 2.5 6.5 6 7.5.5.1.7-.2.7-.5v-1.7c0-1.2 1-2.2 2.2-2.2h1.6c3.6 0 6.5-2.9 6.5-6.5C19 6.5 15.9 2 12 2z" />
                  <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
                  <circle cx="16.5" cy="10.5" r="1.5" fill="currentColor" />
                </svg>
              </span>
              <input
                type="color"
                id="pick-custom-color"
                value={selectedInk.startsWith("#") ? selectedInk : (INKS.find((i) => i.id === selectedInk)?.color || "#3d7fd0")}
                style={{ opacity: 0, position: "absolute", width: "100%", height: "100%", left: 0, top: 0, cursor: "pointer" }}
                onChange={(e) => handleCustomColor(e.target.value)}
              />
            </label>
          </div>
        </article>

        {/* Right Column: Pick Side */}
        <div className="pick-side">
          {/* Player Name */}
          <div className="side-group name-group">
            {!isEditingName ? (
              <button
                type="button"
                id="pick-name-edit"
                className="name-chip"
                aria-label={`Change player name — current: ${playerName}`}
                onClick={() => setIsEditingName(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                </svg>
                <span className="name-chip-name">{playerName}</span>
                <span className="name-chip-action">Change</span>
              </button>
            ) : (
              <div className="pick-name">
                <input
                  id="pick-name"
                  className="text-field"
                  type="text"
                  maxLength={12}
                  value={playerName}
                  autoFocus
                  placeholder="Player"
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") {
                      setIsEditingName(false);
                    }
                  }}
                />
                <button
                  type="button"
                  id="pick-name-done"
                  className="name-done"
                  onClick={() => setIsEditingName(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Done</span>
                </button>
              </div>
            )}
          </div>

          {/* ROOM SECTION WITH TWO BUTTONS (Create / Join) */}
          <div className="side-group room-group">
            <span className="side-label" aria-hidden="true">ROOM</span>

            {phase !== "live" ? (
              <div className="online-setup-box">
                {/* Two side-by-side buttons requested by user */}
                <div className="room-tab-row" role="tablist" aria-label="Room Action">
                  <button
                    type="button"
                    role="tab"
                    aria-pressed={roomAction === "create"}
                    onClick={() => {
                      setRoomAction("create");
                      setError(null);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Create Room</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-pressed={roomAction === "join"}
                    onClick={() => {
                      setRoomAction("join");
                      setError(null);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    <span>Join Room</span>
                  </button>
                </div>

                {roomAction === "create" ? (
                  <div className="room-panel">
                    <p className="room-panel-note">
                      Host a new duel on your desk and share the room code with a friend.
                    </p>
                    <button
                      type="button"
                      className="online-cta-btn"
                      disabled={phase === "connecting"}
                      onClick={() => void handleHost()}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>{phase === "connecting" ? "Creating room…" : "Start Hosting"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="room-panel">
                    <p className="room-panel-note">
                      Enter the 7-character invite code (e.g. PF-XXXX) to connect.
                    </p>
                    <div className="join-field-row">
                      <input
                        type="text"
                        className="text-field"
                        placeholder="PF-XXXX"
                        maxLength={7}
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      />
                      <button
                        type="button"
                        className="online-cta-btn"
                        style={{ minWidth: 90 }}
                        disabled={phase === "connecting" || joinCode.trim().length < 4}
                        onClick={() => void handleJoin(joinCode)}
                      >
                        <span>{phase === "connecting" ? "…" : "Join"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {error ? <p className="field-error-text">{error}</p> : null}
              </div>
            ) : (
              <div className="online-setup-box online-live-box">
                {/* Live Room Info */}
                <div className="room-code-card">
                  <div className="room-code-tag">
                    <span className="room-code-label">Room Code</span>
                    <span className="room-code-val">{roomCode}</span>
                  </div>
                  <button type="button" className="room-copy-btn" onClick={copyLink}>
                    {copied ? "Copied! ✓" : "Copy Link"}
                  </button>
                </div>

                {/* Peer cards */}
                <ul className="peer-list">
                  <li className="peer-card">
                    <div className="peer-card-info">
                      <span className="peer-card-name">
                        {playerName} {multiplayer.isHost ? "(Host)" : "(Guest)"}
                      </span>
                      <span className="peer-card-sub">
                        {currentPen.name} · {currentDesk.name}
                      </span>
                    </div>
                    <span className="peer-card-status" data-ready={myReady ? "true" : "false"}>
                      {myReady ? "READY" : "CHOOSING"}
                    </span>
                  </li>

                  <li className="peer-card">
                    {opponent ? (
                      <>
                        <div className="peer-card-info">
                          <span className="peer-card-name">{opponent.name || "Opponent"}</span>
                          <span className="peer-card-sub">
                            {oppPen?.name ?? "..."} · {oppDesk?.name ?? "..."}
                          </span>
                        </div>
                        <span className="peer-card-status" data-ready={opponentReady ? "true" : "false"}>
                          {opponentReady ? "READY" : "CHOOSING"}
                        </span>
                      </>
                    ) : (
                      <span className="peer-card-sub" style={{ padding: "6px 0", fontStyle: "italic" }}>
                        Waiting for player 2 to join…
                      </span>
                    )}
                  </li>
                </ul>

                <button type="button" className="room-leave-btn" onClick={handleLeaveRoom}>
                  Leave Room
                </button>
              </div>
            )}
          </div>

          {/* Desk / Board Selector */}
          <div className="side-group desk-group">
            <span className="side-label" aria-hidden="true">BOARD / DESK</span>
            <div className="desk-picker-grid" role="radiogroup" aria-label="Desk selection">
              {DESKS.map((d) => {
                const isSelected = selectedDesk === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className="choice-card"
                    title={d.name}
                    onClick={() => {
                      setSelectedDesk(d.id);
                      try {
                        localStorage.setItem(LS_DESK, d.id);
                      } catch {}
                    }}
                  >
                    <span className="choice-art">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.art} alt="" loading="lazy" draggable={false} />
                    </span>
                    <span>{d.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fight / Ready CTA Button matching Image 2 */}
          <div className="pick-buttons">
            <button
              id="pick-confirm"
              className="mbtn yellow pick-fight"
              type="button"
              disabled={phase === "connecting"}
              onClick={() => {
                if (phase !== "live") {
                  if (roomAction === "create") {
                    void handleHost();
                  } else if (joinCode.trim().length >= 4) {
                    void handleJoin(joinCode);
                  }
                } else if (opponent) {
                  handleToggleReady();
                }
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>
                {phase !== "live"
                  ? roomAction === "create"
                    ? "Host Room"
                    : "Join Room"
                  : !opponent
                  ? "Waiting for Opponent…"
                  : myReady
                  ? "Ready ✓ (Waiting)"
                  : "Fight!"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
