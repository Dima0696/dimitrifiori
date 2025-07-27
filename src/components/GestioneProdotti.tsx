import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, Button, Stack, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import ActionToolbar from './ActionToolbar';
import { apiService } from '../lib/apiService';

// Interfacce
interface Prodotto {
  id: string;
  nome: string;
  gruppo_id: string;
  created_at: string;
  updated_at: string;
}

interface Gruppo {
  id: string;
  nome: string;
}

interface Varieta {
  id: string;
  nome: string;
  prodotto_id: string;
}

export default function GestioneProdotti() {
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [gruppi, setGruppi] = useState<Gruppo[]>([]);
  const [varieta, setVarieta] = useState<Varieta[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProdotto, setSelectedProdotto] = useState<Prodotto | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProdotto, setEditingProdotto] = useState<Prodotto | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    gruppo_id: ''
  });

  // Carica dati all'avvio
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Caricamento dati prodotti...');
      
      const [prodottiData, gruppiData, varietaData] = await Promise.all([
        apiService.getProdotti(true), // Includi tutti i prodotti
        apiService.getGruppi(true), // Includi tutti i gruppi
        apiService.getVarieta(true) // Includi tutte le varietà
      ]);
      
      setProdotti(prodottiData);
      setGruppi(gruppiData);
      setVarieta(varietaData);
      
      setLastUpdate(new Date());
      console.log('✅ Dati prodotti caricati:', prodottiData.length);
    } catch (err: any) {
      console.error('❌ Errore caricamento prodotti:', err);
      setError('Errore nel caricamento dei prodotti. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getNomeById = (id: string, lista: any[]): string => {
    const item = lista.find(item => item.id === id);
    return item?.nome || 'N/A';
  };

  const getVarietaCount = (prodottoId: string): number => {
    return varieta.filter(v => v.prodotto_id === prodottoId).length;
  };

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setLoading(true);
      const data = {
        nome: formData.nome,
        gruppo_id: formData.gruppo_id
      };

      await apiService.createProdotto(data);

      setSnackbar({ open: true, message: 'Prodotto creato con successo!', severity: 'success' });
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('❌ Errore creazione prodotto:', err);
      setSnackbar({ open: true, message: 'Errore nella creazione: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingProdotto) return;
    
    try {
      setLoading(true);
      const data = {
        nome: formData.nome,
        gruppo_id: formData.gruppo_id
      };

      await apiService.updateProdotto(editingProdotto.id, data);

      setSnackbar({ open: true, message: 'Prodotto aggiornato con successo!', severity: 'success' });
      setShowForm(false);
      setEditingProdotto(null);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('❌ Errore aggiornamento prodotto:', err);
      setSnackbar({ open: true, message: 'Errore nell\'aggiornamento: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (prodotto: Prodotto) => {
    // Controlla se ci sono varietà associate
    const varietaAssociate = getVarietaCount(prodotto.id);
    if (varietaAssociate > 0) {
      setSnackbar({ 
        open: true, 
        message: `Impossibile eliminare: ci sono ${varietaAssociate} varietà associate a questo prodotto`, 
        severity: 'error' 
      });
      return;
    }

    if (!window.confirm(`Sei sicuro di voler eliminare il prodotto "${prodotto.nome}"?`)) return;
    
    try {
      setLoading(true);
      await apiService.deleteProdotto(prodotto.id);

      setSnackbar({ open: true, message: 'Prodotto eliminato con successo!', severity: 'success' });
      loadData();
    } catch (err: any) {
      console.error('❌ Errore eliminazione prodotto:', err);
      setSnackbar({ open: true, message: 'Errore nell\'eliminazione: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      gruppo_id: ''
    });
  };

  const openEditForm = (prodotto: Prodotto) => {
    setEditingProdotto(prodotto);
    setFormData({
      nome: prodotto.nome,
      gruppo_id: prodotto.gruppo_id
    });
    setShowForm(true);
  };

  const openCreateForm = () => {
    setEditingProdotto(null);
    resetForm();
    setShowForm(true);
  };

  // Filter and sort
  const filteredProdotti = prodotti.filter(p => 
            (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (getNomeById(p.gruppo_id, gruppi) || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Action handlers
  const handleRefresh = () => loadData();
  const handleExport = () => {
    setSnackbar({ open: true, message: 'Esportazione in sviluppo...', severity: 'success' });
  };
  const handlePrint = () => {
    window.print();
  };

  // Stati di rendering
  if (loading && prodotti.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
          Caricamento prodotti...
        </Typography>
      </Box>
    );
  }

  if (error && prodotti.length === 0) {
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
      <Typography variant="h4" gutterBottom>Gestione Prodotti</Typography>
      
      {/* Widget Dashboard */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #e3f0ff 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Totale Prodotti</Typography>
          <Typography variant="h5" fontWeight={700}>{prodotti.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #ffe3ec 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Gruppi</Typography>
          <Typography variant="h5" fontWeight={700}>{gruppi.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #e3ffe7 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Varietà</Typography>
          <Typography variant="h5" fontWeight={700}>{varieta.length}</Typography>
        </Paper>
      </Box>

      {/* ActionToolbar */}
      <ActionToolbar 
        actions={[
          {
            label: 'Nuovo Prodotto',
            icon: <AddIcon />,
            color: 'success' as const,
            onClick: openCreateForm,
            tooltip: 'Crea un nuovo prodotto'
          },
          {
            label: 'Aggiorna',
            icon: <RefreshIcon />,
            color: 'primary' as const,
            onClick: handleRefresh,
            tooltip: 'Aggiorna la lista prodotti',
            active: loading
          },
          {
            label: 'Esporta',
            icon: <DownloadIcon />,
            color: 'primary' as const,
            onClick: handleExport,
            tooltip: 'Esporta i prodotti in Excel'
          },
          {
            label: 'Stampa',
            icon: <PrintIcon />,
            color: 'warning' as const,
            onClick: handlePrint,
            tooltip: 'Stampa la lista prodotti'
          }
        ]} 
        sticky 
      />

      {/* Header con ricerca */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>
          Lista Prodotti
          {lastUpdate && (
            <span style={{ marginLeft: 16, color: '#888', fontSize: 13 }}>
              Ultimo aggiornamento: {lastUpdate.toLocaleString('it-IT')}
            </span>
          )}
        </Typography>
        
        <TextField
          size="small"
          placeholder="Cerca prodotto, gruppo..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
      </Box>

      {/* Tabella */}
      <TableContainer sx={{ 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
        borderRadius: 2, 
        overflow: 'auto', 
        backgroundColor: 'white' 
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
              <TableCell sx={{ fontWeight: 700 }}>Prodotto</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Gruppo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Varietà</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Data Creazione</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProdotti.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm ? 'Nessun prodotto trovato per la ricerca' : 'Nessun prodotto disponibile'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProdotti.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {p.nome}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getNomeById(p.gruppo_id, gruppi)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getVarietaCount(p.id)} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(p.created_at).toLocaleDateString('it-IT')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Visualizza dettagli">
                        <IconButton 
                          size="small" 
                          onClick={() => { setSelectedProdotto(p); setShowDetails(true); }}
                          color="info"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifica">
                        <IconButton 
                          size="small" 
                          onClick={() => openEditForm(p)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Elimina">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(p)}
                          color="error"
                          disabled={getVarietaCount(p.id) > 0}
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

      {/* Dialog Dettagli */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Dettagli Prodotto</Typography>
            <IconButton onClick={() => setShowDetails(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedProdotto && (
            <Grid container spacing={2}>
              <Grid sx={{ width: '100%' }}>
                <Typography variant="h6" color="primary">{selectedProdotto.nome}</Typography>
              </Grid>
              <Grid sx={{ width: '50%' }}>
                <Typography variant="subtitle2" color="text.secondary">Gruppo</Typography>
                <Typography variant="body1">{getNomeById(selectedProdotto.gruppo_id, gruppi)}</Typography>
              </Grid>
              <Grid sx={{ width: '50%' }}>
                <Typography variant="subtitle2" color="text.secondary">Varietà Associate</Typography>
                <Typography variant="body1">{getVarietaCount(selectedProdotto.id)}</Typography>
              </Grid>
              <Grid sx={{ width: '100%' }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary">Varietà</Typography>
                <Box sx={{ mt: 1 }}>
                  {varieta
                    .filter(v => v.prodotto_id === selectedProdotto.id)
                    .map(v => (
                      <Chip 
                        key={v.id} 
                        label={v.nome} 
                        size="small" 
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  {getVarietaCount(selectedProdotto.id) === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Nessuna varietà associata
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid sx={{ width: '100%' }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary">Data creazione</Typography>
                <Typography variant="body2">{new Date(selectedProdotto.created_at).toLocaleString('it-IT')}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Form */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingProdotto ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
            </Typography>
            <IconButton onClick={() => setShowForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Nome Prodotto"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </Grid>
            <Grid sx={{ width: '100%' }}>
              <FormControl fullWidth required>
                <InputLabel>Gruppo</InputLabel>
                <Select
                  value={formData.gruppo_id}
                  onChange={(e) => setFormData({ ...formData, gruppo_id: e.target.value })}
                  label="Gruppo"
                >
                  {gruppi.map((gruppo) => (
                    <MenuItem key={gruppo.id} value={gruppo.id}>
                      {gruppo.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Annulla</Button>
          <Button 
            onClick={editingProdotto ? handleUpdate : handleCreate}
            variant="contained"
            disabled={loading || !formData.nome || !formData.gruppo_id}
          >
            {loading ? <CircularProgress size={20} /> : (editingProdotto ? 'Aggiorna' : 'Crea')}
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 