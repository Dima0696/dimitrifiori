-- ================================================================
-- Bypass controllato dei trigger stock per operazioni transazionali
-- Aggiunge guardia su funzioni BEFORE INSERT: se app.bypass_stock = '1'
-- il trigger non esegue controlli/modifiche (usato da replace_*_righe)
-- Data: 2025-08-13
-- ================================================================

BEGIN;

-- DDT
CREATE OR REPLACE FUNCTION bddt_riga_adjust_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_carico_id bigint;
  v_disp numeric;
BEGIN
  IF current_setting('app.bypass_stock', true) = '1' THEN
    RETURN NEW;
  END IF;

  IF NEW.quantita IS NULL OR NEW.quantita <= 0 THEN
    RAISE EXCEPTION 'Quantità riga DDT non valida';
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

-- FATTURE DIRETTE
CREATE OR REPLACE FUNCTION bfatt_riga_adjust_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_carico_id bigint;
  v_disp numeric;
BEGIN
  IF current_setting('app.bypass_stock', true) = '1' THEN
    RETURN NEW;
  END IF;

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

COMMIT;


