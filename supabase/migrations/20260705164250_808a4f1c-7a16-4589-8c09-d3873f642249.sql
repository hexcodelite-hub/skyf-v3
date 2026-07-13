
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='skins bucket public read') THEN
    CREATE POLICY "skins bucket public read" ON storage.objects FOR SELECT USING (bucket_id = 'skins');
  END IF;
END $$;
