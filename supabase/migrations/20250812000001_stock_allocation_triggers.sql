-- ================================================================
-- Stock allocation & restore on DDT / Fatture dirette
-- - Consenti giacenze a 0
-- - Alloca e decrementa stock su inserimento riga DDT
-- - Alloca e decrementa stock su inserimento riga FATTURA solo se diretta
-- - Ripristina stock alla cancellazione delle righe
-- Data: 2025-08-12
-- ================================================================

BEGIN;

-- 1) Consenti giacenze a 0
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'documenti_carico' 
      AND constraint_name = 'documenti_carico_quantita_check'
  ) THEN
    ALTER TABLE documenti_carico DROP CONSTRAINT documenti_carico_quantita_check;
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END$$;

ALTER TABLE documenti_carico
  ADD CONSTRAINT documenti_carico_quantita_check CHECK (quantita >= 0);

-- 2) Colonne di tracciamento carico sulle righe DDT/Fattura
ALTER TABLE IF EXISTS ddt_vendita_righe
  ADD COLUMN IF NOT EXISTS documento_carico_id bigint REFERENCES documenti_carico(id) ON UPDATE CASCADE;

ALTER TABLE IF EXISTS fatture_vendita_righe
  ADD COLUMN IF NOT EXISTS documento_carico_id bigint REFERENCES documenti_carico(id) ON UPDATE CASCADE;

-- 3) DDT: BEFORE INSERT -> alloca e decrementa; AFTER DELETE -> ripristina
CREATE OR REPLACE FUNCTION bddt_riga_adjust_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_carico_id bigint;
  v_qta numeric;
  v_disp numeric;
BEGIN
  IF NEW.quantita IS NULL OR NEW.quantita <= 0 THEN
    RAISE EXCEPTION 'Quantità riga DDT non valida';
  END IF;

  -- Se non specificato, tenta allocazione semplice sul primo carico sufficiente (FIFO)
  IF NEW.documento_carico_id IS NULL THEN
    IF NEW.articolo_id IS NULL THEN
      RAISE EXCEPTION 'Manca articolo_id per allocare il carico';
    END IF;
    SELECT id INTO v_carico_id
    FROM documenti_carico
    WHERE articolo_id = NEW.articolo_id AND quantita >= NEW.quantita
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;
    IF v_carico_id IS NULL THEN
      RAISE EXCEPTION 'Giacenza insufficiente per articolo %', NEW.articolo_id;
    END IF;
    NEW.documento_carico_id := v_carico_id;
  END IF;

  -- Decrementa dal carico selezionato in modo sicuro
  SELECT quantita INTO v_disp FROM documenti_carico WHERE id = NEW.documento_carico_id FOR UPDATE;
  IF v_disp IS NULL THEN
    RAISE EXCEPTION 'Documento di carico % non trovato', NEW.documento_carico_id;
  END IF;
  IF v_disp < NEW.quantita THEN
    RAISE EXCEPTION 'Scarico oltre giacenza disponibile (disp: %, richiesto: %)', v_disp, NEW.quantita;
  END IF;
  UPDATE documenti_carico SET quantita = v_disp - NEW.quantita WHERE id = NEW.documento_carico_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bdi_ddt_righe_adjust_stock ON ddt_vendita_righe;
CREATE TRIGGER bdi_ddt_righe_adjust_stock
BEFORE INSERT ON ddt_vendita_righe
FOR EACH ROW EXECUTE FUNCTION bddt_riga_adjust_stock();

CREATE OR REPLACE FUNCTION addt_riga_restore_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.documento_carico_id IS NOT NULL AND OLD.quantita > 0 THEN
    UPDATE documenti_carico SET quantita = quantita + OLD.quantita WHERE id = OLD.documento_carico_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS ad_ddt_righe_restore_stock ON ddt_vendita_righe;
CREATE TRIGGER ad_ddt_righe_restore_stock
AFTER DELETE ON ddt_vendita_righe
FOR EACH ROW EXECUTE FUNCTION addt_riga_restore_stock();

-- 4) FATTURE DIRETTE: BEFORE INSERT -> alloca e decrementa; AFTER DELETE -> ripristina
CREATE OR REPLACE FUNCTION bfatt_riga_adjust_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_carico_id bigint;
  v_qta numeric;
  v_disp numeric;
BEGIN
  -- Se la riga proviene da DDT, non toccare lo stock (scarico già avvenuto col DDT)
  IF NEW.ddt_riga_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.quantita IS NULL OR NEW.quantita <= 0 THEN
    RAISE EXCEPTION 'Quantità riga Fattura non valida';
  END IF;

  IF NEW.documento_carico_id IS NULL THEN
    IF NEW.articolo_id IS NULL THEN
      RAISE EXCEPTION 'Manca articolo_id per allocare il carico';
    END IF;
    SELECT id INTO v_carico_id
    FROM documenti_carico
    WHERE articolo_id = NEW.articolo_id AND quantita >= NEW.quantita
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;
    IF v_carico_id IS NULL THEN
      RAISE EXCEPTION 'Giacenza insufficiente per articolo %', NEW.articolo_id;
    END IF;
    NEW.documento_carico_id := v_carico_id;
  END IF;

  SELECT quantita INTO v_disp FROM documenti_carico WHERE id = NEW.documento_carico_id FOR UPDATE;
  IF v_disp IS NULL THEN
    RAISE EXCEPTION 'Documento di carico % non trovato', NEW.documento_carico_id;
  END IF;
  IF v_disp < NEW.quantita THEN
    RAISE EXCEPTION 'Scarico oltre giacenza disponibile (disp: %, richiesto: %)', v_disp, NEW.quantita;
  END IF;
  UPDATE documenti_carico SET quantita = v_disp - NEW.quantita WHERE id = NEW.documento_carico_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bdi_fatt_righe_adjust_stock ON fatture_vendita_righe;
CREATE TRIGGER bdi_fatt_righe_adjust_stock
BEFORE INSERT ON fatture_vendita_righe
FOR EACH ROW EXECUTE FUNCTION bfatt_riga_adjust_stock();

CREATE OR REPLACE FUNCTION afatt_riga_restore_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ripristina solo per fatture dirette
  IF OLD.ddt_riga_id IS NULL AND OLD.documento_carico_id IS NOT NULL AND OLD.quantita > 0 THEN
    UPDATE documenti_carico SET quantita = quantita + OLD.quantita WHERE id = OLD.documento_carico_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS ad_fatt_righe_restore_stock ON fatture_vendita_righe;
CREATE TRIGGER ad_fatt_righe_restore_stock
AFTER DELETE ON fatture_vendita_righe
FOR EACH ROW EXECUTE FUNCTION afatt_riga_restore_stock();

COMMIT;


