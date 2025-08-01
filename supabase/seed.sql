-- =============================================================================
-- DATI DI ESEMPIO - GESTIONALE FIORI - NUOVA STRUTTURA MAGAZZINO
-- =============================================================================

-- Inserimento gruppi
INSERT INTO gruppi (nome, descrizione) VALUES
('Rose', 'Rose di vari tipi e colori'),
('Tulipani', 'Tulipani stagionali'),
('Garofani', 'Garofani standard e spray'),
('Gerbere', 'Gerbere colorate'),
('Girasoli', 'Girasoli standard');

-- Inserimento colori
INSERT INTO colori (nome) VALUES
('Rosso'), ('Bianco'), ('Rosa'), ('Giallo'), 
('Arancione'), ('Viola'), ('Blu'), ('Verde'), 
('Fucsia'), ('Bordeaux'), ('Crema'), ('Misto');

-- Inserimento provenienze
INSERT INTO provenienze (nome) VALUES
('Olanda'), ('Italia'), ('Ecuador'), ('Kenya'), 
('Colombia'), ('Etiopia'), ('Francia'), ('Germania');

-- Inserimento altezze (range tipico per fiori)
INSERT INTO altezze (altezza_cm, descrizione) VALUES
(40, 'Altezza corta - 40cm'),
(50, 'Altezza media-corta - 50cm'),
(60, 'Altezza media - 60cm'),
(70, 'Altezza media-alta - 70cm'),
(80, 'Altezza alta - 80cm'),
(90, 'Altezza molto alta - 90cm'),
(100, 'Altezza extra - 100cm');

-- Inserimento prodotti (ora indipendenti dai gruppi)
INSERT INTO prodotti (nome, descrizione) VALUES
-- Rose
('Rosa Standard', 'Rosa a stelo singolo standard'),
('Rosa Spray', 'Rosa con più fiori per stelo'),
('Rosa Inglese', 'Rosa inglese di qualità premium'),
-- Tulipani  
('Tulipano Singolo', 'Tulipano con fiore singolo'),
('Tulipano Doppio', 'Tulipano con fiore doppio'),
-- Garofani
('Garofano Standard', 'Garofano a stelo singolo'),
('Garofano Spray', 'Garofano con più fiori per stelo'),
-- Gerbere
('Gerbera Standard', 'Gerbera taglia normale'),
('Gerbera Mini', 'Gerbera taglia piccola'),
-- Girasoli
('Girasole Standard', 'Girasole classico');

-- Inserimento foto (placeholder per ora)
INSERT INTO foto (nome, url, descrizione) VALUES
('rose-rosse-default', '/images/varieta/rose-rosse-default.jpg', 'Foto default per rose rosse'),
('rose-bianche-default', '/images/varieta/rose-bianche-default.jpg', 'Foto default per rose bianche'),
('tulipani-default', '/images/varieta/tulipani-default.jpg', 'Foto default per tulipani'),
('garofani-default', '/images/varieta/garofani-default.jpg', 'Foto default per garofani'),
('gerbere-default', '/images/varieta/gerbere-default.jpg', 'Foto default per gerbere'),
('girasoli-default', '/images/varieta/girasoli-default.jpg', 'Foto default per girasoli'),
('fiori-misti', '/images/varieta/fiori-misti.jpg', 'Foto generica per fiori misti');

-- Inserimento imballaggi
INSERT INTO imballaggi (nome, descrizione) VALUES
('Mazzo da 10', 'Mazzo standard da 10 steli'),
('Mazzo da 25', 'Mazzo medio da 25 steli'),
('Cassa da 50', 'Cassa di cartone da 50 steli'),
('Secchio da 100', 'Secchio di plastica da 100 steli'),
('Singolo', 'Vendita a stelo singolo');

-- Inserimento fornitori
INSERT INTO fornitori (nome, ragione_sociale, citta, telefono, email, tipo_fornitore) VALUES
('FloraHolland', 'FloraHolland B.V.', 'Aalsmeer', '+31-297-393939', 'info@floraholland.com', 'fiori'),
('Floricoltura Italiana', 'Floricoltura Italiana S.r.l.', 'Sanremo', '+39-0184-123456', 'vendite@floritalia.it', 'fiori'),
('Kenya Flowers', 'Kenya Flowers Ltd.', 'Nairobi', '+254-20-123456', 'export@kenyaflowers.co.ke', 'fiori'),
('Trasporti Express', 'Express Logistics S.r.l.', 'Milano', '+39-02-987654', 'info@expresslog.it', 'trasportatore'),
('Servizi Vari', 'Servizi Generali S.a.s.', 'Roma', '+39-06-112233', 'contatti@servizigenerali.it', 'servizi');

