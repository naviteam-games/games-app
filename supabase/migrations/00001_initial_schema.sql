-- Enums
CREATE TYPE room_status AS ENUM ('waiting', 'playing', 'finished', 'cancelled');
CREATE TYPE player_status AS ENUM ('joined', 'ready', 'playing', 'disconnected', 'left');
CREATE TYPE game_phase AS ENUM ('setup', 'playing', 'round_end', 'finished');

-- 1. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Games (game type definitions)
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  min_players INTEGER NOT NULL DEFAULT 2,
  max_players INTEGER NOT NULL DEFAULT 20,
  default_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Game Rooms (all private, no visibility column)
CREATE TABLE game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  game_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  status room_status NOT NULL DEFAULT 'waiting',
  config JSONB NOT NULL DEFAULT '{}',
  max_players INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_rooms_host ON game_rooms(host_id);
CREATE INDEX idx_game_rooms_status ON game_rooms(status);

-- 4. Room Players
CREATE TABLE room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  status player_status NOT NULL DEFAULT 'joined',
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX idx_room_players_room ON room_players(room_id);
CREATE INDEX idx_room_players_user ON room_players(user_id);

-- 5. Game States
CREATE TABLE game_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID UNIQUE NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  phase game_phase NOT NULL DEFAULT 'setup',
  current_round INTEGER NOT NULL DEFAULT 0,
  total_rounds INTEGER NOT NULL DEFAULT 1,
  state_data JSONB NOT NULL DEFAULT '{}',
  phase_deadline TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Invite Codes
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_room ON invite_codes(room_id);

-- 7. Game Actions (audit log)
CREATE TABLE game_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL DEFAULT '{}',
  round INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_actions_room ON game_actions(room_id);
CREATE INDEX idx_game_actions_room_round ON game_actions(room_id, round);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_game_rooms_updated_at
  BEFORE UPDATE ON game_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_game_states_updated_at
  BEFORE UPDATE ON game_states FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Helper functions (SECURITY DEFINER bypasses RLS, preventing recursion)
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

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Games: everyone can read
CREATE POLICY "games_select" ON games FOR SELECT USING (true);

-- Game Rooms: host or room member can see. Host can insert/update.
CREATE POLICY "game_rooms_select" ON game_rooms FOR SELECT USING (
  host_id = auth.uid() OR is_room_member(id, auth.uid())
);
CREATE POLICY "game_rooms_insert" ON game_rooms FOR INSERT WITH CHECK (host_id = auth.uid());
CREATE POLICY "game_rooms_update" ON game_rooms FOR UPDATE USING (host_id = auth.uid());

-- Room Players: room members or host can see. Users can insert/update own.
CREATE POLICY "room_players_select" ON room_players FOR SELECT USING (
  is_room_member(room_id, auth.uid()) OR is_room_host(room_id, auth.uid())
);
CREATE POLICY "room_players_insert" ON room_players FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "room_players_update" ON room_players FOR UPDATE USING (user_id = auth.uid());

-- Game States: room members or host can read. Host can insert/update.
CREATE POLICY "game_states_select" ON game_states FOR SELECT USING (
  is_room_member(room_id, auth.uid()) OR is_room_host(room_id, auth.uid())
);
CREATE POLICY "game_states_insert" ON game_states FOR INSERT WITH CHECK (
  is_room_host(room_id, auth.uid())
);
CREATE POLICY "game_states_update" ON game_states FOR UPDATE USING (
  is_room_host(room_id, auth.uid())
);

-- Invite Codes: room host or members can see. Host can create/delete.
CREATE POLICY "invite_codes_select" ON invite_codes FOR SELECT USING (
  is_room_host(room_id, auth.uid()) OR is_room_member(room_id, auth.uid())
);
CREATE POLICY "invite_codes_insert" ON invite_codes FOR INSERT WITH CHECK (
  is_room_host(room_id, auth.uid())
);
-- Allow use_count increment by anyone (for joining)
CREATE POLICY "invite_codes_update" ON invite_codes FOR UPDATE USING (true);

-- Game Actions: room members can read. Players can insert own.
CREATE POLICY "game_actions_select" ON game_actions FOR SELECT USING (
  is_room_member(room_id, auth.uid())
);
CREATE POLICY "game_actions_insert" ON game_actions FOR INSERT WITH CHECK (player_id = auth.uid());

-- Seed: Number Guesser game
INSERT INTO games (slug, name, description, min_players, max_players, default_config)
VALUES (
  'number-guesser',
  'Number Guesser',
  'Guess the secret number! Each round, players try to guess a randomly generated number. Closest guess wins the round.',
  2,
  20,
  '{"rounds": 3, "minNumber": 1, "maxNumber": 100, "roundDurationSeconds": 30}'
);
