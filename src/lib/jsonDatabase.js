const fs = require('fs');
const path = require('path');

// Configurazione database JSON
const DB_PATH = path.join(process.cwd(), 'database', 'gestionale_fiori.json');

class JSONDatabase {
  constructor() {
    this.db = this.loadDatabase();
    console.log('🔗 Database JSON connesso:', DB_PATH);
  }

  loadDatabase() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Errore caricamento database:', error);
    }

    // Database vuoto di default
    const defaultDb = {
      gruppi: [],
      prodotti: [],
      varieta: [],
      giacenze: [],
      colori: [],
      altezze: [],
      qualita: [],
      provenienze: [],
      clienti: [],
      fornitori: [],
      fatture: [],
      dettagli_fattura: [],
      eventi: []
    };

    // Inizializza con dati di esempio se vuoto
    const initializedDb = this.initializeSampleData(defaultDb);
    
    // Salva il database inizializzato
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(initializedDb, null, 2));
    } catch (error) {
      console.error('❌ Errore salvataggio database iniziale:', error);
    }
    
    return initializedDb;
  }

  saveDatabase() {
    try {
      // Verifica che this.db esista
      if (!this.db) {
        console.error('❌ Errore: database non inizializzato');
        return;
      }
      
      // Crea la directory se non esiste
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(DB_PATH, JSON.stringify(this.db, null, 2));
    } catch (error) {
      console.error('❌ Errore salvataggio database:', error);
    }
  }

  initializeSampleData(db) {
    // Inserisci colori
    if (db.colori.length === 0) {
      db.colori = [
        { id: 1, nome: 'Rosso' },
        { id: 2, nome: 'Bianco' },
        { id: 3, nome: 'Giallo' },
        { id: 4, nome: 'Rosa' },
        { id: 5, nome: 'Viola' },
        { id: 6, nome: 'Arancione' }
      ];
    }

    // Inserisci altezze
    if (db.altezze.length === 0) {
      db.altezze = [
        { id: 1, nome: '20-30cm' },
        { id: 2, nome: '30-40cm' },
        { id: 3, nome: '40-50cm' },
        { id: 4, nome: '50-60cm' },
        { id: 5, nome: '60-70cm' }
      ];
    }

    // Inserisci qualità
    if (db.qualita.length === 0) {
      db.qualita = [
        { id: 1, nome: 'A' },
        { id: 2, nome: 'B' },
        { id: 3, nome: 'C' },
        { id: 4, nome: 'Premium' }
      ];
    }

    // Inserisci provenienze
    if (db.provenienze.length === 0) {
      db.provenienze = [
        { id: 1, nome: 'Italia' },
        { id: 2, nome: 'Olanda' },
        { id: 3, nome: 'Ecuador' },
        { id: 4, nome: 'Colombia' },
        { id: 5, nome: 'Kenya' }
      ];
    }

    // Inserisci gruppi
    if (db.gruppi.length === 0) {
      db.gruppi = [
        { id: 1, nome: 'Rose', descrizione: 'Rose di vari colori e dimensioni' },
        { id: 2, nome: 'Tulipani', descrizione: 'Tulipani primaverili' },
        { id: 3, nome: 'Girasoli', descrizione: 'Girasoli estivi' },
        { id: 4, nome: 'Orchidee', descrizione: 'Orchidee esotiche' }
      ];
    }

    console.log('✅ Dati di esempio inizializzati');
    return db;
  }

  getNextId(collection) {
    const items = this.db[collection];
    if (items.length === 0) return 1;
    return Math.max(...items.map(item => item.id)) + 1;
  }

  // === OPERAZIONI GRUPPI ===
  getAllGruppi() {
    return this.db.gruppi;
  }

  getGruppoById(id) {
    return this.db.gruppi.find(g => g.id === id);
  }

  createGruppo(nome, descrizione) {
    const gruppo = {
      id: this.getNextId('gruppi'),
      nome,
      descrizione,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.gruppi.push(gruppo);
    this.saveDatabase();
    return gruppo;
  }

  // === OPERAZIONI PRODOTTI ===
  getAllProdotti() {
    return this.db.prodotti.map(p => ({
      ...p,
      gruppo_nome: this.getGruppoById(p.gruppo_id)?.nome
    }));
  }

  createProdotto(nome, gruppo_id, descrizione) {
    const prodotto = {
      id: this.getNextId('prodotti'),
      nome,
      gruppo_id,
      descrizione,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.prodotti.push(prodotto);
    this.saveDatabase();
    return prodotto;
  }

  // === OPERAZIONI VARIETÀ ===
  getAllVarieta() {
    return this.db.varieta.map(v => ({
      ...v,
      prodotto_nome: this.db.prodotti.find(p => p.id === v.prodotto_id)?.nome,
      gruppo_nome: this.getGruppoById(
        this.db.prodotti.find(p => p.id === v.prodotto_id)?.gruppo_id
      )?.nome,
      colore_nome: this.db.colori.find(c => c.id === v.colore_id)?.nome,
      altezza_nome: this.db.altezze.find(a => a.id === v.altezza_id)?.nome,
      qualita_nome: this.db.qualita.find(q => q.id === v.qualita_id)?.nome,
      provenienza_nome: this.db.provenienze.find(p => p.id === v.provenienza_id)?.nome
    }));
  }

  getVarietaWithGiacenza() {
    return this.getAllVarieta().map(v => ({
      ...v,
      giacenza: this.db.giacenze.find(g => g.varieta_id === v.id) || { quantita: 0 }
    }));
  }

  createVarieta(data) {
    const varieta = {
      id: this.getNextId('varieta'),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.varieta.push(varieta);
    this.saveDatabase();
    return varieta;
  }

  // === OPERAZIONI GIACENZE ===
  getAllGiacenze() {
    return this.db.giacenze.map(g => ({
      ...g,
      varieta_nome: this.db.varieta.find(v => v.id === g.varieta_id)?.nome,
      prodotto_nome: this.db.prodotti.find(p => p.id === 
        this.db.varieta.find(v => v.id === g.varieta_id)?.prodotto_id
      )?.nome,
      gruppo_nome: this.getGruppoById(
        this.db.prodotti.find(p => p.id === 
          this.db.varieta.find(v => v.id === g.varieta_id)?.prodotto_id
        )?.gruppo_id
      )?.nome
    }));
  }

  getGiacenzaById(id) {
    const giacenza = this.db.giacenze.find(g => g.id === id);
    if (!giacenza) return null;
    
    return {
      ...giacenza,
      varieta_nome: this.db.varieta.find(v => v.id === giacenza.varieta_id)?.nome,
      prodotto_nome: this.db.prodotti.find(p => p.id === 
        this.db.varieta.find(v => v.id === giacenza.varieta_id)?.prodotto_id
      )?.nome,
      gruppo_nome: this.getGruppoById(
        this.db.prodotti.find(p => p.id === 
          this.db.varieta.find(v => v.id === giacenza.varieta_id)?.prodotto_id
        )?.gruppo_id
      )?.nome
    };
  }

  createGiacenza(data) {
    const giacenza = {
      id: this.getNextId('giacenze'),
      varieta_id: data.varieta_id,
      quantita: data.quantita || 0,
      prezzo_acquisto: data.prezzo_acquisto || 0,
      percentuale_vendita: data.percentuale_vendita || 60,
      data_acquisto: data.data_acquisto || new Date().toISOString(),
      imballo: data.imballo || 1,
      note: data.note || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.giacenze.push(giacenza);
    this.saveDatabase();
    return this.getGiacenzaById(giacenza.id);
  }

  updateGiacenzaById(id, data) {
    const giacenza = this.db.giacenze.find(g => g.id === id);
    if (!giacenza) return null;

    // Aggiorna solo i campi forniti
    if (data.varieta_id !== undefined) giacenza.varieta_id = data.varieta_id;
    if (data.quantita !== undefined) giacenza.quantita = data.quantita;
    if (data.prezzo_acquisto !== undefined) giacenza.prezzo_acquisto = data.prezzo_acquisto;
    if (data.percentuale_vendita !== undefined) giacenza.percentuale_vendita = data.percentuale_vendita;
    if (data.data_acquisto !== undefined) giacenza.data_acquisto = data.data_acquisto;
    if (data.imballo !== undefined) giacenza.imballo = data.imballo;
    if (data.note !== undefined) giacenza.note = data.note;
    
    giacenza.updated_at = new Date().toISOString();
    this.saveDatabase();
    return this.getGiacenzaById(id);
  }

  deleteGiacenza(id) {
    const index = this.db.giacenze.findIndex(g => g.id === id);
    if (index === -1) return false;
    
    this.db.giacenze.splice(index, 1);
    this.saveDatabase();
    return true;
  }

  updateGiacenza(varietaId, quantita, dataAcquisto, imballo) {
    let giacenza = this.db.giacenze.find(g => g.varieta_id === varietaId);
    
    if (!giacenza) {
      giacenza = {
        id: this.getNextId('giacenze'),
        varieta_id: varietaId,
        quantita: 0,
        data_acquisto: null,
        imballo: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.db.giacenze.push(giacenza);
    }

    giacenza.quantita = quantita;
    if (dataAcquisto) giacenza.data_acquisto = dataAcquisto;
    if (imballo) giacenza.imballo = imballo;
    giacenza.updated_at = new Date().toISOString();

    this.saveDatabase();
    return giacenza;
  }

  // === OPERAZIONI CLIENTI ===
  getAllClienti() {
    return this.db.clienti;
  }

  createCliente(data) {
    const cliente = {
      id: this.getNextId('clienti'),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.clienti.push(cliente);
    this.saveDatabase();
    return cliente;
  }

  // === OPERAZIONI FORNITORI ===
  getAllFornitori() {
    return this.db.fornitori;
  }

  createFornitore(data) {
    const fornitore = {
      id: this.getNextId('fornitori'),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.fornitori.push(fornitore);
    this.saveDatabase();
    return fornitore;
  }

  // === OPERAZIONI FATTURE ===
  getAllFatture() {
    return this.db.fatture.map(f => ({
      ...f,
      cliente_nome: this.db.clienti.find(c => c.id === f.cliente_id)?.nome,
      cliente_cognome: this.db.clienti.find(c => c.id === f.cliente_id)?.cognome,
      fornitore_nome: this.db.fornitori.find(fo => fo.id === f.fornitore_id)?.nome
    }));
  }

  getFattureByTipo(tipo) {
    return this.getAllFatture().filter(f => f.tipo === tipo);
  }

  createFattura(data) {
    const fattura = {
      id: this.getNextId('fatture'),
      ...data,
      stato: data.stato || 'bozza',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.fatture.push(fattura);
    this.saveDatabase();
    return fattura;
  }

  // === OPERAZIONI DETTAGLI FATTURA ===
  getDettagliFattura(fatturaId) {
    return this.db.dettagli_fattura
      .filter(d => d.fattura_id === fatturaId)
      .map(d => ({
        ...d,
        varieta_nome: this.db.varieta.find(v => v.id === d.varieta_id)?.nome,
        prodotto_nome: this.db.prodotti.find(p => p.id === 
          this.db.varieta.find(v => v.id === d.varieta_id)?.prodotto_id
        )?.nome,
        gruppo_nome: this.getGruppoById(
          this.db.prodotti.find(p => p.id === 
            this.db.varieta.find(v => v.id === d.varieta_id)?.prodotto_id
          )?.gruppo_id
        )?.nome
      }));
  }

  createDettaglioFattura(data) {
    const dettaglio = {
      id: this.getNextId('dettagli_fattura'),
      ...data,
      created_at: new Date().toISOString()
    };
    this.db.dettagli_fattura.push(dettaglio);
    this.saveDatabase();
    return dettaglio;
  }

  // === OPERAZIONI EVENTI ===
  getAllEventi() {
    return this.db.eventi;
  }

  createEvento(data) {
    const evento = {
      id: this.getNextId('eventi'),
      ...data,
      tipo: data.tipo || 'generico',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.db.eventi.push(evento);
    this.saveDatabase();
    return evento;
  }

  // === OPERAZIONI UTILITY ===
  getStatisticheFatture() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const fattureMese = this.db.fatture.filter(f => {
      const data = new Date(f.data);
      return data.getMonth() + 1 === currentMonth && data.getFullYear() === currentYear;
    });

    const vendite = fattureMese.filter(f => f.tipo === 'vendita');
    const acquisti = fattureMese.filter(f => f.tipo === 'acquisto');

    const totaleVendite = vendite.reduce((sum, f) => sum + f.totale, 0);
    const totaleAcquisti = acquisti.reduce((sum, f) => sum + f.totale, 0);
    const margine = totaleVendite - totaleAcquisti;

    return {
      vendite: {
        count: vendite.length,
        totale: totaleVendite,
        mese: currentMonth
      },
      acquisti: {
        count: acquisti.length,
        totale: totaleAcquisti,
        mese: currentMonth
      },
      margine: {
        totale: margine,
        mese: currentMonth
      }
    };
  }

  // Backup del database
  backup() {
    const backupPath = DB_PATH.replace('.json', `_backup_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(this.db, null, 2));
    console.log('💾 Backup creato:', backupPath);
    return backupPath;
  }

  // Ripristina da backup
  restore(backupPath) {
    try {
      const data = fs.readFileSync(backupPath, 'utf8');
      this.db = JSON.parse(data);
      this.saveDatabase();
      console.log('🔄 Database ripristinato da:', backupPath);
      return true;
    } catch (error) {
      console.error('❌ Errore ripristino:', error);
      return false;
    }
  }
}

// Esporta un'istanza singleton
module.exports = { jsonDatabase: new JSONDatabase() }; 