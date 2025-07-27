// Servizio API per il frontend - connessione al server JSON
const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🔗 URL costruito:', url);
    console.log('📤 Opzioni richiesta:', options);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error(`❌ Errore API ${endpoint}:`, error);
      throw error;
    }
  }

  // Metodi generici per richieste HTTP
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // === API GRUPPI ===
  async getGruppi(includeZero: boolean = false) {
    const endpoint = includeZero ? '/gruppi?include_zero=true' : '/gruppi';
    return this.request<any[]>(endpoint);
  }

  async createGruppo(nome: string, descrizione?: string) {
    return this.request<any>('/gruppi', {
      method: 'POST',
      body: JSON.stringify({ nome, descrizione }),
    });
  }

  async updateGruppo(id: string, data: { nome: string; descrizione?: string }) {
    return this.request<any>(`/gruppi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGruppo(id: string) {
    return this.request<any>(`/gruppi/${id}`, {
      method: 'DELETE',
    });
  }

  // === API PRODOTTI ===
  async getProdotti(includeZero: boolean = false) {
    const endpoint = includeZero ? '/prodotti?include_zero=true' : '/prodotti';
    return this.request<any[]>(endpoint);
  }

  async createProdotto(data: { nome: string; gruppo_id: string; descrizione?: string }) {
    return this.request<any>('/prodotti', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProdotto(id: string, data: { nome: string; gruppo_id: string; descrizione?: string }) {
    return this.request<any>(`/prodotti/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProdotto(id: string) {
    return this.request<any>(`/prodotti/${id}`, {
      method: 'DELETE',
    });
  }

  // === API VARIETÀ ===
  async getVarieta(includeZero: boolean = false) {
    const endpoint = includeZero ? '/varieta?include_zero=true' : '/varieta';
    return this.request<any[]>(endpoint);
  }

  async getVarietaWithGiacenza() {
    return this.request<any[]>('/varieta/giacenza');
  }

  async createVarieta(data: {
    nome: string;
    prodotto_id?: number;
    colore_id?: number;
    altezza_id?: number;
    qualita_id?: number;
    provenienza_id?: number;
    prezzo_acquisto?: number;
    prezzo_vendita?: number;
    percentuale_vendita?: number;
  }) {
    return this.request<any>('/varieta', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // === API GIACENZE ===
  async getGiacenze() {
    return this.request<any[]>('/giacenze');
  }

  async createGiacenza(data: {
    varieta_id: number;
    quantita: number;
    prezzo_acquisto: number;
    data_acquisto?: string;
    imballo?: number;
    fattura_id?: number;
    note?: string;
  }) {
    return this.request<any>('/giacenze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGiacenza(varietaId: number, quantita: number, dataAcquisto?: string, imballo?: number) {
    return this.request<any>(`/giacenze/${varietaId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantita, data_acquisto: dataAcquisto, imballo }),
    });
  }

  async updateGiacenzaById(giacenzaId: number, data: {
    quantita?: number;
    prezzo_acquisto?: number;
    prezzo_vendita?: number;
    imballo?: number;
  }) {
    return this.request<any>(`/giacenze/${giacenzaId}/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async incrementaGiacenza(varietaId: number, quantita: number, prezzoAcquisto: number, fatturaId?: number, imballo?: number) {
    return this.request<any>(`/giacenze/${varietaId}/incrementa`, {
      method: 'POST',
      body: JSON.stringify({ quantita, prezzo_acquisto: prezzoAcquisto, fattura_id: fatturaId, imballo }),
    });
  }

  async scaricaGiacenza(varietaId: number, quantita: number, fatturaId?: number) {
    return this.request<any>(`/giacenze/${varietaId}/scarica`, {
      method: 'PUT',
      body: JSON.stringify({ quantita, fattura_id: fatturaId }),
    });
  }

  // === API MOVIMENTI MAGAZZINO ===
  async getMovimentiMagazzino(varietaId?: number, dataInizio?: string, dataFine?: string) {
    let endpoint = '/movimenti-magazzino';
    const params = new URLSearchParams();
    if (varietaId) params.append('varieta_id', varietaId.toString());
    if (dataInizio) params.append('data_inizio', dataInizio);
    if (dataFine) params.append('data_fine', dataFine);
    if (params.toString()) endpoint += `?${params.toString()}`;
    
    return this.request<any[]>(endpoint);
  }

  async createMovimento(data: {
    varieta_id: number;
    tipo: 'carico' | 'scarico' | 'distruzione';
    quantita: number;
    prezzo_unitario?: number;
    fattura_id?: number;
    imballo?: number;
    note?: string;
  }) {
    return this.request<any>('/movimenti-magazzino', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // === API CLIENTI ===
  async getClienti() {
    return this.request<any[]>('/clienti');
  }

  async createCliente(data: {
    nome: string;
    cognome?: string;
    email?: string;
    telefono?: string;
    indirizzo?: string;
    citta?: string;
    cap?: string;
    partita_iva?: string;
    codice_fiscale?: string;
  }) {
    return this.request<any>('/clienti', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // === API FORNITORI ===
  async getFornitori() {
    return this.request<any[]>('/fornitori');
  }

  async createFornitore(data: {
    nome: string;
    ragione_sociale: string;
    email?: string;
    telefono?: string;
    indirizzo?: string;
    citta?: string;
    cap?: string;
    provincia?: string;
    partita_iva?: string;
    codice_fiscale?: string;
    attivo?: boolean;
  }) {
    return this.request<any>('/fornitori', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFornitore(id: number, data: {
    nome: string;
    ragione_sociale: string;
    email?: string;
    telefono?: string;
    indirizzo?: string;
    citta?: string;
    cap?: string;
    provincia?: string;
    partita_iva?: string;
    codice_fiscale?: string;
    attivo?: boolean;
  }) {
    return this.request<any>(`/fornitori/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFornitore(id: number) {
    return this.request<any>(`/fornitori/${id}`, {
      method: 'DELETE',
    });
  }

  // === API FATTURE ===
  async getFatture(tipo?: 'acquisto' | 'vendita') {
    let endpoint = '/fatture';
    if (tipo) {
      endpoint += `?tipo=${tipo}`;
    }
    return this.request<any[]>(endpoint);
  }

  async getFatturaById(fatturaId: number) {
    return this.request<any>(`/fatture/${fatturaId}`);
  }

  async createFattura(data: {
    numero: string;
    tipo: 'acquisto' | 'vendita';
    cliente_id?: number;
    fornitore_id?: number;
    data: string;
    totale: number;
    stato: string;
    note?: string;
    scadenza?: string;
    metodo_pagamento?: string;
  }) {
    return this.request<any>('/fatture', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFattura(fatturaId: number, data: {
    numero?: string;
    tipo?: 'vendita' | 'acquisto';
    cliente_id?: number;
    fornitore_id?: number;
    data?: string;
    totale?: number;
    stato?: string;
    note?: string;
  }) {
    return this.request<any>(`/fatture/${fatturaId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFattura(fatturaId: number) {
    return this.request<any>(`/fatture/${fatturaId}`, {
      method: 'DELETE',
    });
  }

  async getDettagliFattura(fatturaId: number) {
    return this.request<any[]>(`/fatture/${fatturaId}/dettagli`);
  }

  async createDettaglioFattura(fatturaId: number, data: {
    varieta_id: number;
    quantita: number;
    prezzo_unitario: number;
    sconto?: number;
    totale: number;
  }) {
    return this.request<any>(`/fatture/${fatturaId}/dettagli`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDettaglioFattura(dettaglioId: number, data: {
    varieta_id?: number;
    quantita?: number;
    prezzo_unitario?: number;
    totale?: number;
  }) {
    return this.request<any>(`/dettagli-fattura/${dettaglioId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDettaglioFattura(dettaglioId: number) {
    return this.request<any>(`/dettagli-fattura/${dettaglioId}`, {
      method: 'DELETE',
    });
  }

  async getStatoScaricoDettaglio(dettaglioId: number) {
    return this.request<any>(`/dettagli-fattura/${dettaglioId}/stato-scarico`);
  }

  // === API STATISTICHE FATTURE ACQUISTO ===
  async getStatisticheFattureAcquisto(dataInizio?: string, dataFine?: string, fornitoreId?: number) {
    let endpoint = '/statistiche/fatture-acquisto';
    const params = new URLSearchParams();
    if (dataInizio) params.append('data_inizio', dataInizio);
    if (dataFine) params.append('data_fine', dataFine);
    if (fornitoreId) params.append('fornitore_id', fornitoreId.toString());
    if (params.toString()) endpoint += `?${params.toString()}`;
    
    return this.request<any>(endpoint);
  }

  async getStatisticheFornitori() {
    return this.request<any>('/statistiche/fornitori');
  }

  async getStatisticheVarietaAcquisto() {
    return this.request<any>('/statistiche/varieta-acquisto');
  }

  // === API ORDINI VENDITA ===
  async getOrdiniVendita() {
    return this.request<any[]>('/ordini-vendita');
  }

  async createOrdineVendita(data: {
    numero: string;
    cliente_id: number;
    data: string;
    totale: number;
    stato: string;
    note?: string;
  }) {
    return this.request<any>('/ordini-vendita', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrdineVendita(ordineId: number, data: {
    numero?: string;
    cliente_id?: number;
    data?: string;
    stato?: string;
    totale?: number;
    prodotti?: Array<{
      prodotto_id: string;
      quantita: number;
      prezzo_unitario: number;
      totale: number;
    }>;
  }) {
    return this.request<any>(`/ordini-vendita/${ordineId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrdineVendita(ordineId: number) {
    return this.request<any>(`/ordini-vendita/${ordineId}`, {
      method: 'DELETE',
    });
  }

  // === API ORDINI ACQUISTO ===
  async getOrdiniAcquisto() {
    return this.request<any[]>('/ordini-acquisto');
  }

  async createOrdineAcquisto(data: {
    numero: string;
    fornitore_id: number;
    data: string;
    stato?: string;
    totale: number;
    prodotti: Array<{
      prodotto_id: string;
      quantita: number;
      prezzo_unitario: number;
      totale: number;
    }>;
  }) {
    return this.request<any>('/ordini-acquisto', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrdineAcquisto(ordineId: number, data: {
    numero?: string;
    fornitore_id?: number;
    data?: string;
    stato?: string;
    totale?: number;
    prodotti?: Array<{
      prodotto_id: string;
      quantita: number;
      prezzo_unitario: number;
      totale: number;
    }>;
  }) {
    return this.request<any>(`/ordini-acquisto/${ordineId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrdineAcquisto(ordineId: number) {
    return this.request<any>(`/ordini-acquisto/${ordineId}`, {
      method: 'DELETE',
    });
  }

  // === API EVENTI ===
  async getEventi() {
    return this.request<any[]>('/eventi');
  }

  async createEvento(data: {
    titolo: string;
    descrizione?: string;
    data_inizio: string;
    data_fine?: string;
    tipo?: string;
  }) {
    return this.request<any>('/eventi', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // === API STATISTICHE ===
  async getStatisticheFatture() {
    return this.request<any>('/statistiche/fatture');
  }

  // === API DISTRUZIONI ===
  async getDistruzioni() {
    return this.request<any[]>('/distruzioni');
  }

  async createDistruzione(data: {
    giacenza_id: number;
    quantita: number;
    motivo: string;
  }) {
    console.log('🗑️ createDistruzione chiamata con dati:', data);
    return this.request<any>('/distruzioni', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteDistruzione(distruzioneId: number) {
    return this.request<any>(`/distruzioni/${distruzioneId}`, {
      method: 'DELETE',
    });
  }

  // === HEALTH CHECK ===
  async healthCheck() {
    return this.request<any>('/health');
  }

  // === API PARSING PDF ===
  
  async uploadPDF(file: File, fornitoreId: number) {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('fornitore_id', fornitoreId.toString());
    
    return this.request<any>('/pdf-parser/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Rimuovi Content-Type per FormData
    });
  }

  async saveParserConfig(config: any) {
    return this.post<any>('/pdf-parser/config', config);
  }

  async getParserConfigs() {
    return this.get<any[]>('/pdf-parser/configs');
  }

  async getParserConfig(fornitoreId: number) {
    return this.get<any>(`/pdf-parser/config/${fornitoreId}`);
  }

  async confirmParsedData(parsedData: any, fornitoreId: number) {
    return this.post<any>('/pdf-parser/confirm', { parsedData, fornitore_id: fornitoreId });
  }

  // Nuovi metodi per parsing interattivo
  async savePDFMapping(fornitoreId: number, mapping: any, name?: string) {
    return this.post<any>('/pdf-parser/save-mapping', { 
      fornitore_id: fornitoreId, 
      mapping, 
      name 
    });
  }

  async getPDFMappings(fornitoreId: number) {
    return this.get<any[]>(`/pdf-parser/mappings/${fornitoreId}`);
  }

  async parseWithMapping(pdfStructure: any, mapping: any) {
    return this.post<any>('/pdf-parser/parse-with-mapping', { 
      pdfStructure, 
      mapping 
    });
  }

  // === API PARSING FILE MULTI-FORMATO ===
  
  async uploadFile(file: File, fornitoreId: number) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fornitore_id', fornitoreId.toString());
    
    return this.request<any>('/file-parser/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Rimuovi Content-Type per FormData
    });
  }

  // ===== IMAGE DOWNLOADER METHODS =====

  // Ottieni varietà disponibili per download immagini
  async getVarietaDisponibili() {
    return this.request<any>('/images/varieta-disponibili');
  }

  // Download batch immagini
  async downloadBatchImages(varietaIds: number[]) {
    return this.request<any>('/images/download-batch', {
      method: 'POST',
      body: JSON.stringify({ varietaIds }),
    });
  }

  // === API STATISTICHE DETTAGLIATE ===
  async getStatisticheFornitoriDettagliato() {
    return this.request<any>('/statistiche/fornitori-dettagliato');
  }

  async getStatisticheClientiDettagliato() {
    return this.request<any>('/statistiche/clienti-dettagliato');
  }

  // === API GESTIONE PAGAMENTI ===
  async aggiornaStatoPagamento(fatturaId: number, data: {
    stato: 'emessa' | 'pagata' | 'scaduta';
    data_pagamento?: string;
    metodo_pagamento?: string;
    note?: string;
  }) {
    return this.request<any>(`/fatture/${fatturaId}/pagamento`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async aggiornaStatoIncasso(fatturaId: number, data: {
    stato: 'emessa' | 'pagata' | 'scaduta';
    data_incasso?: string;
    metodo_incasso?: string;
    note?: string;
  }) {
    return this.request<any>(`/fatture/${fatturaId}/incasso`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // === API SPESE TRASPORTO ===
  
  async getSpeseTrasporto() {
    return this.get<any[]>('/spese-trasporto');
  }

  async createSpesaTrasporto(data: {
    descrizione: string;
    destinatario?: string;
    fornitore_id?: number;
    importo: number;
    data_spesa: string;
    tipo_trasporto: 'corriere' | 'autotrasporto' | 'ferrovia' | 'aereo' | 'altro';
    numero_documento?: string;
    note?: string;
  }) {
    return this.post<any>('/spese-trasporto', data);
  }

  async updateSpesaTrasporto(id: number, data: {
    descrizione?: string;
    destinatario?: string;
    fornitore_id?: number;
    importo?: number;
    data_spesa?: string;
    tipo_trasporto?: 'corriere' | 'autotrasporto' | 'ferrovia' | 'aereo' | 'altro';
    numero_documento?: string;
    note?: string;
  }) {
    return this.put<any>(`/spese-trasporto/${id}`, data);
  }

  async deleteSpesaTrasporto(id: number) {
    return this.delete<any>(`/spese-trasporto/${id}`);
  }

  async aggiornaStatoPagamentoSpesaTrasporto(id: number, data: {
    pagato: boolean;
    data_pagamento?: string;
    metodo_pagamento?: string;
    note_pagamento?: string;
  }) {
    return this.request<any>(`/spese-trasporto/${id}/pagamento`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // === API TASSE PERSONALIZZATE ===
  
  async getTassePersonalizzate() {
    return this.get<any[]>('/tasse-personalizzate');
  }

  async createTassaPersonalizzata(data: {
    nome: string;
    descrizione?: string;
    tipo: 'fissa' | 'percentuale';
    valore: number;
    base_calcolo?: number;
    periodo: 'mensile' | 'trimestrale' | 'annuale' | 'unico';
    data_scadenza: string;
    ente?: string;
    note?: string;
  }) {
    return this.post<any>('/tasse-personalizzate', data);
  }

  async updateTassaPersonalizzata(id: number, data: {
    nome?: string;
    descrizione?: string;
    tipo?: 'fissa' | 'percentuale';
    valore?: number;
    base_calcolo?: number;
    periodo?: 'mensile' | 'trimestrale' | 'annuale' | 'unico';
    data_scadenza?: string;
    ente?: string;
    note?: string;
  }) {
    return this.put<any>(`/tasse-personalizzate/${id}`, data);
  }

  async deleteTassaPersonalizzata(id: number) {
    return this.delete<any>(`/tasse-personalizzate/${id}`);
  }

  async aggiornaStatoPagamentoTassaPersonalizzata(id: number, data: {
    pagato: boolean;
    data_pagamento?: string;
    metodo_pagamento?: string;
    note_pagamento?: string;
  }) {
    return this.request<any>(`/tasse-personalizzate/${id}/pagamento`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Esporta un'istanza singleton
export const apiService = new ApiService(); 