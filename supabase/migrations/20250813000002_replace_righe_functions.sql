-- ================================================================
-- RPC transazionali per sostituzione righe DDT/Fattura
-- Obiettivo: garantire ordine DELETE (ripristino stock) -> INSERT (scarico)
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
BEGIN
  PERFORM set_config('app.bypass_stock', '1', true);
  -- 1) Ripristina stock cancellando le righe esistenti (robusto anche se i trigger mancano)
  FOR d_documento_carico_id, d_quantita, d_ddt_riga_id, d_articolo_id IN
    DELETE FROM fatture_vendita_righe
    WHERE fattura_id = p_fattura_id
    RETURNING documento_carico_id, quantita, ddt_riga_id, articolo_id
  LOOP
    -- Solo fatture dirette contribuiscono allo scarico/ripristino
    IF d_ddt_riga_id IS NULL THEN
      IF d_documento_carico_id IS NOT NULL THEN
        UPDATE documenti_carico SET quantita = quantita + d_quantita WHERE id = d_documento_carico_id;
      ELSE
        -- Fallback: il vecchio record non aveva documento_carico_id (versione precedente)
        -- Proviamo a indirizzare il ripristino sul carico specificato nelle nuove righe
        SELECT NULLIF((x->>'documento_carico_id')::bigint, 0)
        INTO target_carico
        FROM jsonb_array_elements(p_righe) AS x
        WHERE NULLIF((x->>'documento_carico_id')::bigint, 0) IS NOT NULL
          AND NULLIF((x->>'articolo_id')::bigint, 0) = d_articolo_id
        LIMIT 1;
        IF target_carico IS NOT NULL THEN
          UPDATE documenti_carico SET quantita = quantita + d_quantita WHERE id = target_carico;
        ELSE
          -- Ultimo fallback: ripristina sul carico più recente dello stesso articolo
          SELECT id INTO target_carico FROM documenti_carico
          WHERE articolo_id = d_articolo_id
          ORDER BY created_at DESC
          LIMIT 1;
          IF target_carico IS NOT NULL THEN
            UPDATE documenti_carico SET quantita = quantita + d_quantita WHERE id = target_carico;
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- 2) Inserisci nuove righe (trigger BEFORE INSERT scala lo stock)
  FOR r IN SELECT jsonb_array_elements(p_righe) LOOP
    INSERT INTO fatture_vendita_righe(
      fattura_id,
      ddt_riga_id,
      articolo_id,
      gruppo_id,
      prodotto_id,
      colore_id,
      provenienza_id,
      foto_id,
      imballo_id,
      altezza_id,
      qualita_id,
      documento_carico_id,
      quantita,
      prezzo_unitario,
      sconto_percentuale,
      prezzo_finale,
      iva_percentuale
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

  -- 3) Con bypass attivo i BEFORE INSERT non scalano: scala manualmente per fatture dirette
  UPDATE documenti_carico dc
  SET quantita = dc.quantita - x.qta
  FROM (
    SELECT NULLIF((elem->>'documento_carico_id')::bigint, 0) AS documento_carico_id,
           SUM((elem->>'quantita')::numeric) AS qta
    FROM jsonb_array_elements(p_righe) AS elem
    WHERE (elem->>'ddt_riga_id') IS NULL
      AND NULLIF((elem->>'documento_carico_id')::bigint, 0) IS NOT NULL
    GROUP BY 1
  ) AS x
  WHERE dc.id = x.documento_carico_id;

  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION replace_fattura_righe(BIGINT, JSONB) TO anon, authenticated;

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
  d_documento_carico_id BIGINT;
  d_quantita NUMERIC;
  d_articolo_id BIGINT;
  target_carico BIGINT;
BEGIN
  PERFORM set_config('app.bypass_stock', '1', true);
  -- 1) Ripristina stock cancellando le righe esistenti (robusto anche se i trigger mancano)
  FOR d_documento_carico_id, d_quantita, d_articolo_id IN
    DELETE FROM ddt_vendita_righe
    WHERE ddt_id = p_ddt_id
    RETURNING documento_carico_id, quantita, articolo_id
  LOOP
    IF d_documento_carico_id IS NOT NULL THEN
      UPDATE documenti_carico SET quantita = quantita + d_quantita WHERE id = d_documento_carico_id;
    ELSE
      SELECT NULLIF((x->>'documento_carico_id')::bigint, 0)
      INTO target_carico
      FROM jsonb_array_elements(p_righe) AS x
      WHERE NULLIF((x->>'documento_carico_id')::bigint, 0) IS NOT NULL
        AND NULLIF((x->>'articolo_id')::bigint, 0) = d_articolo_id
      LIMIT 1;
      IF target_carico IS NOT NULL THEN
        UPDATE documenti_carico SET quantita = quantita + d_quantita WHERE id = target_carico;
      ELSE
        SELECT id INTO target_carico FROM documenti_carico
        WHERE articolo_id = d_articolo_id
        ORDER BY created_at DESC
        LIMIT 1;
        IF target_carico IS NOT NULL THEN
          UPDATE documenti_carico SET quantita = quantita + d_quantita WHERE id = target_carico;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- 2) Inserisci nuove righe (trigger BEFORE INSERT scala lo stock)
  FOR r IN SELECT jsonb_array_elements(p_righe) LOOP
    INSERT INTO ddt_vendita_righe(
      ddt_id,
      ordine_riga_id,
      articolo_id,
      gruppo_id,
      prodotto_id,
      colore_id,
      provenienza_id,
      foto_id,
      imballo_id,
      altezza_id,
      qualita_id,
      documento_carico_id,
      quantita,
      prezzo_unitario,
      prezzo_finale,
      iva_percentuale
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

  -- 3) Con bypass attivo i BEFORE INSERT non scalano: scala manualmente per DDT
  UPDATE documenti_carico dc
  SET quantita = dc.quantita - x.qta
  FROM (
    SELECT NULLIF((elem->>'documento_carico_id')::bigint, 0) AS documento_carico_id,
           SUM((elem->>'quantita')::numeric) AS qta
    FROM jsonb_array_elements(p_righe) AS elem
    WHERE NULLIF((elem->>'documento_carico_id')::bigint, 0) IS NOT NULL
    GROUP BY 1
  ) AS x
  WHERE dc.id = x.documento_carico_id;

  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION replace_ddt_righe(BIGINT, JSONB) TO anon, authenticated;

COMMIT;


