-- ================================================================
-- MIGRATION: Add articolo_id to movimenti_magazzino
-- Safe change: non impatta la logica esistente (colonna opzionale)
-- Data: 2025-08-13
-- ================================================================

BEGIN;

-- Aggiunge la colonna articolo_id se assente
ALTER TABLE IF EXISTS movimenti_magazzino
  ADD COLUMN IF NOT EXISTS articolo_id BIGINT REFERENCES articoli(id);

-- Indice per ricerche per articolo
CREATE INDEX IF NOT EXISTS idx_movimenti_articolo ON movimenti_magazzino(articolo_id);

COMMIT;


