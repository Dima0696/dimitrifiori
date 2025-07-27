-- Schema Database Gestionale Fiori
-- Database SQLite locale per semplificare la gestione

-- Tabella Gruppi
CREATE TABLE IF NOT EXISTS gruppi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    descrizione TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Prodotti
CREATE TABLE IF NOT EXISTS prodotti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    gruppo_id INTEGER,
    descrizione TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gruppo_id) REFERENCES gruppi(id)
);

-- Tabella Varietà
CREATE TABLE IF NOT EXISTS varieta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    prodotto_id INTEGER,
    colore_id INTEGER,
    altezza_id INTEGER,
    qualita_id INTEGER,
    provenienza_id INTEGER,
    prezzo_acquisto DECIMAL(10,2) DEFAULT 0,
    prezzo_vendita DECIMAL(10,2) DEFAULT 0,
    percentuale_vendita DECIMAL(5,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prodotto_id) REFERENCES prodotti(id),
    FOREIGN KEY (colore_id) REFERENCES colori(id),
    FOREIGN KEY (altezza_id) REFERENCES altezze(id),
    FOREIGN KEY (qualita_id) REFERENCES qualita(id),
    FOREIGN KEY (provenienza_id) REFERENCES provenienze(id)
);

-- Tabella Giacenze
CREATE TABLE IF NOT EXISTS giacenze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    varieta_id INTEGER,
    quantita INTEGER DEFAULT 0,
    data_acquisto DATE,
    imballo INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (varieta_id) REFERENCES varieta(id)
);

-- Tabella Colori
CREATE TABLE IF NOT EXISTS colori (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Altezze
CREATE TABLE IF NOT EXISTS altezze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Qualità
CREATE TABLE IF NOT EXISTS qualita (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Provenienze
CREATE TABLE IF NOT EXISTS provenienze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Clienti
CREATE TABLE IF NOT EXISTS clienti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT,
    email TEXT,
    telefono TEXT,
    indirizzo TEXT,
    citta TEXT,
    cap TEXT,
    partita_iva TEXT,
    codice_fiscale TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Fornitori
CREATE TABLE IF NOT EXISTS fornitori (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    indirizzo TEXT,
    citta TEXT,
    cap TEXT,
    partita_iva TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Fatture (unificata per vendita e acquisto)
CREATE TABLE IF NOT EXISTS fatture (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('vendita', 'acquisto')) NOT NULL,
    cliente_id INTEGER,
    fornitore_id INTEGER,
    data DATE NOT NULL,
    totale DECIMAL(10,2) DEFAULT 0,
    stato TEXT CHECK(stato IN ('bozza', 'emessa', 'pagata', 'annullata')) DEFAULT 'bozza',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clienti(id),
    FOREIGN KEY (fornitore_id) REFERENCES fornitori(id)
);

-- Tabella Dettagli Fattura
CREATE TABLE IF NOT EXISTS dettagli_fattura (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fattura_id INTEGER NOT NULL,
    varieta_id INTEGER NOT NULL,
    quantita INTEGER NOT NULL,
    prezzo_unitario DECIMAL(10,2) NOT NULL,
    totale DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fattura_id) REFERENCES fatture(id),
    FOREIGN KEY (varieta_id) REFERENCES varieta(id)
);

-- Tabella Eventi (per calendario)
CREATE TABLE IF NOT EXISTS eventi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titolo TEXT NOT NULL,
    descrizione TEXT,
    data_inizio DATETIME NOT NULL,
    data_fine DATETIME,
    tipo TEXT DEFAULT 'generico',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_varieta_prodotto ON varieta(prodotto_id);
CREATE INDEX IF NOT EXISTS idx_giacenze_varieta ON giacenze(varieta_id);
CREATE INDEX IF NOT EXISTS idx_fatture_tipo ON fatture(tipo);
CREATE INDEX IF NOT EXISTS idx_fatture_data ON fatture(data);
CREATE INDEX IF NOT EXISTS idx_dettagli_fattura_fattura ON dettagli_fattura(fattura_id);
CREATE INDEX IF NOT EXISTS idx_eventi_data ON eventi(data_inizio);

-- Trigger per aggiornare updated_at
CREATE TRIGGER IF NOT EXISTS update_gruppi_timestamp 
    AFTER UPDATE ON gruppi
    BEGIN
        UPDATE gruppi SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_prodotti_timestamp 
    AFTER UPDATE ON prodotti
    BEGIN
        UPDATE prodotti SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_varieta_timestamp 
    AFTER UPDATE ON varieta
    BEGIN
        UPDATE varieta SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_giacenze_timestamp 
    AFTER UPDATE ON giacenze
    BEGIN
        UPDATE giacenze SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_clienti_timestamp 
    AFTER UPDATE ON clienti
    BEGIN
        UPDATE clienti SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_fornitori_timestamp 
    AFTER UPDATE ON fornitori
    BEGIN
        UPDATE fornitori SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_fatture_timestamp 
    AFTER UPDATE ON fatture
    BEGIN
        UPDATE fatture SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_eventi_timestamp 
    AFTER UPDATE ON eventi
    BEGIN
        UPDATE eventi SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END; 