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
  FormGroup,
  Collapse
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
  LocalShipping as ShippingIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { apiService } from '../../lib/apiService';

interface SpesaTrasporto {
  id: number;
  descrizione: string;
  destinatario?: string;
  fornitore_id?: number;
  fornitore_nome?: string;
  importo: number;
  data_spesa: string;
  tipo_trasporto: 'corriere' | 'autotrasporto' | 'ferrovia' | 'aereo' | 'altro';
  numero_documento?: string;
  note?: string;
  pagato: boolean;
  data_pagamento?: string;
  metodo_pagamento?: string;
  note_pagamento?: string;
  data_creazione: string;
  data_modifica?: string;
  stato_descrizione: string;
}

interface Fornitore {
  id: number;
  nome: string;
  ragione_sociale: string;
}

const GestioneSpeseTrasportoComplete: React.FC = () => {
  // Stati principali
  const [spese, setSpese] = useState<SpesaTrasporto[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Stati per dialogs
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [editingSpesa, setEditingSpesa] = useState<SpesaTrasporto | null>(null);
  const [viewingSpesa, setViewingSpesa] = useState<SpesaTrasporto | null>(null);

  // Stati per filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterTipoTrasporto, setFilterTipoTrasporto] = useState('');
  const [filterStatoPagamento, setFilterStatoPagamento] = useState('');
  const [filterFornitore, setFilterFornitore] = useState('');
  const [filterDataDa, setFilterDataDa] = useState('');
  const [filterDataA, setFilterDataA] = useState('');

  // Stati per paginazione
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Stati per form
  const [formData, setFormData] = useState({
    descrizione: '',
    destinatario: '',
    fornitore_id: '',
    importo: '',
    data_spesa: new Date().toISOString().split('T')[0],
    tipo_trasporto: 'corriere' as const,
    numero_documento: '',
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
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [speseData, fornitoriData] = await Promise.all([
        apiService.getSpeseTrasporto(),
        apiService.getFornitori()
      ]);
      setSpese(speseData);
      setFornitori(fornitoriData);
    } catch (error) {
      console.error('❌ Errore nel caricamento dati:', error);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  // Filtra e cerca spese
  const filteredSpese = spese.filter((spesa) => {
    const matchSearch = !searchTerm || 
      spesa.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spesa.destinatario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spesa.fornitore_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spesa.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTipo = !filterTipoTrasporto || spesa.tipo_trasporto === filterTipoTrasporto;
    const matchStato = !filterStatoPagamento || 
      (filterStatoPagamento === 'pagato' && spesa.pagato) ||
      (filterStatoPagamento === 'non_pagato' && !spesa.pagato);
    const matchFornitore = !filterFornitore || spesa.fornitore_id?.toString() === filterFornitore;
    
    const matchData = (!filterDataDa || spesa.data_spesa >= filterDataDa) &&
                     (!filterDataA || spesa.data_spesa <= filterDataA);

    return matchSearch && matchTipo && matchStato && matchFornitore && matchData;
  });

  // Paginazione
  const paginatedSpese = filteredSpese.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Reset form
  const resetForm = () => {
    setFormData({
      descrizione: '',
      destinatario: '',
      fornitore_id: '',
      importo: '',
      data_spesa: new Date().toISOString().split('T')[0],
      tipo_trasporto: 'corriere',
      numero_documento: '',
      note: ''
    });
    setEditingSpesa(null);
  };

  // Apri dialog per creazione
  const handleCreate = () => {
    resetForm();
    setOpenDialog(true);
  };

  // Apri dialog per modifica
  const handleEdit = (spesa: SpesaTrasporto) => {
    setFormData({
      descrizione: spesa.descrizione,
      destinatario: spesa.destinatario || '',
      fornitore_id: spesa.fornitore_id?.toString() || '',
      importo: spesa.importo.toString(),
      data_spesa: spesa.data_spesa,
      tipo_trasporto: spesa.tipo_trasporto,
      numero_documento: spesa.numero_documento || '',
      note: spesa.note || ''
    });
    setEditingSpesa(spesa);
    setOpenDialog(true);
  };

  // Visualizza dettagli
  const handleView = (spesa: SpesaTrasporto) => {
    setViewingSpesa(spesa);
    setOpenViewDialog(true);
  };

  // Apri dialog pagamento
  const handlePayment = (spesa: SpesaTrasporto) => {
    setPaymentData({
      pagato: spesa.pagato,
      data_pagamento: spesa.data_pagamento || new Date().toISOString().split('T')[0],
      metodo_pagamento: spesa.metodo_pagamento || '',
      note_pagamento: spesa.note_pagamento || ''
    });
    setEditingSpesa(spesa);
    setOpenPaymentDialog(true);
  };

  // Salva spesa (crea o modifica)
  const handleSave = async () => {
    try {
      if (!formData.descrizione || !formData.importo) {
        setError('Descrizione e importo sono obbligatori');
        return;
      }

      const spesaData = {
        ...formData,
        importo: parseFloat(formData.importo),
        fornitore_id: formData.fornitore_id ? parseInt(formData.fornitore_id) : undefined
      };

      if (editingSpesa) {
        await apiService.updateSpesaTrasporto(editingSpesa.id, spesaData);
        setSuccess('Spesa trasporto aggiornata con successo');
      } else {
        await apiService.createSpesaTrasporto(spesaData);
        setSuccess('Spesa trasporto creata con successo');
      }

      await loadData();
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error('❌ Errore nel salvataggio:', error);
      setError('Errore nel salvataggio della spesa trasporto');
    }
  };

  // Elimina spesa
  const handleDelete = async (spesa: SpesaTrasporto) => {
    if (!window.confirm(`Eliminare la spesa trasporto "${spesa.descrizione}"?`)) {
      return;
    }

    try {
      await apiService.deleteSpesaTrasporto(spesa.id);
      setSuccess('Spesa trasporto eliminata con successo');
      await loadData();
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione:', error);
      setError('Errore nell\'eliminazione della spesa trasporto');
    }
  };

  // Aggiorna pagamento
  const handleSavePayment = async () => {
    if (!editingSpesa) return;

    try {
      await apiService.aggiornaStatoPagamentoSpesaTrasporto(editingSpesa.id, paymentData);
      setSuccess(`Spesa trasporto ${paymentData.pagato ? 'marcata come pagata' : 'marcata come non pagata'}`);
      await loadData();
      setOpenPaymentDialog(false);
      setEditingSpesa(null);
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento pagamento:', error);
      setError('Errore nell\'aggiornamento del pagamento');
    }
  };

  // Reset filtri
  const resetFilters = () => {
    setSearchTerm('');
    setFilterTipoTrasporto('');
    setFilterStatoPagamento('');
    setFilterFornitore('');
    setFilterDataDa('');
    setFilterDataA('');
    setPage(0);
  };

  // Calcoli statistiche
  const totalSpese = filteredSpese.reduce((sum, spesa) => sum + spesa.importo, 0);
  const totalPagato = filteredSpese.filter(s => s.pagato).reduce((sum, spesa) => sum + spesa.importo, 0);
  const totalDaPagare = totalSpese - totalPagato;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Caricamento spese trasporto...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header con statistiche */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            <ShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Gestione Spese Trasporto
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Totale: €{totalSpese.toFixed(2)} | Pagato: €{totalPagato.toFixed(2)} | Da Pagare: €{totalDaPagare.toFixed(2)}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ minWidth: 200 }}
        >
          Nuova Spesa Trasporto
        </Button>
      </Box>

      {/* Barra di ricerca e filtri */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Cerca per descrizione, destinatario, fornitore..."
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
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo Trasporto</InputLabel>
                  <Select
                    value={filterTipoTrasporto}
                    onChange={(e) => setFilterTipoTrasporto(e.target.value)}
                    label="Tipo Trasporto"
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="corriere">Corriere</MenuItem>
                    <MenuItem value="autotrasporto">Autotrasporto</MenuItem>
                    <MenuItem value="ferrovia">Ferrovia</MenuItem>
                    <MenuItem value="aereo">Aereo</MenuItem>
                    <MenuItem value="altro">Altro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stato Pagamento</InputLabel>
                  <Select
                    value={filterStatoPagamento}
                    onChange={(e) => setFilterStatoPagamento(e.target.value)}
                    label="Stato Pagamento"
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="pagato">Pagato</MenuItem>
                    <MenuItem value="non_pagato">Da Pagare</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Fornitore</InputLabel>
                  <Select
                    value={filterFornitore}
                    onChange={(e) => setFilterFornitore(e.target.value)}
                    label="Fornitore"
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    {fornitori.map((fornitore) => (
                      <MenuItem key={fornitore.id} value={fornitore.id.toString()}>
                        {fornitore.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={resetFilters}
                  size="small"
                >
                  Reset Filtri
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Data Da"
                  type="date"
                  value={filterDataDa}
                  onChange={(e) => setFilterDataDa(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Data A"
                  type="date"
                  value={filterDataA}
                  onChange={(e) => setFilterDataA(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Tabella spese trasporto */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Descrizione</TableCell>
              <TableCell>Destinatario/Fornitore</TableCell>
              <TableCell>Tipo Trasporto</TableCell>
              <TableCell align="right">Importo</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell align="center">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSpese.map((spesa) => (
              <TableRow key={spesa.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {spesa.descrizione}
                  </Typography>
                  {spesa.numero_documento && (
                    <Typography variant="caption" color="text.secondary">
                      Doc: {spesa.numero_documento}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {spesa.fornitore_nome || spesa.destinatario || 'Non specificato'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={spesa.tipo_trasporto}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="medium">
                    €{spesa.importo.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {new Date(spesa.data_spesa).toLocaleDateString('it-IT')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={spesa.stato_descrizione}
                    color={spesa.pagato ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Visualizza">
                    <IconButton size="small" onClick={() => handleView(spesa)}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Modifica">
                    <IconButton size="small" onClick={() => handleEdit(spesa)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Gestisci Pagamento">
                    <IconButton 
                      size="small" 
                      onClick={() => handlePayment(spesa)}
                      color={spesa.pagato ? 'success' : 'warning'}
                    >
                      <PaymentIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(spesa)}
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
          count={filteredSpese.length}
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
          {editingSpesa ? 'Modifica Spesa Trasporto' : 'Nuova Spesa Trasporto'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrizione *"
                value={formData.descrizione}
                onChange={(e) => setFormData({...formData, descrizione: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Destinatario"
                value={formData.destinatario}
                onChange={(e) => setFormData({...formData, destinatario: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Fornitore (Opzionale)</InputLabel>
                <Select
                  value={formData.fornitore_id}
                  onChange={(e) => setFormData({...formData, fornitore_id: e.target.value})}
                  label="Fornitore (Opzionale)"
                >
                  <MenuItem value="">Nessun fornitore</MenuItem>
                  {fornitori.map((fornitore) => (
                    <MenuItem key={fornitore.id} value={fornitore.id.toString()}>
                      {fornitore.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Importo *"
                type="number"
                value={formData.importo}
                onChange={(e) => setFormData({...formData, importo: e.target.value})}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data Spesa"
                type="date"
                value={formData.data_spesa}
                onChange={(e) => setFormData({...formData, data_spesa: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo Trasporto</InputLabel>
                <Select
                  value={formData.tipo_trasporto}
                  onChange={(e) => setFormData({...formData, tipo_trasporto: e.target.value as any})}
                  label="Tipo Trasporto"
                >
                  <MenuItem value="corriere">Corriere</MenuItem>
                  <MenuItem value="autotrasporto">Autotrasporto</MenuItem>
                  <MenuItem value="ferrovia">Ferrovia</MenuItem>
                  <MenuItem value="aereo">Aereo</MenuItem>
                  <MenuItem value="altro">Altro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Numero Documento"
                value={formData.numero_documento}
                onChange={(e) => setFormData({...formData, numero_documento: e.target.value})}
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annulla</Button>
          <Button onClick={handleSave} variant="contained">
            {editingSpesa ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Visualizzazione */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Dettagli Spesa Trasporto</DialogTitle>
        <DialogContent>
          {viewingSpesa && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">{viewingSpesa.descrizione}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Destinatario</Typography>
                <Typography>{viewingSpesa.destinatario || viewingSpesa.fornitore_nome || 'Non specificato'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Tipo Trasporto</Typography>
                <Typography>{viewingSpesa.tipo_trasporto}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Importo</Typography>
                <Typography variant="h6" color="primary">€{viewingSpesa.importo.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Data Spesa</Typography>
                <Typography>{new Date(viewingSpesa.data_spesa).toLocaleDateString('it-IT')}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Numero Documento</Typography>
                <Typography>{viewingSpesa.numero_documento || 'Non specificato'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Stato Pagamento</Typography>
                <Chip
                  label={viewingSpesa.stato_descrizione}
                  color={viewingSpesa.pagato ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>
              {viewingSpesa.pagato && (
                <>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Data Pagamento</Typography>
                    <Typography>
                      {viewingSpesa.data_pagamento ? 
                        new Date(viewingSpesa.data_pagamento).toLocaleDateString('it-IT') : 
                        'Non specificata'
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Metodo Pagamento</Typography>
                    <Typography>{viewingSpesa.metodo_pagamento || 'Non specificato'}</Typography>
                  </Grid>
                </>
              )}
              {viewingSpesa.note && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Note</Typography>
                  <Typography>{viewingSpesa.note}</Typography>
                </Grid>
              )}
              {viewingSpesa.note_pagamento && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Note Pagamento</Typography>
                  <Typography>{viewingSpesa.note_pagamento}</Typography>
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
                label="Spesa Pagata"
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
                      <MenuItem value="contanti">Contanti</MenuItem>
                      <MenuItem value="bonifico">Bonifico</MenuItem>
                      <MenuItem value="carta">Carta</MenuItem>
                      <MenuItem value="assegno">Assegno</MenuItem>
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

export default GestioneSpeseTrasportoComplete; 