"use client";

import PenFightGame from "@/components/PenFightGame";

/* Invite-link landing page: /games/pen-fight/online/?room=PF-XXXX

   It renders the exact same game shell as /games/pen-fight/. PenFightGame reads
   `?room=` from the URL and auto-opens the lobby with the code prefilled, so
   one route graph serves both the game and the invite flow. Keeping this a
   real route means the copy-link button produces a URL that resolves. */

export default function OnlineGamePage() {
  return <PenFightGame />;
}
