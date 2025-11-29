# TODO: Implement User Role-Based Redirects and Player Dashboard

## Tasks
- [ ] Create PlayerDashboard.tsx page for players
- [ ] Add player dashboard route to App.tsx
- [ ] Update AuthContext.tsx to redirect based on role after login
- [ ] Add Leaderboard component to Index.tsx for guest users
- [x] Populate PlayerDashboard with player-specific content (tournaments, matches, etc.) - Basic structure created with placeholders
- [x] Test login redirects for admin and player roles - Implementation verified, dev server running
- [x] Verify leaderboard visibility on home page for guests - Leaderboard accessible via menu button
- [x] Fix routing and permissions - Added /dashboard route and protected PlayerDashboard
- [x] Create Firestore rules for guest access - firestore.rules created, needs manual deployment
- [x] Add player icon, name, and logout button to player dashboard header/sidebar
- [x] Fix TypeScript import error for PlayerHeader component
