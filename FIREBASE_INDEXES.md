# Firebase Firestore Indexes Configuration

Use these exact configurations in Firebase Console → Firestore Database → Indexes → Create Index.

## Collection Scope: Collection (not Collection Group)

---

## 1. games Collection

**Index Name:** `games-tournament_id-created_at`

- **Collection ID:** `games`
- **Fields:**
  1. `tournament_id` - Ascending
  2. `created_at` - Descending

**Query it supports:**
```typescript
where("tournament_id", "==", tournamentId)
orderBy("created_at", "desc")
```

---

## 2. matches Collection

### Index 1: With gameId filter
**Index Name:** `matches-game_id-tournament_id-round_index-match_order`

- **Collection ID:** `matches`
- **Fields:**
  1. `game_id` - Ascending
  2. `tournament_id` - Ascending
  3. `round_index` - Ascending
  4. `match_order` - Ascending

**Query it supports:**
```typescript
where("tournament_id", "==", tournamentId)
where("game_id", "==", gameId)
orderBy("round_index", "asc")
orderBy("match_order", "asc")
```

### Index 2: Without gameId filter
**Index Name:** `matches-tournament_id-round_index-match_order`

- **Collection ID:** `matches`
- **Fields:**
  1. `tournament_id` - Ascending
  2. `round_index` - Ascending
  3. `match_order` - Ascending

**Query it supports:**
```typescript
where("tournament_id", "==", tournamentId)
orderBy("round_index", "asc")
orderBy("match_order", "asc")
```

---

## 3. participants Collection

### Index 1: With gameId filter
**Index Name:** `participants-game_id-tournament_id-seed-created_at`

- **Collection ID:** `participants`
- **Fields:**
  1. `game_id` - Ascending
  2. `tournament_id` - Ascending
  3. `seed` - Ascending
  4. `created_at` - Ascending

**Query it supports:**
```typescript
where("tournament_id", "==", tournamentId)
where("game_id", "==", gameId)
orderBy("seed", "asc")
orderBy("created_at", "asc")
```

### Index 2: Without gameId filter
**Index Name:** `participants-tournament_id-seed-created_at`

- **Collection ID:** `participants`
- **Fields:**
  1. `tournament_id` - Ascending
  2. `seed` - Ascending
  3. `created_at` - Ascending

**Query it supports:**
```typescript
where("tournament_id", "==", tournamentId)
orderBy("seed", "asc")
orderBy("created_at", "asc")
```

---

## 4. leaderboard Collection

**Index Name:** `leaderboard-tournament_id-points`

- **Collection ID:** `leaderboard`
- **Fields:**
  1. `tournament_id` - Ascending
  2. `points` - Descending

**Query it supports:**
```typescript
where("tournament_id", "==", tournamentId)
orderBy("points", "desc")
```

---

## 5. registrations Collection

### Index 1: General filter
**Index Name:** `registrations-tournament_id-created_at`

- **Collection ID:** `registrations`
- **Fields:**
  1. `tournament_id` - Ascending
  2. `created_at` - Descending

### Index 2: With gameId filter
**Index Name:** `registrations-game_id-tournament_id-created_at`

- **Collection ID:** `registrations`
- **Fields:**
  1. `game_id` - Ascending
  2. `tournament_id` - Ascending
  3. `created_at` - Descending

### Index 3: Advanced filtering (Tourney + Game + Status)
**Index Name:** `registrations-tournament_id-game_id-status-created_at`

- **Collection ID:** `registrations`
- **Fields:**
  1. `tournament_id` - Ascending
  2. `game_id` - Ascending
  3. `status` - Ascending
  4. `created_at` - Descending

---

## 6. teams Collection

**Index Name:** `teams-game_id-tournament_id-created_at`

- **Collection ID:** `teams`
- **Fields:**
  1. `game_id` - Ascending
  2. `tournament_id` - Ascending
  3. `created_at` - Descending

---

## Quick Setup Instructions

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `qtonz-sports`
3. Navigate to: **Firestore Database** → **Indexes** tab
4. Click **Create Index** button
5. For each index above:
   - Select **Collection** scope (not Collection Group)
   - Enter the **Collection ID** exactly as shown
   - Add fields in the exact order shown
   - Set Ascending/Descending as specified
   - Click **Create**

**Note:** Indexes can take a few minutes to build. Once status shows "Enabled", the queries will work.

---

## Alternative: Use the Error URLs

When you see an error like:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Just click that URL and Firebase will auto-populate the index configuration for you. Then click **Create**.
