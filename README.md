# VibeQueue

VibeQueue is a real-time, QR-code-accessed crowd jukebox for taprooms and venues. Patrons scan a QR code, browse a live song queue backed by Firestore, search for and request songs via the Spotify Web API, and upvote existing requests — no app install or hardware required. Venue owners get an admin dashboard to moderate the queue, manage venue settings, and control Spotify playback via OAuth. See [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) for the full product spec and data model.

## Prerequisites

- Node.js 18.18+ (or a version compatible with the Next.js version in `package.json`)
- A [Firebase](https://console.firebase.google.com/) project with Firestore enabled, plus a service account for the Admin SDK
- A [Spotify Developer](https://developer.spotify.com/dashboard) app (Client Credentials flow for search, OAuth for admin playback control)

## Environment setup

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Fill in every value in `.env.local`. Each variable in [`.env.local.example`](./.env.local.example) has a comment explaining where to find it (Firebase project settings, Firebase service account JSON, Spotify app dashboard).
3. `.env.local` is gitignored — never commit it or paste real secrets into `.env.local.example`.

## Running locally

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. If port 3000 is already in use, Next.js will pick the next available port — check the terminal output for the actual URL.

## Building and linting

```bash
npm run build   # production build; also surfaces type errors
npm run lint    # ESLint
```

Both should be run before opening a PR.

## Known outstanding follow-ups

This project has an active security/release audit tracking outstanding hardening work (authorization on Server Actions, Firestore rules tightening, OAuth CSRF protection, distributed rate limiting, and more). See [`RELEASE_PLAN.md`](./RELEASE_PLAN.md) for the full list before deploying this to production.
