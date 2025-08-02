-- =========================================================================
-- MIGRATION: Aggiunta sistema annullamento distruzioni
-- Data: 31/01/2025
-- Descrizione: Permette di annullare distruzioni entro 24 ore
-- =========================================================================

-- 1. Aggiungi campo stato alla tabella documenti_distruzione
ALTER TABLE documenti_distruzione 
ADD COLUMN IF NOT EXISTS stato VARCHAR(20) DEFAULT 'attiva' 
CHECK (stato IN ('attiva', 'annullata'));

-- 2. Aggiungi campi per tracciare l'annullamento
ALTER TABLE documenti_distruzione 
ADD COLUMN IF NOT EXISTS data_annullamento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS motivo_annullamento TEXT,
ADD COLUMN IF NOT EXISTS utente_annullamento VARCHAR(100);

-- 3. Indici per performance
CREATE INDEX IF NOT EXISTS idx_documenti_distruzione_stato ON documenti_distruzione(stato);
CREATE INDEX IF NOT EXISTS idx_documenti_distruzione_data_annullamento ON documenti_distruzione(data_annullamento);

-- 4. Funzione per annullare una distruzione
CREATE OR REPLACE FUNCTION annulla_distruzione(
    p_distruzione_id INTEGER,
    p_motivo_annullamento TEXT DEFAULT NULL,
    p_utente_annullamento VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    distruzione_record RECORD;
    ore_trascorse INTERVAL;
BEGIN
    -- Ottieni i dettagli della distruzione
    SELECT 
        dd.*,
        dc.quantita as quantita_giacenza_attuale
    INTO distruzione_record
    FROM documenti_distruzione dd
    JOIN documenti_carico dc ON dd.documento_carico_id = dc.id
    WHERE dd.id = p_distruzione_id;
    
    -- Verifica che la distruzione esista
    IF distruzione_record.id IS NULL THEN
        RAISE EXCEPTION 'Distruzione con ID % non trovata', p_distruzione_id;
    END IF;
    
    -- Verifica che sia ancora attiva
    IF distruzione_record.stato = 'annullata' THEN
        RAISE EXCEPTION 'La distruzione è già stata annullata';
    END IF;
    
    -- Calcola le ore trascorse dalla distruzione
    ore_trascorse := NOW() - distruzione_record.created_at;
    
    -- Verifica limite temporale (24 ore)
    IF ore_trascorse > INTERVAL '24 hours' THEN
        RAISE EXCEPTION 'Impossibile annullare: sono trascorse più di 24 ore dalla distruzione (% ore)', 
            EXTRACT(HOUR FROM ore_trascorse);
    END IF;
    
    -- Ripristina la quantità nel documento di carico originale
    UPDATE documenti_carico 
    SET quantita = quantita + distruzione_record.quantita_distrutta
    WHERE id = distruzione_record.documento_carico_id;
    
    -- Marca la distruzione come annullata
    UPDATE documenti_distruzione 
    SET 
        stato = 'annullata',
        data_annullamento = NOW(),
        motivo_annullamento = p_motivo_annullamento,
        utente_annullamento = p_utente_annullamento
    WHERE id = p_distruzione_id;
    
    -- Registra l'annullamento nei movimenti dettagliati
    INSERT INTO movimenti_dettagliati (
        tipo_movimento,
        documento_carico_id,
        documento_distruzione_id,
        articolo_id,
        descrizione,
        quantita_coinvolta,
        importo_nuovo,
        utente,
        note_movimento
    )
    SELECT 
        'ANNULLAMENTO_DISTRUZIONE',
        distruzione_record.documento_carico_id,
        p_distruzione_id,
        dc.articolo_id,
        CONCAT('Annullamento distruzione ID:', p_distruzione_id, ' - Ripristino: ', distruzione_record.quantita_distrutta, ' steli'),
        distruzione_record.quantita_distrutta,
        distruzione_record.valore_perdita,
        p_utente_annullamento,
        p_motivo_annullamento
    FROM documenti_carico dc
    WHERE dc.id = distruzione_record.documento_carico_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Aggiorna i constraint dei movimenti per includere l'annullamento
ALTER TABLE movimenti_dettagliati 
DROP CONSTRAINT IF EXISTS movimenti_dettagliati_tipo_movimento_check;

ALTER TABLE movimenti_dettagliati 
ADD CONSTRAINT movimenti_dettagliati_tipo_movimento_check 
CHECK (tipo_movimento IN (
    'CARICO_NUOVO',
    'MODIFICA_PREZZO_ACQUISTO',
    'MODIFICA_PREZZO_VENDITA_1',
    'MODIFICA_PREZZO_VENDITA_2', 
    'MODIFICA_PREZZO_VENDITA_3',
    'MODIFICA_QUANTITA',
    'MODIFICA_NOTE',
    'ELIMINAZIONE_CARICO',
    'CREAZIONE_FATTURA',
    'MODIFICA_FATTURA',
    'CREAZIONE_ARTICOLO',
    'CREAZIONE_PRODOTTO',
    'MODIFICA_ANAGRAFICA',
    'DISTRUZIONE_MERCE',
    'ANNULLAMENTO_DISTRUZIONE'
));

-- 6. Vista per distruzioni annullabili (entro 24 ore)
CREATE OR REPLACE VIEW view_distruzioni_annullabili AS
SELECT 
    dd.id as distruzione_id,
    dd.data_distruzione,
    dd.quantita_distrutta,
    dd.valore_perdita,
    dd.note,
    dd.utente,
    dd.created_at,
    
    -- Dettagli articolo
    a.id as articolo_id,
    a.nome_completo as articolo_nome,
    g.nome as gruppo_nome,
    p.nome as prodotto_nome,
    c.nome as colore_nome,
    pr.nome as provenienza_nome,
    
    -- Documento carico originale
    dc.id as carico_id,
    fa.numero as fattura_numero,
    f.nome as fornitore_nome,
    
    -- Calcolo ore trascorse
    EXTRACT(EPOCH FROM (NOW() - dd.created_at)) / 3600 as ore_trascorse,
    
    -- Flag annullabilità
    CASE 
        WHEN dd.stato = 'annullata' THEN FALSE
        WHEN (NOW() - dd.created_at) > INTERVAL '24 hours' THEN FALSE
        ELSE TRUE
    END as annullabile
    
FROM documenti_distruzione dd
JOIN documenti_carico dc ON dd.documento_carico_id = dc.id
JOIN fatture_acquisto fa ON dc.fattura_acquisto_id = fa.id
JOIN fornitori f ON fa.fornitore_id = f.id
JOIN articoli a ON dc.articolo_id = a.id
JOIN gruppi g ON a.gruppo_id = g.id
JOIN prodotti p ON a.prodotto_id = p.id
JOIN colori c ON a.colore_id = c.id
JOIN provenienze pr ON a.provenienza_id = pr.id
WHERE dd.stato = 'attiva'
  AND (NOW() - dd.created_at) <= INTERVAL '48 hours' -- Mostra anche quelle scadute per trasparenza
ORDER BY dd.created_at DESC;

-- 7. Commenti per documentazione
COMMENT ON FUNCTION annulla_distruzione(INTEGER, TEXT, VARCHAR) IS 'Annulla una distruzione entro 24 ore ripristinando la quantità originale';
COMMENT ON VIEW view_distruzioni_annullabili IS 'Vista delle distruzioni recenti con flag di annullabilità';
COMMENT ON COLUMN documenti_distruzione.stato IS 'Stato della distruzione: attiva o annullata';