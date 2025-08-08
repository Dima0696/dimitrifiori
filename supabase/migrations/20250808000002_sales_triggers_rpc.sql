-- =========================================================================
-- VENDITE: Trigger movimenti DDT/Fatture dirette + RPC per DDT da Ordine e Resi
-- Data: 2025-08-08
-- =========================================================================

-- Safety
BEGIN;

-- Funzione TRIGGER: genera movimento SCARICO alla creazione riga DDT
CREATE OR REPLACE FUNCTION trg_ddt_riga_crea_scarico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_data_ddt date;
  v_cliente_id bigint;
  v_numero_ddt text;
BEGIN
  SELECT data_ddt, cliente_id, COALESCE(numero_ddt, id::text) INTO v_data_ddt, v_cliente_id, v_numero_ddt
  FROM ddt_vendita WHERE id = NEW.ddt_id;

  INSERT INTO movimenti_magazzino(
    tipo, data, quantita, prezzo_unitario, valore_totale,
    gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id,
    cliente_id, note
  ) VALUES (
    'scarico', v_data_ddt, NEW.quantita, COALESCE(NEW.prezzo_unitario, NEW.prezzo_finale),
    (NEW.quantita * COALESCE(NEW.prezzo_unitario, NEW.prezzo_finale)),
    NEW.gruppo_id, NEW.prodotto_id, NEW.colore_id, NEW.provenienza_id, NEW.foto_id, NEW.imballo_id, NEW.altezza_id, NEW.qualita_id,
    v_cliente_id, 'Scarico da DDT ' || v_numero_ddt
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bi_ddt_vendita_righe_crea_scarico ON ddt_vendita_righe;
CREATE TRIGGER bi_ddt_vendita_righe_crea_scarico
AFTER INSERT ON ddt_vendita_righe
FOR EACH ROW
EXECUTE FUNCTION trg_ddt_riga_crea_scarico();


-- Funzione TRIGGER: genera movimento SCARICO alla creazione riga Fattura diretta
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
  SELECT data_fattura, cliente_id, COALESCE(numero_fattura, id::text) INTO v_data_fatt, v_cliente_id, v_numero_fatt
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


-- Funzione RPC: crea DDT da Ordine con evasione parziale
-- p_righe_quantita: JSONB array di oggetti { ordine_riga_id: bigint, quantita: int }
CREATE OR REPLACE FUNCTION crea_ddt_da_ordine(
  p_ordine_id bigint,
  p_righe_quantita jsonb
) RETURNS TABLE(ddt_id bigint, numero_ddt text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ddt_id bigint;
  v_numero_ddt text;
  v_cliente_id bigint;
  v_data_ddt date := CURRENT_DATE;
  r record;
  v_qta int;
BEGIN
  SELECT cliente_id INTO v_cliente_id FROM ordini_vendita WHERE id = p_ordine_id FOR UPDATE;
  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Ordine non trovato: %', p_ordine_id USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO ddt_vendita(cliente_id, ordine_id, data_ddt, stato, note)
  VALUES (v_cliente_id, p_ordine_id, v_data_ddt, 'da_fatturare', 'Creato da ordine '||p_ordine_id)
  RETURNING id, numero_ddt INTO v_ddt_id, v_numero_ddt;

  -- Itera sulle righe richieste
  FOR r IN
    SELECT (elem->>'ordine_riga_id')::bigint AS ordine_riga_id,
           (elem->>'quantita')::int AS quantita
    FROM jsonb_array_elements(p_righe_quantita) AS elem
  LOOP
    IF r.quantita IS NULL OR r.quantita <= 0 THEN CONTINUE; END IF;

    -- Copia caratteristiche dalla riga ordine
    INSERT INTO ddt_vendita_righe(
      ddt_id, ordine_riga_id, articolo_id, gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id,
      quantita, prezzo_unitario, prezzo_finale, iva_percentuale
    )
    SELECT v_ddt_id, r.ordine_riga_id, articolo_id, gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id,
           r.quantita,
           prezzo_unitario,
           COALESCE(prezzo_unitario * (1 - COALESCE(sconto_percentuale,0)/100.0), prezzo_unitario),
           10 -- IVA default 10%
    FROM ordini_vendita_righe WHERE id = r.ordine_riga_id;
  END LOOP;

  -- Aggiorna stato ordine in funzione dell'evasione (semplice: parz_evaso)
  UPDATE ordini_vendita SET stato = CASE WHEN stato <> 'evaso' THEN 'parz_evaso' ELSE stato END WHERE id = p_ordine_id;

  RETURN QUERY SELECT v_ddt_id, COALESCE(v_numero_ddt, v_ddt_id::text);
END;
$$;


-- Estensione RPC esistente: calcolo IVA e stato DDT
CREATE OR REPLACE FUNCTION genera_fattura_vendita_da_ddt(p_ddt_id bigint)
RETURNS TABLE(fattura_id bigint, numero_fattura text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_id bigint;
  v_data date := CURRENT_DATE;
  v_id bigint;
  v_numero text;
  v_imponibile numeric := 0;
  v_iva numeric := 0;
BEGIN
  SELECT cliente_id INTO v_cliente_id FROM ddt_vendita WHERE id = p_ddt_id FOR UPDATE;
  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION 'DDT non trovato: %', p_ddt_id USING ERRCODE = 'P0001';
  END IF;

  -- Calcola totali da righe DDT
  SELECT COALESCE(SUM(prezzo_finale * quantita),0), COALESCE(SUM((prezzo_finale * quantita) * (COALESCE(iva_percentuale,0)/100.0)),0)
  INTO v_imponibile, v_iva
  FROM ddt_vendita_righe WHERE ddt_id = p_ddt_id;

  INSERT INTO fatture_vendita(cliente_id, data_fattura, stato, imponibile, iva, totale, note)
  VALUES (v_cliente_id, v_data, 'non_pagata', v_imponibile, v_iva, v_imponibile + v_iva, 'Fattura da DDT '||p_ddt_id)
  RETURNING id, numero_fattura INTO v_id, v_numero;

  -- Copia righe
  INSERT INTO fatture_vendita_righe(
    fattura_id, ddt_riga_id, articolo_id, gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id,
    quantita, prezzo_unitario, sconto_percentuale, prezzo_finale, iva_percentuale
  )
  SELECT v_id, r.id, r.articolo_id, r.gruppo_id, r.prodotto_id, r.colore_id, r.provenienza_id, r.foto_id, r.imballo_id, r.altezza_id, r.qualita_id,
         r.quantita, r.prezzo_unitario, 0, r.prezzo_finale, r.iva_percentuale
  FROM ddt_vendita_righe r
  WHERE r.ddt_id = p_ddt_id;

  -- Aggiorna stato DDT
  UPDATE ddt_vendita SET stato = 'fatturato' WHERE id = p_ddt_id;

  RETURN QUERY SELECT v_id, COALESCE(v_numero, v_id::text);
END;
$$;


-- RPC Reso: genera movimenti carico/distruzione e nota di credito opzionale
-- p_righe: JSONB array { fattura_riga_id: bigint NULL, articolo_ref: jsonb, quantita: int, esito: 'reintegro'|'distruzione', prezzo_unitario: numeric }
CREATE OR REPLACE FUNCTION crea_reso(
  p_origine_tipo text,
  p_origine_id bigint,
  p_cliente_id bigint,
  p_righe jsonb
) RETURNS TABLE(nota_credito_id bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nc_id bigint;
  r record;
  v_data date := CURRENT_DATE;
BEGIN
  IF p_origine_tipo = 'fattura' THEN
    INSERT INTO note_credito_vendita(cliente_id, data_nota, fattura_origine_id, stato, totale, note)
    VALUES (p_cliente_id, v_data, p_origine_id, 'aperta', 0, 'Reso da fattura '||p_origine_id)
    RETURNING id INTO v_nc_id;
  END IF;

  FOR r IN
    SELECT (elem->>'fattura_riga_id')::bigint AS fattura_riga_id,
           (elem->'articolo_ref') AS articolo_ref,
           (elem->>'quantita')::int AS quantita,
           (elem->>'esito')::text AS esito,
           (elem->>'prezzo_unitario')::numeric AS prezzo_unitario
    FROM jsonb_array_elements(p_righe) elem
  LOOP
    -- Movimento magazzino
    IF r.esito = 'reintegro' THEN
      INSERT INTO movimenti_magazzino(
        tipo, data, quantita, prezzo_unitario, valore_totale,
        gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id,
        cliente_id, note
      ) VALUES (
        'carico', v_data, r.quantita, r.prezzo_unitario, (r.quantita * r.prezzo_unitario),
        (r.articolo_ref->>'gruppo_id')::bigint, (r.articolo_ref->>'prodotto_id')::bigint, (r.articolo_ref->>'colore_id')::bigint,
        (r.articolo_ref->>'provenienza_id')::bigint, (r.articolo_ref->>'foto_id')::bigint, (r.articolo_ref->>'imballo_id')::bigint,
        (r.articolo_ref->>'altezza_id')::bigint, (r.articolo_ref->>'qualita_id')::bigint,
        p_cliente_id, 'Reso cliente'
      );
    ELSE
      INSERT INTO movimenti_magazzino(
        tipo, data, quantita, prezzo_unitario, valore_totale,
        gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id,
        cliente_id, note
      ) VALUES (
        'distruzione', v_data, r.quantita, NULL, NULL,
        (r.articolo_ref->>'gruppo_id')::bigint, (r.articolo_ref->>'prodotto_id')::bigint, (r.articolo_ref->>'colore_id')::bigint,
        (r.articolo_ref->>'provenienza_id')::bigint, (r.articolo_ref->>'foto_id')::bigint, (r.articolo_ref->>'imballo_id')::bigint,
        (r.articolo_ref->>'altezza_id')::bigint, (r.articolo_ref->>'qualita_id')::bigint,
        p_cliente_id, 'Reso con distruzione'
      );
    END IF;

    -- Righe NC se aperta
    IF v_nc_id IS NOT NULL THEN
      INSERT INTO note_credito_vendita_righe(nota_id, fattura_riga_id, articolo_id, quantita, prezzo_unitario, iva_percentuale)
      VALUES (v_nc_id, r.fattura_riga_id, NULL, r.quantita, r.prezzo_unitario, 10);
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_nc_id;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION crea_ddt_da_ordine(bigint, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION genera_fattura_vendita_da_ddt(bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION crea_reso(text, bigint, bigint, jsonb) TO anon, authenticated;

-- Fatturazione differita di fine mese: per ogni cliente crea 1 fattura da tutti i DDT del mese
CREATE OR REPLACE FUNCTION genera_fatture_differite(
  p_anno int,
  p_mese int,
  p_cliente_id bigint DEFAULT NULL
) RETURNS TABLE(fattura_id bigint, cliente_id bigint, numero_fattura text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_cliente record;
  v_id bigint;
  v_numero text;
  v_imponibile numeric;
  v_iva numeric;
BEGIN
  FOR r_cliente IN
    SELECT DISTINCT d.cliente_id
    FROM ddt_vendita d
    WHERE d.stato = 'da_fatturare'
      AND date_part('year', d.data_ddt) = p_anno
      AND date_part('month', d.data_ddt) = p_mese
      AND (p_cliente_id IS NULL OR d.cliente_id = p_cliente_id)
  LOOP
    -- Calcola totali cliente
    SELECT COALESCE(SUM(r.prezzo_finale * r.quantita),0), COALESCE(SUM((r.prezzo_finale * r.quantita) * (COALESCE(r.iva_percentuale,0)/100.0)),0)
    INTO v_imponibile, v_iva
    FROM ddt_vendita_righe r
    JOIN ddt_vendita d ON d.id = r.ddt_id
    WHERE d.cliente_id = r_cliente.cliente_id
      AND d.stato = 'da_fatturare'
      AND date_part('year', d.data_ddt) = p_anno
      AND date_part('month', d.data_ddt) = p_mese;

    INSERT INTO fatture_vendita(cliente_id, data_fattura, stato, imponibile, iva, totale, note)
    VALUES (r_cliente.cliente_id, make_date(p_anno, p_mese, 28), 'non_pagata', v_imponibile, v_iva, v_imponibile + v_iva, 'Fatturazione differita mese')
    RETURNING id, numero_fattura INTO v_id, v_numero;

    -- Copia tutte le righe
    INSERT INTO fatture_vendita_righe(
      fattura_id, ddt_riga_id, articolo_id, gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id,
      quantita, prezzo_unitario, sconto_percentuale, prezzo_finale, iva_percentuale
    )
    SELECT v_id, r.id, r.articolo_id, r.gruppo_id, r.prodotto_id, r.colore_id, r.provenienza_id, r.foto_id, r.imballo_id, r.altezza_id, r.qualita_id,
           r.quantita, r.prezzo_unitario, 0, r.prezzo_finale, r.iva_percentuale
    FROM ddt_vendita_righe r
    JOIN ddt_vendita d ON d.id = r.ddt_id
    WHERE d.cliente_id = r_cliente.cliente_id
      AND d.stato = 'da_fatturare'
      AND date_part('year', d.data_ddt) = p_anno
      AND date_part('month', d.data_ddt) = p_mese;

    -- Marca DDT come fatturati
    UPDATE ddt_vendita SET stato = 'fatturato'
    WHERE cliente_id = r_cliente.cliente_id
      AND stato = 'da_fatturare'
      AND date_part('year', data_ddt) = p_anno
      AND date_part('month', data_ddt) = p_mese;

    RETURN QUERY SELECT v_id, r_cliente.cliente_id, v_numero;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION genera_fatture_differite(int, int, bigint) TO anon, authenticated;

COMMIT;


