-- Aggiunge il campo codice_colore alla tabella colori
ALTER TABLE colori ADD COLUMN codice_colore VARCHAR(7) DEFAULT '#9e9e9e';

-- Aggiorna i colori esistenti con alcuni valori predefiniti se esistono
UPDATE colori SET codice_colore = '#f44336' WHERE LOWER(nome) = 'rosso';
UPDATE colori SET codice_colore = '#2196f3' WHERE LOWER(nome) = 'blu';
UPDATE colori SET codice_colore = '#4caf50' WHERE LOWER(nome) = 'verde';
UPDATE colori SET codice_colore = '#ffeb3b' WHERE LOWER(nome) = 'giallo';
UPDATE colori SET codice_colore = '#e91e63' WHERE LOWER(nome) = 'rosa';
UPDATE colori SET codice_colore = '#ffffff' WHERE LOWER(nome) = 'bianco';
UPDATE colori SET codice_colore = '#000000' WHERE LOWER(nome) = 'nero';
UPDATE colori SET codice_colore = '#9c27b0' WHERE LOWER(nome) = 'viola';
UPDATE colori SET codice_colore = '#ff9800' WHERE LOWER(nome) = 'arancione';
UPDATE colori SET codice_colore = '#795548' WHERE LOWER(nome) = 'marrone';
