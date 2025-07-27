import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Grid,
  Checkbox,
  FormControlLabel,
  Tooltip,
  InputAdornment,
  TablePagination,
  Collapse,
  Card,
  CardContent,
  Stack,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  Business as FornitoreIcon,
  Receipt as FatturaIcon,
  CheckCircle as PagataIcon,
  Warning as ScadutaIcon,
  Schedule as InAttesaIcon,
  AttachMoney as MoneyIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as AddressIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { apiService } from '../../lib/apiService';

interface Fornitore {
  id: number;
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
  attivo: boolean;
  created_at: string;
}

interface FatturaAcquisto {
  id: number;
  fornitore_id: number;
  fornitore_nome?: string;
  numero: string;
  data: string;
  scadenza?: string;
  imponibile: number;
  iva: number;
  totale: number;
  note?: string;
  tipo: 'acquisto';
  stato?: 'emessa' | 'pagata' | 'scaduta';
  data_pagamento?: string;
  metodo_pagamento?: string;
  note_pagamento?: string;
}

interface StatisticheFornitore {
  fornitore: Fornitore;
  totale_fatture: number;
  totale_importo: number;
  fatture_pagate: number;
  fatture_da_pagare: number;
  importo_pagato: number;
  importo_da_pagare: number;
  ultima_fattura?: FatturaAcquisto;
  prossima_scadenza?: FatturaAcquisto;
}

