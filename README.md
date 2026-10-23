# 🖊️ Desk Wars: Pen Fight (Next.js Edition)

An authentic, physics-driven browser rendition of the classic school desk pen duel game, built with **Next.js 15 (App Router)**, **Pixi.js**, **Planck.js (Box2D)**, and **Supabase Realtime**.

---

## ✨ Features

- **🌐 Real-Time Online 1v1 Multiplayer:**
  - Room-based matchmaking using Supabase Realtime Broadcast.
  - Zero server lag, client-side authoritative physics sync, and live loadout preview.
- **🤖 Intelligent vs Computer AI:**
  - 4 distinct difficulty levels: **Easy**, **Normal**, **Hard**, and unbeatable **Master Level**.
  - Physics trajectory forecasting, spin mechanics, and edge avoidance.
- **👥 2-Player Pass & Play:**
  - Local turn-based duel on a single device.
- **✒️ 10 Unique Playable Pens:**
  - Cheap Ballpoint, Gel Pen, Click Pen, 4-Colour Pen, Fountain Pen, Marker, Highlighter, Metal Pen, Neon Stylus, and the custom **Naruto Sage Pen** (সেজ মোড চক্র ও রাসিনগান স্পিন)!
- **🌐 Full Bilingual Support:**
  - 100% native translations in **English** and **Bangla (বাংলা)**.
- **🎨 Customization & Progression:**
  - XP progression road (Level 1 to 5), unlockable ink color palettes, and cosmetic stickers.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/op-sihab/pen-fight-next.git
cd pen-fight-next

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment Guide

### Option 1: Vercel (Recommended - 1-Click Zero Config)

This project is optimized for **Vercel**:
1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import this `pen-fight-next` repository.
4. Framework Preset will automatically detect **Next.js**.
5. *(Optional)* Add your Supabase credentials in Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **Deploy**! Your game will be live globally with automatic HTTPS and CDN.

### Option 2: Render / Railway / VPS

```bash
npm run build
npm start
```

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (React 19, TypeScript)
- **Physics Engine:** Planck.js (Box2D 2D Rigid Body Physics)
- **Renderer:** Pixi.js (WebGL) + Canvas2D vector rasterization
- **Multiplayer:** Supabase Realtime Channels
- **Styling:** CSS Modules / Vanilla CSS Design Tokens
