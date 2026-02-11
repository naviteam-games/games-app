# Upgrading to Near-Instant Real-Time Updates

Currently the room page polls the server every 3 seconds. This guide covers switching to Supabase Postgres Changes for sub-second updates.

## Prerequisites

### 1. Enable Realtime in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Database > Replication**
3. Find the `supabase_realtime` publication
4. Toggle ON these tables:
   - `game_rooms`
   - `game_states`
   - `room_players`

### 2. Verify Migration 00005 Is Applied

Migration `00005_enable_realtime.sql` sets `REPLICA IDENTITY FULL` on all three tables and adds them to the publication. This is required because the subscriptions filter by `room_id`, which is not the primary key. Without `REPLICA IDENTITY FULL`, filters on non-PK columns silently match nothing.

Verify with this SQL in the Supabase SQL Editor:

```sql
-- Check publication membership
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- Should include: game_rooms, game_states, room_players

-- Check replica identity
SELECT relname, relreplident FROM pg_class
WHERE relname IN ('game_rooms', 'game_states', 'room_players');
-- relreplident should be 'f' (full) for all three
```

## Code Change

Replace the polling in `src/app/(game)/room/[roomId]/page.tsx`.

### Remove

```tsx
const POLL_INTERVAL_MS = 3000;

// ...

const fetchRef = useRef(fetchRoom);
fetchRef.current = fetchRoom;

useEffect(() => {
  if (!user) return;
  const id = setInterval(() => { fetchRef.current(); }, POLL_INTERVAL_MS);
  return () => clearInterval(id);
}, [user]);
```

### Add

```tsx
import { createClient } from "@/infrastructure/supabase/client";

// inside the component:
const supabase = createClient();

const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const debouncedFetch = useCallback(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => { fetchRoom(); }, 300);
}, [fetchRoom]);

useEffect(() => {
  if (!user) return;

  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
      () => { debouncedFetch(); }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "game_states", filter: `room_id=eq.${roomId}` },
      () => { debouncedFetch(); }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
      () => { debouncedFetch(); }
    )
    .subscribe();

  return () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    supabase.removeChannel(channel);
  };
}, [roomId, supabase, debouncedFetch, user]);
```

The 300ms debounce coalesces rapid-fire events when a single action updates multiple tables (e.g., action route writes to both `game_states` and `room_players`).

## Testing

1. Open two browser windows on the same room
2. Open the browser DevTools Network tab on both
3. Have one player perform an action (guess, ready up, etc.)
4. The other player should see the update within ~500ms without any manual refresh
5. Confirm no polling requests in the Network tab (only the subscription WebSocket frame)

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| No events received at all | Tables not in publication or Realtime not enabled in dashboard | Check Dashboard > Database > Replication |
| `id` filter works but `room_id` filter doesn't | `REPLICA IDENTITY` not set to FULL | Run `ALTER TABLE <table> REPLICA IDENTITY FULL;` |
| Events received but RLS blocks delivery | User's JWT can't SELECT the row | Verify `is_room_member` / `is_room_host` returns true for the user |
| Events fire but double-fetch happens | Debounce too short or missing | Increase debounce from 300ms or check the ref cleanup |

## Hybrid Approach (Recommended)

For maximum reliability, keep polling as a fallback alongside Postgres Changes. Use a longer poll interval (e.g., 10 seconds) as a safety net:

```tsx
const FALLBACK_POLL_MS = 10000;

// Postgres Changes subscription (same as above)
// ...

// Fallback poll in case Realtime drops
const fetchRef = useRef(fetchRoom);
fetchRef.current = fetchRoom;

useEffect(() => {
  if (!user) return;
  const id = setInterval(() => { fetchRef.current(); }, FALLBACK_POLL_MS);
  return () => clearInterval(id);
}, [user]);
```
