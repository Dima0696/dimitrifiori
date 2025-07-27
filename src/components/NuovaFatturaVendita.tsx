import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Autocomplete, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Divider, Card, CardContent, Stack, Chip, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Badge,
  Fab, Tooltip, InputAdornment, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Share as ShareIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Euro as EuroIcon,
  CalendarToday as CalendarIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { apiService } from '../lib/apiService';
import { useMagazzinoEmitter } from '../lib/magazzinoEvents';

interface Cliente {
  id: number;
  nome: string;
  cognome: string;
  email?: string;
  telefono?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  piva?: string;
  codice_fiscale?: string;
}

interface Prodotto {
  id: number;
  varieta_nome: string;
  gruppo_nome: string;
  prodotto_nome: string;
  prezzo_vendita: number;
  giacenza: number;
  imballo: number;
  colore?: string;
  disponibile: boolean;
}

interface RigaFattura {
  id: string;
  prodotto: Prodotto | null;
  quantita: number;
  prezzo_unitario: number;
  sconto: number;
  totale: number;
}

interface Fattura {
  numero: string;
  data: string;
  cliente: Cliente | null;
  righe: RigaFattura[];
  subtotale: number;
  sconto_totale: number;
  iva: number;
  totale: number;
  note: string;
  stato: 'bozza' | 'emessa' | 'pagata';
  scadenza: string;
  metodo_pagamento: string;
}

