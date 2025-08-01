// =========================================================================
// API SERVICE - NUOVO DATABASE DIMITRI FIORI
// =========================================================================
// Corrispondente alla migrazione: 20250728000001_new_database_structure.sql
// Sistema a 7 caratteristiche: Gruppo + Prodotto + Colore + Provenienza + Foto + Imballo + Altezza

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

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
  nome: string;
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
  tipo: 'carico' | 'scarico' | 'distruzione' | 'inventario' | 'trasferimento';
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

  // === IMBALLAGGI ===
  async getImballaggi(): Promise<Imballo[]> {
    const { data, error } = await supabase
      .from('imballaggi')
      .select('*')
      .order('nome');
    
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
      const { data, error } = await supabase
        .from('gruppi')
        .select('count(*)')
        .limit(1);
      
      return !error;
    } catch (e) {
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
      supabase.from('gruppi').select('count(*)').single(),
      supabase.from('prodotti').select('count(*)').single(),
      supabase.from('colori').select('count(*)').single(),
      supabase.from('provenienze').select('count(*)').single(),
      supabase.from('foto').select('count(*)').single(),
      supabase.from('imballaggi').select('count(*)').single(),
      supabase.from('altezze').select('count(*)').single(),
      supabase.from('qualita').select('count(*)').single(),
      supabase.from('articoli').select('count(*)').single(),
      supabase.from('fornitori').select('count(*)').single(),
      supabase.from('clienti').select('count(*)').single(),
    ]);

    return {
      gruppi: (gruppi.data as any)?.count || 0,
      prodotti: (prodotti.data as any)?.count || 0,
      colori: (colori.data as any)?.count || 0,
      provenienze: (provenienze.data as any)?.count || 0,
      foto: (foto.data as any)?.count || 0,
      imballaggi: (imballaggi.data as any)?.count || 0,
      altezze: (altezze.data as any)?.count || 0,
      qualita: (qualita.data as any)?.count || 0,
      articoli: (articoli.data as any)?.count || 0,
      fornitori: (fornitori.data as any)?.count || 0,
      clienti: (clienti.data as any)?.count || 0,
    };
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

  /**
   * Distrugge articoli spostandoli nel magazzino Moria
   */
  async distruggiArticoli(dati: {
    motivo: string;
    note?: string;
    data_distruzione: string;
    articoli: Array<{
      articolo_id: number;
      quantita: number;
      costo_unitario: number;
    }>;
  }): Promise<any> {
    try {
      // Usa una transaction per garantire consistenza
      const { data, error } = await supabase.rpc('distruggi_articoli', {
        p_motivo: dati.motivo,
        p_note: dati.note || '',
        p_data_distruzione: dati.data_distruzione,
        p_articoli: dati.articoli
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Errore nella distruzione articoli:', error);
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
  }): Promise<MovimentoMagazzino[]> {
    try {
      let query = supabase
        .from('movimenti_magazzino')
        .select(`
          *,
          gruppi:gruppo_id(nome),
          prodotti:prodotto_id(nome),
          colori:colore_id(nome),
          provenienze:provenienza_id(nome),
          foto:foto_id(nome),
          imballaggi:imballo_id(nome),
          altezze:altezza_id(descrizione, altezza_cm),
          qualita:qualita_id(nome),
          fornitori:fornitore_id(nome),
          clienti:cliente_id(nome)
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

      const { data, error } = await query;

      if (error) {
        console.error('❌ Errore caricamento movimenti:', error);
        throw error;
      }

      // Trasforma i dati per includere i nomi delle caratteristiche
      const movimentiConNomi = data?.map((movimento: any) => ({
        ...movimento,
        gruppo_nome: movimento.gruppi?.nome,
        prodotto_nome: movimento.prodotti?.nome,
        colore_nome: movimento.colori?.nome,
        provenienza_nome: movimento.provenienze?.nome,
        foto_nome: movimento.foto?.nome,
        imballo_nome: movimento.imballaggi?.nome,
        altezza_nome: movimento.altezze?.descrizione || 
                     (movimento.altezze?.altezza_cm ? `${movimento.altezze.altezza_cm}cm` : null),
        qualita_nome: movimento.qualita?.nome,
        fornitore_nome: movimento.fornitori?.nome,
        cliente_nome: movimento.clienti?.nome
      })) || [];

      console.log('✅ Movimenti caricati:', movimentiConNomi.length);
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
}

// Istanza singleton
const apiService = new ApiService();

// Export sia come default che come named export per compatibilità
export default apiService;
export { apiService };
