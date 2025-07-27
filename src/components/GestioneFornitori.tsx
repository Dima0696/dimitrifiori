import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, TextField, InputAdornment, Button, Stack, Alert, CircularProgress,
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
import ActionToolbar from '../components/ActionToolbar';
import { apiService } from '../lib/apiService';

// Interfacce
interface Fornitore {
  id: number;
  nome: string;
  ragione_sociale: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  partita_iva?: string;
  codice_fiscale?: string;
  attivo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function GestioneFornitori() {
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFornitore, setSelectedFornitore] = useState<Fornitore | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFornitore, setEditingFornitore] = useState<Fornitore | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false, message: '', severity: 'success'
  });

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    ragione_sociale: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    telefono: '',
    email: '',
    partita_iva: '',
    codice_fiscale: '',
    attivo: true
  });

  // Carica dati all'avvio
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Caricamento dati fornitori...');
      
      const response = await apiService.getFornitori();
      setFornitori(response);
      
      setLastUpdate(new Date());
      console.log('✅ Dati fornitori caricati:', response.length);
    } catch (err: any) {
      console.error('❌ Errore caricamento fornitori:', err);
      setError('Errore nel caricamento dei fornitori. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations
  const handleCreate = async () => {
    try {
      setLoading(true);
      const data = {
        nome: formData.nome,
        ragione_sociale: formData.ragione_sociale,
        indirizzo: formData.indirizzo || undefined,
        citta: formData.citta || undefined,
        cap: formData.cap || undefined,
        provincia: formData.provincia || undefined,
        telefono: formData.telefono || undefined,
        email: formData.email || undefined,
        partita_iva: formData.partita_iva || undefined,
        codice_fiscale: formData.codice_fiscale || undefined,
        attivo: formData.attivo
      };

      await apiService.createFornitore(data);

      setSnackbar({ open: true, message: 'Fornitore creato con successo!', severity: 'success' });
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('❌ Errore creazione fornitore:', err);
      setSnackbar({ open: true, message: 'Errore nella creazione: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingFornitore) return;
    
    try {
      setLoading(true);
      const data = {
        nome: formData.nome,
        ragione_sociale: formData.ragione_sociale,
        indirizzo: formData.indirizzo || undefined,
        citta: formData.citta || undefined,
        cap: formData.cap || undefined,
        provincia: formData.provincia || undefined,
        telefono: formData.telefono || undefined,
        email: formData.email || undefined,
        partita_iva: formData.partita_iva || undefined,
        codice_fiscale: formData.codice_fiscale || undefined,
        attivo: formData.attivo
      };

      await apiService.updateFornitore(editingFornitore.id, data);

      setSnackbar({ open: true, message: 'Fornitore aggiornato con successo!', severity: 'success' });
      setShowForm(false);
      setEditingFornitore(null);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('❌ Errore aggiornamento fornitore:', err);
      setSnackbar({ open: true, message: 'Errore nell\'aggiornamento: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fornitore: Fornitore) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il fornitore "${fornitore.nome}"?`)) return;
    
    try {
      setLoading(true);
      await apiService.deleteFornitore(fornitore.id);

      setSnackbar({ open: true, message: 'Fornitore eliminato con successo!', severity: 'success' });
      loadData();
    } catch (err: any) {
      console.error('❌ Errore eliminazione fornitore:', err);
      setSnackbar({ open: true, message: 'Errore nell\'eliminazione: ' + err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      ragione_sociale: '',
      indirizzo: '',
      citta: '',
      cap: '',
      provincia: '',
      telefono: '',
      email: '',
      partita_iva: '',
      codice_fiscale: '',
      attivo: true
    });
  };

  const openEditForm = (fornitore: Fornitore) => {
    setEditingFornitore(fornitore);
    setFormData({
      nome: fornitore.nome || '',
      ragione_sociale: fornitore.ragione_sociale || '',
      indirizzo: fornitore.indirizzo || '',
      citta: fornitore.citta || '',
      cap: fornitore.cap || '',
      provincia: fornitore.provincia || '',
      telefono: fornitore.telefono || '',
      email: fornitore.email || '',
      partita_iva: fornitore.partita_iva || '',
      codice_fiscale: fornitore.codice_fiscale || '',
      attivo: fornitore.attivo !== false
    });
    setShowForm(true);
  };

  const openCreateForm = () => {
    setEditingFornitore(null);
    resetForm();
    setShowForm(true);
  };

  // Filter and sort
  const filteredFornitori = fornitori.filter(f => 
    (f.nome && f.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (f.ragione_sociale && f.ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (f.email && f.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (f.partita_iva && f.partita_iva.toLowerCase().includes(searchTerm.toLowerCase()))
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
  if (loading && fornitori.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
          Caricamento fornitori...
        </Typography>
      </Box>
    );
  }

  if (error && fornitori.length === 0) {
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
      <Typography variant="h4" gutterBottom>Gestione Fornitori</Typography>
      
      {/* Widget Dashboard */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #e3f0ff 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Totale Fornitori</Typography>
          <Typography variant="h5" fontWeight={700}>{fornitori.length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #ffe3ec 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Con Email</Typography>
          <Typography variant="h5" fontWeight={700}>{fornitori.filter(f => f.email).length}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(135deg, #e3ffe7 0%, #f7f8fa 100%)' }}>
          <Typography variant="h6" color="primary">Con P.IVA</Typography>
          <Typography variant="h5" fontWeight={700}>{fornitori.filter(f => f.partita_iva).length}</Typography>
        </Paper>
      </Box>

      {/* ActionToolbar */}
      <ActionToolbar 
        actions={[
          {
            label: 'Nuovo Fornitore',
            icon: <AddIcon />,
            color: 'success' as const,
            onClick: openCreateForm,
            tooltip: 'Crea un nuovo fornitore'
          },
          {
            label: 'Aggiorna',
            icon: <RefreshIcon />,
            color: 'primary' as const,
            onClick: handleRefresh,
            tooltip: 'Aggiorna la lista fornitori',
            active: loading
          },
          {
            label: 'Esporta',
            icon: <DownloadIcon />,
            color: 'success' as const,
            onClick: handleExport,
            tooltip: 'Esporta i fornitori in Excel'
          },
          {
            label: 'Stampa',
            icon: <PrintIcon />,
            color: 'warning' as const,
            onClick: handlePrint,
            tooltip: 'Stampa la lista fornitori'
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
          Lista Fornitori
          {lastUpdate && (
            <span style={{ marginLeft: 16, color: '#888', fontSize: 13 }}>
              Ultimo aggiornamento: {lastUpdate.toLocaleString('it-IT')}
            </span>
          )}
        </Typography>
        
        <TextField
          size="small"
          placeholder="Cerca fornitore, email, P.IVA..."
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
              <TableCell sx={{ fontWeight: 700 }}>Fornitore</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ragione Sociale</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Telefono</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>P.IVA</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Città</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Provincia</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Data Creazione</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFornitori.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm ? 'Nessun fornitore trovato per la ricerca' : 'Nessun fornitore disponibile'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredFornitori.map((f) => (
                <TableRow key={f.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{f.nome}</Typography></TableCell>
                  <TableCell>{f.ragione_sociale || '-'}</TableCell>
                  <TableCell>{f.email || '-'}</TableCell>
                  <TableCell>{f.telefono || '-'}</TableCell>
                  <TableCell>{f.partita_iva || '-'}</TableCell>
                  <TableCell>{f.citta || '-'}</TableCell>
                  <TableCell>{f.provincia || '-'}</TableCell>
                  <TableCell>{f.created_at ? new Date(f.created_at).toLocaleDateString('it-IT') : '-'}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Visualizza dettagli">
                        <IconButton 
                          size="small" 
                          onClick={() => { setSelectedFornitore(f); setShowDetails(true); }}
                          color="info"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Modifica">
                        <IconButton 
                          size="small" 
                          onClick={() => openEditForm(f)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Elimina">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(f)}
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

      {/* Dialog Dettagli */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Dettagli Fornitore</Typography>
            <IconButton onClick={() => setShowDetails(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedFornitore && (
            <Box>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>{selectedFornitore.nome}</Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Ragione Sociale</Typography>
                <Typography variant="body1">{selectedFornitore.ragione_sociale}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedFornitore.email || 'Non specificata'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Telefono</Typography>
                <Typography variant="body1">{selectedFornitore.telefono || 'Non specificato'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Indirizzo</Typography>
                <Typography variant="body1">{selectedFornitore.indirizzo || 'Non specificato'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Città</Typography>
                <Typography variant="body1">{selectedFornitore.citta || 'Non specificata'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">CAP</Typography>
                <Typography variant="body1">{selectedFornitore.cap || 'Non specificato'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Provincia</Typography>
                <Typography variant="body1">{selectedFornitore.provincia || 'Non specificata'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Partita IVA</Typography>
                <Typography variant="body1">{selectedFornitore.partita_iva || 'Non specificata'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Codice Fiscale</Typography>
                <Typography variant="body1">{selectedFornitore.codice_fiscale || 'Non specificato'}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Attivo</Typography>
                <Typography variant="body1">{selectedFornitore.attivo ? 'Sì' : 'No'}</Typography>
              </Box>
              
              {/* Rimuovi note da visualizzazione */}
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Data creazione</Typography>
                <Typography variant="body2">{selectedFornitore.created_at ? new Date(selectedFornitore.created_at).toLocaleString('it-IT') : '-'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Form */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingFornitore ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
            </Typography>
            <IconButton onClick={() => setShowForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField fullWidth label="Nome Fornitore" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
            <TextField fullWidth label="Ragione Sociale" value={formData.ragione_sociale} onChange={e => setFormData({ ...formData, ragione_sociale: e.target.value })} required />
            <TextField fullWidth label="Email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            <TextField fullWidth label="Telefono" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
            <TextField fullWidth label="Partita IVA" value={formData.partita_iva} onChange={e => setFormData({ ...formData, partita_iva: e.target.value })} />
            <TextField fullWidth label="Codice Fiscale" value={formData.codice_fiscale} onChange={e => setFormData({ ...formData, codice_fiscale: e.target.value })} />
            <TextField fullWidth label="Indirizzo" value={formData.indirizzo} onChange={e => setFormData({ ...formData, indirizzo: e.target.value })} sx={{ gridColumn: '1 / -1' }} />
            <TextField fullWidth label="Città" value={formData.citta} onChange={e => setFormData({ ...formData, citta: e.target.value })} />
            <TextField fullWidth label="CAP" value={formData.cap} onChange={e => setFormData({ ...formData, cap: e.target.value })} />
            <TextField fullWidth label="Provincia" value={formData.provincia} onChange={e => setFormData({ ...formData, provincia: e.target.value })} />
            <Box sx={{ display: 'flex', alignItems: 'center', gridColumn: '1 / -1', mt: 1 }}>
              <input type="checkbox" checked={formData.attivo} onChange={e => setFormData({ ...formData, attivo: e.target.checked })} id="attivo" style={{ marginRight: 8 }} />
              <label htmlFor="attivo">Attivo</label>
            </Box>
            {/* Rimuovi note dal form */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>Annulla</Button>
          <Button 
            onClick={editingFornitore ? handleUpdate : handleCreate}
            variant="contained"
            disabled={loading || !formData.nome}
          >
            {loading ? <CircularProgress size={20} /> : (editingFornitore ? 'Aggiorna' : 'Crea')}
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