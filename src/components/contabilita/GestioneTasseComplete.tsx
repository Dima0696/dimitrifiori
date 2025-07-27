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
  Divider
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
  AccountBalance as TasseIcon,
  Receipt as ReceiptIcon,
  Percent as PercentIcon,
  Euro as EuroIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { apiService } from '../../lib/apiService';

interface TassaPersonalizzata {
  id: number;
  nome: string;
  descrizione?: string;
  tipo: 'fissa' | 'percentuale';
  valore: number;
  base_calcolo?: number;
  periodo: 'mensile' | 'trimestrale' | 'annuale' | 'unico';
  data_scadenza: string;
  ente?: string;
  note?: string;
  pagato: boolean;
  data_pagamento?: string;
  metodo_pagamento?: string;
  note_pagamento?: string;
  data_creazione: string;
  data_modifica?: string;
  stato_descrizione: string;
  tipo_descrizione: string;
  importo_calcolato?: number;
}

interface StatisticheIVA {
  totale_fatture_acquisto: number;
  totale_fatture_vendita: number;
  iva_acquisti: number;
  iva_vendite: number;
  iva_da_versare: number;
  periodo: string;
}

const GestioneTasseComplete: React.FC = () => {
  // Stati principali
  const [tasse, setTasse] = useState<TassaPersonalizzata[]>([]);
  const [statisticheIVA, setStatisticheIVA] = useState<StatisticheIVA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Stati per dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [editingTassa, setEditingTassa] = useState<TassaPersonalizzata | null>(null);
  const [viewingTassa, setViewingTassa] = useState<TassaPersonalizzata | null>(null);

  // Stati per filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [filterStatoPagamento, setFilterStatoPagamento] = useState('');
  const [filterDataScadenzaDa, setFilterDataScadenzaDa] = useState('');
  const [filterDataScadenzaA, setFilterDataScadenzaA] = useState('');

  // Stati per paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Stati per form
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    tipo: 'fissa' as const,
    valore: '',
    base_calcolo: '',
    periodo: 'mensile' as const,
    data_scadenza: new Date().toISOString().split('T')[0],
    ente: '',
    note: ''
  });

  // Stati per form pagamento
  const [paymentData, setPaymentData] = useState({
    pagato: false,
    data_pagamento: new Date().toISOString().split('T')[0],
    metodo_pagamento: '',
    note_pagamento: ''
  });

  // Carica dati iniziali
  useEffect(() => {
    loadData();
    loadStatisticheIVA();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tasseData = await apiService.getTassePersonalizzate();
      
      // Calcola importo per tasse percentuali
      const tasseConImporti = tasseData.map((tassa: TassaPersonalizzata) => {
        if (tassa.tipo === 'percentuale' && tassa.base_calcolo) {
          return {
            ...tassa,
            importo_calcolato: (tassa.base_calcolo * tassa.valore) / 100
          };
        }
        return {
          ...tassa,
          importo_calcolato: tassa.tipo === 'fissa' ? tassa.valore : 0
        };
      });
      
      setTasse(tasseConImporti);
    } catch (error) {
      console.error('❌ Errore nel caricamento tasse:', error);
      setError('Errore nel caricamento delle tasse');
    } finally {
      setLoading(false);
    }
  };

  const loadStatisticheIVA = async () => {
    try {
      // Carica fatture per calcolare IVA
      const [fattureAcquisto, fattureVendita] = await Promise.all([
        apiService.getFattureAcquisto(),
        apiService.getFattureVendita?.() || []
      ]);

      const currentYear = new Date().getFullYear();
      
      // Filtra fatture dell'anno corrente
      const fattureAcquistoAnno = fattureAcquisto.filter((f: any) => 
        f.data && new Date(f.data).getFullYear() === currentYear
      );
      
      const fattureVenditaAnno = fattureVendita.filter((f: any) => 
        f.data && new Date(f.data).getFullYear() === currentYear
      );

      const totaleAcquisti = fattureAcquistoAnno.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
      const totaleVendite = fattureVenditaAnno.reduce((sum: number, f: any) => sum + (f.totale || 0), 0);
      
      // IVA al 10% come specificato
      const ivaAcquisti = totaleAcquisti * 0.10;
      const ivaVendite = totaleVendite * 0.10;
      const ivaDaVersare = ivaVendite - ivaAcquisti;

      setStatisticheIVA({
        totale_fatture_acquisto: totaleAcquisti,
        totale_fatture_vendita: totaleVendite,
        iva_acquisti: ivaAcquisti,
        iva_vendite: ivaVendite,
        iva_da_versare: ivaDaVersare,
        periodo: currentYear.toString()
      });
    } catch (error) {
      console.error('❌ Errore nel caricamento statistiche IVA:', error);
    }
  };

  // Filtra e cerca tasse
  const filteredTasse = tasse.filter((tassa) => {
    const matchSearch = !searchTerm || 
      tassa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tassa.descrizione?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tassa.ente?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTipo = !filterTipo || tassa.tipo === filterTipo;
    const matchPeriodo = !filterPeriodo || tassa.periodo === filterPeriodo;
    const matchStato = !filterStatoPagamento || 
      (filterStatoPagamento === 'pagato' && tassa.pagato) ||
      (filterStatoPagamento === 'non_pagato' && !tassa.pagato);
    
    const matchScadenza = (!filterDataScadenzaDa || tassa.data_scadenza >= filterDataScadenzaDa) &&
                         (!filterDataScadenzaA || tassa.data_scadenza <= filterDataScadenzaA);

    return matchSearch && matchTipo && matchPeriodo && matchStato && matchScadenza;
  });

  // Paginazione
  const paginatedTasse = filteredTasse.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      nome: '',
      descrizione: '',
      tipo: 'fissa',
      valore: '',
      base_calcolo: '',
      periodo: 'mensile',
      data_scadenza: new Date().toISOString().split('T')[0],
      ente: '',
      note: ''
    });
    setEditingTassa(null);
  };

  // Apri dialog per creazione
  const handleCreate = () => {
    resetForm();
    setOpenDialog(true);
  };

  // Apri dialog per modifica
  const handleEdit = (tassa: TassaPersonalizzata) => {
    setFormData({
      nome: tassa.nome,
      descrizione: tassa.descrizione || '',
      tipo: tassa.tipo,
      valore: tassa.valore.toString(),
      base_calcolo: tassa.base_calcolo?.toString() || '',
      periodo: tassa.periodo,
      data_scadenza: tassa.data_scadenza,
      ente: tassa.ente || '',
      note: tassa.note || ''
    });
    setEditingTassa(tassa);
    setOpenDialog(true);
  };

  // Visualizza dettagli
  const handleView = (tassa: TassaPersonalizzata) => {
    setViewingTassa(tassa);
    setOpenViewDialog(true);
  };

  // Apri dialog pagamento
  const handlePayment = (tassa: TassaPersonalizzata) => {
    setPaymentData({
      pagato: tassa.pagato,
      data_pagamento: tassa.data_pagamento || new Date().toISOString().split('T')[0],
      metodo_pagamento: tassa.metodo_pagamento || '',
      note_pagamento: tassa.note_pagamento || ''
    });
    setEditingTassa(tassa);
    setOpenPaymentDialog(true);
  };

  // Salva tassa (crea o modifica)
  const handleSave = async () => {
    try {
      if (!formData.nome || !formData.valore) {
        setError('Nome e valore sono obbligatori');
        return;
      }

      const tassaData = {
        ...formData,
        valore: parseFloat(formData.valore),
        base_calcolo: formData.base_calcolo ? parseFloat(formData.base_calcolo) : undefined
      };

      if (editingTassa) {
        await apiService.updateTassaPersonalizzata(editingTassa.id, tassaData);
        setSuccess('Tassa aggiornata con successo');
      } else {
        await apiService.createTassaPersonalizzata(tassaData);
        setSuccess('Tassa creata con successo');
      }

      await loadData();
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error('❌ Errore nel salvataggio:', error);
      setError('Errore nel salvataggio della tassa');
    }
  };

  // Elimina tassa
  const handleDelete = async (tassa: TassaPersonalizzata) => {
    if (!window.confirm(`Eliminare la tassa "${tassa.nome}"?`)) {
      return;
    }

    try {
      await apiService.deleteTassaPersonalizzata(tassa.id);
      setSuccess('Tassa eliminata con successo');
      await loadData();
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione:', error);
      setError('Errore nell\'eliminazione della tassa');
    }
  };

  // Aggiorna pagamento
  const handleSavePayment = async () => {
    if (!editingTassa) return;

    try {
      await apiService.aggiornaStatoPagamentoTassaPersonalizzata(editingTassa.id, paymentData);
      setSuccess(`Tassa ${paymentData.pagato ? 'marcata come pagata' : 'marcata come non pagata'}`);
      await loadData();
      setOpenPaymentDialog(false);
      setEditingTassa(null);
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento pagamento:', error);
      setError('Errore nell\'aggiornamento del pagamento');
    }
  };

  // Reset filtri
  const resetFilters = () => {
    setSearchTerm('');
    setFilterTipo('');
    setFilterPeriodo('');
    setFilterStatoPagamento('');
    setFilterDataScadenzaDa('');
    setFilterDataScadenzaA('');
    setPage(0);
  };

  // Calcoli statistiche
  const totalTasse = filteredTasse.reduce((sum, tassa) => sum + (tassa.importo_calcolato || 0), 0);
  const totalPagato = filteredTasse.filter(t => t.pagato).reduce((sum, tassa) => sum + (tassa.importo_calcolato || 0), 0);
  const totalDaPagare = totalTasse - totalPagato;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Caricamento gestione tasse...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con statistiche */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            <TasseIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Gestione Tasse
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Totale Tasse: €{totalTasse.toFixed(2)} | Pagato: €{totalPagato.toFixed(2)} | Da Pagare: €{totalDaPagare.toFixed(2)}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ minWidth: 200 }}
        >
          Nuova Tassa
        </Button>
      </Box>

      {/* Pannello IVA Automatica */}
      {statisticheIVA && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Calcolo IVA Automatico - Anno {statisticheIVA.periodo}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Stack alignItems="center" spacing={1}>
                    <ReceiptIcon color="primary" />
                    <Typography variant="caption" fontWeight={600}>
                      FATTURE ACQUISTO
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      €{statisticheIVA.totale_fatture_acquisto.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      IVA 10%: €{statisticheIVA.iva_acquisti.toFixed(2)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Stack alignItems="center" spacing={1}>
                    <EuroIcon color="success" />
                    <Typography variant="caption" fontWeight={600}>
                      FATTURE VENDITA
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      €{statisticheIVA.totale_fatture_vendita.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      IVA 10%: €{statisticheIVA.iva_vendite.toFixed(2)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Stack alignItems="center" spacing={1}>
                    <PercentIcon color={statisticheIVA.iva_da_versare > 0 ? 'warning' : 'info'} />
                    <Typography variant="caption" fontWeight={600}>
                      IVA DA VERSARE
                    </Typography>
                    <Typography 
                      variant="h6" 
                      color={statisticheIVA.iva_da_versare > 0 ? 'warning.main' : 'info.main'}
                    >
                      €{statisticheIVA.iva_da_versare.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {statisticheIVA.iva_da_versare > 0 ? 'Da versare' : 'Credito IVA'}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined" sx={{ border: '2px solid', borderColor: 'warning.main' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Stack alignItems="center" spacing={1}>
                    <TasseIcon color="warning" />
                    <Typography variant="caption" fontWeight={600}>
                      ALIQUOTA IVA
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      10%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Automatico
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Barra di ricerca e filtri */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Cerca per nome, descrizione, ente..."
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
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtri Avanzati
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
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

        {/* Filtri avanzati */}
        <Collapse in={showFilters}>
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    label="Tipo"
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="fissa">Importo Fisso</MenuItem>
                    <MenuItem value="percentuale">Percentuale</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Periodo</InputLabel>
                  <Select
                    value={filterPeriodo}
                    onChange={(e) => setFilterPeriodo(e.target.value)}
                    label="Periodo"
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="mensile">Mensile</MenuItem>
                    <MenuItem value="trimestrale">Trimestrale</MenuItem>
                    <MenuItem value="annuale">Annuale</MenuItem>
                    <MenuItem value="unico">Unico</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stato</InputLabel>
                  <Select
                    value={filterStatoPagamento}
                    onChange={(e) => setFilterStatoPagamento(e.target.value)}
                    label="Stato"
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="pagato">Pagato</MenuItem>
                    <MenuItem value="non_pagato">Da Pagare</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Scadenza Da"
                  type="date"
                  value={filterDataScadenzaDa}
                  onChange={(e) => setFilterDataScadenzaDa(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Scadenza A"
                  type="date"
                  value={filterDataScadenzaA}
                  onChange={(e) => setFilterDataScadenzaA(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={resetFilters}
                  size="small"
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Tabella tasse personalizzate */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome Tassa</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Periodo</TableCell>
              <TableCell align="right">Importo</TableCell>
              <TableCell>Scadenza</TableCell>
              <TableCell>Ente</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTasse.map((tassa) => (
              <TableRow key={tassa.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {tassa.nome}
                  </Typography>
                  {tassa.descrizione && (
                    <Typography variant="caption" color="text.secondary">
                      {tassa.descrizione}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={tassa.tipo_descrizione}
                    size="small"
                    variant="outlined"
                    color={tassa.tipo === 'fissa' ? 'primary' : 'secondary'}
                  />
                  {tassa.tipo === 'percentuale' && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {tassa.valore}% di €{tassa.base_calcolo?.toFixed(2)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={tassa.periodo}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    €{(tassa.importo_calcolato || 0).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(tassa.data_scadenza).toLocaleDateString('it-IT')}
                  </Typography>
                  {new Date(tassa.data_scadenza) < new Date() && !tassa.pagato && (
                    <Chip label="Scaduta" color="error" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  {tassa.ente || 'Non specificato'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={tassa.stato_descrizione}
                    color={tassa.pagato ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Visualizza">
                    <IconButton size="small" onClick={() => handleView(tassa)}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Modifica">
                    <IconButton size="small" onClick={() => handleEdit(tassa)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Gestisci Pagamento">
                    <IconButton 
                      size="small" 
                      onClick={() => handlePayment(tassa)}
                      color={tassa.pagato ? 'success' : 'warning'}
                    >
                      <PaymentIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(tassa)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Paginazione */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTasse.length}
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
      </TableContainer>

      {/* Dialog Creazione/Modifica */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTassa ? 'Modifica Tassa' : 'Nuova Tassa'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Tassa *"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrizione"
                value={formData.descrizione}
                onChange={(e) => setFormData({...formData, descrizione: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo Calcolo</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                  label="Tipo Calcolo"
                >
                  <MenuItem value="fissa">Importo Fisso</MenuItem>
                  <MenuItem value="percentuale">Percentuale</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={formData.tipo === 'fissa' ? 'Importo *' : 'Percentuale *'}
                type="number"
                value={formData.valore}
                onChange={(e) => setFormData({...formData, valore: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {formData.tipo === 'fissa' ? '€' : '%'}
                    </InputAdornment>
                  ),
                }}
                required
              />
            </Grid>
            {formData.tipo === 'percentuale' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Base di Calcolo"
                  type="number"
                  value={formData.base_calcolo}
                  onChange={(e) => setFormData({...formData, base_calcolo: e.target.value})}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  }}
                  helperText="Importo su cui calcolare la percentuale"
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Periodo</InputLabel>
                <Select
                  value={formData.periodo}
                  onChange={(e) => setFormData({...formData, periodo: e.target.value as any})}
                  label="Periodo"
                >
                  <MenuItem value="mensile">Mensile</MenuItem>
                  <MenuItem value="trimestrale">Trimestrale</MenuItem>
                  <MenuItem value="annuale">Annuale</MenuItem>
                  <MenuItem value="unico">Pagamento Unico</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data Scadenza"
                type="date"
                value={formData.data_scadenza}
                onChange={(e) => setFormData({...formData, data_scadenza: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ente"
                value={formData.ente}
                onChange={(e) => setFormData({...formData, ente: e.target.value})}
                placeholder="es. Agenzia delle Entrate, Comune, Regione"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                multiline
                rows={3}
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
              />
            </Grid>
            {formData.tipo === 'percentuale' && formData.valore && formData.base_calcolo && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="primary" fontWeight="medium">
                  Importo Calcolato: €{((parseFloat(formData.base_calcolo) * parseFloat(formData.valore)) / 100).toFixed(2)}
                </Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTassa ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Visualizzazione */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Dettagli Tassa</DialogTitle>
        <DialogContent>
          {viewingTassa && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">{viewingTassa.nome}</Typography>
                {viewingTassa.descrizione && (
                  <Typography variant="body2" color="text.secondary">
                    {viewingTassa.descrizione}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Tipo Calcolo</Typography>
                <Typography>{viewingTassa.tipo_descrizione}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Valore</Typography>
                <Typography>
                  {viewingTassa.tipo === 'fissa' ? 
                    `€${viewingTassa.valore.toFixed(2)}` : 
                    `${viewingTassa.valore}%`
                  }
                </Typography>
              </Grid>
              {viewingTassa.tipo === 'percentuale' && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Base di Calcolo</Typography>
                  <Typography>€{viewingTassa.base_calcolo?.toFixed(2) || '0.00'}</Typography>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Importo Finale</Typography>
                <Typography variant="h6" color="primary">
                  €{(viewingTassa.importo_calcolato || 0).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Periodo</Typography>
                <Typography>{viewingTassa.periodo}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Data Scadenza</Typography>
                <Typography>
                  {new Date(viewingTassa.data_scadenza).toLocaleDateString('it-IT')}
                  {new Date(viewingTassa.data_scadenza) < new Date() && !viewingTassa.pagato && (
                    <Chip label="Scaduta" color="error" size="small" sx={{ ml: 1 }} />
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Ente</Typography>
                <Typography>{viewingTassa.ente || 'Non specificato'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Stato Pagamento</Typography>
                <Chip
                  label={viewingTassa.stato_descrizione}
                  color={viewingTassa.pagato ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>
              {viewingTassa.pagato && (
                <>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Data Pagamento</Typography>
                    <Typography>
                      {viewingTassa.data_pagamento ? 
                        new Date(viewingTassa.data_pagamento).toLocaleDateString('it-IT') : 
                        'Non specificata'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Metodo Pagamento</Typography>
                    <Typography>{viewingTassa.metodo_pagamento || 'Non specificato'}</Typography>
                  </Grid>
                </>
              )}
              {viewingTassa.note && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Note</Typography>
                  <Typography>{viewingTassa.note}</Typography>
                </Grid>
              )}
              {viewingTassa.note_pagamento && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Note Pagamento</Typography>
                  <Typography>{viewingTassa.note_pagamento}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Gestione Pagamento */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gestione Pagamento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={paymentData.pagato}
                    onChange={(e) => setPaymentData({...paymentData, pagato: e.target.checked})}
                  />
                }
                label="Tassa Pagata"
              />
            </Grid>
            {paymentData.pagato && (
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
                      <MenuItem value="f24">F24</MenuItem>
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
                    placeholder="es. Codice tributo, numero F24, riferimenti..."
                  />
                </Grid>
              </>
            )}
          </Grid>
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

export default GestioneTasseComplete; 