-- Add is_anonymous column to profiles
ALTER TABLE profiles ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT false;

-- Update handle_new_user() trigger to detect anonymous sign-ups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, is_anonymous)
  VALUES (
    NEW.id,
    CASE
      WHEN NEW.is_anonymous THEN 'Guest_' || substr(NEW.id::text, 1, 6)
      ELSE COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    END,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.is_anonymous, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Allow anonymous users to update their own display name
CREATE POLICY "profiles_update_anonymous" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
