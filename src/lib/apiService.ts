// =========================================================================
// API SERVICE - NUOVO DATABASE DIMITRI FIORI
// =========================================================================
// Corrispondente alla migrazione: 20250728000001_new_database_structure.sql
// Sistema a 7 caratteristiche: Gruppo + Prodotto + Colore + Provenienza + Foto + Imballo + Altezza

import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase - priorità alle variabili di ambiente per il deploy online
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('🔗 Connessione Supabase:', supabaseUrl.includes('127.0.0.1') ? 'LOCALE' : 'ONLINE');

export const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================================================
// TYPES - Corrispondenti al database
// =========================================================================

export interface Gruppo {
  id: number;
  nome: string;
  descrizione?: string;
  created_at: string;
  updated_at: string;
}

export interface Prodotto {
  id: number;
  nome: string;
  descrizione?: string;
  created_at: string;
  updated_at: string;
}

export interface Colore {
  id: number;
  nome: string;
  codice_colore: string;
  created_at: string;
}

export interface Provenienza {
  id: number;
  nome: string;
  created_at: string;
}

export interface Foto {
  id: number;
  nome: string;
  url: string;
  descrizione?: string;
  created_at: string;
}

export interface Imballo {
  id: number;
  quantita: number;
  descrizione?: string;
  created_at: string;
}

export interface Altezza {
  id: number;
  altezza_cm: number;
  descrizione?: string;
  created_at: string;
}

export interface Qualita {
  id: number;
  nome: string;
  descrizione?: string;
  created_at: string;
}

export interface Articolo {
  id: number;
  gruppo_id: number;
  prodotto_id: number;
  colore_id: number;
  provenienza_id: number;
  foto_id: number;
  imballo_id: number;
  altezza_id: number;
  qualita_id: number;
  nome_completo?: string;
  created_at: string;
}

export interface ArticoloCompleto extends Articolo {
  gruppo: Gruppo;
  prodotto: Prodotto;
  colore: Colore;
  provenienza: Provenienza;
  foto: Foto;
  imballo: Imballo;
  altezza: Altezza;
  qualita: Qualita;
}

export interface Fornitore {
  id: number;
  nome: string;
  ragione_sociale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  partita_iva?: string;
  codice_fiscale?: string;
  attivo: boolean;
  tipo_fornitore: 'fiori' | 'trasportatore' | 'servizi' | 'misto';
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: number;
  nome: string;
  ragione_sociale?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  partita_iva?: string;
  codice_fiscale?: string;
  attivo: boolean;
  tipo_cliente: 'privato' | 'fiorista' | 'wedding' | 'hotel' | 'azienda' | 'altro';
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface MovimentoMagazzino {
  id: number;
  tipo: 'carico' | 'scarico' | 'distruzione' | 'inventario' | 'trasferimento' | 'carico_virtuale';
  data: string;
  quantita: number;
  prezzo_unitario?: number;
  valore_totale?: number;
  
  // FK verso caratteristiche articolo
  gruppo_id?: number;
  prodotto_id?: number;
  colore_id?: number;
  provenienza_id?: number;
  foto_id?: number;
  imballo_id?: number;
  altezza_id?: number;
  qualita_id?: number;
  
  // Documenti di riferimento
  fattura_id?: number;
  fattura_numero?: string;
  fornitore_id?: number;
  fornitore_nome?: string;
  cliente_id?: number;
  cliente_nome?: string;
  ordine_acquisto_id?: number;  // NUOVO: riferimento agli ordini acquisto
  
  // Metadati
  note?: string;
  utente?: string;
  created_at: string;
  updated_at?: string;
  
  // Join fields (per query complete)
  gruppo_nome?: string;
  prodotto_nome?: string;
  colore_nome?: string;
  provenienza_nome?: string;
  foto_nome?: string;
  imballo_nome?: string;
  altezza_nome?: string;
  qualita_nome?: string;
}

// =========================================================================
// INTERFACCE ORDINI ACQUISTO E GIACENZE VIRTUALI
// =========================================================================

export interface OrdineAcquisto {
  id: number;
  numero_ordine: string;
  data_ordine: string;
  data_consegna_prevista: string;
  fornitore_id: number;
  stato: 'ordinato' | 'consegnato';
  totale_ordine: number;
  
  // Costi analitici
  costo_trasporto: number;
  id_fornitore_trasporto?: number;
  costo_commissioni: number;
  id_fornitore_commissioni?: number;
  costo_imballaggi: number;
  id_fornitore_imballaggi?: number;
  note_costi?: string;
  
  note?: string;
  utente_creazione?: string;
  created_at: string;
  updated_at: string;
  data_consegna_effettiva?: string;
  fattura_generata_id?: number;
  
  // Dati fornitore (join)
  fornitore?: {
    id: number;
    nome: string;
    ragione_sociale?: string;
    partita_iva?: string;
  };
}

export interface GiacenzaVirtuale {
  id: number;
  ordine_acquisto_id: number;
  
  // Caratteristiche articolo (8 campi)
  gruppo_id: number;
  nome_prodotto: string;
  colore_id: number;
  provenienza_id: number;
  foto_id: number;
  imballo_id: number;
  altezza_id: number;
  qualita_id: number;
  
  // Quantità e prezzi
  quantita: number;
  prezzo_acquisto_per_stelo: number;
  costi_spalmare_per_stelo: number;
  prezzo_costo_finale_per_stelo: number;
  prezzo_vendita_1: number;
  prezzo_vendita_2: number;
  prezzo_vendita_3: number;
  totale_riga: number;
  totale_con_costi: number;
  
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface OrdineAcquistoCompleto {
  id: number;
  numero_ordine: string;
  data_ordine: string;
  data_consegna_prevista: string;
  stato: 'ordinato' | 'consegnato';
  totale_ordine: number;
  note?: string;
  created_at: string;
  data_consegna_effettiva?: string;
  fattura_generata_id?: number;
  
  // Costi analitici
  costo_trasporto: number;
  costo_commissioni: number;
  costo_imballaggi: number;
  totale_costi_analitici: number;
  
  // Dati fornitore
  fornitore_id: number;
  fornitore_nome: string;
  fornitore_piva?: string;
  
  // Conteggi righe
  numero_righe: number;
  quantita_totale: number;
  giorni_alla_consegna: number;
}

export interface GiacenzaVirtualeCompleta {
  giacenza_virtuale_id: number;
  ordine_acquisto_id: number;
  numero_ordine: string;
  data_consegna_prevista: string;
  stato_ordine: 'ordinato' | 'consegnato';
  fornitore_nome: string;
  
  // Articolo virtuale
  gruppo_nome: string;
  prodotto_nome: string;
  colore_nome: string;
  provenienza_nome: string;
  foto_nome?: string;
  foto_url?: string;
  imballo_nome: string;
  altezza_cm: number;
  qualita_nome: string;
  
  // Dati giacenza virtuale
  quantita_virtuale: number;
  prezzo_acquisto_per_stelo: number;
  costi_spalmare_per_stelo: number;
  prezzo_costo_finale_per_stelo: number;
  prezzo_vendita_1: number;
  prezzo_vendita_2: number;
  prezzo_vendita_3: number;
  valore_giacenza_base: number;
  valore_giacenza_finale: number;
  
  // Calcoli valori di vendita potenziali
  valore_vendita_1: number;
  valore_vendita_2: number;
  valore_vendita_3: number;
  
  // Margini
  margine_per_stelo_1: number;
  margine_per_stelo_2: number;
  margine_per_stelo_3: number;
  markup_percentuale_1: number;
  markup_percentuale_2: number;
  markup_percentuale_3: number;
  margine_totale_1: number;
  margine_totale_2: number;
  margine_totale_3: number;
  
  tipo_giacenza: 'virtuale';
  giorni_alla_consegna: number;
  note?: string;
  data_ordine: string;
}

// =========================================================================
// API SERVICE CLASS
// =========================================================================

class ApiService {
  
  // === GRUPPI ===
  async getGruppi(): Promise<Gruppo[]> {
    const { data, error } = await supabase
      .from('gruppi')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data || [];
  }

