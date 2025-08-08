-- ============================================================================
-- FIX: Fattura diretta non deve creare DDT, e cancellazione coerente
-- - Il trigger su fatture_vendita_righe crea movimenti SOLO per fatture dirette
--   (ddt_riga_id IS NULL)
-- - Aggiunto trigger di DELETE che ripristina un carico se si cancella una
--   riga di fattura diretta
-- - Elimina_fattura_vendita_completa: non genera DDT; se la fattura proveniva
--   da DDT, rimette i DDT in stato 'da_fatturare'; altrimenti cancella e basta
-- Data: 2025-08-08
-- ============================================================================

BEGIN;

-- 1) Trigger INSERT su righe fattura: solo per fatture dirette
CREATE OR REPLACE FUNCTION trg_fattura_riga_crea_scarico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_data_fatt date;
  v_cliente_id bigint;
  v_numero_fatt text;
BEGIN
  -- Esegui solo per fatture dirette (non provenienti da DDT)
  IF NEW.ddt_riga_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT data_fattura, cliente_id, COALESCE(numero_fattura, id::text)
  INTO v_data_fatt, v_cliente_id, v_numero_fatt
  FROM fatture_vendita WHERE id = NEW.fattura_id;

  INSERT INTO movimenti_magazzino(
    tipo, data, quantita, prezzo_unitario, valore_totale,
    gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id,
    cliente_id, note
  ) VALUES (
    'scarico', v_data_fatt, NEW.quantita, COALESCE(NEW.prezzo_unitario, NEW.prezzo_finale),
    (NEW.quantita * COALESCE(NEW.prezzo_unitario, NEW.prezzo_finale)),
    NEW.gruppo_id, NEW.prodotto_id, NEW.colore_id, NEW.provenienza_id, NEW.foto_id, NEW.imballo_id, NEW.altezza_id, NEW.qualita_id,
    v_cliente_id, 'Scarico da Fattura ' || v_numero_fatt
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bi_fatture_vendita_righe_crea_scarico ON fatture_vendita_righe;
CREATE TRIGGER bi_fatture_vendita_righe_crea_scarico
AFTER INSERT ON fatture_vendita_righe
FOR EACH ROW
EXECUTE FUNCTION trg_fattura_riga_crea_scarico();

-- 2) Trigger DELETE su righe fattura diretta: ripristino carico
CREATE OR REPLACE FUNCTION trg_fattura_riga_delete_ripristina_carico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_data_fatt date;
  v_cliente_id bigint;
  v_numero_fatt text;
BEGIN
  IF OLD.ddt_riga_id IS NOT NULL THEN
    RETURN OLD;
  END IF;

  SELECT data_fattura, cliente_id, COALESCE(numero_fattura, id::text)
  INTO v_data_fatt, v_cliente_id, v_numero_fatt
  FROM fatture_vendita WHERE id = OLD.fattura_id;

  INSERT INTO movimenti_magazzino(
    tipo, data, quantita, prezzo_unitario, valore_totale,
    gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id,
    cliente_id, note
  ) VALUES (
    'carico', v_data_fatt, OLD.quantita, COALESCE(OLD.prezzo_unitario, OLD.prezzo_finale),
    (OLD.quantita * COALESCE(OLD.prezzo_unitario, OLD.prezzo_finale)),
    OLD.gruppo_id, OLD.prodotto_id, OLD.colore_id, OLD.provenienza_id, OLD.foto_id, OLD.imballo_id, OLD.altezza_id, OLD.qualita_id,
    v_cliente_id, 'Annullamento riga fattura ' || v_numero_fatt
  );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS ad_fatture_vendita_righe_delete_ripristino ON fatture_vendita_righe;
CREATE TRIGGER ad_fatture_vendita_righe_delete_ripristino
AFTER DELETE ON fatture_vendita_righe
FOR EACH ROW
EXECUTE FUNCTION trg_fattura_riga_delete_ripristina_carico();

-- 3) Funzione eliminazione fattura coerente
CREATE OR REPLACE FUNCTION elimina_fattura_vendita_completa(p_fattura_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_payments boolean;
  v_has_nc boolean;
  v_has_ddt boolean;
BEGIN
  -- Blocchi
  SELECT EXISTS(SELECT 1 FROM pagamenti_vendita WHERE fattura_id = p_fattura_id) INTO v_has_payments;
  IF v_has_payments THEN
    RAISE EXCEPTION 'Fattura con pagamenti: impossibile eliminare' USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS(SELECT 1 FROM note_credito_vendita WHERE fattura_origine_id = p_fattura_id) INTO v_has_nc;
  IF v_has_nc THEN
    RAISE EXCEPTION 'Fattura con note di credito: impossibile eliminare' USING ERRCODE = 'P0001';
  END IF;

  -- Se proveniente da DDT (almeno una riga ha ddt_riga_id)
  SELECT EXISTS(SELECT 1 FROM fatture_vendita_righe WHERE fattura_id = p_fattura_id AND ddt_riga_id IS NOT NULL)
  INTO v_has_ddt;

  IF v_has_ddt THEN
    -- Rimetti i DDT coinvolti in stato da_fatturare
    UPDATE ddt_vendita SET stato = 'da_fatturare'
    WHERE id IN (
      SELECT DISTINCT ddt_id FROM ddt_vendita_righe WHERE id IN (
        SELECT ddt_riga_id FROM fatture_vendita_righe WHERE fattura_id = p_fattura_id AND ddt_riga_id IS NOT NULL
      )
    );
  END IF;

  -- Elimina righe (trigger DELETE ripristina stock per fatture dirette)
  DELETE FROM fatture_vendita_righe WHERE fattura_id = p_fattura_id;
  -- Elimina testata
  DELETE FROM fatture_vendita WHERE id = p_fattura_id;

END;
$$;

COMMIT;


