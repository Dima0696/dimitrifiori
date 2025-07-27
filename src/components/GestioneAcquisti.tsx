import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, Button, Stack, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Card, CardContent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import { apiService } from '../lib/apiService';
import ActionToolbar from '../components/ActionToolbar';
import SearchBar from '../components/SearchBar';

// Interfacce
interface Fornitore {
  id: number;
  nome: string;
  ragione_sociale?: string;
  citta?: string;
  telefono?: string;
  email?: string;
  partita_iva?: string;
}

interface ProdottoAcquisto {
  id: string;
  varieta: string;
  gruppo: string;
  prodotto: string;
  prezzoAcquisto: number;
  quantitaOrdinata: number;
  quantitaRicevuta: number;
  imballo: number;
}

interface OrdineAcquisto {
  id: string;
  numero: string;
  fornitore: Fornitore;
  data: string;
  dataConsegna?: string;
  prodotti: ProdottoAcquisto[];
  totale: number;
  stato: 'bozza' | 'inviato' | 'confermato' | 'in_consegna' | 'ricevuto' | 'annullato';
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export default function GestioneAcquisti() {
  const [ordini, setOrdini] = React.useState<OrdineAcquisto[]>([]);
  const [fornitori, setFornitori] = React.useState<Fornitore[]>([]);
  const [prodotti, setProdotti] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedOrdine, setSelectedOrdine] = React.useState<OrdineAcquisto | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);
  const [showNewOrder, setShowNewOrder] = React.useState(false);
  const [newOrder, setNewOrder] = React.useState<Partial<OrdineAcquisto>>({
    numero: '',
    fornitore: {} as Fornitore,
    prodotti: [],
    totale: 0,
    stato: 'bozza',
    note: ''
  });
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const [snackbar, setSnackbar] = React.useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });

  // Carica dati all'avvio
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Caricamento dati acquisti...');
      
      // Carica fornitori dal backend
      const fornitoriData = await apiService.getFornitori();
      setFornitori(fornitoriData);

      // Carica prodotti disponibili per acquisto
          const varietaResult = await apiService.getVarieta(false); // Solo varietà con giacenza > 0
    const prodottiResult = await apiService.getProdotti(false); // Solo prodotti con giacenza > 0
    const gruppiResult = await apiService.getGruppi(false); // Solo gruppi con giacenza > 0

      const prodottiAcquisto = varietaResult.map((varieta: any) => {
        const prodotto = prodottiResult.find((p: any) => p.id === varieta.prodotto_id);
        const gruppo = gruppiResult.find((g: any) => g.id === prodotto?.gruppo_id);
        return {
          id: varieta.id,
          varieta: varieta.nome || '',
          gruppo: gruppo?.nome || '',
          prodotto: prodotto?.nome || '',
          prezzoAcquisto: 0, // Da definire per ogni fornitore
          quantitaOrdinata: 0,
          quantitaRicevuta: 0,
          imballo: varieta.imballo || 1
        };
      });

      setProdotti(prodottiAcquisto);

      // Carica ordini (placeholder per ora)
      setOrdini([]);
      
      setLastUpdate(new Date());
      console.log('✅ Dati acquisti caricati');
      
    } catch (err: any) {
      console.error('❌ Errore caricamento acquisti:', err);
      setError('Errore nel caricamento dei dati. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };



  // Filtraggio ordini
  const filteredOrdini = ordini.filter(ordine => {
    if (!ordine) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (ordine.numero || '').toLowerCase().includes(searchLower) ||
      (ordine.fornitore?.nome || '').toLowerCase().includes(searchLower) ||
      (ordine.fornitore?.ragione_sociale || '').toLowerCase().includes(searchLower)
    );
  });

  // Calcoli widget dashboard
  const totaleOrdini = ordini.length;
  const ordiniInviati = ordini.filter(o => o.stato === 'inviato').length;

  const valoreAcquisti = ordini.reduce((sum, o) => sum + (o.totale || 0), 0);

  const handleViewDetails = (ordine: OrdineAcquisto) => {
    if (!ordine) return;
    setSelectedOrdine(ordine);
    setShowDetails(true);
    setSnackbar({ open: true, message: `Dettagli ordine ${ordine.numero}`, severity: 'success' });
  };

  const handleNewOrder = () => {
    setNewOrder({
      numero: `ACQ-${Date.now()}`,
      fornitore: {} as Fornitore,
      prodotti: [],
      totale: 0,
      stato: 'bozza',
      note: ''
    });
    setShowNewOrder(true);
    setSnackbar({ open: true, message: 'Nuovo ordine acquisto', severity: 'success' });
  };

  const handleSaveOrder = async () => {
    try {
      setLoading(true);
      
      // Simula salvataggio ordine
      const ordineCompleto: OrdineAcquisto = {
        id: `acq-${Date.now()}`,
        numero: newOrder.numero || '',
        fornitore: newOrder.fornitore || {} as Fornitore,
        data: new Date().toISOString(),
        prodotti: newOrder.prodotti || [],
        totale: newOrder.totale || 0,
        stato: newOrder.stato || 'bozza',
        note: newOrder.note || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setOrdini([...ordini, ordineCompleto]);
      setShowNewOrder(false);
      setNewOrder({});
      setSnackbar({ open: true, message: 'Ordine acquisto creato con successo', severity: 'success' });
      
    } catch (err: any) {
      console.error('❌ Errore salvataggio:', err);
      setSnackbar({ open: true, message: 'Errore nel salvataggio dell\'ordine', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    setSnackbar({ open: true, message: 'Dati aggiornati', severity: 'success' });
  };

  const handleExport = () => {
    setSnackbar({ open: true, message: 'Esportazione in arrivo', severity: 'success' });
  };

  const handlePrint = () => {
    window.print();
    setSnackbar({ open: true, message: 'Stampa avviata', severity: 'success' });
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'bozza': return 'default';
      case 'inviato': return 'primary';
      case 'confermato': return 'info';
      case 'in_consegna': return 'warning';
      case 'ricevuto': return 'success';
      case 'annullato': return 'error';
      default: return 'default';
    }
  };

  const getStatoLabel = (stato: string) => {
    switch (stato) {
      case 'bozza': return 'Bozza';
      case 'inviato': return 'Inviato';
      case 'confermato': return 'Confermato';
      case 'in_consegna': return 'In Consegna';
      case 'ricevuto': return 'Ricevuto';
      case 'annullato': return 'Annullato';
      default: return stato;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (e) {
      return '-';
    }
  };

  // Stati di rendering
  if (loading && ordini.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
          Caricamento acquisti...
        </Typography>
      </Box>
    );
  }

  if (error && ordini.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadData}>
              Riprova
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>Gestione Acquisti</Typography>
      
      {/* Widget Dashboard */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #e3f0ff 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Totale Ordini</Typography>
          <Typography variant="h5" fontWeight={700}>{totaleOrdini}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #ffe3ec 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Valore Totale</Typography>
          <Typography variant="h5" fontWeight={700}>€{valoreAcquisti.toLocaleString('it-IT', { maximumFractionDigits: 2 })}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #e3ffe7 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Ordini Mese</Typography>
          <Typography variant="h5" fontWeight={700}>{ordiniInviati}</Typography>
        </Paper>
      </Box>

      {/* Nuova ActionToolbar */}
      <ActionToolbar 
        actions={[
          {
            label: 'Aggiorna',
            icon: <RefreshIcon />,
            color: 'primary' as const,
            onClick: handleRefresh,
            tooltip: 'Aggiorna la lista acquisti',
            active: loading
          },
          {
            label: 'Esporta',
            icon: <DownloadIcon />,
            color: 'success' as const,
            onClick: handleExport,
            tooltip: 'Esporta gli acquisti in Excel'
          },
          {
            label: 'Stampa',
            icon: <PrintIcon />,
            color: 'warning' as const,
            onClick: handlePrint,
            tooltip: 'Stampa la lista acquisti'
          }
        ]} 
        sticky 
      />

      {/* Header con ricerca */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #f7f8fa 0%, #ffffff 100%)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center">
          <SearchBar
            placeholder="Cerca acquisti per fornitore, numero ordine, stato..."
            onSearch={setSearchTerm}
            initialValue={searchTerm}
            sx={{ flexGrow: 1, minWidth: 300 }}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredOrdini.length} ordini trovati
          {lastUpdate && (
            <span style={{ marginLeft: 16, color: '#888', fontSize: 13 }}>
              Ultimo aggiornamento: {lastUpdate.toLocaleString('it-IT')}
            </span>
          )}
        </Typography>

        {/* Tabella ordini */}
        <TableContainer sx={{ 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
          borderRadius: 2, 
          overflow: 'auto', 
          backgroundColor: 'white' 
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Numero</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fornitore</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Consegna</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Prodotti</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Totale</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Stato</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrdini.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {searchTerm ? 'Nessun ordine trovato per la ricerca' : 'Nessun ordine disponibile'}
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleNewOrder}
                      sx={{ mt: 2 }}
                    >
                      Crea il primo ordine
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrdini.map((ordine) => (
                  <TableRow key={ordine.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {ordine.numero}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {ordine.fornitore?.ragione_sociale || ordine.fornitore?.nome}
                      </Typography>
                      {ordine.fornitore?.citta && (
                        <Typography variant="caption" color="text.secondary">
                          {ordine.fornitore.citta}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(ordine.data)}</TableCell>
                    <TableCell>{ordine.dataConsegna ? formatDate(ordine.dataConsegna) : '-'}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={ordine.prodotti?.length || 0} 
                        size="small" 
                        color="primary" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="primary">
                        €{(ordine.totale || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatoLabel(ordine.stato)}
                        color={getStatoColor(ordine.stato)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Dettagli">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(ordine)}
                            color="primary"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica">
                          <IconButton
                            size="small"
                            color="secondary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <IconButton
                            size="small"
                            color="error"
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
      </Paper>

      {/* Dialog dettagli ordine */}
      <Dialog 
        open={showDetails} 
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Dettagli Ordine {selectedOrdine?.numero}
          <IconButton
            aria-label="close"
            onClick={() => setShowDetails(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedOrdine && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="h6" gutterBottom>Informazioni Ordine</Typography>
                  <Typography><strong>Numero:</strong> {selectedOrdine.numero}</Typography>
                  <Typography><strong>Data:</strong> {formatDate(selectedOrdine.data)}</Typography>
                  <Typography><strong>Stato:</strong> {getStatoLabel(selectedOrdine.stato)}</Typography>
                  {selectedOrdine.dataConsegna && (
                    <Typography><strong>Consegna:</strong> {formatDate(selectedOrdine.dataConsegna)}</Typography>
                  )}
                </Box>
                <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                  <Typography variant="h6" gutterBottom>Fornitore</Typography>
                  <Typography><strong>Nome:</strong> {selectedOrdine.fornitore?.nome}</Typography>
                                {selectedOrdine.fornitore?.ragione_sociale && (
                <Typography><strong>Ragione Sociale:</strong> {selectedOrdine.fornitore.ragione_sociale}</Typography>
              )}
                  {selectedOrdine.fornitore?.citta && (
                    <Typography><strong>Città:</strong> {selectedOrdine.fornitore.citta}</Typography>
                  )}
                </Box>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="h6" gutterBottom>Prodotti ({selectedOrdine.prodotti?.length || 0})</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Prodotto</TableCell>
                          <TableCell align="right">Quantità Ordinata</TableCell>
                          <TableCell align="right">Quantità Ricevuta</TableCell>
                          <TableCell align="right">Prezzo Unitario</TableCell>
                          <TableCell align="right">Totale</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrdine.prodotti?.map((prodotto, index) => (
                          <TableRow key={index}>
                            <TableCell>{prodotto.varieta}</TableCell>
                            <TableCell align="right">{prodotto.quantitaOrdinata}</TableCell>
                            <TableCell align="right">{prodotto.quantitaRicevuta}</TableCell>
                            <TableCell align="right">€{prodotto.prezzoAcquisto.toFixed(2)}</TableCell>
                            <TableCell align="right">€{(prodotto.prezzoAcquisto * prodotto.quantitaOrdinata).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
                {selectedOrdine.note && (
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="h6" gutterBottom>Note</Typography>
                    <Typography>{selectedOrdine.note}</Typography>
                  </Box>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" align="right" color="primary">
                Totale: €{(selectedOrdine.totale || 0).toFixed(2)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog nuovo ordine */}
      <Dialog 
        open={showNewOrder} 
        onClose={() => setShowNewOrder(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Nuovo Ordine Acquisto
          <IconButton
            aria-label="close"
            onClick={() => setShowNewOrder(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}>
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <TextField
                fullWidth
                label="Numero Ordine"
                value={newOrder.numero || ''}
                onChange={(e) => setNewOrder({...newOrder, numero: e.target.value})}
                margin="normal"
              />
            </Box>
            <Box sx={{ width: { xs: '100%', md: '50%' } }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Fornitore</InputLabel>
                <Select
                  value={newOrder.fornitore?.id || ''}
                  onChange={(e) => {
                    const fornitore = fornitori.find(f => f.id === e.target.value);
                    setNewOrder({...newOrder, fornitore: fornitore || {} as Fornitore});
                  }}
                  label="Fornitore"
                >
                  {fornitori.map((fornitore) => (
                    <MenuItem key={fornitore.id} value={fornitore.id}>
                      {fornitore.ragione_sociale || fornitore.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ width: '100%' }}>
              <Typography variant="h6" gutterBottom>Prodotti da Ordinare</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Prodotto</TableCell>
                      <TableCell>Gruppo</TableCell>
                      <TableCell align="right">Prezzo Acquisto</TableCell>
                      <TableCell align="right">Quantità</TableCell>
                      <TableCell align="right">Imballo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {prodotti.map((prodotto) => (
                      <TableRow key={prodotto.id}>
                        <TableCell>{prodotto.varieta}</TableCell>
                        <TableCell>{prodotto.gruppo}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={prodotto.prezzoAcquisto || 0}
                            onChange={(e) => {
                              const prezzo = parseFloat(e.target.value) || 0;
                              const prodottiAggiornati = newOrder.prodotti?.map(p => 
                                p.id === prodotto.id ? {...p, prezzoAcquisto: prezzo} : p
                              ) || [];
                              if (prodotto.quantitaOrdinata > 0) {
                                const prodottoAggiornato = prodottiAggiornati.find(p => p.id === prodotto.id);
                                if (prodottoAggiornato) {
                                  prodottoAggiornato.prezzoAcquisto = prezzo;
                                }
                              }
                              const totale = prodottiAggiornati.reduce((sum, p) => 
                                sum + (p.prezzoAcquisto * p.quantitaOrdinata), 0
                              );
                              setNewOrder({...newOrder, prodotti: prodottiAggiornati, totale});
                            }}
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={prodotto.quantitaOrdinata || 0}
                            onChange={(e) => {
                              const quantita = parseInt(e.target.value) || 0;
                              const prodottiAggiornati = newOrder.prodotti?.map(p => 
                                p.id === prodotto.id ? {...p, quantitaOrdinata: quantita} : p
                              ) || [];
                              if (quantita > 0) {
                                const prodottoEsistente = prodottiAggiornati.find(p => p.id === prodotto.id);
                                if (prodottoEsistente) {
                                  prodottoEsistente.quantitaOrdinata = quantita;
                                } else {
                                  prodottiAggiornati.push({...prodotto, quantitaOrdinata: quantita});
                                }
                              }
                              const totale = prodottiAggiornati.reduce((sum, p) => 
                                sum + (p.prezzoAcquisto * p.quantitaOrdinata), 0
                              );
                              setNewOrder({...newOrder, prodotti: prodottiAggiornati, totale});
                            }}
                            inputProps={{ min: 0 }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="right">{prodotto.imballo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={3}
                value={newOrder.note || ''}
                onChange={(e) => setNewOrder({...newOrder, note: e.target.value})}
                margin="normal"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewOrder(false)}>Annulla</Button>
          <Button 
            onClick={handleSaveOrder} 
            variant="contained" 
            disabled={loading || !newOrder.numero || !newOrder.fornitore?.id}
          >
            {loading ? 'Salvataggio...' : 'Salva Ordine'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
} 