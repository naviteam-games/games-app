-- Helper functions (SECURITY DEFINER bypasses RLS, breaking the recursion)
CREATE OR REPLACE FUNCTION is_room_member(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM room_players
    WHERE room_id = p_room_id AND user_id = p_user_id AND status != 'left'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_room_host(p_room_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM game_rooms
    WHERE id = p_room_id AND host_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Drop the recursive policies
DROP POLICY IF EXISTS "game_rooms_select" ON game_rooms;
DROP POLICY IF EXISTS "room_players_select" ON room_players;
DROP POLICY IF EXISTS "game_states_select" ON game_states;
DROP POLICY IF EXISTS "game_states_insert" ON game_states;
DROP POLICY IF EXISTS "game_states_update" ON game_states;
DROP POLICY IF EXISTS "invite_codes_select" ON invite_codes;
DROP POLICY IF EXISTS "invite_codes_insert" ON invite_codes;
DROP POLICY IF EXISTS "game_actions_select" ON game_actions;

-- Recreate with helper functions (no recursion)
CREATE POLICY "game_rooms_select" ON game_rooms FOR SELECT USING (
  host_id = auth.uid() OR is_room_member(id, auth.uid())
);

CREATE POLICY "room_players_select" ON room_players FOR SELECT USING (
  is_room_member(room_id, auth.uid()) OR is_room_host(room_id, auth.uid())
);

CREATE POLICY "game_states_select" ON game_states FOR SELECT USING (
  is_room_member(room_id, auth.uid()) OR is_room_host(room_id, auth.uid())
);
CREATE POLICY "game_states_insert" ON game_states FOR INSERT WITH CHECK (
  is_room_host(room_id, auth.uid())
);
CREATE POLICY "game_states_update" ON game_states FOR UPDATE USING (
  is_room_host(room_id, auth.uid())
);

CREATE POLICY "invite_codes_select" ON invite_codes FOR SELECT USING (
  is_room_host(room_id, auth.uid()) OR is_room_member(room_id, auth.uid())
);
CREATE POLICY "invite_codes_insert" ON invite_codes FOR INSERT WITH CHECK (
  is_room_host(room_id, auth.uid())
);

CREATE POLICY "game_actions_select" ON game_actions FOR SELECT USING (
  is_room_member(room_id, auth.uid())
);
