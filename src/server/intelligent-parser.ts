// Parser intelligente per riconoscimento automatico formati fatture/listini
import * as XLSX from 'xlsx';

export interface ParsedColumn {
  index: number;
  name: string;
  type: 'quantity' | 'price' | 'code' | 'description' | 'date' | 'text' | 'number';
  confidence: number;
  samples: string[];
  suggestedField?: string;
}

export interface IntelligentParseResult {
  columns: ParsedColumn[];
  dataPreview: any[][];
  suggestedMapping: Record<string, number>;
  formatType: 'invoice' | 'pricelist' | 'catalog' | 'unknown';
  confidence: number;
}

export class IntelligentFileParser {
  
  // Dizionario per riconoscimento campi comuni
  private fieldPatterns = {
    quantity: [
      /^(q|qty|quantit[àa]|pezzi|pz|steli|stem|numero|nr|pieces)$/i,
      /^(qta|quantidade|cantidad|menge)$/i,
      /^(stelipermazo|steli.*mazo|stem.*bunch)$/i
    ],
    price: [
      /^(prezzo|price|precio|preis|prix)$/i,
      /^(costo|cost|coste|kosten)$/i,
      /^(prezzounit|prezzo.*unit|unit.*price|price.*unit)$/i,
      /^(prezzounitlordo|prezzo.*lordo|gross.*price)$/i,
      /^(importo|amount|betrag|montant)$/i
    ],
    invoice_number: [
      /^(fattura|invoice|bolla|nbolla|numero.*bolla|doc|documento)$/i,
      /^(num.*fat|fat.*num|invoice.*num)$/i,
      /^(riferimento|ref|reference)$/i
    ],
    code: [
      /^(cod|code|codigo|artikel|sku|id)$/i,
      /^(codart|cod.*art|article.*code|art.*code)$/i,
      /^(coddart|codice.*articolo|item.*code)$/i,
      /^(ean|barcode|gtin)$/i
    ],
    description: [
      /^(desc|description|descrizione|bezeichnung)$/i,
      /^(descart|desc.*art|article.*desc)$/i,
      /^(nome|name|artikel.*name|product.*name)$/i,
      /^(denominazione|designation|produto)$/i,
      /^(modello|model|modelo|modell)$/i
    ],
    variety: [
      /^(variet[àa]|variety|variedad|sorte)$/i,
      /^(tipo|type|typ|genre)$/i,
      /^(specie|species|especie|art)$/i
    ],
    color: [
      /^(colore|color|colour|farbe|couleur)$/i,
      /^(tinta|shade|ton|nuance)$/i
    ],
    height: [
      /^(altezza|height|altura|hoehe|hauteur)$/i,
      /^(lunghezza|length|longitud|laenge|longueur)$/i,
      /^(cm|inch|pollici)$/i
    ],
    quality: [
      /^(qualit[àa]|quality|calidad|qualitaet)$/i,
      /^(grado|grade|nota|note)$/i,
      /^(classe|class|categoria|category)$/i
    ],
    origin: [
      /^(origine|origin|origen|herkunft|origine)$/i,
      /^(provenienza|provenance|procedencia)$/i,
      /^(paese|country|pais|land|pays)$/i,
      /^(nazionalit[àa]|nationality|nacionalidad)$/i
    ],
    date: [
      /^(data|date|fecha|datum|oggi|today)$/i,
      /^(giorno|day|dia|tag|jour)$/i,
      /^(data.*fat|fat.*data|invoice.*date)$/i
    ]
  };

  // Patterns per riconoscere tipi di valore
  private valuePatterns = {
    price: /^\d+[.,]\d{2,4}$/,
    quantity: /^\d+([.,]\d{1,3})?$/,
    date: /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/,
    code: /^[A-Z0-9\-_]{3,}$/i,
    percentage: /^\d+[.,]?\d*\s*%$/
  };

  analyzeFile(data: any[][], filename?: string): IntelligentParseResult {
    if (!data || data.length < 2) {
      throw new Error('File vuoto o senza dati sufficienti');
    }

    const headers = data[0];
    const rows = data.slice(1, Math.min(21, data.length)); // Prime 20 righe per analisi

    // Analizza ogni colonna
    const columns = headers.map((header, index) => 
      this.analyzeColumn(header, index, rows.map(row => row[index]))
    );

    // Determina il tipo di file
    const formatType = this.detectFileFormat(columns, rows);

    // Crea mappatura suggerita
    const suggestedMapping = this.createSuggestedMapping(columns);

    // Calcola confidenza generale
    const confidence = this.calculateOverallConfidence(columns, formatType);

    return {
      columns,
      dataPreview: data.slice(0, 10),
      suggestedMapping,
      formatType,
      confidence
    };
  }

