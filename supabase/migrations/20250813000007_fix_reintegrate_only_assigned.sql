-- ================================================================
-- FIX: reintegro solo su righe assegnate (documento_carico_id NON NULL)
-- Rimuove il fallback che poteva generare reintegri eccessivi
-- Data: 2025-08-13
-- ================================================================

BEGIN;

-- FATTURE --------------------------------------------------------
CREATE OR REPLACE FUNCTION replace_fattura_righe(
  p_fattura_id BIGINT,
  p_righe JSONB
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r JSONB;
  n INTEGER := 0;
  rec RECORD;
BEGIN
  PERFORM set_config('app.bypass_stock', '1', true);

  -- 1) Reintegro: somma le righe correnti (solo con documento_carico_id assegnato)
  WITH old AS (
    SELECT documento_carico_id, SUM(quantita)::numeric AS qta
    FROM fatture_vendita_righe
    WHERE fattura_id = p_fattura_id AND ddt_riga_id IS NULL AND documento_carico_id IS NOT NULL
    GROUP BY 1
  )
  UPDATE documenti_carico dc
  SET quantita = dc.quantita + old.qta
  FROM old
  WHERE dc.id = old.documento_carico_id;

  -- 2) Cancella completamente le righe esistenti
  DELETE FROM fatture_vendita_righe WHERE fattura_id = p_fattura_id;

  -- 3) Inserisci le nuove righe
  FOR r IN SELECT jsonb_array_elements(p_righe) LOOP
    INSERT INTO fatture_vendita_righe(
      fattura_id, ddt_riga_id, articolo_id, gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id,
      documento_carico_id, quantita, prezzo_unitario, sconto_percentuale, prezzo_finale, iva_percentuale
    ) VALUES (
      p_fattura_id,
      NULLIF((r->>'ddt_riga_id')::bigint, 0),
      NULLIF((r->>'articolo_id')::bigint, 0),
      NULLIF((r->>'gruppo_id')::bigint, 0),
      NULLIF((r->>'prodotto_id')::bigint, 0),
      NULLIF((r->>'colore_id')::bigint, 0),
      NULLIF((r->>'provenienza_id')::bigint, 0),
      NULLIF((r->>'foto_id')::bigint, 0),
      NULLIF((r->>'imballo_id')::bigint, 0),
      NULLIF((r->>'altezza_id')::bigint, 0),
      NULLIF((r->>'qualita_id')::bigint, 0),
      NULLIF((r->>'documento_carico_id')::bigint, 0),
      (r->>'quantita')::numeric,
      COALESCE((r->>'prezzo_unitario')::numeric, (r->>'prezzo_finale')::numeric, 0),
      COALESCE((r->>'sconto_percentuale')::numeric, 0),
      COALESCE((r->>'prezzo_finale')::numeric, (r->>'prezzo_unitario')::numeric, 0),
      COALESCE((r->>'iva_percentuale')::numeric, 0)
    );
    n := n + 1;
  END LOOP;

  -- 4) Scala in modo sicuro (mai negativo) i carichi coinvolti dalle nuove righe
  FOR rec IN
    SELECT dc.id AS carico_id, dc.quantita AS disp,
           SUM((elem->>'quantita')::numeric) AS qta
    FROM jsonb_array_elements(p_righe) AS elem
    JOIN documenti_carico dc ON dc.id = NULLIF((elem->>'documento_carico_id')::bigint, 0)
    WHERE (elem->>'ddt_riga_id') IS NULL
      AND NULLIF((elem->>'documento_carico_id')::bigint, 0) IS NOT NULL
    GROUP BY dc.id, dc.quantita
  LOOP
    IF rec.disp < rec.qta THEN
      RAISE EXCEPTION 'Giacenza insufficiente (carico %, disp %, richiesto %)', rec.carico_id, rec.disp, rec.qta USING ERRCODE = 'P0001';
    END IF;
    UPDATE documenti_carico SET quantita = rec.disp - rec.qta WHERE id = rec.carico_id;
  END LOOP;

  RETURN n;
END;
$$;

COMMIT;


