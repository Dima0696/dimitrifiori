const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'database', 'gestionale_fiori.json');

const now = new Date().toISOString();

const sampleData = {
  gruppi: [
    { id: 1, nome: 'Rose', descrizione: 'Rose di vari colori', created_at: now, updated_at: now }
  ],
  prodotti: [
    { id: 1, nome: 'Rosa Rossa', gruppo_id: 1, descrizione: 'Rosa rossa classica', created_at: now, updated_at: now }
  ],
  varieta: [
    // Cambiano solo caratteristiche fisiche
    { id: 1, nome: 'Rosa Rossa', prodotto_id: 1, colore_id: 1, altezza_id: 3, qualita_id: 1, provenienza_id: 1, imballo: 10, prezzo_acquisto: 2.50, prezzo_vendita: 4.00, percentuale_vendita: 60, created_at: now, updated_at: now },
    { id: 2, nome: 'Rosa Rossa', prodotto_id: 1, colore_id: 1, altezza_id: 4, qualita_id: 2, provenienza_id: 2, imballo: 20, prezzo_acquisto: 2.80, prezzo_vendita: 4.50, percentuale_vendita: 61, created_at: now, updated_at: now },
    { id: 3, nome: 'Rosa Rossa', prodotto_id: 1, colore_id: 2, altezza_id: 3, qualita_id: 1, provenienza_id: 1, imballo: 10, prezzo_acquisto: 2.60, prezzo_vendita: 4.20, percentuale_vendita: 62, created_at: now, updated_at: now }
  ],
  giacenze: [
    { id: 1, varieta_id: 1, quantita: 50, data_acquisto: '2024-01-15', imballo: 10, created_at: now, updated_at: now },
    { id: 2, varieta_id: 2, quantita: 30, data_acquisto: '2024-01-15', imballo: 20, created_at: now, updated_at: now },
    { id: 3, varieta_id: 3, quantita: 20, data_acquisto: '2024-01-15', imballo: 10, created_at: now, updated_at: now }
  ],
  colori: [
    { id: 1, nome: 'Rosso' },
    { id: 2, nome: 'Bianco' }
  ],
  altezze: [
    { id: 3, nome: '40-50cm' },
    { id: 4, nome: '50-60cm' }
  ],
  qualita: [
    { id: 1, nome: 'A' },
    { id: 2, nome: 'B' }
  ],
  provenienze: [
    { id: 1, nome: 'Italia' },
    { id: 2, nome: 'Olanda' }
  ],
  clienti: [
    { id: 1, nome: 'Mario', cognome: 'Rossi', email: 'mario.rossi@email.com', telefono: '3331234567', indirizzo: 'Via Roma 123', citta: 'Milano', cap: '20100', partita_iva: '12345678901', codice_fiscale: 'RSSMRA80A01H501U', created_at: now, updated_at: now }
  ],
  fornitori: [
    { id: 1, nome: 'Fornitore Italia', email: 'info@fornitoreitalia.it', telefono: '0261234567', indirizzo: 'Via Fornitori 1', citta: 'Milano', cap: '20100', partita_iva: 'IT12345678901', created_at: now, updated_at: now }
  ],
  fatture: [
    { id: 1, numero: 'FAT-2024-001', tipo: 'vendita', cliente_id: 1, data: '2024-01-20', totale: 40.00, stato: 'pagata', note: 'Vendita rosa rossa', created_at: now, updated_at: now }
  ],
  dettagli_fattura: [
    { id: 1, fattura_id: 1, varieta_id: 1, quantita: 10, prezzo_unitario: 4.00, totale: 40.00, created_at: now }
  ],
  eventi: [
    { id: 1, titolo: 'Consegna Rose', descrizione: 'Consegna rose rosse a Mario', data_inizio: '2024-01-25', tipo: 'consegna', created_at: now, updated_at: now }
  ]
};

function saveDatabase() {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(sampleData, null, 2));
    console.log('✅ Database popolato con successo!');
    console.log('📁 File salvato in:', DB_PATH);
  } catch (error) {
    console.error('❌ Errore nel salvataggio del database:', error);
  }
}

saveDatabase(); 