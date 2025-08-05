-- Migrazione per correggere la numerazione degli ordini acquisto
-- Problema: la funzione genera_numero_ordine() usa MAX(id) invece di contare gli ordini dell'anno

-- 1. Elimina la funzione esistente
DROP FUNCTION IF EXISTS genera_numero_ordine();

-- 2. Crea la nuova funzione corretta
CREATE OR REPLACE FUNCTION genera_numero_ordine()
RETURNS VARCHAR(50) AS $$
DECLARE
    nuovo_numero VARCHAR(50);
    anno_corrente VARCHAR(4);
    prossimo_contatore INTEGER;
BEGIN
    -- Ottieni l'anno corrente
    anno_corrente := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Conta gli ordini dell'anno corrente e aggiungi 1
    SELECT COALESCE(COUNT(*), 0) + 1 INTO prossimo_contatore 
    FROM ordini_acquisto 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Genera numero formato: ORD-2025-0001
    nuovo_numero := 'ORD-' || anno_corrente || '-' || LPAD(prossimo_contatore::VARCHAR, 4, '0');
    
    RETURN nuovo_numero;
END;
$$ LANGUAGE plpgsql;

-- 3. Verifica che il trigger esista ancora (dovrebbe essere già presente)
-- Il trigger trigger_set_numero_ordine dovrebbe già essere attivo 