# Teams Module Implementation

## Tasks
- [x] Update TeamsManagement.tsx to include tournament and game selection dropdowns
- [x] Add list of teams for selected tournament/game with team details and player count
- [x] Implement create team dialog: form for name, is_pair checkbox
- [x] Implement edit team dialog: update name, status
- [x] Implement manage players dialog per team: multi-select from users to add/remove players
- [x] Add delete team functionality
- [x] Handle loading states, errors with toast notifications
- [x] Implement game type-specific logic:
  - TEAM games: Show "Add Team" button, allow custom team names, limit players per team
  - PAIR games: Show "Add Pair" button, auto-generate names, limit to exactly 2 players
  - SINGLE games: Show message that team management is not needed
- [x] Update UI to display pairs as "Player1 & Player2" instead of team names
- [x] Add player count validation based on game type
- [x] Test the full flow in the admin panel (compilation successful, no errors)
- [x] Verify Firebase integration for teams and users collections
- [x] Ensure proper error handling and user feedback
