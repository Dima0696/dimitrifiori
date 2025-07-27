import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, Button, Stack, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Tooltip, Card, CardContent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { apiService } from '../lib/apiService';

interface Cliente {
  id: number;
  nome: string;
  cognome?: string;
  ragioneSociale?: string;
  piva?: string;
  citta?: string;
  telefono?: string;
  email?: string;
}

interface OrdineVendita {
  id: number;
  numero: string;
  cliente: Cliente;
  data: string;
  prodotti: Array<{
    id: string;
    varieta: string;
    gruppo: string;
    prodotto: string;
    prezzoVendita: number;
    quantita: number;
    totale: number;
  }>;
  totale: number;
  stato: 'bozza' | 'confermato' | 'in_preparazione' | 'spedito' | 'consegnato' | 'annullato';
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export default function ListaOrdiniVendita() {
  const [ordini, setOrdini] = useState<OrdineVendita[]>([]);
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrdine, setSelectedOrdine] = useState<OrdineVendita | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showNewOrdine, setShowNewOrdine] = useState(false);
  const [showEditOrdine, setShowEditOrdine] = useState(false);
  const [newOrdine, setNewOrdine] = useState<Partial<OrdineVendita>>({
    numero: '',
    cliente: {} as Cliente,
    prodotti: [],
    totale: 0,
    stato: 'bozza',
    note: ''
  });
  const [editOrdine, setEditOrdine] = useState<Partial<OrdineVendita>>({
    numero: '',
    cliente: {} as Cliente,
    prodotti: [],
    totale: 0,
    stato: 'bozza',
    note: ''
  });

  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });

  // Carica dati all'avvio
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Caricamento dati ordini di vendita...');
      
      // Carica clienti
      console.log('🔄 Caricamento clienti...');
      try {
        const clientiData = await apiService.getClienti();
        console.log('📋 Clienti trovati:', clientiData.length);
        
        const clientiProcessed = clientiData.map((doc: any) => ({
          id: doc.id,
          nome: doc.nome || doc.ragione_sociale || 'Cliente',
          cognome: doc.cognome || '',
          ragioneSociale: doc.ragione_sociale || '',
          piva: doc.piva || '',
          citta: doc.citta || '',
          telefono: doc.telefono || '',
          email: doc.email || ''
        }));
        setClienti(clientiProcessed);
        console.log('✅ Clienti caricati:', clientiProcessed.length);
      } catch (clientiError) {
        console.error('❌ Errore caricamento clienti:', clientiError);
        setClienti([]);
      }

      // Carica ordini dal database
      console.log('🔄 Caricamento ordini...');
      try {
        const ordiniResult = await apiService.getOrdiniVendita();
        console.log('📋 Ordini trovati:', ordiniResult.length);
        console.log('📋 Dati ordini raw:', ordiniResult);
        
        const ordiniData = ordiniResult.map((doc: any) => ({
          id: doc.id,
          numero: doc.numero || '',
          cliente: doc.cliente || {} as Cliente,
          data: doc.data || doc.created_at,
          prodotti: doc.prodotti || [],
          totale: doc.totale || 0,
          stato: doc.stato || 'bozza',
          note: doc.note || '',
          created_at: doc.created_at,
          updated_at: doc.updated_at
        }));
        setOrdini(ordiniData);
        console.log('✅ Ordini di vendita caricati:', ordiniData.length);
      } catch (ordiniError) {
        console.error('❌ Errore caricamento ordini:', ordiniError);
        setOrdini([]);
      }
      
      console.log('✅ Dati ordini di vendita caricati');
      
    } catch (err: any) {
      console.error('❌ Errore generale caricamento ordini:', err);
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
      (ordine.cliente?.nome || '').toLowerCase().includes(searchLower) ||
      (ordine.cliente?.ragioneSociale || '').toLowerCase().includes(searchLower)
    );
  });

  // Calcoli widget dashboard
  const totaleOrdini = ordini.length;
  const ordiniConfermati = ordini.filter(o => o.stato === 'confermato').length;
  const ordiniSpediti = ordini.filter(o => o.stato === 'spedito').length;
  const ordiniConsegnati = ordini.filter(o => o.stato === 'consegnato').length;
  const valoreOrdini = ordini.reduce((sum, o) => sum + (o.totale || 0), 0);

  // Ordini del mese corrente
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const ordiniMese = ordini.filter(o => {
    const data = new Date(o.data);
    return data.getMonth() === currentMonth && data.getFullYear() === currentYear;
  }).length;

  const handleViewDetails = (ordine: OrdineVendita) => {
    if (!ordine) return;
    setSelectedOrdine(ordine);
    setShowDetails(true);
    setSnackbar({ open: true, message: `Dettagli ordine ${ordine.numero}`, severity: 'success' });
  };

  const handleEditOrdine = (ordine: OrdineVendita) => {
    setEditOrdine({
      id: ordine.id,
      numero: ordine.numero,
      cliente: ordine.cliente,
      data: ordine.data,
      prodotti: ordine.prodotti,
      totale: ordine.totale,
      stato: ordine.stato,
      note: ordine.note
    });
    setShowEditOrdine(true);
    setSnackbar({ open: true, message: `Modifica ordine ${ordine.numero}`, severity: 'success' });
  };

  const handleDeleteOrdine = async (ordine: OrdineVendita) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'ordine "${ordine.numero}"?`)) return;
    
    try {
      setLoading(true);
      await apiService.deleteOrdineVendita(ordine.id);
      
      setOrdini(prev => prev.filter(o => o.id !== ordine.id));
      setSnackbar({ open: true, message: 'Ordine eliminato con successo', severity: 'success' });
      
    } catch (err: any) {
      console.error('❌ Errore eliminazione ordine:', err);
      setSnackbar({ open: true, message: 'Errore nell\'eliminazione dell\'ordine', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrdine = () => {
    setNewOrdine({
      numero: `ORD-${Date.now()}`,
      cliente: {} as Cliente,
      prodotti: [],
      totale: 0,
      stato: 'bozza',
      note: ''
    });
    setShowNewOrdine(true);
    setSnackbar({ open: true, message: 'Nuovo ordine', severity: 'success' });
  };

  const handleSaveOrdine = async () => {
    try {
      setLoading(true);
      
      const ordineData = {
        numero: newOrdine.numero || '',
        cliente_id: newOrdine.cliente?.id,
        data: newOrdine.data || new Date().toISOString(),
        totale: newOrdine.totale || 0,
        stato: newOrdine.stato || 'bozza',
        note: newOrdine.note || ''
      };

      const nuovoOrdine = await apiService.createOrdineVendita(ordineData);

      // Ricarica gli ordini per avere i dati aggiornati
      await loadData();
      
      setShowNewOrdine(false);
      setNewOrdine({});
      setSnackbar({ open: true, message: 'Ordine creato con successo', severity: 'success' });
      
    } catch (err: any) {
      console.error('❌ Errore salvataggio:', err);
      setSnackbar({ open: true, message: 'Errore nel salvataggio dell\'ordine', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrdine = async () => {
    if (!editOrdine.id) return;
    
    try {
      setLoading(true);
      
      const ordineData = {
        numero: editOrdine.numero || '',
        cliente_id: editOrdine.cliente?.id,
        data: editOrdine.data || new Date().toISOString(),
        totale: editOrdine.totale || 0,
        stato: editOrdine.stato || 'bozza',
        note: editOrdine.note || ''
      };

      await apiService.updateOrdineVendita(editOrdine.id, ordineData);

      // Ricarica gli ordini per avere i dati aggiornati
      await loadData();
      
      setShowEditOrdine(false);
      setEditOrdine({});
      setSnackbar({ open: true, message: 'Ordine aggiornato con successo', severity: 'success' });
      
    } catch (err: any) {
      console.error('❌ Errore aggiornamento:', err);
      setSnackbar({ open: true, message: 'Errore nell\'aggiornamento dell\'ordine', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'confermato': return 'primary';
      case 'in_preparazione': return 'warning';
      case 'spedito': return 'info';
      case 'consegnato': return 'success';
      case 'annullato': return 'error';
      default: return 'default';
    }
  };

  const getStatoLabel = (stato: string) => {
    switch (stato) {
      case 'bozza': return 'Bozza';
      case 'confermato': return 'Confermato';
      case 'in_preparazione': return 'In Preparazione';
      case 'spedito': return 'Spedito';
      case 'consegnato': return 'Consegnato';
      case 'annullato': return 'Annullato';
      default: return stato;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestione Ordini di Vendita
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewOrdine}
        >
          Nuovo Ordine
        </Button>
      </Box>

      {/* Widget Dashboard */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={2} mb={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Totale Ordini
            </Typography>
            <Typography variant="h4">
              {totaleOrdini}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Ordini Confermati
            </Typography>
            <Typography variant="h4" color="primary">
              {ordiniConfermati}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Ordini Spediti
            </Typography>
            <Typography variant="h4" color="info.main">
              {ordiniSpediti}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Ordini Consegnati
            </Typography>
            <Typography variant="h4" color="success.main">
              {ordiniConsegnati}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Valore Totale
            </Typography>
            <Typography variant="h4" color="success.main">
              {formatCurrency(valoreOrdini)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Ordini del Mese
            </Typography>
            <Typography variant="h4" color="warning.main">
              {ordiniMese}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Barra di ricerca */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Cerca ordini per numero, cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Tabella ordini */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Numero</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Totale</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell>Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrdini.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Nessun ordine trovato
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrdini.map((ordine) => (
                  <TableRow key={ordine.id}>
                    <TableCell>{ordine.numero}</TableCell>
                    <TableCell>
                      {ordine.cliente?.ragioneSociale || `${ordine.cliente?.nome} ${ordine.cliente?.cognome}`}
                    </TableCell>
                    <TableCell>{formatDate(ordine.data)}</TableCell>
                    <TableCell>{formatCurrency(ordine.totale)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatoLabel(ordine.stato)}
                        color={getStatoColor(ordine.stato) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Visualizza dettagli">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(ordine)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica">
                          <IconButton
                            size="small"
                            onClick={() => handleEditOrdine(ordine)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteOrdine(ordine)}
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

      {/* Dialog Nuovo Ordine */}
      <Dialog
        open={showNewOrdine}
        onClose={() => setShowNewOrdine(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Nuovo Ordine di Vendita
          <IconButton
            onClick={() => setShowNewOrdine(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box p={2}>
            <Typography variant="h6" gutterBottom>
              Informazioni Ordine
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Funzionalità in sviluppo - Selezione cliente e prodotti
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewOrdine(false)}>
            Annulla
          </Button>
          <Button onClick={handleSaveOrdine} variant="contained">
            Salva Ordine
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Modifica Ordine */}
      <Dialog
        open={showEditOrdine}
        onClose={() => setShowEditOrdine(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Modifica Ordine
          <IconButton
            onClick={() => setShowEditOrdine(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box p={2}>
            <Typography variant="h6" gutterBottom>
              Informazioni Ordine
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Funzionalità in sviluppo - Modifica cliente e prodotti
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditOrdine(false)}>
            Annulla
          </Button>
          <Button onClick={handleUpdateOrdine} variant="contained">
            Aggiorna Ordine
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Dettagli Ordine */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Dettagli Ordine {selectedOrdine?.numero}
          <IconButton
            onClick={() => setShowDetails(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedOrdine && (
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Informazioni Cliente
              </Typography>
              <Typography>
                <strong>Nome:</strong> {selectedOrdine.cliente?.nome} {selectedOrdine.cliente?.cognome}
              </Typography>
              <Typography>
                <strong>Ragione Sociale:</strong> {selectedOrdine.cliente?.ragioneSociale}
              </Typography>
              <Typography>
                <strong>Partita IVA:</strong> {selectedOrdine.cliente?.piva}
              </Typography>
              <Typography>
                <strong>Città:</strong> {selectedOrdine.cliente?.citta}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Prodotti
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Varietà</TableCell>
                      <TableCell>Gruppo</TableCell>
                      <TableCell>Prodotto</TableCell>
                      <TableCell>Quantità</TableCell>
                      <TableCell>Prezzo</TableCell>
                      <TableCell>Totale</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrdine.prodotti.map((prodotto, index) => (
                      <TableRow key={index}>
                        <TableCell>{prodotto.varieta}</TableCell>
                        <TableCell>{prodotto.gruppo}</TableCell>
                        <TableCell>{prodotto.prodotto}</TableCell>
                        <TableCell>{prodotto.quantita}</TableCell>
                        <TableCell>{formatCurrency(prodotto.prezzoVendita)}</TableCell>
                        <TableCell>{formatCurrency(prodotto.totale)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box mt={2} textAlign="right">
                <Typography variant="h6">
                  Totale: {formatCurrency(selectedOrdine.totale)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>
            Chiudi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 