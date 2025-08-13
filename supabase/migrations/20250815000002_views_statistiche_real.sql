-- Vista realistica basata su tabelle esistenti fatture_vendita, fatture_vendita_righe e documenti_carico

-- View: venduto per articolo con prezzo medio acquisto (derivato da documenti_carico per stesso articolo)
CREATE OR REPLACE VIEW view_venduto_articoli AS
WITH vendite AS (
  SELECT
    fr.articolo_id,
    f.cliente_id,
    f.data_fattura::date AS data,
    SUM(fr.quantita)::numeric AS qta,
    AVG(fr.prezzo_finale)::numeric AS pm_vendita
  FROM fatture_vendita_righe fr
  JOIN fatture_vendita f ON f.id = fr.fattura_id
  WHERE f.stato <> 'annullata'
  GROUP BY fr.articolo_id, f.cliente_id, f.data_fattura::date
), acquisti AS (
  SELECT
    dc.articolo_id,
    AVG(NULLIF(dc.prezzo_costo_finale_per_stelo,0))::numeric AS pm_acquisto
  FROM documenti_carico dc
  GROUP BY dc.articolo_id
)
SELECT 
  v.articolo_id,
  COALESCE(a.nome_completo, '-') AS nome_articolo,
  v.data,
  v.cliente_id,
  a.gruppo_id,
  a.prodotto_id,
  v.qta AS quantita,
  v.pm_vendita AS prezzo_medio_vendita,
  COALESCE(ac.pm_acquisto, 0) AS prezzo_medio_acquisto,
  (v.pm_vendita - COALESCE(ac.pm_acquisto,0)) * v.qta AS ricarico_euro,
  CASE WHEN COALESCE(ac.pm_acquisto,0) = 0 THEN 0
       ELSE ((v.pm_vendita - ac.pm_acquisto) / ac.pm_acquisto) * 100 END AS ricarico_percent
FROM vendite v
LEFT JOIN acquisti ac ON ac.articolo_id = v.articolo_id
LEFT JOIN articoli a ON a.id = v.articolo_id;

-- View: venduto per cliente e articolo
CREATE OR REPLACE VIEW view_venduto_clienti_articoli AS
SELECT
  f.cliente_id,
  c.nome AS cliente_nome,
  fr.articolo_id,
  COALESCE(a.nome_completo, '-') AS articolo_nome,
  f.data_fattura::date AS data,
  SUM(fr.quantita)::numeric AS quantita,
  SUM(fr.prezzo_finale * fr.quantita)::numeric AS valore
FROM fatture_vendita_righe fr
JOIN fatture_vendita f ON f.id = fr.fattura_id
LEFT JOIN clienti c ON c.id = f.cliente_id
LEFT JOIN articoli a ON a.id = fr.articolo_id
WHERE f.stato <> 'annullata'
GROUP BY f.cliente_id, c.nome, fr.articolo_id, a.nome_completo, f.data_fattura::date;

-- View: distruzioni per articolo e periodo
CREATE OR REPLACE VIEW view_distruzioni_articoli AS
SELECT
  dc.articolo_id,
  COALESCE(a.nome_completo,
           CONCAT(
             g.nome,' ', p.nome,' ', c.nome, ' ',
             COALESCE(CASE WHEN al.altezza_cm IS NOT NULL THEN al.altezza_cm::text || 'cm' END, ''),
             CASE WHEN i.nome IS NOT NULL THEN ' - '||i.nome ELSE '' END
           )) AS articolo_nome,
  dd.data_distruzione::date AS data,
  SUM(dd.quantita_distrutta)::numeric AS quantita,
  AVG(NULLIF(dd.prezzo_costo_unitario,0))::numeric AS pm_costo,
  SUM(dd.valore_perdita)::numeric AS costo_totale
FROM documenti_distruzione dd
LEFT JOIN documenti_carico dc ON dc.id = dd.documento_carico_id
LEFT JOIN articoli a ON a.id = dc.articolo_id
LEFT JOIN gruppi g ON g.id = a.gruppo_id
LEFT JOIN prodotti p ON p.id = a.prodotto_id
LEFT JOIN colori c ON c.id = a.colore_id
LEFT JOIN altezze al ON al.id = a.altezza_id
LEFT JOIN imballaggi i ON i.id = a.imballo_id
GROUP BY dc.articolo_id, a.nome_completo, g.nome, p.nome, c.nome, al.altezza_cm, i.nome, dd.data_distruzione::date;


