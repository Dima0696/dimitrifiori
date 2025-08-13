-- VIEWS per Statistiche (venduto per articolo e clienti)
-- Nota: adattare i nomi colonne/tabelle reali

CREATE OR REPLACE VIEW view_venduto_articoli AS
SELECT
  fr.articolo_id,
  a.nome AS nome_articolo,
  f.data::date AS data,
  f.cliente_id,
  a.gruppo_id,
  a.prodotto_id,
  SUM(fr.quantita) AS quantita,
  AVG(fr.prezzo_finale) AS prezzo_medio_vendita,
  AVG(NULLIF(fr.prezzo_acquisto, 0)) AS prezzo_medio_acquisto,
  (AVG(fr.prezzo_finale) - AVG(NULLIF(fr.prezzo_acquisto, 0))) * SUM(fr.quantita) AS ricarico_euro,
  CASE WHEN AVG(NULLIF(fr.prezzo_acquisto,0)) IS NULL OR AVG(NULLIF(fr.prezzo_acquisto,0))=0
       THEN 0
       ELSE ((AVG(fr.prezzo_finale) - AVG(fr.prezzo_acquisto)) / AVG(fr.prezzo_acquisto)) * 100
  END AS ricarico_percent
FROM fatture_vendita_righe fr
JOIN fatture_vendita f ON f.id = fr.fattura_id
LEFT JOIN articoli a ON a.id = fr.articolo_id
WHERE f.stato <> 'annullata'
GROUP BY fr.articolo_id, a.nome, f.data::date, f.cliente_id, a.gruppo_id, a.prodotto_id;

CREATE OR REPLACE VIEW view_venduto_clienti_articoli AS
SELECT
  f.cliente_id,
  c.nome AS cliente_nome,
  fr.articolo_id,
  COALESCE(a.nome, '-') AS articolo_nome,
  f.data::date AS data,
  SUM(fr.quantita) AS quantita,
  SUM(fr.prezzo_finale * fr.quantita) AS valore
FROM fatture_vendita_righe fr
JOIN fatture_vendita f ON f.id = fr.fattura_id
LEFT JOIN clienti c ON c.id = f.cliente_id
LEFT JOIN articoli a ON a.id = fr.articolo_id
WHERE f.stato <> 'annullata'
GROUP BY f.cliente_id, c.nome, fr.articolo_id, a.nome, f.data::date;


