/* ==========================================================================
   GAME CATALOG
   Board (desk) art, pen roster, ink palette and stat metadata.

   These mirror the engine's frozen tables exactly — the desk ids, pen ids and
   stat arrays are what the physics/renderer layer consumes, so they must not
   drift. Values were read out of the engine bundle, not guessed.
   ========================================================================== */

export type DeskId = "clean" | "old" | "mahogany" | "blackboard" | "neon" | "minimal";

export type PenId =
  | "ballpoint"
  | "gel"
  | "click"
  | "four"
  | "fountain"
  | "marker"
  | "highlighter"
  | "metal"
  | "laser"
  | "naruto";

export type StatAxis = "weight" | "speed" | "spin" | "grip" | "reach";

export interface DeskOption {
  id: DeskId;
  name: string;
  blurb: string;
  /** Light-mode art. All six desks have one. */
  art: string;
  /** Optional dark-mode art, used when the theme is dark. */
  darkArt?: string;
  /** Accent used for the mini-preview fallback and selection ring. */
  accent: string;
}

const ASSET = "/games/pen-fight/assets";

export const DESKS: readonly DeskOption[] = [
  {
    id: "clean",
    name: "Clean Desk",
    blurb: "The classic. Flat, bright, zero distractions.",
    art: `${ASSET}/desk-clean-DLVVUlLE.webp`,
    darkArt: `${ASSET}/desk-clean-dark-JT8PWu_t.webp`,
    accent: "#e9d9b6",
  },
  {
    id: "old",
    name: "Old Wood",
    blurb: "Scratched school desk with history in every groove.",
    art: `${ASSET}/desk-old-E230-6rb.webp`,
    darkArt: `${ASSET}/desk-old-dark-SzrO7MB8.webp`,
    accent: "#b98d5c",
  },
  {
    id: "mahogany",
    name: "Mahogany",
    blurb: "Warm, heavy, serious. Pens roll slower here.",
    art: `${ASSET}/desk-mahogany.webp`,
    accent: "#8a4b32",
  },
  {
    id: "blackboard",
    name: "Blackboard",
    blurb: "Chalk dust and squeaky pens. High contrast play.",
    art: `${ASSET}/desk-blackboard.webp`,
    accent: "#2f4f43",
  },
  {
    id: "neon",
    name: "Neon Grid",
    blurb: "Late-night arcade desk. Glows under the pens.",
    art: `${ASSET}/desk-neon.webp`,
    accent: "#24304f",
  },
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Pure geometry. Nothing but you and the shot.",
    art: `${ASSET}/desk-minimal.webp`,
    accent: "#d8d8d2",
  },
] as const;

export interface PenSpec {
  id: PenId;
  name: string;
  tagline: string;
  length: number;
  width: number;
  mass: number;
  com: number;
  grip: number;
  bounce: number;
  rollFactor: number;
  flickPower: number;
  /** [weight, speed, spin, grip, reach] — 1..5, straight from the engine. */
  stats: [number, number, number, number, number];
  /** Body colours used to draw the pen preview. */
  body: string;
  shade: string;
  cap: string;
}

