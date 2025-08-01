-- Creazione tabelle per gestione ordini di acquisto

-- Tabella principale ordini di acquisto
CREATE TABLE IF NOT EXISTS ordini_acquisto (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    fornitore_id INTEGER REFERENCES fornitori(id) ON DELETE CASCADE,
    data_ordine TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_consegna_prevista TIMESTAMP WITH TIME ZONE,
    subtotale DECIMAL(10,2) DEFAULT 0,
    iva DECIMAL(5,2) DEFAULT 22,
    totale DECIMAL(10,2) DEFAULT 0,
    stato VARCHAR(20) DEFAULT 'bozza' CHECK (stato IN ('bozza', 'inviato', 'confermato', 'spedito', 'ricevuto', 'annullato')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella prodotti degli ordini di acquisto
CREATE TABLE IF NOT EXISTS ordini_acquisto_prodotti (
    id SERIAL PRIMARY KEY,
    ordine_acquisto_id INTEGER REFERENCES ordini_acquisto(id) ON DELETE CASCADE,
    varieta_id INTEGER REFERENCES varieta(id) ON DELETE CASCADE,
    prezzo_acquisto DECIMAL(8,2) NOT NULL,
    quantita_ordinata INTEGER NOT NULL DEFAULT 0,
    quantita_ricevuta INTEGER DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_ordini_acquisto_fornitore ON ordini_acquisto(fornitore_id);
CREATE INDEX IF NOT EXISTS idx_ordini_acquisto_data ON ordini_acquisto(data_ordine);
CREATE INDEX IF NOT EXISTS idx_ordini_acquisto_stato ON ordini_acquisto(stato);
CREATE INDEX IF NOT EXISTS idx_ordini_acquisto_prodotti_ordine ON ordini_acquisto_prodotti(ordine_acquisto_id);
CREATE INDEX IF NOT EXISTS idx_ordini_acquisto_prodotti_varieta ON ordini_acquisto_prodotti(varieta_id);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ordini_acquisto_updated_at 
    BEFORE UPDATE ON ordini_acquisto 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Commenti sulle tabelle
COMMENT ON TABLE ordini_acquisto IS 'Tabella principale per gestire gli ordini di acquisto';
COMMENT ON TABLE ordini_acquisto_prodotti IS 'Dettagli prodotti per ogni ordine di acquisto';
COMMENT ON COLUMN ordini_acquisto.stato IS 'Stati possibili: bozza, inviato, confermato, spedito, ricevuto, annullato';
COMMENT ON COLUMN ordini_acquisto_prodotti.quantita_ordinata IS 'Quantità ordinata dal fornitore';
COMMENT ON COLUMN ordini_acquisto_prodotti.quantita_ricevuta IS 'Quantità effettivamente ricevuta';
