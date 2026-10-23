import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./home-redesign.css";
import "../styles/setup.css";
import "../styles/lobby.css";
import "../styles/online.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shunneklabs.app"),
  title: "পেন পিটাপিটি · Pen Pitapiti | স্কুল ডেস্কে কলম যুদ্ধ",
  description:
    "পেন পিটাপিটি (Pen Pitapiti) একটি ফ্রি ব্রাউজার গেম: আপনার পেন ফ্লিক করে অন্য পেনটিকে স্কুল ডেস্ক থেকে ফেলে দিন। কম্পিউটারের বিরুদ্ধে বা বন্ধুর সাথে অনলাইনে খেলুন।",
  authors: [{ name: "Pen Pitapiti" }],
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
    siteName: "পেন পিটাপিটি · Pen Pitapiti",
    title: "পেন পিটাপিটি · Pen Pitapiti | স্কুল ডেস্কে কলম যুদ্ধ",
    description:
      "পেন পিটাপিটি (Pen Pitapiti) একটি ফ্রি ব্রাউজার গেম: আপনার কলম ফ্লিক করে প্রতিপক্ষের কলমটি স্কুল টেবিল থেকে ফেলে দিন। কম্পিউটারের বিরুদ্ধে বা বন্ধুর সাথে খেলুন।",
    url: "https://shunneklabs.app/games/pen-fight/",
    images: [
      {
        url: "/games/pen-fight/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Two pens on a wooden school desk, with the title Pen Pitapiti.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "পেন পিটাপিটি · Pen Pitapiti | স্কুল ডেস্কে কলম যুদ্ধ",
    description:
      "পেন পিটাপিটি (Pen Pitapiti) একটি ফ্রি ব্রাউজার গেম: আপনার কলম ফ্লিক করে প্রতিপক্ষের কলমটি স্কুল টেবিল থেকে ফেলে দিন। কম্পিউটারের বিরুদ্ধে বা বন্ধুর সাথে খেলুন।",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800&family=Hind+Siliguri:wght@500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="modulepreload" href="/games/pen-fight/js/canvas-pool.js" />
        <link rel="modulepreload" href="/games/pen-fight/js/render-target.js" />
        <link rel="modulepreload" href="/games/pen-fight/js/texel-range.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
