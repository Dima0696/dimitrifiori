import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, Button, Stack, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Tooltip, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Grid, Autocomplete, Tabs, Tab, Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  ClearAll as ClearAllIcon,
  Refresh as RefreshIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { apiService } from '../lib/apiService';

// Interfacce
interface Cliente {
  id: number;
  nome: string;
  cognome?: string;
  ragione_sociale?: string;
  partita_iva?: string;
  citta?: string;
  telefono?: string;
  email?: string;
}

interface DettaglioFattura {
  id: number;
  fattura_id: number;
  varieta_id: number;
  varieta_nome?: string;
  gruppo_nome?: string;
  quantita: number;
  prezzo_unitario: number;
  sconto?: number;
  totale: number;
  imballo?: number;
}

interface FatturaVendita {
  id: number;
  numero: string;
  tipo: 'vendita' | 'acquisto';
  cliente_id: number;
  cliente?: Cliente;
  data: string;
  scadenza?: string;
  metodo_pagamento?: string;
  totale: number;
  stato: 'bozza' | 'emessa' | 'pagata' | 'annullata';
  note?: string;
  dettagli?: DettaglioFattura[];
  created_at?: string;
  updated_at?: string;
}

const GestioneFattureVendita: React.FC = () => {
  // Stati principali
  const [fatture, setFatture] = useState<FatturaVendita[]>([]);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [varieta, setVarieta] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stati per filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStato, setFiltroStato] = useState('tutti');
  const [filtroCliente, setFiltroCliente] = useState<Cliente | null>(null);

  // Stati per dialoghi
  const [dialogDettagli, setDialogDettagli] = useState<{
    open: boolean;
    fattura: FatturaVendita | null;
  }>({ open: false, fattura: null });

  const [dialogModifica, setDialogModifica] = useState<{
    open: boolean;
    fattura: FatturaVendita | null;
  }>({ open: false, fattura: null });

  const [dialogFiltri, setDialogFiltri] = useState(false);

  // Stati per UI
  const [tabCorrente, setTabCorrente] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Stati per modifica fattura
  const [fatturaInModifica, setFatturaInModifica] = useState<FatturaVendita | null>(null);
  const [dettagliModifica, setDettagliModifica] = useState<DettaglioFattura[]>([]);
  const [nuovoDettaglio, setNuovoDettaglio] = useState<{
    varieta_id: number | null;
    quantita: number;
    prezzo_unitario: number;
    sconto: number;
  }>({
    varieta_id: null,
    quantita: 1,
    prezzo_unitario: 0,
    sconto: 0
  });

  // Carica dati iniziali
  const caricaDati = async () => {
    try {
      setLoading(true);
      setError(null);

      const [fattureData, clientiData, varietaData] = await Promise.all([
        apiService.getFatture(),
        apiService.getClienti(),
        apiService.getVarieta(false) // Solo varietà con giacenza > 0
      ]);

      // Filtra solo fatture di vendita
      const fattureVendita = fattureData.filter((f: any) => f.tipo === 'vendita');

      // Arricchisci fatture con dati cliente
      const fattureComplete = fattureVendita.map((fattura: any) => {
        const cliente = clientiData.find((c: Cliente) => c.id === fattura.cliente_id);
        return {
          ...fattura,
          cliente
        };
      });

      setFatture(fattureComplete);
      setClienti(clientiData);
      setVarieta(varietaData);
      
      console.log('🌸 Varietà caricate (solo giacenza > 0):', varietaData.slice(0, 3)); // Log prime 3 per debug
      console.log('📊 Totale varietà con giacenza:', varietaData.length);

    } catch (err: any) {
      console.error('Errore caricamento dati:', err);
      setError('Errore nel caricamento delle fatture: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    caricaDati();
  }, []);

  // Funzioni di filtraggio
  const applicaFiltri = (fatture: FatturaVendita[]): FatturaVendita[] => {
    return fatture.filter(fattura => {
      // Filtro ricerca generale
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matches = 
          fattura.numero.toLowerCase().includes(searchLower) ||
          (fattura.cliente?.nome || '').toLowerCase().includes(searchLower) ||
          (fattura.cliente?.cognome || '').toLowerCase().includes(searchLower) ||
          (fattura.cliente?.ragione_sociale || '').toLowerCase().includes(searchLower) ||
          (fattura.note || '').toLowerCase().includes(searchLower);
        
        if (!matches) return false;
      }

      // Filtro cliente
      if (filtroCliente && fattura.cliente_id !== filtroCliente.id) {
        return false;
      }

      // Filtro stato
      if (filtroStato !== 'tutti' && fattura.stato !== filtroStato) {
        return false;
      }

      return true;
    });
  };

  const fattureFiltrate = applicaFiltri(fatture);

  // Calcola statistiche
  const statistiche = {
    totale: fattureFiltrate.length,
    bozze: fattureFiltrate.filter(f => f.stato === 'bozza').length,
    emesse: fattureFiltrate.filter(f => f.stato === 'emessa').length,
    pagate: fattureFiltrate.filter(f => f.stato === 'pagata').length,
    annullate: fattureFiltrate.filter(f => f.stato === 'annullata').length,
    importoTotale: fattureFiltrate.reduce((sum, f) => sum + f.totale, 0),
    scadute: fattureFiltrate.filter(f => 
      f.scadenza && f.stato !== 'pagata' && new Date(f.scadenza) < new Date()
    ).length
  };

  // Funzioni CRUD
  const eliminaFattura = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa fattura?')) return;

    try {
      await apiService.deleteFattura(id);
      setSnackbar({
        open: true,
        message: 'Fattura eliminata con successo',
        severity: 'success'
      });
      caricaDati();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: 'Errore nell\'eliminazione: ' + err.message,
        severity: 'error'
      });
    }
  };

  const modificaStatoFattura = async (id: number, nuovoStato: string) => {
    try {
      await apiService.updateFattura(id, { stato: nuovoStato });
      setSnackbar({
        open: true,
        message: `Stato fattura aggiornato a: ${nuovoStato}`,
        severity: 'success'
      });
      caricaDati();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: 'Errore nell\'aggiornamento: ' + err.message,
        severity: 'error'
      });
    }
  };

  // Funzioni di utilità
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'bozza': return 'warning';
      case 'emessa': return 'info';
      case 'pagata': return 'success';
      case 'annullata': return 'error';
      default: return 'default';
    }
  };

  const isScaduta = (fattura: FatturaVendita) => {
    return fattura.scadenza && 
           fattura.stato !== 'pagata' && 
           new Date(fattura.scadenza) < new Date();
  };

  const resetFiltri = () => {
    setFiltroStato('tutti');
    setFiltroCliente(null);
    setSearchTerm('');
  };

  // Funzioni per modifica fattura
  const apriModificaFattura = async (fattura: FatturaVendita) => {
    try {
      const dettagli = await apiService.getDettagliFattura(fattura.id);
      console.log('🔍 Dettagli fattura caricati:', dettagli);
      
      setFatturaInModifica(fattura);
      setDettagliModifica(dettagli || []);
      setDialogModifica({ open: true, fattura });
    } catch (err: any) {
      console.error('❌ Errore caricamento dettagli:', err);
      setSnackbar({
        open: true,
        message: 'Errore nel caricamento dettagli: ' + err.message,
        severity: 'error'
      });
    }
  };

  const aggiungiDettaglio = () => {
    if (!nuovoDettaglio.varieta_id) {
      setSnackbar({
        open: true,
        message: 'Seleziona una varietà',
        severity: 'warning'
      });
      return;
    }

    const varietaSelezionata = varieta.find(v => v.id === nuovoDettaglio.varieta_id);
    if (!varietaSelezionata) return;

    const totale = (nuovoDettaglio.quantita * nuovoDettaglio.prezzo_unitario) * (1 - nuovoDettaglio.sconto / 100);

    const nuovoRecord: DettaglioFattura = {
      id: Date.now(), // ID temporaneo
      fattura_id: fatturaInModifica?.id || 0,
      varieta_id: nuovoDettaglio.varieta_id,
      varieta_nome: varietaSelezionata.varieta_nome,
      gruppo_nome: varietaSelezionata.gruppo_nome,
      quantita: nuovoDettaglio.quantita,
      prezzo_unitario: nuovoDettaglio.prezzo_unitario,
      sconto: nuovoDettaglio.sconto,
      totale: totale
    };

    setDettagliModifica(prev => [...prev, nuovoRecord]);
    
    // Reset form
    setNuovoDettaglio({
      varieta_id: null,
      quantita: 1,
      prezzo_unitario: 0,
      sconto: 0
    });
  };

  const rimuoviDettaglio = (index: number) => {
    setDettagliModifica(prev => prev.filter((_, i) => i !== index));
  };

  const modificaDettaglio = (index: number, campo: string, valore: any) => {
    setDettagliModifica(prev => {
      const nuoviDettagli = [...prev];
      const dettaglio = { ...nuoviDettagli[index] };
      
      (dettaglio as any)[campo] = valore;
      
      // Ricalcola totale
      dettaglio.totale = (dettaglio.quantita * dettaglio.prezzo_unitario) * (1 - (dettaglio.sconto || 0) / 100);
      
      nuoviDettagli[index] = dettaglio;
      return nuoviDettagli;
    });
  };

  const calcolaTotaleFattura = () => {
    return dettagliModifica.reduce((sum, dettaglio) => sum + dettaglio.totale, 0);
  };

  const salvaModificheFattura = async () => {
    if (!fatturaInModifica) return;

    try {
      const totaleAggiornato = calcolaTotaleFattura();
      
      // Aggiorna fattura
      await apiService.updateFattura(fatturaInModifica.id, {
        totale: totaleAggiornato
      });

      // Aggiorna dettagli - elimina esistenti e ricrea
      try {
        const dettagliEsistenti = await apiService.getDettagliFattura(fatturaInModifica.id);
        
        // Elimina dettagli esistenti
        for (const dettaglio of dettagliEsistenti) {
          await apiService.deleteDettaglioFattura(dettaglio.id);
        }
        
        // Crea nuovi dettagli
        for (const dettaglio of dettagliModifica) {
          await apiService.createDettaglioFattura(fatturaInModifica.id, {
            varieta_id: dettaglio.varieta_id,
            quantita: dettaglio.quantita,
            prezzo_unitario: dettaglio.prezzo_unitario,
            sconto: dettaglio.sconto || 0,
            totale: dettaglio.totale
          });
        }
      } catch (dettagliError) {
        console.warn('Errore gestione dettagli:', dettagliError);
      }

      setSnackbar({
        open: true,
        message: 'Fattura modificata con successo',
        severity: 'success'
      });

      setDialogModifica({ open: false, fattura: null });
      setFatturaInModifica(null);
      setDettagliModifica([]);
      caricaDati();

    } catch (err: any) {
      setSnackbar({
        open: true,
        message: 'Errore nel salvataggio: ' + err.message,
        severity: 'error'
      });
    }
  };

  // Raggruppamento fatture per tab
  const fatturePerTab = [
    fattureFiltrate, // Tutte
    fattureFiltrate.filter(f => f.stato === 'bozza'), // Bozze
    fattureFiltrate.filter(f => f.stato === 'emessa'), // Emesse
    fattureFiltrate.filter(f => f.stato === 'pagata'), // Pagate
    fattureFiltrate.filter(f => isScaduta(f)), // Scadute
  ];

  const fattureCorrente = fatturePerTab[tabCorrente];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={caricaDati} sx={{ ml: 2 }}>
          Riprova
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con statistiche */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestione Fatture di Vendita
        </Typography>
        
        <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 150 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {statistiche.totale}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Totali
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 150 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main">
                {statistiche.bozze}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bozze
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 150 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">
                {statistiche.emesse}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Emesse
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 150 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {statistiche.pagate}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pagate
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 150 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main">
                {statistiche.scadute}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scadute
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Importo Totale: {formatCurrency(statistiche.importoTotale)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Barra di ricerca e filtri */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Cerca fatture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 300 }}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Stato</InputLabel>
            <Select
              value={filtroStato}
              onChange={(e) => setFiltroStato(e.target.value)}
              label="Stato"
            >
              <MenuItem value="tutti">Tutti</MenuItem>
              <MenuItem value="bozza">Bozza</MenuItem>
              <MenuItem value="emessa">Emessa</MenuItem>
              <MenuItem value="pagata">Pagata</MenuItem>
              <MenuItem value="annullata">Annullata</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            options={clienti}
            getOptionLabel={(cliente) => 
              cliente.ragione_sociale || `${cliente.nome} ${cliente.cognome || ''}`.trim()
            }
            value={filtroCliente}
            onChange={(_, newValue) => setFiltroCliente(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Cliente" sx={{ minWidth: 200 }} />
            )}
          />

          <Button
            variant="text"
            startIcon={<ClearAllIcon />}
            onClick={resetFiltri}
            color="warning"
          >
            Reset
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={caricaDati}
          >
            Aggiorna
          </Button>
        </Stack>
      </Paper>

      {/* Tabs per categorie */}
      <Paper sx={{ mb: 2 }}>
        <Tabs 
          value={tabCorrente} 
          onChange={(_, newValue) => setTabCorrente(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label={`Tutte (${fatturePerTab[0].length})`}
            icon={<MoneyIcon />}
          />
          <Tab 
            label={`Bozze (${fatturePerTab[1].length})`}
            icon={<EditIcon />}
          />
          <Tab 
            label={`Emesse (${fatturePerTab[2].length})`}
            icon={<MoneyIcon />}
          />
          <Tab 
            label={`Pagate (${fatturePerTab[3].length})`}
            icon={<MoneyIcon />}
          />
          <Tab 
            label={`Scadute (${fatturePerTab[4].length})`}
            icon={<CalendarIcon />}
          />
        </Tabs>
      </Paper>

      {/* Tabella fatture */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Numero</strong></TableCell>
              <TableCell><strong>Cliente</strong></TableCell>
              <TableCell><strong>Data</strong></TableCell>
              <TableCell><strong>Scadenza</strong></TableCell>
              <TableCell><strong>Stato</strong></TableCell>
              <TableCell><strong>Totale</strong></TableCell>
              <TableCell><strong>Azioni</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fattureCorrente.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" sx={{ py: 4 }}>
                    Nessuna fattura trovata
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              fattureCorrente.map((fattura) => (
                <TableRow 
                  key={fattura.id}
                  sx={{
                    backgroundColor: isScaduta(fattura) ? 'error.light' : 'inherit',
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {fattura.numero}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {fattura.cliente?.ragione_sociale || 
                       `${fattura.cliente?.nome || ''} ${fattura.cliente?.cognome || ''}`.trim() ||
                       'Cliente non trovato'}
                    </Typography>
                    {fattura.cliente?.citta && (
                      <Typography variant="caption" color="text.secondary">
                        {fattura.cliente.citta}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(fattura.data)}
                  </TableCell>
                  <TableCell>
                    {fattura.scadenza ? (
                      <Typography 
                        variant="body2"
                        color={isScaduta(fattura) ? 'error' : 'text.primary'}
                      >
                        {formatDate(fattura.scadenza)}
                        {isScaduta(fattura) && ' ⚠️'}
                      </Typography>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={fattura.stato}
                      color={getStatoColor(fattura.stato) as any}
                      size="small"
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(fattura.totale)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Visualizza dettagli">
                        <IconButton
                          size="small"
                          onClick={() => setDialogDettagli({ open: true, fattura })}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Modifica fattura">
                        <IconButton
                          size="small"
                          onClick={() => apriModificaFattura(fattura)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Cambia stato">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const nuovoStato = fattura.stato === 'bozza' ? 'emessa' :
                                              fattura.stato === 'emessa' ? 'pagata' : 'bozza';
                            modificaStatoFattura(fattura.id, nuovoStato);
                          }}
                          color="secondary"
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Elimina">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => eliminaFattura(fattura.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Dettagli Fattura */}
      <Dialog
        open={dialogDettagli.open}
        onClose={() => setDialogDettagli({ open: false, fattura: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Dettagli Fattura {dialogDettagli.fattura?.numero}
          <IconButton
            onClick={() => setDialogDettagli({ open: false, fattura: null })}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {dialogDettagli.fattura && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Cliente: {dialogDettagli.fattura.cliente?.ragione_sociale || 
                         `${dialogDettagli.fattura.cliente?.nome || ''} ${dialogDettagli.fattura.cliente?.cognome || ''}`.trim()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Data: {formatDate(dialogDettagli.fattura.data)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Stato: {dialogDettagli.fattura.stato}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Totale: {formatCurrency(dialogDettagli.fattura.totale)}
              </Typography>
              {dialogDettagli.fattura.note && (
                <Typography variant="body1" gutterBottom>
                  Note: {dialogDettagli.fattura.note}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDettagli({ open: false, fattura: null })}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Modifica Fattura */}
      <Dialog
        open={dialogModifica.open}
        onClose={() => setDialogModifica({ open: false, fattura: null })}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Modifica Fattura {dialogModifica.fattura?.numero}
          <IconButton
            onClick={() => setDialogModifica({ open: false, fattura: null })}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {fatturaInModifica && (
            <Box>
              {/* Info fattura */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Cliente: {fatturaInModifica.cliente?.ragione_sociale || 
                           `${fatturaInModifica.cliente?.nome || ''} ${fatturaInModifica.cliente?.cognome || ''}`.trim()}
                </Typography>
                <Typography variant="body1">
                  Data: {formatDate(fatturaInModifica.data)} | Stato: {fatturaInModifica.stato}
                </Typography>
              </Paper>

              {/* Articoli esistenti */}
              <Typography variant="h6" gutterBottom>
                Articoli in Fattura
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Varietà</strong></TableCell>
                      <TableCell><strong>Gruppo</strong></TableCell>
                      <TableCell><strong>Quantità (Imballo)</strong></TableCell>
                      <TableCell><strong>Prezzo</strong></TableCell>
                      <TableCell><strong>Sconto %</strong></TableCell>
                      <TableCell><strong>Totale</strong></TableCell>
                      <TableCell><strong>Azioni</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dettagliModifica.map((dettaglio, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2">
                            {dettaglio.varieta_nome || 'Nome varietà mancante'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {dettaglio.varieta_id} • Imballo: {dettaglio.imballo || varieta.find(v => v.id === dettaglio.varieta_id)?.imballo || 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {dettaglio.gruppo_nome || 'Nome gruppo mancante'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="column" spacing={1}>
                            <TextField
                              type="number"
                              value={dettaglio.quantita}
                              onChange={(e) => {
                                const nuovaQuantita = parseInt(e.target.value) || 0;
                                const varietaCorrispondente = varieta.find(v => v.id === dettaglio.varieta_id);
                                const imballo = varietaCorrispondente?.imballo || 1;
                                
                                // Arrotonda alla quantità più vicina divisibile per l'imballo
                                const quantitaValidata = Math.round(nuovaQuantita / imballo) * imballo;
                                modificaDettaglio(index, 'quantita', quantitaValidata);
                              }}
                              size="small"
                              sx={{ width: 80 }}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <Typography variant="caption" color="text.secondary">
                                      /{varieta.find(v => v.id === dettaglio.varieta_id)?.imballo || 1}
                                    </Typography>
                                  </InputAdornment>
                                )
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {(() => {
                                const varietaCorr = varieta.find(v => v.id === dettaglio.varieta_id);
                                const imballo = varietaCorr?.imballo || 1;
                                const imballi = Math.floor(dettaglio.quantita / imballo);
                                return `${imballi} imballi`;
                              })()}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={dettaglio.prezzo_unitario}
                            onChange={(e) => modificaDettaglio(index, 'prezzo_unitario', parseFloat(e.target.value) || 0)}
                            size="small"
                            sx={{ width: 100 }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">€</InputAdornment>
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={dettaglio.sconto || 0}
                            onChange={(e) => modificaDettaglio(index, 'sconto', parseFloat(e.target.value) || 0)}
                            size="small"
                            sx={{ width: 80 }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">%</InputAdornment>
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(dettaglio.totale)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => rimuoviDettaglio(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {dettagliModifica.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Nessun articolo presente
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Aggiungi nuovo articolo */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Aggiungi Articolo
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Autocomplete
                    options={varieta}
                    getOptionLabel={(option) => `${option.varieta_nome} - ${option.gruppo_nome}`}
                    value={varieta.find(v => v.id === nuovoDettaglio.varieta_id) || null}
                    onChange={(_, newValue) => setNuovoDettaglio(prev => ({
                      ...prev,
                      varieta_id: newValue?.id || null,
                      prezzo_unitario: newValue?.prezzo_vendita || 0
                    }))}
                    renderInput={(params) => (
                      <TextField {...params} label="Varietà" sx={{ minWidth: 250 }} />
                    )}
                  />

                  <TextField
                    label="Quantità"
                    type="number"
                    value={nuovoDettaglio.quantita}
                    onChange={(e) => {
                      const quantita = parseInt(e.target.value) || 1;
                      const varietaSelezionata = varieta.find(v => v.id === nuovoDettaglio.varieta_id);
                      const imballo = varietaSelezionata?.imballo || 1;
                      
                      // Arrotonda alla quantità più vicina divisibile per l'imballo
                      const quantitaValidata = Math.round(quantita / imballo) * imballo;
                      
                      setNuovoDettaglio(prev => ({
                        ...prev,
                        quantita: quantitaValidata
                      }));
                    }}
                    sx={{ width: 120 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="caption" color="text.secondary">
                            /{(() => {
                              const varietaSelezionata = varieta.find(v => v.id === nuovoDettaglio.varieta_id);
                              return varietaSelezionata?.imballo || 1;
                            })()}
                          </Typography>
                        </InputAdornment>
                      )
                    }}
                    helperText={(() => {
                      const varietaSelezionata = varieta.find(v => v.id === nuovoDettaglio.varieta_id);
                      const imballo = varietaSelezionata?.imballo || 1;
                      const imballi = Math.floor(nuovoDettaglio.quantita / imballo);
                      return `${imballi} imballi`;
                    })()}
                  />

                  <TextField
                    label="Prezzo"
                    type="number"
                    value={nuovoDettaglio.prezzo_unitario}
                    onChange={(e) => setNuovoDettaglio(prev => ({
                      ...prev,
                      prezzo_unitario: parseFloat(e.target.value) || 0
                    }))}
                    sx={{ width: 120 }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>
                    }}
                  />

                  <TextField
                    label="Sconto"
                    type="number"
                    value={nuovoDettaglio.sconto}
                    onChange={(e) => setNuovoDettaglio(prev => ({
                      ...prev,
                      sconto: parseFloat(e.target.value) || 0
                    }))}
                    sx={{ width: 100 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                  />

                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={aggiungiDettaglio}
                    disabled={!nuovoDettaglio.varieta_id}
                  >
                    Aggiungi
                  </Button>
                </Stack>
              </Paper>

              {/* Totale fattura */}
              <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="h5" align="center">
                  Totale Fattura: {formatCurrency(calcolaTotaleFattura())}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialogModifica({ open: false, fattura: null })}
            color="inherit"
          >
            Annulla
          </Button>
          <Button
            onClick={salvaModificheFattura}
            variant="contained"
            color="primary"
            disabled={dettagliModifica.length === 0}
          >
            Salva Modifiche
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per notifiche */}
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
    </Box>
  );
};

export default GestioneFattureVendita; 