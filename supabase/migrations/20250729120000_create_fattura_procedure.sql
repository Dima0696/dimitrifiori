-- =========================================================================
-- PROCEDURA INTEGRATA: INSERIMENTO FATTURA + CREAZIONE DOCUMENTO DI CARICO
-- Segue il sistema a 7 caratteristiche di DimitriFlor
-- =========================================================================

CREATE OR REPLACE FUNCTION inserisci_fattura_con_documento_carico(
  -- Dati fattura base
  p_numero_fattura VARCHAR(50),
  p_data_fattura DATE,
  p_id_fornitore INTEGER,  -- Riferimento alla tabella fornitori (anagrafica)
  p_totale DECIMAL(10,2),
  
  -- Dati prodotto con 7 caratteristiche
  p_id_gruppo INTEGER,     -- Da anagrafica gruppi
  p_nome_prodotto VARCHAR(255),  -- Nome prodotto (manuale, viene salvato in anagrafica)
  p_id_colore INTEGER,     -- Da anagrafica colori
  p_id_provenienza INTEGER, -- Da anagrafica provenienze
  p_id_foto INTEGER,       -- Da anagrafica foto
  p_id_imballo INTEGER,    -- Da anagrafica imballaggi
  p_id_altezza INTEGER,    -- Da anagrafica altezze
  
  -- Dati di carico
  p_quantita INTEGER,
  p_prezzo_acquisto_per_stelo DECIMAL(10,4),
  
  -- Parametri opzionali (tutti con default alla fine)
  p_stato VARCHAR(20) DEFAULT 'bozza',
  p_note TEXT DEFAULT NULL,
  p_prezzo_vendita_1 DECIMAL(10,4) DEFAULT NULL,
  p_prezzo_vendita_2 DECIMAL(10,4) DEFAULT NULL,
  p_prezzo_vendita_3 DECIMAL(10,4) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_fattura_id INTEGER;
  v_prodotto_id INTEGER;
  v_articolo_id INTEGER;
  v_documento_id INTEGER;
  v_result JSONB;
BEGIN
  
  -- ===== FASE 1: INSERIMENTO FATTURA =====
  INSERT INTO fatture_acquisto (
    numero, 
    data, 
    fornitore_id, 
    totale, 
    stato, 
    note
  ) VALUES (
    p_numero_fattura,
    p_data_fattura,
    p_id_fornitore,
    p_totale,
    p_stato,
    p_note
  ) RETURNING id INTO v_fattura_id;
  
  RAISE NOTICE 'Fattura inserita con ID: %', v_fattura_id;
  
  -- ===== FASE 2: GESTIONE PRODOTTO (anagrafica) =====
  -- I prodotti sono indipendenti dal gruppo - cerca solo per nome
  SELECT id INTO v_prodotto_id
  FROM prodotti
  WHERE nome = p_nome_prodotto;
  
  -- Se il prodotto non esiste, crealo nell'anagrafica
  IF v_prodotto_id IS NULL THEN
    INSERT INTO prodotti (nome)
    VALUES (p_nome_prodotto)
    RETURNING id INTO v_prodotto_id;
    
    RAISE NOTICE 'Nuovo prodotto creato nell''anagrafica: % (ID: %)', p_nome_prodotto, v_prodotto_id;
  ELSE
    RAISE NOTICE 'Utilizzato prodotto esistente dall''anagrafica: % (ID: %)', p_nome_prodotto, v_prodotto_id;
  END IF;
  
  -- ===== FASE 3: GESTIONE ARTICOLO (sistema 7 caratteristiche) =====
  -- Cerca se esiste già l'articolo con queste 7 caratteristiche
  SELECT id INTO v_articolo_id
  FROM articoli
  WHERE gruppo_id = p_id_gruppo
    AND prodotto_id = v_prodotto_id
    AND colore_id = p_id_colore
    AND provenienza_id = p_id_provenienza
    AND foto_id = p_id_foto
    AND imballo_id = p_id_imballo
    AND altezza_id = p_id_altezza;
  
  -- Se l'articolo non esiste, crealo automaticamente
  IF v_articolo_id IS NULL THEN
    INSERT INTO articoli (
      gruppo_id,
      prodotto_id,
      colore_id,
      provenienza_id,
      foto_id,
      imballo_id,
      altezza_id
    ) VALUES (
      p_id_gruppo,
      v_prodotto_id,
      p_id_colore,
      p_id_provenienza,
      p_id_foto,
      p_id_imballo,
      p_id_altezza
    ) RETURNING id INTO v_articolo_id;
    
    RAISE NOTICE 'Nuovo articolo creato con le 7 caratteristiche (ID: %)', v_articolo_id;
  ELSE
    RAISE NOTICE 'Utilizzato articolo esistente (ID: %)', v_articolo_id;
  END IF;
  
  -- ===== FASE 4: CREAZIONE DOCUMENTO DI CARICO =====
  INSERT INTO documenti_carico (
    fattura_acquisto_id,
    articolo_id,
    quantita,
    prezzo_acquisto_per_stelo,
    prezzo_vendita_1,
    prezzo_vendita_2,
    prezzo_vendita_3
  ) VALUES (
    v_fattura_id,
    v_articolo_id,
    p_quantita,
    p_prezzo_acquisto_per_stelo,
    COALESCE(p_prezzo_vendita_1, p_prezzo_acquisto_per_stelo * 1.5),  -- Default 50% markup
    COALESCE(p_prezzo_vendita_2, p_prezzo_acquisto_per_stelo * 1.8),  -- Default 80% markup
    COALESCE(p_prezzo_vendita_3, p_prezzo_acquisto_per_stelo * 2.0)   -- Default 100% markup
  ) RETURNING id INTO v_documento_id;
  
  RAISE NOTICE 'Documento di carico creato (ID: %)', v_documento_id;
  
  -- ===== RISULTATO =====
  SELECT jsonb_build_object(
    'success', true,
    'fattura_id', v_fattura_id,
    'prodotto_id', v_prodotto_id,
    'articolo_id', v_articolo_id,
    'documento_id', v_documento_id,
    'numero_fattura', p_numero_fattura,
    'nome_prodotto', p_nome_prodotto,
    'quantita', p_quantita,
    'message', 'Fattura, prodotto (se nuovo), articolo (se nuovo) e documento di carico creati con successo'
  ) INTO v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Errore durante inserimento fattura: %', SQLERRM;
END;
$$;
-- =========================================================================
-- PROCEDURA SEMPLIFICATA: SOLO FATTURA (senza prodotti)
-- Per quando vuoi inserire solo la fattura e gestire i prodotti dopo
-- =========================================================================

CREATE OR REPLACE FUNCTION inserisci_fattura_semplice(
  p_numero_fattura VARCHAR(50),
  p_data_fattura DATE,
  p_id_fornitore INTEGER,
  p_totale DECIMAL(10,2),
  p_stato VARCHAR(20) DEFAULT 'bozza',
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_fattura_id INTEGER;
  v_result JSONB;
BEGIN
  
  -- Inserimento fattura
  INSERT INTO fatture_acquisto (
    numero, 
    data, 
    fornitore_id, 
    totale, 
    stato, 
    note
  ) VALUES (
    p_numero_fattura,
    p_data_fattura,
    p_id_fornitore,
    p_totale,
    p_stato,
    p_note
  ) RETURNING id INTO v_fattura_id;
  
  -- Risultato
  SELECT jsonb_build_object(
    'success', true,
    'fattura_id', v_fattura_id,
    'numero_fattura', p_numero_fattura,
    'message', 'Fattura inserita con successo. Puoi ora aggiungere i prodotti.'
  ) INTO v_result;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Errore durante inserimento fattura: %', SQLERRM;
END;
$$;

-- =========================================================================
-- ESEMPI DI UTILIZZO
-- =========================================================================

/*

-- Esempio 1: Solo fattura (approccio più comune)
SELECT inserisci_fattura_semplice(
  'F001/2025',           -- numero fattura
  '2025-07-29',          -- data
  1,                     -- ID fornitore (da anagrafica)
  1000.00,               -- imponibile
  220.00,                -- IVA
  1220.00,               -- totale
  'bozza',               -- stato
  'Prima fattura di test'
);

-- Esempio 2: Fattura completa con prodotto e 7 caratteristiche
SELECT inserisci_fattura_con_documento_carico(
  'F002/2025',           -- numero fattura
  '2025-07-29',          -- data
  1,                     -- ID fornitore (da anagrafica)
  800.00,                -- imponibile
  176.00,                -- IVA
  976.00,                -- totale
  'confermata',          -- stato
  'Fattura con rose rosse',
  
  -- 7 caratteristiche
  1,                     -- ID gruppo (da anagrafica)
  'Rosa Red Naomi',      -- nome prodotto (manuale, viene salvato)
  2,                     -- ID colore (da anagrafica)
  1,                     -- ID provenienza (da anagrafica)
  1,                     -- ID foto (da anagrafica)
  1,                     -- ID imballo (da anagrafica)
  3,                     -- ID altezza (da anagrafica)
  
  -- Dati di carico
  100,                   -- quantità steli
  0.80,                  -- prezzo acquisto per stelo
  1.50,                  -- prezzo vendita 1
  1.80,                  -- prezzo vendita 2
  2.00                   -- prezzo vendita 3
);

*/