-- Inserimento tipologie di costo per contabilità analitica
INSERT INTO tipologie_costo (nome, descrizione, colore) VALUES
('Trasporto Aereo', 'Costi di trasporto aereo internazionale', '#FF6B6B'),
('Trasporto Terrestre', 'Costi di trasporto su strada', '#4ECDC4'),
('Commissioni Asta', 'Commissioni pagate all''asta', '#45B7D1'),
('Tasse Doganali', 'Tasse e dazi doganali', '#F9CA24'),
('Assicurazioni', 'Costi di assicurazione trasporto', '#6C5CE7'),
('Imballaggio', 'Costi per materiali di imballaggio', '#A0E7E5'),
('Altro', 'Altri costi vari', '#95AABE');

-- Ora possiamo creare alcuni articoli di esempio
-- ARTICOLO = Gruppo + Prodotto + Colore + Provenienza + Foto + Imballo + Altezza

-- Rose rosse olandesi 70cm in mazzo da 10
INSERT INTO articoli (gruppo_id, prodotto_id, colore_id, provenienza_id, foto_id, imballo_id, altezza_id, qualita_id) VALUES
(1, 1, 1, 1, 1, 1, 4, 1),  -- Rose Standard Rosse Olanda 70cm Mazzo10 - Extra
(1, 1, 2, 1, 2, 1, 4, 1),  -- Rose Standard Bianche Olanda 70cm Mazzo10 - Extra
(1, 1, 3, 1, 1, 2, 4, 2),  -- Rose Standard Rosa Olanda 70cm Cassa50 - Prima
(2, 4, 4, 1, 3, 1, 3, 1),  -- Tulipano Singolo Giallo Olanda 60cm Mazzo10 - Extra
(4, 8, 3, 2, 5, 3, 2, 2);  -- Gerbera Standard Rosa Italia 50cm Secchio100 - Prima

-- Esempio di fatture e documenti di carico
-- Fattura 1: Acquisto da FloraHolland
INSERT INTO fatture_acquisto (numero, data, fornitore_id, totale, note) VALUES
('FH-2025-001', '2025-01-15', 1, 1200.00, 'Acquisto misto rose e tulipani');

-- Costi di trasporto per la fattura
INSERT INTO costi_fattura (fattura_acquisto_id, tipologia_costo_id, fornitore_costo_id, importo, note) VALUES
(1, 1, 4, 150.00, 'Trasporto aereo da Amsterdam'),
(1, 3, 1, 50.00, 'Commissioni asta FloraHolland');

-- Documenti di carico per la fattura
-- Rose rosse 70cm in mazzi da 10
INSERT INTO documenti_carico (fattura_acquisto_id, articolo_id, quantita, prezzo_acquisto_per_stelo, prezzo_vendita_1, prezzo_vendita_2, prezzo_vendita_3, note) VALUES
(1, 1, 100, 1.20, 1.80, 1.92, 2.04, 'Rose rosse olandesi 70cm - 10 mazzi'),
(1, 2, 80, 1.15, 1.75, 1.87, 1.99, 'Rose bianche olandesi 70cm - 8 mazzi'),
(1, 4, 200, 0.80, 1.28, 1.36, 1.44, 'Tulipani gialli olandesi 60cm - 20 mazzi');

-- Fattura 2: Acquisto da fornitore italiano
INSERT INTO fatture_acquisto (numero, data, fornitore_id, totale, note) VALUES
('FI-2025-002', '2025-01-18', 2, 450.00, 'Gerbere italiane');

-- Documento di carico per gerbere
INSERT INTO documenti_carico (fattura_acquisto_id, articolo_id, quantita, prezzo_acquisto_per_stelo, prezzo_vendita_1, prezzo_vendita_2, prezzo_vendita_3, note) VALUES
(2, 5, 100, 0.90, 1.31, 1.40, 1.49, 'Gerbere rosa italiane 50cm - 1 secchio');