const GestioneFornitoriContabiliComplete: React.FC = () => {
  // Stati principali
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [fatture, setFatture] = useState<FatturaAcquisto[]>([]);
  const [statistiche, setStatistiche] = useState<StatisticheFornitore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Stati per dialogs
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedFornitore, setSelectedFornitore] = useState<StatisticheFornitore | null>(null);
  const [selectedFattura, setSelectedFattura] = useState<FatturaAcquisto | null>(null);

  // Stati per tab
  const [activeTab, setActiveTab] = useState(0);

  // Stati per filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStato, setFilterStato] = useState('');
  const [filterScadenzaDa, setFilterScadenzaDa] = useState('');
  const [filterScadenzaA, setFilterScadenzaA] = useState('');

  // Stati per paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Stati per form pagamento
  const [paymentData, setPaymentData] = useState({
    stato: 'pagata' as const,
    data_pagamento: new Date().toISOString().split('T')[0],
    metodo_pagamento: '',
    note_pagamento: ''
  });

  // Carica dati iniziali
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fornitoriData, fattureData] = await Promise.all([
        apiService.getFornitori(),
        apiService.getFattureAcquisto()
      ]);

      setFornitori(fornitoriData);
      setFatture(fattureData);

      // Calcola statistiche per fornitore
      const stats = fornitoriData.map((fornitore: Fornitore) => {
        const fattureForn = fattureData.filter((f: FatturaAcquisto) => f.fornitore_id === fornitore.id);
        
        const totaleImporto = fattureForn.reduce((sum: number, f: FatturaAcquisto) => sum + f.totale, 0);
        const fatturePagete = fattureForn.filter((f: FatturaAcquisto) => f.stato === 'pagata');
        const fattureDaPagare = fattureForn.filter((f: FatturaAcquisto) => f.stato !== 'pagata');
        const importoPagato = fatturePagete.reduce((sum: number, f: FatturaAcquisto) => sum + f.totale, 0);
        const importoDaPagare = fattureDaPagare.reduce((sum: number, f: FatturaAcquisto) => sum + f.totale, 0);
        
        const ultimaFattura = fattureForn
          .sort((a: FatturaAcquisto, b: FatturaAcquisto) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
        
        const prossimaScadenza = fattureDaPagare
          .filter((f: FatturaAcquisto) => f.scadenza)
          .sort((a: FatturaAcquisto, b: FatturaAcquisto) => new Date(a.scadenza!).getTime() - new Date(b.scadenza!).getTime())[0];

        return {
          fornitore,
          totale_fatture: fattureForn.length,
          totale_importo: totaleImporto,
          fatture_pagate: fatturePagete.length,
          fatture_da_pagare: fattureDaPagare.length,
          importo_pagato: importoPagato,
          importo_da_pagare: importoDaPagare,
          ultima_fattura: ultimaFattura,
          prossima_scadenza: prossimaScadenza
        };
      });

      setStatistiche(stats);
    } catch (error) {
      console.error('❌ Errore nel caricamento dati:', error);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  // Filtra fornitori
  const filteredStatistiche = statistiche.filter((stat) => {
    const matchSearch = !searchTerm || 
      stat.fornitore.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stat.fornitore.ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stat.fornitore.partita_iva?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchSearch;
  });

  // Filtra fatture
  const filteredFatture = fatture.filter((fattura) => {
    const matchSearch = !searchTerm || 
      fattura.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fattura.fornitore_nome?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStato = !filterStato || fattura.stato === filterStato;
    
    const matchScadenza = (!filterScadenzaDa || !fattura.scadenza || fattura.scadenza >= filterScadenzaDa) &&
                         (!filterScadenzaA || !fattura.scadenza || fattura.scadenza <= filterScadenzaA);

    return matchSearch && matchStato && matchScadenza;
  });

  // Paginazione
  const currentData = activeTab === 0 ? filteredStatistiche : filteredFatture;
  const paginatedData = currentData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Visualizza dettagli fornitore
  const handleViewFornitore = (statistica: StatisticheFornitore) => {
    setSelectedFornitore(statistica);
    setOpenViewDialog(true);
  };

  // Apri dialog pagamento fattura
  const handlePaymentFattura = (fattura: FatturaAcquisto) => {
    setPaymentData({
      stato: fattura.stato === 'pagata' ? 'pagata' : 'pagata',
      data_pagamento: fattura.data_pagamento || new Date().toISOString().split('T')[0],
      metodo_pagamento: fattura.metodo_pagamento || '',
      note_pagamento: fattura.note_pagamento || ''
    });
    setSelectedFattura(fattura);
    setOpenPaymentDialog(true);
  };

  // Aggiorna pagamento fattura
  const handleSavePayment = async () => {
    if (!selectedFattura) return;

    try {
      await apiService.aggiornaStatoIncasso(selectedFattura.id, paymentData);
      setSuccess(`Fattura ${paymentData.stato === 'pagata' ? 'marcata come pagata' : 'aggiornata'}`);
      await loadData();
      setOpenPaymentDialog(false);
      setSelectedFattura(null);
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento pagamento:', error);
      setError('Errore nell\'aggiornamento del pagamento');
    }
  };

  // Reset filtri
  const resetFilters = () => {
    setSearchTerm('');
    setFilterStato('');
    setFilterScadenzaDa('');
    setFilterScadenzaA('');
    setPage(0);
  };

  // Determina stato fattura con scadenze
  const getStatoFattura = (fattura: FatturaAcquisto) => {
    if (fattura.stato === 'pagata') return { label: 'Pagata', color: 'success' as const };
    if (fattura.scadenza && new Date(fattura.scadenza) < new Date()) {
      return { label: 'Scaduta', color: 'error' as const };
    }
    return { label: 'Da Pagare', color: 'warning' as const };
  };

  // Calcoli totali
  const totaliGenerali = {
    fornitori_attivi: fornitori.filter(f => f.attivo).length,
    totale_da_pagare: statistiche.reduce((sum, stat) => sum + stat.importo_da_pagare, 0),
    totale_pagato: statistiche.reduce((sum, stat) => sum + stat.importo_pagato, 0),
    fatture_scadute: fatture.filter(f => f.scadenza && new Date(f.scadenza) < new Date() && f.stato !== 'pagata').length
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Caricamento gestione fornitori...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con statistiche */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            <FornitoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Gestione Fornitori Contabili
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fornitori Attivi: {totaliGenerali.fornitori_attivi} | 
            Da Pagare: €{totaliGenerali.totale_da_pagare.toFixed(2)} | 
            Scadute: {totaliGenerali.fatture_scadute}
          </Typography>
        </Box>
      </Box>

      {/* Pannello Statistiche Rapide */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Stack alignItems="center" spacing={1}>
                <FornitoreIcon color="primary" />
                <Typography variant="caption" fontWeight={600}>
                  FORNITORI ATTIVI
                </Typography>
                <Typography variant="h6" color="primary.main">
                  {totaliGenerali.fornitori_attivi}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Stack alignItems="center" spacing={1}>
                <MoneyIcon color="warning" />
                <Typography variant="caption" fontWeight={600}>
                  DA PAGARE
                </Typography>
                <Typography variant="h6" color="warning.main">
                  €{totaliGenerali.totale_da_pagare.toFixed(2)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Stack alignItems="center" spacing={1}>
                <PagataIcon color="success" />
                <Typography variant="caption" fontWeight={600}>
                  PAGATO
                </Typography>
                <Typography variant="h6" color="success.main">
                  €{totaliGenerali.totale_pagato.toFixed(2)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Stack alignItems="center" spacing={1}>
                <ScadutaIcon color="error" />
                <Typography variant="caption" fontWeight={600}>
                  FATTURE SCADUTE
                </Typography>
                <Typography variant="h6" color="error.main">
                  {totaliGenerali.fatture_scadute}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            setPage(0);
          }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Fornitori" />
          <Tab label="Fatture" />
        </Tabs>
      </Paper>

      {/* Barra di ricerca e filtri */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Cerca fornitori o fatture..."
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
          </Grid>
          {activeTab === 1 && (
            <>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filtri
                </Button>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
              </Grid>
            </>
          )}
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => alert('Funzione di export non ancora implementata')}
            >
              Esporta
            </Button>
          </Grid>
        </Grid>

        {/* Filtri avanzati per fatture */}
        {activeTab === 1 && (
          <Collapse in={showFilters}>
            <Box mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Stato Fattura</InputLabel>
                    <Select
                      value={filterStato}
                      onChange={(e) => setFilterStato(e.target.value)}
                      label="Stato Fattura"
                    >
                      <MenuItem value="">Tutte</MenuItem>
                      <MenuItem value="emessa">Da Pagare</MenuItem>
                      <MenuItem value="pagata">Pagata</MenuItem>
                      <MenuItem value="scaduta">Scaduta</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Scadenza Da"
                    type="date"
                    value={filterScadenzaDa}
                    onChange={(e) => setFilterScadenzaDa(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Scadenza A"
                    type="date"
                    value={filterScadenzaA}
                    onChange={(e) => setFilterScadenzaA(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        )}
      </Paper>

      {/* Tabella Fornitori */}
      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fornitore</TableCell>
                <TableCell align="center">Fatture</TableCell>
                <TableCell align="right">Totale Importo</TableCell>
                <TableCell align="right">Da Pagare</TableCell>
                <TableCell>Ultima Fattura</TableCell>
                <TableCell>Prossima Scadenza</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(paginatedData as StatisticheFornitore[]).map((statistica) => (
                <TableRow key={statistica.fornitore.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <FornitoreIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {statistica.fornitore.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {statistica.fornitore.ragione_sociale}
                        </Typography>
                        {statistica.fornitore.partita_iva && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            P.IVA: {statistica.fornitore.partita_iva}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium">
                      {statistica.totale_fatture}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {statistica.fatture_pagate} pagate
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      €{statistica.totale_importo.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      color={statistica.importo_da_pagare > 0 ? 'warning.main' : 'text.secondary'}
                    >
                      €{statistica.importo_da_pagare.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {statistica.ultima_fattura ? (
                      <Box>
                        <Typography variant="body2">
                          {statistica.ultima_fattura.numero}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(statistica.ultima_fattura.data).toLocaleDateString('it-IT')}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nessuna fattura
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {statistica.prossima_scadenza ? (
                      <Box>
                        <Typography variant="body2">
                          {statistica.prossima_scadenza.numero}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(statistica.prossima_scadenza.scadenza!).toLocaleDateString('it-IT')}
                        </Typography>
                        {new Date(statistica.prossima_scadenza.scadenza!) < new Date() && (
                          <Chip label="Scaduta" color="error" size="small" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Nessuna scadenza
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Visualizza Dettagli">
                      <IconButton size="small" onClick={() => handleViewFornitore(statistica)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tabella Fatture */}
      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Numero Fattura</TableCell>
                <TableCell>Fornitore</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Scadenza</TableCell>
                <TableCell align="right">Importo</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(paginatedData as FatturaAcquisto[]).map((fattura) => {
                const stato = getStatoFattura(fattura);
                return (
                  <TableRow key={fattura.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {fattura.numero}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {fattura.fornitore_nome || 'Fornitore non trovato'}
                    </TableCell>
                    <TableCell>
                      {new Date(fattura.data).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell>
                      {fattura.scadenza ? 
                        new Date(fattura.scadenza).toLocaleDateString('it-IT') : 
                        'Non specificata'
                      }
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        €{fattura.totale.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stato.label}
                        color={stato.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Gestisci Pagamento">
                        <IconButton 
                          size="small" 
                          onClick={() => handlePaymentFattura(fattura)}
                          color={fattura.stato === 'pagata' ? 'success' : 'warning'}
                        >
                          <PaymentIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Paginazione */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={currentData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Righe per pagina:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} di ${count !== -1 ? count : `più di ${to}`}`
        }
      />

      {/* Dialog Visualizzazione Fornitore */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Dettagli Fornitore</DialogTitle>
        <DialogContent>
          {selectedFornitore && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Informazioni Fornitore */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedFornitore.fornitore.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedFornitore.fornitore.ragione_sociale}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Contatti</Typography>
                    {selectedFornitore.fornitore.email && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailIcon fontSize="small" />
                        <Typography variant="body2">{selectedFornitore.fornitore.email}</Typography>
                      </Stack>
                    )}
                    {selectedFornitore.fornitore.telefono && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneIcon fontSize="small" />
                        <Typography variant="body2">{selectedFornitore.fornitore.telefono}</Typography>
                      </Stack>
                    )}
                  </Box>
                  
                  {selectedFornitore.fornitore.indirizzo && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Indirizzo</Typography>
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <AddressIcon fontSize="small" />
                        <Typography variant="body2">
                          {selectedFornitore.fornitore.indirizzo}<br />
                          {selectedFornitore.fornitore.cap} {selectedFornitore.fornitore.citta} ({selectedFornitore.fornitore.provincia})
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Dati Fiscali</Typography>
                    {selectedFornitore.fornitore.partita_iva && (
                      <Typography variant="body2">P.IVA: {selectedFornitore.fornitore.partita_iva}</Typography>
                    )}
                    {selectedFornitore.fornitore.codice_fiscale && (
                      <Typography variant="body2">C.F.: {selectedFornitore.fornitore.codice_fiscale}</Typography>
                    )}
                  </Box>
                </Stack>
              </Grid>

              {/* Statistiche */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>Statistiche</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="primary">
                          {selectedFornitore.totale_fatture}
                        </Typography>
                        <Typography variant="caption">Fatture Totali</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="success.main">
                          €{selectedFornitore.importo_pagato.toFixed(2)}
                        </Typography>
                        <Typography variant="caption">Pagato</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="warning.main">
                          €{selectedFornitore.importo_da_pagare.toFixed(2)}
                        </Typography>
                        <Typography variant="caption">Da Pagare</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="primary">
                          €{selectedFornitore.totale_importo.toFixed(2)}
                        </Typography>
                        <Typography variant="caption">Totale</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* Lista Fatture Fornitore */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Fatture</Typography>
                <List>
                  {fatture
                    .filter(f => f.fornitore_id === selectedFornitore.fornitore.id)
                    .map((fattura) => {
                      const stato = getStatoFattura(fattura);
                      return (
                        <ListItem key={fattura.id} divider>
                          <ListItemText
                            primary={fattura.numero}
                            secondary={`${new Date(fattura.data).toLocaleDateString('it-IT')} • €${fattura.totale.toFixed(2)}`}
                          />
                          <Chip
                            label={stato.label}
                            color={stato.color}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setOpenViewDialog(false);
                              handlePaymentFattura(fattura);
                            }}
                            color={fattura.stato === 'pagata' ? 'success' : 'warning'}
                          >
                            <PaymentIcon />
                          </IconButton>
                        </ListItem>
                      );
                    })}
                </List>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Gestione Pagamento */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gestione Pagamento Fattura</DialogTitle>
        <DialogContent>
          {selectedFattura && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Fattura: <strong>{selectedFattura.numero}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Importo: €{selectedFattura.totale.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Stato</InputLabel>
                  <Select
                    value={paymentData.stato}
                    onChange={(e) => setPaymentData({...paymentData, stato: e.target.value as any})}
                    label="Stato"
                  >
                    <MenuItem value="emessa">Da Pagare</MenuItem>
                    <MenuItem value="pagata">Pagata</MenuItem>
                    <MenuItem value="scaduta">Scaduta</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {paymentData.stato === 'pagata' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Data Pagamento"
                      type="date"
                      value={paymentData.data_pagamento}
                      onChange={(e) => setPaymentData({...paymentData, data_pagamento: e.target.value})}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Metodo Pagamento</InputLabel>
                      <Select
                        value={paymentData.metodo_pagamento}
                        onChange={(e) => setPaymentData({...paymentData, metodo_pagamento: e.target.value})}
                        label="Metodo Pagamento"
                      >
                        <MenuItem value="bonifico">Bonifico</MenuItem>
                        <MenuItem value="contanti">Contanti</MenuItem>
                        <MenuItem value="carta">Carta</MenuItem>
                        <MenuItem value="assegno">Assegno</MenuItem>
                        <MenuItem value="compensazione">Compensazione</MenuItem>
                        <MenuItem value="altro">Altro</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Note Pagamento"
                      multiline
                      rows={2}
                      value={paymentData.note_pagamento}
                      onChange={(e) => setPaymentData({...paymentData, note_pagamento: e.target.value})}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Annulla</Button>
          <Button onClick={handleSavePayment} variant="contained">
            Salva
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per messaggi */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GestioneFornitoriContabiliComplete; 