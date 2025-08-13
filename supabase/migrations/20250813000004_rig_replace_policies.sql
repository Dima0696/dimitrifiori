-- ================================================================
-- RLS: consenti alle RPC di replace_*_righe di cancellare/inserire righe
-- quando è attivo il flag di sessione app.bypass_stock = '1'
-- Data: 2025-08-13
-- ================================================================

BEGIN;

-- Fatture
ALTER TABLE IF EXISTS fatture_vendita_righe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_replace_delete_fatt_righe ON fatture_vendita_righe;
CREATE POLICY allow_replace_delete_fatt_righe ON fatture_vendita_righe
  FOR DELETE
  USING ( current_setting('app.bypass_stock', true) = '1' );

DROP POLICY IF EXISTS allow_replace_insert_fatt_righe ON fatture_vendita_righe;
CREATE POLICY allow_replace_insert_fatt_righe ON fatture_vendita_righe
  FOR INSERT
  WITH CHECK ( current_setting('app.bypass_stock', true) = '1' );

-- DDT
ALTER TABLE IF EXISTS ddt_vendita_righe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_replace_delete_ddt_righe ON ddt_vendita_righe;
CREATE POLICY allow_replace_delete_ddt_righe ON ddt_vendita_righe
  FOR DELETE
  USING ( current_setting('app.bypass_stock', true) = '1' );

DROP POLICY IF EXISTS allow_replace_insert_ddt_righe ON ddt_vendita_righe;
CREATE POLICY allow_replace_insert_ddt_righe ON ddt_vendita_righe
  FOR INSERT
  WITH CHECK ( current_setting('app.bypass_stock', true) = '1' );

COMMIT;


