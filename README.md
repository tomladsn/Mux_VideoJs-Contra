# Mux Video.js Custom Skin & "All Terrain" Showcase

[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Video.js](https://img.shields.io/badge/Video.js-10.3-red.svg)](https://videojs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vitejs.dev/)

A modern, cinematic custom **Video.js** skin built with **React** and **Tailwind CSS**, accompanied by the **All Terrain** editorial landing page showcase.

Designed for high-impact media playback with reactive ambient backlighting, customized glassmorphic controls, interactive chapters, gestures, and a curated film collection experience powered by **Mux**.

---

## ✨ Features

### 🎬 Video Player & Custom Skin (`src/video`)
- **Reactive Ambient Glow Engine**: Dynamic edge lighting and room backdrop that shifts color in response to playback and dominant hues.
- **Glassmorphic Deck Controls**: Custom seek buttons, timeline scrubber with thumbnail previews, playback speed picker, and settings menu.
- **Micro-Interactions & Gestures**: Smooth animations, double-tap seek indicators, swipe gestures, and keyboard shortcut overlays (`?` key).
- **Chapter Support & Scrubber Markers**: Built-in WebVTT chapter markers with interactive tooltips.
- **Onboarding & Feedback Systems**: First-visit discovery chips, keyboard hotkey visualizers, and state announcer feedback.

### 🌿 "All Terrain" Editorial Landing Page (`/landing.html`)
- **Cinematic Dark Nature Aesthetic**: Olive-tinted frosted glass, warm gold accent badges, and adaptive full-bleed background imagery.
- **Integrated Hero Stage**: Video player seamlessly mounted into an editorial frame with custom metadata headers (Selected Film, Resolution Badges, Action Buttons).
- **Curated Film Collection**: Interactive playlist sidebar supporting instant switching, automatic poster background transitions, and responsive mobile drawers.
- **Smooth Play-on-Demand CTA**: Frosted pill overlay button that launches video playback directly.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v9+)

### Installation

```bash
# Clone the repository
git clone https://github.com/tomladsn/Mux_VideoJs-Contra.git
cd Mux_VideoJs-Contra/mux-videojs-skin

# Install dependencies
pnpm install
```

### Running Locally

```bash
# Start the Vite development server
pnpm dev
```

Once running, visit:
- **All Terrain Landing Page**: [http://localhost:5173/landing.html](http://localhost:5173/landing.html)
- **Workbench & Customizer Shell**: [http://localhost:5173/](http://localhost:5173/)
- **Standalone Skin Preview**: [http://localhost:5173/preview.html](http://localhost:5173/preview.html)

---

## 📁 Project Structure

```text
mux-videojs-skin/
├── apps/
│   └── preview/                  # Workbench and showcase apps
│       ├── landing.html          # Entry point for the "All Terrain" landing page
│       ├── preview.html          # Standalone isolated player preview
│       ├── index.html            # Workbench shell UI with customization controls
│       └── src/
│           ├── landing/          # Landing page React components & styles
│           ├── frame/            # Preview frame player host
│           └── shell/            # Interactive inspector & controls panel
├── src/                          # Reusable Video.js Skin Core
│   ├── config/
│   │   └── mux.ts                # Mux stream playback configuration & playlist data
│   ├── styles/
│   │   ├── themes/               # Design tokens (Scaffold, custom palette)
│   │   └── video/                # Component-level styles & ambient glow rules
│   ├── video/
│   │   ├── behaviors/            # Gesture and keyboard hotkey listeners
│   │   ├── shared/               # Modular controls (scrubbers, buttons, menus)
│   │   ├── spill/                # Playlist shelf, overlays, shortcuts modal
│   │   ├── ambient-glow.tsx      # Reactive lighting backdrop engine
│   │   ├── controls.tsx          # Custom control deck layout
│   │   └── skin.tsx              # Main <VideoSkin /> wrapper component
│   └── skin.css                  # Main skin stylesheet (Tailwind CSS v4)
├── package.json
└── vite.config.ts
```

---

## ⚙️ Configuration & Mux Playback

You can configure public Mux playback IDs and playlist data in [`mux-videojs-skin/src/config/mux.ts`](mux-videojs-skin/src/config/mux.ts):

```typescript
export const MUX_PLAYBACK_ID = 'your-playback-id';

export const programme: ProgrammeItem[] = [
  {
    id: '1',
    title: 'The beauty of still frames',
    muxPlaybackId: 'your-mux-playback-id',
    duration: 173,
    poster: 'https://image.mux.com/your-mux-playback-id/thumbnail.webp',
    dominantColour: 'oklch(0.65 0.14 290)',
  },
  // ...
];
```

---

## 🛠️ Build & Deployment

### Production Build

```bash
pnpm run build
```

Compiled static assets are generated in `mux-videojs-skin/dist/`.

### Deployment Options

```bash
# Interactive deployment CLI (Vercel, Netlify, Cloudflare)
pnpm run deploy

# Cloudflare Pages directly
pnpm run deploy:cloudflare

# Vercel
pnpm run deploy:vercel

# Netlify
pnpm run deploy:netlify
```

---

## ⌨️ Keyboard Shortcuts (Inside Player)

| Key | Action |
|---|---|
| <kbd>Space</kbd> / <kbd>k</kbd> | Play / Pause |
| <kbd>j</kbd> / <kbd>l</kbd> | Seek backward / forward (10s) |
| <kbd>←</kbd> / <kbd>→</kbd> | Seek backward / forward (5s) |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Volume up / down (5%) |
| <kbd>m</kbd> | Toggle Mute |
| <kbd>f</kbd> | Toggle Fullscreen |
| <kbd>p</kbd> | Toggle Picture-in-Picture |
| <kbd>?</kbd> | Toggle Keyboard Shortcuts Cheatsheet |

---

## 📄 License

Private / Challenge Submission. All rights reserved.
