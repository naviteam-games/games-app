-- Enable Supabase Realtime for game tables so clients get
-- automatic notifications when rows change (no manual broadcasting needed).
--
-- REPLICA IDENTITY FULL is required so the WAL includes ALL columns.
-- Without it, Postgres Changes filters on non-primary-key columns
-- (e.g. room_id) silently fail because only the PK is in the WAL by default.

ALTER TABLE game_states  REPLICA IDENTITY FULL;
ALTER TABLE game_rooms   REPLICA IDENTITY FULL;
ALTER TABLE room_players REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'game_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_states;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'game_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'room_players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE room_players;
  END IF;
END $$;
