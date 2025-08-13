-- Pagamenti fornitori (fatture passive) e registro di cassa

CREATE TABLE IF NOT EXISTS pagamenti_fornitori (
  id bigserial PRIMARY KEY,
  fattura_acquisto_id bigint NOT NULL REFERENCES fatture_acquisto(id) ON DELETE CASCADE,
  data_pagamento date NOT NULL DEFAULT CURRENT_DATE,
  importo numeric(14,2) NOT NULL,
  metodo text NOT NULL CHECK (metodo IN ('contanti','bonifico','pos','assegno','paypal','altro')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pag_forn_fattura ON pagamenti_fornitori(fattura_acquisto_id);
CREATE INDEX IF NOT EXISTS idx_pag_forn_data ON pagamenti_fornitori(data_pagamento);

-- Registro cassa (entrate/uscite)
CREATE TABLE IF NOT EXISTS registro_cassa (
  id bigserial PRIMARY KEY,
  data_operazione date NOT NULL DEFAULT CURRENT_DATE,
  causale text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrata','uscita')),
  importo numeric(14,2) NOT NULL,
  metodo text NOT NULL CHECK (metodo IN ('contanti','bonifico','pos','assegno','paypal','altro')),
  riferimento_tipo text, -- 'fattura_vendita' | 'fattura_acquisto' | ...
  riferimento_id bigint,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cassa_data ON registro_cassa(data_operazione);
CREATE INDEX IF NOT EXISTS idx_cassa_tipo ON registro_cassa(tipo);


