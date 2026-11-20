-- Migration 019: create the 'sounds' Supabase Storage bucket.
-- server/routes/sounds.js uploads audio files via the Supabase Storage API
-- to the 'sounds' bucket. Without this bucket every upload returns a 400.
-- Storage policies are set so the service-role key can read/write freely
-- (the route authenticates via its own JWT before calling Storage).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sounds',
  'sounds',
  false,
  10485760,
  ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/wave','audio/x-wav','audio/ogg','audio/webm','audio/mp4','audio/m4a','audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='sounds_insert_own'
  ) THEN
    CREATE POLICY "sounds_insert_own" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'sounds' AND auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='sounds_select_own'
  ) THEN
    CREATE POLICY "sounds_select_own" ON storage.objects FOR SELECT
      USING (bucket_id = 'sounds');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='sounds_delete_own'
  ) THEN
    CREATE POLICY "sounds_delete_own" ON storage.objects FOR DELETE
      USING (bucket_id = 'sounds' AND auth.uid() IS NOT NULL);
  END IF;
END $$;