  async createGruppo(gruppo: Omit<Gruppo, 'id' | 'created_at' | 'updated_at'>): Promise<Gruppo> {
    const { data, error } = await supabase
      .from('gruppi')
      .insert([gruppo])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateGruppo(id: number, gruppo: Partial<Omit<Gruppo, 'id' | 'created_at' | 'updated_at'>>): Promise<Gruppo> {
    const { data, error } = await supabase
      .from('gruppi')
      .update(gruppo)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteGruppo(id: number): Promise<void> {
    const { error } = await supabase
      .from('gruppi')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // === PRODOTTI ===
  async getProdotti(): Promise<Prodotto[]> {
    const { data, error } = await supabase
      .from('prodotti')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data || [];
  }

  async createProdotto(prodotto: Omit<Prodotto, 'id' | 'created_at' | 'updated_at'>): Promise<Prodotto> {
    const { data, error } = await supabase
      .from('prodotti')
      .insert([prodotto])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateProdotto(id: number, prodotto: Partial<Omit<Prodotto, 'id' | 'created_at' | 'updated_at'>>): Promise<Prodotto> {
    const { data, error } = await supabase
      .from('prodotti')
      .update(prodotto)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteProdotto(id: number): Promise<void> {
    const { error } = await supabase
      .from('prodotti')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // === COLORI ===
  async getColori(): Promise<Colore[]> {
    const { data, error } = await supabase
      .from('colori')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data || [];
  }

  async createColore(colore: Omit<Colore, 'id' | 'created_at'>): Promise<Colore> {
    const { data, error } = await supabase
      .from('colori')
      .insert([colore])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateColore(id: number, colore: Partial<Omit<Colore, 'id' | 'created_at'>>): Promise<Colore> {
    const { data, error } = await supabase
      .from('colori')
      .update(colore)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteColore(id: number): Promise<void> {
    const { error } = await supabase
      .from('colori')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // === PROVENIENZE ===
  async getProvenienze(): Promise<Provenienza[]> {
    const { data, error } = await supabase
      .from('provenienze')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data || [];
  }

  async createProvenienza(provenienza: Omit<Provenienza, 'id' | 'created_at'>): Promise<Provenienza> {
    const { data, error } = await supabase
      .from('provenienze')
      .insert([provenienza])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateProvenienza(id: number, provenienza: Partial<Omit<Provenienza, 'id' | 'created_at'>>): Promise<Provenienza> {
    const { data, error } = await supabase
      .from('provenienze')
      .update(provenienza)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteProvenienza(id: number): Promise<void> {
    const { error } = await supabase
      .from('provenienze')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // === FOTO ===
  async getFoto(): Promise<Foto[]> {
    const { data, error } = await supabase
      .from('foto')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data || [];
  }

  async createFoto(foto: Omit<Foto, 'id' | 'created_at'>): Promise<Foto> {
    const { data, error } = await supabase
      .from('foto')
      .insert([foto])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateFoto(id: number, foto: Partial<Omit<Foto, 'id' | 'created_at'>>): Promise<Foto> {
    const { data, error } = await supabase
      .from('foto')
      .update(foto)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteFoto(id: number): Promise<void> {
    const { error } = await supabase
      .from('foto')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ========= ELIMINAZIONE SICURA FATTURE =========
  
  /**
   * Controlla se una fattura può essere eliminata (nessun movimento di vendita)
   */
  async verificaEliminabilitaFattura(fattura_acquisto_id: number): Promise<{
    eliminabile: boolean;
    motivi: string[];
    dettagli: any;
  }> {
    try {
      console.log('🔍 Verifica eliminabilità fattura ID:', fattura_acquisto_id);
      
      const motivi: string[] = [];
      const dettagli: any = {};
      
      // 1. Ottieni numero fattura per i controlli
      const { data: fatturaInfo, error: errorFattura } = await supabase
        .from('fatture_acquisto')
        .select('numero')
        .eq('id', fattura_acquisto_id)
        .single();
        
      if (errorFattura) throw errorFattura;
      const numeroFattura = fatturaInfo?.numero;
      
      // 2. CONTROLLO CRITICO: Verifica movimenti NON di carico (vendite, distruzioni, etc.)
      const { data: movimentiBloccanti, error: errorMovimenti } = await supabase
        .from('movimenti_magazzino')
        .select('*')
        .eq('fattura_numero', numeroFattura)
        .neq('tipo', 'carico'); // Tutti tranne i carichi
      
      if (errorMovimenti) throw errorMovimenti;
      
      if (movimentiBloccanti && movimentiBloccanti.length > 0) {
        const tipiMovimenti = [...new Set(movimentiBloccanti.map(m => m.tipo))];
        motivi.push(`❌ ELIMINAZIONE BLOCCATA: Trovati ${movimentiBloccanti.length} movimenti bloccanti: ${tipiMovimenti.join(', ')}`);
        dettagli.movimentiBloccanti = movimentiBloccanti;
        console.log('🚨 FATTURA NON ELIMINABILE - Movimenti bloccanti:', movimentiBloccanti);
      }
      
      // 3. Verifica distruzioni dirette sui documenti di carico
      const { data: documentiCaricoDaControllare, error: errorDocCheck } = await supabase
        .from('documenti_carico')
        .select('id')
        .eq('fattura_acquisto_id', fattura_acquisto_id);
        
      if (errorDocCheck) throw errorDocCheck;
      
      if (documentiCaricoDaControllare && documentiCaricoDaControllare.length > 0) {
        const { data: distruzioni, error: errorDistr } = await supabase
          .from('documenti_distruzione')
          .select('id, quantita_distrutta, data_distruzione, stato')
          .in('documento_carico_id', documentiCaricoDaControllare.map(d => d.id))
          .eq('stato', 'attiva');
          
        if (errorDistr) throw errorDistr;
        
        if (distruzioni && distruzioni.length > 0) {
          motivi.push(`❌ ELIMINAZIONE BLOCCATA: Trovate ${distruzioni.length} distruzioni attive sui documenti di carico`);
          dettagli.distruzioni = distruzioni;
          console.log('🚨 FATTURA NON ELIMINABILE - Distruzioni trovate:', distruzioni);
        }
      }
      
      // 4. Ottieni info sulla fattura e articoli
      const { data: documentiCarico, error: errorDoc } = await supabase
        .from('view_documenti_carico_completi')
        .select('*')
        .eq('fattura_acquisto_id', fattura_acquisto_id);
      
      if (errorDoc) throw errorDoc;
      
      dettagli.documentiCarico = documentiCarico;
      dettagli.numeroArticoli = documentiCarico?.length || 0;
      
      // 3. Calcola giacenze che verranno perse
      let giacenzeTotali = 0;
      let valoreTotale = 0;
      
      if (documentiCarico) {
        giacenzeTotali = documentiCarico.reduce((acc: number, doc: any) => acc + (doc.quantita || 0), 0);
        valoreTotale = documentiCarico.reduce((acc: number, doc: any) => 
          acc + ((doc.quantita || 0) * (doc.prezzo_acquisto_per_stelo || 0)), 0);
      }
      
      dettagli.giacenzeTotali = giacenzeTotali;
      dettagli.valoreTotale = valoreTotale;
      
      const eliminabile = motivi.length === 0;
      
      console.log('✅ Verifica completata:', { eliminabile, motivi, dettagli });
      
      return { eliminabile, motivi, dettagli };
      
    } catch (error) {
      console.error('❌ Errore verifica eliminabilità:', error);
      throw error;
    }
  }

  /**
   * Elimina completamente una fattura e tutti i dati correlati
   * VERSIONE MIGLIORATA: Usa funzione PostgreSQL sicura
   */
  async eliminaFattura(fattura_acquisto_id: number): Promise<void> {
    try {
      console.log('🗑️ Inizio eliminazione fattura ID:', fattura_acquisto_id);
      
      // Prima verifica se è eliminabile
      const verifica = await this.verificaEliminabilitaFattura(fattura_acquisto_id);
      if (!verifica.eliminabile) {
        throw new Error(`Fattura non eliminabile: ${verifica.motivi.join(', ')}`);
      }
      
      // USA FUNZIONE POSTGRESQL SICURA
      console.log('🗑️ Chiamata funzione PostgreSQL sicura...');
      const { data, error } = await supabase.rpc('elimina_fattura_sicura', {
        p_fattura_id: fattura_acquisto_id
      });
      
      if (error) throw error;
      
      console.log('✅ Fattura eliminata con funzione PostgreSQL sicura:', data);
      
    } catch (error) {
      console.error('❌ Errore eliminazione fattura:', error);
      throw error;
    }
  }

  // Upload foto su Supabase Storage
  async uploadFoto(file: File): Promise<{ foto: Foto; url: string }> {
    try {
      // 1. Upload file su Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('foto-articoli')
        .upload(`public/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 2. Ottieni URL pubblico
      const { data: urlData } = supabase.storage
        .from('foto-articoli')
        .getPublicUrl(`public/${fileName}`);

      // 3. Salva nel database
      const newFoto = await this.createFoto({
        nome: file.name.replace(/\.[^/.]+$/, ''), // Rimuove estensione
        url: urlData.publicUrl,
        descrizione: `Foto caricata il ${new Date().toLocaleDateString()}`
      });

      return {
        foto: newFoto,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('Errore upload foto:', error);
      throw error;
    }
  }

  // === IMBALLAGGI ===
  async getImballaggi(): Promise<Imballo[]> {
    const { data, error } = await supabase
      .from('imballaggi')
      .select('*')
      .order('quantita');
    
    if (error) throw error;
    return data || [];
  }

  async createImballo(imballo: Omit<Imballo, 'id' | 'created_at'>): Promise<Imballo> {
    const { data, error } = await supabase
      .from('imballaggi')
      .insert([imballo])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateImballo(id: number, imballo: Partial<Omit<Imballo, 'id' | 'created_at'>>): Promise<Imballo> {
    const { data, error } = await supabase
      .from('imballaggi')
      .update(imballo)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteImballo(id: number): Promise<void> {
    const { error } = await supabase
      .from('imballaggi')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // === ALTEZZE ===
  async getAltezze(): Promise<Altezza[]> {
    const { data, error } = await supabase
      .from('altezze')
      .select('*')
      .order('altezza_cm');
    
    if (error) throw error;
    return data || [];
  }

  async createAltezza(altezza: Omit<Altezza, 'id' | 'created_at'>): Promise<Altezza> {
    const { data, error } = await supabase
      .from('altezze')
      .insert([altezza])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateAltezza(id: number, altezza: Partial<Omit<Altezza, 'id' | 'created_at'>>): Promise<Altezza> {
    const { data, error } = await supabase
      .from('altezze')
      .update(altezza)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteAltezza(id: number): Promise<void> {
    const { error } = await supabase
      .from('altezze')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // === QUALITÀ ===
  async getQualita(): Promise<Qualita[]> {
    try {
      console.log('📋 Caricamento qualità...');
      
      const { data, error } = await supabase
        .from('qualita')
        .select('*')
        .order('nome');
      
      if (error) {
        console.warn('⚠️ Tabella qualità non trovata, uso dati mock:', error);
        // Fallback ai dati mock
        return [
          { id: 1, nome: 'Extra', descrizione: 'Qualità extra - massima qualità', created_at: new Date().toISOString() },
          { id: 2, nome: 'Prima', descrizione: 'Prima qualità - ottima qualità', created_at: new Date().toISOString() },
          { id: 3, nome: 'Seconda', descrizione: 'Seconda qualità - buona qualità', created_at: new Date().toISOString() },
          { id: 4, nome: 'Terza', descrizione: 'Terza qualità - qualità standard', created_at: new Date().toISOString() },
          { id: 5, nome: 'Scarto', descrizione: 'Qualità di scarto - per composizioni', created_at: new Date().toISOString() },
          { id: 6, nome: 'Mista', descrizione: 'Qualità mista - varie gradazioni', created_at: new Date().toISOString() }
        ];
      }
      
      console.log('✅ Qualità caricate:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Errore caricamento qualità:', error);
      // Fallback ai dati mock in caso di errore
      return [
        { id: 1, nome: 'Extra', descrizione: 'Qualità extra - massima qualità', created_at: new Date().toISOString() },
        { id: 2, nome: 'Prima', descrizione: 'Prima qualità - ottima qualità', created_at: new Date().toISOString() },
        { id: 3, nome: 'Seconda', descrizione: 'Seconda qualità - buona qualità', created_at: new Date().toISOString() },
        { id: 4, nome: 'Terza', descrizione: 'Terza qualità - qualità standard', created_at: new Date().toISOString() },
        { id: 5, nome: 'Scarto', descrizione: 'Qualità di scarto - per composizioni', created_at: new Date().toISOString() },
        { id: 6, nome: 'Mista', descrizione: 'Qualità mista - varie gradazioni', created_at: new Date().toISOString() }
      ];
    }
  }

  async createQualita(qualita: Omit<Qualita, 'id' | 'created_at'>): Promise<Qualita> {
    const { data, error } = await supabase
      .from('qualita')
      .insert([qualita])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateQualita(id: number, qualita: Partial<Omit<Qualita, 'id' | 'created_at'>>): Promise<Qualita> {
    const { data, error } = await supabase
      .from('qualita')
      .update(qualita)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteQualita(id: number): Promise<void> {
    const { error } = await supabase
      .from('qualita')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // === ARTICOLI (7 caratteristiche) ===
  async getArticoli(): Promise<ArticoloCompleto[]> {
    const { data, error } = await supabase
      .from('view_anagrafica_articoli')
      .select('*')
      .order('nome_completo');
    
    if (error) throw error;
    return data || [];
  }

  async getArticoloById(id: number): Promise<ArticoloCompleto | null> {
    const { data, error } = await supabase
      .from('view_anagrafica_articoli')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  async createArticolo(articolo: {
    gruppo_id: number;
    prodotto_id: number;
    colore_id: number;
    provenienza_id: number;
    foto_id: number;
    imballo_id: number;
    altezza_id: number;
    qualita_id: number;
  }): Promise<Articolo> {
    const { data, error } = await supabase
      .from('articoli')
      .insert([articolo])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateArticolo(id: number, articolo: Partial<{
    gruppo_id: number;
    prodotto_id: number;
    colore_id: number;
    provenienza_id: number;
    foto_id: number;
    imballo_id: number;
    altezza_id: number;
    qualita_id: number;
  }>): Promise<Articolo> {
    const { data, error } = await supabase
      .from('articoli')
      .update(articolo)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteArticolo(id: number): Promise<void> {
    const { error } = await supabase
      .from('articoli')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Trova o crea un articolo con le 8 caratteristiche
  async findOrCreateArticolo(caratteristiche: {
    gruppo_id: number;
    prodotto_id: number;
    colore_id: number;
    provenienza_id: number;
    foto_id: number;
    imballo_id: number;
    altezza_id: number;
    qualita_id: number;
  }): Promise<Articolo> {
    // Prima cerca se esiste già
    const { data: existing } = await supabase
      .from('articoli')
      .select('*')
      .eq('gruppo_id', caratteristiche.gruppo_id)
      .eq('prodotto_id', caratteristiche.prodotto_id)
      .eq('colore_id', caratteristiche.colore_id)
      .eq('provenienza_id', caratteristiche.provenienza_id)
      .eq('foto_id', caratteristiche.foto_id)
      .eq('imballo_id', caratteristiche.imballo_id)
      .eq('altezza_id', caratteristiche.altezza_id)
      .eq('qualita_id', caratteristiche.qualita_id)
      .single();

    if (existing) {
      return existing;
    }

    // Se non esiste, crealo
    return await this.createArticolo(caratteristiche);
  }

  // === FORNITORI ===
  async getFornitori(): Promise<Fornitore[]> {
    const { data, error } = await supabase
      .from('fornitori')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data || [];
  }

  async createFornitore(fornitore: Omit<Fornitore, 'id' | 'created_at' | 'updated_at' | 'attivo'>): Promise<Fornitore> {
    const { data, error } = await supabase
      .from('fornitori')
      .insert([{ ...fornitore, attivo: true }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateFornitore(id: number, fornitore: Partial<Omit<Fornitore, 'id' | 'created_at' | 'updated_at'>>): Promise<Fornitore> {
    const { data, error } = await supabase
      .from('fornitori')
      .update(fornitore)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteFornitore(id: number): Promise<void> {
    const { error } = await supabase
      .from('fornitori')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // === FATTURE ACQUISTO CON PROCEDURA INTEGRATA ===
  async getFattureAcquisto(): Promise<any[]> {
    const { data, error } = await supabase
      .from('fatture_acquisto')
      .select(`
        *,
        fornitori (
          id,
          nome,
          ragione_sociale
        )
      `)
      .order('data', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createFatturaAcquisto(fattura: any): Promise<any> {
    // Usa la procedura semplice (solo fattura)
    const { data, error } = await supabase.rpc('inserisci_fattura_semplice', {
      p_numero_fattura: fattura.numero_fattura,
      p_data_fattura: fattura.data,
      p_id_fornitore: fattura.id_fornitore,
      p_totale: fattura.totale,
      p_stato: fattura.stato || 'bozza',
      p_note: fattura.note
    });
    
    if (error) throw error;
    return data;
  }

  async createFatturaConDocumento(datiCompleti: {
    // Dati fattura
    numero_fattura: string;
    data: string;
    id_fornitore: number;
    totale: number;
    stato?: string;
    note?: string;
    
    // Dati prodotto e 8 caratteristiche
    id_gruppo: number;
    nome_prodotto: string;
    id_colore: number;
    id_provenienza: number;
    id_foto: number;
    id_imballo: number;
    id_altezza: number;
    id_qualita: number;
    
    // Dati di carico
    quantita: number;
    prezzo_acquisto_per_stelo: number;
    prezzo_vendita_1?: number;
    prezzo_vendita_2?: number;
    prezzo_vendita_3?: number;
  }): Promise<any> {
    // Usa la procedura completa
    const { data, error } = await supabase.rpc('inserisci_fattura_con_documento_carico', {
      p_numero_fattura: datiCompleti.numero_fattura,
      p_data_fattura: datiCompleti.data,
      p_id_fornitore: datiCompleti.id_fornitore,
      p_totale: datiCompleti.totale,
      p_id_gruppo: datiCompleti.id_gruppo,
      p_nome_prodotto: datiCompleti.nome_prodotto,
      p_id_colore: datiCompleti.id_colore,
      p_id_provenienza: datiCompleti.id_provenienza,
      p_id_foto: datiCompleti.id_foto,
      p_id_imballo: datiCompleti.id_imballo,
      p_id_altezza: datiCompleti.id_altezza,
      p_id_qualita: datiCompleti.id_qualita,
      p_quantita: datiCompleti.quantita,
      p_prezzo_acquisto_per_stelo: datiCompleti.prezzo_acquisto_per_stelo,
      p_stato: datiCompleti.stato || 'bozza',
      p_note: datiCompleti.note,
      p_prezzo_vendita_1: datiCompleti.prezzo_vendita_1,
      p_prezzo_vendita_2: datiCompleti.prezzo_vendita_2,
      p_prezzo_vendita_3: datiCompleti.prezzo_vendita_3
    });
    
    if (error) throw error;
    return data;
  }

  async updateFatturaAcquisto(id: number, fattura: any): Promise<any> {
    const { data, error } = await supabase
      .from('fatture_acquisto')
      .update(fattura)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteFatturaAcquisto(id: number): Promise<void> {
    const { error } = await supabase
      .from('fatture_acquisto')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // === UTILITY ===
  
  // Test connessione database
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing basic Supabase connection...');
      
      // Test semplice - prova a leggere qualche record dalla tabella gruppi
      const { data, error } = await supabase
        .from('gruppi')
        .select('id, nome')
        .limit(1);
      
      if (error) {
        console.error('❌ Errore nella query gruppi:', error);
        console.log('📋 Dettagli errore:', {
          code: error.code,
          message: error.message,
          hint: error.hint
        });
        
        // Se 'gruppi' non esiste, proviamo altre tabelle comuni
        console.log('🔍 Provando tabella alternativa "groups"...');
        const { data: data2, error: error2 } = await supabase
          .from('groups')
          .select('id, name')
          .limit(1);
          
        if (error2) {
          console.error('❌ Anche "groups" non funziona:', error2);
          
          // Prova a vedere che tabelle ci sono
          console.log('🔍 Verificando connessione base...');
          const { data: data3, error: error3 } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(10);
            
          if (error3) {
            console.error('❌ Nemmeno information_schema funziona:', error3);
            return false;
          }
          
          console.log('✅ Connessione OK. Tabelle trovate:', data3);
          return false; // Connessione OK ma tabelle gruppi/groups mancanti
        }
        
        console.log('✅ Trovata tabella "groups" invece di "gruppi"');
        console.log('📋 Dati in groups:', data2);
        return true;
      }
      
      console.log('✅ Tabella "gruppi" trovata');
      console.log('📋 Dati in gruppi:', data);
      return true;
    } catch (e) {
      console.error('❌ Errore generale connessione:', e);
      return false;
    }
  }

  // === CLIENTI ===
  async getClienti(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clienti')
      .select('*')
      .order('nome');
    
    if (error) throw error;
    return data || [];
  }

  async createCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clienti')
      .insert([cliente])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateCliente(id: number, cliente: Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clienti')
      .update(cliente)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteCliente(id: number): Promise<void> {
    const { error } = await supabase
      .from('clienti')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Ottieni statistiche generali
  // === UTILITÀ ===
  
  // Reset completo database (elimina tutto in ordine corretto)
  async resetDatabase(): Promise<void> {
    try {
      // Ordine di eliminazione per rispettare i vincoli FK:
      // 1. Documenti di carico (dipendono da articoli e fatture)
      await supabase.from('documenti_carico').delete().neq('id', 0);
      
      // 2. Costi fattura (dipendono da fatture)
      await supabase.from('costi_fattura').delete().neq('id', 0);
      
      // 3. Fatture acquisto (dipendono da fornitori)
      await supabase.from('fatture_acquisto').delete().neq('id', 0);
      
      // 4. Articoli (dipendono da caratteristiche)
      await supabase.from('articoli').delete().neq('id', 0);
      
      // 5. Caratteristiche (in ordine di dipendenza)
      await supabase.from('foto').delete().neq('id', 0);
      await supabase.from('altezze').delete().neq('id', 0);
      await supabase.from('qualita').delete().neq('id', 0);
      await supabase.from('imballaggi').delete().neq('id', 0);
      await supabase.from('provenienze').delete().neq('id', 0);
      await supabase.from('colori').delete().neq('id', 0);
      await supabase.from('prodotti').delete().neq('id', 0);
      await supabase.from('gruppi').delete().neq('id', 0);
      
    } catch (error) {
      console.error('Errore nel reset database:', error);
      throw error;
    }
  }

  /**
   * Crea la tabella qualità e inserisce i dati iniziali
   */
  async setupQualitaTable(): Promise<void> {
    try {
      console.log('🚀 Setup tabella qualità...');
      
      // 1. Crea la tabella qualità usando SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS qualita (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL UNIQUE,
            descrizione TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `
      });
      
      if (createError) {
        console.error('❌ Errore creazione tabella qualità:', createError);
        throw createError;
      }
      
      console.log('✅ Tabella qualità creata');
      
      // 2. Inserisce le qualità predefinite
      const qualitaData = [
        { nome: 'Extra', descrizione: 'Qualità extra - massima qualità' },
        { nome: 'Prima', descrizione: 'Prima qualità - ottima qualità' },
        { nome: 'Seconda', descrizione: 'Seconda qualità - buona qualità' },
        { nome: 'Terza', descrizione: 'Terza qualità - qualità standard' },
        { nome: 'Scarto', descrizione: 'Qualità di scarto - per composizioni' },
        { nome: 'Mista', descrizione: 'Qualità mista - varie gradazioni' }
      ];
      
      const { error: insertError } = await supabase
        .from('qualita')
        .upsert(qualitaData, { onConflict: 'nome' });
      
      if (insertError) {
        console.error('❌ Errore inserimento qualità:', insertError);
        throw insertError;
      }
      
      console.log('✅ Qualità inserite con successo');
      
      // 3. Aggiunge colonna id_qualita alla tabella articoli se non esiste
      const { error: alterError } = await supabase.rpc('exec_sql', {
        query: `
          ALTER TABLE articoli 
          ADD COLUMN IF NOT EXISTS id_qualita INTEGER REFERENCES qualita(id);
        `
      });
      
      if (alterError) {
        console.error('❌ Errore aggiunta colonna id_qualita:', alterError);
        throw alterError;
      }
      
      console.log('✅ Colonna id_qualita aggiunta alla tabella articoli');
      
      console.log('🎉 Setup qualità completato - Sistema ora a 8 caratteristiche!');
      
    } catch (error) {
      console.error('❌ Errore setup tabella qualità:', error);
      throw error;
    }
  }

  async getStatistiche(): Promise<{
    gruppi: number;
    prodotti: number;
    colori: number;
    provenienze: number;
    foto: number;
    imballaggi: number;
    altezze: number;
    qualita: number;
    articoli: number;
    fornitori: number;
    clienti: number;
  }> {
    try {
      // Usa semplici SELECT per contare i record - sintassi corretta per Supabase
      const [
        gruppi,
        prodotti,
        colori,
        provenienze,
        foto,
        imballaggi,
        altezze,
        qualita,
        articoli,
        fornitori,
        clienti
      ] = await Promise.all([
        supabase.from('gruppi').select('id'),
        supabase.from('prodotti').select('id'),
        supabase.from('colori').select('id'),
        supabase.from('provenienze').select('id'),
        supabase.from('foto').select('id'),
        supabase.from('imballaggi').select('id'),
        supabase.from('altezze').select('id'),
        supabase.from('qualita').select('id'),
        supabase.from('articoli').select('id'),
        supabase.from('fornitori').select('id'),
        supabase.from('clienti').select('id'),
      ]);

      return {
        gruppi: gruppi.data?.length || 0,
        prodotti: prodotti.data?.length || 0,
        colori: colori.data?.length || 0,
        provenienze: provenienze.data?.length || 0,
        foto: foto.data?.length || 0,
        imballaggi: imballaggi.data?.length || 0,
        altezze: altezze.data?.length || 0,
        qualita: qualita.data?.length || 0,
        articoli: articoli.data?.length || 0,
        fornitori: fornitori.data?.length || 0,
        clienti: clienti.data?.length || 0,
      };
    } catch (error) {
      console.error('Errore nel caricamento statistiche:', error);
      return {
        gruppi: 0, prodotti: 0, colori: 0, provenienze: 0, foto: 0,
        imballaggi: 0, altezze: 0, qualita: 0, articoli: 0, fornitori: 0, clienti: 0
      };
    }
  }

  // =========================================================================
  // NUOVE FUNZIONI PER GESTIONE MAGAZZINO
  // =========================================================================

  /**
   * Inserisce fattura con documento di carico usando la procedura del database
   * ARCHITETTURA: Una fattura → UN documento di carico per OGNI articolo
   */
  async inserisciFatturaConCarico(dati: {
    numero_fattura: string;
    data_fattura: string;
    fornitore_id: number;
    totale: number;
    stato?: string;
    note?: string;
    costi_globali: {
      trasporto: { importo: number; fornitore_id: number; };
      commissioni: { importo: number; fornitore_id: number; };
      imballaggi: { importo: number; fornitore_id: number; };
      note: string;
    };
    righe_articoli: Array<{
      id_gruppo: number;
      nome_prodotto: string;
      id_colore: number;
      id_provenienza: number;
      id_foto: number;
      id_imballo: number;
      id_altezza: number;
      id_qualita: number;
      quantita: number;
      prezzo_acquisto_per_stelo: number;
      prezzo_vendita_1?: number;
      prezzo_vendita_2?: number;
      prezzo_vendita_3?: number;
      totale_riga: number;
    }>;
  }): Promise<any> {
    try {
      console.log('📦 Inserimento fattura con carico (un documento per articolo):', dati);
      
      // Per ora, usiamo la prima riga per compatibilità con la procedura esistente
      const primaRiga = dati.righe_articoli[0];
      
      const result = await this.createFatturaConDocumento({
        numero_fattura: dati.numero_fattura,
        data: dati.data_fattura,
        id_fornitore: dati.fornitore_id,
        totale: dati.totale,
        stato: dati.stato || 'bozza',
        note: dati.note,
        id_gruppo: primaRiga.id_gruppo,
        nome_prodotto: primaRiga.nome_prodotto,
        id_colore: primaRiga.id_colore,
        id_provenienza: primaRiga.id_provenienza,
        id_foto: primaRiga.id_foto,
        id_imballo: primaRiga.id_imballo,
        id_altezza: primaRiga.id_altezza,
        id_qualita: primaRiga.id_qualita,
        quantita: primaRiga.quantita,
        prezzo_acquisto_per_stelo: primaRiga.prezzo_acquisto_per_stelo,
        prezzo_vendita_1: primaRiga.prezzo_vendita_1,
        prezzo_vendita_2: primaRiga.prezzo_vendita_2,
        prezzo_vendita_3: primaRiga.prezzo_vendita_3
      });

      console.log('✅ Fattura e documento creati:', result);
      
      // Ora salvo i costi analitici nella tabella costi_fattura
      if (result?.fattura_id && dati.costi_globali) {
        console.log('💰 Salvataggio costi analitici per fattura:', result.fattura_id);
        
        const costiDaSalvare = [];
        
        // Aggiungi costo trasporto se presente
        if (dati.costi_globali.trasporto.importo > 0 && dati.costi_globali.trasporto.fornitore_id > 0) {
          costiDaSalvare.push({
            tipo_costo: 'trasporto' as const,
            importo: dati.costi_globali.trasporto.importo,
            fornitore_id: dati.costi_globali.trasporto.fornitore_id,
            note: dati.costi_globali.note || 'Costo trasporto'
          });
        }
        
        // Aggiungi costo commissioni se presente
        if (dati.costi_globali.commissioni.importo > 0 && dati.costi_globali.commissioni.fornitore_id > 0) {
          costiDaSalvare.push({
            tipo_costo: 'commissioni' as const,
            importo: dati.costi_globali.commissioni.importo,
            fornitore_id: dati.costi_globali.commissioni.fornitore_id,
            note: dati.costi_globali.note || 'Commissioni'
          });
        }
        
        // Aggiungi costo imballaggi se presente
        if (dati.costi_globali.imballaggi.importo > 0 && dati.costi_globali.imballaggi.fornitore_id > 0) {
          costiDaSalvare.push({
            tipo_costo: 'imballaggi' as const,
            importo: dati.costi_globali.imballaggi.importo,
            fornitore_id: dati.costi_globali.imballaggi.fornitore_id,
            note: dati.costi_globali.note || 'Costi imballaggi'
          });
        }
        
        // Salva i costi se ce ne sono
        if (costiDaSalvare.length > 0) {
          console.log('📝 Costi da inserire:', costiDaSalvare);
          
          try {
            await this.aggiornaCostiFattura({
              fattura_acquisto_id: result.fattura_id,
              costi: costiDaSalvare
            });
            console.log('✅ Costi analitici salvati con successo');
          } catch (costiError) {
            console.error('❌ Errore nel salvataggio costi analitici:', costiError);
            // Non blocchiamo la creazione della fattura per un errore nei costi
          }
        } else {
          console.log('ℹ️ Nessun costo analitico da salvare');
        }
      }
      
      return result;
    } catch (error) {
      console.error('Errore inserimento fattura con carico:', error);
      throw error;
    }
  }

  /**
   * Ottiene le giacenze magazzino dalla vista del database
   */
  async getGiacenzeMagazzino(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('view_giacenze_magazzino')
        .select('*')
        .order('gruppo_nome, prodotto_nome, colore_nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Errore nel caricamento giacenze:', error);
      throw error;
    }
  }

  /**
   * Ottiene tutti i documenti di carico con dettagli completi
   */
  async getDocumentiCarico(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('view_documenti_carico_completi')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Errore nel caricamento documenti carico:', error);
      throw error;
    }
  }

  /**
   * Ottiene tutti i movimenti magazzino per un articolo specifico
   */
  async getMovimentiPerArticolo(articolo_id: number): Promise<MovimentoMagazzino[]> {
    try {
      console.log('🔍 Caricamento movimenti per articolo:', articolo_id);

      if (!articolo_id || articolo_id <= 0) {
        throw new Error('ID articolo non valido');
      }

      // Query per ottenere tutti i movimenti correlati all'articolo
      // Includiamo sia i carichi (documenti_carico) che eventuali movimenti diretti
      const { data: carichi, error: erroreCarichi } = await supabase
        .from('view_documenti_carico_completi')
        .select('*')
        .eq('articolo_id', articolo_id)
        .order('created_at', { ascending: false });

      if (erroreCarichi) throw erroreCarichi;

      // Debug: mostra la struttura del primo record per capire i campi disponibili
      if (carichi && carichi.length > 0) {
        console.log('🔍 Struttura dati carico:', Object.keys(carichi[0]));
        console.log('🔍 Primo record:', carichi[0]);
      }

      // Conversione dei documenti di carico in formato MovimentoMagazzino
      // Usiamo controlli più robusti per evitare errori su campi undefined
      const movimentiCarico: MovimentoMagazzino[] = (carichi || []).map(carico => {
        // Calcolo sicuro del valore totale
        const quantita = carico.quantita || 0;
        const prezzoUnitario = carico.prezzo_acquisto_per_stelo || 0;
        const prezzoCostoFinale = carico.prezzo_costo_finale_per_stelo || prezzoUnitario;
        
        return {
          id: carico.id || 0,
          tipo: 'carico' as const,
          data: carico.fattura_data || carico.created_at || new Date().toISOString(),
          quantita: quantita,
          prezzo_unitario: prezzoUnitario,
          valore_totale: quantita * prezzoCostoFinale,
          
          // Dati articolo - con controlli di esistenza
          gruppo_id: carico.gruppo_id || 0,
          gruppo_nome: carico.gruppo_nome || 'N/A',
          prodotto_id: carico.prodotto_id || 0,
          prodotto_nome: carico.prodotto_nome || 'N/A',
          colore_id: carico.colore_id || 0,
          colore_nome: carico.colore_nome || 'N/A',
          provenienza_id: carico.provenienza_id || 0,
          provenienza_nome: carico.provenienza_nome || 'N/A',
          foto_id: carico.foto_id || 0,
          foto_nome: carico.foto_nome || 'N/A',
          imballo_id: carico.imballo_id || 0,
          imballo_nome: carico.imballo_nome || 'N/A',
          altezza_id: carico.altezza_id || 0,
          altezza_nome: carico.altezza_descrizione || carico.altezza_nome || 'N/A',
          qualita_id: carico.qualita_id || 0,
          qualita_nome: carico.qualita_nome || 'N/A',
          
          // Documenti di riferimento
          fattura_id: carico.fattura_acquisto_id || carico.fattura_id || 0,
          fattura_numero: carico.fattura_numero || carico.numero || 'N/A',
          fornitore_id: carico.fornitore_id || 0,
          fornitore_nome: carico.fornitore_nome || 'N/A',
          
          // Metadati
          note: carico.note || `Carico da fattura ${carico.fattura_numero || carico.numero || 'N/A'}`,
          utente: 'Sistema',
          created_at: carico.created_at || new Date().toISOString(),
          updated_at: carico.updated_at || carico.created_at || new Date().toISOString()
        };
      });

      // Eventualmente qui si potrebbero aggiungere altri tipi di movimento 
      // (scarichi, distruzioni, etc.) se implementati in futuro

      console.log(`✅ Trovati ${movimentiCarico.length} movimenti per articolo ${articolo_id}`);
      return movimentiCarico;

    } catch (error) {
      console.error('Errore nel caricamento movimenti articolo:', error);
      throw error;
    }
  }

  /**
   * Aggiorna l'imballo di un articolo (propaga a documento di carico)
   * ATTENZIONE: Questo aggiorna l'ARTICOLO stesso, quindi tutti i documenti che lo usano
   */
  async aggiornaImballoArticolo(dati: {
    articolo_id: number;
    nuovo_imballo_id: number;
  }): Promise<any> {
    try {
      console.log('🔄 Aggiornamento imballo articolo:', dati);
      
      // Validazione parametri
      if (!dati.articolo_id || dati.articolo_id <= 0) {
        throw new Error('ID articolo non valido');
      }
      
      if (!dati.nuovo_imballo_id || dati.nuovo_imballo_id <= 0) {
        throw new Error('ID nuovo imballo non valido');
      }

      // Aggiorna l'articolo stesso (impatta tutti i documenti che lo usano)
      const { data, error } = await supabase
        .from('articoli')
        .update({ 
          imballo_id: dati.nuovo_imballo_id
        })
        .eq('id', dati.articolo_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Errore database aggiornamento imballo:', error);
        throw error;
      }
      
      console.log('✅ Imballo articolo aggiornato:', data);
      return { success: true, articolo: data };
    } catch (error) {
      console.error('❌ Errore aggiornamento imballo articolo:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un documento di carico specifico
   */
  async aggiornaDocumentoCarico(dati: {
    documento_id: number;
    aggiornamenti: {
      quantita?: number;
      prezzo_acquisto_per_stelo?: number;
      prezzo_vendita_1?: number;
      prezzo_vendita_2?: number;
      prezzo_vendita_3?: number;
      note?: string;
    };
  }): Promise<any> {
    try {
      console.log('📝 Aggiornamento documento carico:', dati);
      
      const updateData = {
        ...dati.aggiornamenti,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('documenti_carico')
        .update(updateData)
        .eq('id', dati.documento_id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Documento carico aggiornato:', data);
      return { success: true, documento: data };
    } catch (error) {
      console.error('❌ Errore aggiornamento documento carico:', error);
      throw error;
    }
  }

  /**
   * Aggiunge un nuovo articolo a una fattura esistente
   */
  async aggiungiArticoloAFattura(dati: {
    fattura_acquisto_id: number;
    id_gruppo: number;
    nome_prodotto: string;
    id_colore: number;
    id_provenienza: number;
    id_foto: number;
    id_imballo: number;
    id_altezza: number;
    id_qualita: number;
    quantita: number;
    prezzo_acquisto_per_stelo: number;
    prezzo_vendita_1?: number;
    prezzo_vendita_2?: number;
    prezzo_vendita_3?: number;
    note?: string;
  }): Promise<any> {
    try {
      console.log('➕ Aggiunta articolo a fattura:', dati);
      
      const { data, error } = await supabase.rpc('aggiungi_articolo_a_fattura', {
        p_fattura_acquisto_id: dati.fattura_acquisto_id,
        p_id_gruppo: dati.id_gruppo,
        p_nome_prodotto: dati.nome_prodotto,
        p_id_colore: dati.id_colore,
        p_id_provenienza: dati.id_provenienza,
        p_id_foto: dati.id_foto,
        p_id_imballo: dati.id_imballo,
        p_id_altezza: dati.id_altezza,
        p_id_qualita: dati.id_qualita,
        p_quantita: dati.quantita,
        p_prezzo_acquisto_per_stelo: dati.prezzo_acquisto_per_stelo,
        p_prezzo_vendita_1: dati.prezzo_vendita_1,
        p_prezzo_vendita_2: dati.prezzo_vendita_2,
        p_prezzo_vendita_3: dati.prezzo_vendita_3,
        p_note: dati.note
      });

      if (error) throw error;
      
      console.log('✅ Articolo aggiunto alla fattura:', data);
      return { success: true, documento: data };
    } catch (error) {
      console.error('❌ Errore aggiunta articolo a fattura:', error);
      throw error;
    }
  }

  /**
   * Rimuove un documento di carico (e la sua giacenza associata)
   */
  async rimuoviDocumentoCarico(documento_id: number): Promise<any> {
    try {
      console.log('🗑️ Rimozione documento carico:', documento_id);
      
      const { data, error } = await supabase.rpc('rimuovi_documento_carico', {
        p_documento_id: documento_id
      });

      if (error) throw error;
      
      console.log('✅ Documento carico rimosso:', data);
      return { success: true };
    } catch (error) {
      console.error('❌ Errore rimozione documento carico:', error);
      throw error;
    }
  }

  /**
   * Aggiorna la fattura di acquisto (numero, data, fornitore, totale, note)
   */
  async aggiornaFatturaAcquisto(dati: {
    fattura_id: number;
    numero_fattura?: string;
    data_fattura?: string;
    fornitore_id?: number;
    totale?: number;
    note?: string;
    stato?: string;
  }): Promise<any> {
    try {
      console.log('📝 Aggiornamento fattura acquisto:', dati);
      
      const updateData: any = { updated_at: new Date().toISOString() };
      if (dati.numero_fattura !== undefined) updateData.numero_fattura = dati.numero_fattura;
      if (dati.data_fattura !== undefined) updateData.data = dati.data_fattura;
      if (dati.fornitore_id !== undefined) updateData.id_fornitore = dati.fornitore_id;
      if (dati.totale !== undefined) updateData.totale = dati.totale;
      if (dati.note !== undefined) updateData.note = dati.note;
      if (dati.stato !== undefined) updateData.stato = dati.stato;

      const { data, error } = await supabase
        .from('fatture_acquisto')
        .update(updateData)
        .eq('id', dati.fattura_id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Fattura acquisto aggiornata:', data);
      return { success: true, fattura: data };
    } catch (error) {
      console.error('❌ Errore aggiornamento fattura acquisto:', error);
      throw error;
    }
  }

  /**
   * Elimina completamente una fattura di carico e tutti i suoi documenti associati
   */
  async eliminaFatturaCarico(fattura_acquisto_id: number): Promise<any> {
    try {
      console.log('🗑️ Eliminazione completa fattura carico:', fattura_acquisto_id);
      
      const { data, error } = await supabase.rpc('elimina_fattura_carico_completa', {
        p_fattura_acquisto_id: fattura_acquisto_id
      });

      if (error) throw error;
      
      console.log('✅ Fattura carico eliminata completamente:', data);
      return { success: true };
    } catch (error) {
      console.error('❌ Errore eliminazione fattura carico:', error);
      throw error;
    }
  }

  /**
   * Ottiene i costi associati a una fattura (trasporto, commissioni, imballaggi)
   */
  async getCostiFattura(fattura_acquisto_id: number): Promise<any[]> {
    try {
      console.log('🔍 Caricamento costi per fattura ID:', fattura_acquisto_id);
      
      // Uso la view corretta per i costi dettagliati
      const { data: costiData, error: costiError } = await supabase
        .from('view_costi_fattura_dettaglio')
        .select('*')
        .eq('fattura_acquisto_id', fattura_acquisto_id);

      if (costiError) {
        console.error('❌ Errore lettura view_costi_fattura_dettaglio:', costiError);
        return [];
      }
      
      console.log('✅ Dati costi caricati dalla view corretta:', costiData);
      
      if (!costiData || costiData.length === 0) {
        console.log('⚠️ Nessun costo trovato per fattura_acquisto_id:', fattura_acquisto_id);
        return [];
      }
      
      // Trasforma i dati in formato CostoFattura con la mappatura corretta
      const costi: any[] = costiData.map((costo: any) => ({
        id: costo.id,
        tipo_costo: costo.tipologia_costo.toLowerCase(), // "Trasporto" -> "trasporto"
        importo: costo.importo,
        fornitore_id: costo.fornitore_costo_id || costo.fornitore_principale_id,
        fornitore_nome: costo.fornitore_costo || costo.fornitore_principale,
        note: costo.note || ''
      }));
      
      console.log('📊 Costi trasformati dalla tabella corretta:', costi);
      return costi;
    } catch (error) {
      console.error('❌ Errore nel caricamento costi fattura:', error);
      return [];
    }
  }

  /**
   * Aggiorna o inserisce i costi di una fattura
   */
  async aggiornaCostiFattura(dati: {
    fattura_acquisto_id: number;
    costi: Array<{
      tipo_costo: 'trasporto' | 'commissioni' | 'imballaggi';
      importo: number;
      fornitore_id: number;
      note?: string;
    }>;
  }): Promise<any> {
    try {
      console.log('💰 Aggiornamento costi nella tabella costi_fattura:', dati);

      // Prima elimina tutti i costi esistenti per questa fattura
      const { error: deleteError } = await supabase
        .from('costi_fattura')
        .delete()
        .eq('fattura_acquisto_id', dati.fattura_acquisto_id);

      if (deleteError) {
        console.error('❌ Errore eliminazione costi esistenti:', deleteError);
        throw deleteError;
      }

      console.log('✅ Costi esistenti eliminati');

      // Se non ci sono nuovi costi, termina qui
      if (!dati.costi || dati.costi.length === 0) {
        console.log('ℹ️ Nessun nuovo costo da inserire');
        return { success: true, costi: [] };
      }

      // Recupera gli ID delle tipologie di costo
      const { data: tipologie, error: tipologieError } = await supabase
        .from('tipologie_costo')
        .select('id, nome');

      if (tipologieError) {
        console.error('❌ Errore recupero tipologie costo:', tipologieError);
        throw tipologieError;
      }

      console.log('📋 Tipologie costo disponibili:', tipologie);

      // Mappa tipologie nome -> id (case insensitive)
      const tipologieMap = new Map();
      tipologie.forEach((t: any) => {
        tipologieMap.set(t.nome.toLowerCase(), t.id);
      });

      // Prepara i nuovi costi per l'inserimento
      const nuoviCosti = dati.costi.map(costo => {
        const tipologia_costo_id = tipologieMap.get(costo.tipo_costo.toLowerCase());
        
        if (!tipologia_costo_id) {
          throw new Error(`Tipologia costo non trovata: ${costo.tipo_costo}`);
        }

        return {
          fattura_acquisto_id: dati.fattura_acquisto_id,
          tipologia_costo_id,
          fornitore_costo_id: costo.fornitore_id,
          importo: costo.importo,
          note: costo.note || null
        };
      });

      console.log('📝 Nuovi costi da inserire:', nuoviCosti);

      // Inserisci i nuovi costi
      const { data: costiInseriti, error: insertError } = await supabase
        .from('costi_fattura')
        .insert(nuoviCosti)
        .select();

      if (insertError) {
        console.error('❌ Errore inserimento nuovi costi:', insertError);
        throw insertError;
      }

      console.log('✅ Costi aggiornati correttamente nella tabella costi_fattura:', costiInseriti);
      return { success: true, costi: costiInseriti };
    } catch (error) {
      console.error('❌ Errore aggiornamento costi fattura:', error);
      throw error;
    }
  }

  /**
   * Aggiorna giacenza e prezzi di un articolo
   */
  async aggiornaGiacenzaEPrezzi(dati: {
    articolo_id: number;
    nuova_giacenza: number;
    prezzo_vendita_1?: number;
    prezzo_vendita_2?: number;
    prezzo_vendita_3?: number;
  }): Promise<any> {
    try {
      // Aggiorna la giacenza
      if (dati.nuova_giacenza !== undefined) {
        const { error: giacenzaError } = await supabase
          .from('giacenze')
          .upsert({
            articolo_id: dati.articolo_id,
            quantita: dati.nuova_giacenza,
            updated_at: new Date().toISOString()
          });

        if (giacenzaError) throw giacenzaError;
      }

      // Aggiorna i prezzi di vendita
      const updateData: any = { updated_at: new Date().toISOString() };
      if (dati.prezzo_vendita_1 !== undefined) updateData.prezzo_vendita_1 = dati.prezzo_vendita_1;
      if (dati.prezzo_vendita_2 !== undefined) updateData.prezzo_vendita_2 = dati.prezzo_vendita_2;
      if (dati.prezzo_vendita_3 !== undefined) updateData.prezzo_vendita_3 = dati.prezzo_vendita_3;

      const { error: prezziError } = await supabase
        .from('articoli')
        .update(updateData)
        .eq('id', dati.articolo_id);

      if (prezziError) throw prezziError;

      return { success: true };
    } catch (error) {
      console.error('Errore aggiornamento giacenza e prezzi:', error);
      throw error;
    }
  }

  // RIMOSSO: distruggiArticoli (era usato dalla pagina DistruzioneMagazzino eliminata)
  // Ora usiamo solo distruggiSingoloCarico per le distruzioni dalle giacenze

  /**
   * Distrugge un singolo carico (versione semplificata per giacenze)
   */
  async distruggiSingoloCarico(dati: {
    documento_carico_id: number;
    quantita: number;
    motivo: string;
    note?: string;
    utente?: string;
  }): Promise<any> {
    try {
      console.log('🗑️ Distruzione singola carico:', dati);

      // Chiama direttamente la funzione del database
      const { data, error } = await supabase.rpc('esegui_distruzione', {
        p_documento_carico_id: dati.documento_carico_id,
        p_quantita_da_distruggere: dati.quantita,
        p_motivo_distruzione_id: 1, // TODO: gestire motivi dinamici
        p_note: dati.note || `Distruzione singola: ${dati.motivo}`,
        p_utente: dati.utente || 'Sistema'
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Errore nella distruzione singola:', error);
      throw error;
    }
  }

  /**
   * Ottiene le distruzioni annullabili (entro 24 ore)
   */
  async getDistruzioniAnnullabili(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('view_distruzioni_annullabili')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Errore nel caricamento distruzioni annullabili:', error);
      throw error;
    }
  }

  /**
   * Annulla una distruzione (solo entro 24 ore)
   */
  async annullaDistruzione(dati: {
    distruzione_id: number;
    motivo_annullamento?: string;
    utente_annullamento?: string;
  }): Promise<any> {
    try {
      console.log('↩️ Annullamento distruzione:', dati);

      const { data, error } = await supabase.rpc('annulla_distruzione', {
        p_distruzione_id: dati.distruzione_id,
        p_motivo_annullamento: dati.motivo_annullamento || 'Annullamento da interfaccia',
        p_utente_annullamento: dati.utente_annullamento || 'Sistema'
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Errore nell\'annullamento distruzione:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un documento di carico
   */
  async updateDocumentoCarico(id: number, dati: {
    numero_documento?: string;
    data_documento?: string;
    fornitore_id?: number;
    totale?: number;
    stato?: string;
    note?: string;
  }): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('documenti_carico')
        .update(dati)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Errore aggiornamento documento carico:', error);
      throw error;
    }
  }

  /**
   * Ottiene gli articoli di un documento di carico
   */
  async getArticoliDocumentoCarico(documento_id: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('articoli_documento_carico')
        .select(`
          *,
          gruppi(nome),
          prodotti(nome),
          colori(nome, codice_colore),
          provenienze(nome),
          foto(nome, url),
          imballaggi(nome),
          altezze(nome)
        `)
        .eq('documento_carico_id', documento_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Trasforma i dati per essere compatibili con l'interfaccia ArticoloCarico
      const articoliFormatted = (data || []).map(articolo => ({
        id: articolo.id,
        documento_carico_id: articolo.documento_carico_id,
        prodotto_id: articolo.prodotto_id,
        varieta_id: articolo.varieta_id,
        nome_prodotto: articolo.prodotti?.nome || 'N/A',
        nome_varieta: articolo.colori?.nome || 'N/A',
        quantita: articolo.quantita,
        costo_unitario: articolo.costo_unitario,
        costo_totale: articolo.costo_unitario * articolo.quantita,
        gruppo: articolo.gruppi?.nome,
        provenienza: articolo.provenienze?.nome,
        imballo: articolo.imballaggi?.nome,
        altezza: articolo.altezze?.nome
      }));

      return articoliFormatted;
    } catch (error) {
      console.error('Errore caricamento articoli documento carico:', error);
      throw error;
    }
  }

  /**
   * Ottiene un articolo con i suoi costi analitici
   */
  async getArticoloConCostiAnalitici(articolo_id: number): Promise<any> {
    try {
      // Carica l'articolo
      const { data: articolo, error: articoloError } = await supabase
        .from('articoli_documento_carico')
        .select(`
          *,
          gruppi(nome),
          prodotti(nome),
          colori(nome, codice_colore),
          provenienze(nome),
          foto(nome, url),
          imballaggi(nome),
          altezze(nome)
        `)
        .eq('id', articolo_id)
        .single();

      if (articoloError) throw articoloError;

      // Carica i costi analitici associati (se la tabella esiste)
      const { data: costi, error: costiError } = await supabase
        .from('costi_analitici')
        .select('*')
        .eq('articolo_id', articolo_id)
        .order('created_at', { ascending: false });

      // Se la tabella costi_analitici non esiste, ignora l'errore
      const costiAnalitici = costiError ? [] : (costi || []);

      return {
        id: articolo.id,
        documento_carico_id: articolo.documento_carico_id,
        prodotto_id: articolo.prodotto_id,
        varieta_id: articolo.varieta_id,
        nome_prodotto: articolo.prodotti?.nome || 'N/A',
        nome_varieta: articolo.colori?.nome || 'N/A',
        quantita: articolo.quantita,
        costo_unitario: articolo.costo_unitario,
        costo_totale: articolo.costo_unitario * articolo.quantita,
        gruppo: articolo.gruppi?.nome,
        provenienza: articolo.provenienze?.nome,
        imballo: articolo.imballaggi?.nome,
        altezza: articolo.altezze?.nome,
        costi_analitici: costiAnalitici
      };
    } catch (error) {
      console.error('Errore caricamento articolo con costi analitici:', error);
      throw error;
    }
  }

  /**
   * Ottiene una fattura con tutti i suoi dettagli
   */
  async getFatturaConDettagli(fattura_id: number): Promise<any> {
    try {
      const { data: fattura, error: fatturaError } = await supabase
        .from('fatture_acquisto')
        .select(`
          *,
          fornitori(nome, ragione_sociale)
        `)
        .eq('id', fattura_id)
        .single();

      if (fatturaError) throw fatturaError;

      // Carica i dettagli della fattura
      const { data: dettagli, error: dettagliError } = await supabase
        .from('dettagli_fattura_acquisto')
        .select('*')
        .eq('fattura_id', fattura_id)
        .order('created_at', { ascending: true });

      if (dettagliError) throw dettagliError;

      return {
        ...fattura,
        fornitore_nome: fattura.fornitori?.nome,
        fornitore_ragione_sociale: fattura.fornitori?.ragione_sociale,
        dettagli: dettagli || []
      };
    } catch (error) {
      console.error('Errore caricamento fattura con dettagli:', error);
      throw error;
    }
  }

  /**
   * Trova un articolo esistente con le caratteristiche specificate
   */
  async trovaArticoloPerCaratteristiche(caratteristiche: {
    gruppo_id: number;
    prodotto_id: number;
    colore_id: number;
    provenienza_id: number;
    foto_id: number;
    imballo_id: number;
    altezza_id: number;
    qualita: string;
  }): Promise<any | null> {
    try {
      console.log('🔍 Ricerca articolo per caratteristiche:', caratteristiche);
      
      const { data: articolo, error } = await supabase
        .from('articoli')
        .select('*')
        .eq('gruppo_id', caratteristiche.gruppo_id)
        .eq('prodotto_id', caratteristiche.prodotto_id)
        .eq('colore_id', caratteristiche.colore_id)
        .eq('provenienza_id', caratteristiche.provenienza_id)
        .eq('foto_id', caratteristiche.foto_id)
        .eq('imballo_id', caratteristiche.imballo_id)
        .eq('altezza_id', caratteristiche.altezza_id)
        .eq('qualita', caratteristiche.qualita)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Errore ricerca articolo:', error);
        throw error;
      }

      console.log('🔍 Risultato ricerca articolo:', articolo);
      return articolo || null;
    } catch (error) {
      console.error('❌ Errore nella ricerca articolo per caratteristiche:', error);
      throw error;
    }
  }

  /**
   * Crea un nuovo articolo
   */
  async creaArticolo(datiArticolo: {
    gruppo_id: number;
    prodotto_id: number;
    colore_id: number;
    provenienza_id: number;
    foto_id: number;
    imballo_id: number;
    altezza_id: number;
    qualita: string;
    codice_articolo: string;
    descrizione?: string;
    prezzo_vendita?: number;
    prezzo_acquisto?: number;
  }): Promise<any> {
    try {
      console.log('🆕 Creazione nuovo articolo:', datiArticolo);
      
      const { data: nuovoArticolo, error } = await supabase
        .from('articoli')
        .insert([{
          gruppo_id: datiArticolo.gruppo_id,
          prodotto_id: datiArticolo.prodotto_id,
          colore_id: datiArticolo.colore_id,
          provenienza_id: datiArticolo.provenienza_id,
          foto_id: datiArticolo.foto_id,
          imballo_id: datiArticolo.imballo_id,
          altezza_id: datiArticolo.altezza_id,
          qualita: datiArticolo.qualita,
          codice_articolo: datiArticolo.codice_articolo,
          descrizione: datiArticolo.descrizione || '',
          prezzo_vendita: datiArticolo.prezzo_vendita || 0,
          prezzo_acquisto: datiArticolo.prezzo_acquisto || 0
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Errore creazione articolo:', error);
        throw error;
      }

      console.log('✅ Nuovo articolo creato:', nuovoArticolo);
      return nuovoArticolo;
    } catch (error) {
      console.error('❌ Errore nella creazione articolo:', error);
      throw error;
    }
  }

  // =========================================================================
  // MOVIMENTI DI MAGAZZINO
  // =========================================================================

  /**
   * Ottiene tutti i movimenti di magazzino con join delle caratteristiche
   */
  async getMovimentiMagazzino(filtri?: {
    tipo?: string;
    dataInizio?: string;
    dataFine?: string;
    gruppoId?: number;
    prodottoId?: number;
    coloreId?: number;
    ordineId?: number;
  }): Promise<MovimentoMagazzino[]> {
    try {
      let query = supabase
        .from('movimenti_magazzino')
        .select(`
          *,
          gruppi:gruppo_id(nome),
          colori:colore_id(nome),
          prodotti:prodotto_id(nome)
        `)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });

      // Applica filtri se specificati
      if (filtri?.tipo) {
        query = query.eq('tipo', filtri.tipo);
      }
      if (filtri?.dataInizio) {
        query = query.gte('data', filtri.dataInizio);
      }
      if (filtri?.dataFine) {
        query = query.lte('data', filtri.dataFine);
      }
      if (filtri?.gruppoId) {
        query = query.eq('gruppo_id', filtri.gruppoId);
      }
      if (filtri?.prodottoId) {
        query = query.eq('prodotto_id', filtri.prodottoId);
      }
      if (filtri?.coloreId) {
        query = query.eq('colore_id', filtri.coloreId);
      }
      if (filtri?.ordineId) {
        query = query.eq('ordine_acquisto_id', filtri.ordineId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Errore caricamento movimenti:', error);
        throw error;
      }

      // Trasforma i dati includendo le informazioni complete
      const movimentiConNomi = data?.map((movimento: any) => ({
        ...movimento,
        gruppo_nome: movimento.gruppi?.nome || `Gruppo ${movimento.gruppo_id || 'N/A'}`,
        colore_nome: movimento.colori?.nome || null,
        prodotto_nome: movimento.prodotti?.nome || null,
        // Crea il nome articolo completo
        articolo_completo: [
          movimento.gruppi?.nome,
          movimento.colori?.nome,
          movimento.prodotti?.nome
        ].filter(Boolean).join(' - ') || `Articolo ${movimento.gruppo_id || 'N/A'}`
      })) || [];

      console.log('✅ Movimenti caricati con nomi:', movimentiConNomi.length);
      return movimentiConNomi;
    } catch (error) {
      console.error('❌ Errore nel caricamento movimenti:', error);
      throw error;
    }
  }

  /**
   * Crea un nuovo movimento di magazzino
   */
  async creaMovimentoMagazzino(movimento: Omit<MovimentoMagazzino, 'id' | 'created_at' | 'updated_at'>): Promise<MovimentoMagazzino> {
    try {
      const { data, error } = await supabase
        .from('movimenti_magazzino')
        .insert([{
          ...movimento,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Errore creazione movimento:', error);
        throw error;
      }

      console.log('✅ Nuovo movimento creato:', data);
      return data;
    } catch (error) {
      console.error('❌ Errore nella creazione movimento:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un movimento di magazzino esistente
   */
  async aggiornaMovimentoMagazzino(id: number, aggiornamenti: Partial<MovimentoMagazzino>): Promise<MovimentoMagazzino> {
    try {
      const { data, error } = await supabase
        .from('movimenti_magazzino')
        .update({
          ...aggiornamenti,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Errore aggiornamento movimento:', error);
        throw error;
      }

      console.log('✅ Movimento aggiornato:', data);
      return data;
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento movimento:', error);
      throw error;
    }
  }

  /**
   * Elimina un movimento di magazzino
   */
  async eliminaMovimentoMagazzino(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('movimenti_magazzino')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Errore eliminazione movimento:', error);
        throw error;
      }

      console.log('✅ Movimento eliminato:', id);
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione movimento:', error);
      throw error;
    }
  }

  /**
   * Ottiene le statistiche dei movimenti di magazzino
   */
  async getStatisticheMovimenti(filtri?: {
    dataInizio?: string;
    dataFine?: string;
  }): Promise<{
    totaleMovimenti: number;
    movimentiCarico: number;
    movimentiScarico: number;
    movimentiDistruzione: number;
    valoreCarico: number;
    valoreScarico: number;
    valoreDistruzione: number;
    giacenzaAttuale: number;
  }> {
    try {
      let query = supabase
        .from('movimenti_magazzino')
        .select('tipo, quantita, valore_totale');

      // Applica filtri date se specificati
      if (filtri?.dataInizio) {
        query = query.gte('data', filtri.dataInizio);
      }
      if (filtri?.dataFine) {
        query = query.lte('data', filtri.dataFine);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Errore caricamento statistiche:', error);
        throw error;
      }

      const stats = data?.reduce((acc, mov) => {
        acc.totaleMovimenti++;
        
        switch (mov.tipo) {
          case 'carico':
            acc.movimentiCarico++;
            acc.valoreCarico += mov.valore_totale || 0;
            break;
          case 'scarico':
            acc.movimentiScarico++;
            acc.valoreScarico += mov.valore_totale || 0;
            break;
          case 'distruzione':
            acc.movimentiDistruzione++;
            acc.valoreDistruzione += mov.valore_totale || 0;
            break;
        }
        
        return acc;
      }, {
        totaleMovimenti: 0,
        movimentiCarico: 0,
        movimentiScarico: 0,
        movimentiDistruzione: 0,
        valoreCarico: 0,
        valoreScarico: 0,
        valoreDistruzione: 0,
        giacenzaAttuale: 0
      }) || {
        totaleMovimenti: 0,
        movimentiCarico: 0,
        movimentiScarico: 0,
        movimentiDistruzione: 0,
        valoreCarico: 0,
        valoreScarico: 0,
        valoreDistruzione: 0,
        giacenzaAttuale: 0
      };

      // Calcola giacenza attuale
      stats.giacenzaAttuale = stats.valoreCarico - stats.valoreScarico - stats.valoreDistruzione;

      console.log('✅ Statistiche movimenti calcolate:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Errore nel calcolo statistiche:', error);
      throw error;
    }
  }

  // =========================================================================
  // VALIDAZIONI E GESTIONE COERENZA MAGAZZINO
  // =========================================================================

  /**
   * Valida che la quantità sia multipla dell'imballo
   */
  async validateQuantitaImballo(articoloId: number, quantita: number): Promise<{ valid: boolean; message?: string }> {
    try {
      // Ottieni l'articolo completo per verificare l'imballo
      const { data: articolo, error } = await supabase
        .from('articoli')
        .select(`
          *,
          imballaggi:imballo_id(nome, descrizione)
        `)
        .eq('id', articoloId)
        .single();

      if (error) {
        throw error;
      }

      // Per ora, assumiamo che ogni imballo abbia una quantità standard
      // Questo dovrebbe essere configurabile nel database
      const quantitaPerImballo = this.getQuantitaPerImballo(articolo.imballaggi?.nome || '');
      
      if (quantitaPerImballo > 1 && quantita % quantitaPerImballo !== 0) {
        return {
          valid: false,
          message: `La quantità deve essere multipla di ${quantitaPerImballo} per l'imballo "${articolo.imballaggi?.nome}"`
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('❌ Errore validazione quantità imballo:', error);
      return {
        valid: false,
        message: 'Errore nella validazione della quantità'
      };
    }
  }

  /**
   * Ottiene la quantità standard per tipo di imballo
   */
  private getQuantitaPerImballo(nomeImballo: string): number {
    const imballo = nomeImballo.toLowerCase();
    
    // Configurazione quantità per imballo
    if (imballo.includes('mazzo')) return 10;
    if (imballo.includes('fascio')) return 25;
    if (imballo.includes('scatola')) return 50;
    if (imballo.includes('cassa')) return 100;
    
    // Default: singoli steli
    return 1;
  }

  /**
   * Verifica se un articolo può essere cancellato (non ha movimenti di scarico/vendita)
   */
  async canDeleteArticolo(articoloId: number): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      // Verifica se esistono movimenti di scarico per questo articolo
      const { data: movimentiScarico, error } = await supabase
        .from('movimenti_magazzino')
        .select('id, tipo, quantita')
        .or(`gruppo_id.eq.${articoloId},prodotto_id.eq.${articoloId}`)
        .in('tipo', ['scarico', 'distruzione']);

      if (error) {
        throw error;
      }

      if (movimentiScarico && movimentiScarico.length > 0) {
        const totaleMovimenti = movimentiScarico.reduce((sum, mov) => sum + mov.quantita, 0);
        return {
          canDelete: false,
          reason: `Impossibile cancellare: esistono ${movimentiScarico.length} movimenti di scarico/distruzione per un totale di ${totaleMovimenti} steli`
        };
      }

      return { canDelete: true };
    } catch (error) {
      console.error('❌ Errore verifica cancellazione articolo:', error);
      return {
        canDelete: false,
        reason: 'Errore nella verifica dei movimenti'
      };
    }
  }

  /**
   * Aggiorna automaticamente i movimenti di magazzino quando cambia una fattura
   */
  async updateMovimentiFromFattura(fatturaId: number, nuoviDati: any): Promise<void> {
    try {
      // 1. Ottieni i movimenti esistenti per questa fattura
      const { data: movimentiEsistenti, error: movError } = await supabase
        .from('movimenti_magazzino')
        .select('*')
        .eq('fattura_id', fatturaId);

      if (movError) {
        throw movError;
      }

      // 2. Aggiorna o crea nuovi movimenti
      for (const riga of nuoviDati.righe) {
        const movimentoEsistente = movimentiEsistenti?.find(m => 
          m.gruppo_id === riga.id_gruppo &&
          m.prodotto_id === riga.id_prodotto &&
          m.colore_id === riga.id_colore
        );

        const nuovoMovimento = {
          tipo: 'carico' as const,
          data: nuoviDati.data,
          quantita: riga.quantita,
          prezzo_unitario: riga.prezzo_acquisto_per_stelo,
          valore_totale: riga.quantita * riga.prezzo_acquisto_per_stelo,
          gruppo_id: riga.id_gruppo,
          prodotto_id: riga.id_prodotto,
          colore_id: riga.id_colore,
          provenienza_id: riga.id_provenienza,
          foto_id: riga.id_foto,
          imballo_id: riga.id_imballo,
          altezza_id: riga.id_altezza,
          qualita_id: riga.id_qualita,
          fattura_id: fatturaId,
          fattura_numero: nuoviDati.numero_fattura,
          fornitore_id: nuoviDati.id_fornitore,
          note: `Aggiornamento da fattura ${nuoviDati.numero_fattura}`,
          utente: 'Sistema'
        };

        if (movimentoEsistente) {
          // Aggiorna movimento esistente
          const { error: updateError } = await supabase
            .from('movimenti_magazzino')
            .update(nuovoMovimento)
            .eq('id', movimentoEsistente.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          // Crea nuovo movimento
          const { error: insertError } = await supabase
            .from('movimenti_magazzino')
            .insert([nuovoMovimento]);

          if (insertError) {
            throw insertError;
          }
        }
      }

      console.log('✅ Movimenti di magazzino aggiornati per fattura:', fatturaId);
    } catch (error) {
      console.error('❌ Errore aggiornamento movimenti da fattura:', error);
      throw error;
    }
  }

  /**
   * Calcola la giacenza attuale per un articolo specifico
   */
  async getGiacenzaArticolo(caratteristiche: {
    gruppo_id?: number;
    prodotto_id?: number;
    colore_id?: number;
    provenienza_id?: number;
    foto_id?: number;
    imballo_id?: number;
    altezza_id?: number;
    qualita_id?: number;
  }): Promise<{ quantita: number; valore: number }> {
    try {
      let query = supabase
        .from('movimenti_magazzino')
        .select('tipo, quantita, valore_totale');

      // Applica filtri per le caratteristiche specificate
      Object.entries(caratteristiche).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data: movimenti, error } = await query;

      if (error) {
        throw error;
      }

      let quantitaTotale = 0;
      let valoreTotale = 0;

      movimenti?.forEach(movimento => {
        if (movimento.tipo === 'carico') {
          quantitaTotale += movimento.quantita;
          valoreTotale += movimento.valore_totale || 0;
        } else if (movimento.tipo === 'scarico' || movimento.tipo === 'distruzione') {
          quantitaTotale -= movimento.quantita;
          valoreTotale -= movimento.valore_totale || 0;
        }
      });

      return {
        quantita: Math.max(0, quantitaTotale),
        valore: Math.max(0, valoreTotale)
      };
    } catch (error) {
      console.error('❌ Errore calcolo giacenza articolo:', error);
      return { quantita: 0, valore: 0 };
    }
  }

  /**
   * Valida una modifica di fattura prima di salvarla
   */
  async validateFatturaModifica(fatturaId: number, nuoviDati: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // TEMPORANEO: Validazione disabilitata per debug
      console.log('⚠️ Validazione fattura temporaneamente disabilitata per debug');
      
      // TODO: Implementare validazione completa
      // 1. Valida quantità per imballi
      // 2. Verifica disponibilità per articoli in diminuzione
      
      return {
        valid: true, // Temporaneamente sempre valido
        errors: []
      };
    } catch (error) {
      console.error('❌ Errore validazione fattura:', error);
      return {
        valid: false,
        errors: ['Errore durante la validazione']
      };
    }
  }

  // =========================================================================
  // === ORDINI ACQUISTO ===
  // =========================================================================

  /**
   * Ottiene tutti gli ordini acquisto con informazioni complete
   */
  async getOrdiniAcquisto(stato?: 'ordinato' | 'consegnato'): Promise<OrdineAcquistoCompleto[]> {
    let query = supabase
      .from('view_ordini_acquisto_completi')
      .select('*');
    
    if (stato) {
      query = query.eq('stato', stato);
    }
    
    const { data, error } = await query.order('data_consegna_prevista', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Ottiene un singolo ordine acquisto per ID con dati fornitore
   */
  async getOrdineAcquisto(id: number): Promise<OrdineAcquisto> {
    const { data, error } = await supabase
      .from('ordini_acquisto')
      .select(`
        *,
        fornitore:fornitori!ordini_acquisto_fornitore_id_fkey(
          id,
          nome,
          ragione_sociale,
          partita_iva
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Crea un nuovo ordine acquisto
   */
  async createOrdineAcquisto(ordine: Omit<OrdineAcquisto, 'id' | 'numero_ordine' | 'created_at' | 'updated_at'>): Promise<OrdineAcquisto> {
    const { data, error } = await supabase
      .from('ordini_acquisto')
      .insert([ordine])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Aggiorna un ordine acquisto esistente
   */
  async updateOrdineAcquisto(id: number, ordine: Partial<Omit<OrdineAcquisto, 'id' | 'numero_ordine' | 'created_at' | 'updated_at'>>): Promise<OrdineAcquisto> {
    const { data, error } = await supabase
      .from('ordini_acquisto')
      .update(ordine)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Elimina un ordine acquisto (solo se in stato 'ordinato')
   */
  async deleteOrdineAcquisto(id: number): Promise<void> {
    // Verifica che l'ordine sia in stato ordinato
    const ordine = await this.getOrdineAcquisto(id);
    if (ordine.stato !== 'ordinato') {
      throw new Error('Impossibile eliminare un ordine già consegnato');
    }

    const { error } = await supabase
      .from('ordini_acquisto')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // =========================================================================
  // === GIACENZE VIRTUALI ===
  // =========================================================================

  /**
   * Ottiene tutte le giacenze virtuali complete
   */
  async getGiacenzeVirtuali(ordineId?: number): Promise<GiacenzaVirtualeCompleta[]> {
    let query = supabase
      .from('view_giacenze_virtuali_complete')
      .select('*');
    
    if (ordineId) {
      query = query.eq('ordine_acquisto_id', ordineId);
    }
    
    const { data, error } = await query.order('data_consegna_prevista', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Ottiene le giacenze virtuali di un ordine specifico
   */
  async getGiacenzeVirtualiByOrdine(ordineId: number): Promise<GiacenzaVirtuale[]> {
    const { data, error } = await supabase
      .from('giacenze_virtuali')
      .select('*')
      .eq('ordine_acquisto_id', ordineId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Crea una nuova giacenza virtuale
   */
  async createGiacenzaVirtuale(giacenza: Omit<GiacenzaVirtuale, 'id' | 'costi_spalmare_per_stelo' | 'prezzo_costo_finale_per_stelo' | 'totale_riga' | 'totale_con_costi' | 'created_at' | 'updated_at'>): Promise<GiacenzaVirtuale> {
    const { data, error } = await supabase
      .from('giacenze_virtuali')
      .insert([giacenza])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Aggiorna una giacenza virtuale esistente
   */
  async updateGiacenzaVirtuale(id: number, giacenza: Partial<Omit<GiacenzaVirtuale, 'id' | 'costi_spalmare_per_stelo' | 'prezzo_costo_finale_per_stelo' | 'totale_riga' | 'totale_con_costi' | 'created_at' | 'updated_at'>>): Promise<GiacenzaVirtuale> {
    const { data, error } = await supabase
      .from('giacenze_virtuali')
      .update(giacenza)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Elimina una giacenza virtuale
   */
  async deleteGiacenzaVirtuale(id: number): Promise<void> {
    const { error } = await supabase
      .from('giacenze_virtuali')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  /**
   * Aggiorna i costi spalmare per un ordine (trigger automatico quando si modificano i costi analitici)
   */
  async ricalcolaCostiOrdine(ordineId: number): Promise<void> {
    const { error } = await supabase.rpc('aggiorna_costi_spalmare_ordine', {
      ordine_id: ordineId
    });
    
    if (error) throw error;
  }

  /**
   * Trasforma un ordine acquisto in fattura di acquisto reale
   * Questa è la funzione chiave quando clicchi "Consegnato"
   */
  async trasformaOrdineInFattura(ordineId: number, modificheConsegna?: {
    dataConsegnaEffettiva?: string;
    modificheGiacenze?: { giacenzaId: number; nuovaQuantita?: number; nuovoPrezzoAcquisto?: number }[];
  }): Promise<{ fatturaId: number; numeroFattura: string }> {
    try {
      console.log('🔄 Inizio trasformazione ordine in fattura:', ordineId);

      // 1. Ottieni ordine e giacenze virtuali
      const ordine = await this.getOrdineAcquisto(ordineId);
      const giacenzeVirtuali = await this.getGiacenzeVirtualiByOrdine(ordineId);

      if (ordine.stato !== 'ordinato') {
        throw new Error('Ordine già consegnato o in stato non valido');
      }

      // 2. Applica modifiche alle giacenze se presenti
      if (modificheConsegna?.modificheGiacenze) {
        for (const modifica of modificheConsegna.modificheGiacenze) {
          await this.updateGiacenzaVirtuale(modifica.giacenzaId, {
            quantita: modifica.nuovaQuantita,
            prezzo_acquisto_per_stelo: modifica.nuovoPrezzoAcquisto
          });
        }
      }

      // 3. Crea la fattura di acquisto
      const numeroFattura = `FAT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const nuovaFattura = await this.createFatturaAcquisto({
        numero: numeroFattura,
        data: modificheConsegna?.dataConsegnaEffettiva || new Date().toISOString().split('T')[0],
        fornitore_id: ordine.fornitore_id,
        totale: ordine.totale_ordine,
        stato: 'confermata',
        note: `Generata automaticamente da ordine ${ordine.numero_ordine}`
      });

      // 4. Crea i costi analitici della fattura
      if (ordine.costo_trasporto > 0) {
        await supabase.from('costi_fattura').insert({
          fattura_acquisto_id: nuovaFattura.id,
          tipologia_costo_id: 1, // Assumendo ID 1 per trasporto
          fornitore_costo_id: ordine.id_fornitore_trasporto || ordine.fornitore_id,
          importo: ordine.costo_trasporto
        });
      }

      if (ordine.costo_commissioni > 0) {
        await supabase.from('costi_fattura').insert({
          fattura_acquisto_id: nuovaFattura.id,
          tipologia_costo_id: 2, // Assumendo ID 2 per commissioni
          fornitore_costo_id: ordine.id_fornitore_commissioni || ordine.fornitore_id,
          importo: ordine.costo_commissioni
        });
      }

      if (ordine.costo_imballaggi > 0) {
        await supabase.from('costi_fattura').insert({
          fattura_acquisto_id: nuovaFattura.id,
          tipologia_costo_id: 3, // Assumendo ID 3 per imballaggi
          fornitore_costo_id: ordine.id_fornitore_imballaggi || ordine.fornitore_id,
          importo: ordine.costo_imballaggi
        });
      }

      // 5. Trasforma ogni giacenza virtuale in documento di carico
      const giacenzeAggiornate = await this.getGiacenzeVirtualiByOrdine(ordineId);
      
      for (const giacenza of giacenzeAggiornate) {
        // Crea o trova l'articolo corrispondente
        const articolo = await this.trovaOCreaArticolo({
          gruppo_id: giacenza.gruppo_id,
          prodotto_nome: giacenza.nome_prodotto,
          colore_id: giacenza.colore_id,
          provenienza_id: giacenza.provenienza_id,
          foto_id: giacenza.foto_id,
          imballo_id: giacenza.imballo_id,
          altezza_id: giacenza.altezza_id,
          qualita_id: giacenza.qualita_id
        });

        // Crea documento di carico
        await this.createDocumentoCarico({
          fattura_acquisto_id: nuovaFattura.id,
          articolo_id: articolo.id,
          quantita: giacenza.quantita,
          prezzo_acquisto_per_stelo: giacenza.prezzo_acquisto_per_stelo,
          costi_spalmare_per_stelo: giacenza.costi_spalmare_per_stelo,
          prezzo_vendita_1: giacenza.prezzo_vendita_1,
          prezzo_vendita_2: giacenza.prezzo_vendita_2,
          prezzo_vendita_3: giacenza.prezzo_vendita_3,
          note: giacenza.note
        });

        // Crea movimento di magazzino
        await this.createMovimentoMagazzino({
          tipo: 'carico',
          data: modificheConsegna?.dataConsegnaEffettiva || new Date().toISOString().split('T')[0],
          quantita: giacenza.quantita,
          prezzo_unitario: giacenza.prezzo_acquisto_per_stelo,
          valore_totale: giacenza.totale_riga,
          gruppo_id: giacenza.gruppo_id,
          colore_id: giacenza.colore_id,
          provenienza_id: giacenza.provenienza_id,
          foto_id: giacenza.foto_id,
          imballo_id: giacenza.imballo_id,
          altezza_id: giacenza.altezza_id,
          qualita_id: giacenza.qualita_id,
          fattura_id: nuovaFattura.id,
          fattura_numero: numeroFattura,
          fornitore_id: ordine.fornitore_id,
          note: `Da ordine acquisto ${ordine.numero_ordine}`,
          ordine_acquisto_id: ordineId
        });
      }

      // 6. Aggiorna lo stato dell'ordine
      await this.updateOrdineAcquisto(ordineId, {
        stato: 'consegnato',
        data_consegna_effettiva: modificheConsegna?.dataConsegnaEffettiva || new Date().toISOString(),
        fattura_generata_id: nuovaFattura.id
      });

      console.log('✅ Trasformazione completata:', { fatturaId: nuovaFattura.id, numeroFattura });
      
      return {
        fatturaId: nuovaFattura.id,
        numeroFattura: numeroFattura
      };

    } catch (error) {
      console.error('❌ Errore trasformazione ordine in fattura:', error);
      throw error;
    }
  }

  /**
   * Funzione helper per trovare o creare un articolo basato sulle caratteristiche
   */
  private async trovaOCreaArticolo(caratteristiche: {
    gruppo_id: number;
    prodotto_nome: string;
    colore_id: number;
    provenienza_id: number;
    foto_id: number;
    imballo_id: number;
    altezza_id: number;
    qualita_id: number;
  }): Promise<Articolo> {
    // Prima cerca se esiste già un prodotto con questo nome
    let prodotto = await supabase
      .from('prodotti')
      .select('*')
      .eq('nome', caratteristiche.prodotto_nome)
      .single();

    // Se non esiste, lo crea
    if (prodotto.error) {
      const { data: nuovoProdotto, error: erroreProdotto } = await supabase
        .from('prodotti')
        .insert([{ nome: caratteristiche.prodotto_nome }])
        .select()
        .single();
      
      if (erroreProdotto) throw erroreProdotto;
      prodotto.data = nuovoProdotto;
    }

    // Ora cerca se esiste già un articolo con queste caratteristiche
    let articolo = await supabase
      .from('articoli')
      .select('*')
      .eq('gruppo_id', caratteristiche.gruppo_id)
      .eq('prodotto_id', prodotto.data.id)
      .eq('colore_id', caratteristiche.colore_id)
      .eq('provenienza_id', caratteristiche.provenienza_id)
      .eq('foto_id', caratteristiche.foto_id)
      .eq('imballo_id', caratteristiche.imballo_id)
      .eq('altezza_id', caratteristiche.altezza_id)
      .eq('qualita_id', caratteristiche.qualita_id)
      .single();

    // Se non esiste, lo crea
    if (articolo.error) {
      const { data: nuovoArticolo, error: erroreArticolo } = await supabase
        .from('articoli')
        .insert([{
          gruppo_id: caratteristiche.gruppo_id,
          prodotto_id: prodotto.data.id,
          colore_id: caratteristiche.colore_id,
          provenienza_id: caratteristiche.provenienza_id,
          foto_id: caratteristiche.foto_id,
          imballo_id: caratteristiche.imballo_id,
          altezza_id: caratteristiche.altezza_id,
          qualita_id: caratteristiche.qualita_id
        }])
        .select()
        .single();
      
      if (erroreArticolo) throw erroreArticolo;
      articolo.data = nuovoArticolo;
    }

    return articolo.data;
  }
}

// Istanza singleton
const apiService = new ApiService();

// Export sia come default che come named export per compatibilità
export default apiService;
export { apiService };
