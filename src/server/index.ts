import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { parseString as parseXML } from 'xml2js';
import { Readable } from 'stream';
import { intelligentParser } from './intelligent-parser';
import { lombardaCSVParser } from './csv-lombarda-parser';

const app = express();
const PORT = 3001;

// Configurazione multer per upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Formati supportati per l'importazione
    const supportedTypes = [
      'application/pdf',                    // PDF
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'application/vnd.ms-excel',           // XLS
      'text/csv',                           // CSV
      'application/csv',                    // CSV (alternative)
      'text/xml',                           // XML
      'application/xml',                    // XML (alternative)
      'text/plain'                          // TXT/ASC
    ];
    
    if (supportedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Formato file non supportato: ${file.mimetype}. Supportati: PDF, Excel, CSV, XML, TXT/ASC`));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Configurazione multer per immagini
const imageUpload = multer({
  storage: multer.memoryStorage(), // Usa memory storage per le immagini
  fileFilter: (req, file, cb) => {
    // Formati supportati per le immagini
    const supportedImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (supportedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Formato immagine non supportato: ${file.mimetype}. Supportati: JPG, PNG, GIF, WEBP`));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max per le immagini
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Percorso del database JSON
const dbPath = path.join(__dirname, 'database', 'gestionale_fiori.json');

// Funzione per leggere il database
function readDatabase() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    return parsed;
  } catch (error) {
    console.error('Errore lettura database:', error);
    return {
      varieta: [],
      prodotti: [],
      gruppi: [],
      fornitori: [],
      clienti: [],
      fatture: [],
      dettagli_fattura: [],
      giacenze: [],
      movimenti_magazzino: [],
      eventi: [],
      ordini_vendita: [],
      ordini_acquisto: []
    };
  }
}

