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
import ActionToolbar from '../components/ActionToolbar';
import { apiService } from '../lib/apiService';

// Interfacce per JSON Database
interface Varieta {
  id: number;
  nome: string;
  prodotto_id?: number;
  colore_id?: number;
  altezza_id?: number;
  qualita_id?: number;
  provenienza_id?: number;
  imballo?: number;
  created_at: string;
  updated_at: string;
}

interface Prodotto {
  id: number;
  nome: string;
  gruppo_id?: number;
  descrizione?: string;
  created_at: string;
  updated_at: string;
}

interface Colore {
  id: number;
  nome: string;
}

interface Altezza {
  id: number;
  nome: string;
}

interface Qualita {
  id: number;
  nome: string;
}

interface Provenienza {
  id: number;
  nome: string;
}

interface Gruppo {
  id: number;
  nome: string;
  descrizione?: string;
  created_at: string;
  updated_at: string;
}

export default function GestioneVarieta() {
  const [varieta, setVarieta] = useState<Varieta[]>([]);
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [colori, setColori] = useState<Colore[]>([]);
  const [altezze, setAltezze] = useState<Altezza[]>([]);
  const [qualita, setQualita] = useState<Qualita[]>([]);
  const [provenienze, setProvenienze] = useState<Provenienza[]>([]);
  const [gruppi, setGruppi] = useState<Gruppo[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVarieta, setSelectedVarieta] = useState<Varieta | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVarieta, setEditingVarieta] = useState<Varieta | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    prodotto_id: '',
    colore_id: '',
    altezza_id: '',
    qualita_id: '',
    provenienza_id: '',
    imballo: 1
  });

  // Carica dati all'avvio
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Caricamento dati varietà...');
      
      const [varietaData, prodottiData, gruppiData] = await Promise.all([
        apiService.getVarieta(true), // Includi tutte le varietà, anche con giacenza 0
        apiService.getProdotti(true), // Includi tutti i prodotti
        apiService.getGruppi(true) // Includi tutti i gruppi
      ]);
      
      setVarieta(varietaData);
      setProdotti(prodottiData);
      setColori([]); // Non implementato nel JSON
      setAltezze([]); // Non implementato nel JSON
      setQualita([]); // Non implementato nel JSON
      setProvenienze([]); // Non implementato nel JSON
      setGruppi(gruppiData);
      
      setLastUpdate(new Date());
      console.log('✅ Dati varietà caricati:', varietaData.length);
    } catch (err: any) {
      console.error('❌ Errore caricamento varietà:', err);
      setError('Errore nel caricamento delle varietà. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions per JSON Database
  const getNomeById = (id: number, lista: any[]): string => {
    const item = lista.find(item => item.id === id);
    return item?.nome || 'N/A';
  };

  const getProdottoCompleto = (varieta: Varieta) => {
    const prodottoId = varieta.prodotto_id;
    if (!prodottoId) return 'N/A';
    
    const prodotto = prodotti.find(p => p.id === prodottoId);
    if (!prodotto) return 'N/A';
    
    const gruppoId = prodotto.gruppo_id;
    if (!gruppoId) return prodotto.nome;
    
    const gruppo = gruppi.find(g => g.id === gruppoId);
    
    return `${gruppo?.nome || 'N/A'} - ${prodotto.nome}`;
  };

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setLoading(true);
      const data = {
        nome: formData.nome,
        prodotto_id: parseInt(formData.prodotto_id) || undefined,
        colore_id: parseInt(formData.colore_id) || undefined,
        altezza_id: parseInt(formData.altezza_id) || undefined,
        qualita_id: parseInt(formData.qualita_id) || undefined,
        provenienza_id: parseInt(formData.provenienza_id) || undefined
      };

      await apiService.createVarieta(data);

      setSnackbar({ open: true, message: 'Varietà creata con successo!', severity: 'success' });
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('❌ Errore creazione varietà:', err);
      setSnackbar({ open: true, message: 'Errore nella creazione: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingVarieta) return;
    
    try {
      setLoading(true);
      // Per ora, non implementiamo l'aggiornamento (non disponibile nel JSON)
      console.log('⚠️ Aggiornamento varietà non ancora implementato');
      
      setSnackbar({ open: true, message: 'Aggiornamento non ancora implementato', severity: 'success' });
      setShowForm(false);
      setEditingVarieta(null);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('❌ Errore aggiornamento varietà:', err);
      setSnackbar({ open: true, message: 'Errore nell\'aggiornamento: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (varieta: Varieta) => {
    if (!window.confirm(`Eliminare la varietà "${varieta.nome}"?`)) return;
    
    try {
      setLoading(true);
      // Per ora, non implementiamo l'eliminazione (non disponibile nel JSON)
      console.log('⚠️ Eliminazione varietà non ancora implementata');
      
      setSnackbar({ open: true, message: 'Eliminazione non ancora implementata', severity: 'success' });
      loadData();
    } catch (err: any) {
      console.error('❌ Errore eliminazione varietà:', err);
      setSnackbar({ open: true, message: 'Errore nell\'eliminazione: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      prodotto_id: '',
      colore_id: '',
      altezza_id: '',
      qualita_id: '',
      provenienza_id: '',
      imballo: 1
    });
  };

  const openEditForm = (varieta: Varieta) => {
    setEditingVarieta(varieta);
    setFormData({
      nome: varieta.nome,
      prodotto_id: varieta.prodotto_id?.toString() || '',
      colore_id: varieta.colore_id?.toString() || '',
      altezza_id: varieta.altezza_id?.toString() || '',
      qualita_id: varieta.qualita_id?.toString() || '',
      provenienza_id: varieta.provenienza_id?.toString() || '',
      imballo: varieta.imballo || 1
    });
    setShowForm(true);
  };

  const openCreateForm = () => {
    setEditingVarieta(null);
    resetForm();
    setShowForm(true);
  };

  const handleRefresh = () => loadData();
  const handleExport = () => {
    console.log('📊 Export non ancora implementato');
  };
  const handlePrint = () => {
    console.log('🖨️ Print non ancora implementato');
  };

  // Filtraggio
  const filteredVarieta = varieta.filter(v => 
            (v.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (getProdottoCompleto(v) || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const actions = [
    {
      label: 'Nuova',
      icon: <AddIcon />,
      onClick: openCreateForm,
      color: 'primary' as const,
      tooltip: 'Aggiungi nuova varietà'
    },
    {
      label: 'Aggiorna',
      icon: <RefreshIcon />,
      onClick: handleRefresh,
      color: 'info' as const,
      tooltip: 'Aggiorna dati'
    },
    {
      label: 'Esporta',
      icon: <DownloadIcon />,
      onClick: handleExport,
      color: 'success' as const,
      tooltip: 'Esporta dati'
    },
    {
      label: 'Stampa',
      icon: <PrintIcon />,
      onClick: handlePrint,
      color: 'warning' as const,
      tooltip: 'Stampa lista'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Gestione Varietà</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <ActionToolbar actions={actions} sticky />

      {/* Ricerca */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Cerca varietà..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Paper>

      {/* Tabella */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Prodotto</TableCell>
                <TableCell>Imballo</TableCell>
                <TableCell>Data Creazione</TableCell>
                <TableCell align="center">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredVarieta.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">
                      {searchTerm ? 'Nessuna varietà trovata' : 'Nessuna varietà presente'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVarieta.map((varieta) => (
                  <TableRow key={varieta.id} hover>
                    <TableCell>{varieta.id}</TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{varieta.nome}</Typography>
                    </TableCell>
                    <TableCell>{getProdottoCompleto(varieta)}</TableCell>
                    <TableCell>{varieta.imballo || '-'}</TableCell>
                    <TableCell>
                      {new Date(varieta.created_at).toLocaleDateString('it-IT')}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Visualizza dettagli">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setSelectedVarieta(varieta);
                              setShowDetails(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifica">
                          <IconButton 
                            size="small" 
                            onClick={() => openEditForm(varieta)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDelete(varieta)}
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

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingVarieta ? 'Modifica Varietà' : 'Nuova Varietà'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Varietà"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prodotto</InputLabel>
                <Select
                  value={formData.prodotto_id}
                  onChange={(e) => setFormData({ ...formData, prodotto_id: e.target.value })}
                  label="Prodotto"
                >
                  {prodotti.map((prodotto) => (
                    <MenuItem key={prodotto.id} value={prodotto.id}>
                      {prodotto.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Imballo"
                type="number"
                value={formData.imballo}
                onChange={(e) => setFormData({ ...formData, imballo: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Annulla</Button>
          <Button 
            onClick={editingVarieta ? handleUpdate : handleCreate}
            variant="contained"
            disabled={loading}
          >
            {editingVarieta ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dettagli Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Dettagli Varietà
          <IconButton
            onClick={() => setShowDetails(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedVarieta && (
            <Box>
              <Typography variant="h6" gutterBottom>{selectedVarieta.nome}</Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">ID:</Typography>
                  <Typography variant="body1">{selectedVarieta.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Prodotto:</Typography>
                  <Typography variant="body1">{getProdottoCompleto(selectedVarieta)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Imballo:</Typography>
                  <Typography variant="body1">{selectedVarieta.imballo || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Data Creazione:</Typography>
                  <Typography variant="body1">
                    {new Date(selectedVarieta.created_at).toLocaleDateString('it-IT')}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
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