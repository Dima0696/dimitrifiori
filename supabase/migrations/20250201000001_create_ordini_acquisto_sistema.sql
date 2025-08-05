-- =========================================================================
-- MIGRATION: Sistema Ordini Acquisto con Giacenze Virtuali
-- Data: 01/02/2025
-- Descrizione: Novità gestionale - Ordini virtuali che diventano fatture reali
-- =========================================================================

-- 1. Aggiorna movimenti_magazzino per supportare carichi virtuali
ALTER TABLE movimenti_magazzino 
DROP CONSTRAINT IF EXISTS movimenti_magazzino_tipo_check;

ALTER TABLE movimenti_magazzino 
ADD CONSTRAINT movimenti_magazzino_tipo_check 
CHECK (tipo IN ('carico', 'scarico', 'distruzione', 'inventario', 'trasferimento', 'carico_virtuale'));

-- 2. Creazione tabella ordini_acquisto
CREATE TABLE ordini_acquisto (
  id SERIAL PRIMARY KEY,
  
  -- Numerazione separata dalle fatture
  numero_ordine VARCHAR(50) NOT NULL UNIQUE,
  
  -- Dati base ordine
  data_ordine DATE NOT NULL,
  data_consegna_prevista DATE NOT NULL,
  fornitore_id INTEGER NOT NULL REFERENCES fornitori(id),
  
  -- Stati: solo 'ordinato' o 'consegnato'
  stato VARCHAR(20) DEFAULT 'ordinato' CHECK (stato IN ('ordinato', 'consegnato')),
  
  -- Totali ordine
  totale_ordine DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- COSTI ANALITICI (come nelle fatture di acquisto)
  costo_trasporto DECIMAL(10,2) DEFAULT 0,
  id_fornitore_trasporto INTEGER REFERENCES fornitori(id),
  costo_commissioni DECIMAL(10,2) DEFAULT 0,
  id_fornitore_commissioni INTEGER REFERENCES fornitori(id),
  costo_imballaggi DECIMAL(10,2) DEFAULT 0,
  id_fornitore_imballaggi INTEGER REFERENCES fornitori(id),
  note_costi TEXT,
  
  -- Metadati
  note TEXT,
  utente_creazione VARCHAR(100),
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Data di trasformazione in fattura (quando stato = 'consegnato')
  data_consegna_effettiva TIMESTAMP WITH TIME ZONE,
  fattura_generata_id INTEGER REFERENCES fatture_acquisto(id)
);

