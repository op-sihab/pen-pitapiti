import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./home-redesign.css";
import "../styles/setup.css";
import "../styles/lobby.css";
import "../styles/online.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shunneklabs.app"),
  title: "Pen Fight · Flick pen duel on a school desk | Shunnek Labs",
  description:
    "Pen Fight is a free browser game: flick your pen and knock the other pen off a school desk. Play the computer or a friend on one device. No sign-in, no ads.",
  authors: [{ name: "Shunnek Labs" }],
  icons: {
    icon: [
      { url: "/games/pen-fight/favicon.ico", sizes: "32x32" },
      { url: "/games/pen-fight/icon.svg", type: "image/svg+xml" },
      { url: "/games/pen-fight/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/games/pen-fight/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/games/pen-fight/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Shunnek Labs",
    title: "Pen Fight · Flick pen duel on a school desk",
    description:
      "Pen Fight is a free browser game: flick your pen and knock the other pen off a school desk. Play the computer or a friend on one device. No sign-in, no ads.",
    url: "https://shunneklabs.app/games/pen-fight/",
    images: [
      {
        url: "/games/pen-fight/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Two pens on a wooden school desk, with the title Pen Fight.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pen Fight · Flick pen duel on a school desk",
    description:
      "Pen Fight is a free browser game: flick your pen and knock the other pen off a school desk. Play the computer or a friend on one device. No sign-in, no ads.",
    images: ["/games/pen-fight/og-1200x630.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4ebd4" },
    { media: "(prefers-color-scheme: dark)", color: "#1f2a3a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="modulepreload" href="/games/pen-fight/js/canvas-pool.js" />
        <link rel="modulepreload" href="/games/pen-fight/js/render-target.js" />
        <link rel="modulepreload" href="/games/pen-fight/js/texel-range.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
