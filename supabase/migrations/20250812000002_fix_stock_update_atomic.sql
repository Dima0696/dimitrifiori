-- ================================================================
-- FIX: Allocazione stock atomica per evitare quantita negative
-- Usa UPDATE con condizione quantita >= richiesta e RETURNING
-- Data: 2025-08-12
-- ================================================================

BEGIN;

-- DDT: BEFORE INSERT -> alloca e decrementa stock in modo atomico
CREATE OR REPLACE FUNCTION bddt_riga_adjust_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_carico_id bigint;
  v_left int;
BEGIN
  IF NEW.quantita IS NULL OR NEW.quantita <= 0 THEN
    RAISE EXCEPTION 'Quantità riga DDT non valida';
  END IF;

  -- Se manca il carico, scegline uno con abbastanza disponibilità (FIFO)
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

  -- Decremento atomico: fallisce se non c'è disponibilità
  UPDATE documenti_carico
  SET quantita = quantita - NEW.quantita
  WHERE id = NEW.documento_carico_id AND quantita >= NEW.quantita
  RETURNING quantita INTO v_left;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Scarico oltre giacenza disponibile';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bdi_ddt_righe_adjust_stock ON ddt_vendita_righe;
CREATE TRIGGER bdi_ddt_righe_adjust_stock
BEFORE INSERT ON ddt_vendita_righe
FOR EACH ROW EXECUTE FUNCTION bddt_riga_adjust_stock();

-- FATTURE DIRETTE: BEFORE INSERT -> alloca e decrementa stock in modo atomico
CREATE OR REPLACE FUNCTION bfatt_riga_adjust_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_carico_id bigint;
  v_left int;
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

  UPDATE documenti_carico
  SET quantita = quantita - NEW.quantita
  WHERE id = NEW.documento_carico_id AND quantita >= NEW.quantita
  RETURNING quantita INTO v_left;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Scarico oltre giacenza disponibile';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bdi_fatt_righe_adjust_stock ON fatture_vendita_righe;
CREATE TRIGGER bdi_fatt_righe_adjust_stock
BEFORE INSERT ON fatture_vendita_righe
FOR EACH ROW EXECUTE FUNCTION bfatt_riga_adjust_stock();

COMMIT;


