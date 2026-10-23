"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DESKS,
  getDesk,
  getInk,
  getPen,
  INKS,
  PENS,
  type DeskId,
  type PenId,
} from "@/lib/game-catalog";
import type { PenLoadout } from "@/lib/multiplayer";
import { PenArt, StatBars } from "./PenArt";

/* ==========================================================================
   MATCH SETUP
   The screen that used to not exist: choose computer vs / 1v1 / online, then
   board, then pen + ink, then start. Everything is keyboard-navigable and
   rendered as real radio groups so it works with a screen reader.
   ========================================================================== */

export type GameMode = "computer" | "hots" | "online";

export interface SetupValue {
  mode: GameMode;
  desk: DeskId;
  loadout: PenLoadout;
  names: [string, string];
  level?: number;
}

export const MODES: { id: GameMode; title: string; blurb: string; badge: string }[] = [
  {
    id: "computer",
    title: "vs Computer",
    blurb: "Practice against the desk AI. Four difficulty levels.",
    badge: "Solo",
  },
  {
    id: "hots",
    title: "2 Players",
    blurb: "One device, pass and flick. Classic couch rules.",
    badge: "Local",
  },
  {
    id: "online",
    title: "Online Duel",
    blurb: "Share a code and play a friend anywhere, live.",
    badge: "Live",
  },
];

const STEPS = [
  { id: "mode", label: "Mode" },
  { id: "board", label: "Board" },
  { id: "pen", label: "Pen" },
] as const;

type Step = (typeof STEPS)[number]["id"];

