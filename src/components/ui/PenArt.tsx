"use client";

import { useEffect, useState } from "react";
import { getInk, getPen, STAT_LABELS, STAT_ORDER, type PenSpec } from "@/lib/game-catalog";

/* ==========================================================================
   Pen art
   Primary path: the engine's own pen artwork. The renderer paints each pen
   into an offscreen canvas (barrel, cap, clip, grip, ink-tinted tip), and that
   canvas is what actually appears on the desk — so we captured those exact
   bitmaps per pen/ink pair into /games/pen-fight/pens/<pen>-<ink>.png and use
   them here. Menu preview and desk then show the same pen, never a lookalike.
   Fallback: the clean SVG construction, used if a bitmap is missing or if
   the ink color doesn't have a pre-rendered PNG.
   ========================================================================== */

/** Intrinsic sizes of the captured engine bitmaps (from pens/manifest.json). */
const PEN_ART_SIZE: Record<string, { w: number; h: number }> = {
  ballpoint: { w: 300, h: 16 },
  gel: { w: 282, h: 22 },
  click: { w: 282, h: 22 },
  four: { w: 280, h: 18 },
  fountain: { w: 288, h: 32 },
  marker: { w: 288, h: 24 },
  highlighter: { w: 274, h: 30 },
  metal: { w: 210, h: 54 },
  laser: { w: 280, h: 24 },
};

const KNOWN_PNG_INKS: Record<string, string> = {
  blue: "blue",
  black: "black",
  red: "red",
  crimson: "red",
  green: "green",
};

const PEN_ART_URL = (pen: string, ink: string) =>
  `/games/pen-fight/pens/${pen}-${KNOWN_PNG_INKS[ink] || ink}.png`;

export function PenArt({
  pen,
  ink = "blue",
  size = 120,
  className,
}: {
  pen: PenSpec | string;
  ink?: string;
  size?: number;
  className?: string;
}) {
  const spec = typeof pen === "string" ? getPen(pen) : pen;
  const inkColor = getInk(ink).color;
  const [hasImgError, setHasImgError] = useState(false);

  useEffect(() => {
    setHasImgError(false);
  }, [spec.id, ink]);

  const real = PEN_ART_SIZE[spec.id];
  const hasKnownPng = Boolean(KNOWN_PNG_INKS[ink]);

  if (real && hasKnownPng && !hasImgError) {
    // Width is the requested size; height follows the pen's true proportions.
    const ratio = real.h / real.w;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={className}
        src={PEN_ART_URL(spec.id, ink)}
        alt={`${spec.name} with ${getInk(ink).name} ink`}
        width={size}
        height={Math.max(10, Math.round(size * ratio))}
        draggable={false}
        onError={() => setHasImgError(true)}
        style={{
          display: "block",
          objectFit: "contain",
          imageRendering: "auto",
          userSelect: "none",
        }}
      />
    );
  }

  const w = size;
  const h = Math.max(18, Math.round(size * 0.24));

  // Barrel length is normalised so all pens share one visual scale; the real
  // length/width ratio is preserved so the preview is honest about reach.
  const barrelH = Math.max(8, Math.round(h * 0.46));
  const tipLen = Math.round(w * 0.16);
  const capLen = Math.round(w * 0.22);
  const gripLen = Math.round(w * (spec.grip > 0.3 ? 0.14 : 0.09));

  return (
    <svg
      className={className}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`${spec.name} with ${ink} ink`}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* soft contact shadow */}
      <ellipse cx={w / 2} cy={h - 1} rx={w * 0.42} ry={h * 0.10} fill="rgba(47,59,75,.18)" />

      {/* tip */}
      <path
        d={`M${tipLen} ${h / 2 - barrelH / 2 + 2} L1 ${h / 2} L${tipLen} ${h / 2 + barrelH / 2 - 2} Z`}
        fill={inkColor}
        stroke="#2f3b4b"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* barrel */}
      <rect
        x={tipLen}
        y={h / 2 - barrelH / 2}
        width={w - tipLen - capLen}
        height={barrelH}
        rx={barrelH / 2}
        fill={spec.body}
        stroke="#2f3b4b"
        strokeWidth="1.4"
      />
      {/* gloss */}
      <rect
        x={tipLen + 3}
        y={h / 2 - barrelH / 2 + 2}
        width={w - tipLen - capLen - 6}
        height={Math.max(1.5, barrelH * 0.26)}
        rx={barrelH * 0.13}
        fill="rgba(255,255,255,.55)"
      />
      {/* grip band */}
      <rect
        x={tipLen + 2}
        y={h / 2 - barrelH / 2}
        width={gripLen}
        height={barrelH}
        rx={Math.min(4, barrelH * 0.2)}
        fill="rgba(47,59,75,.16)"
      />

      {/* cap */}
      <rect
        x={w - capLen}
        y={h / 2 - barrelH / 2 - 1}
        width={capLen}
        height={barrelH + 2}
        rx={Math.min(barrelH / 2, 7)}
        fill={spec.cap}
        stroke="#2f3b4b"
        strokeWidth="1.4"
      />
      {/* pocket clip */}
      <rect
        x={w - capLen + 3}
        y={h / 2 - barrelH / 2 - 2}
        width={Math.max(2, Math.round(capLen * 0.22))}
        height={barrelH * 0.55}
        rx={1.5}
        fill={spec.shade}
      />
    </svg>
  );
}

/* ==========================================================================
   Stat bars — five axes, 1..5, same order and meaning as the engine
   ========================================================================== */

export function StatBars({
  stats,
  compare,
  compact = false,
}: {
  stats: readonly number[];
  /** Optional opponent's stats, rendered as a ghosted second bar. */
  compare?: readonly number[];
  compact?: boolean;
}) {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "grid",
        gap: compact ? 4 : 6,
      }}
    >
      {STAT_ORDER.map((axis, i) => {
        const value = stats[i] ?? 0;
        const other = compare?.[i];
        const better = other !== undefined && value > other;
        return (
          <li
            key={axis}
            style={{
              display: "grid",
              gridTemplateColumns: compact ? "44px 1fr" : "58px 1fr",
              alignItems: "center",
              gap: 8,
              fontSize: compact ? 10 : 11,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 800,
              color: "var(--muted)",
            }}
          >
            <span>{STAT_LABELS[axis]}</span>
            <span
              style={{
                display: "flex",
                gap: 3,
                alignItems: "center",
              }}
              aria-label={`${STAT_LABELS[axis]} ${value} of 5`}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  style={{
                    flex: 1,
                    height: compact ? 5 : 6,
                    borderRadius: 3,
                    background:
                      n <= value
                        ? better
                          ? "var(--green)"
                          : "var(--navy)"
                        : "color-mix(in srgb, var(--navy) 14%, transparent)",
                    transition: "background .18s ease",
                  }}
                />
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