-- 3. Creazione tabella giacenze_virtuali
-- Struttura identica a documenti_carico ma per ordini virtuali
CREATE TABLE giacenze_virtuali (
  id SERIAL PRIMARY KEY,
  
  -- Riferimento all'ordine acquisto
  ordine_acquisto_id INTEGER NOT NULL REFERENCES ordini_acquisto(id) ON DELETE CASCADE,
  
  -- Caratteristiche articolo (8 campi come InserimentoFattureMultiRiga)
  gruppo_id INTEGER NOT NULL REFERENCES gruppi(id),
  nome_prodotto VARCHAR(200) NOT NULL,  -- Inserito manualmente
  colore_id INTEGER NOT NULL REFERENCES colori(id),
  provenienza_id INTEGER NOT NULL REFERENCES provenienze(id),
  foto_id INTEGER NOT NULL REFERENCES foto(id),
  imballo_id INTEGER NOT NULL REFERENCES imballaggi(id),
  altezza_id INTEGER NOT NULL REFERENCES altezze(id),
  qualita_id INTEGER NOT NULL REFERENCES qualita(id),
  
  -- Quantità e prezzi
  quantita INTEGER NOT NULL CHECK (quantita > 0),
  prezzo_acquisto_per_stelo DECIMAL(10,4) NOT NULL CHECK (prezzo_acquisto_per_stelo > 0),
  
  -- SPALMO AUTOMATICO DEI COSTI (calcolato dalla proporzione dell'ordine)
  costi_spalmare_per_stelo DECIMAL(10,4) DEFAULT 0,
  
  -- PREZZO FINALE DI COSTO (base per calcolare i prezzi di vendita)
  prezzo_costo_finale_per_stelo DECIMAL(10,4) GENERATED ALWAYS AS (
    prezzo_acquisto_per_stelo + COALESCE(costi_spalmare_per_stelo, 0)
  ) STORED,
  
  -- Tre prezzi di vendita (inseriti manualmente con calcolo percentuali)
  prezzo_vendita_1 DECIMAL(10,4) NOT NULL CHECK (prezzo_vendita_1 > 0),
  prezzo_vendita_2 DECIMAL(10,4) NOT NULL CHECK (prezzo_vendita_2 > 0),
  prezzo_vendita_3 DECIMAL(10,4) NOT NULL CHECK (prezzo_vendita_3 > 0),
  
  -- Totale riga base (solo acquisto)
  totale_riga DECIMAL(12,2) GENERATED ALWAYS AS (
    quantita * prezzo_acquisto_per_stelo
  ) STORED,
  
  -- Totale con costi spalmare inclusi
  totale_con_costi DECIMAL(12,2) GENERATED ALWAYS AS (
    quantita * (prezzo_acquisto_per_stelo + COALESCE(costi_spalmare_per_stelo, 0))
  ) STORED,
  
  -- Metadati
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indici per performance
CREATE INDEX IF NOT EXISTS idx_ordini_stato ON ordini_acquisto(stato);
CREATE INDEX IF NOT EXISTS idx_ordini_fornitore ON ordini_acquisto(fornitore_id);
CREATE INDEX IF NOT EXISTS idx_ordini_data_consegna ON ordini_acquisto(data_consegna_prevista);
CREATE INDEX IF NOT EXISTS idx_giacenze_virtuali_ordine ON giacenze_virtuali(ordine_acquisto_id);
CREATE INDEX IF NOT EXISTS idx_giacenze_virtuali_gruppo ON giacenze_virtuali(gruppo_id);
CREATE INDEX IF NOT EXISTS idx_giacenze_virtuali_prodotto ON giacenze_virtuali(nome_prodotto);

-- 5. Vista per ordini acquisto completi
CREATE VIEW view_ordini_acquisto_completi AS
SELECT 
    oa.id,
    oa.numero_ordine,
    oa.data_ordine,
    oa.data_consegna_prevista,
    oa.stato,
    oa.totale_ordine,
    oa.note,
    oa.created_at,
    oa.data_consegna_effettiva,
    oa.fattura_generata_id,
    
    -- Costi analitici
    oa.costo_trasporto,
    oa.costo_commissioni,
    oa.costo_imballaggi,
    (oa.costo_trasporto + oa.costo_commissioni + oa.costo_imballaggi) as totale_costi_analitici,
    
    -- Dati fornitore
    f.id as fornitore_id,
    f.nome as fornitore_nome,
    f.partita_iva as fornitore_piva,
    
    -- Conteggi righe
    COUNT(gv.id) as numero_righe,
    SUM(gv.quantita) as quantita_totale,
    
    -- Calcolo giorni alla consegna
    (oa.data_consegna_prevista - CURRENT_DATE) as giorni_alla_consegna
    
FROM ordini_acquisto oa
LEFT JOIN fornitori f ON oa.fornitore_id = f.id
LEFT JOIN giacenze_virtuali gv ON oa.id = gv.ordine_acquisto_id
GROUP BY oa.id, f.id, f.nome, f.partita_iva
ORDER BY oa.data_consegna_prevista ASC;

-- 6. Vista per giacenze virtuali complete (da mostrare insieme alle giacenze reali)
CREATE VIEW view_giacenze_virtuali_complete AS
SELECT 
    gv.id as giacenza_virtuale_id,
    gv.ordine_acquisto_id,
    oa.numero_ordine,
    oa.data_consegna_prevista,
    oa.stato as stato_ordine,
    f.nome as fornitore_nome,
    
    -- Articolo virtuale
    g.nome as gruppo_nome,
    gv.nome_prodotto as prodotto_nome,
    c.nome as colore_nome,
    pr.nome as provenienza_nome,
    fo.nome as foto_nome,
    fo.url as foto_url,
    i.nome as imballo_nome,
    alt.altezza_cm,
    q.nome as qualita_nome,
    
    -- Dati giacenza virtuale
    gv.quantita as quantita_virtuale,
    gv.prezzo_acquisto_per_stelo,
    gv.costi_spalmare_per_stelo,
    gv.prezzo_costo_finale_per_stelo,
    gv.prezzo_vendita_1,
    gv.prezzo_vendita_2,
    gv.prezzo_vendita_3,
    gv.totale_riga as valore_giacenza_base,
    gv.totale_con_costi as valore_giacenza_finale,
    
    -- Calcoli valori di vendita potenziali
    (gv.quantita * gv.prezzo_vendita_1) as valore_vendita_1,
    (gv.quantita * gv.prezzo_vendita_2) as valore_vendita_2,
    (gv.quantita * gv.prezzo_vendita_3) as valore_vendita_3,
    
    -- Margini per stelo (basati su prezzo finale con costi)
    (gv.prezzo_vendita_1 - gv.prezzo_costo_finale_per_stelo) as margine_per_stelo_1,
    (gv.prezzo_vendita_2 - gv.prezzo_costo_finale_per_stelo) as margine_per_stelo_2,
    (gv.prezzo_vendita_3 - gv.prezzo_costo_finale_per_stelo) as margine_per_stelo_3,
    
    -- Percentuali di markup
    ROUND(((gv.prezzo_vendita_1 - gv.prezzo_costo_finale_per_stelo) / gv.prezzo_costo_finale_per_stelo * 100), 2) as markup_percentuale_1,
    ROUND(((gv.prezzo_vendita_2 - gv.prezzo_costo_finale_per_stelo) / gv.prezzo_costo_finale_per_stelo * 100), 2) as markup_percentuale_2,
    ROUND(((gv.prezzo_vendita_3 - gv.prezzo_costo_finale_per_stelo) / gv.prezzo_costo_finale_per_stelo * 100), 2) as markup_percentuale_3,
    
    -- Margini totali per giacenza
    ((gv.prezzo_vendita_1 - gv.prezzo_costo_finale_per_stelo) * gv.quantita) as margine_totale_1,
    ((gv.prezzo_vendita_2 - gv.prezzo_costo_finale_per_stelo) * gv.quantita) as margine_totale_2,
    ((gv.prezzo_vendita_3 - gv.prezzo_costo_finale_per_stelo) * gv.quantita) as margine_totale_3,
    
    -- Identificatore tipo per distinguere nelle giacenze
    'virtuale' as tipo_giacenza,
    
    -- Calcolo giorni alla consegna
    (oa.data_consegna_prevista - CURRENT_DATE) as giorni_alla_consegna,
    
    gv.note,
    gv.created_at as data_ordine
    
FROM giacenze_virtuali gv
LEFT JOIN ordini_acquisto oa ON gv.ordine_acquisto_id = oa.id
LEFT JOIN fornitori f ON oa.fornitore_id = f.id
LEFT JOIN gruppi g ON gv.gruppo_id = g.id
LEFT JOIN colori c ON gv.colore_id = c.id
LEFT JOIN provenienze pr ON gv.provenienza_id = pr.id
LEFT JOIN foto fo ON gv.foto_id = fo.id
LEFT JOIN imballaggi i ON gv.imballo_id = i.id
LEFT JOIN altezze alt ON gv.altezza_id = alt.id
LEFT JOIN qualita q ON gv.qualita_id = q.id
WHERE oa.stato = 'ordinato'  -- Solo ordini ancora in stato ordinato
ORDER BY oa.data_consegna_prevista ASC;

-- 7. Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ordini_acquisto_updated_at 
    BEFORE UPDATE ON ordini_acquisto 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_giacenze_virtuali_updated_at 
    BEFORE UPDATE ON giacenze_virtuali 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Funzione per auto-numerazione ordini acquisto
CREATE OR REPLACE FUNCTION genera_numero_ordine()
RETURNS VARCHAR(50) AS $$
DECLARE
    nuovo_numero VARCHAR(50);
    anno_corrente VARCHAR(4);
    prossimo_id INTEGER;
BEGIN
    -- Ottieni l'anno corrente
    anno_corrente := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Calcola il prossimo ID
    SELECT COALESCE(MAX(id), 0) + 1 INTO prossimo_id FROM ordini_acquisto;
    
    -- Genera numero formato: ORD-2025-0001
    nuovo_numero := 'ORD-' || anno_corrente || '-' || LPAD(prossimo_id::VARCHAR, 4, '0');
    
    RETURN nuovo_numero;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger per auto-generare numero ordine
CREATE OR REPLACE FUNCTION set_numero_ordine()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_ordine IS NULL OR NEW.numero_ordine = '' THEN
        NEW.numero_ordine := genera_numero_ordine();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_numero_ordine
    BEFORE INSERT ON ordini_acquisto
    FOR EACH ROW EXECUTE FUNCTION set_numero_ordine();

-- 10. Aggiunge campo ordine_acquisto_id ai movimenti_magazzino per tracciabilità
ALTER TABLE movimenti_magazzino 
ADD COLUMN ordine_acquisto_id INTEGER REFERENCES ordini_acquisto(id);

CREATE INDEX IF NOT EXISTS idx_movimenti_ordine_acquisto ON movimenti_magazzino(ordine_acquisto_id);

-- 11. Funzione per calcolare e spalmare costi analitici nelle giacenze virtuali
CREATE OR REPLACE FUNCTION aggiorna_costi_spalmare_ordine(ordine_id INTEGER)
RETURNS VOID AS $$
DECLARE
    totale_costi DECIMAL(10,2);
    totale_ordine_valore DECIMAL(12,2);
    riga RECORD;
    costo_per_stelo DECIMAL(10,4);
BEGIN
    -- Calcola totale costi analitici dell'ordine
    SELECT COALESCE(costo_trasporto, 0) + COALESCE(costo_commissioni, 0) + COALESCE(costo_imballaggi, 0)
    INTO totale_costi
    FROM ordini_acquisto 
    WHERE id = ordine_id;
    
    -- Calcola totale valore ordine (senza costi analitici)
    SELECT COALESCE(SUM(totale_riga), 0)
    INTO totale_ordine_valore
    FROM giacenze_virtuali 
    WHERE ordine_acquisto_id = ordine_id;
    
    -- Se non ci sono costi o valore è zero, azzera tutti i costi spalmare
    IF totale_costi = 0 OR totale_ordine_valore = 0 THEN
        UPDATE giacenze_virtuali 
        SET costi_spalmare_per_stelo = 0
        WHERE ordine_acquisto_id = ordine_id;
        RETURN;
    END IF;
    
    -- Spalma i costi proporzionalmente su ogni riga
    FOR riga IN 
        SELECT id, totale_riga, quantita 
        FROM giacenze_virtuali 
        WHERE ordine_acquisto_id = ordine_id
    LOOP
        -- Calcola costi da spalmare per stelo
        costo_per_stelo := (totale_costi * riga.totale_riga / totale_ordine_valore) / riga.quantita;
        
        -- Aggiorna la riga
        UPDATE giacenze_virtuali 
        SET costi_spalmare_per_stelo = costo_per_stelo
        WHERE id = riga.id;
    END LOOP;
    
END;
$$ LANGUAGE plpgsql;

-- 12. Trigger per ricalcolare i costi quando cambiano i costi analitici dell'ordine
CREATE OR REPLACE FUNCTION trigger_aggiorna_costi_ordine()
RETURNS TRIGGER AS $$
BEGIN
    -- Ricalcola costi spalmare quando cambiano i costi analitici
    PERFORM aggiorna_costi_spalmare_ordine(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ricalcola_costi_ordine
    AFTER UPDATE OF costo_trasporto, costo_commissioni, costo_imballaggi
    ON ordini_acquisto
    FOR EACH ROW EXECUTE FUNCTION trigger_aggiorna_costi_ordine();

-- 13. Trigger per ricalcolare i costi quando si aggiungono/modificano righe giacenze virtuali
CREATE OR REPLACE FUNCTION trigger_aggiorna_costi_giacenze_virtuali()
RETURNS TRIGGER AS $$
BEGIN
    -- Ricalcola costi spalmare quando cambiano le righe
    IF TG_OP = 'DELETE' THEN
        PERFORM aggiorna_costi_spalmare_ordine(OLD.ordine_acquisto_id);
        RETURN OLD;
    ELSE
        PERFORM aggiorna_costi_spalmare_ordine(NEW.ordine_acquisto_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ricalcola_costi_giacenze
    AFTER INSERT OR UPDATE OF quantita, prezzo_acquisto_per_stelo OR DELETE
    ON giacenze_virtuali
    FOR EACH ROW EXECUTE FUNCTION trigger_aggiorna_costi_giacenze_virtuali();

-- =========================================================================
-- FINE MIGRATION - SISTEMA ORDINI ACQUISTO CON COSTI ANALITICI PRONTO
-- =========================================================================