export default function NuovaFatturaVendita() {
  const emitter = useMagazzinoEmitter();
  
  // Stati principali
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'warning'}>({
    open: false, message: '', severity: 'success'
  });

  // Stato per la finestra selezione prodotti
  const [dialogProdotti, setDialogProdotti] = useState({
    open: false,
    rigaId: '',
    searchText: '',
    gruppoFiltro: 'tutti'
  });

  // Stato fattura
  const [fattura, setFattura] = useState<Fattura>({
    numero: '',
    data: new Date().toISOString().split('T')[0],
    cliente: null,
    righe: [{ id: '1', prodotto: null, quantita: 1, prezzo_unitario: 0, sconto: 0, totale: 0 }],
    subtotale: 0,
    sconto_totale: 0,
    iva: 22,
    totale: 0,
    note: '',
    stato: 'bozza',
    scadenza: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 giorni
    metodo_pagamento: 'bonifico'
  });

  useEffect(() => {
    caricaDati();
    generaNumeroFattura();
  }, []);

  useEffect(() => {
    calcolaTotali();
  }, [fattura.righe, fattura.iva, fattura.sconto_totale]);

  const caricaDati = async () => {
    try {
      setLoading(true);
      
      // Carica tutti i dati necessari in parallelo
      const [clientiData, varietaData, gruppiData, prodottiData, giacenzeData] = await Promise.all([
        apiService.getClienti(),
        apiService.getVarieta(false), // Solo varietà con giacenza > 0
        apiService.getGruppi(false), // Solo gruppi con giacenza > 0
        apiService.getProdotti(false), // Solo prodotti con giacenza > 0
        apiService.getGiacenze()
      ]);
      
      setClienti(clientiData);
      
      console.log('🔄 Caricamento prodotti completo...');
      console.log('Varietà:', varietaData.length);
      console.log('Gruppi:', gruppiData.length);
      console.log('Prodotti:', prodottiData.length);
      console.log('Giacenze:', giacenzeData.length);
      
      // Crea mappa delle giacenze per varietà
      const giacenzeMap = new Map();
      giacenzeData.forEach((g: any) => {
        giacenzeMap.set(g.varieta_id, {
          quantita: g.quantita || 0,
          prezzo_acquisto: g.prezzo_acquisto || 0,
          prezzo_vendita: g.prezzo_vendita || 0,
          imballo: g.imballo || 1,
          data_acquisto: g.data_acquisto
        });
      });
      
      // Crea mappa dei gruppi
      const gruppiMap = new Map();
      gruppiData.forEach((g: any) => {
        gruppiMap.set(g.id, g.nome);
      });
      
      // Crea mappa dei prodotti  
      const prodottiMap = new Map();
      prodottiData.forEach((p: any) => {
        prodottiMap.set(p.id, p.nome);
      });
      
      // Combina tutti i dati per creare lista prodotti completa
      const prodottiCompleti = varietaData.map((varieta: any) => {
        const giacenza = giacenzeMap.get(varieta.id) || { 
          quantita: 0, 
          prezzo_acquisto: 0, 
          prezzo_vendita: 0, 
          imballo: 1 
        };
        
        const gruppoNome = gruppiMap.get(varieta.gruppo_id) || 'Generale';
        const prodottoNome = prodottiMap.get(varieta.prodotto_id) || varieta.nome;
        
        // Calcola prezzo vendita se non specificato (margine 30%)
        const prezzoVendita = giacenza.prezzo_vendita > 0 
          ? giacenza.prezzo_vendita 
          : giacenza.prezzo_acquisto > 0 
            ? giacenza.prezzo_acquisto * 1.3 
            : 1.0; // Prezzo di default
        
        return {
          id: varieta.id,
          varieta_nome: varieta.nome,
          gruppo_nome: gruppoNome,
          prodotto_nome: prodottoNome,
          prezzo_vendita: prezzoVendita,
          giacenza: giacenza.quantita,
          imballo: giacenza.imballo,
          colore: varieta.colore || 'Non specificato',
          disponibile: giacenza.quantita > 0
        };
      });
      
      // Ordina i prodotti: prima quelli disponibili, poi per gruppo e varietà
      const prodottiOrdinati = prodottiCompleti.sort((a, b) => {
        if (a.disponibile !== b.disponibile) {
          return b.disponibile ? 1 : -1; // Disponibili prima
        }
        if (a.gruppo_nome !== b.gruppo_nome) {
          return a.gruppo_nome.localeCompare(b.gruppo_nome);
        }
        return a.varieta_nome.localeCompare(b.varieta_nome);
      });
      
      setProdotti(prodottiOrdinati);
      
      console.log(`✅ Caricati ${prodottiOrdinati.length} prodotti totali`);
      console.log(`📦 Disponibili: ${prodottiOrdinati.filter(p => p.disponibile).length}`);
      console.log(`⚠️ Non disponibili: ${prodottiOrdinati.filter(p => !p.disponibile).length}`);
    } catch (err) {
      console.error('❌ Errore caricamento dati:', err);
      setSnackbar({
        open: true,
        message: 'Errore nel caricamento dei dati',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const generaNumeroFattura = async () => {
    try {
      const fatture = await apiService.getFatture();
      const numeroProgressivo = fatture.filter((f: any) => f.tipo === 'vendita').length + 1;
      const anno = new Date().getFullYear();
      setFattura(prev => ({
        ...prev,
        numero: `FV-${anno}-${numeroProgressivo.toString().padStart(4, '0')}`
      }));
    } catch (err) {
      console.error('❌ Errore generazione numero:', err);
    }
  };

  const calcolaTotali = () => {
    const subtotale = fattura.righe.reduce((sum, riga) => sum + riga.totale, 0);
    const sconto = (subtotale * fattura.sconto_totale) / 100;
    const imponibile = subtotale - sconto;
    const importoIva = (imponibile * fattura.iva) / 100;
    const totale = imponibile + importoIva;

    setFattura(prev => ({
      ...prev,
      subtotale,
      totale
    }));
  };

  const aggiungiRiga = () => {
    const nuovaRiga: RigaFattura = {
      id: Date.now().toString(),
      prodotto: null,
      quantita: 1,
      prezzo_unitario: 0,
      sconto: 0,
      totale: 0
    };

    setFattura(prev => ({
      ...prev,
      righe: [...prev.righe, nuovaRiga]
    }));
  };

  const rimuoviRiga = (id: string) => {
    setFattura(prev => ({
      ...prev,
      righe: prev.righe.filter(r => r.id !== id)
    }));
  };

  const aggiornaRiga = (id: string, campo: keyof RigaFattura, valore: any) => {
    setFattura(prev => ({
      ...prev,
      righe: prev.righe.map(riga => {
        if (riga.id === id) {
          const nuovaRiga = { ...riga, [campo]: valore };
          
          // Se si cambia il prodotto, aggiorna il prezzo
          if (campo === 'prodotto' && valore) {
            nuovaRiga.prezzo_unitario = valore.prezzo_vendita;
          }
          
          // Controllo disponibilità giacenze
          if (campo === 'quantita' && nuovaRiga.prodotto) {
            const giacenzaDisponibile = nuovaRiga.prodotto.giacenza;
            if (valore > giacenzaDisponibile) {
              setSnackbar({
                open: true,
                message: `⚠️ Attenzione: Richiesti ${valore} ma disponibili solo ${giacenzaDisponibile} di ${nuovaRiga.prodotto.varieta_nome}`,
                severity: 'warning'
              });
            }
          }
          
          // Ricalcola totale riga
          nuovaRiga.totale = (nuovaRiga.quantita * nuovaRiga.prezzo_unitario) * (1 - nuovaRiga.sconto / 100);
          
          return nuovaRiga;
        }
        return riga;
      })
    }));
  };

  const salvaFattura = async () => {
    try {
      if (!fattura.cliente) {
        setSnackbar({
          open: true,
          message: 'Seleziona un cliente',
          severity: 'warning'
        });
        return;
      }

      if (fattura.righe.length === 0 || fattura.righe.every(r => !r.prodotto)) {
        setSnackbar({
          open: true,
          message: 'Aggiungi almeno un prodotto',
          severity: 'warning'
        });
        return;
      }

      setLoading(true);

      // Crea fattura
      const fatturaData = {
        numero: fattura.numero,
        tipo: 'vendita' as 'vendita',
        cliente_id: fattura.cliente.id,
        data: fattura.data,
        totale: fattura.totale,
        stato: fattura.stato,
        note: fattura.note,
        scadenza: fattura.scadenza,
        metodo_pagamento: fattura.metodo_pagamento
      };

      const nuovaFattura = await apiService.createFattura(fatturaData);

      // Aggiungi dettagli e scarica giacenze
      for (const riga of fattura.righe) {
        if (riga.prodotto) {
          // Crea dettaglio fattura
          await apiService.createDettaglioFattura(nuovaFattura.id, {
            varieta_id: riga.prodotto.id,
            quantita: riga.quantita,
            prezzo_unitario: riga.prezzo_unitario,
            sconto: riga.sconto,
            totale: riga.totale
          });

          // Scarica giacenza
          await apiService.scaricaGiacenza(riga.prodotto.id, riga.quantita, nuovaFattura.id);

          // Crea movimento
          await apiService.createMovimento({
            varieta_id: riga.prodotto.id,
            tipo: 'scarico',
            quantita: riga.quantita,
            prezzo_unitario: riga.prezzo_unitario,
            fattura_id: nuovaFattura.id,
            note: `Vendita fattura ${fattura.numero} - Cliente: ${fattura.cliente.nome} ${fattura.cliente.cognome}`
          });
        }
      }

      // Emetti eventi di sincronizzazione completa
      emitter.emitFatturaCreata(nuovaFattura);
      emitter.emitVenditaCompletata(nuovaFattura.id, fattura.totale);
      emitter.emitStatisticheAggiornate('vendita');
      emitter.emitSyncRichiesta('NuovaFatturaVendita');

      setSnackbar({
        open: true,
        message: `Fattura ${fattura.numero} creata con successo!`,
        severity: 'success'
      });

      // Reset form
      generaNumeroFattura();
      setFattura(prev => ({
        ...prev,
        cliente: null,
        righe: [{ id: '1', prodotto: null, quantita: 1, prezzo_unitario: 0, sconto: 0, totale: 0 }],
        note: '',
        stato: 'bozza'
      }));

    } catch (err) {
      console.error('❌ Errore salvataggio fattura:', err);
      setSnackbar({
        open: true,
        message: 'Errore nel salvataggio della fattura',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const stampaFattura = () => {
    setShowPreview(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const condividiEmail = () => {
    if (!fattura.cliente?.email) {
      setSnackbar({
        open: true,
        message: 'Cliente senza email configurata',
        severity: 'warning'
      });
      return;
    }

    const subject = `Fattura ${fattura.numero} - DimitriFlor`;
    const body = `Gentile ${fattura.cliente.nome} ${fattura.cliente.cognome},\n\nin allegato trova la fattura ${fattura.numero} del ${new Date(fattura.data).toLocaleDateString('it-IT')} per un importo di ${fattura.totale.toFixed(2)}€.\n\nCordiali saluti,\nDimitriFlor`;
    
    window.open(`mailto:${fattura.cliente.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const condividiWhatsApp = () => {
    if (!fattura.cliente?.telefono) {
      setSnackbar({
        open: true,
        message: 'Cliente senza numero WhatsApp configurato',
        severity: 'warning'
      });
      return;
    }

    const message = `Ciao ${fattura.cliente.nome}! 🌺\n\nLa tua fattura ${fattura.numero} è pronta:\n💰 Totale: ${fattura.totale.toFixed(2)}€\n📅 Scadenza: ${new Date(fattura.scadenza).toLocaleDateString('it-IT')}\n\nGrazie per aver scelto DimitriFlor! 🌹`;
    
    window.open(`https://wa.me/${fattura.cliente.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`);
  };

  const scaricaPDF = () => {
    // Implementazione futura per generazione PDF
    setSnackbar({
      open: true,
      message: 'Download PDF in sviluppo...',
      severity: 'warning'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  // Funzioni per gestione imballi
  const calcolaQuantitaCorretta = (quantita: number, imballo: number): number => {
    if (quantita <= 0) return imballo;
    return Math.round(quantita / imballo) * imballo;
  };

  const aggiungiRigaConImballo = () => {
    const nuovaRiga: RigaFattura = {
      id: Date.now().toString(),
      prodotto: null,
      quantita: 1, // Sarà aggiustata automaticamente quando si seleziona il prodotto
      prezzo_unitario: 0,
      sconto: 0,
      totale: 0
    };
    setFattura(prev => ({
      ...prev,
      righe: [...prev.righe, nuovaRiga]
    }));
  };

  // Gestione dialogo selezione prodotti
  const apriDialogoProdotti = (rigaId: string) => {
    setDialogProdotti({
      open: true,
      rigaId,
      searchText: '',
      gruppoFiltro: 'tutti'
    });
  };

  const chiudiDialogoProdotti = () => {
    setDialogProdotti(prev => ({ ...prev, open: false }));
  };

  const selezionaProdotto = (prodotto: Prodotto) => {
    // Seleziona il prodotto e imposta automaticamente la quantità all'imballo
    aggiornaRiga(dialogProdotti.rigaId, 'prodotto', prodotto);
    // Imposta la quantità iniziale pari all'imballo
    aggiornaRiga(dialogProdotti.rigaId, 'quantita', prodotto.imballo);
    chiudiDialogoProdotti();
  };

  // Filtra prodotti per il dialogo - SOLO DISPONIBILI
  const prodottiFiltrati = prodotti.filter(prodotto => {
    // Prima filtro: SOLO prodotti disponibili (giacenza > 0)
    if (!prodotto.disponibile || prodotto.giacenza <= 0) {
      return false;
    }
    
    const searchMatch = !dialogProdotti.searchText || 
      prodotto.varieta_nome.toLowerCase().includes(dialogProdotti.searchText.toLowerCase()) ||
      prodotto.gruppo_nome.toLowerCase().includes(dialogProdotti.searchText.toLowerCase()) ||
      prodotto.prodotto_nome.toLowerCase().includes(dialogProdotti.searchText.toLowerCase()) ||
      (prodotto.colore && prodotto.colore.toLowerCase().includes(dialogProdotti.searchText.toLowerCase()));
    
    const gruppoMatch = dialogProdotti.gruppoFiltro === 'tutti' || 
      prodotto.gruppo_nome === dialogProdotti.gruppoFiltro;
    
    return searchMatch && gruppoMatch;
  });

  // Raggruppa prodotti per gruppo - SOLO gruppi con prodotti disponibili
  const gruppiDisponibili = [...new Set(prodotti.filter(p => p.disponibile && p.giacenza > 0).map(p => p.gruppo_nome))].sort();

  // Raggruppa i prodotti filtrati per gruppo
  const prodottiRaggruppati = prodottiFiltrati.reduce((gruppi, prodotto) => {
    const gruppo = prodotto.gruppo_nome;
    if (!gruppi[gruppo]) {
      gruppi[gruppo] = [];
    }
    gruppi[gruppo].push(prodotto);
    return gruppi;
  }, {} as Record<string, typeof prodottiFiltrati>);

  // Ordina i prodotti all'interno di ogni gruppo per nome
  Object.keys(prodottiRaggruppati).forEach(gruppo => {
    prodottiRaggruppati[gruppo].sort((a, b) => a.varieta_nome.localeCompare(b.varieta_nome));
  });

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="primary">
            🧾 Nuova Fattura di Vendita
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crea e gestisci fatture professionali con un click
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Anteprima e Stampa">
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setShowPreview(true)}
              disabled={!fattura.cliente || fattura.righe.every(r => !r.prodotto)}
            >
              Anteprima
            </Button>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={salvaFattura}
            disabled={loading || !fattura.cliente || fattura.righe.every(r => !r.prodotto)}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Salvando...' : 'Salva Fattura'}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Colonna Sinistra - Dati Fattura */}
        <Grid item xs={12} lg={8}>
          {/* Intestazione Fattura */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2} color="primary">
              📋 Dati Fattura
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Numero Fattura"
                  value={fattura.numero}
                  onChange={(e) => setFattura(prev => ({ ...prev, numero: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><ReceiptIcon /></InputAdornment>
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data Fattura"
                  value={fattura.data}
                  onChange={(e) => setFattura(prev => ({ ...prev, data: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><CalendarIcon /></InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Scadenza Pagamento"
                  value={fattura.scadenza}
                  onChange={(e) => setFattura(prev => ({ ...prev, scadenza: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Metodo Pagamento</InputLabel>
                  <Select
                    value={fattura.metodo_pagamento}
                    label="Metodo Pagamento"
                    onChange={(e) => setFattura(prev => ({ ...prev, metodo_pagamento: e.target.value }))}
                  >
                    <MenuItem value="bonifico">Bonifico Bancario</MenuItem>
                    <MenuItem value="contanti">Contanti</MenuItem>
                    <MenuItem value="carta">Carta di Credito</MenuItem>
                    <MenuItem value="assegno">Assegno</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Selezione Cliente */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2} color="primary">
              👤 Cliente
            </Typography>
            
            <Autocomplete
              options={clienti}
              getOptionLabel={(cliente) => `${cliente.nome} ${cliente.cognome} ${cliente.citta ? `(${cliente.citta})` : ''}`}
              value={fattura.cliente}
              onChange={(_, newValue) => setFattura(prev => ({ ...prev, cliente: newValue }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seleziona Cliente"
                  placeholder="Cerca per nome, cognome o città..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>
                  }}
                />
              )}
              renderOption={(props, cliente) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {cliente.nome} {cliente.cognome}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cliente.email} • {cliente.telefono} • {cliente.citta}
                    </Typography>
                  </Box>
                </Box>
              )}
            />

            {fattura.cliente && (
              <Card sx={{ mt: 2, bgcolor: 'grey.50' }}>
                <CardContent sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2"><strong>Email:</strong> {fattura.cliente.email || 'N/A'}</Typography>
                      <Typography variant="body2"><strong>Telefono:</strong> {fattura.cliente.telefono || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2"><strong>Indirizzo:</strong> {fattura.cliente.indirizzo || 'N/A'}</Typography>
                      <Typography variant="body2"><strong>Città:</strong> {fattura.cliente.citta} {fattura.cliente.cap}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Paper>

          {/* Prodotti */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600} color="primary">
                🌸 Prodotti
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={aggiungiRiga}
                size="small"
              >
                Aggiungi Riga
              </Button>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Prodotto</TableCell>
                    <TableCell align="center" width={100}>Qtà (Imballo)</TableCell>
                    <TableCell align="right" width={120}>Prezzo €</TableCell>
                    <TableCell align="center" width={100}>Sconto %</TableCell>
                    <TableCell align="right" width={120}>Totale €</TableCell>
                    <TableCell align="center" width={80}>Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fattura.righe.map((riga, index) => (
                    <TableRow key={riga.id}>
                      <TableCell>
                        <Button
                          variant="outlined"
                          fullWidth
                          size="small"
                          onClick={() => apriDialogoProdotti(riga.id)}
                          startIcon={<AddIcon />}
                          sx={{
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                            height: 40,
                            bgcolor: riga.prodotto ? 'success.light' : 'grey.50',
                            borderColor: riga.prodotto ? 'success.main' : 'grey.300',
                            color: riga.prodotto ? 'success.main' : 'text.secondary'
                          }}
                        >
                          {riga.prodotto ? (
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {riga.prodotto.varieta_nome}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {riga.prodotto.gruppo_nome} • {riga.prodotto.giacenza} disponibili
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2">
                              Clicca per selezionare prodotto...
                            </Typography>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={riga.quantita}
                          onChange={(e) => {
                            const nuovaQuantita = parseInt(e.target.value) || 0;
                            if (riga.prodotto) {
                              // Calcola il multiplo più vicino dell'imballo
                              const imballo = riga.prodotto.imballo;
                              const quantitaCorretta = nuovaQuantita <= 0 ? imballo : 
                                Math.round(nuovaQuantita / imballo) * imballo;
                              aggiornaRiga(riga.id, 'quantita', quantitaCorretta);
                            } else {
                              aggiornaRiga(riga.id, 'quantita', nuovaQuantita);
                            }
                          }}
                          inputProps={{ 
                            min: riga.prodotto?.imballo || 1, 
                            max: riga.prodotto?.giacenza || 999,
                            step: riga.prodotto?.imballo || 1
                          }}
                          helperText={riga.prodotto ? `Imballo: ${riga.prodotto.imballo} pz` : ''}
                          error={!!(riga.prodotto && riga.quantita > 0 && riga.quantita % riga.prodotto.imballo !== 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={riga.prezzo_unitario}
                          onChange={(e) => aggiornaRiga(riga.id, 'prezzo_unitario', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, step: 0.01 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">€</InputAdornment>
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={riga.sconto}
                          onChange={(e) => aggiornaRiga(riga.id, 'sconto', parseFloat(e.target.value) || 0)}
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(riga.totale)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => rimuoviRiga(riga.id)}
                          disabled={fattura.righe.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Verifica giacenze e imballi */}
            {fattura.righe.some(r => r.prodotto && r.quantita > r.prodotto.giacenza) && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                ⚠️ Attenzione: Alcune quantità superano la giacenza disponibile!
              </Alert>
            )}
            
            {fattura.righe.some(r => r.prodotto && r.quantita % r.prodotto.imballo !== 0) && (
              <Alert severity="info" sx={{ mt: 1 }}>
                💡 Suggerimento: Alcune quantità non sono multiple dell'imballo. 
                {fattura.righe
                  .filter(r => r.prodotto && r.quantita % r.prodotto.imballo !== 0)
                  .map(r => ` ${r.prodotto!.varieta_nome}: suggerito ${Math.round(r.quantita / r.prodotto!.imballo) * r.prodotto!.imballo} (imballo ${r.prodotto!.imballo})`)
                  .join(',')
                }
              </Alert>
            )}
          </Paper>

          {/* Note */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2} color="primary">
              📝 Note
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Note aggiuntive per la fattura..."
              value={fattura.note}
              onChange={(e) => setFattura(prev => ({ ...prev, note: e.target.value }))}
            />
          </Paper>
        </Grid>

        {/* Colonna Destra - Riepilogo */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" fontWeight={600} mb={2} color="primary">
              💰 Riepilogo
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Subtotale:</Typography>
                <Typography fontWeight={600}>{formatCurrency(fattura.subtotale)}</Typography>
              </Box>

              <TextField
                size="small"
                type="number"
                label="Sconto Totale %"
                value={fattura.sconto_totale}
                onChange={(e) => setFattura(prev => ({ ...prev, sconto_totale: parseFloat(e.target.value) || 0 }))}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
              />

              <TextField
                size="small"
                type="number"
                label="IVA %"
                value={fattura.iva}
                onChange={(e) => setFattura(prev => ({ ...prev, iva: parseFloat(e.target.value) || 0 }))}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
              />

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={700}>TOTALE:</Typography>
                <Typography variant="h5" fontWeight={700} color="primary">
                  {formatCurrency(fattura.totale)}
                </Typography>
              </Box>

              <Divider />

              {/* Stato Fattura */}
              <FormControl fullWidth size="small">
                <InputLabel>Stato</InputLabel>
                <Select
                  value={fattura.stato}
                  label="Stato"
                  onChange={(e) => setFattura(prev => ({ ...prev, stato: e.target.value as any }))}
                >
                  <MenuItem value="bozza">🟡 Bozza</MenuItem>
                  <MenuItem value="emessa">🟢 Emessa</MenuItem>
                  <MenuItem value="pagata">💚 Pagata</MenuItem>
                </Select>
              </FormControl>

              <Divider />

              {/* Azioni Rapide */}
              <Typography variant="subtitle2" fontWeight={600} color="primary">
                🚀 Azioni Rapide
              </Typography>

              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={stampaFattura}
                  disabled={!fattura.cliente || fattura.righe.every(r => !r.prodotto)}
                >
                  Stampa
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={condividiEmail}
                  disabled={!fattura.cliente?.email}
                  color="info"
                >
                  Invia Email
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<WhatsAppIcon />}
                  onClick={condividiWhatsApp}
                  disabled={!fattura.cliente?.telefono}
                  color="success"
                >
                  WhatsApp
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={scaricaPDF}
                  disabled={!fattura.cliente || fattura.righe.every(r => !r.prodotto)}
                >
                  Scarica PDF
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog Anteprima Fattura */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">📄 Anteprima Fattura {fattura.numero}</Typography>
            <Stack direction="row" spacing={1}>
              <IconButton onClick={stampaFattura} color="primary">
                <PrintIcon />
              </IconButton>
              <IconButton onClick={condividiEmail} color="info" disabled={!fattura.cliente?.email}>
                <EmailIcon />
              </IconButton>
              <IconButton onClick={condividiWhatsApp} color="success" disabled={!fattura.cliente?.telefono}>
                <WhatsAppIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {/* Formato Fattura Professionale */}
          <Box sx={{ p: 3, bgcolor: 'white', minHeight: 600 }}>
            {/* Intestazione */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="primary">
                  🌺 DimitriFlor
                </Typography>
                <Typography variant="body2">
                  Via dei Fiori, 123<br />
                  00100 Roma, Italia<br />
                  Tel: +39 06 1234567<br />
                  Email: info@dimitriflor.it<br />
                  P.IVA: IT12345678901
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" fontWeight={700}>
                  FATTURA {fattura.numero}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Data: {new Date(fattura.data).toLocaleDateString('it-IT')}<br />
                  Scadenza: {new Date(fattura.scadenza).toLocaleDateString('it-IT')}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Dati Cliente */}
            {fattura.cliente && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={600} mb={1}>
                  Fatturare a:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1" fontWeight={600}>
                    {fattura.cliente.nome} {fattura.cliente.cognome}
                  </Typography>
                  <Typography variant="body2">
                    {fattura.cliente.indirizzo}<br />
                    {fattura.cliente.cap} {fattura.cliente.citta}<br />
                    {fattura.cliente.email}<br />
                    {fattura.cliente.telefono}
                  </Typography>
                  {fattura.cliente.piva && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      P.IVA: {fattura.cliente.piva}
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}

            {/* Tabella Prodotti */}
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Descrizione</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 600 }}>Qtà</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Prezzo €</TableCell>
                    <TableCell align="center" sx={{ color: 'white', fontWeight: 600 }}>Sconto %</TableCell>
                    <TableCell align="right" sx={{ color: 'white', fontWeight: 600 }}>Totale €</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fattura.righe.filter(r => r.prodotto).map((riga) => (
                    <TableRow key={riga.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {riga.prodotto?.varieta_nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {riga.prodotto?.gruppo_nome} - {riga.prodotto?.prodotto_nome}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{riga.quantita}</TableCell>
                      <TableCell align="right">{formatCurrency(riga.prezzo_unitario)}</TableCell>
                      <TableCell align="center">{riga.sconto}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatCurrency(riga.totale)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totali */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Box sx={{ minWidth: 300 }}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Subtotale:</Typography>
                      <Typography>{formatCurrency(fattura.subtotale)}</Typography>
                    </Box>
                    {fattura.sconto_totale > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Sconto ({fattura.sconto_totale}%):</Typography>
                        <Typography>-{formatCurrency((fattura.subtotale * fattura.sconto_totale) / 100)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>IVA ({fattura.iva}%):</Typography>
                      <Typography>{formatCurrency(((fattura.subtotale - (fattura.subtotale * fattura.sconto_totale) / 100) * fattura.iva) / 100)}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight={700}>TOTALE:</Typography>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {formatCurrency(fattura.totale)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Box>
            </Box>

            {/* Metodo di Pagamento */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Metodo di Pagamento: {fattura.metodo_pagamento.toUpperCase()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scadenza pagamento: {new Date(fattura.scadenza).toLocaleDateString('it-IT')}
              </Typography>
            </Box>

            {/* Note */}
            {fattura.note && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Note:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {fattura.note}
                </Typography>
              </Box>
            )}

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
              <Typography variant="caption" color="text.secondary">
                Grazie per aver scelto DimitriFlor! 🌸<br />
                Questa fattura è stata generata elettronicamente.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog Selezione Prodotti Ampia */}
      <Dialog
        open={dialogProdotti.open}
        onClose={chiudiDialogoProdotti}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh', maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" component="div">
              📦 Selezione Prodotto - Magazzino Completo
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {prodottiFiltrati.length} di {prodotti.filter(p => p.disponibile && p.giacenza > 0).length} prodotti disponibili
              </Typography>
              <IconButton onClick={chiudiDialogoProdotti} size="small">
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Filtri e ricerca */}
          <Stack direction="row" spacing={2} sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="🔍 Cerca per varietà, gruppo, prodotto, colore..."
              value={dialogProdotti.searchText}
              onChange={(e) => setDialogProdotti(prev => ({ ...prev, searchText: e.target.value }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">🔍</InputAdornment>
              }}
            />
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Gruppo</InputLabel>
              <Select
                value={dialogProdotti.gruppoFiltro}
                label="Gruppo"
                onChange={(e) => setDialogProdotti(prev => ({ ...prev, gruppoFiltro: e.target.value }))}
              >
                <MenuItem value="tutti">🌐 Tutti i gruppi</MenuItem>
                {gruppiDisponibili.map(gruppo => (
                  <MenuItem key={gruppo} value={gruppo}>
                    🌸 {gruppo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Lista prodotti raggruppata per gruppo */}
          <Box sx={{ p: 2, height: 'calc(90vh - 200px)', overflow: 'auto' }}>
            {Object.keys(prodottiRaggruppati).length > 0 ? (
              Object.keys(prodottiRaggruppati).sort().map((nomeGruppo) => (
                <Box key={nomeGruppo} sx={{ mb: 4 }}>
                  {/* Header gruppo */}
                  <Box sx={{ 
                    position: 'sticky', 
                    top: 0, 
                    bgcolor: 'background.paper', 
                    zIndex: 1,
                    borderBottom: 2,
                    borderColor: 'primary.main',
                    pb: 1,
                    mb: 2
                  }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography variant="h5" fontWeight={600} color="primary.main">
                        🌸 {nomeGruppo}
                      </Typography>
                      <Chip 
                        label={`${prodottiRaggruppati[nomeGruppo].length} varietà`}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>

                  {/* Griglia prodotti del gruppo */}
                  <Grid container spacing={2}>
                    {prodottiRaggruppati[nomeGruppo].map((prodotto) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={prodotto.id}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            height: '100%',
                            border: 2,
                            borderColor: 'success.light',
                            bgcolor: 'background.paper',
                            '&:hover': {
                              borderColor: 'success.main',
                              boxShadow: 4,
                              transform: 'translateY(-2px)',
                              transition: 'all 0.2s ease-in-out'
                            }
                          }}
                          onClick={() => selezionaProdotto(prodotto)}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            {/* Header con badge disponibile */}
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                              <Badge
                                color="success"
                                variant="dot"
                                sx={{ mr: 1 }}
                              />
                              <Typography variant="caption" color="success.main" fontWeight={600}>
                                DISPONIBILE
                              </Typography>
                            </Stack>

                            {/* Nome varietà */}
                            <Typography 
                              variant="h6" 
                              fontWeight={600} 
                              color="text.primary"
                              sx={{ fontSize: '1rem', mb: 1, lineHeight: 1.2 }}
                            >
                              {prodotto.varieta_nome}
                            </Typography>

                            {/* Colore se presente */}
                            {prodotto.colore && (
                              <Box mb={1}>
                                <Chip
                                  label={`🎨 ${prodotto.colore}`}
                                  size="small"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                  color="secondary"
                                  variant="outlined"
                                />
                              </Box>
                            )}

                            {/* Informazioni prodotto */}
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              📋 {prodotto.prodotto_nome}
                            </Typography>

                            {/* Giacenza e imballo */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography 
                                variant="body2" 
                                fontWeight={600}
                                color="success.main"
                              >
                                📦 {prodotto.giacenza} pz
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Imballo: {prodotto.imballo}
                              </Typography>
                            </Stack>

                            {/* Prezzo */}
                            <Typography 
                              variant="h6" 
                              fontWeight={600} 
                              color="primary.main"
                              sx={{ textAlign: 'center', fontSize: '0.9rem' }}
                            >
                              {formatCurrency(prodotto.prezzo_vendita)}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  🔍 Nessun prodotto disponibile
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dialogProdotti.searchText || dialogProdotti.gruppoFiltro !== 'tutti' 
                    ? 'Prova a modificare i filtri di ricerca' 
                    : 'Non ci sono prodotti con giacenza disponibile al momento'
                  }
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
          <Button onClick={chiudiDialogoProdotti} variant="outlined">
            Annulla
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
            Clicca su un prodotto per selezionarlo
          </Typography>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 