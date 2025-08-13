-- Webshop settings and featured products

CREATE TABLE IF NOT EXISTS webshop_settings (
  id bigint PRIMARY KEY DEFAULT 1,
  is_online boolean NOT NULL DEFAULT false,
  base_url text,
  allow_guest boolean NOT NULL DEFAULT false,
  listino_default text NOT NULL DEFAULT 'L1' CHECK (listino_default IN ('L1','L2','L3')),
  homepage_banner text,
  theme_primary text NOT NULL DEFAULT '#f59e0b',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure only a single row exists (id=1)
INSERT INTO webshop_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Policies
ALTER TABLE webshop_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webshop_settings' AND policyname = 'allow_select_settings'
  ) THEN
    CREATE POLICY allow_select_settings ON webshop_settings
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'webshop_settings' AND policyname = 'allow_upsert_settings_auth'
  ) THEN
    CREATE POLICY allow_upsert_settings_auth ON webshop_settings
      FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY allow_update_settings_auth ON webshop_settings
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;