export function MatchSetup({
  initial,
  onStart,
  onCancel,
  /** When provided, mode switching is handled by the parent (online route). */
  lockMode,
  /** Extra content rendered under the header, e.g. the room code card. */
  headerExtra,
  startLabel = "Start match",
  busy = false,
  /** Online: the room card owns the primary action, so the rail omits its own. */
  hideStartAction = false,
  /** Opponent's live pick, shown as a ghost preview while selecting. */
  peer,
  /** Fires on every edit, so a parent can mirror the live selection. */
  onChange,
}: {
  initial: SetupValue;
  onStart: (value: SetupValue) => void;
  onCancel?: () => void;
  lockMode?: GameMode;
  headerExtra?: React.ReactNode;
  startLabel?: string;
  busy?: boolean;
  hideStartAction?: boolean;
  peer?: { name: string; desk: DeskId; loadout: PenLoadout; ready: boolean } | null;
  onChange?: (value: SetupValue) => void;
}) {
  const [value, setValue] = useState<SetupValue>(initial);
  // Start on the first step the user can actually reach: when the mode is
  // locked (online) the mode panel is skipped, so begin on the board.
  const [step, setStep] = useState<Step>(lockMode ? "board" : "mode");
  const headingId = useId();
  const firstStep: Step = lockMode ? "board" : "mode";

  /* The parent may own the player name (the online lobby renders it in its room
     card). When it changes there, adopt it here without touching the picks.
     Keyed on the string, not the array, so a fresh array per render is inert. */
  const parentName = initial.names[0];
  useEffect(() => {
    setValue((prev) =>
      prev.names[0] === parentName
        ? prev
        : { ...prev, names: [parentName, prev.names[1]] }
    );
  }, [parentName]);

  const mode = lockMode ?? value.mode;
  const desk = useMemo(() => getDesk(value.desk), [value.desk]);
  const pen = useMemo(() => getPen(value.loadout.pen), [value.loadout.pen]);
  const peerPen = peer ? getPen(peer.loadout.pen) : null;

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const update = useCallback((patch: Partial<SetupValue>) => {
    setValue((prev) => {
      const next = { ...prev, ...patch };
      // Mirror upward so the parent (online lobby cards, live broadcast) sees
      // every edit immediately, not just when Start is pressed.
      onChangeRef.current?.(next);
      return next;
    });
  }, []);

  // Mode is already decided when the parent locks it — skip straight ahead.
  useEffect(() => {
    if (lockMode) setStep((s) => (s === "mode" ? "board" : s));
  }, [lockMode]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const start = () => onStart({ ...value, mode });

  return (
    <div className="setup">
      <header className="setup-head">
        <button type="button" className="setup-back" onClick={onCancel} aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="setup-titles">
          <p className="setup-kicker">Match setup</p>
          <h1 id={headingId} className="setup-title">
            {mode === "online" ? "Online Duel" : mode === "computer" ? "vs Computer" : "2 Players"}
          </h1>
        </div>
        <ol className="setup-steps" aria-label="Setup progress">
          {STEPS.filter((s) => !(lockMode && s.id === "mode")).map((s) => {
            const i = STEPS.findIndex((x) => x.id === s.id);
            const active = s.id === step;
            const done = i < stepIndex;
            return (
              <li key={s.id} data-active={active || undefined} data-done={done || undefined}>
                <button type="button" onClick={() => setStep(s.id)}>
                  <span aria-hidden="true">{done ? "✓" : i + 1}</span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
      </header>

      {headerExtra ? <div className="setup-extra">{headerExtra}</div> : null}

      <div className="setup-body">
        <section className="setup-panel" aria-labelledby={headingId}>
          {step === "mode" ? (
            <fieldset className="setup-group">
              <legend className="setup-legend">How do you want to play?</legend>
              <div className="mode-grid" role="radiogroup" aria-label="Game mode">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={value.mode === m.id}
                    className="mode-card"
                    data-mode={m.id}
                    data-selected={value.mode === m.id || undefined}
                    onClick={() => {
                      update({ mode: m.id });
                      setStep("board");
                    }}
                  >
                    <span className="mode-badge">{m.badge}</span>
                    <ModeGlyph mode={m.id} />
                    <span className="mode-title">{m.title}</span>
                    <span className="mode-blurb">{m.blurb}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === "board" ? (
            <fieldset className="setup-group">
              <legend className="setup-legend">Pick your desk</legend>
              <div className="desk-grid" role="radiogroup" aria-label="Desk">
                {DESKS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    role="radio"
                    aria-checked={value.desk === d.id}
                    className="desk-tile"
                    data-selected={value.desk === d.id || undefined}
                    data-peer={peer?.desk === d.id || undefined}
                    onClick={() => update({ desk: d.id })}
                  >
                    <span className="desk-thumb" style={{ background: d.accent }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.art} alt="" loading="lazy" draggable={false} />
                    </span>
                    <span className="desk-name">{d.name}</span>
                    <span className="desk-blurb">{d.blurb}</span>
                    {peer?.desk === d.id ? <span className="desk-peer">Opponent</span> : null}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === "pen" ? (
            <div className="pen-step">
              <fieldset className="setup-group pen-roster-group">
                <legend className="setup-legend">Choose your pen</legend>
                <div className="pen-roster" role="radiogroup" aria-label="Pen">
                  {PENS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={value.loadout.pen === p.id}
                      className="pen-chip"
                      data-selected={value.loadout.pen === p.id || undefined}
                      onClick={() =>
                        update({ loadout: { ...value.loadout, pen: p.id as PenId } })
                      }
                    >
                      <PenArt pen={p} ink={value.loadout.ink} size={64} />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="pen-detail">
                <div className="pen-detail-head">
                  <PenArt pen={pen} ink={value.loadout.ink} size={190} />
                </div>
                <h2 className="pen-detail-name">{pen.name}</h2>
                <p className="pen-detail-tag">{pen.tagline}</p>
                <StatBars stats={pen.stats} compare={peerPen?.stats} />

                <InkPills
                  value={value.loadout.ink ?? "blue"}
                  onChange={(ink) => update({ loadout: { ...value.loadout, ink } })}
                />

                <label className="setup-field">
                  <span>Your name</span>
                  <input
                    type="text"
                    value={value.names[0]}
                    maxLength={14}
                    placeholder="Player 1"
                    onChange={(e) => update({ names: [e.target.value, value.names[1]] })}
                  />
                </label>
              </div>
            </div>
          ) : null}
        </section>

        {/* Live summary rail — board + pen always visible while choosing. */}
        <aside className="setup-summary" aria-label="Current selection">
          <div
            className="summary-desk"
            style={{ background: desk.accent }}
            data-desk={desk.id}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={desk.art} alt="" draggable={false} />
            <span className="summary-desk-label">{desk.name}</span>
            <div className="summary-pen">
              <PenArt pen={pen} ink={value.loadout.ink} size={150} />
            </div>
            <span className="summary-ink" style={{ background: getInk(value.loadout.ink ?? "blue").color }} />
          </div>

          <dl className="summary-list">
            <div>
              <dt>Pen</dt>
              <dd>{pen.name}</dd>
            </div>
            <div>
              <dt>Ink</dt>
              <dd>{getInk(value.loadout.ink ?? "blue").name}</dd>
            </div>
            <div>
              <dt>Desk</dt>
              <dd>{desk.name}</dd>
            </div>
            {peer ? (
              <div data-peer="true">
                <dt>{peer.name || "Opponent"}</dt>
                <dd>
                  {peerPen?.name}
                  {peer.ready ? " · ready" : " · choosing"}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="setup-actions">
            {step !== firstStep ? (
              <button
                type="button"
                className="setup-ghost"
                onClick={() => {
                  const i = Math.max(0, STEPS.findIndex((s) => s.id === step));
                  const floor = Math.max(0, STEPS.findIndex((s) => s.id === firstStep));
                  setStep(STEPS[Math.max(floor, i - 1)].id);
                }}
              >
                Back
              </button>
            ) : null}
            {step !== "pen" ? (
              <button
                type="button"
                className="setup-primary"
                onClick={() => {
                  const i = STEPS.findIndex((s) => s.id === step);
                  setStep(STEPS[Math.min(STEPS.length - 1, i + 1)].id);
                }}
              >
                Continue
              </button>
            ) : hideStartAction ? null : (
              <button
                type="button"
                className="setup-primary"
                onClick={start}
                disabled={busy}
                data-busy={busy || undefined}
              >
                {busy ? "Starting…" : startLabel}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Ink pills — the colour picker with the fixed rounded-square swatches.
   Radio-group semantics; the selected pill gets a gold ring and a check.
   -------------------------------------------------------------------------- */

function InkPills({ value, onChange }: { value: string; onChange: (ink: string) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = INKS.findIndex((x) => x.id === value);
    const next = (i + (e.key === "ArrowRight" ? 1 : INKS.length - 1)) % INKS.length;
    onChange(INKS[next].id);
    rowRef.current?.querySelectorAll<HTMLButtonElement>(".ink-pill")[next]?.focus();
  };

  return (
    <div className="setup-field">
      <span id="ink-label">Ink colour</span>
      <div
        className="ink-pill-row"
        role="radiogroup"
        aria-labelledby="ink-label"
        ref={rowRef}
        onKeyDown={onKeyDown}
      >
        {INKS.map((ink) => (
          <button
            key={ink.id}
            type="button"
            role="radio"
            aria-checked={value === ink.id}
            aria-label={ink.name}
            title={ink.name}
            className="ink-pill"
            data-selected={value === ink.id || undefined}
            style={{ ["--pill" as string]: ink.color }}
            onClick={() => onChange(ink.id)}
          >
            <span className="ink-pill-fill" />
            {value === ink.id ? (
              <svg className="ink-pill-check" viewBox="0 0 24 24" aria-hidden="true">
                <polyline
                  points="20 6 9 17 4 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function ModeGlyph({ mode }: { mode: GameMode }) {
  if (mode === "computer") {
    return (
      <svg className="mode-glyph" viewBox="0 0 48 48" aria-hidden="true">
        <rect x="6" y="10" width="36" height="24" rx="4" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M18 40h12M24 34v6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="17" cy="21" r="2.5" fill="currentColor" />
        <circle cx="31" cy="21" r="2.5" fill="currentColor" />
        <path d="M18 27c1.5 2 4 3 6 3s4.5-1 6-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (mode === "hots") {
    return (
      <svg className="mode-glyph" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="17" cy="17" r="6" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="32" cy="20" r="5" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M6 38c0-6 5-10 11-10s11 4 11 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M31 38c0-5 4-8 8-8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="mode-glyph" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="3" />
      <ellipse cx="24" cy="24" rx="8" ry="18" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <path d="M6 24h36M9 15h30M9 33h30" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
