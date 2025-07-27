// Parser specifico per i file CSV di Lombarda Flor
// Formato: Oggi,nbolla,CodArt,DescArt,Modello,Qta,SteliPerMazzo,PrezzoUnitLordo,CodDir,DescrizioneContot

export interface LombardaCSVRow {
  data: string;           // es: "02-06-2025"
  numero_bolla: string;   // es: "5109"
  codice_articolo: string; // es: "VERSMLVAK"
  descrizione: string;    // es: "MAZZI FELCE CUOIO CR VAKUM JR."
  modello: string;        // es: "MAZZI FELCE CUOIO CR VAKUM JR."
  quantita: number;       // es: 40
  steli_per_mazzo: number; // es: 0
  prezzo_unitario: number; // es: 1.45
  codice_dir: string;     // es: "C0074"
  descrizione_fornitore: string; // es: "*LOMBARDA FLOR S.R.L."
}

export interface LombardaParsedData {
  righe: LombardaCSVRow[];
  metadata: {
    numero_fattura?: string;
    data_fattura?: string;
    fornitore?: string;
    totale_righe: number;
    totale_importo?: number;
  };
}

export class LombardaCSVParser {
  
  parseLombardaCSV(csvData: string): LombardaParsedData {
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('File CSV vuoto o malformato');
    }
    
    // Prima riga è l'header, la saltiamo
    const header = lines[0];
    const dataLines = lines.slice(1);
    
    const righe: LombardaCSVRow[] = [];
    let numero_fattura: string | undefined;
    let data_fattura: string | undefined;
    let fornitore: string | undefined;
    let totale_importo = 0;
    
    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      const columns = this.parseCSVLine(line);
      
      if (columns.length >= 8) {
        try {
          const riga: LombardaCSVRow = {
            data: columns[0] || '',
            numero_bolla: columns[1] || '',
            codice_articolo: columns[2] || '',
            descrizione: columns[3] || '',
            modello: columns[4] || '',
            quantita: this.parseNumber(columns[5]) || 0,
            steli_per_mazzo: this.parseNumber(columns[6]) || 0,
            prezzo_unitario: this.parseDecimal(columns[7]) || 0,
            codice_dir: columns[8] || '',
            descrizione_fornitore: columns[9] || ''
          };
          
          // Estrai metadata dalla prima riga valida
          if (!numero_fattura && riga.numero_bolla) {
            numero_fattura = riga.numero_bolla;
          }
          
          if (!data_fattura && riga.data) {
            data_fattura = this.normalizeDate(riga.data);
          }
          
          if (!fornitore && riga.descrizione_fornitore && !riga.descrizione_fornitore.includes('LOMBARDA FLOR')) {
            fornitore = riga.descrizione_fornitore.replace(/^\*/, '').trim();
          }
          
          totale_importo += (riga.quantita * riga.prezzo_unitario);
          righe.push(riga);
          
        } catch (err) {
          console.warn(`Errore parsing riga: ${line}`, err);
        }
      }
    }
    
    return {
      righe,
      metadata: {
        numero_fattura,
        data_fattura,
        fornitore,
        totale_righe: righe.length,
        totale_importo: Math.round(totale_importo * 100) / 100
      }
    };
  }
  
  // Converte i dati parsati nel formato standard del gestionale
  toGestionaleFormat(parsedData: LombardaParsedData): any[] {
    return parsedData.righe.map(riga => {
      // Estrae la varietà dalla descrizione (tutto prima di eventuali numeri di altezza)
      let varieta = riga.modello || riga.descrizione;
      
      // Rimuove codici e pulisce la varietà
      varieta = varieta.replace(/^[A-Z0-9]+,?\s*/i, ''); // Rimuove codici iniziali
      varieta = varieta.replace(/\s*,?\d+(\.\d+)?\s*(cm|CM)?\s*$/i, ''); // Rimuove altezze finali
      varieta = varieta.trim();
      
      // Estrae altezza se presente nella descrizione
      const altezzaMatch = riga.descrizione.match(/(\d+(?:\.\d+)?)\s*(cm|CM)?/);
      const altezza = altezzaMatch ? altezzaMatch[1] : '';
      
      // Determina il colore se presente
      const coloreMatch = varieta.match(/(ROSSO|ROSA|BIANCO|GIALLO|VERDE|VIOLA|BLU|ARANCIO|FUCSIA|CREMA)/i);
      const colore = coloreMatch ? coloreMatch[1] : '';
      
      // Estrae il gruppo dal nome della varietà con logica migliorata
      let gruppo = 'Fiori Generici';
      const varietaLower = varieta.toLowerCase();
      
      if (varietaLower.includes('rosa') || varietaLower.includes('rose')) {
        gruppo = 'Rose';
      } else if (varietaLower.includes('tulip')) {
        gruppo = 'Tulipani';
      } else if (varietaLower.includes('girasol')) {
        gruppo = 'Girasoli';
      } else if (varietaLower.includes('orchid')) {
        gruppo = 'Orchidee';
      } else if (varietaLower.includes('peon')) {
        gruppo = 'Peonie';
      } else if (varietaLower.includes('garofan') || varietaLower.includes('carnation')) {
        gruppo = 'Garofani';
      } else if (varietaLower.includes('crisante') || varietaLower.includes('chrysant')) {
        gruppo = 'Crisantemi';
      } else if (varietaLower.includes('giglio') || varietaLower.includes('lily')) {
        gruppo = 'Gigli';
      } else if (varietaLower.includes('anthurium')) {
        gruppo = 'Anthurium';
      } else if (varietaLower.includes('gerbera')) {
        gruppo = 'Gerbere';
      } else {
        // Prova a usare la prima parola significativa come gruppo
        const primaParola = varieta.split(' ')[0];
        if (primaParola && primaParola.length > 3) {
          gruppo = primaParola;
        }
      }
      
      return {
        // Campi gestionale
        gruppo: gruppo, // Gruppo intelligente estratto
        prodotto: varieta,
        varieta: varieta,
        colore: colore,
        altezza: altezza,
        qualita: '', // Non presente nel CSV
        provenienza: '', // Non presente nel CSV
        imballo: riga.steli_per_mazzo || 1,
        quantita: riga.quantita,
        prezzoAcquisto: riga.prezzo_unitario,
        
        // Dati originali per debug
        _raw: {
          descrizione_originale: riga.descrizione,
          modello_originale: riga.modello,
          codice_articolo: riga.codice_articolo,
          numero_bolla: riga.numero_bolla,
          data: riga.data
        }
      };
    });
  }
  
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  private parseNumber(value: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/[^\d]/g, '');
    return parseInt(cleaned) || 0;
  }
  
  private parseDecimal(value: string): number {
    if (!value) return 0;
    // Sostituisce virgola con punto per parsing
    const normalized = value.replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  private normalizeDate(dateString: string): string {
    // Converte da DD-MM-YYYY a YYYY-MM-DD
    const match = dateString.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  }
}

// Esporta un'istanza del parser
export const lombardaCSVParser = new LombardaCSVParser(); 