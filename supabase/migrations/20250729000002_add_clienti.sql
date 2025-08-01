-- Aggiunge la tabella clienti
CREATE TABLE clienti (
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
  
  -- Tipologia cliente per statistiche
  tipo_cliente VARCHAR(50) DEFAULT 'privato' CHECK (tipo_cliente IN (
    'privato',         -- Cliente privato
    'fiorista',        -- Negozio di fiori
    'wedding',         -- Wedding planner
    'hotel',           -- Hotel/ristoranti
    'azienda',         -- Aziende
    'altro'            -- Altri tipi
  )),
  
  -- Note e preferenze
  note TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_clienti_updated_at 
    BEFORE UPDATE ON clienti 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
