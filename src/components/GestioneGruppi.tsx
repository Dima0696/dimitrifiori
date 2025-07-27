import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, Button, Stack, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider, Snackbar, Tooltip
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
interface Gruppo {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string;
}

interface Prodotto {
  id: string;
  nome: string;
  gruppo_id: string;
}

export default function GestioneGruppi() {
  const [gruppi, setGruppi] = useState<Gruppo[]>([]);
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGruppo, setSelectedGruppo] = useState<Gruppo | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGruppo, setEditingGruppo] = useState<Gruppo | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });

  // Form state
  const [formData, setFormData] = useState({
    nome: ''
  });

  // Carica dati all'avvio
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Caricamento dati gruppi...');
      
      const [gruppiData, prodottiData] = await Promise.all([
        apiService.getGruppi(true), // Includi tutti i gruppi
        apiService.getProdotti(true) // Includi tutti i prodotti
      ]);
      
      setGruppi(gruppiData);
      setProdotti(prodottiData);
      
      setLastUpdate(new Date());
      console.log('✅ Dati gruppi caricati:', gruppiData.length);
    } catch (err: any) {
      console.error('❌ Errore caricamento gruppi:', err);
      setError('Errore nel caricamento dei gruppi. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getProdottiCount = (gruppoId: string): number => {
    return prodotti.filter(p => p.gruppo_id === gruppoId).length;
  };

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setLoading(true);

      await apiService.createGruppo(formData.nome);

      setSnackbar({ open: true, message: 'Gruppo creato con successo!', severity: 'success' });
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('❌ Errore creazione gruppo:', err);
      setSnackbar({ open: true, message: 'Errore nella creazione: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingGruppo) return;
    
    try {
      setLoading(true);
      const data = {
        nome: formData.nome
      };

      await apiService.updateGruppo(editingGruppo.id, data);

      setSnackbar({ open: true, message: 'Gruppo aggiornato con successo!', severity: 'success' });
      setShowForm(false);
      setEditingGruppo(null);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('❌ Errore aggiornamento gruppo:', err);
      setSnackbar({ open: true, message: 'Errore nell\'aggiornamento: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (gruppo: Gruppo) => {
    // Controlla se ci sono prodotti associati
    const prodottiAssociati = getProdottiCount(gruppo.id);
    if (prodottiAssociati > 0) {
      setSnackbar({ 
        open: true, 
        message: `Impossibile eliminare: ci sono ${prodottiAssociati} prodotti associati a questo gruppo`, 
        severity: 'error' 
      });
      return;
    }

    if (!window.confirm(`Sei sicuro di voler eliminare il gruppo "${gruppo.nome}"?`)) return;
    
    try {
      setLoading(true);
      await apiService.deleteGruppo(gruppo.id);

      setSnackbar({ open: true, message: 'Gruppo eliminato con successo!', severity: 'success' });
      loadData();
    } catch (err: any) {
      console.error('❌ Errore eliminazione gruppo:', err);
      setSnackbar({ open: true, message: 'Errore nell\'eliminazione: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: ''
    });
  };

  const openEditForm = (gruppo: Gruppo) => {
    setEditingGruppo(gruppo);
    setFormData({
      nome: gruppo.nome
    });
    setShowForm(true);
  };

  const openCreateForm = () => {
    setEditingGruppo(null);
    resetForm();
    setShowForm(true);
  };

  // Filter and sort
  const filteredGruppi = gruppi.filter(g => 
            (g.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
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
  if (loading && gruppi.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
          Caricamento gruppi...
        </Typography>
      </Box>
    );
  }

  if (error && gruppi.length === 0) {
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
      <Typography variant="h4" gutterBottom>Gestione Gruppi</Typography>
      
      {/* Widget Dashboard */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #e3f0ff 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Totale Gruppi</Typography>
          <Typography variant="h5" fontWeight={700}>{gruppi.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #ffe3ec 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Prodotti</Typography>
          <Typography variant="h5" fontWeight={700}>{prodotti.length}</Typography>
        </Paper>
      </Box>

      {/* ActionToolbar */}
      <ActionToolbar 
        actions={[
          {
            label: 'Nuovo Gruppo',
            icon: <AddIcon />,
            color: 'success' as const,
            onClick: openCreateForm,
            tooltip: 'Crea un nuovo gruppo'
          },
          {
            label: 'Aggiorna',
            icon: <RefreshIcon />,
            color: 'primary' as const,
            onClick: handleRefresh,
            tooltip: 'Aggiorna la lista gruppi',
            active: loading
          },
          {
            label: 'Esporta',
            icon: <DownloadIcon />,
            color: 'primary' as const,
            onClick: handleExport,
            tooltip: 'Esporta i gruppi in Excel'
          },
          {
            label: 'Stampa',
            icon: <PrintIcon />,
            color: 'warning' as const,
            onClick: handlePrint,
            tooltip: 'Stampa la lista gruppi'
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
          Lista Gruppi
          {lastUpdate && (
            <span style={{ marginLeft: 16, color: '#888', fontSize: 13 }}>
              Ultimo aggiornamento: {lastUpdate.toLocaleString('it-IT')}
            </span>
          )}
        </Typography>
        
        <TextField
          size="small"
          placeholder="Cerca gruppo..."
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
              <TableCell sx={{ fontWeight: 700 }}>Gruppo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Prodotti</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Data Creazione</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGruppi.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm ? 'Nessun gruppo trovato per la ricerca' : 'Nessun gruppo disponibile'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredGruppi.map((g) => (
                <TableRow key={g.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {g.nome}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getProdottiCount(g.id)} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(g.created_at).toLocaleDateString('it-IT')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Visualizza dettagli">
                        <IconButton 
                          size="small" 
                          onClick={() => { setSelectedGruppo(g); setShowDetails(true); }}
                          color="info"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifica">
                        <IconButton 
                          size="small" 
                          onClick={() => openEditForm(g)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Elimina">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(g)}
                          color="error"
                          disabled={getProdottiCount(g.id) > 0}
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
            <Typography variant="h6">Dettagli Gruppo</Typography>
            <IconButton onClick={() => setShowDetails(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedGruppo && (
            <Box>
              <Typography variant="h6" color="primary" gutterBottom>{selectedGruppo.nome}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary">Prodotti Associati</Typography>
              <Typography variant="body1">{getProdottiCount(selectedGruppo.id)}</Typography>
              <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary">Data creazione</Typography>
              <Typography variant="body2">{new Date(selectedGruppo.created_at).toLocaleString('it-IT')}</Typography>
            </Box>
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
              {editingGruppo ? 'Modifica Gruppo' : 'Nuovo Gruppo'}
            </Typography>
            <IconButton onClick={() => setShowForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome Gruppo"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Annulla</Button>
          <Button 
            onClick={editingGruppo ? handleUpdate : handleCreate}
            variant="contained"
            disabled={loading || !formData.nome}
          >
            {loading ? <CircularProgress size={20} /> : (editingGruppo ? 'Aggiorna' : 'Crea')}
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