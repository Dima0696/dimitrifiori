-- =========================================================================
-- NUOVO DATABASE - SEGUENDO IL PERCORSO DEI FIORI
-- =========================================================================
-- Logica: Fattura Acquisto -> Documento di Carico -> Creazione ARTICOLO
-- =========================================================================

-- Drop tutto il vecchio sistema
DROP TABLE IF EXISTS movimenti_magazzino CASCADE;
DROP TABLE IF EXISTS lotti_magazzino CASCADE;
DROP TABLE IF EXISTS ordini_acquisto_prodotti CASCADE;
DROP TABLE IF EXISTS dettagli_fattura CASCADE;
DROP TABLE IF EXISTS fatture CASCADE;
DROP TABLE IF EXISTS imballaggi CASCADE;

-- =========================================================================
-- ANAGRAFICA (MODIFICABILE AL 100% - INSERITA MANUALMENTE)
-- =========================================================================

-- Gruppi (es: Rose, Tulipani, Garofani)
CREATE TABLE gruppi (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descrizione TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Colori (es: Rosso, Bianco, Rosa)
CREATE TABLE colori (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provenienze (es: Olanda, Italia, Ecuador)
CREATE TABLE provenienze (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foto (URLs o riferimenti alle immagini)
CREATE TABLE foto (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  url TEXT NOT NULL,
  descrizione TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Imballaggi (es: Mazzo, Cassa, Secchio)
CREATE TABLE imballaggi (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descrizione TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Altezze (es: 50cm, 60cm, 70cm)
CREATE TABLE altezze (
  id SERIAL PRIMARY KEY,
  altezza_cm INTEGER,
  descrizione VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(altezza_cm)
);

-- =========================================================================
-- PRODOTTI (SALVATI IN ANAGRAFICA - RIUTILIZZABILI)
-- =========================================================================

-- Prodotti (es: Rosa Standard, Tulipano Singolo)
-- Inseriti manualmente ma salvati per riutilizzo
CREATE TABLE prodotti (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL UNIQUE,
  descrizione TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- ARTICOLI (COMBINAZIONE SALVATA IN ANAGRAFICA)
-- =========================================================================

-- ARTICOLO = Gruppo + Prodotto + Colore + Provenienza + Foto + Imballo + Altezza
-- Ogni combinazione unica viene salvata per riutilizzo futuro
CREATE TABLE articoli (
  id SERIAL PRIMARY KEY,
  
  -- Le 7 caratteristiche che definiscono l'ARTICOLO
  gruppo_id INTEGER NOT NULL REFERENCES gruppi(id),
  prodotto_id INTEGER NOT NULL REFERENCES prodotti(id),
  colore_id INTEGER NOT NULL REFERENCES colori(id),
  provenienza_id INTEGER NOT NULL REFERENCES provenienze(id),
  foto_id INTEGER NOT NULL REFERENCES foto(id),
  imballo_id INTEGER NOT NULL REFERENCES imballaggi(id),
  altezza_id INTEGER NOT NULL REFERENCES altezze(id),
  
  -- Nome descrittivo (calcolato lato applicazione)
  nome_completo TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: La combinazione deve essere unica
  UNIQUE(gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id)
);

-- =========================================================================
-- FATTURE DI ACQUISTO
-- =========================================================================

-- Fornitori
CREATE TABLE fornitori (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  ragione_sociale VARCHAR(200),
  indirizzo TEXT,
  citta VARCHAR(100),
  cap VARCHAR(10),
  provincia VARCHAR(5),
  telefono VARCHAR(20),
  email VARCHAR(100),
  partita_iva VARCHAR(20),
  codice_fiscale VARCHAR(20),
  attivo BOOLEAN DEFAULT true,
  
  -- Tipologia fornitore per contabilità analitica
  tipo_fornitore VARCHAR(50) DEFAULT 'fiori' CHECK (tipo_fornitore IN (
    'fiori',           -- Fornitore principale di fiori
    'trasportatore',   -- Azienda di trasporti
    'servizi',         -- Altri servizi
    'misto'            -- Fornitore che fa più cose
  )),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- SISTEMA CONTABILITÀ ANALITICA COSTI
-- =========================================================================

-- Tipologie di costo per contabilità analitica
CREATE TABLE tipologie_costo (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descrizione TEXT,
  colore VARCHAR(7), -- Colore esadecimale per grafici
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserimento tipologie standard
INSERT INTO tipologie_costo (nome, descrizione, colore) VALUES
('Trasporto', 'Costi di trasporto e spedizione', '#FF6B35'),
('Commissioni', 'Commissioni del fornitore', '#004E89'),
('Imballaggi', 'Costi per imballaggi e contenitori', '#1A936F');

-- Fatture di Acquisto con sistema di costi analitici
CREATE TABLE fatture_acquisto (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50) NOT NULL,
  data DATE NOT NULL,
  fornitore_id INTEGER NOT NULL REFERENCES fornitori(id),
  
  -- Totali
  totale DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Stati
  stato VARCHAR(20) DEFAULT 'bozza' CHECK (stato IN ('bozza', 'confermata', 'pagata', 'annullata')),
  
  -- Metadati
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint
  UNIQUE(numero, fornitore_id)
);

-- Dettaglio costi analitici per ogni fattura
CREATE TABLE costi_fattura (
  id SERIAL PRIMARY KEY,
  fattura_acquisto_id INTEGER NOT NULL REFERENCES fatture_acquisto(id) ON DELETE CASCADE,
  tipologia_costo_id INTEGER NOT NULL REFERENCES tipologie_costo(id),
  
  -- Chi ha sostenuto questo costo
  fornitore_costo_id INTEGER NOT NULL REFERENCES fornitori(id),
  
  -- Importo del costo
  importo DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (importo >= 0),
  
  -- Note specifiche per questo costo
  note TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un fornitore può avere più costi della stessa tipologia nella stessa fattura
  -- ma di solito sarà uno per tipologia
  UNIQUE(fattura_acquisto_id, tipologia_costo_id, fornitore_costo_id)
);

-- Vista per calcolare totali costi da spalmare
CREATE VIEW view_totali_costi_fattura AS
SELECT 
    fattura_acquisto_id,
    COALESCE(SUM(importo), 0) as totale_costi_spalmare
FROM costi_fattura
GROUP BY fattura_acquisto_id;

-- =========================================================================
-- DOCUMENTI DI CARICO (RIGHE DELLE FATTURE)
-- =========================================================================

-- Ogni riga del documento di carico crea/utilizza un ARTICOLO
CREATE TABLE documenti_carico (
  id SERIAL PRIMARY KEY,
  fattura_acquisto_id INTEGER NOT NULL REFERENCES fatture_acquisto(id) ON DELETE CASCADE,
  
  -- ARTICOLO (creato o riutilizzato)
  articolo_id INTEGER NOT NULL REFERENCES articoli(id),
  
  -- DATI VARIABILI (inseriti ogni volta)
  quantita INTEGER NOT NULL CHECK (quantita > 0), -- Non esistono quantità a zero
  prezzo_acquisto_per_stelo DECIMAL(10,4) NOT NULL CHECK (prezzo_acquisto_per_stelo > 0),
  
  -- SPALMO AUTOMATICO DEI COSTI (calcolato automaticamente)
  -- Si basa sulla proporzione: (valore di questa riga / totale fattura) * costi da spalmare
  costi_spalmare_per_stelo DECIMAL(10,4) DEFAULT 0,
  
  -- PREZZO FINALE DI COSTO (base per calcolare i prezzi di vendita)
  prezzo_costo_finale_per_stelo DECIMAL(10,4) GENERATED ALWAYS AS (
    prezzo_acquisto_per_stelo + COALESCE(costi_spalmare_per_stelo, 0)
  ) STORED,
  
  -- TRE PREZZI DI VENDITA (obbligatori, per stelo, modificabili)
  -- Si basano sul prezzo_costo_finale_per_stelo + ricarico
  prezzo_vendita_1 DECIMAL(10,4) NOT NULL CHECK (prezzo_vendita_1 > 0),
  prezzo_vendita_2 DECIMAL(10,4) NOT NULL CHECK (prezzo_vendita_2 > 0),
  prezzo_vendita_3 DECIMAL(10,4) NOT NULL CHECK (prezzo_vendita_3 > 0),
  
  -- Totale basato sul prezzo di acquisto (senza spalmo per ora)
  totale DECIMAL(10,2) GENERATED ALWAYS AS (
    quantita * prezzo_acquisto_per_stelo
  ) STORED,
  
  -- Totale con costi spalmare inclusi
  totale_con_costi DECIMAL(10,2) GENERATED ALWAYS AS (
    quantita * (prezzo_acquisto_per_stelo + COALESCE(costi_spalmare_per_stelo, 0))
  ) STORED,
  
  -- Metadati
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- IMPORTANTE: Anche se è lo stesso articolo, NON si sommano tra loro
  -- Ogni riga è un carico separato con i suoi prezzi specifici
  UNIQUE(fattura_acquisto_id, articolo_id, quantita, prezzo_acquisto_per_stelo)
);

-- =========================================================================
-- INDICI PER PERFORMANCE
-- =========================================================================

CREATE INDEX idx_articoli_gruppo ON articoli(gruppo_id);
CREATE INDEX idx_articoli_prodotto ON articoli(prodotto_id);
CREATE INDEX idx_articoli_colore ON articoli(colore_id);
CREATE INDEX idx_documenti_carico_fattura ON documenti_carico(fattura_acquisto_id);
CREATE INDEX idx_documenti_carico_articolo ON documenti_carico(articolo_id);
CREATE INDEX idx_fatture_acquisto_fornitore ON fatture_acquisto(fornitore_id);
CREATE INDEX idx_fatture_acquisto_data ON fatture_acquisto(data);

-- =========================================================================
-- TRIGGER PER AGGIORNARE UPDATED_AT
-- =========================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- FUNZIONE PER SPALMARE AUTOMATICAMENTE I COSTI
-- =========================================================================

-- Funzione per ricalcolare lo spalmo dei costi su tutti i documenti di carico di una fattura
CREATE OR REPLACE FUNCTION ricalcola_spalmo_costi(fattura_id INTEGER)
RETURNS VOID AS $$
DECLARE
    totale_fattura DECIMAL(10,2);
    costi_da_spalmare DECIMAL(10,2);
    doc_record RECORD;
    proporzione DECIMAL(10,6);
    costo_spalmare_per_stelo DECIMAL(10,4);
BEGIN
    -- Calcola il totale della fattura (somma di tutte le righe)
    SELECT COALESCE(SUM(quantita * prezzo_acquisto_per_stelo), 0) 
    INTO totale_fattura
    FROM documenti_carico 
    WHERE fattura_acquisto_id = fattura_id;
    
    -- Se il totale è zero, non fare niente
    IF totale_fattura = 0 THEN
        RETURN;
    END IF;
    
    -- Ottieni i costi da spalmare dalla vista
    SELECT COALESCE(totale_costi_spalmare, 0)
    INTO costi_da_spalmare
    FROM view_totali_costi_fattura
    WHERE fattura_acquisto_id = fattura_id;
    
    -- Per ogni documento di carico, calcola la proporzione e aggiorna
    FOR doc_record IN 
        SELECT id, quantita, prezzo_acquisto_per_stelo, (quantita * prezzo_acquisto_per_stelo) as valore_riga
        FROM documenti_carico 
        WHERE fattura_acquisto_id = fattura_id
    LOOP
        -- Calcola la proporzione di questa riga sul totale fattura
        proporzione := doc_record.valore_riga / totale_fattura;
        
        -- Calcola quanto costo spalmare per stelo
        costo_spalmare_per_stelo := (costi_da_spalmare * proporzione) / doc_record.quantita;
        
        -- Aggiorna il documento di carico
        UPDATE documenti_carico 
        SET costi_spalmare_per_stelo = costo_spalmare_per_stelo
        WHERE id = doc_record.id;
    END LOOP;
    
END;
$$ LANGUAGE plpgsql;

-- Trigger per ricalcolare automaticamente lo spalmo quando cambiano i costi della fattura
CREATE OR REPLACE FUNCTION trigger_ricalcola_spalmo_fattura()
RETURNS TRIGGER AS $$
BEGIN
    -- Ricalcola lo spalmo quando si modificano i costi della fattura
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Ottieni l'ID della fattura
        DECLARE
            fat_id INTEGER;
        BEGIN
            IF TG_OP = 'DELETE' THEN
                fat_id := OLD.fattura_acquisto_id;
            ELSE
                fat_id := NEW.fattura_acquisto_id;
            END IF;
            
            PERFORM ricalcola_spalmo_costi(fat_id);
        END;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger per ricalcolare automaticamente lo spalmo quando si aggiunge/modifica un documento di carico
CREATE OR REPLACE FUNCTION trigger_ricalcola_spalmo_documento()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Ricalcola lo spalmo per tutta la fattura solo su INSERT
        PERFORM ricalcola_spalmo_costi(NEW.fattura_acquisto_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Su UPDATE ricalcola solo se sono cambiati i valori rilevanti (NON costi_spalmare_per_stelo)
        IF (OLD.quantita IS DISTINCT FROM NEW.quantita) OR 
           (OLD.prezzo_acquisto_per_stelo IS DISTINCT FROM NEW.prezzo_acquisto_per_stelo) OR
           (OLD.fattura_acquisto_id IS DISTINCT FROM NEW.fattura_acquisto_id) THEN
            PERFORM ricalcola_spalmo_costi(NEW.fattura_acquisto_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Ricalcola lo spalmo per tutta la fattura
        PERFORM ricalcola_spalmo_costi(OLD.fattura_acquisto_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gruppi_updated_at 
    BEFORE UPDATE ON gruppi 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prodotti_updated_at 
    BEFORE UPDATE ON prodotti 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fornitori_updated_at 
    BEFORE UPDATE ON fornitori 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fatture_acquisto_updated_at 
    BEFORE UPDATE ON fatture_acquisto 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documenti_carico_updated_at 
    BEFORE UPDATE ON documenti_carico 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_costi_fattura_updated_at 
    BEFORE UPDATE ON costi_fattura 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per spalmo automatico dei costi quando cambiano i costi analitici
CREATE TRIGGER trigger_spalmo_costi_analitici
    AFTER INSERT OR UPDATE OR DELETE ON costi_fattura
    FOR EACH ROW EXECUTE FUNCTION trigger_ricalcola_spalmo_fattura();

CREATE TRIGGER trigger_spalmo_costi_documenti
    AFTER INSERT OR UPDATE OR DELETE ON documenti_carico
    FOR EACH ROW EXECUTE FUNCTION trigger_ricalcola_spalmo_documento();

-- =========================================================================
-- VIEW PER VISUALIZZAZIONI COMPLETE
-- =========================================================================

-- View per vedere tutti i carichi con dettagli completi
CREATE VIEW view_documenti_carico_completi AS
SELECT 
    dc.id,
    dc.fattura_acquisto_id,
    fa.numero as fattura_numero,
    fa.data as fattura_data,
    f.nome as fornitore_nome,
    
    -- Costi analitici della fattura
    COALESCE(vcf.totale_costi_spalmare, 0) as totale_costi_spalmare,
    
    -- Dettagli articolo
    a.id as articolo_id,
    a.nome_completo as articolo_nome,
    g.nome as gruppo_nome,
    p.nome as prodotto_nome,
    c.nome as colore_nome,
    pr.nome as provenienza_nome,
    fo.nome as foto_nome,
    fo.url as foto_url,
    i.nome as imballo_nome,
    
    -- Dati carico con spalmo costi
    dc.quantita,
    dc.prezzo_acquisto_per_stelo,
    dc.costi_spalmare_per_stelo,
    dc.prezzo_costo_finale_per_stelo,
    dc.prezzo_vendita_1,
    dc.prezzo_vendita_2,
    dc.prezzo_vendita_3,
    dc.totale,
    dc.totale_con_costi,
    
    -- Margini calcolati sul prezzo finale (con spalmo)
    (dc.prezzo_vendita_1 - dc.prezzo_costo_finale_per_stelo) as margine_per_stelo_1,
    (dc.prezzo_vendita_2 - dc.prezzo_costo_finale_per_stelo) as margine_per_stelo_2,
    (dc.prezzo_vendita_3 - dc.prezzo_costo_finale_per_stelo) as margine_per_stelo_3,
    
    dc.note,
    dc.created_at
    
FROM documenti_carico dc
JOIN fatture_acquisto fa ON dc.fattura_acquisto_id = fa.id
JOIN fornitori f ON fa.fornitore_id = f.id
LEFT JOIN view_totali_costi_fattura vcf ON fa.id = vcf.fattura_acquisto_id
JOIN articoli a ON dc.articolo_id = a.id
JOIN gruppi g ON a.gruppo_id = g.id
JOIN prodotti p ON a.prodotto_id = p.id
JOIN colori c ON a.colore_id = c.id
JOIN provenienze pr ON a.provenienza_id = pr.id
JOIN foto fo ON a.foto_id = fo.id
JOIN imballaggi i ON a.imballo_id = i.id
ORDER BY dc.created_at DESC;

-- View per anagrafica articoli
CREATE VIEW view_anagrafica_articoli AS
SELECT 
    a.*,
    g.nome as gruppo_nome,
    p.nome as prodotto_nome,
    c.nome as colore_nome,
    pr.nome as provenienza_nome,
    fo.nome as foto_nome,
    fo.url as foto_url,
    i.nome as imballo_nome,
    COUNT(dc.id) as numero_carichi,
    SUM(dc.quantita) as quantita_totale_caricata,
    MIN(dc.created_at) as primo_carico,
    MAX(dc.created_at) as ultimo_carico
FROM articoli a
JOIN gruppi g ON a.gruppo_id = g.id
JOIN prodotti p ON a.prodotto_id = p.id
JOIN colori c ON a.colore_id = c.id
JOIN provenienze pr ON a.provenienza_id = pr.id
JOIN foto fo ON a.foto_id = fo.id
JOIN imballaggi i ON a.imballo_id = i.id
LEFT JOIN documenti_carico dc ON a.id = dc.articolo_id
GROUP BY a.id, g.nome, p.nome, c.nome, pr.nome, fo.nome, fo.url, i.nome
ORDER BY a.created_at DESC;

-- =========================================================================
-- GESTIONE MAGAZZINO E GIACENZE
-- =========================================================================

-- GIACENZE: Ogni riga di documento_carico rappresenta una giacenza separata
-- NON si sommano carichi dello stesso articolo - rimangono righe separate
CREATE VIEW view_giacenze_magazzino AS
SELECT 
    dc.id as carico_id,
    dc.fattura_acquisto_id,
    fa.numero as fattura_numero,
    fa.data as fattura_data,
    f.nome as fornitore_nome,
    
    -- Dettagli articolo
    a.id as articolo_id,
    a.nome_completo as articolo_nome,
    g.nome as gruppo_nome,
    p.nome as prodotto_nome,
    c.nome as colore_nome,
    pr.nome as provenienza_nome,
    fo.nome as foto_nome,
    fo.url as foto_url,
    i.nome as imballo_nome,
    
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
    
    -- Margini di profitto per stelo (basati sul costo finale con spalmo)
    (dc.prezzo_vendita_1 - dc.prezzo_costo_finale_per_stelo) as margine_per_stelo_1,
    (dc.prezzo_vendita_2 - dc.prezzo_costo_finale_per_stelo) as margine_per_stelo_2,
    (dc.prezzo_vendita_3 - dc.prezzo_costo_finale_per_stelo) as margine_per_stelo_3,
    
    -- Percentuali di markup (basate sul costo finale con spalmo)
    ROUND(((dc.prezzo_vendita_1 - dc.prezzo_costo_finale_per_stelo) / dc.prezzo_costo_finale_per_stelo * 100), 2) as markup_percentuale_1,
    ROUND(((dc.prezzo_vendita_2 - dc.prezzo_costo_finale_per_stelo) / dc.prezzo_costo_finale_per_stelo * 100), 2) as markup_percentuale_2,
    ROUND(((dc.prezzo_vendita_3 - dc.prezzo_costo_finale_per_stelo) / dc.prezzo_costo_finale_per_stelo * 100), 2) as markup_percentuale_3,
    
    -- Margini totali per giacenza
    ((dc.prezzo_vendita_1 - dc.prezzo_costo_finale_per_stelo) * dc.quantita) as margine_totale_1,
    ((dc.prezzo_vendita_2 - dc.prezzo_costo_finale_per_stelo) * dc.quantita) as margine_totale_2,
    ((dc.prezzo_vendita_3 - dc.prezzo_costo_finale_per_stelo) * dc.quantita) as margine_totale_3,
    
    -- GIORNI DI GIACENZA (giorni passati dall'inserimento)
    (CURRENT_DATE - dc.created_at::date) as giorni_giacenza,
    
    -- Metadati
    dc.note,
    dc.created_at as data_carico
    
FROM documenti_carico dc
JOIN fatture_acquisto fa ON dc.fattura_acquisto_id = fa.id
JOIN fornitori f ON fa.fornitore_id = f.id
JOIN articoli a ON dc.articolo_id = a.id
JOIN gruppi g ON a.gruppo_id = g.id
JOIN prodotti p ON a.prodotto_id = p.id
JOIN colori c ON a.colore_id = c.id
JOIN provenienze pr ON a.provenienza_id = pr.id
JOIN foto fo ON a.foto_id = fo.id
JOIN imballaggi i ON a.imballo_id = i.id
WHERE dc.quantita > 0  -- Solo giacenze con quantità positive
ORDER BY g.nome ASC, p.nome ASC, c.nome ASC, pr.nome ASC, i.nome ASC;  -- Ordinamento alfabetico per gruppi

-- View per riepilogo giacenze per articolo (se serve vedere i totali)
CREATE VIEW view_riepilogo_giacenze_per_articolo AS
SELECT 
    a.id as articolo_id,
    a.nome_completo as articolo_nome,
    g.nome as gruppo_nome,
    p.nome as prodotto_nome,
    c.nome as colore_nome,
    pr.nome as provenienza_nome,
    i.nome as imballo_nome,
    
    -- Totali per articolo
    COUNT(dc.id) as numero_carichi_in_giacenza,
    SUM(dc.quantita) as quantita_totale_giacenza,
    SUM(dc.totale) as valore_totale_giacenza,
    
    -- Prezzo medio ponderato
    CASE 
        WHEN SUM(dc.quantita) > 0 
        THEN SUM(dc.totale) / SUM(dc.quantita)
        ELSE 0 
    END as prezzo_medio_per_stelo,
    
    -- Giorni di giacenza (più vecchio e più recente)
    MIN((CURRENT_DATE - dc.created_at::date)) as giorni_giacenza_min,
    MAX((CURRENT_DATE - dc.created_at::date)) as giorni_giacenza_max,
    AVG((CURRENT_DATE - dc.created_at::date)) as giorni_giacenza_media,
    
    -- Date
    MIN(dc.created_at) as primo_carico,
    MAX(dc.created_at) as ultimo_carico
    
FROM documenti_carico dc
JOIN articoli a ON dc.articolo_id = a.id
JOIN gruppi g ON a.gruppo_id = g.id
JOIN prodotti p ON a.prodotto_id = p.id
JOIN colori c ON a.colore_id = c.id
JOIN provenienze pr ON a.provenienza_id = pr.id
JOIN imballaggi i ON a.imballo_id = i.id
WHERE dc.quantita > 0  -- Solo giacenze con quantità positive
GROUP BY a.id, a.nome_completo, g.nome, p.nome, c.nome, pr.nome, i.nome
ORDER BY g.nome ASC, p.nome ASC, c.nome ASC, pr.nome ASC, i.nome ASC;  -- Ordinamento alfabetico per gruppi

-- =========================================================================
-- SISTEMA TRACCIAMENTO MOVIMENTI E MODIFICHE
-- =========================================================================

-- Tabella per tracciare TUTTI i movimenti e modifiche del sistema
CREATE TABLE movimenti_dettagliati (
  id SERIAL PRIMARY KEY,
  
  -- Tipo di operazione
  tipo_movimento VARCHAR(50) NOT NULL CHECK (tipo_movimento IN (
    'CARICO_NUOVO',           -- Nuovo documento di carico creato
    'MODIFICA_PREZZO_ACQUISTO', -- Modifica prezzo di acquisto giacenza
    'MODIFICA_PREZZO_VENDITA_1', -- Modifica primo prezzo di vendita
    'MODIFICA_PREZZO_VENDITA_2', -- Modifica secondo prezzo di vendita
    'MODIFICA_PREZZO_VENDITA_3', -- Modifica terzo prezzo di vendita
    'MODIFICA_QUANTITA',      -- Modifica quantità giacenza
    'MODIFICA_NOTE',          -- Modifica note
    'ELIMINAZIONE_CARICO',    -- Eliminazione documento di carico
    'CREAZIONE_FATTURA',      -- Creazione fattura di acquisto
    'MODIFICA_FATTURA',       -- Modifica fattura di acquisto
    'CREAZIONE_ARTICOLO',     -- Creazione nuovo articolo
    'CREAZIONE_PRODOTTO',     -- Creazione nuovo prodotto
    'MODIFICA_ANAGRAFICA'     -- Modifica elementi anagrafica
  )),
  
  -- Riferimenti alle entità coinvolte
  fattura_acquisto_id INTEGER REFERENCES fatture_acquisto(id),
  documento_carico_id INTEGER REFERENCES documenti_carico(id),
  articolo_id INTEGER REFERENCES articoli(id),
  
  -- Dettagli del movimento
  descrizione TEXT NOT NULL,  -- Descrizione dettagliata del movimento
  
  -- Valori PRIMA della modifica (per confronto)
  valore_precedente TEXT,     -- JSON o testo del valore precedente
  valore_nuovo TEXT,          -- JSON o testo del nuovo valore
  
  -- Quantità coinvolte (se applicabile)
  quantita_coinvolta INTEGER,
  
  -- Valori economici (se applicabile)
  importo_precedente DECIMAL(10,4),
  importo_nuovo DECIMAL(10,4),
  differenza_importo DECIMAL(10,4) GENERATED ALWAYS AS (
    COALESCE(importo_nuovo, 0) - COALESCE(importo_precedente, 0)
  ) STORED,
  
  -- Metadati
  utente VARCHAR(100),        -- Chi ha fatto la modifica (se disponibile)
  ip_address INET,           -- IP da cui è stata fatta la modifica
  user_agent TEXT,           -- Browser/app utilizzata
  note_movimento TEXT,       -- Note aggiuntive sul movimento
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance sui movimenti
CREATE INDEX idx_movimenti_dettagliati_tipo ON movimenti_dettagliati(tipo_movimento);
CREATE INDEX idx_movimenti_dettagliati_data ON movimenti_dettagliati(created_at);
CREATE INDEX idx_movimenti_dettagliati_fattura ON movimenti_dettagliati(fattura_acquisto_id);
CREATE INDEX idx_movimenti_dettagliati_carico ON movimenti_dettagliati(documento_carico_id);
CREATE INDEX idx_movimenti_dettagliati_articolo ON movimenti_dettagliati(articolo_id);

-- =========================================================================
-- TRIGGER PER TRACCIARE AUTOMATICAMENTE I MOVIMENTI
-- =========================================================================

-- Funzione per tracciare modifiche ai documenti di carico
CREATE OR REPLACE FUNCTION track_documenti_carico_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserimento nuovo documento di carico
    IF TG_OP = 'INSERT' THEN
        INSERT INTO movimenti_dettagliati (
            tipo_movimento, fattura_acquisto_id, documento_carico_id, articolo_id,
            descrizione, quantita_coinvolta, importo_nuovo
        ) VALUES (
            'CARICO_NUOVO',
            NEW.fattura_acquisto_id,
            NEW.id,
            NEW.articolo_id,
            CONCAT('Nuovo carico: ', NEW.quantita, ' steli a €', NEW.prezzo_acquisto_per_stelo, ' per stelo'),
            NEW.quantita,
            NEW.prezzo_acquisto_per_stelo
        );
        RETURN NEW;
    END IF;
    
    -- Modifiche ai documenti di carico
    IF TG_OP = 'UPDATE' THEN
        -- Traccia modifica quantità
        IF OLD.quantita != NEW.quantita THEN
            INSERT INTO movimenti_dettagliati (
                tipo_movimento, documento_carico_id, articolo_id,
                descrizione, valore_precedente, valore_nuovo, quantita_coinvolta
            ) VALUES (
                'MODIFICA_QUANTITA',
                NEW.id,
                NEW.articolo_id,
                'Modifica quantità giacenza',
                OLD.quantita::TEXT,
                NEW.quantita::TEXT,
                NEW.quantita - OLD.quantita
            );
        END IF;
        
        -- Traccia modifica prezzo acquisto
        IF OLD.prezzo_acquisto_per_stelo != NEW.prezzo_acquisto_per_stelo THEN
            INSERT INTO movimenti_dettagliati (
                tipo_movimento, documento_carico_id, articolo_id,
                descrizione, importo_precedente, importo_nuovo
            ) VALUES (
                'MODIFICA_PREZZO_ACQUISTO',
                NEW.id,
                NEW.articolo_id,
                'Modifica prezzo di acquisto per stelo',
                OLD.prezzo_acquisto_per_stelo,
                NEW.prezzo_acquisto_per_stelo
            );
        END IF;
        
        -- Traccia modifica prezzo vendita 1
        IF OLD.prezzo_vendita_1 != NEW.prezzo_vendita_1 THEN
            INSERT INTO movimenti_dettagliati (
                tipo_movimento, documento_carico_id, articolo_id,
                descrizione, importo_precedente, importo_nuovo
            ) VALUES (
                'MODIFICA_PREZZO_VENDITA_1',
                NEW.id,
                NEW.articolo_id,
                'Modifica primo prezzo di vendita per stelo',
                OLD.prezzo_vendita_1,
                NEW.prezzo_vendita_1
            );
        END IF;
        
        -- Traccia modifica prezzo vendita 2
        IF OLD.prezzo_vendita_2 != NEW.prezzo_vendita_2 THEN
            INSERT INTO movimenti_dettagliati (
                tipo_movimento, documento_carico_id, articolo_id,
                descrizione, importo_precedente, importo_nuovo
            ) VALUES (
                'MODIFICA_PREZZO_VENDITA_2',
                NEW.id,
                NEW.articolo_id,
                'Modifica secondo prezzo di vendita per stelo',
                OLD.prezzo_vendita_2,
                NEW.prezzo_vendita_2
            );
        END IF;
        
        -- Traccia modifica prezzo vendita 3
        IF OLD.prezzo_vendita_3 != NEW.prezzo_vendita_3 THEN
            INSERT INTO movimenti_dettagliati (
                tipo_movimento, documento_carico_id, articolo_id,
                descrizione, importo_precedente, importo_nuovo
            ) VALUES (
                'MODIFICA_PREZZO_VENDITA_3',
                NEW.id,
                NEW.articolo_id,
                'Modifica terzo prezzo di vendita per stelo',
                OLD.prezzo_vendita_3,
                NEW.prezzo_vendita_3
            );
        END IF;
        
        -- Traccia modifica note
        IF COALESCE(OLD.note, '') != COALESCE(NEW.note, '') THEN
            INSERT INTO movimenti_dettagliati (
                tipo_movimento, documento_carico_id, articolo_id,
                descrizione, valore_precedente, valore_nuovo
            ) VALUES (
                'MODIFICA_NOTE',
                NEW.id,
                NEW.articolo_id,
                'Modifica note documento di carico',
                COALESCE(OLD.note, ''),
                COALESCE(NEW.note, '')
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Eliminazione documento di carico
    IF TG_OP = 'DELETE' THEN
        INSERT INTO movimenti_dettagliati (
            tipo_movimento, fattura_acquisto_id, documento_carico_id, articolo_id,
            descrizione, quantita_coinvolta, importo_precedente
        ) VALUES (
            'ELIMINAZIONE_CARICO',
            OLD.fattura_acquisto_id,
            OLD.id,
            OLD.articolo_id,
            CONCAT('Eliminazione carico: ', OLD.quantita, ' steli a €', OLD.prezzo_acquisto_per_stelo, ' per stelo'),
            OLD.quantita,
            OLD.prezzo_acquisto_per_stelo
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger per documenti di carico
CREATE TRIGGER trigger_track_documenti_carico_changes
    AFTER INSERT OR UPDATE OR DELETE ON documenti_carico
    FOR EACH ROW EXECUTE FUNCTION track_documenti_carico_changes();

-- Funzione per tracciare modifiche alle fatture di acquisto
CREATE OR REPLACE FUNCTION track_fatture_acquisto_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO movimenti_dettagliati (
            tipo_movimento, fattura_acquisto_id,
            descrizione
        ) VALUES (
            'CREAZIONE_FATTURA',
            NEW.id,
            CONCAT('Nuova fattura di acquisto: ', NEW.numero, ' del ', NEW.data)
        );
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO movimenti_dettagliati (
            tipo_movimento, fattura_acquisto_id,
            descrizione, valore_precedente, valore_nuovo
        ) VALUES (
            'MODIFICA_FATTURA',
            NEW.id,
            'Modifica fattura di acquisto',
            CONCAT('Numero: ', OLD.numero, ', Data: ', OLD.data, ', Stato: ', OLD.stato),
            CONCAT('Numero: ', NEW.numero, ', Data: ', NEW.data, ', Stato: ', NEW.stato)
        );
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger per fatture di acquisto
CREATE TRIGGER trigger_track_fatture_acquisto_changes
    AFTER INSERT OR UPDATE ON fatture_acquisto
    FOR EACH ROW EXECUTE FUNCTION track_fatture_acquisto_changes();

-- =========================================================================
-- VIEW PER QUERY MOVIMENTI DETTAGLIATA
-- =========================================================================

-- View principale per vedere tutti i movimenti in dettaglio
CREATE VIEW view_movimenti_dettagliati AS
SELECT 
    m.id,
    m.tipo_movimento,
    m.descrizione,
    
    -- Dettagli fattura (se coinvolta)
    fa.numero as fattura_numero,
    fa.data as fattura_data,
    f.nome as fornitore_nome,
    
    -- Dettagli articolo (se coinvolto)
    a.nome_completo as articolo_nome,
    g.nome as gruppo_nome,
    p.nome as prodotto_nome,
    c.nome as colore_nome,
    pr.nome as provenienza_nome,
    
    -- Dettagli del movimento
    m.valore_precedente,
    m.valore_nuovo,
    m.quantita_coinvolta,
    m.importo_precedente,
    m.importo_nuovo,
    m.differenza_importo,
    
    -- Metadati
    m.utente,
    m.ip_address,
    m.user_agent,
    m.note_movimento,
    m.created_at,
    
    -- Calcoli aggiuntivi
    CASE 
        WHEN m.tipo_movimento LIKE '%PREZZO%' THEN 
            CONCAT('€', m.importo_precedente, ' → €', m.importo_nuovo, ' (', 
                   CASE WHEN m.differenza_importo > 0 THEN '+' ELSE '' END,
                   '€', m.differenza_importo, ')')
        ELSE NULL
    END as variazione_prezzo_formattata
    
FROM movimenti_dettagliati m
LEFT JOIN fatture_acquisto fa ON m.fattura_acquisto_id = fa.id
LEFT JOIN fornitori f ON fa.fornitore_id = f.id
LEFT JOIN documenti_carico dc ON m.documento_carico_id = dc.id
LEFT JOIN articoli a ON m.articolo_id = a.id
LEFT JOIN gruppi g ON a.gruppo_id = g.id
LEFT JOIN prodotti p ON a.prodotto_id = p.id
LEFT JOIN colori c ON a.colore_id = c.id
LEFT JOIN provenienze pr ON a.provenienza_id = pr.id
ORDER BY m.created_at DESC;

-- View per movimenti per articolo
CREATE VIEW view_movimenti_per_articolo AS
SELECT 
    a.id as articolo_id,
    a.nome_completo as articolo_nome,
    COUNT(m.id) as numero_movimenti,
    COUNT(CASE WHEN m.tipo_movimento = 'CARICO_NUOVO' THEN 1 END) as numero_carichi,
    COUNT(CASE WHEN m.tipo_movimento LIKE 'MODIFICA_%' THEN 1 END) as numero_modifiche,
    MIN(m.created_at) as primo_movimento,
    MAX(m.created_at) as ultimo_movimento,
    
    -- Totali economici
    SUM(CASE WHEN m.tipo_movimento = 'CARICO_NUOVO' THEN m.quantita_coinvolta ELSE 0 END) as quantita_totale_caricata,
    SUM(CASE WHEN m.tipo_movimento = 'CARICO_NUOVO' THEN (m.quantita_coinvolta * m.importo_nuovo) ELSE 0 END) as valore_totale_caricato
    
FROM articoli a
LEFT JOIN movimenti_dettagliati m ON a.id = m.articolo_id
GROUP BY a.id, a.nome_completo
HAVING COUNT(m.id) > 0
ORDER BY ultimo_movimento DESC;

-- View per movimenti recenti (ultimi 100)
CREATE VIEW view_movimenti_recenti AS
SELECT * FROM view_movimenti_dettagliati
LIMIT 100;

-- =========================================================================
-- VIEW PER CONTABILITÀ ANALITICA DEI COSTI
-- =========================================================================

-- View per analisi dettagliata dei costi per fattura
CREATE VIEW view_costi_fattura_dettaglio AS
SELECT 
    cf.id,
    cf.fattura_acquisto_id,
    fa.numero as fattura_numero,
    fa.data as fattura_data,
    f_principale.nome as fornitore_principale,
    
    -- Dettagli del costo
    tc.nome as tipologia_costo,
    tc.descrizione as descrizione_costo,
    tc.colore as colore_tipologia,
    cf.importo,
    
    -- Fornitore che ha sostenuto il costo
    f_costo.nome as fornitore_costo,
    f_costo.tipo_fornitore,
    
    cf.note,
    cf.created_at
    
FROM costi_fattura cf
JOIN fatture_acquisto fa ON cf.fattura_acquisto_id = fa.id
JOIN fornitori f_principale ON fa.fornitore_id = f_principale.id
JOIN tipologie_costo tc ON cf.tipologia_costo_id = tc.id
JOIN fornitori f_costo ON cf.fornitore_costo_id = f_costo.id
ORDER BY fa.data DESC, cf.created_at DESC;

-- View per analisi costi per tipologia e periodo
CREATE VIEW view_analisi_costi_per_tipologia AS
SELECT 
    tc.nome as tipologia_costo,
    tc.colore,
    EXTRACT(YEAR FROM fa.data) as anno,
    EXTRACT(MONTH FROM fa.data) as mese,
    COUNT(cf.id) as numero_fatture,
    SUM(cf.importo) as totale_importo,
    AVG(cf.importo) as importo_medio,
    MIN(cf.importo) as importo_minimo,
    MAX(cf.importo) as importo_massimo
    
FROM costi_fattura cf
JOIN fatture_acquisto fa ON cf.fattura_acquisto_id = fa.id
JOIN tipologie_costo tc ON cf.tipologia_costo_id = tc.id
WHERE fa.stato != 'annullata'
GROUP BY tc.id, tc.nome, tc.colore, anno, mese
ORDER BY anno DESC, mese DESC, tc.nome;

-- View per analisi costi per fornitore
CREATE VIEW view_analisi_costi_per_fornitore AS
SELECT 
    f.id as fornitore_id,
    f.nome as fornitore_nome,
    f.tipo_fornitore,
    tc.nome as tipologia_costo,
    COUNT(cf.id) as numero_fatture,
    SUM(cf.importo) as totale_speso,
    AVG(cf.importo) as costo_medio,
    MIN(fa.data) as prima_fattura,
    MAX(fa.data) as ultima_fattura
    
FROM costi_fattura cf
JOIN fatture_acquisto fa ON cf.fattura_acquisto_id = fa.id
JOIN fornitori f ON cf.fornitore_costo_id = f.id
JOIN tipologie_costo tc ON cf.tipologia_costo_id = tc.id
WHERE fa.stato != 'annullata'
GROUP BY f.id, f.nome, f.tipo_fornitore, tc.id, tc.nome
ORDER BY totale_speso DESC;

-- View per riepilogo costi mensili
CREATE VIEW view_riepilogo_costi_mensili AS
SELECT 
    EXTRACT(YEAR FROM fa.data) as anno,
    EXTRACT(MONTH FROM fa.data) as mese,
    COUNT(DISTINCT fa.id) as numero_fatture,
    SUM(CASE WHEN tc.nome = 'Trasporto' THEN cf.importo ELSE 0 END) as totale_trasporto,
    SUM(CASE WHEN tc.nome = 'Commissioni' THEN cf.importo ELSE 0 END) as totale_commissioni,
    SUM(CASE WHEN tc.nome = 'Imballaggi' THEN cf.importo ELSE 0 END) as totale_imballaggi,
    SUM(cf.importo) as totale_costi_accessori,
    
    -- Percentuali sui costi
    CASE 
        WHEN SUM(cf.importo) > 0 THEN 
            ROUND((SUM(CASE WHEN tc.nome = 'Trasporto' THEN cf.importo ELSE 0 END) / SUM(cf.importo) * 100), 2)
        ELSE 0 
    END as percentuale_trasporto,
    
    CASE 
        WHEN SUM(cf.importo) > 0 THEN 
            ROUND((SUM(CASE WHEN tc.nome = 'Commissioni' THEN cf.importo ELSE 0 END) / SUM(cf.importo) * 100), 2)
        ELSE 0 
    END as percentuale_commissioni,
    
    CASE 
        WHEN SUM(cf.importo) > 0 THEN 
            ROUND((SUM(CASE WHEN tc.nome = 'Imballaggi' THEN cf.importo ELSE 0 END) / SUM(cf.importo) * 100), 2)
        ELSE 0 
    END as percentuale_imballaggi
    
FROM costi_fattura cf
JOIN fatture_acquisto fa ON cf.fattura_acquisto_id = fa.id
JOIN tipologie_costo tc ON cf.tipologia_costo_id = tc.id
WHERE fa.stato != 'annullata'
GROUP BY anno, mese
ORDER BY anno DESC, mese DESC;

-- View per TOP fornitori di trasporto
CREATE VIEW view_top_trasportatori AS
SELECT 
    f.id,
    f.nome,
    f.tipo_fornitore,
    COUNT(cf.id) as numero_trasporti,
    SUM(cf.importo) as totale_fatturato,
    AVG(cf.importo) as costo_medio_trasporto,
    MIN(fa.data) as primo_trasporto,
    MAX(fa.data) as ultimo_trasporto,
    
    -- Calcola quanto ha trasportato negli ultimi 3 mesi
    SUM(CASE 
        WHEN fa.data >= CURRENT_DATE - INTERVAL '3 months' 
        THEN cf.importo 
        ELSE 0 
    END) as fatturato_ultimi_3_mesi
    
FROM costi_fattura cf
JOIN fatture_acquisto fa ON cf.fattura_acquisto_id = fa.id
JOIN fornitori f ON cf.fornitore_costo_id = f.id
JOIN tipologie_costo tc ON cf.tipologia_costo_id = tc.id
WHERE tc.nome = 'Trasporto' 
AND fa.stato != 'annullata'
GROUP BY f.id, f.nome, f.tipo_fornitore
ORDER BY totale_fatturato DESC;

-- =========================================================================
-- SISTEMA MAGAZZINO DISTRUZIONE
-- =========================================================================

-- Motivi di distruzione predefiniti
CREATE TABLE motivi_distruzione (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descrizione TEXT,
  colore VARCHAR(7), -- Colore esadecimale per grafici statistiche
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserimento motivi standard
INSERT INTO motivi_distruzione (nome, descrizione, colore) VALUES
('Appassiti', 'Fiori appassiti o rovinati dal tempo', '#FF6B6B'),
('Danneggiati', 'Fiori danneggiati durante trasporto o manipolazione', '#FFA500'),
('Difettosi', 'Fiori con difetti di qualità alla consegna', '#DC143C'),
('Scaduti', 'Fiori oltre il tempo limite di vendita', '#8B4513'),
('Altro', 'Altri motivi di distruzione', '#808080');

-- Documenti di distruzione - traccia tutto ciò che viene buttato
CREATE TABLE documenti_distruzione (
  id SERIAL PRIMARY KEY,
  
  -- RIFERIMENTO ALLA GIACENZA ORIGINALE
  documento_carico_id INTEGER NOT NULL REFERENCES documenti_carico(id),
  
  -- DATI DELLA DISTRUZIONE
  quantita_distrutta INTEGER NOT NULL CHECK (quantita_distrutta > 0),
  motivo_distruzione_id INTEGER NOT NULL REFERENCES motivi_distruzione(id),
  
  -- COSTI DELLA PERDITA (calcolati automaticamente dalla giacenza originale)
  prezzo_costo_unitario DECIMAL(10,4) NOT NULL, -- Copiato da documento_carico al momento della distruzione
  valore_perdita DECIMAL(10,2) GENERATED ALWAYS AS (
    quantita_distrutta * prezzo_costo_unitario
  ) STORED,
  
  -- DETTAGLI
  note TEXT,
  
  -- CHI HA FATTO LA DISTRUZIONE
  utente VARCHAR(100), -- Chi ha registrato la distruzione
  
  -- TIMESTAMP
  data_distruzione DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_documenti_distruzione_carico ON documenti_distruzione(documento_carico_id);
CREATE INDEX idx_documenti_distruzione_motivo ON documenti_distruzione(motivo_distruzione_id);
CREATE INDEX idx_documenti_distruzione_data ON documenti_distruzione(data_distruzione);

-- =========================================================================
-- FUNZIONE PER GESTIRE LA DISTRUZIONE
-- =========================================================================

-- Funzione per eseguire una distruzione (riduce giacenza + crea record distruzione)
CREATE OR REPLACE FUNCTION esegui_distruzione(
    p_documento_carico_id INTEGER,
    p_quantita_da_distruggere INTEGER,
    p_motivo_distruzione_id INTEGER,
    p_note TEXT DEFAULT NULL,
    p_utente VARCHAR(100) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    giacenza_attuale INTEGER;
    prezzo_costo DECIMAL(10,4);
    distruzione_id INTEGER;
BEGIN
    -- Ottieni la quantità attuale e il prezzo di costo della giacenza
    SELECT quantita, prezzo_costo_finale_per_stelo
    INTO giacenza_attuale, prezzo_costo
    FROM documenti_carico 
    WHERE id = p_documento_carico_id;
    
    -- Verifica che ci sia abbastanza giacenza
    IF giacenza_attuale IS NULL THEN
        RAISE EXCEPTION 'Documento di carico non trovato';
    END IF;
    
    IF p_quantita_da_distruggere > giacenza_attuale THEN
        RAISE EXCEPTION 'Quantità da distruggere (%) superiore alla giacenza disponibile (%)', 
            p_quantita_da_distruggere, giacenza_attuale;
    END IF;
    
    IF p_quantita_da_distruggere <= 0 THEN
        RAISE EXCEPTION 'La quantità da distruggere deve essere maggiore di zero';
    END IF;
    
    -- Crea il documento di distruzione
    INSERT INTO documenti_distruzione (
        documento_carico_id,
        quantita_distrutta,
        motivo_distruzione_id,
        prezzo_costo_unitario,
        note,
        utente
    ) VALUES (
        p_documento_carico_id,
        p_quantita_da_distruggere,
        p_motivo_distruzione_id,
        prezzo_costo,
        p_note,
        p_utente
    ) RETURNING id INTO distruzione_id;
    
    -- Riduce la quantità nella giacenza originale
    UPDATE documenti_carico 
    SET quantita = quantita - p_quantita_da_distruggere
    WHERE id = p_documento_carico_id;
    
    -- Restituisce l'ID del documento di distruzione creato
    RETURN distruzione_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- TRIGGER PER TRACCIARE LE DISTRUZIONI NEI MOVIMENTI
-- =========================================================================

-- Aggiorna i tipi di movimento per includere le distruzioni
ALTER TABLE movimenti_dettagliati 
DROP CONSTRAINT IF EXISTS movimenti_dettagliati_tipo_movimento_check;

ALTER TABLE movimenti_dettagliati 
ADD CONSTRAINT movimenti_dettagliati_tipo_movimento_check 
CHECK (tipo_movimento IN (
    'CARICO_NUOVO',           -- Nuovo documento di carico creato
    'MODIFICA_PREZZO_ACQUISTO', -- Modifica prezzo di acquisto giacenza
    'MODIFICA_PREZZO_VENDITA_1', -- Modifica primo prezzo di vendita
    'MODIFICA_PREZZO_VENDITA_2', -- Modifica secondo prezzo di vendita
    'MODIFICA_PREZZO_VENDITA_3', -- Modifica terzo prezzo di vendita
    'MODIFICA_QUANTITA',      -- Modifica quantità giacenza
    'MODIFICA_NOTE',          -- Modifica note
    'ELIMINAZIONE_CARICO',    -- Eliminazione documento di carico
    'CREAZIONE_FATTURA',      -- Creazione fattura di acquisto
    'MODIFICA_FATTURA',       -- Modifica fattura di acquisto
    'CREAZIONE_ARTICOLO',     -- Creazione nuovo articolo
    'CREAZIONE_PRODOTTO',     -- Creazione nuovo prodotto
    'MODIFICA_ANAGRAFICA',    -- Modifica elementi anagrafica
    'DISTRUZIONE_MERCE'       -- Distruzione merce dal magazzino
));

-- Aggiungi colonna per riferimento distruzione nei movimenti
ALTER TABLE movimenti_dettagliati 
ADD COLUMN documento_distruzione_id INTEGER REFERENCES documenti_distruzione(id);

-- Indice per la nuova colonna
CREATE INDEX idx_movimenti_dettagliati_distruzione ON movimenti_dettagliati(documento_distruzione_id);

-- Funzione per tracciare le distruzioni
CREATE OR REPLACE FUNCTION track_distruzioni_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Registra la distruzione nei movimenti dettagliati
        INSERT INTO movimenti_dettagliati (
            tipo_movimento, 
            documento_carico_id, 
            documento_distruzione_id,
            articolo_id,
            descrizione, 
            quantita_coinvolta, 
            importo_precedente,
            utente,
            note_movimento
        ) 
        SELECT 
            'DISTRUZIONE_MERCE',
            NEW.documento_carico_id,
            NEW.id,
            dc.articolo_id,
            CONCAT('Distruzione: ', NEW.quantita_distrutta, ' steli - Motivo: ', md.nome),
            NEW.quantita_distrutta,
            NEW.valore_perdita,
            NEW.utente,
            NEW.note
        FROM documenti_carico dc
        JOIN motivi_distruzione md ON NEW.motivo_distruzione_id = md.id
        WHERE dc.id = NEW.documento_carico_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger per tracciare le distruzioni
CREATE TRIGGER trigger_track_distruzioni_changes
    AFTER INSERT ON documenti_distruzione
    FOR EACH ROW EXECUTE FUNCTION track_distruzioni_changes();

-- Trigger per updated_at
CREATE TRIGGER update_documenti_distruzione_updated_at 
    BEFORE UPDATE ON documenti_distruzione 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- VIEW PER MAGAZZINO DISTRUZIONE
-- =========================================================================

-- Vista principale del magazzino di distruzione
CREATE VIEW view_magazzino_distruzione AS
SELECT 
    dd.id as distruzione_id,
    dd.data_distruzione,
    
    -- Dettagli dell'articolo distrutto
    a.id as articolo_id,
    a.nome_completo as articolo_nome,
    g.nome as gruppo_nome,
    p.nome as prodotto_nome,
    c.nome as colore_nome,
    pr.nome as provenienza_nome,
    fo.nome as foto_nome,
    fo.url as foto_url,
    i.nome as imballo_nome,
    
    -- Dettagli della distruzione
    dd.quantita_distrutta,
    dd.prezzo_costo_unitario,
    dd.valore_perdita,
    
    -- Motivo della distruzione
    md.nome as motivo_distruzione,
    md.descrizione as motivo_descrizione,
    md.colore as motivo_colore,
    
    -- Dettagli della giacenza originale
    dc.id as carico_originale_id,
    fa.numero as fattura_numero,
    fa.data as fattura_data,
    f.nome as fornitore_nome,
    dc.quantita as quantita_residua_giacenza,
    
    -- Giorni dalla fattura alla distruzione
    (dd.data_distruzione - fa.data) as giorni_dalla_fattura,
    
    -- Dettagli operativi
    dd.note,
    dd.utente,
    dd.created_at
    
FROM documenti_distruzione dd
JOIN documenti_carico dc ON dd.documento_carico_id = dc.id
JOIN fatture_acquisto fa ON dc.fattura_acquisto_id = fa.id
JOIN fornitori f ON fa.fornitore_id = f.id
JOIN articoli a ON dc.articolo_id = a.id
JOIN gruppi g ON a.gruppo_id = g.id
JOIN prodotti p ON a.prodotto_id = p.id
JOIN colori c ON a.colore_id = c.id
JOIN provenienze pr ON a.provenienza_id = pr.id
JOIN foto fo ON a.foto_id = fo.id
JOIN imballaggi i ON a.imballo_id = i.id
JOIN motivi_distruzione md ON dd.motivo_distruzione_id = md.id
ORDER BY dd.data_distruzione DESC, dd.created_at DESC;

-- Vista riepilogo distruzioni per motivo
CREATE VIEW view_riepilogo_distruzioni_per_motivo AS
SELECT 
    md.id as motivo_id,
    md.nome as motivo_nome,
    md.colore as motivo_colore,
    COUNT(dd.id) as numero_distruzioni,
    SUM(dd.quantita_distrutta) as quantita_totale_distrutta,
    SUM(dd.valore_perdita) as valore_totale_perdita,
    AVG(dd.valore_perdita) as valore_medio_perdita,
    MIN(dd.data_distruzione) as prima_distruzione,
    MAX(dd.data_distruzione) as ultima_distruzione
FROM motivi_distruzione md
LEFT JOIN documenti_distruzione dd ON md.id = dd.motivo_distruzione_id
GROUP BY md.id, md.nome, md.colore
ORDER BY valore_totale_perdita DESC NULLS LAST;

-- Vista giacenze aggiornate (esclude quelle completamente distrutte)
CREATE VIEW view_giacenze_magazzino_aggiornate AS
SELECT 
    dc.id as carico_id,
    dc.fattura_acquisto_id,
    fa.numero as fattura_numero,
    fa.data as fattura_data,
    f.nome as fornitore_nome,
    
    -- Dettagli articolo
    a.id as articolo_id,
    a.nome_completo as articolo_nome,
    g.nome as gruppo_nome,
    p.nome as prodotto_nome,
    c.nome as colore_nome,
    pr.nome as provenienza_nome,
    fo.nome as foto_nome,
    fo.url as foto_url,
    i.nome as imballo_nome,
    
    -- Quantità aggiornata (dopo distruzioni)
    dc.quantita as quantita_giacenza,
    
    -- Totale distrutto per questa giacenza
    COALESCE(SUM(dd.quantita_distrutta), 0) as quantita_totale_distrutta,
    COALESCE(SUM(dd.valore_perdita), 0) as valore_totale_perdita,
    
    -- Prezzi e valori
    dc.prezzo_acquisto_per_stelo,
    dc.costi_spalmare_per_stelo,
    dc.prezzo_costo_finale_per_stelo,
    dc.prezzo_vendita_1,
    dc.prezzo_vendita_2,
    dc.prezzo_vendita_3,
    
    -- Valori aggiornati
    (dc.quantita * dc.prezzo_acquisto_per_stelo) as valore_giacenza_base,
    (dc.quantita * dc.prezzo_costo_finale_per_stelo) as valore_giacenza_finale,
    
    -- Calcoli valori di vendita potenziali
    (dc.quantita * dc.prezzo_vendita_1) as valore_vendita_1,
    (dc.quantita * dc.prezzo_vendita_2) as valore_vendita_2,
    (dc.quantita * dc.prezzo_vendita_3) as valore_vendita_3,
    
    -- Margini per stelo
    (dc.prezzo_vendita_1 - dc.prezzo_costo_finale_per_stelo) as margine_per_stelo_1,
    (dc.prezzo_vendita_2 - dc.prezzo_costo_finale_per_stelo) as margine_per_stelo_2,
    (dc.prezzo_vendita_3 - dc.prezzo_costo_finale_per_stelo) as margine_per_stelo_3,
    
    -- Percentuali di markup
    ROUND(((dc.prezzo_vendita_1 - dc.prezzo_costo_finale_per_stelo) / dc.prezzo_costo_finale_per_stelo * 100), 2) as markup_percentuale_1,
    ROUND(((dc.prezzo_vendita_2 - dc.prezzo_costo_finale_per_stelo) / dc.prezzo_costo_finale_per_stelo * 100), 2) as markup_percentuale_2,
    ROUND(((dc.prezzo_vendita_3 - dc.prezzo_costo_finale_per_stelo) / dc.prezzo_costo_finale_per_stelo * 100), 2) as markup_percentuale_3,
    
    -- Margini totali per giacenza
    ((dc.prezzo_vendita_1 - dc.prezzo_costo_finale_per_stelo) * dc.quantita) as margine_totale_1,
    ((dc.prezzo_vendita_2 - dc.prezzo_costo_finale_per_stelo) * dc.quantita) as margine_totale_2,
    ((dc.prezzo_vendita_3 - dc.prezzo_costo_finale_per_stelo) * dc.quantita) as margine_totale_3,
    
    -- GIORNI DI GIACENZA
    (CURRENT_DATE - dc.created_at::date) as giorni_giacenza,
    
    -- Metadati
    dc.note,
    dc.created_at as data_carico
    
FROM documenti_carico dc
JOIN fatture_acquisto fa ON dc.fattura_acquisto_id = fa.id
JOIN fornitori f ON fa.fornitore_id = f.id
JOIN articoli a ON dc.articolo_id = a.id
JOIN gruppi g ON a.gruppo_id = g.id
JOIN prodotti p ON a.prodotto_id = p.id
JOIN colori c ON a.colore_id = c.id
JOIN provenienze pr ON a.provenienza_id = pr.id
JOIN foto fo ON a.foto_id = fo.id
JOIN imballaggi i ON a.imballo_id = i.id
LEFT JOIN documenti_distruzione dd ON dc.id = dd.documento_carico_id
WHERE dc.quantita > 0  -- Solo giacenze con quantità positive (dopo distruzioni)
GROUP BY dc.id, fa.numero, fa.data, f.nome, a.id, a.nome_completo, 
         g.nome, p.nome, c.nome, pr.nome, fo.nome, fo.url, i.nome
ORDER BY g.nome ASC, p.nome ASC, c.nome ASC, pr.nome ASC, i.nome ASC;