export const PENS: readonly PenSpec[] = [
  {
    id: "ballpoint",
    name: "Cheap Ballpoint",
    tagline: "Long reach, light grip. The default flicker.",
    length: 1.5,
    width: 0.08,
    mass: 1.04,
    com: 0.04,
    grip: 0.2,
    bounce: 0.26,
    rollFactor: 0.35,
    flickPower: 1.02,
    stats: [2, 5, 4, 2, 5],
    body: "#efe0c4",
    shade: "#c9b48c",
    cap: "#3d7fd0",
  },
  {
    id: "gel",
    name: "Gel Pen",
    tagline: "Balanced everywhere. Balanced is dangerous.",
    length: 1.41,
    width: 0.11,
    mass: 1.04,
    com: 0.03,
    grip: 0.3,
    bounce: 0.3,
    rollFactor: 0.4,
    flickPower: 1.02,
    stats: [2, 4, 3, 3, 3],
    body: "#eef3fa",
    shade: "#b9c7da",
    cap: "#2b62a8",
  },
  {
    id: "click",
    name: "Click Pen",
    tagline: "Sharp spin control with a click that never ends.",
    length: 1.4,
    width: 0.09,
    mass: 1.1,
    com: 0.02,
    grip: 0.22,
    bounce: 0.28,
    rollFactor: 0.35,
    flickPower: 1,
    stats: [2, 5, 5, 1, 2],
    body: "#cfe3f5",
    shade: "#9db8d2",
    cap: "#212121",
  },
  {
    id: "four",
    name: "4-Colour Pen",
    tagline: "Heavy body, wide footprint, stubborn grip.",
    length: 1.44,
    width: 0.16,
    mass: 1.1,
    com: -0.02,
    grip: 0.34,
    bounce: 0.22,
    rollFactor: 0.6,
    flickPower: 1.02,
    stats: [2, 3, 2, 4, 4],
    body: "#dfe4ea",
    shade: "#aeb7c2",
    cap: "#e53935",
  },
  {
    id: "fountain",
    name: "Fountain Pen",
    tagline: "Nib-forward, precision spins, elegant chaos.",
    length: 1.44,
    width: 0.12,
    mass: 1.03,
    com: 0.04,
    grip: 0.24,
    bounce: 0.27,
    rollFactor: 0.5,
    flickPower: 1.015,
    stats: [2, 4, 5, 2, 4],
    body: "#3b4250",
    shade: "#232935",
    cap: "#c9a227",
  },
  {
    id: "marker",
    name: "Marker",
    tagline: "Fat barrel, low bounce. Pushes, never flicks.",
    length: 1.37,
    width: 0.15,
    mass: 1.15,
    com: -0.06,
    grip: 0.38,
    bounce: 0.24,
    rollFactor: 0.65,
    flickPower: 1,
    stats: [3, 3, 3, 4, 2],
    body: "#f0b27a",
    shade: "#c08a56",
    cap: "#7b4b2a",
  },
  {
    id: "highlighter",
    name: "Highlighter",
    tagline: "Shortest reach, heaviest grip. A brawler.",
    length: 1.05,
    width: 0.27,
    mass: 1.26,
    com: 0.08,
    grip: 0.46,
    bounce: 0.2,
    rollFactor: 0.75,
    flickPower: 1,
    stats: [3, 2, 4, 5, 1],
    body: "#fff59d",
    shade: "#d6c96a",
    cap: "#f4cf5a",
  },
  {
    id: "metal",
    name: "Metal Pen",
    tagline: "Slick, springy, unforgiving. High risk.",
    length: 1.4,
    width: 0.12,
    mass: 1.35,
    com: 0.02,
    grip: 0.05,
    bounce: 0.34,
    rollFactor: 0.8,
    flickPower: 0.98,
    stats: [4, 4, 3, 1, 3],
    body: "#c6ccd2",
    shade: "#8d969f",
    cap: "#5b6570",
  },
  {
    id: "laser",
    name: "Neon Stylus",
    tagline: "Best flick power in the drawer. Pure speed.",
    length: 1.42,
    width: 0.1,
    mass: 1.06,
    com: 0.02,
    grip: 0.25,
    bounce: 0.32,
    rollFactor: 0.42,
    flickPower: 1.05,
    stats: [3, 5, 4, 3, 4],
    body: "#3a2f5e",
    shade: "#241c3d",
    cap: "#00f0ff",
  },
  {
    id: "naruto",
    name: "Naruto Sage Pen",
    tagline: "Sage Mode chakra with a devastating Rasengan spin.",
    length: 1.48,
    width: 0.16,
    mass: 1.12,
    com: 0.02,
    grip: 0.26,
    bounce: 0.28,
    rollFactor: 0.52,
    flickPower: 1.08,
    stats: [3, 5, 5, 3, 4],
    body: "#ff7700",
    shade: "#cc5500",
    cap: "#18181b",
  },
] as const;

export const STAT_LABELS: Record<StatAxis, string> = {
  weight: "Weight",
  speed: "Speed",
  spin: "Spin",
  grip: "Grip",
  reach: "Reach",
};

export const STAT_ORDER: readonly StatAxis[] = ["weight", "speed", "spin", "grip", "reach"];

export interface InkOption {
  id: string;
  name: string;
  color: string;
}

export const INKS: readonly InkOption[] = [
  { id: "blue", name: "Blue", color: "#3d7fd0" },
  { id: "violet", name: "Violet", color: "#7c3aed" },
  { id: "green", name: "Green", color: "#059669" },
  { id: "crimson", name: "Crimson", color: "#dc2626" },
  { id: "gold", name: "Gold", color: "#d97706" },
  { id: "cyan", name: "Cyan", color: "#06b6d4" },
  { id: "orange", name: "Orange", color: "#ea580c" },
  { id: "black", name: "Black", color: "#18181b" },
  { id: "pink", name: "Pink", color: "#db2777" },
  { id: "teal", name: "Teal", color: "#0d9488" },
  { id: "white", name: "White", color: "#f1f5f9" },
] as const;

export function getPen(id: string): PenSpec {
  return PENS.find((p) => p.id === id) ?? PENS[1];
}

export function getDesk(id: string): DeskOption {
  return DESKS.find((d) => d.id === id) ?? DESKS[0];
}

export function getInk(id: string): InkOption {
  return INKS.find((i) => i.id === id) ?? INKS[0];
}
