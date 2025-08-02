-- =========================================================================
-- MIGRATION: Aggiunta campo quantità agli imballaggi
-- Data: 31/01/2025
-- Descrizione: Aggiunge il campo quantita alla tabella imballaggi per gestire 
--              correttamente i multipli (es: Mazzo=10, Cassa=100, etc.)
-- =========================================================================

-- 1. Aggiungi il campo quantita alla tabella imballaggi
ALTER TABLE imballaggi 
ADD COLUMN IF NOT EXISTS quantita INTEGER DEFAULT 1 NOT NULL;

-- 2. Aggiorna gli imballaggi esistenti con valori predefiniti sensati
-- Questi sono valori tipici del settore floricolo, possono essere modificati dall'utente
UPDATE imballaggi SET quantita = CASE 
    WHEN LOWER(nome) LIKE '%mazzo%' OR LOWER(nome) LIKE '%bouquet%' THEN 10
    WHEN LOWER(nome) LIKE '%cassa%' OR LOWER(nome) LIKE '%box%' THEN 100
    WHEN LOWER(nome) LIKE '%secchio%' OR LOWER(nome) LIKE '%bucket%' THEN 25
    WHEN LOWER(nome) LIKE '%singolo%' OR LOWER(nome) LIKE '%stelo%' THEN 1
    ELSE 10  -- Default per imballaggi non riconosciuti
END;

-- 3. Aggiorna la vista view_giacenze_magazzino per includere imballo_quantita
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
    i.quantita as imballo_quantita,  -- AGGIUNTO: quantità imballo
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

-- 4. Aggiorna anche la vista documenti_carico_completi per includere imballo_quantita
DROP VIEW IF EXISTS view_documenti_carico_completi CASCADE;
CREATE OR REPLACE VIEW view_documenti_carico_completi AS
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
    i.quantita as imballo_quantita,  -- AGGIUNTO: quantità imballo
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

-- 5. Indice per performance
CREATE INDEX IF NOT EXISTS idx_imballaggi_quantita ON imballaggi(quantita);

-- 6. Commenti
COMMENT ON COLUMN imballaggi.quantita IS 'Numero di steli per imballo (es: Mazzo=10, Cassa=100)';

-- 7. Visualizza gli imballaggi aggiornati per verifica
SELECT nome, quantita, descrizione FROM imballaggi ORDER BY nome;