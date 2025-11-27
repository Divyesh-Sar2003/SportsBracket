# SportsBracket

SportsBracket is a Vite + React + TypeScript dashboard for managing campus sports weeks. Admins can configure tournaments, games, teams, and matches, while players self-register to participate. The UI is built with Tailwind CSS, shadcn/ui, Radix primitives, and Lucide icons.

## Tech Stack

- React 18 with TypeScript and Vite
- Tailwind CSS + shadcn/ui component primitives
- React Router and TanStack Query
- Firebase Authentication and Cloud Firestore

## Prerequisites

- Node.js 18+ and npm
- A Firebase project with Email/Password auth enabled and Firestore in native mode

## Environment Variables

Create a `.env` file at the repo root (or `.env.local` for Vite) and provide your Firebase project settings:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Development

```bash
npm install
npm run dev
```

The dev server runs on http://localhost:5173 by default.

## Available Scripts

- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run preview` – preview the production build
- `npm run lint` – lint with ESLint

## Firebase Data Model

The Supabase schema has been replaced by Firestore collections:

- `profiles/{userId}` – user profile data collected during registration
- `user_roles/{userId}` – array of roles; include `"admin"` to grant dashboard access
- `games` – records with `name`, `game_type`, `players_per_team`, `is_active`
- `tournaments` – records with `name`, `start_date`, `end_date`, `is_active`

Extend these collections (e.g., add `teams`, `matches`) to unlock the remaining admin pages.

## Admin Access

New signups receive the `"player"` role. To grant admin rights, add `"admin"` to the `roles` array inside `user_roles/{userId}` via the Firebase console or a secure admin tool.

## Deployment

Any static hosting solution that supports Vite builds works (Firebase Hosting, Vercel, Netlify, etc.). Run `npm run build` and upload the `dist` folder.
