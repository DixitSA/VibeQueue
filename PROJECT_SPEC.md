# VibeQueue — Project Specification

## Overview

A real-time, QR-code-accessed crowd jukebox for taprooms. Patrons scan a QR code, view a live song queue, request songs via the Spotify API, and upvote existing requests. Zero hardware required — works entirely in the browser.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, Tailwind CSS |
| Backend / Realtime | Firebase Firestore (real-time listeners) |
| Auth | Firebase Anonymous Auth (patrons), standard auth (venue owners) |
| Music | Spotify Web API |

---

## User Roles

### Patron
- Arrives at venue, scans QR code
- Authenticated automatically via Firebase Anonymous Auth
- Can browse the live queue
- Can search for songs via Spotify
- Can request a song (added to the queue)
- Can upvote any existing request once

### Venue Owner / Admin
- Manages the jukebox session (open/close)
- Views and moderates the queue
- Connects their Spotify account (OAuth)
- Controls playback via Spotify

---

## Core Features

### Queue
- Live real-time queue rendered from Firestore
- Songs sorted by upvote count (descending), then by time added (ascending) as tiebreaker
- Each queue entry stores: `trackId`, `trackName`, `artistName`, `albumArt`, `upvotes`, `requestedBy` (anon UID), `addedAt`

### Song Request
- Patron searches via Spotify Search API
- Results displayed in a searchable list
- Patron selects a track → it is added to Firestore queue

### Upvoting
- Each patron (anon UID) may upvote a given track once
- Upvote count updates in real time for all connected clients

### QR Code Access
- Each venue session has a unique URL: `/session/[sessionId]`
- QR code encodes this URL
- Owner dashboard generates and displays the QR code

---

## UI/UX Design Language

### Aesthetic
- High-end, minimalist, editorial layout
- Feels premium — like a Monocle magazine or high-end menu

### Color Palette
- **Background:** Charcoal (`#1C1C1C` / `#222222`)
- **Surface:** Cream / off-white (`#F5F0E8` / `#EDE8DC`)
- **Text on dark:** Cream
- **Text on light:** Charcoal
- No neon. No default web blue/purple/green.

### Textures & Surfaces
- Glassmorphism / vellum-like translucent effect for:
  - Modals
  - Overlays
  - Sticky headers
- Achieved with `backdrop-blur`, semi-transparent backgrounds, and subtle border

### Queue Card Component
- Each song in the queue renders as an interactive card
- **Front face:** Song title + artist name
- **Back face:** Upvote count + "Upvote" action button
- Flip triggered on tap/click
- 3D flip animation uses custom CSS (`transform-style: preserve-3d`, `rotateY`)
- This is the one sanctioned exception to the Tailwind-only rule

---

## Project Structure (planned)

```
vibequeue/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                     # Landing / home
│   ├── session/
│   │   └── [sessionId]/
│   │       └── page.tsx             # Patron queue view
│   └── dashboard/
│       └── page.tsx                 # Venue owner dashboard
├── components/
│   ├── QueueCard/
│   │   ├── QueueCard.tsx            # 3D flip card
│   │   └── QueueCard.css            # Flip animation styles
│   ├── SearchModal/
│   ├── QueueList/
│   └── QRDisplay/
├── lib/
│   ├── firebase.ts                  # Firebase app init
│   ├── firestore.ts                 # Firestore read/write helpers
│   └── spotify.ts                   # Spotify API helpers
├── hooks/
│   ├── useQueue.ts                  # Real-time Firestore queue listener
│   └── useUpvote.ts
└── types/
    └── index.ts                     # Shared TypeScript types
```

---

## Data Model (Firestore)

### `/sessions/{sessionId}`
```ts
{
  venueId: string
  venueName: string
  isActive: boolean
  spotifyAccessToken: string
  createdAt: Timestamp
}
```

### `/sessions/{sessionId}/queue/{trackId}`
```ts
{
  trackId: string
  trackName: string
  artistName: string
  albumArt: string
  upvotes: number
  upvotedBy: string[]   // array of anon UIDs
  requestedBy: string   // anon UID
  addedAt: Timestamp
}
```

---

## Coding Rules

1. Write clean, modular, DRY React components.
2. Use Tailwind utility classes exclusively — no custom CSS except for the 3D card flip animation.
3. Never write placeholder/mock logic for Firebase — use real Firestore connections.
4. Do not combine UI scaffolding and backend logic in a single implementation step.
5. Separate concerns: data-fetching hooks live in `/hooks`, API helpers in `/lib`.
