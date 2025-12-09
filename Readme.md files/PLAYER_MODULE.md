# Player Module - Game Registration System

## Overview
The player module allows users (players) to register for games in tournaments, view their registrations, and receive notifications when their registrations are approved or rejected by admins.

## Features Implemented

### 1. **Game Registration** (`/dashboard/register`)
- Browse all active tournaments
- View available games in each tournament
- See game details including:
  - Game type (Single Player or Pair)
  - Number of players per team
  - Tournament dates
- Register for single or pair games
- Real-time registration status tracking:
  - ✓ **Approved** - Registration approved by admin
  - ⏳ **Pending** - Waiting for admin approval
  - ✗ **Rejected** - Registration not approved
- Prevent duplicate registrations
- Option to re-register for rejected applications

### 2. **My Games** (`/dashboard/my-games`)
- View all game registrations in one place
- Filter registrations by status:
  - **All** - View all registrations
  - **Pending** - View registrations awaiting approval
  - **Approved** - View approved registrations
  - **Rejected** - View rejected registrations
- See detailed information for each registration:
  - Game name and type
  - Tournament name
  - Tournament start date
  - Registration date
  - Admin notes (if any)

### 3. **Notifications** (`/dashboard/notifications`)
- Real-time notifications for:
  - Game registration approvals
  - Game registration rejections
  - Match schedules (future enhancement)
- Notification features:
  - Mark individual notifications as read
  - Mark all notifications as read
  - Visual indicators for unread notifications
  - Timestamps showing when notifications were received
- Notification bell icon in header with unread count badge
- Auto-refresh every 30 seconds

### 4. **Admin Registration Management** (Enhanced)
When admins approve or reject player registrations, the system now:
- Sends detailed notifications to players including game name and tournament name
- Creates participant records for approved registrations
- Provides feedback messages for both approval and rejection

## User Flow

### Player Registration Flow
1. Player navigates to **Register for Games** page
2. Player selects a tournament from the dropdown
3. System displays all available games in that tournament
4. Player clicks "Register Now" on desired game
5. Registration is submitted with "pending" status
6. Player can view registration status in **My Games** page
7. Admin reviews and approves/rejects registration
8. Player receives notification about the decision
9. If approved, player can participate in the tournament

### Admin Approval Flow
1. Admin navigates to **Registrations Management** page
2. Admin selects tournament and optionally filters by game
3. Admin views all pending registrations
4. Admin clicks "Approve" or "Reject" for each registration
5. For approved registrations:
   - Player is added to participants list
   - Approval notification is sent to player
6. For rejected registrations:
   - Rejection notification is sent to player
   - Player can re-register if desired

## Technical Implementation

### New Pages Created
- `src/pages/player/GameRegistration.tsx` - Game registration interface
- `src/pages/player/MyGames.tsx` - View all registrations with filtering
- `src/pages/player/Notifications.tsx` - Notification center

### Enhanced Components
- `src/components/PlayerSidebar.tsx` - Added navigation items for new pages
- `src/components/PlayerHeader.tsx` - Added notification bell with unread count
- `src/pages/PlayerDashboard.tsx` - Added routes for new pages

### Enhanced Services
- `src/utils/notifications.ts` - Added functions for registration approval/rejection notifications
- `src/pages/admin/RegistrationsManagement.tsx` - Enhanced to send detailed notifications

### Routes
- `/dashboard/register` - Game registration page
- `/dashboard/my-games` - My games page
- `/dashboard/notifications` - Notifications page

## Database Collections Used

### `registrations`
```typescript
{
  id: string;
  tournament_id: string;
  game_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

### `notifications`
```typescript
{
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string; // "registration", "match", etc.
  is_read: boolean;
  created_at: timestamp;
  updated_at: timestamp;
  payload?: object;
}
```

### `participants`
```typescript
{
  id: string;
  tournament_id: string;
  game_id: string;
  type: "USER" | "TEAM";
  user_id?: string;
  team_id?: string;
  seed?: number;
  approved_by?: string;
  created_at: timestamp;
  updated_at: timestamp;
}
```

## Future Enhancements
1. **Team Formation**: Allow players to form teams for pair/team games
2. **Match Notifications**: Notify players when matches are scheduled
3. **Email Notifications**: Send email notifications in addition to in-app
4. **Registration Deadline**: Add deadline for registrations
5. **Payment Integration**: Support paid tournaments
6. **Player Rankings**: Show player rankings and statistics
7. **Chat/Messaging**: Allow communication between players and admins

## Notes
- Only active tournaments are shown to players
- Only active games within a tournament are shown
- Players cannot register for the same game multiple times (unless rejected and re-registering)
- Notifications refresh automatically every 30 seconds
- Admins must manually approve each registration