  private analyzeColumn(header: string, index: number, values: any[]): ParsedColumn {
    const samples = values.filter(v => v != null && v !== '').slice(0, 5).map(v => String(v));
    
    // Analizza il nome della colonna
    const fieldType = this.detectFieldType(header);
    
    // Analizza i valori
    const valueType = this.detectValueType(samples);
    
    // Combina analisi per determinare il tipo finale
    const finalType = fieldType.type || valueType.type || 'text';
    const confidence = Math.max(fieldType.confidence, valueType.confidence);
    
    // Suggerisci campo del gestionale
    const suggestedField = this.suggestGestionaleField(finalType, header, samples);

    return {
      index,
      name: header,
      type: finalType as any,
      confidence,
      samples,
      suggestedField
    };
  }

  private detectFieldType(header: string): { type: string | null, confidence: number } {
    for (const [fieldType, patterns] of Object.entries(this.fieldPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(header)) {
          return { type: fieldType, confidence: 0.9 };
        }
      }
    }
    return { type: null, confidence: 0 };
  }

  private detectValueType(samples: string[]): { type: string, confidence: number } {
    if (samples.length === 0) return { type: 'text', confidence: 0.1 };

    let typeScores: Record<string, number> = {
      price: 0,
      quantity: 0,
      date: 0,
      code: 0,
      text: 0,
      number: 0
    };

    for (const sample of samples) {
      if (this.valuePatterns.price.test(sample)) typeScores.price++;
      else if (this.valuePatterns.quantity.test(sample)) typeScores.quantity++;
      else if (this.valuePatterns.date.test(sample)) typeScores.date++;
      else if (this.valuePatterns.code.test(sample)) typeScores.code++;
      else if (!isNaN(Number(sample.replace(',', '.')))) typeScores.number++;
      else typeScores.text++;
    }

    const maxScore = Math.max(...Object.values(typeScores));
    const detectedType = Object.keys(typeScores).find(key => typeScores[key] === maxScore) || 'text';
    const confidence = maxScore / samples.length;

    return { type: detectedType, confidence };
  }

  private suggestGestionaleField(type: string, header: string, samples: string[]): string | undefined {
    const mapping: Record<string, string[]> = {
      'quantita': ['quantity'],
      'prezzo_unitario': ['price'],
      'gruppo': ['description', 'text'],
      'prodotto': ['description', 'code'],
      'varieta': ['description', 'variety'],
      'colore': ['color', 'text'],
      'altezza': ['height', 'text'],
      'qualita': ['quality', 'text'],
      'provenienza': ['origin', 'text'],
      'data': ['date']
    };

    // Ricerca diretta per tipo
    for (const [field, types] of Object.entries(mapping)) {
      if (types.includes(type)) {
        // Verifica compatibilità con header
        if (this.isHeaderCompatible(header, field)) {
          return field;
        }
      }
    }

    // Fallback basato su header
    return this.getFieldFromHeader(header);
  }

  private isHeaderCompatible(header: string, field: string): boolean {
    const fieldPatterns = this.fieldPatterns as any;
    if (fieldPatterns[field.replace('_', '')]) {
      return fieldPatterns[field.replace('_', '')].some((pattern: RegExp) => pattern.test(header));
    }
    return false;
  }

  private getFieldFromHeader(header: string): string | undefined {
    const headerLower = header.toLowerCase();
    
    if (/quant|qta|pz|steli/.test(headerLower)) return 'quantita';
    if (/prezzo|price|costo|cost/.test(headerLower)) return 'prezzo_unitario';
    if (/cod|code|sku/.test(headerLower)) return 'prodotto';
    if (/desc|nome|name/.test(headerLower)) return 'varieta';
    if (/colore|color/.test(headerLower)) return 'colore';
    if (/altezza|height|cm/.test(headerLower)) return 'altezza';
    if (/qualit|quality|grado/.test(headerLower)) return 'qualita';
    if (/origine|origin|paese|country/.test(headerLower)) return 'provenienza';
    if (/gruppo|group|categoria/.test(headerLower)) return 'gruppo';
    
    return undefined;
  }

  private detectFileFormat(columns: ParsedColumn[], rows: any[][]): 'invoice' | 'pricelist' | 'catalog' | 'unknown' {
    const hasQuantity = columns.some(c => c.type === 'quantity');
    const hasPrice = columns.some(c => c.type === 'price');
    const hasCode = columns.some(c => c.type === 'code');
    const hasDescription = columns.some(c => c.type === 'description');

    if (hasQuantity && hasPrice && hasCode) return 'invoice';
    if (hasPrice && hasCode && hasDescription) return 'pricelist';
    if (hasCode && hasDescription) return 'catalog';
    
    return 'unknown';
  }

  private createSuggestedMapping(columns: ParsedColumn[]): Record<string, number> {
    const mapping: Record<string, number> = {};
    
    for (const column of columns) {
      if (column.suggestedField && column.confidence > 0.5) {
        mapping[column.suggestedField] = column.index;
      }
    }
    
    return mapping;
  }

  private calculateOverallConfidence(columns: ParsedColumn[], formatType: string): number {
    const avgConfidence = columns.reduce((sum, col) => sum + col.confidence, 0) / columns.length;
    const formatBonus = formatType !== 'unknown' ? 0.2 : 0;
    
    return Math.min(avgConfidence + formatBonus, 1);
  }
}

export const intelligentParser = new IntelligentFileParser(); 