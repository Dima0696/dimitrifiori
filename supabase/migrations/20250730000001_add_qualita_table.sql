-- Migrazione Database: Aggiunta tabella Qualità
-- Data: 2025-07-30
-- Descrizione: Espansione sistema articoli da 7 a 8 caratteristiche aggiungendo Qualità

-- 1. Creazione tabella qualita
CREATE TABLE IF NOT EXISTS qualita (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descrizione TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inserimento dati iniziali qualità
INSERT INTO qualita (nome, descrizione) VALUES 
    ('Extra', 'Qualità extra - massima qualità'),
    ('Prima', 'Prima qualità - ottima qualità'),
    ('Seconda', 'Seconda qualità - buona qualità'),
    ('Terza', 'Terza qualità - qualità standard'),
    ('Scarto', 'Qualità di scarto - per composizioni'),
    ('Mista', 'Qualità mista - varie gradazioni')
ON CONFLICT (nome) DO NOTHING;

-- 3. Aggiunta colonna qualita_id alla tabella articoli
ALTER TABLE articoli 
ADD COLUMN IF NOT EXISTS qualita_id INTEGER REFERENCES qualita(id);

-- 4. Aggiornamento articoli esistenti con qualità di default (Prima)
UPDATE articoli 
SET qualita_id = (SELECT id FROM qualita WHERE nome = 'Prima' LIMIT 1)
WHERE qualita_id IS NULL;

-- 5. Modifica vincolo NOT NULL per qualita_id
ALTER TABLE articoli 
ALTER COLUMN qualita_id SET NOT NULL;

-- 6. Aggiornamento stored procedure inserisci_fattura_con_documento_carico per 8 parametri
CREATE OR REPLACE FUNCTION inserisci_fattura_con_documento_carico(
  -- Dati fattura base
  p_numero_fattura VARCHAR(50),
  p_data_fattura DATE,
  p_id_fornitore INTEGER,
  p_totale DECIMAL(10,2),
  
  -- Dati prodotto con 8 caratteristiche (aggiunta qualità)
  p_id_gruppo INTEGER,
  p_nome_prodotto VARCHAR(255),
  p_id_colore INTEGER,
  p_id_provenienza INTEGER,
  p_id_foto INTEGER,
  p_id_imballo INTEGER,
  p_id_altezza INTEGER,
  p_id_qualita INTEGER,  -- NUOVA: 8ª caratteristica
  
  -- Dati di carico
  p_quantita INTEGER,
  p_prezzo_acquisto_per_stelo DECIMAL(10,4),
  
  -- Parametri opzionali
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
  
  -- ===== FASE 3: GESTIONE ARTICOLO (sistema 8 caratteristiche con qualità) =====
  -- Cerca se esiste già l'articolo con queste 8 caratteristiche
  SELECT id INTO v_articolo_id
  FROM articoli
  WHERE gruppo_id = p_id_gruppo
    AND prodotto_id = v_prodotto_id
    AND colore_id = p_id_colore
    AND provenienza_id = p_id_provenienza
    AND foto_id = p_id_foto
    AND imballo_id = p_id_imballo
    AND altezza_id = p_id_altezza
    AND qualita_id = p_id_qualita;  -- NUOVA: controllo qualità
  
  -- Se l'articolo non esiste, crealo automaticamente
  IF v_articolo_id IS NULL THEN
    INSERT INTO articoli (
      gruppo_id,
      prodotto_id,
      colore_id,
      provenienza_id,
      foto_id,
      imballo_id,
      altezza_id,
      qualita_id  -- NUOVA: inserimento qualità
    ) VALUES (
      p_id_gruppo,
      v_prodotto_id,
      p_id_colore,
      p_id_provenienza,
      p_id_foto,
      p_id_imballo,
      p_id_altezza,
      p_id_qualita  -- NUOVA: valore qualità
    ) RETURNING id INTO v_articolo_id;
    
    RAISE NOTICE 'Nuovo articolo creato con le 8 caratteristiche (ID: %)', v_articolo_id;
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
    COALESCE(p_prezzo_vendita_1, p_prezzo_acquisto_per_stelo * 1.5),
    COALESCE(p_prezzo_vendita_2, p_prezzo_acquisto_per_stelo * 1.8),
    COALESCE(p_prezzo_vendita_3, p_prezzo_acquisto_per_stelo * 2.0)
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
    'message', 'Fattura, prodotto, articolo e documento di carico creati con successo (sistema 8 caratteristiche)'
  ) INTO v_result;
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Errore nella procedura inserisci_fattura_con_documento_carico: %', SQLERRM;
END;
$$;

-- 8. Aggiornamento vista per includere qualità
CREATE OR REPLACE VIEW view_articoli_completi AS
SELECT
    a.id,
    a.nome_completo,
    a.created_at,
    -- Gruppo
    g.id as gruppo_id,
    g.nome as gruppo_nome,
    g.descrizione as gruppo_descrizione,
    -- Prodotto  
    pr.id as prodotto_id,
    pr.nome as prodotto_nome,
    pr.descrizione as prodotto_descrizione,
    -- Colore
    c.id as colore_id,
    c.nome as colore_nome,
    -- Provenienza
    p.id as provenienza_id,
    p.nome as provenienza_nome,
    -- Foto
    f.id as foto_id,
    f.nome as foto_nome,
    f.url as foto_url,
    -- Imballo
    i.id as imballo_id,
    i.nome as imballo_nome,
    i.descrizione as imballo_descrizione,
    -- Altezza
    alt.id as altezza_id,
    alt.altezza_cm as altezza_valore,
    alt.descrizione as altezza_descrizione,
    -- Qualità
    q.id as qualita_id,
    q.nome as qualita_nome,
    q.descrizione as qualita_descrizione
FROM articoli a
    LEFT JOIN gruppi g ON a.gruppo_id = g.id
    LEFT JOIN prodotti pr ON a.prodotto_id = pr.id
    LEFT JOIN colori c ON a.colore_id = c.id
    LEFT JOIN provenienze p ON a.provenienza_id = p.id
    LEFT JOIN foto f ON a.foto_id = f.id
    LEFT JOIN imballaggi i ON a.imballo_id = i.id
    LEFT JOIN altezze alt ON a.altezza_id = alt.id
    LEFT JOIN qualita q ON a.qualita_id = q.id;-- 9. Aggiornamento vista documenti carico per includere qualità
DROP VIEW IF EXISTS view_documenti_carico_completi CASCADE;
CREATE VIEW view_documenti_carico_completi AS
SELECT 
    dc.id,
    dc.quantita,
    dc.prezzo_acquisto_per_stelo,
    dc.prezzo_vendita_1,
    dc.prezzo_vendita_2, 
    dc.prezzo_vendita_3,
    dc.note,
    dc.created_at,
    dc.updated_at,
    -- Fattura di acquisto
    fa.id as fattura_acquisto_id,
    fa.numero,
    fa.data as data_fattura,
    fa.totale as totale_fattura,
    fa.stato as stato_fattura,
    fa.note as note_fattura,
    -- Fornitore
    fo.id as fornitore_id,
    fo.nome as fornitore_nome,
    fo.partita_iva as fornitore_piva,
    -- Articolo completo
    a.id as articolo_id,
    pr.nome as prodotto_nome,
    -- Gruppo
    g.id as gruppo_id,
    g.nome as gruppo_nome,
    -- Colore
    c.id as colore_id,
    c.nome as colore_nome,
    -- Provenienza
    p.id as provenienza_id,
    p.nome as provenienza_nome,
    -- Foto
    f.id as foto_id,
    f.nome as foto_nome,
    f.url as foto_url,
    -- Imballo
    i.id as imballo_id,
    i.nome as imballo_nome,
    i.descrizione as imballo_descrizione,
    -- Altezza
    alt.id as altezza_id,
    alt.altezza_cm,
    alt.descrizione as altezza_descrizione,
    -- Qualità
    q.id as qualita_id,
    q.nome as qualita_nome,
    q.descrizione as qualita_descrizione
FROM documenti_carico dc
    LEFT JOIN fatture_acquisto fa ON dc.fattura_acquisto_id = fa.id
    LEFT JOIN fornitori fo ON fa.fornitore_id = fo.id
    LEFT JOIN articoli a ON dc.articolo_id = a.id
    LEFT JOIN gruppi g ON a.gruppo_id = g.id
    LEFT JOIN prodotti pr ON a.prodotto_id = pr.id
    LEFT JOIN colori c ON a.colore_id = c.id
    LEFT JOIN provenienze p ON a.provenienza_id = p.id
    LEFT JOIN foto f ON a.foto_id = f.id
    LEFT JOIN imballaggi i ON a.imballo_id = i.id
    LEFT JOIN altezze alt ON a.altezza_id = alt.id
    LEFT JOIN qualita q ON a.qualita_id = q.id;

-- 10. Aggiorna la vista giacenze magazzino per includere qualità
DROP VIEW IF EXISTS view_giacenze_magazzino CASCADE;
CREATE VIEW view_giacenze_magazzino AS
SELECT 
    dc.id as carico_id,
    dc.fattura_acquisto_id,
    fa.numero as fattura_numero,
    fa.data as fattura_data,
    f.nome as fornitore_nome,
    
    -- Dettagli articolo con qualità
    a.id as articolo_id,
    a.nome_completo as articolo_nome,
    g.nome as gruppo_nome,
    p.nome as prodotto_nome,
    c.nome as colore_nome,
    pr.nome as provenienza_nome,
    fo.nome as foto_nome,
    fo.url as foto_url,
    i.nome as imballo_nome,
    alt.altezza_cm,
    q.nome as qualita_nome,
    
    -- Dati giacenza (ogni carico è una riga separata)
    dc.quantita as quantita_giacenza,
    dc.prezzo_acquisto_per_stelo,
    dc.costi_spalmare_per_stelo,
    dc.prezzo_costo_finale_per_stelo,
    dc.prezzo_vendita_1,
    dc.prezzo_vendita_2,
    dc.prezzo_vendita_3,
    dc.totale as valore_giacenza_base,
    dc.totale_con_costi as valore_giacenza_finale,
    
    -- Calcoli valori di vendita potenziali
    (dc.quantita * dc.prezzo_vendita_1) as valore_vendita_1,
    (dc.quantita * dc.prezzo_vendita_2) as valore_vendita_2,
    (dc.quantita * dc.prezzo_vendita_3) as valore_vendita_3,
    
    -- Calcolo giorni di giacenza
    (CURRENT_DATE - fa.data) as giorni_giacenza,
    
    dc.note,
    dc.created_at as data_carico,
    dc.updated_at as data_aggiornamento
    
FROM documenti_carico dc
    LEFT JOIN fatture_acquisto fa ON dc.fattura_acquisto_id = fa.id
    LEFT JOIN fornitori f ON fa.fornitore_id = f.id
    LEFT JOIN articoli a ON dc.articolo_id = a.id
    LEFT JOIN gruppi g ON a.gruppo_id = g.id
    LEFT JOIN prodotti p ON a.prodotto_id = p.id
    LEFT JOIN colori c ON a.colore_id = c.id
    LEFT JOIN provenienze pr ON a.provenienza_id = pr.id
    LEFT JOIN foto fo ON a.foto_id = fo.id
    LEFT JOIN imballaggi i ON a.imballo_id = i.id
    LEFT JOIN altezze alt ON a.altezza_id = alt.id
    LEFT JOIN qualita q ON a.qualita_id = q.id
WHERE dc.quantita > 0;

-- 11. Aggiornamento trigger per updated_at su qualita
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_qualita_updated_at ON qualita;
CREATE TRIGGER update_qualita_updated_at
    BEFORE UPDATE ON qualita
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Indici per performance
CREATE INDEX IF NOT EXISTS idx_articoli_qualita ON articoli(qualita_id);
CREATE INDEX IF NOT EXISTS idx_qualita_nome ON qualita(nome);

-- Fine migrazione
-- Risultato: Sistema articoli espanso da 7 a 8 caratteristiche con Qualità
