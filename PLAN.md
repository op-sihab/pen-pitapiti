# Pen Fight → True Next.js Migration + Online Flow Upgrade

## Goal

1. **Real Next.js** — no more "Next shell + injected 913 KB Vite bundle". Screens become React
   components, navigation becomes routes, styles become CSS Modules + the existing token system.
   Future updates happen in `src/`, never by patching a minified file.
2. **Upgrade the online flow** — mode picker → live opponent panel → board + pen selection *before*
   the match starts → match. Both players see each other's pick live.
3. **Fix the color pills** — the ink swatches are `border-radius: 50%` circles. Make them proper
   rounded-square pills with a checkmark and a ring, matching the chunky 3D system.

## Architecture decision

The physics/rendering core (Planck + PixiJS) stays as the engine — rewriting a 2D physics game is
not the ask. What changes:

| Layer | Before | After |
| --- | --- | --- |
| Screens (menu, picker, lobby, HUD) | engine-rendered DOM inside `game.js` | React components in `src/` |
| Routing | engine holds `screen` state, `history.pushState` | Next.js route groups |
| Engine load | `<script type="module">` injecting a 913 KB bundle that owns the DOM | dynamically imported renderer that receives inputs + emits state |
| Online | broadcast-only, host-starts, pickers after match start | staged state machine with live loadout sync |
| Styling | one compiled 135 KB CSS blob | existing `src/styles` tokens + CSS Modules per screen |

The engine bundle already exposes everything needed for a clean seam
(`window.__penFight.{match,view,input,series,startOnlineGame,…}`), so the renderer wrapper is thin.

## Phases

### Phase 1 — Design tokens + color pill fix
- Extract the real palette from the bundle (they were only ever in `Rx`/`zx` in JS) into
  `src/styles/tokens.css` so `globals.css` stops referencing undefined `var(--navy)` etc.
- Rework `.ink-swatch` / `.pick-quick-ink`: rounded-square pills (`border-radius: 10px`), inner
  shine, navy ring, gold selected ring + check glyph, 40×40 hit target on touch.

### Phase 2 — Route structure
```
/[locale]  (next-intl ready, default /en → redirect)
  /                 → Home screen (mode picker: Computer / 2 Player / Online)
  /play             → pre-match setup (board + pen) for local modes
  /play/match       → match screen
  /online           → lobby (create/join, live opponent)
  /online/setup     → board + pen, synced
  /online/match     → match screen
```

### Phase 3 — React screens
- `ModePicker` — three large chunky cards, each with an illustration, stat line, and CTA.
- `BoardPicker` — 6 desks (`clean old mahogany blackboard neon minimal`) as WebP previews from
  `/games/pen-fight/assets/`, with a live preview canvas.
- `PenPicker` — 9-pen roster carousel, 5-stat bars, ink pills, hatched lock overlay for locked pens,
  name field, Real/Cartoon style toggle.
- `OnlineLobby` — create (shareable `PF-XXXX` code + copy link), join form, opponent card.
- `OnlineSetup` — both players' loadouts side by side, live-synced, absolute/random board option,
  "I'm ready" → host auto-starts when both ready.

### Phase 4 — Online flow upgrade
State machine, broadcast over the existing channel:

```
idle → created → paired → configuring ⇄ opponent-updated → armed → playing
```

New events: `config-loadout`, `config-board`, `ready`, replacing the "host presses start" gate.
Emits only, no DB. Add reconnect handling (`presence` state + `state-sync` request on rejoin).

### Phase 5 — Verification
- `tsc --noEmit`, `next build`
- Headless screenshots of each screen at 390×844 and 1440×900 via the local Chromium build.

## Not changing
- Physics constants, AI difficulty table, audio engine, desk textures, pen stat table.
- Existing CSS token values unless missing.
