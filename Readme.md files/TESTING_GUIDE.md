# Testing Guide for Player Game Registration

## Setup Instructions

To test the player game registration feature, you need to have data in your Firestore database. Follow these steps:

### 1. Create a Tournament (Admin)
1. Login as admin
2. Go to **Tournaments Management**
3. Click "Create Tournament"
4. Fill in the details:
   - Name: e.g., "Summer Tournament 2024"
   - Start Date: Select a future date
   - End Date: Select an end date
   - Status: Set to "active"
   - Make sure "Is Active" checkbox is checked ✓
5. Click "Create"

### 2. Create Games in the Tournament (Admin)
1. Stay logged in as admin
2. Go to **Games Management**
3. Click "Create Game"
4. Fill in the details:
   - Select the tournament you just created
   - Name: e.g., "Cricket", "Football", "Chess"
   - Game Type: Select "SINGLE" or "PAIR"
   - Players per Team: 
     - For SINGLE: set to 1
     - For PAIR: set to 2
   - Make sure "Is Active" checkbox is checked ✓
5. Click "Create"
6. Repeat to create multiple games

### 3. Register for Games (Player)
1. Logout from admin
2. Login as a player (or create a new player account)
3. Go to **Register for Games** in the sidebar
4. You should see the tournament in the dropdown
5. Select the tournament
6. You should now see all the games you created
7. Click "Register Now" on any game
8. You'll see a success message: "Your registration has been submitted for admin approval"
9. The game card will now show "⏳ Pending Approval"

### 4. Approve Registration (Admin)
1. Logout from player
2. Login as admin
3. Go to **Registrations Management**
4. Select the tournament from the dropdown
5. You should see the pending registration from the player
6. Click "Approve" button
7. The system will:
   - Update registration status to "approved"
   - Create a participant record
   - Send a notification to the player

### 5. Check Notification (Player)
1. Logout from admin
2. Login as the player
3. You should see a red badge (🔔) on the notification bell in the header
4. Click the bell to see the notification:
   - "Game Registration Approved! 🎉"
   - "Your registration for [GameName] in [TournamentName] has been approved. Good luck!"
5. Check **My Games** page to see your approved registration

## Troubleshooting

### "No active tournaments available"
**Solution**: Make sure you've created at least one tournament in the admin panel and that:
- The tournament's "Is Active" flag is set to true
- The tournament status is "active" or any status (we now show all is_active tournaments)

### "No active games available in this tournament"
**Solution**: Make sure you've created games for the selected tournament and that:
- The games are associated with the correct tournament_id
- The games' "Is Active" flag is set to true (we now show all games)

### "Registration request not showing in admin panel"
**Solution**: 
1. Make sure you selected the correct tournament in the admin's Registrations Management page
2. Check the browser console for any errors
3. Refresh the page

### Checking Database Directly
If nothing appears, check your Firestore database:

1. **Tournaments Collection**: Should have at least one document with:
   ```
   {
     name: "Tournament Name",
     is_active: true,
     status: "active",
     created_at: (timestamp),
     updated_at: (timestamp)
   }
   ```

2. **Games Collection**: Should have at least one document with:
   ```
   {
     name: "Game Name",
     tournament_id: "tournament_document_id",
     game_type: "SINGLE" or "PAIR",
     players_per_team: 1 or 2,
     is_active: true,
     created_at: (timestamp),
     updated_at: (timestamp)
   }
   ```

3. **Registrations Collection**: After player registers, should have:
   ```
   {
     tournament_id: "tournament_document_id",
     game_id: "game_document_id",
     user_id: "player_user_id",
     status: "pending",
     created_at: (timestamp),
     updated_at: (timestamp)
   }
   ```

## Debug Mode

The GameRegistration page now has console logging enabled. Open the browser console (F12) to see:
- "Fetched tournaments: [...]" - Shows all tournaments from database
- "Available tournaments: [...]" - Shows filtered tournaments
- "Fetched games for tournament: [...] - Shows all games for selected tournament
- "User registrations: [...]" - Shows all registrations
- "User's registrations: [...]" - Shows only current user's registrations

## Complete Flow Diagram

```
ADMIN CREATES TOURNAMENT
         ↓
ADMIN CREATES GAMES
         ↓
PLAYER BROWSES TOURNAMENTS
         ↓
PLAYER SELECTS TOURNAMENT
         ↓
PLAYER VIEWS AVAILABLE GAMES
         ↓
PLAYER CLICKS "REGISTER NOW"
         ↓
REGISTRATION CREATED (status: pending)
         ↓
ADMIN VIEWS PENDING REGISTRATIONS
         ↓
ADMIN CLICKS "APPROVE"
         ↓
REGISTRATION STATUS → approved
PARTICIPANT RECORD CREATED
NOTIFICATION SENT TO PLAYER
         ↓
PLAYER RECEIVES NOTIFICATION 🔔
         ↓
PLAYER CAN NOW BE ADDED TO MATCHES
```

## Important Notes

1. **Only Approved Players**: Only players with approved registrations should be shown when an admin creates matches/games
2. **Notification Bell**: The bell icon auto-refreshes every 30 seconds
3. **Re-registration**: If a registration is rejected, the player can register again
4. **No Duplicates**: Players cannot register for the same game twice (unless rejected)
