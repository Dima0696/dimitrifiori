-- =========================================================================
-- MIGRATION: Creazione tabella movimenti_magazzino
-- Data: 31/07/2025
-- Descrizione: Tabella per tracciare tutti i movimenti di magazzino
-- =========================================================================

-- Creazione tabella movimenti_magazzino
CREATE TABLE IF NOT EXISTS movimenti_magazzino (
    id SERIAL PRIMARY KEY,
    
    -- Tipo di movimento
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('carico', 'scarico', 'distruzione', 'inventario', 'trasferimento')),
    
    -- Data e quantità
    data DATE NOT NULL,
    quantita INTEGER NOT NULL,
    prezzo_unitario DECIMAL(10,4),
    valore_totale DECIMAL(12,2),
    
    -- Riferimenti alle caratteristiche dell'articolo (FK opzionali)
    gruppo_id INTEGER REFERENCES gruppi(id),
    prodotto_id INTEGER REFERENCES prodotti(id),
    colore_id INTEGER REFERENCES colori(id),
    provenienza_id INTEGER REFERENCES provenienze(id),
    foto_id INTEGER REFERENCES foto(id),
    imballo_id INTEGER REFERENCES imballaggi(id),
    altezza_id INTEGER REFERENCES altezze(id),
    qualita_id INTEGER REFERENCES qualita(id),
    
    -- Documenti di riferimento
    fattura_id INTEGER,
    fattura_numero VARCHAR(50),
    fornitore_id INTEGER REFERENCES fornitori(id),
    cliente_id INTEGER REFERENCES clienti(id),
    
    -- Metadati
    note TEXT,
    utente VARCHAR(100),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_movimenti_tipo ON movimenti_magazzino(tipo);
CREATE INDEX IF NOT EXISTS idx_movimenti_data ON movimenti_magazzino(data);
CREATE INDEX IF NOT EXISTS idx_movimenti_gruppo ON movimenti_magazzino(gruppo_id);
CREATE INDEX IF NOT EXISTS idx_movimenti_prodotto ON movimenti_magazzino(prodotto_id);
CREATE INDEX IF NOT EXISTS idx_movimenti_colore ON movimenti_magazzino(colore_id);
CREATE INDEX IF NOT EXISTS idx_movimenti_fattura ON movimenti_magazzino(fattura_id);
CREATE INDEX IF NOT EXISTS idx_movimenti_fornitore ON movimenti_magazzino(fornitore_id);
CREATE INDEX IF NOT EXISTS idx_movimenti_cliente ON movimenti_magazzino(cliente_id);
CREATE INDEX IF NOT EXISTS idx_movimenti_created ON movimenti_magazzino(created_at);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_movimenti_magazzino_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_movimenti_magazzino_updated_at
    BEFORE UPDATE ON movimenti_magazzino
    FOR EACH ROW
    EXECUTE FUNCTION update_movimenti_magazzino_updated_at();

-- Inserimento dati di esempio per test
INSERT INTO movimenti_magazzino (
    tipo, data, quantita, prezzo_unitario, valore_totale,
    gruppo_id, prodotto_id, colore_id, altezza_id,
    fattura_numero, fornitore_id,
    note, utente
) VALUES 
-- Carichi di esempio
('carico', '2024-01-15', 100, 0.85, 85.00, 1, 1, 1, 1, 'FAT001', 1, 'Carico da fattura acquisto', 'Admin'),
('carico', '2024-01-20', 200, 0.90, 180.00, 1, 1, 2, 1, 'FAT002', 1, 'Carico rose rosse', 'Admin'),
('carico', '2024-01-22', 150, 1.20, 180.00, 2, 2, 3, 2, 'FAT003', 2, 'Carico tulipani', 'Admin'),

-- Scarichi di esempio  
('scarico', '2024-01-16', 50, 1.20, 60.00, 1, 1, 1, 1, NULL, NULL, 'Vendita al dettaglio', 'Admin'),
('scarico', '2024-01-18', 80, 1.15, 92.00, 1, 1, 2, 1, NULL, NULL, 'Vendita matrimonio', 'Admin'),
('scarico', '2024-01-25', 30, 1.50, 45.00, 2, 2, 3, 2, NULL, NULL, 'Vendita evento', 'Admin'),

-- Distruzioni di esempio
('distruzione', '2024-01-17', 10, NULL, NULL, 1, 1, 1, 1, NULL, NULL, 'Fiori deteriorati', 'Admin'),
('distruzione', '2024-01-24', 15, NULL, NULL, 1, 1, 2, 1, NULL, NULL, 'Qualità scadente', 'Admin'),

-- Inventari di esempio
('inventario', '2024-01-31', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Inventario di fine mese', 'Admin')

ON CONFLICT DO NOTHING;

-- Commento finale
COMMENT ON TABLE movimenti_magazzino IS 'Tabella per tracciare tutti i movimenti di magazzino: carichi, scarichi, distruzioni, inventari e trasferimenti';
COMMENT ON COLUMN movimenti_magazzino.tipo IS 'Tipo di movimento: carico, scarico, distruzione, inventario, trasferimento';
COMMENT ON COLUMN movimenti_magazzino.valore_totale IS 'Valore calcolato come quantita * prezzo_unitario, NULL per distruzioni e inventari';
COMMENT ON COLUMN movimenti_magazzino.fattura_numero IS 'Numero fattura di riferimento per movimenti da documenti';
