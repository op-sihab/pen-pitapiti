import { NextResponse } from "next/server";

/* --------------------------------------------------------------------------
   Pen Fight analytics sink.

   The engine pings these URLs itself (page visit / match played / first-ever
   player / win-loss-draw per AI level / time-on-site and session buckets).
   The calls are fire-and-forget with `credentials: omit` and `keepalive`, so
   the previous 404 was harmless — but it logged a console error on every load
   and discarded the numbers.

   This route acknowledges the writes with 204 and stores nothing, so the
   browser stays quiet and no personal data is touched. Point it at a real
   counter store (KV, D1, a Supabase table) when you actually want the stats.

   Valid keys, mirroring the engine's own allow-list:
     v | m | p | {w,l,d}-{easy,normal,hard} | t-1..30 | s-1..10
   -------------------------------------------------------------------------- */

const ALLOWED = /^(v|m|p|[wld]-(easy|normal|hard)|t-([1-9]|[12][0-9]|30)|s-([1-9]|10))$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params;
  // `trailingSlash` can hand us a trailing empty segment — drop it.
  const segments = (path ?? []).filter(Boolean);
  const key = segments.join("/");

  if (!ALLOWED.test(key)) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}

export const dynamic = "force-dynamic";
