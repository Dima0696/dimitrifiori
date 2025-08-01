// Sistema di eventi per la sincronizzazione dei componenti magazzino
export type MagazzinoEventType = 
  | 'fattura_creata'
  | 'giacenza_aggiornata'
  | 'movimento_creato'
  | 'distruzione_eseguita'
  | 'ricalcolo_giacenze'
  | 'dati_aggiornati'
  | 'statistiche_aggiornate'
  | 'vendita_completata'
  | 'acquisto_completato'
  | 'cliente_aggiornato'
  | 'fornitore_aggiornato';

export interface MagazzinoEvent {
  type: MagazzinoEventType;
  data?: any;
  timestamp: Date;
}

export interface MagazzinoEvents {
  fattura_creata: { fattura: any; timestamp: Date };
  giacenza_aggiornata: { varieta_id: number; quantita: number; timestamp: Date };
  movimento_creato: { varieta_id: number; tipo: string; quantita: number; timestamp: Date };
  distruzione_eseguita: { varieta_id: number; quantita: number; timestamp: Date };
  ricalcolo_giacenze: { timestamp: Date };
  dati_aggiornati: { component: string; timestamp: Date };
  // EVENTI STATISTICHE GLOBALI
  statistiche_aggiornate: { tipo: string; timestamp: Date };
  vendita_completata: { fattura_id: number; valore: number; timestamp: Date };
  acquisto_completato: { fattura_id: number; valore: number; timestamp: Date };
  // EVENTI ENTITÀ
  cliente_aggiornato: { cliente_id: number; timestamp: Date };
  fornitore_aggiornato: { fornitore_id: number; timestamp: Date };
}

class MagazzinoEventBus {
  private listeners: Map<MagazzinoEventType, Array<(event: MagazzinoEvent) => void>> = new Map();

  // Registra un listener per un tipo di evento
  on(eventType: MagazzinoEventType, callback: (event: MagazzinoEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Ritorna funzione per rimuovere il listener
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Emette un evento
  emit(eventType: MagazzinoEventType, data?: any) {
    const event: MagazzinoEvent = {
      type: eventType,
      data,
      timestamp: new Date()
    };

    console.log(`📢 MagazzinoEvent: ${eventType}`, data);

    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Errore nel listener per evento ${eventType}:`, error);
        }
      });
    }
  }

  // Rimuove tutti i listener
  clear() {
    this.listeners.clear();
  }
}

// Istanza singleton
export const magazzinoEventBus = new MagazzinoEventBus();

// Hook React per utilizzare gli eventi
import { useEffect, useRef } from 'react';

export function useMagazzinoEvent(
  eventType: MagazzinoEventType, 
  callback: (event: MagazzinoEvent) => void,
  deps: any[] = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = magazzinoEventBus.on(eventType, (event) => {
      callbackRef.current(event);
    });

    return unsubscribe;
  }, [eventType, ...deps]);
}

// Hook per emettere eventi
export function useMagazzinoEmitter() {
  return {
    emitFatturaCreata: (fattura: any) => magazzinoEventBus.emit('fattura_creata', fattura),
    emitGiacenzaAggiornata: (giacenza: any) => magazzinoEventBus.emit('giacenza_aggiornata', giacenza),
    emitMovimentoCreato: (movimento: any) => magazzinoEventBus.emit('movimento_creato', movimento),
    emitDistruzioneEseguita: (distruzione: any) => magazzinoEventBus.emit('distruzione_eseguita', distruzione),
    emitRicalcoloGiacenze: () => magazzinoEventBus.emit('ricalcolo_giacenze'),
    emitDatiAggiornati: (component: string) => magazzinoEventBus.emit('dati_aggiornati', { component }),
    // NUOVI METODI PER EVENTI STATISTICHE
    emitStatisticheAggiornate: (tipo: string) => magazzinoEventBus.emit('statistiche_aggiornate', { 
      tipo, 
      timestamp: new Date() 
    }),
    emitVenditaCompletata: (fattura_id: number, valore: number) => magazzinoEventBus.emit('vendita_completata', { 
      fattura_id, 
      valore, 
      timestamp: new Date() 
    }),
    emitAcquistoCompletato: (fattura_id: number, valore: number) => magazzinoEventBus.emit('acquisto_completato', { 
      fattura_id, 
      valore, 
      timestamp: new Date() 
    }),
    emitClienteAggiornato: (cliente_id: number) => magazzinoEventBus.emit('cliente_aggiornato', { 
      cliente_id, 
      timestamp: new Date() 
    }),
    emitFornitoreAggiornato: (fornitore_id: number) => magazzinoEventBus.emit('fornitore_aggiornato', { 
      fornitore_id, 
      timestamp: new Date() 
    })
  };
} 
