-- ================================================================
-- FIX: aggiornamento stock sicuro (mai negativo) nelle RPC replace
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
  d_documento_carico_id BIGINT;
  d_quantita NUMERIC;
  d_ddt_riga_id BIGINT;
  d_articolo_id BIGINT;
  target_carico BIGINT;
  rec RECORD;
BEGIN
  PERFORM set_config('app.bypass_stock', '1', true);

  -- 1) Ripristina: aggiungi le quantità delle vecchie righe ai carichi collegati
  --    (prima di cancellare, così lo stock torna disponibile)
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

  -- Per eventuali righe senza documento_carico_id (versioni vecchie),
  -- prova a reintegrare sul carico indicato nelle nuove righe dello stesso articolo
  FOR d_articolo_id IN
    SELECT DISTINCT articolo_id FROM fatture_vendita_righe WHERE fattura_id = p_fattura_id AND documento_carico_id IS NULL AND ddt_riga_id IS NULL
  LOOP
    SELECT NULLIF((x->>'documento_carico_id')::bigint, 0) INTO target_carico
    FROM jsonb_array_elements(p_righe) AS x
    WHERE NULLIF((x->>'articolo_id')::bigint, 0) = d_articolo_id
      AND NULLIF((x->>'documento_carico_id')::bigint, 0) IS NOT NULL
    LIMIT 1;
    IF target_carico IS NOT NULL THEN
      UPDATE documenti_carico SET quantita = quantita + (
        SELECT COALESCE(SUM(quantita),0) FROM fatture_vendita_righe
        WHERE fattura_id = p_fattura_id AND ddt_riga_id IS NULL AND articolo_id = d_articolo_id AND documento_carico_id IS NULL
      )
      WHERE id = target_carico;
    END IF;
  END LOOP;

  -- 2) Cancella le vecchie righe
  FOR d_documento_carico_id, d_quantita, d_ddt_riga_id, d_articolo_id IN
    DELETE FROM fatture_vendita_righe
    WHERE fattura_id = p_fattura_id
    RETURNING documento_carico_id, quantita, ddt_riga_id, articolo_id
  LOOP
    -- già reintegrato sopra
  END LOOP;

  -- 3) INSERT nuove righe
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

  -- 4) Scala manualmente in modo sicuro (mai negativo) SOLO per fatture dirette
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

-- DDT ------------------------------------------------------------
CREATE OR REPLACE FUNCTION replace_ddt_righe(
  p_ddt_id BIGINT,
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

  -- 1) Ripristina
  DELETE FROM ddt_vendita_righe WHERE ddt_id = p_ddt_id;

  -- 2) INSERT nuove righe
  FOR r IN SELECT jsonb_array_elements(p_righe) LOOP
    INSERT INTO ddt_vendita_righe(
      ddt_id, ordine_riga_id, articolo_id, gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id,
      documento_carico_id, quantita, prezzo_unitario, prezzo_finale, iva_percentuale
    ) VALUES (
      p_ddt_id,
      NULLIF((r->>'ordine_riga_id')::bigint, 0),
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
      COALESCE((r->>'prezzo_finale')::numeric, (r->>'prezzo_unitario')::numeric, 0),
      COALESCE((r->>'iva_percentuale')::numeric, 0)
    );
    n := n + 1;
  END LOOP;

  -- 3) Scala manualmente in modo sicuro (mai negativo)
  FOR rec IN
    SELECT dc.id AS carico_id, dc.quantita AS disp,
           SUM((elem->>'quantita')::numeric) AS qta
    FROM jsonb_array_elements(p_righe) AS elem
    JOIN documenti_carico dc ON dc.id = NULLIF((elem->>'documento_carico_id')::bigint, 0)
    WHERE NULLIF((elem->>'documento_carico_id')::bigint, 0) IS NOT NULL
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


