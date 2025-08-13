-- ================================================================
-- RLS FIX: consenti INSERIMENTO normale delle righe fattura/DDT
-- lasciando attive le policy di bypass per le RPC di replace
-- Data: 2025-08-13
-- ================================================================

BEGIN;

-- FATTURE: consenti INSERT/SELECT normali per anon & authenticated
ALTER TABLE IF EXISTS fatture_vendita_righe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_app_insert_fatt_righe ON fatture_vendita_righe;
CREATE POLICY allow_app_insert_fatt_righe ON fatture_vendita_righe
  FOR INSERT
  TO anon, authenticated
  WITH CHECK ( true );

DROP POLICY IF EXISTS allow_app_select_fatt_righe ON fatture_vendita_righe;
CREATE POLICY allow_app_select_fatt_righe ON fatture_vendita_righe
  FOR SELECT
  TO anon, authenticated
  USING ( true );

-- DDT: consenti INSERT/SELECT normali per anon & authenticated
ALTER TABLE IF EXISTS ddt_vendita_righe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_app_insert_ddt_righe ON ddt_vendita_righe;
CREATE POLICY allow_app_insert_ddt_righe ON ddt_vendita_righe
  FOR INSERT
  TO anon, authenticated
  WITH CHECK ( true );

DROP POLICY IF EXISTS allow_app_select_ddt_righe ON ddt_vendita_righe;
CREATE POLICY allow_app_select_ddt_righe ON ddt_vendita_righe
  FOR SELECT
  TO anon, authenticated
  USING ( true );

COMMIT;


