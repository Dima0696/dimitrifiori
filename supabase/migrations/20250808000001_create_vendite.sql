-- Vendite: ordini cliente, DDT, fatture, note di credito, incassi
-- Schema compatibile con modello attuale (senza toccare tabelle esistenti)
-- Usa numerazioni sequenziali annuali con advisory lock

BEGIN;

-- =========================================================================
-- Progressivi e generatori numerazione
-- =========================================================================

CREATE TABLE IF NOT EXISTS progressivi_ddt_vendita (
  anno integer PRIMARY KEY,
  seq integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS progressivi_fatture_vendita (
  anno integer PRIMARY KEY,
  seq integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS progressivi_note_credito_vendita (
  anno integer PRIMARY KEY,
  seq integer NOT NULL DEFAULT 0
);

-- DDT
CREATE OR REPLACE FUNCTION genera_numero_ddt_vendita()
RETURNS text AS $$
DECLARE
  anno_corrente integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  new_seq integer;
BEGIN
  PERFORM pg_advisory_xact_lock( hashtext('DDT_VENDITA') , anno_corrente );

  INSERT INTO progressivi_ddt_vendita(anno, seq)
  VALUES (anno_corrente, 0)
  ON CONFLICT (anno) DO NOTHING;

  UPDATE progressivi_ddt_vendita
  SET seq = seq + 1
  WHERE anno = anno_corrente
  RETURNING seq INTO new_seq;

  RETURN format('DDT-%s-%04s', anno_corrente, new_seq);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fattura vendita
CREATE OR REPLACE FUNCTION genera_numero_fattura_vendita()
RETURNS text AS $$
DECLARE
  anno_corrente integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  new_seq integer;
BEGIN
  PERFORM pg_advisory_xact_lock( hashtext('FAT_VENDITA') , anno_corrente );

  INSERT INTO progressivi_fatture_vendita(anno, seq)
  VALUES (anno_corrente, 0)
  ON CONFLICT (anno) DO NOTHING;

  UPDATE progressivi_fatture_vendita
  SET seq = seq + 1
  WHERE anno = anno_corrente
  RETURNING seq INTO new_seq;

  RETURN format('FATV-%s-%04s', anno_corrente, new_seq);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota di credito
CREATE OR REPLACE FUNCTION genera_numero_nota_credito_vendita()
RETURNS text AS $$
DECLARE
  anno_corrente integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  new_seq integer;
BEGIN
  PERFORM pg_advisory_xact_lock( hashtext('NC_VENDITA') , anno_corrente );

  INSERT INTO progressivi_note_credito_vendita(anno, seq)
  VALUES (anno_corrente, 0)
  ON CONFLICT (anno) DO NOTHING;

  UPDATE progressivi_note_credito_vendita
  SET seq = seq + 1
  WHERE anno = anno_corrente
  RETURNING seq INTO new_seq;

  RETURN format('NCV-%s-%04s', anno_corrente, new_seq);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- Ordini vendita
-- =========================================================================

CREATE TABLE IF NOT EXISTS ordini_vendita (
  id bigserial PRIMARY KEY,
  numero_ordine text UNIQUE,
  data_ordine date NOT NULL DEFAULT CURRENT_DATE,
  data_consegna_prevista date,
  cliente_id bigint NOT NULL REFERENCES clienti(id) ON UPDATE CASCADE,
  stato text NOT NULL DEFAULT 'bozza' CHECK (stato IN ('bozza','confermato','parz_evaso','evaso','fatturato','annullato')),
  sconto_percentuale numeric(6,2) NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ordini_vendita_righe (
  id bigserial PRIMARY KEY,
  ordine_id bigint NOT NULL REFERENCES ordini_vendita(id) ON DELETE CASCADE,
  articolo_id bigint REFERENCES articoli(id),
  -- Caratteristiche articolo (ridondanza utile per storicizzare)
  gruppo_id bigint,
  prodotto_id bigint,
  colore_id bigint,
  provenienza_id bigint,
  foto_id bigint,
  imballo_id bigint,
  altezza_id bigint,
  qualita_id bigint,
  quantita numeric(12,2) NOT NULL,
  prezzo_unitario numeric(12,4) NOT NULL,
  sconto_percentuale numeric(6,2) NOT NULL DEFAULT 0,
  prezzo_finale numeric(12,4) GENERATED ALWAYS AS (round(prezzo_unitario * (1 - (sconto_percentuale/100.0)), 4)) STORED,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prenotazioni_giacenza (
  id bigserial PRIMARY KEY,
  ordine_riga_id bigint NOT NULL REFERENCES ordini_vendita_righe(id) ON DELETE CASCADE,
  articolo_id bigint REFERENCES articoli(id),
  fonte text NOT NULL CHECK (fonte IN ('reale','virtuale')),
  quantita numeric(12,2) NOT NULL,
  eta date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- DDT vendita
-- =========================================================================

CREATE TABLE IF NOT EXISTS ddt_vendita (
  id bigserial PRIMARY KEY,
  numero_ddt text UNIQUE,
  data_ddt date NOT NULL DEFAULT CURRENT_DATE,
  cliente_id bigint NOT NULL REFERENCES clienti(id) ON UPDATE CASCADE,
  ordine_id bigint REFERENCES ordini_vendita(id) ON UPDATE CASCADE,
  stato text NOT NULL DEFAULT 'da_fatturare' CHECK (stato IN ('da_fatturare','fatturato','annullato')),
  destinazione varchar(255),
  spedizioniere varchar(255),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ddt_vendita_righe (
  id bigserial PRIMARY KEY,
  ddt_id bigint NOT NULL REFERENCES ddt_vendita(id) ON DELETE CASCADE,
  ordine_riga_id bigint REFERENCES ordini_vendita_righe(id) ON UPDATE CASCADE,
  articolo_id bigint REFERENCES articoli(id),
  -- Caratteristiche
  gruppo_id bigint,
  prodotto_id bigint,
  colore_id bigint,
  provenienza_id bigint,
  foto_id bigint,
  imballo_id bigint,
  altezza_id bigint,
  qualita_id bigint,
  quantita numeric(12,2) NOT NULL,
  prezzo_unitario numeric(12,4) NOT NULL,
  prezzo_finale numeric(12,4) NOT NULL,
  note text
);

-- Numerazione automatica DDT
CREATE OR REPLACE FUNCTION bi_ddt_vendita_numero()
RETURNS trigger AS $$
BEGIN
  IF NEW.numero_ddt IS NULL OR NEW.numero_ddt = '' THEN
    NEW.numero_ddt := genera_numero_ddt_vendita();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bi_ddt_vendita_numero ON ddt_vendita;
CREATE TRIGGER bi_ddt_vendita_numero
BEFORE INSERT ON ddt_vendita
FOR EACH ROW EXECUTE FUNCTION bi_ddt_vendita_numero();

-- =========================================================================
-- Fatture vendita
-- =========================================================================

CREATE TABLE IF NOT EXISTS fatture_vendita (
  id bigserial PRIMARY KEY,
  numero_fattura text UNIQUE,
  data_fattura date NOT NULL DEFAULT CURRENT_DATE,
  cliente_id bigint NOT NULL REFERENCES clienti(id) ON UPDATE CASCADE,
  stato text NOT NULL DEFAULT 'non_pagata' CHECK (stato IN ('non_pagata','parzialmente_pagata','pagata','annullata')),
  imponibile numeric(14,2) NOT NULL DEFAULT 0,
  iva numeric(14,2) NOT NULL DEFAULT 0,
  totale numeric(14,2) NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fatture_vendita_righe (
  id bigserial PRIMARY KEY,
  fattura_id bigint NOT NULL REFERENCES fatture_vendita(id) ON DELETE CASCADE,
  ddt_riga_id bigint REFERENCES ddt_vendita_righe(id) ON UPDATE CASCADE,
  articolo_id bigint REFERENCES articoli(id),
  gruppo_id bigint,
  prodotto_id bigint,
  colore_id bigint,
  provenienza_id bigint,
  foto_id bigint,
  imballo_id bigint,
  altezza_id bigint,
  qualita_id bigint,
  quantita numeric(12,2) NOT NULL,
  prezzo_unitario numeric(12,4) NOT NULL,
  sconto_percentuale numeric(6,2) NOT NULL DEFAULT 0,
  prezzo_finale numeric(12,4) NOT NULL,
  iva_percentuale numeric(5,2) NOT NULL DEFAULT 0
);

-- Numerazione automatica Fattura
CREATE OR REPLACE FUNCTION bi_fatture_vendita_numero()
RETURNS trigger AS $$
BEGIN
  IF NEW.numero_fattura IS NULL OR NEW.numero_fattura = '' THEN
    NEW.numero_fattura := genera_numero_fattura_vendita();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bi_fatture_vendita_numero ON fatture_vendita;
CREATE TRIGGER bi_fatture_vendita_numero
BEFORE INSERT ON fatture_vendita
FOR EACH ROW EXECUTE FUNCTION bi_fatture_vendita_numero();

-- =========================================================================
-- Note di credito
-- =========================================================================

CREATE TABLE IF NOT EXISTS note_credito_vendita (
  id bigserial PRIMARY KEY,
  numero_nota text UNIQUE,
  data_nota date NOT NULL DEFAULT CURRENT_DATE,
  cliente_id bigint NOT NULL REFERENCES clienti(id) ON UPDATE CASCADE,
  fattura_origine_id bigint REFERENCES fatture_vendita(id) ON UPDATE CASCADE,
  stato text NOT NULL DEFAULT 'aperta' CHECK (stato IN ('aperta','compensata','annullata')),
  totale numeric(14,2) NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS note_credito_vendita_righe (
  id bigserial PRIMARY KEY,
  nota_id bigint NOT NULL REFERENCES note_credito_vendita(id) ON DELETE CASCADE,
  fattura_riga_id bigint REFERENCES fatture_vendita_righe(id) ON UPDATE CASCADE,
  articolo_id bigint REFERENCES articoli(id),
  quantita numeric(12,2) NOT NULL,
  prezzo_unitario numeric(12,4) NOT NULL,
  iva_percentuale numeric(5,2) NOT NULL DEFAULT 0
);

-- Numerazione automatica NC
CREATE OR REPLACE FUNCTION bi_note_credito_vendita_numero()
RETURNS trigger AS $$
BEGIN
  IF NEW.numero_nota IS NULL OR NEW.numero_nota = '' THEN
    NEW.numero_nota := genera_numero_nota_credito_vendita();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bi_note_credito_vendita_numero ON note_credito_vendita;
CREATE TRIGGER bi_note_credito_vendita_numero
BEFORE INSERT ON note_credito_vendita
FOR EACH ROW EXECUTE FUNCTION bi_note_credito_vendita_numero();

-- =========================================================================
-- Incassi
-- =========================================================================

CREATE TABLE IF NOT EXISTS pagamenti_vendita (
  id bigserial PRIMARY KEY,
  fattura_id bigint NOT NULL REFERENCES fatture_vendita(id) ON DELETE CASCADE,
  data_pagamento date NOT NULL DEFAULT CURRENT_DATE,
  importo numeric(14,2) NOT NULL,
  metodo text NOT NULL CHECK (metodo IN ('contanti','bonifico','pos','altro')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================================================
-- Viste di consultazione
-- =========================================================================

CREATE OR REPLACE VIEW view_ordini_vendita_completi AS
SELECT o.*, c.nome AS cliente_nome
FROM ordini_vendita o
LEFT JOIN clienti c ON c.id = o.cliente_id;

CREATE OR REPLACE VIEW view_ddt_vendita_completi AS
SELECT d.*, c.nome AS cliente_nome, o.numero_ordine
FROM ddt_vendita d
LEFT JOIN clienti c ON c.id = d.cliente_id
LEFT JOIN ordini_vendita o ON o.id = d.ordine_id;

CREATE OR REPLACE VIEW view_fatture_vendita_completi AS
SELECT f.*, c.nome AS cliente_nome
FROM fatture_vendita f
LEFT JOIN clienti c ON c.id = f.cliente_id;

CREATE OR REPLACE VIEW view_scadenziario_clienti AS
SELECT f.id AS fattura_id,
       f.numero_fattura,
       f.data_fattura,
       f.cliente_id,
       c.nome AS cliente_nome,
       f.totale,
       COALESCE((SELECT SUM(p.importo) FROM pagamenti_vendita p WHERE p.fattura_id = f.id), 0) AS incassato,
       (f.totale - COALESCE((SELECT SUM(p.importo) FROM pagamenti_vendita p WHERE p.fattura_id = f.id), 0)) AS residuo
FROM fatture_vendita f
LEFT JOIN clienti c ON c.id = f.cliente_id;

-- =========================================================================
-- RPC operative (essenziali, senza side-effect su movimenti per compatibilità)
-- =========================================================================

-- Genera fattura vendita da DDT (copia testata + righe). I movimenti saranno gestiti dall'app.
CREATE OR REPLACE FUNCTION genera_fattura_vendita_da_ddt(p_ddt_id bigint)
RETURNS TABLE (fattura_id bigint, numero_fattura text) AS $$
DECLARE
  d ddt_vendita;
  f_id bigint;
BEGIN
  SELECT * INTO d FROM ddt_vendita WHERE id = p_ddt_id;
  IF d.id IS NULL THEN
    RAISE EXCEPTION 'DDT % non trovato', p_ddt_id;
  END IF;

  INSERT INTO fatture_vendita (numero_fattura, data_fattura, cliente_id, imponibile, iva, totale, note)
  VALUES (NULL, CURRENT_DATE, d.cliente_id, 0, 0, 0, d.note)
  RETURNING id, numero_fattura INTO f_id, numero_fattura;

  INSERT INTO fatture_vendita_righe (fattura_id, ddt_riga_id, articolo_id, gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id, quantita, prezzo_unitario, sconto_percentuale, prezzo_finale, iva_percentuale)
  SELECT f_id, r.id, r.articolo_id, r.gruppo_id, r.prodotto_id, r.colore_id, r.provenienza_id, r.foto_id, r.imballo_id, r.altezza_id, r.qualita_id,
         r.quantita, r.prezzo_unitario, 0, r.prezzo_finale, 0
  FROM ddt_vendita_righe r
  WHERE r.ddt_id = d.id;

  -- Calcolo importi base (imponibile = somma prezzo_finale * qta; no IVA)
  UPDATE fatture_vendita f
  SET imponibile = sub.imp,
      iva = 0,
      totale = sub.imp
  FROM (
    SELECT SUM(quantita * prezzo_finale)::numeric(14,2) AS imp FROM fatture_vendita_righe WHERE fattura_id = f_id
  ) sub
  WHERE f.id = f_id;

  -- Marca DDT come fatturato
  UPDATE ddt_vendita SET stato = 'fatturato' WHERE id = d.id;

  RETURN QUERY SELECT f_id, (SELECT numero_fattura FROM fatture_vendita WHERE id = f_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Elimina fattura vendita con controlli (incassi / note di credito)
CREATE OR REPLACE FUNCTION elimina_fattura_vendita_completa(p_fattura_id bigint)
RETURNS void AS $$
DECLARE
  cnt_incassi integer;
  cnt_nc integer;
BEGIN
  SELECT COUNT(*) INTO cnt_incassi FROM pagamenti_vendita WHERE fattura_id = p_fattura_id;
  IF cnt_incassi > 0 THEN
    RAISE EXCEPTION 'Impossibile eliminare: presenti % pagamenti collegati', cnt_incassi USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO cnt_nc FROM note_credito_vendita WHERE fattura_origine_id = p_fattura_id;
  IF cnt_nc > 0 THEN
    RAISE EXCEPTION 'Impossibile eliminare: presenti % note di credito collegate', cnt_nc USING ERRCODE = 'P0001';
  END IF;

  -- Cancella righe e testata
  DELETE FROM fatture_vendita_righe WHERE fattura_id = p_fattura_id;
  DELETE FROM fatture_vendita WHERE id = p_fattura_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants per ruoli standard
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ordini_vendita, ordini_vendita_righe, prenotazioni_giacenza TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ddt_vendita, ddt_vendita_righe TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON fatture_vendita, fatture_vendita_righe, note_credito_vendita, note_credito_vendita_righe TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pagamenti_vendita TO anon, authenticated;
GRANT EXECUTE ON FUNCTION genera_fattura_vendita_da_ddt(bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION elimina_fattura_vendita_completa(bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION genera_numero_ddt_vendita() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION genera_numero_fattura_vendita() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION genera_numero_nota_credito_vendita() TO anon, authenticated;

COMMIT;