// Funzione per ricalcolare le giacenze dai movimenti
function ricalcolaGiacenze(db: any) {
  console.log('🔄 Ricalcolo giacenze dai movimenti...');
  
  // Raggruppa i movimenti per varietà E fattura (per gestire prezzi diversi)
  const movimentiPerLotto: { [key: string]: any[] } = {};
  
  db.movimenti_magazzino.forEach((movimento: any) => {
    // Crea una chiave unica per varietà + fattura + prezzo + imballo per gestire lotti separati
    const chiaveLotto = `${movimento.varieta_id}_${movimento.fattura_id || 'no_fattura'}_${movimento.prezzo_unitario || 0}_${movimento.imballo || 1}`;
    
    if (!movimentiPerLotto[chiaveLotto]) {
      movimentiPerLotto[chiaveLotto] = [];
    }
    movimentiPerLotto[chiaveLotto].push(movimento);
  });
  
  // Calcola giacenza per ogni lotto (varietà + fattura + prezzo)
  const nuoveGiacenze: any[] = [];
  
  Object.keys(movimentiPerLotto).forEach(chiaveLotto => {
    const [varietaIdStr, fatturaIdStr, prezzoStr, imballoStr] = chiaveLotto.split('_');
    const varietaId = parseInt(varietaIdStr);
    const fatturaId = fatturaIdStr === 'no_fattura' ? null : parseInt(fatturaIdStr);
    const prezzoAcquisto = parseFloat(prezzoStr);
    const imballo = parseInt(imballoStr) || 1;
    const movimenti = movimentiPerLotto[chiaveLotto];
    
    let quantita = 0;
    let data_acquisto = null;
    let fornitore_id = null;
    
    // Ordina movimenti per data
    movimenti.sort((a: any, b: any) => new Date(a.data || a.created_at).getTime() - new Date(b.data || b.created_at).getTime());
    
    movimenti.forEach((movimento: any) => {
      if (movimento.tipo === 'carico') {
        quantita += movimento.quantita;
        data_acquisto = movimento.data || movimento.created_at;
        if (movimento.fornitore_id) {
          fornitore_id = movimento.fornitore_id;
        }
      } else if (movimento.tipo === 'scarico' || movimento.tipo === 'distruzione') {
        quantita = Math.max(0, quantita - movimento.quantita);
      }
    });
    
    // Crea giacenza solo se c'è quantità positiva
    if (quantita > 0) {
      // Calcola prezzo di vendita con markup del 60%
      const prezzo_vendita = Math.round((prezzoAcquisto * 1.6) * 100) / 100;
      
      // Cerca se esiste già una giacenza per questo lotto specifico (includendo imballo)
      const giacenzeEsistenti = db.giacenze.filter((g: any) => 
        g.varieta_id === varietaId && 
        g.fattura_id === fatturaId && 
        Math.abs(g.prezzo_acquisto - prezzoAcquisto) < 0.01 && // Tolleranza per arrotondamenti
        g.imballo === imballo // Deve avere lo stesso imballo
      );
      
      // Se esiste già una giacenza per questo lotto specifico, usala
      const giacenzaEsistente = giacenzeEsistenti.length > 0 ? giacenzeEsistenti[0] : null;
      
      if (giacenzaEsistente) {
        // Aggiorna la giacenza esistente per questo lotto
        giacenzaEsistente.quantita = quantita;
        giacenzaEsistente.prezzo_vendita = prezzo_vendita;
        giacenzaEsistente.data_acquisto = data_acquisto;
        giacenzaEsistente.fornitore_id = fornitore_id;
        giacenzaEsistente.imballo = imballo;
        giacenzaEsistente.updated_at = new Date().toISOString();
        
        nuoveGiacenze.push(giacenzaEsistente);
        console.log(`📝 Giacenza esistente aggiornata per lotto ${chiaveLotto}: ${quantita} pezzi a €${prezzoAcquisto}`);
      } else {
        // Crea nuova giacenza per questo lotto
        const nuovaGiacenza = {
          id: Math.floor(Date.now() + Math.random()), // ID univoco
          varieta_id: varietaId,
          quantita: quantita,
          prezzo_acquisto: prezzoAcquisto,
          prezzo_vendita: prezzo_vendita,
          data_acquisto: data_acquisto,
          fattura_id: fatturaId,
          fornitore_id: fornitore_id,
          imballo: imballo,
          note: `Lotto da fattura ${fatturaId || 'manuale'}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        nuoveGiacenze.push(nuovaGiacenza);
        console.log(`🆕 Nuova giacenza creata per lotto ${chiaveLotto}: ${quantita} pezzi a €${prezzoAcquisto}`);
      }
    }
  });
  
  // Rimuovi le giacenze duplicate prima di aggiungere quelle nuove
  const giacenzeUniche = nuoveGiacenze.reduce((acc: any, giacenza: any) => {
    const chiave = `${giacenza.varieta_id}_${giacenza.fattura_id}_${giacenza.prezzo_acquisto}_${giacenza.imballo}`;
    if (!acc[chiave]) {
      acc[chiave] = giacenza;
    } else {
      // Se esiste già, mantieni quella più recente (ID più alto)
      const esistente = acc[chiave];
      if (giacenza.id > esistente.id) {
        acc[chiave] = giacenza;
      }
    }
    return acc;
  }, {} as any);
  
  // Sostituisci le giacenze con quelle uniche
  db.giacenze = Object.values(giacenzeUniche);
  
  console.log(`📊 Giacenze ricalcolate: ${nuoveGiacenze.length} lotti con giacenza > 0`);
  
  return db;
}

// Funzione per scrivere il database
function writeDatabase(data: any) {
  try {
    // Salva direttamente senza ricalcolare le giacenze per evitare loop
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Errore scrittura database:', error);
    return false;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check richiesto');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint per verificare giacenze e movimenti
app.get('/api/debug/giacenze', (req, res) => {
  const db = readDatabase();
  
  const debug = {
    giacenze: db.giacenze.length,
    movimenti: db.movimenti_magazzino.length,
    dettagli_fattura: db.dettagli_fattura.length,
    fatture: db.fatture.length,
    varieta: db.varieta.length,
    ultimi_movimenti: db.movimenti_magazzino.slice(-5).map((m: any) => ({
      id: m.id,
      tipo: m.tipo,
      varieta_id: m.varieta_id,
      quantita: m.quantita,
      fattura_id: m.fattura_id,
      data: m.data
    })),
    ultime_giacenze: db.giacenze.slice(-5).map((g: any) => ({
      id: g.id,
      varieta_id: g.varieta_id,
      quantita: g.quantita,
      prezzo_acquisto: g.prezzo_acquisto,
      fattura_id: g.fattura_id
    })),
    fatture_acquisto: db.fatture.filter((f: any) => f.tipo === 'acquisto').slice(-3)
  };
  
  console.log('🔍 Debug giacenze richiesto:', debug);
  res.json(debug);
});

// Endpoint per forzare il ricalcolo delle giacenze
app.post('/api/debug/ricalcola-giacenze', (req, res) => {
  console.log('🔄 Forzando ricalcolo giacenze...');
  const db = readDatabase();
  const dbAggiornato = ricalcolaGiacenze(db);
  writeDatabase(dbAggiornato);
  
  res.json({
    message: 'Giacenze ricalcolate',
    prima: db.giacenze.length,
    dopo: dbAggiornato.giacenze.length,
    movimenti: dbAggiornato.movimenti_magazzino.length
  });
});

// Endpoint per visualizzare le giacenze duplicate
app.get('/api/debug/giacenze-duplicate', (req, res) => {
  try {
    const db = readDatabase();
    
    // Trova giacenze duplicate
    const duplicate = db.giacenze.reduce((acc, giacenza) => {
      const chiave = `${giacenza.varieta_id}_${giacenza.fattura_id}_${giacenza.prezzo_acquisto}`;
      if (!acc[chiave]) {
        acc[chiave] = [giacenza];
      } else {
        acc[chiave].push(giacenza);
      }
      return acc;
    }, {} as any);
    
    const duplicateOnly = Object.entries(duplicate)
      .filter(([_, giacenze]) => (giacenze as any[]).length > 1)
      .map(([chiave, giacenze]) => ({
        chiave,
        giacenze: giacenze as any[]
      }));
    
    res.json({
      totale_giacenze: db.giacenze.length,
      duplicate_trovate: duplicateOnly.length,
      duplicate: duplicateOnly
    });
  } catch (error) {
    console.error('Errore ricerca giacenze duplicate:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint per pulire le giacenze duplicate
app.post('/api/debug/pulisci-giacenze-duplicate', (req, res) => {
  try {
    console.log('🧹 Pulizia giacenze duplicate...');
    const db = readDatabase();
    
    // Raggruppa giacenze per chiave unica (varietà + fattura + prezzo)
    const giacenzeUniche = db.giacenze.reduce((acc, giacenza) => {
      const chiave = `${giacenza.varieta_id}_${giacenza.fattura_id}_${giacenza.prezzo_acquisto}`;
      if (!acc[chiave]) {
        acc[chiave] = giacenza;
      } else {
        // Se esiste già, mantieni quella con ID più basso (più vecchia)
        if (giacenza.id < acc[chiave].id) {
          acc[chiave] = giacenza;
        }
      }
      return acc;
    }, {} as any);
    
    const giacenzeOriginali = db.giacenze.length;
    db.giacenze = Object.values(giacenzeUniche);
    const giacenzeDopo = db.giacenze.length;
    const duplicateRimosse = giacenzeOriginali - giacenzeDopo;
    
    writeDatabase(db);
    
    console.log(`✅ Pulizia completata: ${duplicateRimosse} giacenze duplicate rimosse`);
    
    res.json({ 
      message: `Pulizia completata: ${duplicateRimosse} giacenze duplicate rimosse`,
      prima: giacenzeOriginali,
      dopo: giacenzeDopo,
      rimosse: duplicateRimosse
    });
  } catch (error) {
    console.error('❌ Errore pulizia giacenze duplicate:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint per visualizzare riepilogo struttura dati
app.get('/api/debug/struttura', (req, res) => {
  const db = readDatabase();
  
  const struttura = {
    gruppi: {
      totale: db.gruppi.length,
      lista: db.gruppi.map((g: any) => ({
        id: g.id,
        nome: g.nome,
        prodotti_count: db.prodotti.filter((p: any) => p.gruppo_id === g.id).length
      }))
    },
    prodotti: {
      totale: db.prodotti.length,
      lista: db.prodotti.map((p: any) => {
        const gruppo = db.gruppi.find((g: any) => g.id === p.gruppo_id);
        return {
          id: p.id,
          nome: p.nome,
          gruppo_nome: gruppo ? gruppo.nome : 'N/A',
          varieta_count: db.varieta.filter((v: any) => v.prodotto_id === p.id).length
        };
      })
    },
    varieta: {
      totale: db.varieta.length,
      lista: db.varieta.slice(-10).map((v: any) => {
        const prodotto = db.prodotti.find((p: any) => p.id === v.prodotto_id);
        const gruppo = prodotto ? db.gruppi.find((g: any) => g.id === prodotto.gruppo_id) : null;
        return {
          id: v.id,
          nome: v.nome,
          prodotto_nome: prodotto ? prodotto.nome : 'N/A',
          gruppo_nome: gruppo ? gruppo.nome : 'N/A'
        };
      })
    }
  };
  
  console.log('📊 Struttura database richiesta:', {
    gruppi: struttura.gruppi.totale,
    prodotti: struttura.prodotti.totale,
    varieta: struttura.varieta.totale
  });
  
  res.json(struttura);
});

// Endpoint per diagnosticare importazioni recenti
app.get('/api/debug/importazioni-recenti', (req, res) => {
  const db = readDatabase();
  
  // Trova le ultime 3 fatture di acquisto
  const fattureAcquisto = db.fatture
    .filter((f: any) => f.tipo === 'acquisto')
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
    
  const diagnostico = fattureAcquisto.map((fattura: any) => {
    const dettagli = db.dettagli_fattura.filter((d: any) => d.fattura_id === fattura.id);
    const movimenti = db.movimenti_magazzino.filter((m: any) => m.fattura_id === fattura.id);
    const giacenzeRelated = db.giacenze.filter((g: any) => g.fattura_id === fattura.id);
    
    return {
      fattura: {
        id: fattura.id,
        numero: fattura.numero,
        data: fattura.data,
        fornitore_id: fattura.fornitore_id,
        totale: fattura.totale
      },
      dettagli: dettagli.length,
      movimenti: movimenti.length,
      giacenze: giacenzeRelated.length,
      dettaglio_movimenti: movimenti.map((m: any) => ({
        tipo: m.tipo,
        varieta_id: m.varieta_id,
        quantita: m.quantita,
        data: m.data
      })),
      dettaglio_giacenze: giacenzeRelated.map((g: any) => ({
        varieta_id: g.varieta_id,
        quantita: g.quantita,
        data_acquisto: g.data_acquisto
      }))
    };
  });
  
  console.log('🔍 Diagnostico importazioni:', diagnostico);
  res.json({
    totale_fatture_acquisto: fattureAcquisto.length,
    totale_giacenze: db.giacenze.length,
    totale_movimenti: db.movimenti_magazzino.length,
    diagnostico: diagnostico
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint richiesto');
  res.json({ message: 'Test endpoint funziona' });
});

// === API GRUPPI ===
app.get('/api/gruppi', (req, res) => {
  const db = readDatabase();
  const includeZero = req.query.include_zero === 'true';
  
  let gruppi = db.gruppi || [];
  
  // Filtra solo gruppi che hanno prodotti con varietà con giacenza > 0
  if (!includeZero) {
    gruppi = gruppi.filter((gruppo: any) => {
      const prodottiGruppo = db.prodotti.filter((p: any) => p.gruppo_id === gruppo.id);
      return prodottiGruppo.some((prodotto: any) => {
        const varietaProdotto = db.varieta.filter((v: any) => v.prodotto_id === prodotto.id);
        return varietaProdotto.some((varieta: any) => {
          const giacenza = db.giacenze.find((g: any) => g.varieta_id === varieta.id);
          return giacenza && giacenza.quantita > 0;
        });
      });
    });
  }
  
  res.json(gruppi);
});

app.post('/api/gruppi', (req, res) => {
  const db = readDatabase();
  const nuovoGruppo = {
    id: Date.now().toString(),
    nome: req.body.nome,
    descrizione: req.body.descrizione || '',
    created_at: new Date().toISOString()
  };
  db.gruppi.push(nuovoGruppo);
  writeDatabase(db);
  res.json(nuovoGruppo);
});

app.put('/api/gruppi/:id', (req, res) => {
  const db = readDatabase();
  const index = db.gruppi.findIndex((g: any) => g.id === req.params.id);
  if (index !== -1) {
    db.gruppi[index] = { ...db.gruppi[index], ...req.body };
    writeDatabase(db);
    res.json(db.gruppi[index]);
  } else {
    res.status(404).json({ error: 'Gruppo non trovato' });
  }
});

app.delete('/api/gruppi/:id', (req, res) => {
  const db = readDatabase();
  const index = db.gruppi.findIndex((g: any) => g.id === req.params.id);
  if (index !== -1) {
    db.gruppi.splice(index, 1);
    writeDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Gruppo non trovato' });
  }
});

// === API PRODOTTI ===
app.get('/api/prodotti', (req, res) => {
  const db = readDatabase();
  const includeZero = req.query.include_zero === 'true';
  
  let prodotti = db.prodotti || [];
  
  // Filtra solo prodotti che hanno varietà con giacenza > 0
  if (!includeZero) {
    prodotti = prodotti.filter((prodotto: any) => {
      const varietaProdotto = db.varieta.filter((v: any) => v.prodotto_id === prodotto.id);
      return varietaProdotto.some((varieta: any) => {
        const giacenza = db.giacenze.find((g: any) => g.varieta_id === varieta.id);
        return giacenza && giacenza.quantita > 0;
      });
    });
  }
  
  res.json(prodotti);
});

app.post('/api/prodotti', (req, res) => {
  const db = readDatabase();
  const nuovoProdotto = {
    id: Date.now().toString(),
    nome: req.body.nome,
    gruppo_id: req.body.gruppo_id,
    descrizione: req.body.descrizione || '',
    created_at: new Date().toISOString()
  };
  db.prodotti.push(nuovoProdotto);
  writeDatabase(db);
  res.json(nuovoProdotto);
});

app.put('/api/prodotti/:id', (req, res) => {
  const db = readDatabase();
  const index = db.prodotti.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    db.prodotti[index] = { ...db.prodotti[index], ...req.body };
    writeDatabase(db);
    res.json(db.prodotti[index]);
  } else {
    res.status(404).json({ error: 'Prodotto non trovato' });
  }
});

app.delete('/api/prodotti/:id', (req, res) => {
  const db = readDatabase();
  const index = db.prodotti.findIndex((p: any) => p.id === req.params.id);
  if (index !== -1) {
    db.prodotti.splice(index, 1);
    writeDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Prodotto non trovato' });
  }
});

// === API VARIETA ===
app.get('/api/varieta', (req, res) => {
  const db = readDatabase();
  const includeZero = req.query.include_zero === 'true';
  
  // Arricchisci le varietà con i nomi di prodotti e gruppi
  let varietaArricchite = (db.varieta || []).map((varieta: any) => {
    const prodotto = db.prodotti.find((p: any) => p.id === varieta.prodotto_id);
    const gruppo = prodotto ? db.gruppi.find((g: any) => g.id === prodotto.gruppo_id) : null;
    const giacenza = db.giacenze.find((g: any) => g.varieta_id === varieta.id);
    
    return {
      ...varieta,
      varieta_nome: varieta.nome,
      prodotto_nome: prodotto ? prodotto.nome : 'Prodotto non trovato',
      gruppo_nome: gruppo ? gruppo.nome : 'Gruppo non trovato',
      giacenza_attuale: giacenza ? giacenza.quantita : 0,
      prezzo_vendita: giacenza ? giacenza.prezzo_vendita : 0,
      imballo: giacenza ? giacenza.imballo : 1
    };
  });
  
  // Filtra per giacenza > 0 se non esplicitamente richiesto altrimenti
  if (!includeZero) {
    varietaArricchite = varietaArricchite.filter((v: any) => v.giacenza_attuale > 0);
  }
  
  res.json(varietaArricchite);
});

app.get('/api/varieta/giacenza', (req, res) => {
  const db = readDatabase();
  const varietaConGiacenza = db.varieta.map((v: any) => {
    const giacenza = db.giacenze.find((g: any) => g.varieta_id === v.id);
    return {
      ...v,
      giacenza_attuale: giacenza ? giacenza.quantita : 0,
      prezzo_acquisto: giacenza ? giacenza.prezzo_acquisto : 0
    };
  });
  res.json(varietaConGiacenza);
});

app.post('/api/varieta', (req, res) => {
  const db = readDatabase();
  let prodotto_id = req.body.prodotto_id;
  
  // Se non viene specificato un prodotto_id, crea automaticamente gruppo e prodotto
  if (!prodotto_id && req.body.nome) {
    console.log(`🏷️ Creazione automatica gruppo e prodotto per varietà: ${req.body.nome}`);
    
    // Estrai informazioni dal nome della varietà
    const nomeVarieta = req.body.nome;
    const paroleChiave = nomeVarieta.split(' ');
    
    // Determina il nome del gruppo e prodotto
    let nomeGruppo = 'Fiori Generici';
    let nomeProdotto = nomeVarieta;
    
    // Logica intelligente per determinare il gruppo
    if (nomeVarieta.toLowerCase().includes('rose') || nomeVarieta.toLowerCase().includes('rosa')) {
      nomeGruppo = 'Rose';
      nomeProdotto = nomeVarieta;
    } else if (nomeVarieta.toLowerCase().includes('tulip')) {
      nomeGruppo = 'Tulipani';
      nomeProdotto = nomeVarieta;
    } else if (nomeVarieta.toLowerCase().includes('girasol')) {
      nomeGruppo = 'Girasoli';
      nomeProdotto = nomeVarieta;
    } else if (nomeVarieta.toLowerCase().includes('orchid')) {
      nomeGruppo = 'Orchidee';
      nomeProdotto = nomeVarieta;
    } else if (nomeVarieta.toLowerCase().includes('peon')) {
      nomeGruppo = 'Peonie';
      nomeProdotto = nomeVarieta;
    } else if (paroleChiave.length > 1) {
      // Usa la prima parola come gruppo se ci sono più parole
      nomeGruppo = paroleChiave[0];
      nomeProdotto = nomeVarieta;
    }
    
    // 1. Trova o crea il gruppo
    let gruppo = db.gruppi.find((g: any) => g.nome.toLowerCase() === nomeGruppo.toLowerCase());
    if (!gruppo) {
      gruppo = {
        id: Math.floor(Date.now() + Math.random()),
        nome: nomeGruppo,
        descrizione: `Gruppo ${nomeGruppo} creato automaticamente`,
        created_at: new Date().toISOString()
      };
      db.gruppi.push(gruppo);
      console.log(`📁 Gruppo creato: ${nomeGruppo} (ID: ${gruppo.id})`);
    } else {
      console.log(`📁 Gruppo esistente trovato: ${nomeGruppo} (ID: ${gruppo.id})`);
    }
    
    // 2. Trova o crea il prodotto
    let prodotto = db.prodotti.find((p: any) => 
      p.nome.toLowerCase() === nomeProdotto.toLowerCase() && p.gruppo_id === gruppo.id
    );
    if (!prodotto) {
      prodotto = {
        id: Math.floor(Date.now() + Math.random() + 1),
        nome: nomeProdotto,
        gruppo_id: gruppo.id,
        descrizione: `Prodotto ${nomeProdotto} del gruppo ${nomeGruppo}`,
        created_at: new Date().toISOString()
      };
      db.prodotti.push(prodotto);
      console.log(`📦 Prodotto creato: ${nomeProdotto} (ID: ${prodotto.id})`);
    } else {
      console.log(`📦 Prodotto esistente trovato: ${nomeProdotto} (ID: ${prodotto.id})`);
    }
    
    prodotto_id = prodotto.id;
  }
  
  const nuovaVarieta = {
    id: Math.floor(Date.now() + Math.random() + 2),
    nome: req.body.nome,
    prodotto_id: prodotto_id,
    colore_id: req.body.colore_id,
    altezza_id: req.body.altezza_id,
    qualita_id: req.body.qualita_id,
    provenienza_id: req.body.provenienza_id,
    prezzo_acquisto: req.body.prezzo_acquisto || 0,
    prezzo_vendita: req.body.prezzo_vendita || 0,
    percentuale_vendita: req.body.percentuale_vendita || 0,
    created_at: new Date().toISOString()
  };
  db.varieta.push(nuovaVarieta);
  writeDatabase(db);
  
  console.log(`🌱 Varietà creata: ${req.body.nome} (ID: ${nuovaVarieta.id}) - Prodotto ID: ${prodotto_id}`);
  res.json(nuovaVarieta);
});

// === API GIACENZE ===
app.get('/api/giacenze', (req, res) => {
  const db = readDatabase();
  const giacenze = db.giacenze || [];
  
  console.log(`🔍 GET /api/giacenze - Trovate ${giacenze.length} giacenze nel database`);
  
  // Arricchisci le giacenze con i dati correlati
  const giacenzeArricchite = giacenze.map((giacenza: any) => {
    // Trova la varietà
    const varieta = db.varieta.find((v: any) => v.id === giacenza.varieta_id);
    
    // Trova il prodotto dalla varietà
    const prodotto = varieta && varieta.prodotto_id ? db.prodotti.find((p: any) => p.id === varieta.prodotto_id) : null;
    
    // Trova il gruppo dal prodotto
    const gruppo = prodotto && prodotto.gruppo_id ? db.gruppi.find((g: any) => g.id === prodotto.gruppo_id) : null;
    
    // Trova la fattura
    const fattura = giacenza.fattura_id ? db.fatture.find((f: any) => f.id === giacenza.fattura_id) : null;
    
    // Se la fattura non esiste, prova a trovare il fornitore dai movimenti
    let fornitore = null;
    if (fattura && fattura.fornitore_id) {
      fornitore = db.fornitori.find((f: any) => f.id === fattura.fornitore_id);
    } else if (giacenza.fattura_id) {
      // Se la fattura è stata cancellata, cerca il fornitore nei movimenti
      const movimento = db.movimenti_magazzino.find((m: any) => 
        m.fattura_id === giacenza.fattura_id && 
        m.varieta_id === giacenza.varieta_id &&
        m.tipo === 'carico'
      );
      if (movimento && movimento.fornitore_id) {
        fornitore = db.fornitori.find((f: any) => f.id === movimento.fornitore_id);
      }
    }
    
    // Calcola giorni di giacenza
    const dataAcquisto = new Date(giacenza.data_acquisto);
    const oggi = new Date();
    const giorniGiacenza = Math.floor((oggi.getTime() - dataAcquisto.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcola valore totale
    const valoreTotale = giacenza.quantita * (giacenza.prezzo_acquisto || 0);
    
    return {
      ...giacenza,
      varieta_nome: varieta ? varieta.nome : '',
      prodotto_nome: prodotto ? prodotto.nome : '',
      gruppo_nome: gruppo ? gruppo.nome : '',
      fattura_numero: fattura ? fattura.numero : (giacenza.fattura_id ? `FATTURA-${giacenza.fattura_id}` : ''),
      fornitore_nome: fornitore ? fornitore.nome : '',
      giorni_giacenza: giorniGiacenza,
      valore_totale: valoreTotale
    };
  });
  
  console.log(`📤 Invio ${giacenzeArricchite.length} giacenze arricchite al frontend`);
  res.json(giacenzeArricchite);
});

app.post('/api/giacenze', (req, res) => {
  const db = readDatabase();
  
  // Calcola prezzo di vendita automaticamente se non fornito
  const prezzo_acquisto = req.body.prezzo_acquisto;
  const prezzo_vendita = req.body.prezzo_vendita || Math.round((prezzo_acquisto * 1.6) * 100) / 100;
  
  const nuovaGiacenza = {
    id: Date.now(),
    varieta_id: req.body.varieta_id,
    quantita: req.body.quantita,
    prezzo_acquisto: prezzo_acquisto,
    prezzo_vendita: prezzo_vendita,
    data_acquisto: req.body.data_acquisto || new Date().toISOString(),
    imballo: req.body.imballo || 1,
    fattura_id: req.body.fattura_id,
    note: req.body.note || '',
    created_at: new Date().toISOString()
  };
  db.giacenze.push(nuovaGiacenza);
  writeDatabase(db);
  res.json(nuovaGiacenza);
});

// Aggiornamento giacenza per varieta_id (legacy)
app.put('/api/giacenze/:varietaId', (req, res) => {
  const db = readDatabase();
  const giacenza = db.giacenze.find((g: any) => g.varieta_id === parseInt(req.params.varietaId));
  if (giacenza) {
    giacenza.quantita = req.body.quantita;
    giacenza.data_acquisto = req.body.dataAcquisto || giacenza.data_acquisto;
    giacenza.imballo = req.body.imballo || giacenza.imballo;
    writeDatabase(db);
    res.json(giacenza);
  } else {
    res.status(404).json({ error: 'Giacenza non trovata' });
  }
});

// Aggiornamento completo giacenza per giacenza_id
app.put('/api/giacenze/:giacenzaId/update', (req, res) => {
  try {
    console.log('📝 PUT /api/giacenze/:giacenzaId/update', req.params.giacenzaId);
    const db = readDatabase();
    const giacenza = db.giacenze.find((g: any) => g.id === parseInt(req.params.giacenzaId));
    
    if (!giacenza) {
      return res.status(404).json({ error: 'Giacenza non trovata' });
    }

    // Aggiorna i campi forniti
    if (req.body.quantita !== undefined) {
      giacenza.quantita = req.body.quantita;
    }
    if (req.body.prezzo_acquisto !== undefined) {
      giacenza.prezzo_acquisto = req.body.prezzo_acquisto;
    }
    if (req.body.prezzo_vendita !== undefined) {
      giacenza.prezzo_vendita = req.body.prezzo_vendita;
    }
    if (req.body.imballo !== undefined) {
      giacenza.imballo = req.body.imballo;
    }
    if (req.body.data_acquisto !== undefined) {
      giacenza.data_acquisto = req.body.data_acquisto;
    }

    // Aggiorna timestamp
    giacenza.updated_at = new Date().toISOString();

    writeDatabase(db);
    console.log(`✅ Giacenza ${giacenza.id} aggiornata con successo`);
    res.json(giacenza);
  } catch (error) {
    console.error('❌ Errore aggiornamento giacenza:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.post('/api/giacenze/:varietaId/incrementa', (req, res) => {
  const db = readDatabase();
  let giacenza = db.giacenze.find((g: any) => g.varieta_id === parseInt(req.params.varietaId));
  
  if (giacenza) {
    // Aggiorna giacenza esistente
    giacenza.quantita += req.body.quantita;
    if (req.body.prezzo_acquisto) {
      giacenza.prezzo_acquisto = req.body.prezzo_acquisto;
      giacenza.prezzo_vendita = Math.round((req.body.prezzo_acquisto * 1.6) * 100) / 100;
    }
    if (req.body.fattura_id) {
      giacenza.fattura_id = req.body.fattura_id;
    }
    if (req.body.imballo) {
      giacenza.imballo = req.body.imballo;
    }
  } else {
    // Crea nuova giacenza se non esiste
    const prezzo_acquisto = req.body.prezzo_acquisto || 0;
    const prezzo_vendita = Math.round((prezzo_acquisto * 1.6) * 100) / 100;
    
    giacenza = {
      id: Math.floor(Date.now() + Math.random()),
      varieta_id: parseInt(req.params.varietaId),
      quantita: req.body.quantita,
      prezzo_acquisto: prezzo_acquisto,
      prezzo_vendita: prezzo_vendita,
      data_acquisto: new Date().toISOString(),
      imballo: req.body.imballo || 1,
      fattura_id: req.body.fattura_id,
      note: '',
      created_at: new Date().toISOString()
    };
    db.giacenze.push(giacenza);
  }
  
  writeDatabase(db);
  res.json(giacenza);
});

app.put('/api/giacenze/:varietaId/incrementa', (req, res) => {
  const db = readDatabase();
  let giacenza = db.giacenze.find((g: any) => g.varieta_id === parseInt(req.params.varietaId));
  
  if (giacenza) {
    // Aggiorna giacenza esistente
    giacenza.quantita += req.body.quantita;
    if (req.body.prezzo_acquisto) {
      giacenza.prezzo_acquisto = req.body.prezzo_acquisto;
      giacenza.prezzo_vendita = Math.round((req.body.prezzo_acquisto * 1.6) * 100) / 100;
    }
    if (req.body.fattura_id) {
      giacenza.fattura_id = req.body.fattura_id;
    }
    if (req.body.imballo) {
      giacenza.imballo = req.body.imballo;
    }
  } else {
    // Crea nuova giacenza se non esiste
    const prezzo_acquisto = req.body.prezzo_acquisto || 0;
    const prezzo_vendita = Math.round((prezzo_acquisto * 1.6) * 100) / 100;
    
    giacenza = {
      id: Date.now(),
      varieta_id: parseInt(req.params.varietaId),
      quantita: req.body.quantita,
      prezzo_acquisto: prezzo_acquisto,
      prezzo_vendita: prezzo_vendita,
      data_acquisto: new Date().toISOString(),
      imballo: req.body.imballo || 1,
      fattura_id: req.body.fattura_id,
      note: '',
      created_at: new Date().toISOString()
    };
    db.giacenze.push(giacenza);
  }
  
  writeDatabase(db);
  res.json(giacenza);
});

app.post('/api/giacenze/:varietaId/scarica', (req, res) => {
  const db = readDatabase();
  const giacenza = db.giacenze.find((g: any) => g.varieta_id === parseInt(req.params.varietaId));
  if (giacenza) {
    giacenza.quantita -= req.body.quantita;
    writeDatabase(db);
    res.json(giacenza);
  } else {
    res.status(404).json({ error: 'Giacenza non trovata' });
  }
});

app.put('/api/giacenze/:varietaId/scarica', (req, res) => {
  const db = readDatabase();
  const giacenza = db.giacenze.find((g: any) => g.varieta_id === parseInt(req.params.varietaId));
  if (giacenza) {
    giacenza.quantita -= req.body.quantita;
    if (req.body.fattura_id) {
      giacenza.fattura_id = req.body.fattura_id;
    }
    writeDatabase(db);
    res.json(giacenza);
  } else {
    res.status(404).json({ error: 'Giacenza non trovata' });
  }
});

// === API MOVIMENTI MAGAZZINO ===
app.get('/api/movimenti-magazzino', (req, res) => {
  const db = readDatabase();
  let movimenti = db.movimenti_magazzino || [];
  
  if (req.query.varietaId) {
    movimenti = movimenti.filter((m: any) => m.varieta_id === parseInt(req.query.varietaId as string));
  }
  
  if (req.query.dataInizio) {
    movimenti = movimenti.filter((m: any) => new Date(m.data || m.created_at) >= new Date(req.query.dataInizio as string));
  }
  
  if (req.query.dataFine) {
    movimenti = movimenti.filter((m: any) => new Date(m.data || m.created_at) <= new Date(req.query.dataFine as string));
  }
  
  // Arricchisci i movimenti con i dati correlati
  const movimentiArricchiti = movimenti.map((movimento: any) => {
    // Trova la varietà
    const varieta = db.varieta.find((v: any) => v.id === movimento.varieta_id);
    
    // Trova la fattura
    const fattura = movimento.fattura_id ? db.fatture.find((f: any) => f.id === movimento.fattura_id) : null;
    
    // Trova il fornitore dalla fattura
    const fornitore = fattura && fattura.fornitore_id ? db.fornitori.find((f: any) => f.id === fattura.fornitore_id) : null;
    
    return {
      ...movimento,
      varieta_nome: varieta ? varieta.nome : '',
      fattura_numero: fattura ? fattura.numero : '',
      fornitore_nome: fornitore ? fornitore.nome : '',
      data_movimento: movimento.data || movimento.created_at
    };
  });
  
  res.json(movimentiArricchiti);
});

app.post('/api/movimenti-magazzino', (req, res) => {
  const db = readDatabase();
  const nuovoMovimento = {
    id: Date.now(),
    varieta_id: req.body.varieta_id,
    tipo: req.body.tipo,
    quantita: req.body.quantita,
    prezzo_unitario: req.body.prezzo_unitario,
    fattura_id: req.body.fattura_id,
    imballo: req.body.imballo,
    note: req.body.note || '',
    data: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  db.movimenti_magazzino.push(nuovoMovimento);
  writeDatabase(db);
  res.json(nuovoMovimento);
});

// === API FORNITORI ===
app.get('/api/fornitori', (req, res) => {
  const db = readDatabase();
  res.json(db.fornitori || []);
});

app.post('/api/fornitori', (req, res) => {
  const db = readDatabase();
  const nuovoFornitore = {
    id: Date.now(),
    nome: req.body.nome,
    ragione_sociale: req.body.ragione_sociale,
    email: req.body.email || '',
    telefono: req.body.telefono || '',
    indirizzo: req.body.indirizzo || '',
    citta: req.body.citta || '',
    cap: req.body.cap || '',
    provincia: req.body.provincia || '',
    partita_iva: req.body.partita_iva || '',
    codice_fiscale: req.body.codice_fiscale || '',
    attivo: req.body.attivo !== undefined ? req.body.attivo : true,
    created_at: new Date().toISOString()
  };
  db.fornitori.push(nuovoFornitore);
  writeDatabase(db);
  res.json(nuovoFornitore);
});

app.put('/api/fornitori/:id', (req, res) => {
  const db = readDatabase();
  const index = db.fornitori.findIndex((f: any) => f.id === parseInt(req.params.id));
  if (index !== -1) {
    db.fornitori[index] = { ...db.fornitori[index], ...req.body };
    writeDatabase(db);
    res.json(db.fornitori[index]);
  } else {
    res.status(404).json({ error: 'Fornitore non trovato' });
  }
});

app.delete('/api/fornitori/:id', (req, res) => {
  const db = readDatabase();
  const index = db.fornitori.findIndex((f: any) => f.id === parseInt(req.params.id));
  if (index !== -1) {
    db.fornitori.splice(index, 1);
    writeDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Fornitore non trovato' });
  }
});

// === API CLIENTI ===
app.get('/api/clienti', (req, res) => {
  const db = readDatabase();
  res.json(db.clienti || []);
});

app.post('/api/clienti', (req, res) => {
  const db = readDatabase();
  const nuovoCliente = {
    id: Date.now(),
    nome: req.body.nome,
    cognome: req.body.cognome || '',
    email: req.body.email || '',
    telefono: req.body.telefono || '',
    indirizzo: req.body.indirizzo || '',
    citta: req.body.citta || '',
    cap: req.body.cap || '',
    partita_iva: req.body.partita_iva || '',
    codice_fiscale: req.body.codice_fiscale || '',
    created_at: new Date().toISOString()
  };
  db.clienti.push(nuovoCliente);
  writeDatabase(db);
  res.json(nuovoCliente);
});

// === API FATTURE ===
app.get('/api/fatture', (req, res) => {
  const db = readDatabase();
  let fatture = db.fatture || [];
  
  if (req.query.tipo) {
    fatture = fatture.filter((f: any) => f.tipo === req.query.tipo);
  }
  
  res.json(fatture);
});

app.get('/api/fatture/:id', (req, res) => {
  const db = readDatabase();
  const fattura = db.fatture.find((f: any) => f.id === parseInt(req.params.id));
  if (fattura) {
    res.json(fattura);
  } else {
    res.status(404).json({ error: 'Fattura non trovata' });
  }
});

app.post('/api/fatture', (req, res) => {
  const db = readDatabase();
  const nuovaFattura = {
    id: Math.floor(Date.now() + Math.random()),
    numero: req.body.numero,
    tipo: 'acquisto',
    cliente_id: req.body.cliente_id,
    fornitore_id: req.body.fornitore_id,
    data: req.body.data,
    totale: req.body.totale,
    stato: 'bozza',
    created_at: new Date().toISOString()
  };
  db.fatture.push(nuovaFattura);
  writeDatabase(db);
  res.json(nuovaFattura);
});

app.put('/api/fatture/:id', (req, res) => {
  const db = readDatabase();
  const index = db.fatture.findIndex((f: any) => f.id === parseInt(req.params.id));
  if (index !== -1) {
    db.fatture[index] = { ...db.fatture[index], ...req.body };
    writeDatabase(db);
    res.json(db.fatture[index]);
  } else {
    res.status(404).json({ error: 'Fattura non trovata' });
  }
});

app.delete('/api/fatture/:id', (req, res) => {
  const db = readDatabase();
  const fatturaId = parseFloat(req.params.id); // Usa parseFloat per gestire timestamp
  const fatturaIndex = db.fatture.findIndex((f: any) => f.id === fatturaId);
  
  if (fatturaIndex === -1) {
    return res.status(404).json({ error: 'Fattura non trovata' });
  }

  // Trova tutte le varietà coinvolte nei dettagli della fattura
  const dettagliFattura = db.dettagli_fattura.filter((d: any) => d.fattura_id === fatturaId);
  const varietaIds = dettagliFattura.map((d: any) => d.varieta_id);

  // Controlla se esistono movimenti di vendita o distruzione per queste varietà e questa fattura
  const movimentiBloccanti = db.movimenti_magazzino.filter((m: any) =>
    varietaIds.includes(m.varieta_id) &&
    m.fattura_id === fatturaId &&
    (m.tipo === 'scarico' || m.tipo === 'distruzione')
  );

  if (movimentiBloccanti.length > 0) {
    return res.status(400).json({
      error: 'Impossibile cancellare la fattura: esistono movimenti di vendita o distruzione associati',
      movimenti_bloccanti: movimentiBloccanti
    });
  }

  // Cancella tutti i dettagli della fattura
  db.dettagli_fattura = db.dettagli_fattura.filter((d: any) => d.fattura_id !== fatturaId);

  // Cancella tutti i movimenti di magazzino associati a questa fattura
  db.movimenti_magazzino = db.movimenti_magazzino.filter((m: any) => m.fattura_id !== fatturaId);

  // Cancella le giacenze associate a questa fattura
  const giacenzeCancellate = db.giacenze.filter((g: any) => g.fattura_id === fatturaId);
  db.giacenze = db.giacenze.filter((g: any) => g.fattura_id !== fatturaId);

  // Cancella la fattura
  const fattura = db.fatture[fatturaIndex];
  db.fatture.splice(fatturaIndex, 1);

  // Ricalcola le giacenze per assicurarsi che siano coerenti
  const dbAggiornato = ricalcolaGiacenze(db);
  writeDatabase(dbAggiornato);

  console.log(`🗑️ Fattura ${fattura.numero} cancellata con successo`);
  console.log(`📊 Giacenze cancellate: ${giacenzeCancellate.length}`);
  console.log(`📦 Movimenti cancellati: ${varietaIds.length}`);

  res.json({
    success: true,
    fattura_numero: fattura.numero,
    dettagli_cancellati: dettagliFattura.length,
    movimenti_cancellati: varietaIds.length,
    giacenze_cancellate: giacenzeCancellate.length
  });
});

// Aggiornamento completo fattura con dettagli
app.put('/api/fatture/:id/update-completa', (req, res) => {
  try {
    console.log('📝 PUT /api/fatture/:id/update-completa', req.params.id);
    const db = readDatabase();
    const fatturaId = parseFloat(req.params.id);
    const fatturaIndex = db.fatture.findIndex((f: any) => f.id === fatturaId);
    
    if (fatturaIndex === -1) {
      return res.status(404).json({ error: 'Fattura non trovata' });
    }

    const fattura = db.fatture[fatturaIndex];
    
    // Controlla se esistono movimenti di vendita o distruzione
    const dettagliEsistenti = db.dettagli_fattura.filter((d: any) => d.fattura_id === fatturaId);
    const varietaIds = dettagliEsistenti.map((d: any) => d.varieta_id);
    
    const movimentiBloccanti = db.movimenti_magazzino.filter((m: any) =>
      varietaIds.includes(m.varieta_id) &&
      m.fattura_id === fatturaId &&
      (m.tipo === 'scarico' || m.tipo === 'distruzione')
    );

    if (movimentiBloccanti.length > 0) {
      return res.status(400).json({
        error: 'Impossibile modificare la fattura: esistono movimenti di vendita o distruzione associati',
        movimenti_bloccanti: movimentiBloccanti
      });
    }

    // Aggiorna i dati base della fattura
    if (req.body.numero) fattura.numero = req.body.numero;
    if (req.body.fornitore_id) fattura.fornitore_id = req.body.fornitore_id;
    if (req.body.data) fattura.data = req.body.data;
    
    // Se ci sono nuovi dettagli, aggiorna tutto
    if (req.body.dettagli) {
      // Cancella i dettagli esistenti
      db.dettagli_fattura = db.dettagli_fattura.filter((d: any) => d.fattura_id !== fatturaId);
      
      // Cancella i movimenti di carico esistenti
      db.movimenti_magazzino = db.movimenti_magazzino.filter((m: any) => 
        m.fattura_id !== fatturaId || m.tipo !== 'carico'
      );
      
      // Cancella le giacenze esistenti associate a questa fattura
      db.giacenze = db.giacenze.filter((g: any) => g.fattura_id !== fatturaId);
      
      let nuovoTotale = 0;
      
      // Crea i nuovi dettagli
      for (const dettaglio of req.body.dettagli) {
        const nuovoDettaglio = {
          id: Math.floor(Date.now() + Math.random()),
          fattura_id: fatturaId,
          varieta_id: dettaglio.varieta_id,
          quantita: dettaglio.quantita,
          prezzo_unitario: dettaglio.prezzo_unitario,
          sconto: 0,
          totale: dettaglio.totale,
          created_at: new Date().toISOString()
        };
        
        db.dettagli_fattura.push(nuovoDettaglio);
        nuovoTotale += dettaglio.totale;
        
        // Crea la giacenza
        const giacenza = {
          id: Math.floor(Date.now() + Math.random()),
          varieta_id: dettaglio.varieta_id,
          quantita: dettaglio.quantita,
          prezzo_acquisto: dettaglio.prezzo_unitario,
          prezzo_vendita: Math.round((dettaglio.prezzo_unitario * 1.6) * 100) / 100,
          data_acquisto: fattura.data,
          fattura_id: fatturaId,
          fornitore_id: fattura.fornitore_id,
          imballo: 1,
          note: `Carico da fattura ${fattura.numero}`,
          created_at: new Date().toISOString()
        };
        
        db.giacenze.push(giacenza);
      }
      
      // Aggiorna il totale della fattura
      fattura.totale = nuovoTotale;
    }
    
    // Aggiorna timestamp
    fattura.updated_at = new Date().toISOString();
    
    writeDatabase(db);
    
    console.log(`✅ Fattura ${fattura.numero} aggiornata con successo`);
    res.json({
      message: 'Fattura aggiornata con successo',
      fattura: fattura,
      dettagli_aggiornati: req.body.dettagli ? req.body.dettagli.length : 0
    });
    
  } catch (error) {
    console.error('❌ Errore aggiornamento fattura:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// === API DETTAGLI FATTURA ===
app.get('/api/fatture/:id/dettagli', (req, res) => {
  const db = readDatabase();
  const dettagli = db.dettagli_fattura.filter((d: any) => d.fattura_id === parseInt(req.params.id));
  
  // Arricchisci i dettagli con i dati delle varietà, gruppi e prodotti
  const dettagliArricchiti = dettagli.map((dettaglio: any) => {
    const varieta = db.varieta.find((v: any) => v.id === dettaglio.varieta_id);
    const prodotto = varieta ? db.prodotti.find((p: any) => p.id === varieta.prodotto_id) : null;
    const gruppo = prodotto ? db.gruppi.find((g: any) => g.id === prodotto.gruppo_id) : null;
    const giacenza = varieta ? db.giacenze.find((g: any) => g.varieta_id === varieta.id) : null;
    const quantita_scaricata = giacenza ? dettaglio.quantita - giacenza.quantita : 0;
    
    return {
      ...dettaglio,
      varieta_nome: varieta ? varieta.nome : 'Varietà non trovata',
      gruppo_nome: gruppo ? gruppo.nome : 'Gruppo non trovato',
      prodotto_nome: prodotto ? prodotto.nome : 'Prodotto non trovato',
      imballo: giacenza ? giacenza.imballo : 1,
      quantita_scaricata: Math.max(0, quantita_scaricata),
      puo_essere_modificato: quantita_scaricata === 0,
      puo_essere_cancellato: quantita_scaricata === 0
    };
  });
  
  res.json(dettagliArricchiti);
});

app.post('/api/fatture/:id/dettagli', (req, res) => {
  const db = readDatabase();
  const fatturaId = parseInt(req.params.id);
  
  // Trova la fattura per determinare il tipo
  const fattura = db.fatture.find((f: any) => f.id === fatturaId);
  if (!fattura) {
    return res.status(404).json({ error: 'Fattura non trovata' });
  }
  
  const nuovoDettaglio = {
    id: Math.floor(Date.now() + Math.random()),
    fattura_id: fatturaId,
    varieta_id: req.body.varieta_id,
    quantita: req.body.quantita,
    prezzo_unitario: req.body.prezzo_unitario,
    sconto: req.body.sconto || 0,
    totale: req.body.totale,
    created_at: new Date().toISOString()
  };
  db.dettagli_fattura.push(nuovoDettaglio);
  
  // Crea automaticamente un movimento di magazzino
  if (fattura.tipo === 'acquisto') {
    // Movimento di carico per fattura di acquisto
    const nuovoMovimento = {
      id: Math.floor(Date.now() + Math.random()), // ID univoco
      varieta_id: req.body.varieta_id,
      tipo: 'carico',
      quantita: req.body.quantita,
      prezzo_unitario: req.body.prezzo_unitario,
      fattura_id: fatturaId,
      fornitore_id: fattura.fornitore_id, // Aggiungi fornitore_id
      imballo: req.body.imballo || 1, // Aggiungi imballo
      note: `Carico da fattura ${fattura.numero}`,
      data: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    db.movimenti_magazzino.push(nuovoMovimento);
    console.log(`📦 Movimento carico creato: ${req.body.quantita} pezzi di varietà ${req.body.varieta_id} da fattura ${fattura.numero}`);
  } else if (fattura.tipo === 'vendita') {
    // Movimento di scarico per fattura di vendita
    const nuovoMovimento = {
      id: Math.floor(Date.now() + Math.random()), // ID univoco
      varieta_id: req.body.varieta_id,
      tipo: 'scarico',
      quantita: req.body.quantita,
      prezzo_unitario: req.body.prezzo_unitario,
      fattura_id: fatturaId,
      cliente_id: fattura.cliente_id, // Aggiungi cliente_id
      note: `Scarico per fattura ${fattura.numero}`,
      data: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    db.movimenti_magazzino.push(nuovoMovimento);
    console.log(`📦 Movimento scarico creato: ${req.body.quantita} pezzi di varietà ${req.body.varieta_id} per fattura ${fattura.numero}`);
  }
  
  // Forza il ricalcolo delle giacenze dopo aver aggiunto il dettaglio
  const dbAggiornato = ricalcolaGiacenze(db);
  writeDatabase(dbAggiornato);
  
  console.log(`✅ Dettaglio fattura creato con ID ${nuovoDettaglio.id}`);
  console.log(`📦 Movimento creato per varietà ${req.body.varieta_id}: ${req.body.quantita} pezzi`);
  
  res.json(nuovoDettaglio);
});

app.put('/api/dettagli-fattura/:id', (req, res) => {
  const db = readDatabase();
  const index = db.dettagli_fattura.findIndex((d: any) => d.id === parseInt(req.params.id));
  if (index !== -1) {
    const dettaglio = db.dettagli_fattura[index];
    const fatturaId = dettaglio.fattura_id;
    
    // Se la quantità è 0, cancella il dettaglio
    if (req.body.quantita === 0) {
      // Le giacenze verranno ricalcolate automaticamente dalla funzione writeDatabase
      
      // NON cancellare i movimenti - devono rimanere per lo storico
      // I movimenti rappresentano la cronologia e non devono essere eliminati
      console.log(`📊 Movimenti mantenuti per lo storico (aggiornamento): ${db.movimenti_magazzino.filter((m: any) => m.fattura_id === fatturaId && m.varieta_id === dettaglio.varieta_id).length} movimenti`);
      
      db.dettagli_fattura.splice(index, 1);
      
      // Verifica se la fattura è rimasta senza dettagli
      const dettagliRimanenti = db.dettagli_fattura.filter((d: any) => d.fattura_id === fatturaId);
      
      if (dettagliRimanenti.length === 0) {
        // Cancella automaticamente la fattura vuota
        const fatturaIndex = db.fatture.findIndex((f: any) => f.id === fatturaId);
        if (fatturaIndex !== -1) {
          console.log(`🗑️ Cancellazione automatica fattura vuota (quantità 0): ${fatturaId}`);
          db.fatture.splice(fatturaIndex, 1);
        }
      }
      
      writeDatabase(db);
      res.json({ 
        success: true, 
        fattura_cancellata: dettagliRimanenti.length === 0,
        fattura_id: fatturaId
      });
    } else {
      // Aggiorna normalmente il dettaglio
      db.dettagli_fattura[index] = { ...db.dettagli_fattura[index], ...req.body };
      writeDatabase(db);
      res.json(db.dettagli_fattura[index]);
    }
  } else {
    res.status(404).json({ error: 'Dettaglio non trovato' });
  }
});

app.delete('/api/dettagli-fattura/:id', (req, res) => {
  const db = readDatabase();
  const index = db.dettagli_fattura.findIndex((d: any) => d.id === parseInt(req.params.id));
  if (index !== -1) {
    // Verifica se il dettaglio è stato scaricato
    const dettaglio = db.dettagli_fattura[index];
    const varieta = db.varieta.find((v: any) => v.id === dettaglio.varieta_id);
    
    if (varieta) {
      const giacenza = db.giacenze.find((g: any) => g.varieta_id === varieta.id);
      if (giacenza && giacenza.quantita < dettaglio.quantita) {
        return res.status(400).json({ 
          error: 'Impossibile cancellare: articolo già parzialmente scaricato',
          quantita_scaricata: dettaglio.quantita - giacenza.quantita
        });
      }
    }
    
    // Salva l'ID della fattura prima di cancellare il dettaglio
    const fatturaId = dettaglio.fattura_id;
    
    // Le giacenze verranno ricalcolate automaticamente dalla funzione writeDatabase
    
    // NON cancellare i movimenti - devono rimanere per lo storico
    // I movimenti rappresentano la cronologia e non devono essere eliminati
    console.log(`📊 Movimenti mantenuti per lo storico (dettaglio): ${db.movimenti_magazzino.filter((m: any) => m.fattura_id === fatturaId && m.varieta_id === dettaglio.varieta_id).length} movimenti`);
    
    // Cancella il dettaglio
    db.dettagli_fattura.splice(index, 1);
    
    // Verifica se la fattura è rimasta senza dettagli
    const dettagliRimanenti = db.dettagli_fattura.filter((d: any) => d.fattura_id === fatturaId);
    
    if (dettagliRimanenti.length === 0) {
      // Cancella automaticamente la fattura vuota
      const fatturaIndex = db.fatture.findIndex((f: any) => f.id === fatturaId);
      if (fatturaIndex !== -1) {
        console.log(`🗑️ Cancellazione automatica fattura vuota: ${fatturaId}`);
        db.fatture.splice(fatturaIndex, 1);
      }
    }
    
    writeDatabase(db);
    res.json({ 
      success: true, 
      fattura_cancellata: dettagliRimanenti.length === 0,
      fattura_id: fatturaId
    });
  } else {
    res.status(404).json({ error: 'Dettaglio non trovato' });
  }
});

// Endpoint per verificare se un dettaglio fattura è stato scaricato
app.get('/api/dettagli-fattura/:id/stato-scarico', (req, res) => {
  const db = readDatabase();
  const dettaglio = db.dettagli_fattura.find((d: any) => d.id === parseInt(req.params.id));
  
  if (!dettaglio) {
    return res.status(404).json({ error: 'Dettaglio non trovato' });
  }
  
  const varieta = db.varieta.find((v: any) => v.id === dettaglio.varieta_id);
  if (!varieta) {
    return res.status(404).json({ error: 'Varietà non trovata' });
  }
  
  const giacenza = db.giacenze.find((g: any) => g.varieta_id === varieta.id);
  const quantita_scaricata = giacenza ? dettaglio.quantita - giacenza.quantita : 0;
  const puo_essere_cancellato = quantita_scaricata === 0;
  
  res.json({
    dettaglio_id: dettaglio.id,
    varieta_id: varieta.id,
    varieta_nome: varieta.nome,
    quantita_fattura: dettaglio.quantita,
    quantita_giacenza: giacenza ? giacenza.quantita : 0,
    quantita_scaricata,
    puo_essere_cancellato
  });
});

// === API STATISTICHE FATTURE ACQUISTO ===
app.get('/api/statistiche/fatture-acquisto', (req, res) => {
  try {
    const db = readDatabase();
    const dataInizio = req.query.data_inizio as string;
    const dataFine = req.query.data_fine as string;
    const fornitoreId = req.query.fornitore_id as string;
    
    console.log(`📊 GET /api/statistiche/fatture-acquisto - Filtri: ${JSON.stringify(req.query)}`);
    
    // Verifica che il database abbia i dati necessari
    if (!db.fatture || !db.fornitori || !db.varieta || !db.dettagli_fatture) {
      return res.json({
        totale_fatture: 0,
        totale_importo: 0,
        media_importo: 0,
        fatture_mese: 0,
        importo_mese: 0,
        top_fornitori: [],
        top_varieta: [],
        trend_mensile: []
      });
    }
    
    // Filtra fatture di acquisto
    let fatture = db.fatture.filter((f: any) => f.tipo === 'acquisto');
    
    // Applica filtri data
    if (dataInizio) {
      fatture = fatture.filter((f: any) => f.data >= dataInizio);
    }
    if (dataFine) {
      fatture = fatture.filter((f: any) => f.data <= dataFine);
    }
    if (fornitoreId) {
      fatture = fatture.filter((f: any) => f.fornitore_id === parseInt(fornitoreId));
    }
    
    // Calcola statistiche base
    const totale_fatture = fatture.length;
    const totale_importo = fatture.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
    const media_importo = totale_fatture > 0 ? totale_importo / totale_fatture : 0;
    
    // Statistiche del mese corrente
    const oggi = new Date();
    const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1).toISOString().split('T')[0];
    const fineMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const fattureMese = fatture.filter((f: any) => f.data >= inizioMese && f.data <= fineMese);
    const fatture_mese = fattureMese.length;
    const importo_mese = fattureMese.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
    
    // Top fornitori
    const fornitori_stats = new Map();
    fatture.forEach((f: any) => {
      const fornitore = db.fornitori.find((fr: any) => fr.id === f.fornitore_id);
      const nome_fornitore = fornitore ? fornitore.nome : `Fornitore ${f.fornitore_id}`;
      
      if (!fornitori_stats.has(f.fornitore_id)) {
        fornitori_stats.set(f.fornitore_id, {
          fornitore: nome_fornitore,
          totale_importo: 0,
          numero_fatture: 0
        });
      }
      
      const stat = fornitori_stats.get(f.fornitore_id);
      stat.totale_importo += f.totale || 0;
      stat.numero_fatture += 1;
    });
    
    const top_fornitori = Array.from(fornitori_stats.values())
      .sort((a: any, b: any) => b.totale_importo - a.totale_importo)
      .slice(0, 5);
    
    // Top varietà acquistate
    const varieta_stats = new Map();
    
    // Processa i dettagli delle fatture
    const dettagliFiltrati = db.dettagli_fatture.filter((d: any) => 
      fatture.some((f: any) => f.id === d.fattura_id)
    );
    
    dettagliFiltrati.forEach((d: any) => {
      const varieta = db.varieta.find((v: any) => v.id === d.varieta_id);
      const nome_varieta = varieta ? varieta.nome : `Varietà ${d.varieta_id}`;
      
      if (!varieta_stats.has(d.varieta_id)) {
        varieta_stats.set(d.varieta_id, {
          varieta: nome_varieta,
          quantita_totale: 0,
          importo_totale: 0
        });
      }
      
      const stat = varieta_stats.get(d.varieta_id);
      stat.quantita_totale += d.quantita || 0;
      stat.importo_totale += d.totale || 0;
    });
    
    const top_varieta = Array.from(varieta_stats.values())
      .sort((a: any, b: any) => b.importo_totale - a.importo_totale)
      .slice(0, 5);
    
    // Trend mensile (ultimi 12 mesi)
    const trend_mensile = [];
    for (let i = 11; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const anno = data.getFullYear();
      const mese = data.getMonth();
      
      const inizioMeseTrend = new Date(anno, mese, 1).toISOString().split('T')[0];
      const fineMeseTrend = new Date(anno, mese + 1, 0).toISOString().split('T')[0];
    
    const fattureMeseTrend = fatture.filter((f: any) => f.data >= inizioMeseTrend && f.data <= fineMeseTrend);
    
    trend_mensile.push({
      mese: data.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
      numero_fatture: fattureMeseTrend.length,
      importo_totale: fattureMeseTrend.reduce((sum: number, f: any) => sum + (f.totale || 0), 0)
    });
  }
  
  const statistiche = {
    totale_fatture,
    totale_importo,
    media_importo,
    fatture_mese,
    importo_mese,
    top_fornitori,
    top_varieta,
    trend_mensile
  };
  
    console.log(`📈 Statistiche fatture acquisto calcolate:`, {
      fatture_totali: totale_fatture,
      importo_totale: totale_importo,
      top_fornitori: top_fornitori.length,
      top_varieta: top_varieta.length
    });
    
    res.json(statistiche);
  } catch (error) {
    console.error('Errore calcolo statistiche fatture acquisto:', error);
    res.status(500).json({
      error: 'Errore interno del server',
      totale_fatture: 0,
      totale_importo: 0,
      media_importo: 0,
      fatture_mese: 0,
      importo_mese: 0,
      top_fornitori: [],
      top_varieta: [],
      trend_mensile: []
    });
  }
});

app.get('/api/statistiche/fornitori', (req, res) => {
  try {
    const db = readDatabase();
    
    // Verifica che il database abbia i dati necessari
    if (!db.fornitori || !db.fatture) {
      return res.json([]);
    }
    
    // Calcola statistiche per ogni fornitore
    const fornitori_stats = db.fornitori.map((fornitore: any) => {
      const fatture_fornitore = db.fatture.filter((f: any) => 
        f.fornitore_id === fornitore.id && f.tipo === 'acquisto'
      );
      
      const totale_fatture = fatture_fornitore.length;
      const totale_speso = fatture_fornitore.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
      const media_fattura = totale_fatture > 0 ? totale_speso / totale_fatture : 0;
      
      // Ultima fattura
      const ultima_fattura = fatture_fornitore
        .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
      
      return {
        ...fornitore,
        totale_fatture,
        totale_speso,
        media_fattura,
        ultima_fattura: ultima_fattura ? ultima_fattura.data : null
      };
    });
    
    res.json(fornitori_stats);
  } catch (error) {
    console.error('Errore calcolo statistiche fornitori:', error);
    res.status(500).json([]);
  }
});

app.get('/api/statistiche/varieta-acquisto', (req, res) => {
  try {
    const db = readDatabase();
    
    // Verifica che il database abbia i dati necessari
    if (!db.dettagli_fatture || !db.fatture || !db.varieta) {
      return res.json([]);
    }
    
    // Calcola statistiche per varietà acquistate
    const varieta_stats = new Map();
    
    db.dettagli_fatture.forEach((dettaglio: any) => {
      const fattura = db.fatture.find((f: any) => f.id === dettaglio.fattura_id && f.tipo === 'acquisto');
      if (!fattura) return;
      
      const varieta = db.varieta.find((v: any) => v.id === dettaglio.varieta_id);
      const nome_varieta = varieta ? varieta.nome : `Varietà ${dettaglio.varieta_id}`;
      
      if (!varieta_stats.has(dettaglio.varieta_id)) {
        varieta_stats.set(dettaglio.varieta_id, {
          varieta_id: dettaglio.varieta_id,
          nome: nome_varieta,
          quantita_totale: 0,
          importo_totale: 0,
          numero_acquisti: 0,
          prezzo_medio: 0
        });
      }
      
      const stat = varieta_stats.get(dettaglio.varieta_id);
      stat.quantita_totale += dettaglio.quantita || 0;
      stat.importo_totale += dettaglio.totale || 0;
      stat.numero_acquisti += 1;
      stat.prezzo_medio = stat.importo_totale / stat.quantita_totale;
    });
    
    const risultato = Array.from(varieta_stats.values())
      .sort((a: any, b: any) => b.importo_totale - a.importo_totale);
    
    res.json(risultato);
  } catch (error) {
    console.error('Errore calcolo statistiche varietà acquisto:', error);
    res.status(500).json([]);
  }
});

// === API EVENTI ===
app.get('/api/eventi', (req, res) => {
  const db = readDatabase();
  res.json(db.eventi || []);
});

app.post('/api/eventi', (req, res) => {
  const db = readDatabase();
  const nuovoEvento = {
    id: Date.now(),
    titolo: req.body.titolo,
    descrizione: req.body.descrizione || '',
    data_inizio: req.body.data_inizio,
    data_fine: req.body.data_fine || req.body.data_inizio,
    tipo: req.body.tipo || 'generico',
    created_at: new Date().toISOString()
  };
  db.eventi.push(nuovoEvento);
  writeDatabase(db);
  res.json(nuovoEvento);
});

// === API ORDINI VENDITA ===
app.get('/api/ordini-vendita', (req, res) => {
  const db = readDatabase();
  res.json(db.ordini_vendita || []);
});

app.post('/api/ordini-vendita', (req, res) => {
  const db = readDatabase();
  const nuovoOrdine = {
    id: Date.now(),
    numero: req.body.numero,
    cliente_id: req.body.cliente_id,
    data: req.body.data,
    stato: req.body.stato || 'bozza',
    totale: req.body.totale || 0,
    prodotti: req.body.prodotti || [],
    created_at: new Date().toISOString()
  };
  db.ordini_vendita.push(nuovoOrdine);
  writeDatabase(db);
  res.json(nuovoOrdine);
});

app.put('/api/ordini-vendita/:id', (req, res) => {
  const db = readDatabase();
  const index = db.ordini_vendita.findIndex((o: any) => o.id === parseInt(req.params.id));
  if (index !== -1) {
    db.ordini_vendita[index] = { ...db.ordini_vendita[index], ...req.body };
    writeDatabase(db);
    res.json(db.ordini_vendita[index]);
  } else {
    res.status(404).json({ error: 'Ordine non trovato' });
  }
});

app.delete('/api/ordini-vendita/:id', (req, res) => {
  const db = readDatabase();
  const index = db.ordini_vendita.findIndex((o: any) => o.id === parseInt(req.params.id));
  if (index !== -1) {
    db.ordini_vendita.splice(index, 1);
    writeDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Ordine non trovato' });
  }
});

// === API ORDINI ACQUISTO ===
app.get('/api/ordini-acquisto', (req, res) => {
  const db = readDatabase();
  res.json(db.ordini_acquisto || []);
});

app.post('/api/ordini-acquisto', (req, res) => {
  const db = readDatabase();
  const nuovoOrdine = {
    id: Date.now(),
    numero: req.body.numero,
    fornitore_id: req.body.fornitore_id,
    data: req.body.data,
    stato: req.body.stato || 'bozza',
    totale: req.body.totale || 0,
    prodotti: req.body.prodotti || [],
    created_at: new Date().toISOString()
  };
  db.ordini_acquisto.push(nuovoOrdine);
  writeDatabase(db);
  res.json(nuovoOrdine);
});

app.put('/api/ordini-acquisto/:id', (req, res) => {
  const db = readDatabase();
  const index = db.ordini_acquisto.findIndex((o: any) => o.id === parseInt(req.params.id));
  if (index !== -1) {
    db.ordini_acquisto[index] = { ...db.ordini_acquisto[index], ...req.body };
    writeDatabase(db);
    res.json(db.ordini_acquisto[index]);
  } else {
    res.status(404).json({ error: 'Ordine non trovato' });
  }
});

app.delete('/api/ordini-acquisto/:id', (req, res) => {
  const db = readDatabase();
  const index = db.ordini_acquisto.findIndex((o: any) => o.id === parseInt(req.params.id));
  if (index !== -1) {
    db.ordini_acquisto.splice(index, 1);
    writeDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Ordine non trovato' });
  }
});

// === API DISTRUZIONI ===
app.post('/api/distruzioni', (req, res) => {
  console.log('🗑️ Richiesta distruzione ricevuta:', req.body);
  const db = readDatabase();
  const { giacenza_id, quantita, motivo } = req.body;
  
  console.log('🗑️ Parametri distruzione:', { giacenza_id, quantita, motivo });
  
  // Trova la giacenza
  const giacenza = db.giacenze.find((g: any) => g.id === parseFloat(giacenza_id));
  console.log('🗑️ Giacenza trovata:', giacenza);
  
  if (!giacenza) {
    console.log('❌ Giacenza non trovata per ID:', giacenza_id);
    return res.status(404).json({ error: 'Giacenza non trovata' });
  }
  
  if (quantita > giacenza.quantita) {
    console.log('❌ Quantità non disponibile:', quantita, '>', giacenza.quantita);
    return res.status(400).json({ error: 'Quantità non disponibile in magazzino' });
  }
  
  // Crea movimento di distruzione
  const nuovoMovimento = {
    id: Math.floor(Date.now() + Math.random()),
    varieta_id: giacenza.varieta_id,
    tipo: 'distruzione',
    quantita: quantita,
    prezzo_unitario: giacenza.prezzo_acquisto,
    fattura_id: giacenza.fattura_id,
    note: `Distruzione: ${motivo}`,
    data: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  
  db.movimenti_magazzino.push(nuovoMovimento);
  
  // Registra la distruzione
  const nuovaDistruzione = {
    id: Date.now(),
    giacenza_id: parseFloat(giacenza_id),
    quantita: quantita,
    motivo: motivo,
    data_distruzione: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  
  if (!db.distruzioni) {
    db.distruzioni = [];
  }
  db.distruzioni.push(nuovaDistruzione);
  
  // Ricalcola le giacenze dopo aver aggiunto il movimento di distruzione
  const dbAggiornato = ricalcolaGiacenze(db);
  writeDatabase(dbAggiornato);
  
  console.log(`🗑️ Distruzione registrata: ${quantita} pezzi di varietà ${giacenza.varieta_id} - Motivo: ${motivo}`);
  
  res.json({
    success: true,
    distruzione: nuovaDistruzione,
    movimento: nuovoMovimento
  });
});

app.get('/api/distruzioni', (req, res) => {
  console.log('🗑️ Richiesta GET distruzioni ricevuta');
  const db = readDatabase();
  const distruzioni = db.distruzioni || [];
  
  console.log('🗑️ Distruzioni trovate:', distruzioni.length);
  
  // Arricchisci con i dati delle giacenze
  const distruzioniArricchite = distruzioni.map((d: any) => {
    // Prima cerca la giacenza per ID
    let giacenza = db.giacenze.find((g: any) => g.id === parseFloat(d.giacenza_id));
    let varieta = null;
    
    if (giacenza) {
      varieta = db.varieta.find((v: any) => v.id === giacenza.varieta_id);
    } else {
      // Se non trova la giacenza, cerca nei movimenti per trovare la varietà
      const movimento = db.movimenti_magazzino.find((m: any) => 
        m.tipo === 'distruzione' && 
        m.quantita === d.quantita &&
        m.note && m.note.includes(d.motivo) &&
        new Date(m.data || m.created_at).getTime() === new Date(d.data_distruzione).getTime()
      );
      
      if (movimento) {
        varieta = db.varieta.find((v: any) => v.id === movimento.varieta_id);
      }
    }
    
    return {
      ...d,
      giacenza_nome: varieta ? varieta.nome : 'Varietà non trovata',
      giacenza_varieta: varieta ? varieta.nome : 'Varietà non trovata'
    };
  });
  
  console.log('🗑️ Distruzioni arricchite inviate:', distruzioniArricchite.length);
  res.json(distruzioniArricchite);
});

app.delete('/api/distruzioni/:id', (req, res) => {
  const db = readDatabase();
  const distruzioneId = parseInt(req.params.id);
  const distruzioneIndex = db.distruzioni.findIndex((d: any) => d.id === distruzioneId);
  
  if (distruzioneIndex === -1) {
    return res.status(404).json({ error: 'Distruzione non trovata' });
  }
  
  const distruzione = db.distruzioni[distruzioneIndex];
  
  // Trova la giacenza per ottenere varieta_id
  const giacenza = db.giacenze.find((g: any) => g.id === parseFloat(distruzione.giacenza_id));
  
  // Trova e cancella il movimento di distruzione corrispondente
  const movimentoIndex = db.movimenti_magazzino.findIndex((m: any) => 
    m.tipo === 'distruzione' && 
    giacenza && m.varieta_id === giacenza.varieta_id && 
    m.quantita === distruzione.quantita &&
    m.note && m.note.includes(distruzione.motivo)
  );
  
  if (movimentoIndex !== -1) {
    db.movimenti_magazzino.splice(movimentoIndex, 1);
    console.log(`🗑️ Movimento di distruzione cancellato: ${distruzione.quantita} pezzi`);
  }
  
  // Cancella la distruzione
  db.distruzioni.splice(distruzioneIndex, 1);
  
  // Ricalcola le giacenze dopo aver cancellato il movimento di distruzione
  const dbAggiornato = ricalcolaGiacenze(db);
  writeDatabase(dbAggiornato);
  
  res.json({
    success: true,
    distruzione_cancellata: distruzione,
    movimento_cancellato: movimentoIndex !== -1
  });
});

// === API SPESE TRASPORTO ===

// GET: Recupera tutte le spese trasporto
app.get('/api/spese-trasporto', (req, res) => {
  const db = readDatabase();
  console.log('📦 GET /api/spese-trasporto');
  
  // Arricchisci i dati con informazioni aggiuntive
  const spese = db.spese_trasporto.map((spesa: any) => {
    // Aggiungi informazioni sul fornitore se presente
    const fornitore = spesa.fornitore_id ? 
      db.fornitori.find((f: any) => f.id === spesa.fornitore_id) : null;
    
    return {
      ...spesa,
      fornitore_nome: fornitore?.nome || spesa.destinatario || 'Non specificato',
      stato_descrizione: spesa.pagato ? 'Pagato' : 'Da Pagare'
    };
  });
  
  res.json(spese);
});

// POST: Crea nuova spesa trasporto
app.post('/api/spese-trasporto', (req, res) => {
  const db = readDatabase();
  const nuovaSpesa = req.body;
  
  console.log('📦 POST /api/spese-trasporto:', nuovaSpesa);
  
  // Genera ID incrementale
  const maxId = db.spese_trasporto.length > 0 ? 
    Math.max(...db.spese_trasporto.map((s: any) => s.id)) : 0;
  
  const spesa = {
    id: maxId + 1,
    ...nuovaSpesa,
    data_creazione: new Date().toISOString(),
    pagato: false // Default non pagato
  };
  
  db.spese_trasporto.push(spesa);
  writeDatabase(db);
  
  console.log(`✅ Spesa trasporto creata con ID: ${spesa.id}`);
  res.json(spesa);
});

// PUT: Aggiorna spesa trasporto
app.put('/api/spese-trasporto/:id', (req, res) => {
  const db = readDatabase();
  const spesaId = parseInt(req.params.id);
  const datiAggiornati = req.body;
  
  console.log(`📦 PUT /api/spese-trasporto/${spesaId}:`, datiAggiornati);
  
  const index = db.spese_trasporto.findIndex((s: any) => s.id === spesaId);
  if (index === -1) {
    return res.status(404).json({ error: 'Spesa trasporto non trovata' });
  }
  
  // Mantieni ID e data creazione originali
  const spesaOriginale = db.spese_trasporto[index];
  db.spese_trasporto[index] = {
    ...datiAggiornati,
    id: spesaId,
    data_creazione: spesaOriginale.data_creazione,
    data_modifica: new Date().toISOString()
  };
  
  writeDatabase(db);
  
  console.log(`✅ Spesa trasporto ${spesaId} aggiornata`);
  res.json(db.spese_trasporto[index]);
});

// DELETE: Elimina spesa trasporto
app.delete('/api/spese-trasporto/:id', (req, res) => {
  const db = readDatabase();
  const spesaId = parseInt(req.params.id);
  
  console.log(`📦 DELETE /api/spese-trasporto/${spesaId}`);
  
  const index = db.spese_trasporto.findIndex((s: any) => s.id === spesaId);
  if (index === -1) {
    return res.status(404).json({ error: 'Spesa trasporto non trovata' });
  }
  
  const spesaEliminata = db.spese_trasporto.splice(index, 1)[0];
  writeDatabase(db);
  
  console.log(`✅ Spesa trasporto ${spesaId} eliminata`);
  res.json({ success: true, spesa_eliminata: spesaEliminata });
});

// PATCH: Marca spesa trasporto come pagata/non pagata
app.patch('/api/spese-trasporto/:id/pagamento', (req, res) => {
  const db = readDatabase();
  const spesaId = parseInt(req.params.id);
  const { pagato, data_pagamento, metodo_pagamento, note_pagamento } = req.body;
  
  console.log(`💰 PATCH /api/spese-trasporto/${spesaId}/pagamento - Pagato: ${pagato}`);
  
  const spesa = db.spese_trasporto.find((s: any) => s.id === spesaId);
  if (!spesa) {
    return res.status(404).json({ error: 'Spesa trasporto non trovata' });
  }
  
  // Aggiorna stato pagamento
  spesa.pagato = pagato;
  if (data_pagamento) spesa.data_pagamento = data_pagamento;
  if (metodo_pagamento) spesa.metodo_pagamento = metodo_pagamento;
  if (note_pagamento) spesa.note_pagamento = note_pagamento;
  spesa.data_modifica = new Date().toISOString();
  
  writeDatabase(db);
  
  console.log(`✅ Pagamento spesa trasporto ${spesaId} aggiornato: ${pagato ? 'Pagato' : 'Non Pagato'}`);
  
  res.json(spesa);
});

// === API TASSE PERSONALIZZATE ===

// GET: Recupera tutte le tasse personalizzate
app.get('/api/tasse-personalizzate', (req, res) => {
  const db = readDatabase();
  console.log('💸 GET /api/tasse-personalizzate');
  
  const tasse = db.tasse_personalizzate.map((tassa: any) => {
    return {
      ...tassa,
      stato_descrizione: tassa.pagato ? 'Pagato' : 'Da Pagare',
      tipo_descrizione: tassa.tipo === 'fissa' ? 'Importo Fisso' : 'Percentuale'
    };
  });
  
  res.json(tasse);
});

// POST: Crea nuova tassa personalizzata
app.post('/api/tasse-personalizzate', (req, res) => {
  const db = readDatabase();
  const nuovaTassa = req.body;
  
  console.log('💸 POST /api/tasse-personalizzate:', nuovaTassa);
  
  // Genera ID incrementale
  const maxId = db.tasse_personalizzate.length > 0 ? 
    Math.max(...db.tasse_personalizzate.map((t: any) => t.id)) : 0;
  
  const tassa = {
    id: maxId + 1,
    ...nuovaTassa,
    data_creazione: new Date().toISOString(),
    pagato: false // Default non pagato
  };
  
  db.tasse_personalizzate.push(tassa);
  writeDatabase(db);
  
  console.log(`✅ Tassa personalizzata creata con ID: ${tassa.id}`);
  res.json(tassa);
});

// PUT: Aggiorna tassa personalizzata
app.put('/api/tasse-personalizzate/:id', (req, res) => {
  const db = readDatabase();
  const tassaId = parseInt(req.params.id);
  const datiAggiornati = req.body;
  
  console.log(`💸 PUT /api/tasse-personalizzate/${tassaId}:`, datiAggiornati);
  
  const index = db.tasse_personalizzate.findIndex((t: any) => t.id === tassaId);
  if (index === -1) {
    return res.status(404).json({ error: 'Tassa personalizzata non trovata' });
  }
  
  // Mantieni ID e data creazione originali
  const tassaOriginale = db.tasse_personalizzate[index];
  db.tasse_personalizzate[index] = {
    ...datiAggiornati,
    id: tassaId,
    data_creazione: tassaOriginale.data_creazione,
    data_modifica: new Date().toISOString()
  };
  
  writeDatabase(db);
  
  console.log(`✅ Tassa personalizzata ${tassaId} aggiornata`);
  res.json(db.tasse_personalizzate[index]);
});

// DELETE: Elimina tassa personalizzata
app.delete('/api/tasse-personalizzate/:id', (req, res) => {
  const db = readDatabase();
  const tassaId = parseInt(req.params.id);
  
  console.log(`💸 DELETE /api/tasse-personalizzate/${tassaId}`);
  
  const index = db.tasse_personalizzate.findIndex((t: any) => t.id === tassaId);
  if (index === -1) {
    return res.status(404).json({ error: 'Tassa personalizzata non trovata' });
  }
  
  const tassaEliminata = db.tasse_personalizzate.splice(index, 1)[0];
  writeDatabase(db);
  
  console.log(`✅ Tassa personalizzata ${tassaId} eliminata`);
  res.json({ success: true, tassa_eliminata: tassaEliminata });
});

// PATCH: Marca tassa personalizzata come pagata/non pagata
app.patch('/api/tasse-personalizzate/:id/pagamento', (req, res) => {
  const db = readDatabase();
  const tassaId = parseInt(req.params.id);
  const { pagato, data_pagamento, metodo_pagamento, note_pagamento } = req.body;
  
  console.log(`💰 PATCH /api/tasse-personalizzate/${tassaId}/pagamento - Pagato: ${pagato}`);
  
  const tassa = db.tasse_personalizzate.find((t: any) => t.id === tassaId);
  if (!tassa) {
    return res.status(404).json({ error: 'Tassa personalizzata non trovata' });
  }
  
  // Aggiorna stato pagamento
  tassa.pagato = pagato;
  if (data_pagamento) tassa.data_pagamento = data_pagamento;
  if (metodo_pagamento) tassa.metodo_pagamento = metodo_pagamento;
  if (note_pagamento) tassa.note_pagamento = note_pagamento;
  tassa.data_modifica = new Date().toISOString();
  
  writeDatabase(db);
  
  console.log(`✅ Pagamento tassa personalizzata ${tassaId} aggiornato: ${pagato ? 'Pagato' : 'Non Pagato'}`);
  
  res.json(tassa);
});

// === API PARSING PDF FATTURE ===

// Configurazioni parser per fornitori
interface ParserConfig {
  fornitore_id: number;
  fornitore_nome: string;
  patterns: {
    numero_fattura: string;
    data_fattura: string;
    totale: string;
    articoli: string;
    fornitore_nome?: string;
  };
  mappatura_campi: {
    [key: string]: string;
  };
}

// Salva configurazione parser
app.post('/api/pdf-parser/config', (req, res) => {
  const db = readDatabase();
  const config: ParserConfig = req.body;
  
  if (!db.pdf_parser_configs) {
    db.pdf_parser_configs = [];
  }
  
  // Aggiorna o aggiungi configurazione
  const existingIndex = db.pdf_parser_configs.findIndex((c: any) => c.fornitore_id === config.fornitore_id);
  if (existingIndex !== -1) {
    db.pdf_parser_configs[existingIndex] = config;
  } else {
    db.pdf_parser_configs.push(config);
  }
  
  writeDatabase(db);
  res.json(config);
});

// Ottieni configurazioni parser
app.get('/api/pdf-parser/configs', (req, res) => {
  const db = readDatabase();
  res.json(db.pdf_parser_configs || []);
});

// Ottieni configurazione per fornitore
app.get('/api/pdf-parser/config/:fornitoreId', (req, res) => {
  const db = readDatabase();
  const fornitoreId = parseInt(req.params.fornitoreId);
  const config = db.pdf_parser_configs?.find((c: any) => c.fornitore_id === fornitoreId);
  
  if (config) {
    res.json(config);
  } else {
    res.status(404).json({ error: 'Configurazione non trovata' });
  }
});

// Upload e parsing PDF interattivo
app.post('/api/pdf-parser/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file PDF caricato' });
    }

    const { fornitore_id } = req.body;
    const db = readDatabase();
    
    // Leggi il PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(pdfBuffer);
    const pdfText = pdfData.text;
    
    console.log('📄 PDF caricato:', req.file.filename);
    console.log('📝 Testo estratto per parsing interattivo');
    
    // Estrai struttura del PDF per parsing interattivo
    const pdfStructure = extractPDFStructure(pdfText);
    
    // Prova parsing automatico come fallback
    const autoParsingAttempt = parsePDFIntelligente(pdfText);
    
    // Pulisci file temporaneo
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      pdfStructure,
      autoParsingAttempt,
      filename: req.file.filename
    });
    
  } catch (error) {
    console.error('❌ Errore parsing PDF:', error);
    
    // Pulisci file temporaneo in caso di errore
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Errore durante il parsing del PDF',
      details: (error as Error).message 
    });
  }
});

// Estrai struttura del PDF per selezione interattiva
function extractPDFStructure(pdfText: string) {
  const lines = pdfText.split('\n').map((line, index) => ({
    index,
    content: line.trim(),
    length: line.trim().length
  })).filter(line => line.length > 0);

  // Identifica possibili colonne/tabelle
  const tables = [];
  let currentTable: any[] = [];
  
  for (const line of lines) {
    // Rileva righe che sembrano contenere dati tabulari
    const hasNumbers = /\d/.test(line.content);
    const hasMultipleSpaces = /\s{2,}/.test(line.content);
    const hasCommas = /,/.test(line.content);
    const isDataLine = hasNumbers && (hasMultipleSpaces || hasCommas) && line.length > 20;
    
    if (isDataLine) {
      // Analizza la struttura della riga
      const columns = line.content.split(/\s{2,}|,|\t/).filter(col => col.trim().length > 0);
      
      currentTable.push({
        lineIndex: line.index,
        content: line.content,
        columns: columns.map((col, colIndex) => ({
          index: colIndex,
          content: col.trim(),
          isNumeric: /^[\d.,]+$/.test(col.trim()),
          hasDecimal: /^\d+[.,]\d+$/.test(col.trim()),
          isCode: /^[A-Z0-9]{3,}$/.test(col.trim()),
          isText: !/^[\d.,]+$/.test(col.trim()) && col.trim().length > 2
        }))
      });
    } else if (currentTable.length > 0) {
      // Fine di una tabella
      if (currentTable.length >= 2) {
        tables.push([...currentTable]);
      }
      currentTable = [];
    }
  }
  
  // Aggiungi l'ultima tabella se presente
  if (currentTable.length >= 2) {
    tables.push(currentTable);
  }

  return {
    lines,
    tables,
    fullText: pdfText,
    summary: {
      totalLines: lines.length,
      tablesFound: tables.length,
      avgLineLength: lines.reduce((sum, line) => sum + line.length, 0) / lines.length
    }
  };
}

// Funzione per parsing PDF intelligente
function parsePDFIntelligente(pdfText: string) {
  console.log('🔍 Analisi intelligente del PDF...');
  
  const result: any = {
    numero_fattura: null,
    data_fattura: null,
    totale: null,
    articoli: []
  };

  try {
    // 1. Estrai numero fattura - cerca pattern comuni
    const numeroPatterns = [
      /Fattura\s*[Nn]°?\s*([A-Z0-9/-]+)/i,
      /Fattura\s*([A-Z0-9/-]+)/i,
      /[Nn]°\s*([A-Z0-9/-]+)/i,
      /Numero\s*:?\s*([A-Z0-9/-]+)/i
    ];
    
    for (const pattern of numeroPatterns) {
      const match = pdfText.match(pattern);
      if (match) {
        result.numero_fattura = match[1].trim();
        console.log('✅ Numero fattura trovato:', result.numero_fattura);
        break;
      }
    }

    // 2. Estrai data - cerca pattern comuni
    const dataPatterns = [
      /Data\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/g,
      /(\d{1,2}\.\d{1,2}\.\d{2,4})/g
    ];
    
    for (const pattern of dataPatterns) {
      const matches = pdfText.match(pattern);
      if (matches && matches.length > 0) {
        // Prendi la prima data che sembra una data di fattura
        result.data_fattura = matches[0];
        console.log('✅ Data fattura trovata:', result.data_fattura);
        break;
      }
    }

    // 3. Estrai totale - cerca pattern comuni
    const totalePatterns = [
      /Totale\s*:?\s*([\d.,]+)\s*EUR/i,
      /Totale\s*:?\s*€\s*([\d.,]+)/i,
      /Totale\s*:?\s*([\d.,]+)/i,
      /Importo\s*:?\s*([\d.,]+)/i
    ];
    
    for (const pattern of totalePatterns) {
      const match = pdfText.match(pattern);
      if (match) {
        result.totale = parseFloat(match[1].replace(',', '.'));
        console.log('✅ Totale trovato:', result.totale);
        break;
      }
    }

        // 4. Estrai articoli - analisi intelligente delle righe
    const lines = pdfText.split('\n');
    const articoli: any[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Salta righe vuote, intestazioni, totali
      if (!trimmedLine || 
          trimmedLine.length < 5 ||
          /^(CERRI|Totale|Subtotale|TOTALE|SUBTOTALE|per|:)/i.test(trimmedLine) ||
          /^\d+\s*$/.test(trimmedLine)) {
        continue;
      }
      
      // Pattern più flessibile per il formato della fattura
      // Esempio: 0,7424122A113TREAnthurium zafiraNL17,76x109956
      const articoloPattern = /^(\d+[.,]\d+)(\d{5})([A-Z])(\d{3})([A-Z]{2,4})([A-Za-z\s]+)([A-Z]{2})(\d+[.,]\d+)x(\d+)$/;
      const match = trimmedLine.match(articoloPattern);
      
      if (match) {
        const articolo: any = {
          // Quantità (primo numero con decimali)
          quantita: parseFloat(match[1].replace(',', '.')),
          // Codice prodotto (5 cifre)
          codice_prodotto: match[2],
          // Qualità (una lettera)
          qualita: match[3],
          // Altezza (3 cifre)
          altezza: match[4],
          // Colore (2-4 lettere)
          colore: match[5],
          // Nome prodotto (testo)
          nome: match[6].trim(),
          // Provenienza (2 lettere)
          provenienza: match[7],
          // Prezzo unitario (numero con decimali)
          prezzo_unitario: parseFloat(match[8].replace(',', '.')),
          // Codice interno (dopo la x)
          codice_interno: match[9],
          // Campi da completare manualmente
          gruppo: '',
          prodotto: '',
          varieta: '',
          imballo: 1
        };
        
        // Calcola totale
        articolo.totale = articolo.quantita * articolo.prezzo_unitario;
        
        // Mappa colore a nome completo
        const coloriMap: { [key: string]: string } = {
          'ROS': 'Rosso',
          'BI': 'Bianco',
          'VER': 'Verde',
          'BL': 'Blu',
          'GIA': 'Giallo',
          'RO': 'Rosa',
          'TRE': 'Tricolore',
          'CHA': 'Champagne',
          'BIC': 'Bianco',
          'VECH': 'Verde',
          'VERR': 'Verde',
          'BLA': 'Blu',
          'VIC': 'Viola',
          'CEH': 'Cremisi',
          'MILR': 'Millefiori',
          'VERH': 'Verde'
        };
        articolo.colore = coloriMap[articolo.colore] || articolo.colore;
        
        // Mappa provenienza a nome completo
        const provenienzeMap: { [key: string]: string } = {
          'NL': 'Olanda',
          'ET': 'Etiopia',
          'PT': 'Portogallo',
          'EC': 'Ecuador'
        };
        articolo.provenienza = provenienzeMap[articolo.provenienza] || articolo.provenienza;
        
        // Estrai Gruppo e Varietà dal nome (Prodotto = Varietà nel sistema)
        const nomeCompleto = articolo.nome.toLowerCase();
        if (nomeCompleto.includes('anthurium')) {
          articolo.gruppo = 'Anthurium';
          articolo.varieta = articolo.nome.replace('Anthurium', '').trim();
          articolo.prodotto = articolo.varieta; // Prodotto = Varietà
        } else if (nomeCompleto.includes('chrys') || nomeCompleto.includes('hrys')) {
          articolo.gruppo = 'Crisantemi';
          articolo.varieta = articolo.nome.replace(/chrys|hrys/gi, '').trim();
          articolo.prodotto = articolo.varieta; // Prodotto = Varietà
        } else if (nomeCompleto.includes('hydrange') || nomeCompleto.includes('ydrange')) {
          articolo.gruppo = 'Ortensie';
          articolo.varieta = articolo.nome.replace(/hydrange|ydrange/gi, '').trim();
          articolo.prodotto = articolo.varieta; // Prodotto = Varietà
        } else if (nomeCompleto.includes('rosa') || nomeCompleto.includes('osa')) {
          articolo.gruppo = 'Rose';
          articolo.varieta = articolo.nome.replace(/rosa|osa/gi, '').trim();
          articolo.prodotto = articolo.varieta; // Prodotto = Varietà
        } else if (nomeCompleto.includes('delphinium')) {
          articolo.gruppo = 'Delfini';
          articolo.varieta = articolo.nome.replace('delphinium', '').trim();
          articolo.prodotto = articolo.varieta; // Prodotto = Varietà
        } else if (nomeCompleto.includes('paeonia')) {
          articolo.gruppo = 'Peonie';
          articolo.varieta = articolo.nome.replace('paeonia', '').trim();
          articolo.prodotto = articolo.varieta; // Prodotto = Varietà
        } else if (nomeCompleto.includes('antirrhinum')) {
          articolo.gruppo = 'Bocche di Leone';
          articolo.varieta = articolo.nome.replace('antirrhinum', '').trim();
          articolo.prodotto = articolo.varieta; // Prodotto = Varietà
        } else {
          // Fallback generico
          articolo.gruppo = 'Fiori';
          articolo.varieta = articolo.nome;
          articolo.prodotto = articolo.varieta; // Prodotto = Varietà
        }
        
        articoli.push(articolo);
        console.log('✅ Articolo trovato:', articolo.nome, articolo.quantita, articolo.prezzo_unitario, articolo.colore, articolo.gruppo);
      }
    }
    
    result.articoli = articoli;
    console.log(`✅ Trovati ${articoli.length} articoli`);
    
  } catch (error) {
    console.error('❌ Errore parsing intelligente PDF:', error);
  }

  return result;
}

// Endpoint per salvare mappatura campi PDF
app.post('/api/pdf-parser/save-mapping', (req, res) => {
  try {
    const { fornitore_id, mapping, name } = req.body;
    const db = readDatabase();
    
    // Salva la mappatura nel database
    if (!db.pdf_mappings) {
      db.pdf_mappings = [];
    }
    
    const newMapping = {
      id: Date.now(),
      fornitore_id: parseInt(fornitore_id),
      name: name || `Mappatura ${new Date().toLocaleDateString()}`,
      mapping,
      created_at: new Date().toISOString()
    };
    
    db.pdf_mappings.push(newMapping);
    writeDatabase(db);
    
    res.json({
      success: true,
      mapping: newMapping
    });
    
  } catch (error) {
    console.error('❌ Errore salvataggio mappatura:', error);
    res.status(500).json({ error: 'Errore durante il salvataggio della mappatura' });
  }
});

// Endpoint per ottenere mappature salvate
app.get('/api/pdf-parser/mappings/:fornitore_id', (req, res) => {
  try {
    const db = readDatabase();
    const fornitore_id = parseInt(req.params.fornitore_id);
    
    if (!db.pdf_mappings) {
      return res.json([]);
    }
    
    const mappings = db.pdf_mappings.filter((m: any) => m.fornitore_id === fornitore_id);
    res.json(mappings);
    
  } catch (error) {
    console.error('❌ Errore recupero mappature:', error);
    res.status(500).json({ error: 'Errore durante il recupero delle mappature' });
  }
});

// Parsing con mappatura personalizzata
app.post('/api/pdf-parser/parse-with-mapping', (req, res) => {
  try {
    const { pdfStructure, mapping } = req.body;
    
    const parsedData = parseWithCustomMapping(pdfStructure, mapping);
    
    res.json({
      success: true,
      parsedData
    });
    
  } catch (error) {
    console.error('❌ Errore parsing con mappatura:', error);
    res.status(500).json({ error: 'Errore durante il parsing con mappatura personalizzata' });
  }
});

// Funzione per parsing con mappatura personalizzata
function parseWithCustomMapping(pdfStructure: any, mapping: any) {
  const result: any = {
    numero_fattura: null,
    data_fattura: null,
    totale: null,
    articoli: []
  };

  try {
    // Estrai header data (numero fattura, data, totale)
    if (mapping.header) {
      if (mapping.header.numero_fattura) {
        const line = pdfStructure.lines[mapping.header.numero_fattura.lineIndex];
        if (line && mapping.header.numero_fattura.regex) {
          const match = line.content.match(new RegExp(mapping.header.numero_fattura.regex));
          if (match) result.numero_fattura = match[1] || match[0];
        }
      }
      
      if (mapping.header.data_fattura) {
        const line = pdfStructure.lines[mapping.header.data_fattura.lineIndex];
        if (line && mapping.header.data_fattura.regex) {
          const match = line.content.match(new RegExp(mapping.header.data_fattura.regex));
          if (match) result.data_fattura = match[1] || match[0];
        }
      }
      
      if (mapping.header.totale) {
        const line = pdfStructure.lines[mapping.header.totale.lineIndex];
        if (line && mapping.header.totale.regex) {
          const match = line.content.match(new RegExp(mapping.header.totale.regex));
          if (match) result.totale = parseFloat((match[1] || match[0]).replace(',', '.'));
        }
      }
    }

    // Estrai articoli dalla tabella mappata
    if (mapping.table && mapping.columns) {
      const table = pdfStructure.tables[mapping.table.index];
      if (table) {
        for (const row of table) {
          const articolo: any = {
            quantita: 1,
            prezzo_unitario: 0,
            nome: '',
            gruppo: '',
            varieta: '',
            prodotto: '',
            qualita: '',
            altezza: '',
            colore: '',
            provenienza: '',
            imballo: 1
          };

          // Mappa ogni colonna ai campi dell'articolo
          Object.entries(mapping.columns).forEach(([field, columnInfo]: [string, any]) => {
            if (columnInfo && columnInfo.index !== undefined && row.columns[columnInfo.index]) {
              let value = row.columns[columnInfo.index].content;
              
              // Applica trasformazioni specifiche per campo
              switch (field) {
                case 'quantita':
                case 'prezzo_unitario':
                  articolo[field] = parseFloat(value.replace(',', '.')) || 0;
                  break;
                case 'altezza':
                  articolo[field] = value.replace(/[^\d]/g, '');
                  break;
                default:
                  articolo[field] = value;
              }
            }
          });

          // Calcola totale
          articolo.totale = articolo.quantita * articolo.prezzo_unitario;
          
          // Imposta prodotto = varietà se non specificato diversamente
          if (!articolo.prodotto && articolo.varieta) {
            articolo.prodotto = articolo.varieta;
          }

          // Aggiungi solo se ha dati significativi
          if (articolo.quantita > 0 || articolo.nome.length > 0) {
            result.articoli.push(articolo);
          }
        }
      }
    }

    console.log(`✅ Parsing con mappatura completato: ${result.articoli.length} articoli`);
    
  } catch (error) {
    console.error('❌ Errore parsing con mappatura:', error);
  }

  return result;
}

// Upload e parsing file multi-formato
app.post('/api/file-parser/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    const { fornitore_id } = req.body;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const filePath = req.file.path;
    
    console.log(`📄 File caricato: ${req.file.originalname} (${fileExtension})`);
    
    let parsedData;
    
    try {
      switch (fileExtension) {
        case '.xlsx':
        case '.xls':
          parsedData = await parseExcelFile(filePath);
          break;
        case '.csv':
          parsedData = await parseCSVFile(filePath);
          break;
        case '.xml':
          parsedData = await parseXMLFile(filePath);
          break;
        case '.asc':
        case '.txt':
          parsedData = await parseASCFile(filePath);
          break;
        default:
          throw new Error(`Formato file non supportato: ${fileExtension}`);
      }
      
      // Pulisci file temporaneo
      fs.unlinkSync(filePath);
      
      res.json({
        success: true,
        parsedData,
        fileType: fileExtension,
        filename: req.file.originalname
      });
      
    } catch (parseError) {
      // Pulisci file temporaneo in caso di errore
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw parseError;
    }
    
  } catch (error) {
    console.error('❌ Errore parsing file:', error);
    res.status(500).json({ 
      error: 'Errore durante il parsing del file',
      details: (error as Error).message 
    });
  }
});

// Funzioni di parsing per diversi formati
async function parseExcelFile(filePath: string) {
  console.log('📊 Parsing file Excel...');
  
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  const worksheet = workbook.Sheets[sheetNames[0]]; // Prima sheet
  
  // Converti in JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Filtra righe vuote
  const filteredData = jsonData.filter((row: any) => 
    Array.isArray(row) && row.some(cell => cell != null && cell !== '')
  );
  
  if (filteredData.length < 2) {
    throw new Error('File Excel vuoto o senza dati validi');
  }
  
  // Usa parser intelligente per analisi avanzata
  const analysis = intelligentParser.analyzeFile(filteredData as any[][]);
  
  return {
    sheets: sheetNames,
    data: filteredData,
    headers: filteredData[0] || [],
    rows: filteredData.slice(1),
    totalRows: filteredData.length - 1,
    intelligentAnalysis: analysis
  };
}

async function parseCSVFile(filePath: string) {
  console.log('📄 Parsing file CSV...');
  
  return new Promise((resolve, reject) => {
    // Leggi prima il contenuto per rilevare il formato
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Controlla se è un file Lombarda Flor
    const isLombardaFormat = content.includes('Oggi,nbolla,CodArt,DescArt,Modello,Qta,SteliPerMazzo,PrezzoUnitLordo') ||
                             content.includes('*LOMBARDA FLOR');
    
    if (isLombardaFormat) {
      console.log('🌸 Rilevato formato Lombarda Flor CSV - uso parser specifico');
      
      try {
        const lombardaData = lombardaCSVParser.parseLombardaCSV(content);
        const gestionaleData = lombardaCSVParser.toGestionaleFormat(lombardaData);
        
        // Converti in formato standard per compatibilità
        const headers = ['gruppo', 'prodotto', 'varieta', 'colore', 'altezza', 'qualita', 'provenienza', 'imballo', 'quantita', 'prezzoAcquisto'];
        const rows = gestionaleData.map(item => [
          item.gruppo, item.prodotto, item.varieta, item.colore, 
          item.altezza, item.qualita, item.provenienza, item.imballo, 
          item.quantita, item.prezzoAcquisto
        ]);
        
        resolve({
          headers,
          rows: gestionaleData,
          totalRows: gestionaleData.length,
          data: [headers, ...rows],
          lombardaMetadata: lombardaData.metadata,
          isLombardaFormat: true,
          intelligentAnalysis: {
            columns: [],
            suggestedMapping: {
              'gruppo': 0,
              'prodotto': 1, 
              'varieta': 2,
              'colore': 3,
              'altezza': 4,
              'qualita': 5,
              'provenienza': 6,
              'imballo': 7,
              'quantita': 8,
              'prezzoAcquisto': 9
            },
            formatType: 'invoice' as const,
            confidence: 0.95
          }
        });
        
      } catch (error) {
        console.error('❌ Errore parsing Lombarda CSV:', error);
        reject(error);
        return;
      }
    } else {
      // Parsing CSV standard
      const results: any[] = [];
      const headers: string[] = [];
      let isFirstRow = true;
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers.push(...headerList);
        })
        .on('data', (data) => {
          if (isFirstRow) {
            isFirstRow = false;
          }
          results.push(data);
        })
        .on('end', () => {
          const data = [headers, ...results.map(row => Object.values(row))];
          
          // Analisi intelligente
          let analysis = null;
          try {
            analysis = intelligentParser.analyzeFile(data as any[][]);
          } catch (error) {
            console.warn('⚠️ Errore analisi intelligente CSV:', error);
          }
          
          resolve({
            headers,
            rows: results,
            totalRows: results.length,
            data,
            intelligentAnalysis: analysis
          });
        })
        .on('error', reject);
    }
  });
}

async function parseXMLFile(filePath: string) {
  console.log('🔗 Parsing file XML...');
  
  return new Promise((resolve, reject) => {
    const xmlContent = fs.readFileSync(filePath, 'utf8');
    
    parseXML(xmlContent, { explicitArray: false }, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Estrai i dati in formato tabellare
      const extractedData = extractDataFromXML(result);
      
      resolve({
        xmlStructure: result,
        headers: extractedData.headers,
        rows: extractedData.rows,
        totalRows: extractedData.rows.length,
        data: [extractedData.headers, ...extractedData.rows]
      });
    });
  });
}

async function parseASCFile(filePath: string) {
  console.log('📝 Parsing file ASC/TXT...');
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    throw new Error('File vuoto o non valido');
  }
  
  // Rileva il delimitatore
  const delimiters = ['\t', ';', ',', '|', ' '];
  let bestDelimiter = '\t';
  let maxColumns = 0;
  
  for (const delimiter of delimiters) {
    const testColumns = lines[0].split(delimiter).length;
    if (testColumns > maxColumns) {
      maxColumns = testColumns;
      bestDelimiter = delimiter;
    }
  }
  
  console.log(`🔍 Delimitatore rilevato: "${bestDelimiter}" (${maxColumns} colonne)`);
  
  const rows = lines.map(line => 
    line.split(bestDelimiter).map(cell => cell.trim())
  );
  
  const headers = rows[0] || [];
  const dataRows = rows.slice(1);
  
  return {
    delimiter: bestDelimiter,
    headers,
    rows: dataRows,
    totalRows: dataRows.length,
    data: rows
  };
}

function extractDataFromXML(xmlObj: any): { headers: string[], rows: any[][] } {
  // Funzione ricorsiva per estrarre dati da strutture XML complesse
  
  // Cerca arrays di oggetti (probabilmente record)
  function findArrays(obj: any, path = ''): any[] {
    const arrays: any[] = [];
    
    if (Array.isArray(obj)) {
      arrays.push({ path, data: obj });
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        arrays.push(...findArrays(value, newPath));
      }
    }
    
    return arrays;
  }
  
  const arrays = findArrays(xmlObj);
  
  if (arrays.length === 0) {
    // Nessun array trovato, prova a convertire l'oggetto singolo
    const flatObj = flattenObject(xmlObj);
    return {
      headers: Object.keys(flatObj),
      rows: [Object.values(flatObj)]
    };
  }
  
  // Usa il primo array significativo
  const targetArray = arrays.find(arr => arr.data.length > 0) || arrays[0];
  
  if (!targetArray || !targetArray.data.length) {
    throw new Error('Nessun dato tabellare trovato nel file XML');
  }
  
  // Estrai headers dal primo elemento
  const firstItem = targetArray.data[0];
  const flatFirstItem = flattenObject(firstItem);
  const headers = Object.keys(flatFirstItem);
  
  // Estrai righe
  const rows = targetArray.data.map((item: any) => {
    const flatItem = flattenObject(item);
    return headers.map(header => flatItem[header] || '');
  });
  
  return { headers, rows };
}

function flattenObject(obj: any, prefix = ''): any {
  const flattened: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

// Conferma e crea fattura da dati parsati
app.post('/api/pdf-parser/confirm', (req, res) => {
  try {
    const { parsedData, fornitore_id } = req.body;
    const db = readDatabase();
    
    // Crea la fattura
    const nuovaFattura = {
      id: Math.floor(Date.now() + Math.random()),
      numero: parsedData.numero_fattura,
      tipo: 'acquisto',
      fornitore_id: parseInt(fornitore_id),
      data: parsedData.data_fattura,
      totale: parsedData.totale,
      stato: 'bozza',
      created_at: new Date().toISOString()
    };
    
    db.fatture.push(nuovaFattura);
    
    // Crea i dettagli della fattura
    const dettagliFattura = parsedData.articoli.map((articolo: any) => ({
      id: Math.floor(Date.now() + Math.random()),
      fattura_id: nuovaFattura.id,
      varieta_id: articolo.varieta_id || null,
      nome_articolo: articolo.nome,
      quantita: articolo.quantita,
      prezzo_unitario: articolo.prezzo_unitario,
      totale: articolo.totale,
      created_at: new Date().toISOString()
    }));
    
    db.dettagli_fattura.push(...dettagliFattura);
    
    writeDatabase(db);
    
    res.json({
      success: true,
      fattura: nuovaFattura,
      dettagli: dettagliFattura
    });
    
  } catch (error) {
    console.error('❌ Errore creazione fattura:', error);
    res.status(500).json({ error: 'Errore durante la creazione della fattura' });
  }
});

// ===== ENDPOINTS IMAGE DOWNLOADER =====

// Ottieni varietà disponibili per download immagini
app.get('/api/images/varieta-disponibili', (req, res) => {
  try {
    const db = readDatabase();
    
    // Trova varietà con giacenze > 0
    const varietaDisponibili = db.varieta
      .map((v: any) => {
        const giacenze = db.giacenze.filter((g: any) => g.varieta_id === v.id);
        const quantita_totale = giacenze.reduce((sum: number, g: any) => sum + (g.quantita || 0), 0);
        const gruppo = db.gruppi.find((g: any) => g.id === v.gruppo_id);
        
        return {
          id: v.id,
          nome: v.nome,
          gruppo_nome: gruppo ? gruppo.nome : '',
          quantita_totale,
          image_path: v.image_path,
          has_image: v.image_path && v.image_path !== '' ? 1 : 0
        };
      })
      .filter((v: any) => v.quantita_totale > 0)
      .sort((a: any, b: any) => b.quantita_totale - a.quantita_totale);
    
    res.json({
      success: true,
      data: varietaDisponibili,
      count: varietaDisponibili.length
    });
  } catch (error) {
    console.error('Errore caricamento varietà disponibili:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// Download immagini per varietà selezionate (temporaneamente disabilitato)
app.post('/api/images/download-batch', async (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Funzionalità temporaneamente non disponibile'
  });
});

// Upload immagine per varietà
app.post('/api/images/upload-varieta', imageUpload.single('image'), async (req, res) => {
  try {
    console.log('📸 POST /api/images/upload-varieta');
    
    // Verifica che multer sia configurato
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nessun file caricato'
      });
    }
    
    const { varieta_id, varieta_nome } = req.body;
    
    if (!varieta_id || !varieta_nome) {
      return res.status(400).json({
        success: false,
        error: 'varieta_id e varieta_nome sono richiesti'
      });
    }
    
    // Genera nome file univoco
    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${varieta_nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.${fileExtension}`;
    
    // Salva il file nella cartella varieta
    const uploadPath = path.join(__dirname, '../public/images/varieta', fileName);
    fs.writeFileSync(uploadPath, req.file.buffer);
    
    // Aggiorna il database con il percorso dell'immagine
    const db = readDatabase();
    const varietaIndex = db.varieta.findIndex((v: any) => v.id === parseInt(varieta_id));
    
    if (varietaIndex !== -1) {
      db.varieta[varietaIndex].image_path = `/images/varieta/${fileName}`;
      writeDatabase(db);
      
      console.log(`✅ Immagine salvata per varietà ${varieta_nome}: ${fileName}`);
      
      res.json({
        success: true,
        message: 'Immagine caricata con successo',
        image_path: `/images/varieta/${fileName}`,
        varieta_id: parseInt(varieta_id),
        varieta_nome
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Varietà non trovata'
      });
    }
    
  } catch (error) {
    console.error('❌ Errore upload immagine varietà:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// === API STATISTICHE FORNITORI AVANZATE ===
app.get('/api/statistiche/fornitori-dettagliato', (req, res) => {
  try {
    const db = readDatabase();
    
    console.log('📊 GET /api/statistiche/fornitori-dettagliato');
    
    // Verifica che il database abbia i dati necessari
    if (!db.fornitori || !db.fatture || !db.dettagli_fatture || !db.varieta) {
      return res.json({
        fornitori: [],
        totali: {
          fornitori_attivi: 0,
          fatture_totali: 0,
          importo_totale: 0,
          da_pagare_totale: 0,
          scaduto_totale: 0,
          top_fornitori: []
        }
      });
    }
    
    // Calcola statistiche dettagliate per ogni fornitore
    const fornitori_stats = db.fornitori.map((fornitore: any) => {
    const fatture_fornitore = db.fatture.filter((f: any) => 
      f.fornitore_id === fornitore.id && f.tipo === 'acquisto'
    );
    
    const totale_fatture = fatture_fornitore.length;
    const totale_speso = fatture_fornitore.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
    const media_fattura = totale_fatture > 0 ? totale_speso / totale_fatture : 0;
    
    // Fatture da pagare (emesse ma non pagate)
    const fatture_da_pagare = fatture_fornitore.filter((f: any) => f.stato === 'emessa');
    const importo_da_pagare = fatture_da_pagare.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
    
    // Fatture pagate
    const fatture_pagate = fatture_fornitore.filter((f: any) => f.stato === 'pagata');
    const importo_pagato = fatture_pagate.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
    
    // Fatture scadute (da pagare e con scadenza passata)
    const oggi = new Date().toISOString().split('T')[0];
    const fatture_scadute = fatture_da_pagare.filter((f: any) => f.scadenza && f.scadenza < oggi);
    const importo_scaduto = fatture_scadute.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
    
    // Ultima fattura e prossima scadenza
    const ultima_fattura = fatture_fornitore
      .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
    
    const prossima_scadenza = fatture_da_pagare
      .filter((f: any) => f.scadenza && f.scadenza >= oggi)
      .sort((a: any, b: any) => new Date(a.scadenza).getTime() - new Date(b.scadenza).getTime())[0];
    
    // Varietà acquistate da questo fornitore
    const dettagli_fornitore = db.dettagli_fatture.filter((d: any) => 
      fatture_fornitore.some((f: any) => f.id === d.fattura_id)
    );
    
    const varieta_acquistate = new Set();
    let quantita_totale = 0;
    
    dettagli_fornitore.forEach((d: any) => {
      const varieta = db.varieta.find((v: any) => v.id === d.varieta_id);
      if (varieta) {
        varieta_acquistate.add(varieta.nome);
        quantita_totale += d.quantita || 0;
      }
    });
    
    return {
      ...fornitore,
      statistiche: {
        totale_fatture,
        totale_speso,
        media_fattura,
        fatture_da_pagare: fatture_da_pagare.length,
        importo_da_pagare,
        fatture_pagate: fatture_pagate.length,
        importo_pagato,
        fatture_scadute: fatture_scadute.length,
        importo_scaduto,
        varietà_acquistate: Array.from(varieta_acquistate),
        quantita_totale,
        ultima_fattura: ultima_fattura ? {
          numero: ultima_fattura.numero,
          data: ultima_fattura.data,
          importo: ultima_fattura.totale
        } : null,
        prossima_scadenza: prossima_scadenza ? {
          numero: prossima_scadenza.numero,
          scadenza: prossima_scadenza.scadenza,
          importo: prossima_scadenza.totale
        } : null
      }
    };
  });
  
  // Calcola totali generali
  const totali = {
    fornitori_attivi: fornitori_stats.filter((f: any) => f.attivo).length,
    fatture_totali: fornitori_stats.reduce((sum: number, f: any) => sum + f.statistiche.totale_fatture, 0),
    importo_totale: fornitori_stats.reduce((sum: number, f: any) => sum + f.statistiche.totale_speso, 0),
    da_pagare_totale: fornitori_stats.reduce((sum: number, f: any) => sum + f.statistiche.importo_da_pagare, 0),
    scaduto_totale: fornitori_stats.reduce((sum: number, f: any) => sum + f.statistiche.importo_scaduto, 0),
    top_fornitori: fornitori_stats
      .sort((a: any, b: any) => b.statistiche.totale_speso - a.statistiche.totale_speso)
      .slice(0, 5)
      .map((f: any) => ({
        nome: f.nome,
        importo: f.statistiche.totale_speso,
        fatture: f.statistiche.totale_fatture
      }))
  };
  
  console.log(`📈 Statistiche fornitori calcolate:`, {
    fornitori: fornitori_stats.length,
    da_pagare: totali.da_pagare_totale,
    scaduto: totali.scaduto_totale
  });
  
    res.json({
      fornitori: fornitori_stats,
      totali
    });
  } catch (error) {
    console.error('Errore calcolo statistiche fornitori dettagliato:', error);
    res.status(500).json({
      fornitori: [],
      totali: {
        fornitori_attivi: 0,
        fatture_totali: 0,
        importo_totale: 0,
        da_pagare_totale: 0,
        scaduto_totale: 0,
        top_fornitori: []
      }
    });
  }
});

// Route per aggiornare stato pagamento fattura
app.patch('/api/fatture/:id/pagamento', (req, res) => {
  const db = readDatabase();
  const fatturaId = parseInt(req.params.id);
  const { stato, data_pagamento, metodo_pagamento, note } = req.body;
  
  console.log(`💰 PATCH /api/fatture/${fatturaId}/pagamento - Stato: ${stato}`);
  
  const fattura = db.fatture.find((f: any) => f.id === fatturaId);
  if (!fattura) {
    return res.status(404).json({ error: 'Fattura non trovata' });
  }
  
  // Aggiorna stato pagamento
  fattura.stato = stato;
  if (data_pagamento) fattura.data_pagamento = data_pagamento;
  if (metodo_pagamento) fattura.metodo_pagamento = metodo_pagamento;
  if (note) fattura.note_pagamento = note;
  
  writeDatabase(db);
  
  console.log(`✅ Pagamento fattura ${fattura.numero} aggiornato: ${stato}`);
  
  res.json(fattura);
});

// === API STATISTICHE CLIENTI DETTAGLIATE ===
app.get('/api/statistiche/clienti-dettagliato', (req, res) => {
  try {
    const db = readDatabase();
    
    console.log('📊 GET /api/statistiche/clienti-dettagliato');
    
    // Verifica che il database abbia i dati necessari
    if (!db.clienti || !db.fatture || !db.dettagli_fatture || !db.varieta) {
      return res.json({
        clienti: [],
        totali: {
          clienti_attivi: 0,
          fatture_totali: 0,
          importo_totale: 0,
          da_incassare_totale: 0,
          scaduto_totale: 0,
          top_clienti: []
        }
      });
    }
    
    // Calcola statistiche dettagliate per ogni cliente
    const clienti_stats = db.clienti.map((cliente: any) => {
    const fatture_cliente = db.fatture.filter((f: any) => 
      f.cliente_id === cliente.id && f.tipo === 'vendita'
    );
    
    const totale_fatture = fatture_cliente.length;
    const totale_venduto = fatture_cliente.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
    const media_fattura = totale_fatture > 0 ? totale_venduto / totale_fatture : 0;
    
    // Fatture da incassare (emesse ma non pagate)
    const fatture_da_incassare = fatture_cliente.filter((f: any) => f.stato === 'emessa');
    const importo_da_incassare = fatture_da_incassare.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
    
    // Fatture incassate
    const fatture_incassate = fatture_cliente.filter((f: any) => f.stato === 'pagata');
    const importo_incassato = fatture_incassate.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
    
    // Fatture scadute (da incassare e con scadenza passata)
    const oggi = new Date().toISOString().split('T')[0];
    const fatture_scadute = fatture_da_incassare.filter((f: any) => f.scadenza && f.scadenza < oggi);
    const importo_scaduto = fatture_scadute.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
    
    // Ultima fattura e prossima scadenza
    const ultima_fattura = fatture_cliente
      .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
    
    const prossima_scadenza = fatture_da_incassare
      .filter((f: any) => f.scadenza && f.scadenza >= oggi)
      .sort((a: any, b: any) => new Date(a.scadenza).getTime() - new Date(b.scadenza).getTime())[0];
    
    // Varietà vendute a questo cliente
    const dettagli_cliente = db.dettagli_fatture.filter((d: any) => 
      fatture_cliente.some((f: any) => f.id === d.fattura_id)
    );
    
    const varieta_vendute = new Set();
    let quantita_totale = 0;
    
    dettagli_cliente.forEach((d: any) => {
      const varieta = db.varieta.find((v: any) => v.id === d.varieta_id);
      if (varieta) {
        varieta_vendute.add(varieta.nome);
        quantita_totale += d.quantita || 0;
      }
    });
    
    // Valore cliente (LTV - Lifetime Value)
    const mesi_attivita = fatture_cliente.length > 0 ? 
      (new Date().getTime() - new Date(fatture_cliente[0].data).getTime()) / (1000 * 60 * 60 * 24 * 30) : 0;
    const frequenza_acquisto = mesi_attivita > 0 ? totale_fatture / mesi_attivita : 0;
    
    return {
      ...cliente,
      statistiche: {
        totale_fatture,
        totale_venduto,
        media_fattura,
        fatture_da_incassare: fatture_da_incassare.length,
        importo_da_incassare,
        fatture_incassate: fatture_incassate.length,
        importo_incassato,
        fatture_scadute: fatture_scadute.length,
        importo_scaduto,
        varietà_vendute: Array.from(varieta_vendute),
        quantita_totale,
        frequenza_acquisto,
        valore_cliente: totale_venduto, // LTV semplificato
        ultima_fattura: ultima_fattura ? {
          numero: ultima_fattura.numero,
          data: ultima_fattura.data,
          importo: ultima_fattura.totale
        } : null,
        prossima_scadenza: prossima_scadenza ? {
          numero: prossima_scadenza.numero,
          scadenza: prossima_scadenza.scadenza,
          importo: prossima_scadenza.totale
        } : null
      }
    };
  });
  
  // Calcola totali generali
  const totali = {
    clienti_attivi: clienti_stats.filter((c: any) => c.statistiche.totale_fatture > 0).length,
    fatture_totali: clienti_stats.reduce((sum: number, c: any) => sum + c.statistiche.totale_fatture, 0),
    importo_totale: clienti_stats.reduce((sum: number, c: any) => sum + c.statistiche.totale_venduto, 0),
    da_incassare_totale: clienti_stats.reduce((sum: number, c: any) => sum + c.statistiche.importo_da_incassare, 0),
    scaduto_totale: clienti_stats.reduce((sum: number, c: any) => sum + c.statistiche.importo_scaduto, 0),
    top_clienti: clienti_stats
      .sort((a: any, b: any) => b.statistiche.totale_venduto - a.statistiche.totale_venduto)
      .slice(0, 5)
      .map((c: any) => ({
        nome: c.nome,
        importo: c.statistiche.totale_venduto,
        fatture: c.statistiche.totale_fatture
      }))
  };
  
  console.log(`📈 Statistiche clienti calcolate:`, {
    clienti: clienti_stats.length,
    da_incassare: totali.da_incassare_totale,
    scaduto: totali.scaduto_totale
  });
  
    res.json({
      clienti: clienti_stats,
      totali
    });
  } catch (error) {
    console.error('Errore calcolo statistiche clienti dettagliato:', error);
    res.status(500).json({
      clienti: [],
      totali: {
        clienti_attivi: 0,
        fatture_totali: 0,
        importo_totale: 0,
        da_incassare_totale: 0,
        scaduto_totale: 0,
        top_clienti: []
      }
    });
  }
});

// Route per gestire incassi clienti
app.patch('/api/fatture/:id/incasso', (req, res) => {
  const db = readDatabase();
  const fatturaId = parseInt(req.params.id);
  const { stato, data_incasso, metodo_incasso, note } = req.body;
  
  console.log(`💰 PATCH /api/fatture/${fatturaId}/incasso - Stato: ${stato}`);
  
  const fattura = db.fatture.find((f: any) => f.id === fatturaId);
  if (!fattura) {
    return res.status(404).json({ error: 'Fattura non trovata' });
  }
  
  // Aggiorna stato incasso
  fattura.stato = stato;
  if (data_incasso) fattura.data_incasso = data_incasso;
  if (metodo_incasso) fattura.metodo_incasso = metodo_incasso;
  if (note) fattura.note_incasso = note;
  
  writeDatabase(db);
  
  console.log(`✅ Incasso fattura ${fattura.numero} aggiornato: ${stato}`);
  
  res.json(fattura);
});

// === API AVVIO SERVER ===

// Avvia il server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log(`🌐 API disponibili su: http://localhost:${PORT}/api`);
  console.log(`✅ Server pronto per ricevere richieste`);
});

// Gestione errori del server
server.on('error', (error) => {
  console.error('❌ Errore del server:', error);
});

server.on('listening', () => {
  console.log('🎯 Server in ascolto sulla porta', PORT);
}); 