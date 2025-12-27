# 🏆 SportsBracket

> A comprehensive sports tournament management system for campus sports weeks, built with modern web technologies.

[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.10.0-orange)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.19-purple)](https://vitejs.dev/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Firebase Data Model](#firebase-data-model)
- [User Roles](#user-roles)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

**SportsBracket** is a full-featured web application designed to streamline the management of campus sports events. It provides a dual-interface system where administrators can configure and manage tournaments, games, teams, and matches, while players can self-register, track their performance, view schedules, and compete on leaderboards.

### 🌟 Key Highlights

- **Dual Role System**: Separate admin and player experiences
- **Real-time Updates**: Live leaderboards, schedules, and notifications
- **Modern UI/UX**: Premium design with dark mode support
- **Mobile Responsive**: Fully optimized for all device sizes
- **Authentication**: Google OAuth and Email/Password support
- **Cloud-Based**: Firebase backend for real-time data synchronization

## ✨ Features

### 👑 Admin Panel

#### Dashboard & Overview
- **Statistics Dashboard**: Real-time metrics for tournaments, games, matches, and users
- **Visual Analytics**: Charts and graphs for data visualization using Recharts
- **Quick Actions**: Fast access to common administrative tasks

#### Tournament Management
- Create and manage multiple tournaments
- Set tournament dates (start/end)
- Activate/deactivate tournaments
- Track tournament participants and statistics

#### Game Management
- Configure different sports/games (Cricket, Football, Basketball, etc.)
- Define game types (Singles, Doubles, Team)
- Set players per team requirements
- Manage game availability

#### Team Management
- Create and organize teams
- Assign players to teams
- View team rosters and statistics
- Manage team participation in tournaments

#### Match Management
- Schedule matches with date, time, and location
- Assign teams to matches
- Record match results and scores
- Track match status (Scheduled, Completed, Cancelled)
- Update match winners

#### Match Scheduling
- Interactive calendar view for match scheduling
- Drag-and-drop interface for easy scheduling
- Conflict detection and validation
- Bulk scheduling capabilities

#### Player Registration Approval
- Review player registration requests
- Approve/reject individual registrations
- Bulk approval for filtered requests
- Filter by game/sport type

#### Participants Management
- View all registered participants
- Filter by approval status and game type
- Track participant engagement
- Manage participant details

#### Leaderboard Management
- Configure tournament-wide or game-specific leaderboards
- Real-time standings sync
- Points calculation system (3 points for win, 0 for loss)
- Manual leaderboard refresh and sync

#### Users Management
- View all registered users
- **Role Management**: Change user roles (Player ↔ Admin)
- Search and filter users by name, email, or department
- User profile overview with avatar display
- Scrollable table with fixed headers for easy navigation

### 🎮 Player Features

#### Player Dashboard
- **Personal Statistics**: 
  - Tournaments joined
  - Matches played
  - Win/Loss record
  - Upcoming matches count
- **Quick Navigation**: Direct links to key features
- **Recent Activity**: Latest matches and notifications

#### Game Registration
- Browse available games/sports
- Submit registration requests for tournaments
- View registration status (Pending, Approved, Rejected)
- Multi-game registration support

#### My Tournaments
- View all enrolled tournaments
- Track tournament progress
- See tournament schedules
- Access tournament leaderboards

#### My Games
- View registered games
- Check team assignments
- Monitor game-specific statistics
- Access game schedules

#### My Matches
- View all scheduled matches
- See upcoming and past matches
- Check match results and scores
- Track win/loss records

#### Schedule View
- Interactive calendar displaying all matches
- Filter by tournament or game
- Click matches for detailed information
- Automatic timezone handling

#### Leaderboard
- Real-time tournament standings
- Game-specific leaderboards
- Overall tournament rankings
- Points, wins, and losses tracking

#### Notifications
- Match scheduling alerts
- Registration status updates
- Tournament announcements
- Match result notifications
- Mark as read/unread functionality

#### Profile Management
- Update personal information
- Manage profile picture
- Edit contact details
- Update department and gender info

### 🎨 UI/UX Features

- **Modern Design System**: Premium gradients, glassmorphism effects
- **Dark Mode**: Full theme support with smooth transitions
- **Animations**: Micro-interactions and smooth transitions
- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Custom Scrollbars**: Styled scrollbars matching the theme
- **Loading States**: Global loading overlay and component-level loaders
- **Toast Notifications**: User-friendly success/error messages
- **Form Validation**: Real-time validation with helpful error messages

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19
- **Routing**: React Router DOM 6.30.1
- **State Management**: TanStack Query 5.83.0

### UI Components & Styling
- **Styling**: Vanilla CSS with CSS Variables
- **Component Library**: Radix UI Primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Calendar**: React Day Picker
- **Date Handling**: date-fns

### Backend & Services
- **Backend**: Firebase 11.10.0
  - Authentication (Email/Password + Google OAuth)
  - Cloud Firestore (NoSQL Database)
  - Cloud Storage (for avatars and images)
- **PWA Support**: Vite Plugin PWA

### Development Tools
- **Linting**: ESLint 9.32.0
- **Package Manager**: npm
- **Version Control**: Git

## 📁 Project Structure

```
SportsBracket/
├── public/                      # Static assets
├── src/
│   ├── components/              # Reusable UI components (61 components)
│   │   ├── ui/                  # Shadcn/UI components
│   │   └── ...                  # Custom components
│   ├── contexts/                # React Context providers
│   │   ├── AuthContext.tsx      # Authentication context
│   │   └── LoadingContext.tsx   # Global loading state
│   ├── hooks/                   # Custom React hooks
│   │   └── use-toast.ts         # Toast notification hook
│   ├── integrations/            # Third-party integrations
│   │   └── supabase/            # Legacy (migrated to Firebase)
│   ├── lib/                     # Utility libraries
│   │   ├── firebase.ts          # Firebase configuration
│   │   └── utils.ts             # Helper functions
│   ├── pages/                   # Page components
│   │   ├── admin/               # Admin panel pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── GamesManagement.tsx
│   │   │   ├── LeaderboardManagement.tsx
│   │   │   ├── MatchesManagement.tsx
│   │   │   ├── MatchesSchedule.tsx
│   │   │   ├── Overview.tsx
│   │   │   ├── ParticipantsManagement.tsx
│   │   │   ├── RegistrationsManagement.tsx
│   │   │   ├── TeamsManagement.tsx
│   │   │   ├── TournamentsManagement.tsx
│   │   │   └── UsersManagement.tsx
│   │   ├── player/              # Player portal pages
│   │   │   ├── GameRegistration.tsx
│   │   │   ├── MyGames.tsx
│   │   │   ├── MyMatches.tsx
│   │   │   ├── MyTournaments.tsx
│   │   │   ├── Notifications.tsx
│   │   │   ├── PlayerSchedule.tsx
│   │   │   └── ProfileManagement.tsx
│   │   ├── Index.tsx            # Landing page
│   │   ├── Leaderboard.tsx      # Public leaderboard
│   │   ├── Login.tsx            # Login page
│   │   ├── Register.tsx         # Registration page
│   │   ├── Schedule.tsx         # Public schedule
│   │   └── NotFound.tsx         # 404 page
│   ├── services/                # API services
│   │   └── firestore/           # Firestore CRUD operations
│   │       ├── games.ts
│   │       ├── leaderboard.ts
│   │       ├── matches.ts
│   │       ├── notifications.ts
│   │       ├── participants.ts
│   │       ├── registrations.ts
│   │       ├── teams.ts
│   │       ├── tournaments.ts
│   │       └── users.ts
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # App entry point
│   └── index.css                # Global styles
├── .env                         # Environment variables (create this)
├── package.json                 # Project dependencies
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
└── README.md                    # This file
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js (or use yarn/pnpm)
- **Git**: For version control
- **Firebase Account**: Free tier is sufficient
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

### Firebase Setup Requirements

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable the following services:
   - **Authentication**:
     - Email/Password provider
     - Google OAuth provider
   - **Cloud Firestore**: Native mode
   - **Cloud Storage**: For profile pictures

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Divyesh-Sar2003/SportsBracket.git
cd SportsBracket
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env  # If example exists, otherwise create new file
```

### 4. Set Up Firebase (See next section)

## 🔐 Environment Variables

Create a `.env` file at the project root with your Firebase credentials:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### How to Get Firebase Credentials:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → Project Settings
4. Scroll to "Your apps" section
5. Click on the Web app (</> icon)
6. Copy the configuration values

## 💻 Development

### Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:5173**

### First-Time Setup

1. **Create an Admin Account**:
   - Register a new account through the UI
   - Go to Firebase Console → Firestore Database
   - Find the `user_roles` collection
   - Locate your user ID document
   - Add `"admin"` to the `roles` array

2. **Seed Initial Data** (Optional):
   - Create tournaments through Admin Panel
   - Add games/sports
   - Configure teams

## 🗄 Firebase Data Model

### Collections Structure

#### `profiles/{userId}`
User profile information collected during registration.

```typescript
{
  name: string
  email: string
  phone: string
  department: string
  gender: "male" | "female" | "other"
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `user_roles/{userId}`
User role assignments for access control.

```typescript
{
  roles: string[]  // ["player"] or ["admin"] or both
}
```

#### `games/{gameId}`
Sports/game configurations.

```typescript
{
  name: string                    // e.g., "Cricket", "Football"
  game_type: string              // "Singles", "Doubles", "Team"
  players_per_team: number       // Number of players per team
  is_active: boolean             // Active status
  createdAt: Timestamp
}
```

#### `tournaments/{tournamentId}`
Tournament configurations.

```typescript
{
  name: string                   // Tournament name
  start_date: Timestamp         // Start date
  end_date: Timestamp          // End date
  is_active: boolean           // Active status
  createdAt: Timestamp
}
```

#### `teams/{teamId}`
Team information.

```typescript
{
  name: string
  tournament_id: string
  game_id: string
  player_ids: string[]          // Array of player user IDs
  createdAt: Timestamp
}
```

#### `matches/{matchId}`
Match scheduling and results.

```typescript
{
  tournament_id: string
  game_id: string
  team1_id: string
  team2_id: string
  scheduled_date: Timestamp
  location: string
  status: "scheduled" | "completed" | "cancelled"
  winner_id?: string            // Team ID of winner
  team1_score?: number
  team2_score?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `registrations/{registrationId}`
Player registration requests.

```typescript
{
  user_id: string
  game_id: string
  tournament_id: string
  status: "pending" | "approved" | "rejected"
  createdAt: Timestamp
}
```

#### `participants/{participantId}`
Approved participants.

```typescript
{
  user_id: string
  game_id: string
  tournament_id: string
  team_id?: string
  createdAt: Timestamp
}
```

#### `leaderboard/{leaderboardId}`
Tournament standings.

```typescript
{
  tournament_id: string
  game_id?: string              // Optional for game-specific leaderboards
  user_id: string
  team_id?: string
  points: number                // 3 per win, 0 per loss
  wins: number
  losses: number
  matches_played: number
  updatedAt: Timestamp
}
```

#### `notifications/{notificationId}`
User notifications.

```typescript
{
  user_id: string
  title: string
  message: string
  type: "match" | "registration" | "tournament" | "general"
  is_read: boolean
  related_id?: string          // ID of related entity
  createdAt: Timestamp
}
```

## 👥 User Roles

### Player Role
Default role for all new registrations. Players can:
- Register for games and tournaments
- View schedules and leaderboards
- Track personal statistics
- Receive notifications
- Update profile

### Admin Role
Granted manually through Firebase Console. Admins can:
- All player capabilities, plus:
- Create and manage tournaments
- Configure games
- Approve registrations
- Schedule matches
- Manage teams
- Update match results
- Manage user roles
- View system analytics

### How to Grant Admin Access

1. Navigate to Firebase Console
2. Go to Firestore Database
3. Open `user_roles` collection
4. Find the user's document (document ID = user ID)
5. Edit the `roles` field to include `"admin"`:
   ```json
   {
     "roles": ["player", "admin"]
   }
   ```
6. Save changes
7. User must log out and log back in to see admin features

## 📜 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development (with dev mode enabled)
npm run build:dev

# Preview production build locally
npm run preview

# Run ESLint
npm run lint
```

## 🚀 Deployment

SportsBracket can be deployed to any static hosting service that supports Vite builds.

### Deploy to GitHub Pages

The project is already configured for GitHub Pages (see `homepage` in `package.json`).

```bash
# Build the project
npm run build

# Deploy (if you have gh-pages configured)
npm run deploy
```

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting

# Build the project
npm run build

# Deploy
firebase deploy
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod
```

### Environment Variables in Production

Remember to set your environment variables in your hosting platform:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment
- **Firebase Hosting**: Use `.env.production` file (not recommended) or Firebase Functions

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Update documentation for new features
- Test thoroughly before submitting PR
- Ensure no ESLint errors

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Divyesh Sarvaiya**
- GitHub: [@Divyesh-Sar2003](https://github.com/Divyesh-Sar2003)
- Project Link: [SportsBracket](https://github.com/Divyesh-Sar2003/SportsBracket)

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Framework
- [Firebase](https://firebase.google.com/) - Backend Services
- [Radix UI](https://www.radix-ui.com/) - Component Primitives
- [Tailwind CSS](https://tailwindcss.com/) - Initial styling inspiration
- [Lucide](https://lucide.dev/) - Icon Library
- [Vite](https://vitejs.dev/) - Build Tool

## 📞 Support

If you encounter any issues or have questions:

1. Check existing [Issues](https://github.com/Divyesh-Sar2003/SportsBracket/issues)
2. Create a new issue with detailed information
3. Provide error messages, screenshots, and steps to reproduce

---

<div align="center">

**Built with ❤️ for sports management**

⭐ Star this repo if you find it helpful!

</div>
