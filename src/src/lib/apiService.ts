const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Errore di rete' }));
      throw new Error((error as any).error || `HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // API Gruppi
  async getGruppi(): Promise<any[]> {
    return this.request<any[]>('/gruppi');
  }

  // API Prodotti
  async getProdotti(): Promise<any[]> {
    return this.request<any[]>('/prodotti');
  }

  // API Varietà
  async getVarieta(): Promise<any[]> {
    return this.request<any[]>('/varieta');
  }

  // API Giacenze
  async getGiacenze(): Promise<any[]> {
    return this.request<any[]>('/giacenze');
  }

  // API Clienti
  async getClienti(): Promise<any[]> {
    return this.request<any[]>('/clienti');
  }

  // API Fornitori
  async getFornitori(): Promise<any[]> {
    return this.request<any[]>('/fornitori');
  }

  // API Fatture
  async getFatture(): Promise<any[]> {
    return this.request<any[]>('/fatture');
  }

  // API Eventi
  async getEventi(): Promise<any[]> {
    return this.request<any[]>('/eventi');
  }

  // API Statistiche
  async getStatisticheFatture(): Promise<any> {
    return this.request<any>('/statistiche/fatture');
  }

  // Metodo generico per richieste
  async genericRequest(endpoint: string): Promise<any> {
    return this.request<any>(endpoint);
  }
}

export const apiService = new ApiService(); 